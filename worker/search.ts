import type { Env } from './types';
import { fetchTimeout } from './utils';

// Bump this whenever search output format changes — stale cached results auto-invalidate.
export const SEARCH_CACHE_VERSION = "v8";

// ALL keyword layers are DEAD (brain-first): no office-holder regex, no
// time-sensitivity word lists, no India detection, no year-appending. The
// MODEL composes the query in English and passes topic:"news"|"general" via
// the search_web tool — this file just searches what it's told, well.

// ————— helpers —————

function domainOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

// Cut at the last sentence end within max chars — never mid-sentence.
function cutAtSentence(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max);
  const lastEnd = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "), slice.lastIndexOf("। "));
  return lastEnd > max * 0.4 ? slice.slice(0, lastEnd + 1).trim() : slice.trim() + "…";
}

interface SearchResult { title: string; content: string; url: string }

// Google-AI-style grounding block: answer line + numbered titled snippets +
// sources. The brain synthesizes ACROSS snippets instead of guessing from one blob.
function formatSnippets(answer: string, results: SearchResult[], maxSnippets: number, perSnippet: number): string {
  const parts: string[] = [];
  if (answer) parts.push(`ANSWER: ${cutAtSentence(answer, 350)}`);
  results.slice(0, maxSnippets).forEach((r, i) => {
    if (!r.content && !r.title) return;
    const dom = domainOf(r.url);
    parts.push(`[${i + 1}] ${r.title}${dom ? ` (${dom})` : ""} — ${cutAtSentence(r.content || "", perSnippet)}`);
  });
  const links = results.slice(0, 3).map(r => r.url).filter(Boolean);
  if (links.length) parts.push(`📎 Sources (share 2-3 so the user can verify):\n` + links.map(u => `🔗 ${u}`).join("\n"));
  return parts.join("\n");
}

// ————— data sources —————

export async function getGoogleNewsRSS(query: string): Promise<string> {
  // Neutral US-English edition; regional focus comes from the query itself
  // (the model already adds the user's country when relevant — brain-first).
  try {
    const res = await fetchTimeout(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`, {}, 4000);
    if (!res || !res.ok) return "";
    const xml = await res.text();
    const items: string[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRegex.exec(xml)) !== null && items.length < 4) {
      const titleMatch = m[1].match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
      if (titleMatch) items.push(titleMatch[1].replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim());
    }
    if (!items.length) return "";
    // Relevance gate: drop the block entirely if no headline touches the query.
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (queryWords.length >= 2 && !items.some(t => queryWords.some(w => t.toLowerCase().includes(w)))) return "";
    return items.map(t => `• ${t}`).join("\n");
  } catch { return ""; }
}

export async function getDuckDuckGoAnswer(query: string): Promise<string> {
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    if (!res.ok) return "";
    const data = await res.json() as any;
    const text = data.AbstractText || data.Answer || "";
    const url = data.AbstractURL || "";
    if (!text) return "";
    return url ? `${text.slice(0, 300)}\n\n🔗 ${url}` : text.slice(0, 300);
  } catch { return ""; }
}

export function getTavilyKeys(env: Env): string[] {
  return [env.TAVILY_API_KEY, env.TAVILY_API_KEY_2, env.TAVILY_API_KEY_3,
    env.TAVILY_API_KEY_4, env.TAVILY_API_KEY_5].filter(Boolean) as string[];
}

export async function tavilySearch(env: Env, body: any, timeoutMs = 8000): Promise<any | null> {
  const keys = getTavilyKeys(env);
  if (!keys.length) return null;
  let ptr = 0;
  try {
    const p = await env.BIZLI_MEMORY.get("tavily_ptr");
    ptr = p ? parseInt(p) : 0;
  } catch {}
  for (let i = 0; i < keys.length; i++) {
    const idx = (ptr + i) % keys.length;
    try {
      // Per-key time cap — a slow Tavily key must not stall the whole reply
      const res = await fetchTimeout("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, api_key: keys[idx] }),
      }, timeoutMs);
      if (!res) continue;
      if (res.status === 401 || res.status === 429 || res.status === 432) continue;
      if (!res.ok) continue;
      await env.BIZLI_MEMORY.put("tavily_ptr", String((idx + 1) % keys.length), { expirationTtl: 30 * 86400 }).catch(() => {});
      return await res.json();
    } catch { continue; }
  }
  return null;
}

// Serper (Google results) — fallback when all Tavily keys fail, mapped into
// the same {answer, results} shape so the output format is identical.
export async function serperSearch(env: Env, query: string, news: boolean): Promise<{ answer: string; results: SearchResult[] } | null> {
  if (!env.SERPER_API_KEY) return null;
  try {
    const res = await fetchTimeout("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": env.SERPER_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 6, ...(news ? { tbs: "qdr:w" } : {}) }),
    }, 6000);
    if (!res || !res.ok) return null;
    const data = await res.json() as any;
    const answer = data.answerBox?.answer || data.answerBox?.snippet || data.knowledgeGraph?.description || "";
    const results: SearchResult[] = (Array.isArray(data.organic) ? data.organic : []).map((r: any) => ({
      title: r.title || "", content: r.snippet || "", url: r.link || "",
    }));
    return (answer || results.length) ? { answer, results } : null;
  } catch { return null; }
}

export async function readUrl(url: string): Promise<string> {
  try {
    if (!url.startsWith("http")) return "";
    const blocked = ["torrent", "pirate", "warez", "crack", "ftp.", "porn", "adult"];
    if (blocked.some(b => url.toLowerCase().includes(b))) return "";
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    const res = await fetchTimeout(url, { headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml" } }, 6000);
    if (!res || !res.ok) return "";
    const finalUrl = res.url;
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);
    if (text.length < 80) return "";
    return finalUrl !== url ? `[Redirected to: ${finalUrl}]\n\n${text}` : text;
  } catch { return ""; }
}

// ————— the search pipeline —————

interface SearchOpts { depth: "basic" | "advanced"; maxResults: number; news: boolean; maxSnippets: number; perSnippet: number; timeoutMs: number }

async function runSearch(env: Env, query: string, opts: SearchOpts): Promise<string> {
  // News headlines fetched in parallel (never sequential — latency matters)
  const newsPromise = opts.news ? getGoogleNewsRSS(query) : Promise.resolve("");
  let answer = "";
  let results: SearchResult[] = [];
  const tv = await tavilySearch(env, {
    query,
    max_results: opts.maxResults,
    search_depth: opts.depth,
    include_answer: true,
    ...(opts.news ? { topic: "news" } : {}),
  }, opts.timeoutMs);
  if (tv) {
    answer = tv.answer || "";
    results = (Array.isArray(tv.results) ? tv.results : []).map((r: any) => ({
      title: r.title || "", content: r.content || "", url: r.url || "",
    }));
  } else {
    const sp = await serperSearch(env, query, opts.news);
    if (sp) { answer = sp.answer; results = sp.results; }
  }
  const newsBlock = await newsPromise;
  // This forcing header is load-bearing: without it models answer officeholder/
  // current-fact questions from stale training memory even WITH results in hand.
  const forcing = `⚡ LIVE WEB RESULTS (fetched right now) — these BEAT your training memory, which is months old. Answer ONLY from what's below. If they name a different president/CM/winner/price than you remember, the results are RIGHT and your memory is WRONG:\n`;
  if (!answer && !results.length) {
    // Last resort only — DDG abstracts are entity-guesses, never let them lead
    const ddg = newsBlock ? "" : await getDuckDuckGoAnswer(query);
    if (ddg) return ddg;
    return newsBlock ? `${forcing}${newsBlock}` : "";
  }
  const header = newsBlock ? `LIVE HEADLINES:\n${newsBlock}\n\n` : "";
  return (forcing + header + formatSnippets(answer, results, opts.maxSnippets, opts.perSnippet)).trim();
}

// Chat mode — called by the search_web tool. The model decides WHEN to search
// and passes topic ("news" for current events). Fast: basic depth, 6s cap.
export async function searchWeb(env: Env, query: string, topic?: string): Promise<string> {
  const news = topic === "news";
  const cacheKey = `search_cache_${SEARCH_CACHE_VERSION}_${news ? "n" : "g"}_${query.toLowerCase().trim().replace(/\s+/g, "_").slice(0, 90)}`;
  const cached = await env.BIZLI_MEMORY.get(cacheKey);
  if (cached) return cached;
  const result = await runSearch(env, query, {
    depth: "basic", maxResults: 5, news, maxSnippets: 4, perSnippet: 280, timeoutMs: 6000,
  });
  if (result) {
    await env.BIZLI_MEMORY.put(cacheKey, result, { expirationTtl: news ? 600 : 3600 }).catch(() => {});
  }
  return result;
}

// Deep mode — the !search command. Real Google-style research material:
// advanced depth, 8 results, ~4k chars of substance. Own cache, never shares
// the shallow chat blobs.
export async function searchWebDeep(env: Env, query: string): Promise<string> {
  const cacheKey = `searchd_cache_${SEARCH_CACHE_VERSION}_${query.toLowerCase().trim().replace(/\s+/g, "_").slice(0, 90)}`;
  const cached = await env.BIZLI_MEMORY.get(cacheKey);
  if (cached) return cached;
  const result = await runSearch(env, query, {
    depth: "advanced", maxResults: 8, news: true, maxSnippets: 8, perSnippet: 450, timeoutMs: 8000,
  });
  if (result) {
    await env.BIZLI_MEMORY.put(cacheKey, result, { expirationTtl: 900 }).catch(() => {});
  }
  return result;
}
