import type { Env } from './types';
import { getGeminiKeys } from './utils';
import { recordQuotaEvents, QuotaEvent } from './quota';

const LAB_CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const LAB_SYSTEM = `You are Bizli's Lab Agent — an AI engineer monitoring system health. Read-only access to keys, errors, version, stats. Help Abhya diagnose issues and suggest fixes in plain English. Cannot execute code changes. No emojis. Be precise and warm.`;

function sanitizeDashboardData(data: any): any {
  if (!data) return data;
  // Strip user message content from error details — keep timestamp and error type only
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
  // Remove per-user names/codes from the payload — keep counts only
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

export async function callLabAgent(
  env: Env,
  messages: { role: string; content: string }[],
  dashboardData: any
): Promise<string> {
  const keys = getGeminiKeys(env, "lab");
  if (!keys.length) return "No Gemini keys configured — Lab Agent unavailable.";

  const safeData = sanitizeDashboardData(JSON.parse(JSON.stringify(dashboardData)));
  const systemWithData = `${LAB_SYSTEM}\n\n[CURRENT SYSTEM SNAPSHOT]\n${JSON.stringify(safeData, null, 2)}`;

  const geminiMessages = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: systemWithData }] },
    contents: geminiMessages,
    generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
  });

  const quotaEvents: QuotaEvent[] = [];
  let lastError = "";
  for (let ki = 0; ki < keys.length; ki++) {
    const key = keys[ki];
    for (const model of GEMINI_MODELS) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body }
        );
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
          return text.trim();
        }
        lastError = `Empty response from ${model}`;
        quotaEvents.push({ keyIndex: ki, model, result: "fail_other" });
        continue;
      } catch (e: any) {
        lastError = e?.message || String(e);
        quotaEvents.push({ keyIndex: ki, model, result: "fail_other" });
        continue;
      }
    }
  }
  await recordQuotaEvents(env, quotaEvents);
  return `Lab Agent error: ${lastError}`;
}

export async function handleLabAgent(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: LAB_CORS });
  }

  // Auth — same pattern as /admin/stats (key in JSON body for POST)
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

  const reply = await callLabAgent(env, messages, dashboardData);
  return new Response(JSON.stringify({ reply }), { status: 200, headers: LAB_CORS });
}
