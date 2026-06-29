import type { Env } from './types';
import { getGeminiKeys } from './utils';
import { recordQuotaEvents, QuotaEvent } from './quota';
import { db } from './db';

const LAB_CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const LAB_SYSTEM = `You are Bizli's Lab Agent — an AI engineer monitoring system health. Read-only access to keys, errors, version, stats. Help Abhya diagnose issues and suggest fixes in plain English. Cannot execute code changes. No emojis. Be precise and warm.

IMPORTANT: Respond ONLY in valid JSON with exactly two fields:
- "reply": your full response text (string)
- "importance": float 0.0–1.0 rating how worth retaining this exchange is:
    0.8–1.0: bug root cause found, architectural decision, critical system insight
    0.5–0.7: useful diagnostic observation, worth remembering for context
    0.2–0.4: routine status check, minor or temporary info
    0.0–0.2: casual greeting, already-known info, trivial exchange`;

function sanitizeDashboardData(data: any): any {
  if (!data) return data;
  if (Array.isArray(data.recentErrors)) {
    data = {
      ...data,
      recentErrors: data.recentErrors.map((e: any) => ({
        timestamp: e.timestamp,
        detail: e.detail
          ? e.detail.replace(/chat=[^:]+:\s*/g, "").slice(0, 200)
          : "",
      })),
    };
  }
  if (data.messages?.perUser) {
    data = {
      ...data,
      messages: {
        ...data.messages,
        perUser: data.messages.perUser.map((u: any) => ({
          count: u.count,
          lastOnlineIST: u.lastOnlineIST,
        })),
      },
    };
  }
  return data;
}

async function fetchLabMemories(env: Env): Promise<string> {
  try {
    const rows = await db(env, "lab_memory?order=importance.desc&limit=12&select=role,content,created_at");
    if (!Array.isArray(rows) || !rows.length) return "";
    const lines = rows.map((r: any) => {
      const date = r.created_at ? r.created_at.slice(0, 10) : "";
      const speaker = r.role === "user" ? "Abhya" : "Lab";
      return `[${date}] ${speaker}: ${(r.content || "").slice(0, 350)}`;
    });
    return `\n\n[LAB MEMORY — important past exchanges]\n${lines.join("\n")}`;
  } catch { return ""; }
}

async function saveLabMemory(env: Env, role: string, content: string, importance: number): Promise<void> {
  try {
    const result = await db(env, "lab_memory", "POST", {
      role,
      content: content.slice(0, 800),
      importance: Math.max(0, Math.min(1, importance)),
    });
    if (Array.isArray(result) && result[0]?.id) {
      const overflow = await db(env, "lab_memory?select=id&order=importance.asc&limit=50&offset=200");
      if (Array.isArray(overflow) && overflow.length) {
        const ids = overflow.map((r: any) => r.id).join(",");
        await db(env, `lab_memory?id=in.(${ids})`, "DELETE");
      }
    }
  } catch {}
}

function trimDashboardData(data: any): any {
  if (!data) return data;
  const out: any = { ...data };
  // Trim perUser list — lab agent doesn't need all users
  if (out.messages?.perUser) out.messages = { ...out.messages, perUser: out.messages.perUser.slice(0, 5) };
  // Trim lastBrains — last 5 is enough
  if (Array.isArray(out.lastBrains)) out.lastBrains = out.lastBrains.slice(0, 5);
  // Trim recentErrors — last 10 is enough
  if (Array.isArray(out.recentErrors)) out.recentErrors = out.recentErrors.slice(0, 10);
  // Remove test results detail — summary only
  if (out.tests?.recentResults) out.tests = { ...out.tests, recentResults: out.tests.recentResults.slice(0, 5) };
  return out;
}

export async function callLabAgent(
  env: Env,
  messages: { role: string; content: string }[],
  dashboardData: any
): Promise<{ reply: string; importance: number }> {
  const keys = getGeminiKeys(env, "lab");
  if (!keys.length) return { reply: "No Gemini keys configured — Lab Agent unavailable.", importance: 0 };

  const safeData = trimDashboardData(sanitizeDashboardData(JSON.parse(JSON.stringify(dashboardData))));

  // Parallelize memory fetch + KV read — don't do them sequentially
  const [memories, kvModelsRaw] = await Promise.all([
    fetchLabMemories(env),
    env.BIZLI_MEMORY.get("gemini_live_models"),
  ]);

  const systemWithData = `${LAB_SYSTEM}${memories}\n\n[CURRENT SYSTEM SNAPSHOT]\n${JSON.stringify(safeData)}`;

  const geminiMessages = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // 2.0-flash first — much faster than 2.5-flash for lab queries; 2.5 as fallback
  let GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash"];
  try {
    if (kvModelsRaw) {
      const parsed = JSON.parse(kvModelsRaw) as string[];
      if (Array.isArray(parsed) && parsed.length) {
        // Put fastest model first — prefer 2.0-flash over 2.5-flash
        GEMINI_MODELS = [...parsed].sort((a, b) => {
          const score = (m: string) => m.includes("2.0") ? 0 : m.includes("1.5") ? 1 : 2;
          return score(a) - score(b);
        });
      }
    }
  } catch {}

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: systemWithData }] },
    contents: geminiMessages,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 800,
      responseMimeType: "application/json",
    },
  });

  const quotaEvents: QuotaEvent[] = [];
  let lastError = "";
  for (let ki = 0; ki < keys.length; ki++) {
    const key = keys[ki];
    for (const model of GEMINI_MODELS) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 18000);
        let res: Response;
        try {
          res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: ctrl.signal }
          );
        } finally {
          clearTimeout(timer);
        }
        if (!res.ok) {
          const err = await res.text();
          lastError = `Gemini ${model} ${res.status}: ${err.slice(0, 200)}`;
          quotaEvents.push({ keyIndex: ki, model, result: res.status === 429 ? "fail_429" : "fail_other" });
          continue;
        }
        const data: any = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          quotaEvents.push({ keyIndex: ki, model, result: "ok" });
          await recordQuotaEvents(env, quotaEvents);
          try {
            const parsed = JSON.parse(text.trim());
            const reply = typeof parsed.reply === "string" ? parsed.reply : text;
            const importance = typeof parsed.importance === "number" ? parsed.importance : 0.5;
            return { reply: reply.trim(), importance };
          } catch {
            return { reply: text.trim(), importance: 0.5 };
          }
        }
        lastError = `Empty response from ${model}`;
        quotaEvents.push({ keyIndex: ki, model, result: "fail_other" });
      } catch (e: any) {
        lastError = e?.message || String(e);
        quotaEvents.push({ keyIndex: ki, model, result: "fail_other" });
      }
    }
  }
  await recordQuotaEvents(env, quotaEvents);
  return { reply: `Lab Agent error: ${lastError}`, importance: 0 };
}

export async function handleLabAgent(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: LAB_CORS });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400, headers: LAB_CORS });
  }

  const key: string = body?.key || "";
  if (!env.ADMIN_PASSWORD || key !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: LAB_CORS });
  }

  const messages: { role: string; content: string }[] = Array.isArray(body?.messages) ? body.messages : [];
  if (!messages.length) {
    return new Response(JSON.stringify({ error: "messages required" }), { status: 400, headers: LAB_CORS });
  }

  const dashboardData: any = body?.dashboardData ?? {};
  const { reply, importance } = await callLabAgent(env, messages, dashboardData);

  // Save last user message + assistant reply to the Supabase vault
  if (importance > 0.15 && !reply.startsWith("Lab Agent error:")) {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (lastUser) {
      await Promise.all([
        saveLabMemory(env, "user", lastUser.content, importance),
        saveLabMemory(env, "assistant", reply, importance),
      ]);
    }
  }

  return new Response(JSON.stringify({ reply }), { status: 200, headers: LAB_CORS });
}
