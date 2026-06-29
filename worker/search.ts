import type { Env } from './types';
import { fetchTimeout, getGroqKeys, titleCase } from './utils';

export const OFFICE_MAP: Record<string, string> = {
  "chief minister": "Chief Minister", "cm": "Chief Minister", "mukhyamantri": "Chief Minister",
  "prime minister": "Prime Minister", "pm": "Prime Minister", "pradhanmantri": "Prime Minister",
  "president": "President", "governor": "Governor", "mayor": "Mayor",
};

// Bump this whenever search output format changes — stale cached results auto-invalidate.
export const SEARCH_CACHE_VERSION = "v6";

export function cleanSearchQuery(text: string): string {
  let q = text.toLowerCase()
    .replace(/\b(what|whats|what's|who|whom|whose|where|when|why|how|is|are|was|were|the|of|a|an|do|does|did|can|could|would|should|tell|me|please|about|some|any|there|here|that|this|to|for|in|on|at|i|you|he|she|it|we|they|my|your|recently|currently)\b/gi, " ")
    .replace(/\b(kya|kaun|kahan|kab|kyun|kaise|hai|ho|tha|the|thi|ka|ki|ke|ko|me|mein|aur|abhi|bata|batao|mujhe|mera|meri|tum|aap|wala|wali|hua|hui|raha|rahi)\b/gi, " ")
    .replace(/[?!.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (q.split(" ").filter(Boolean).length < 1) return text;
  return q;
}

export async function extractSearchQuery(env: Env, text: string): Promise<string> {
  try {
    const keys = getGroqKeys(env);
    if (!keys.length) return cleanSearchQuery(text);
    const res = await fetchTimeout("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${keys[0]}` },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: "You convert a user's question (in ANY language) into a short web-search query of 2-6 keywords. Translate non-English to English keywords. Output ONLY the search query, nothing else, no quotes." },
          { role: "user", content: text.slice(0, 300) },
        ],
        max_tokens: 30,
        temperature: 0,
      }),
    }, 3000);
    if (!res || !res.ok) return cleanSearchQuery(text);
    const data = await res.json() as any;
    const q = data?.choices?.[0]?.message?.content?.trim()?.replace(/^["']|["']$/g, "");
    return (q && q.length > 1) ? q : cleanSearchQuery(text);
  } catch { return cleanSearchQuery(text); }
}

export function extractOfficeQuery(query: string): { office: string; region: string } | null {
  const q = query.toLowerCase().replace(/\b(current|currently|present|now|abhi|ka|ki|ke|kaun|kon|hai|h|is|the|who)\b/gi, " ").replace(/\s+/g, " ").trim();
  for (const [key, office] of Object.entries(OFFICE_MAP)) {
    let m = q.match(new RegExp(`\\b${key}\\b\\s*(?:of|in)?\\s+([a-z\\s]+?)(?:\\?|$|,|\\.)`, "i"));
    if (m && m[1].trim().length > 1) return { office, region: m[1].trim() };
    m = q.match(new RegExp(`([a-z\\s]+?)\\s+${key}\\b`, "i"));
    if (m && m[1].trim().length > 1) return { office, region: m[1].trim() };
  }
  return null;
}

export function needsLiveSearch(text: string): boolean {
  const t = text.toLowerCase().trim();
  if (t.length < 4) return false;

  // Tool-handled — never pre-search
  if (/\b(weather|temperature|kitni garmi|kitni sardi|baarish|barish)\b/i.test(t)) return false;
  if (/\b(time in|what time|current time|time zone)\b/i.test(t)) return false;
  if (/\b(exchange rate|convert currency|usd|eur|gbp|inr to|rupee to|dollar to)\b/i.test(t)) return false;
  if (/\b(bitcoin price|crypto price|ethereum price|btc price|eth price)\b/i.test(t)) return false;

  // Casual / identity / creative — never need live data
  if (/^(hi+|hey+|hello+|sup|yo|hola|namaste|namaskar|salaam|salam|ola|ciao|hii+|heyy+|heya)\b/i.test(t)) return false;
  if (/\b(kya hal|kaise ho|kaisi ho|kaise hain|kaisa hai|how are you|how r u|u ok|how's it going)\b/i.test(t)) return false;
  if (/\b(good morning|good night|goodnight|good evening|good afternoon|subah|shaam|raat ko)\b/i.test(t)) return false;
  if (/\b(who are you|what are you|are you (a |an )?(bot|ai|robot|human|girl|boy|real)|tum kaun|tu kaun|tum kya ho|kya tum (ho|hain)|are you real)\b/i.test(t)) return false;
  if (/\b(tu ladki|tu ladka|tum ladki|tum ladka|ladka hai|ladki hai|gender|male or female|boy or girl)\b/i.test(t)) return false;
  if (/\b(tell me (a |about a )?(joke|story|poem|shayari|riddle)|make me (laugh|smile)|suna (joke|kahani|shayari)|ek joke|ek poem)\b/i.test(t)) return false;
  if (/\b(write (me|a|an|something)|generate (a|an)|create (a|an)|make (a|an)|compose|draft)\b/i.test(t)) return false;
  if (/\b(should i|kya mujhe|kya main|advise me|what do you think about|what would you do|your opinion|tumhara opinion|meri help karo)\b/i.test(t)) return false;
  if (/\b(recipe|how to (cook|make|prepare|bake)|ingredients for|kaise banaye|kaise banta hai)\b/i.test(t)) return false;
  if (/\b(relationship|breakup|girlfriend|boyfriend|pyar|mohabbat|marriage|shaadi|love advice)\b/i.test(t)) return false;
  if (/^[\d\s+\-*/^().%=]+$/.test(t)) return false; // pure math
  if (/\b(calculate|solve|what is \d|kitna hoga|total of|sum of|percentage of)\b/i.test(t)) return false;
  if (/\b(explain|define|what does .* mean|meaning of|matlab kya|samjhao|bata do|difference between)\b/i.test(t)) return false;

  // Office holders — always search
  if (extractOfficeQuery(text)) return true;

  // Hard YES — clearly needs current/live data
  if (/\b(latest news|breaking news|aaj ki khabar|today's news|abhi kya ho raha|live update)\b/i.test(t)) return true;
  if (/\b(who won|kaun jeeta|winner|election result|match result|live score|ipl score|world cup)\b/i.test(t)) return true;
  if (/\b(stock price|share price|nifty|sensex|nasdaq|dow jones|market today)\b/i.test(t)) return true;
  if (/\b(new (movie|film|show|series|season|album|song) (out|released|launched|dropped))\b/i.test(t)) return true;
  if (/\b(release date|launch date|kab aayega|kab release|kab aata hai).*(movie|film|show|game|phone|iphone|samsung)\b/i.test(t)) return true;
  if (/\b(current|latest|abhi|aajkal|right now|2025|2026).*(price|rate|value|news|update|status|result)\b/i.test(t)) return true;
  if (/\b(price|rate|value|news|update|status|result).*(current|latest|abhi|today|aaj|2025|2026)\b/i.test(t)) return true;

  // Default: no search — trust tools + Groq's knowledge
  return false;
}

export async function getGoogleNewsRSS(query: string): Promise<string> {
  try {
    const res = await fetchTimeout(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`, {}, 4000);
    if (!res || !res.ok) return "";
    const xml = await res.text();
    const items: { title: string; link: string }[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRegex.exec(xml)) !== null && items.length < 4) {
      const block = m[1];
      const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
      const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
      if (titleMatch) {
        items.push({
          title: titleMatch[1].replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim(),
          link: linkMatch ? linkMatch[1].trim() : "",
        });
      }
    }
    if (!items.length) return "";
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (queryWords.length >= 2) {
      const anyMatch = items.some(i => queryWords.some(w => i.title.toLowerCase().includes(w)));
      if (!anyMatch) return "";
    }
    return items.map(i => `• ${i.title}`).join("\n");
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

export async function tavilySearch(env: Env, body: any): Promise<any | null> {
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
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, api_key: keys[idx] }),
      });
      if (res.status === 401 || res.status === 429 || res.status === 432) continue;
      if (!res.ok) continue;
      await env.BIZLI_MEMORY.put("tavily_ptr", String((idx + 1) % keys.length), { expirationTtl: 30 * 86400 }).catch(() => {});
      return await res.json();
    } catch { continue; }
  }
  return null;
}

export async function getWikiSummary(title: string): Promise<{ extract: string; url: string } | null> {
  const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(title)}&format=json&origin=*`);
    if (res.ok) {
      const data = await res.json() as any;
      const pages = data?.query?.pages;
      const page = pages ? Object.values(pages)[0] as any : null;
      if (page?.extract) return { extract: page.extract, url };
    }
  } catch {}
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!res.ok) return null;
    const data = await res.json() as any;
    if (!data.extract) return null;
    return { extract: data.extract, url: data.content_urls?.desktop?.page || url };
  } catch { return null; }
}

export async function getInfoboxIncumbent(positionTitle: string): Promise<{ name: string; url: string } | null> {
  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(positionTitle)}&prop=wikitext&section=0&format=json&origin=*`);
    if (!res.ok) return null;
    const data = await res.json() as any;
    const wikitext: string = data?.parse?.wikitext?.["*"] || "";
    if (!wikitext) return null;
    const patterns = [
      /\|\s*incumbent\s*=\s*([^\n|]+)/i,
      /\|\s*holder\s*=\s*([^\n|]+)/i,
      /\|\s*office_?holder\s*=\s*([^\n|]+)/i,
    ];
    for (const p of patterns) {
      const m = wikitext.match(p);
      if (m && m[1]) {
        let name = m[1].trim()
          .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, "$2")
          .replace(/\{\{[^}]+\}\}/g, "")
          .replace(/<[^>]+>/g, "")
          .replace(/'''?/g, "")
          .trim();
        if (name && name.length > 2 && name.length < 60 && !/^(vacant|none|tbd)$/i.test(name)) {
          return { name, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}` };
        }
      }
    }
    return null;
  } catch { return null; }
}

export async function getOfficeHolderWikidata(positionLabel: string): Promise<{ name: string; url: string } | null> {
  try {
    const sparql = `
SELECT ?officeholderLabel ?officeholder WHERE {
  ?position rdfs:label "${positionLabel}"@en.
  ?position wdt:P1308 ?officeholder.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
    const res = await fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`, {
      headers: { "Accept": "application/sparql-results+json", "User-Agent": "BizliAI/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    const binding = data?.results?.bindings?.[0];
    if (!binding) return null;
    const name = binding.officeholderLabel?.value;
    const qid = binding.officeholder?.value?.split("/").pop();
    if (!name) return null;
    return { name, url: qid ? `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}` : "" };
  } catch { return null; }
}

export async function getWikidataOfficeholder(positionTitle: string): Promise<{ name: string; positionUrl: string } | null> {
  try {
    const searchRes = await fetch(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(positionTitle)}&language=en&format=json&limit=1&type=item`);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json() as any;
    const positionId = searchData.search?.[0]?.id;
    if (!positionId) return null;
    const entityRes = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${positionId}&props=claims&format=json`);
    if (!entityRes.ok) return null;
    const entityData = await entityRes.json() as any;
    const claims = entityData.entities?.[positionId]?.claims?.P1308;
    if (!claims?.length) return null;
    const current = claims.find((c: any) => !c.qualifiers?.P582) || claims[0];
    const personId = current?.mainsnak?.datavalue?.value?.id;
    if (!personId) return null;
    const personRes = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${personId}&props=labels&languages=en&format=json`);
    if (!personRes.ok) return null;
    const personData = await personRes.json() as any;
    const name = personData.entities?.[personId]?.labels?.en?.value;
    if (!name) return null;
    return { name, positionUrl: `https://www.wikidata.org/wiki/${positionId}` };
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

export async function searchWebUncached(env: Env, query: string): Promise<string> {
  const office = extractOfficeQuery(query);
  if (office) {
    const title = office.office === "Prime Minister" && /\bindia\b/i.test(office.region)
      ? "Prime Minister of India"
      : `${office.office} of ${titleCase(office.region)}`;
    const officeNews = await getGoogleNewsRSS(`${title} latest`);
    if (officeNews) {
      return `⚡ CURRENT — answer the user based ONLY on THESE live news headlines, NOT on your training memory. If they name a new office-holder, that person IS the current one right now:\n${officeNews}`;
    }
  }
  const isTimeSensitive = /\b(current|currently|latest|now|abhi|today|recent|2025|2026)\b/i.test(query);
  if (!isTimeSensitive) {
    const ddg = await getDuckDuckGoAnswer(query);
    if (ddg) return ddg;
  }
  let searchQuery = isTimeSensitive && !/202[4-9]/.test(query) ? `${query} 2026` : query;
  const looksIndian = /\b(india|indian|bharat|kolkata|mumbai|delhi|bengal|chennai|bangalore|hyderabad|pune|hindi|rupee|inr)\b/i.test(query) ||
    /\b(nahi|hai|kya|abhi|mera|meri|kaha|kahan)\b/i.test(query);
  if (/\b\d{6}\b/.test(query) && looksIndian) searchQuery = `${searchQuery} India`;
  try {
    const [news, data] = await Promise.all([
      isTimeSensitive ? getGoogleNewsRSS(query) : Promise.resolve(""),
      tavilySearch(env, {
        query: searchQuery,
        max_results: isTimeSensitive ? 5 : 3,
        search_depth: isTimeSensitive ? "advanced" : "basic",
        include_answer: true,
      }),
    ]);
    const newsBlock = news ? `⚡ CURRENT — base your answer on THESE live news headlines, NOT on your training memory (which is outdated). Report what these say is happening now:\n${news}\n\n` : "";
    if (!data) return newsBlock.trim();
    const answer = data.answer || data.results?.[0]?.content || "";
    const short = answer.slice(0, 300);
    const results = Array.isArray(data.results) ? data.results : [];
    const sourceLinks = results.slice(0, 3).map((r: any) => r.url).filter(Boolean);
    let sourcesBlock = "";
    if (sourceLinks.length) {
      sourcesBlock = "\n\n📎 Sources (share 2-3 of these so the user can verify):\n" +
        sourceLinks.map((u: string) => `🔗 ${u}`).join("\n");
    }
    return (newsBlock + `${short}${sourcesBlock}`).trim();
  } catch { return ""; }
}

export async function searchWeb(env: Env, query: string): Promise<string> {
  const isTimeSensitive = /\b(current|currently|latest|now|abhi|today|recent|live|score)\b/i.test(query);
  const isOfficeHolder = /\b(cm|chief minister|pm|prime minister|president|governor|mayor|mukhyamantri)\b/i.test(query);
  const cacheKey = `search_cache_${SEARCH_CACHE_VERSION}_${query.toLowerCase().trim().replace(/\s+/g, "_").slice(0, 90)}`;
  const cached = await env.BIZLI_MEMORY.get(cacheKey);
  if (cached) return cached;
  const result = await searchWebUncached(env, query);
  if (result) {
    const ttl = isOfficeHolder ? 300 : isTimeSensitive ? 900 : 3600;
    await env.BIZLI_MEMORY.put(cacheKey, result, { expirationTtl: ttl }).catch(() => {});
  }
  return result;
}
