import type { Env } from './types';

const QUOTA_TTL = 7 * 24 * 3600;
const CORS = { "Content-Type": "application/json", "Cache-Control": "no-store" };

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export type QuotaEvent = {
  keyIndex: number;
  model: string;
  result: "ok" | "fail_429" | "fail_other";
};

export async function recordQuotaEvents(env: Env, events: QuotaEvent[]): Promise<void> {
  if (!events.length) return;
  const kkey = `lab_quota_${todayUTC()}`;
  const raw = await env.BIZLI_MEMORY.get(kkey);
  const data: Record<string, { ok: number; fail_429: number; fail_other: number }> =
    raw ? JSON.parse(raw) : {};
  for (const ev of events) {
    const slot = `${ev.keyIndex}_${ev.model}`;
    if (!data[slot]) data[slot] = { ok: 0, fail_429: 0, fail_other: 0 };
    data[slot][ev.result]++;
  }
  await env.BIZLI_MEMORY.put(kkey, JSON.stringify(data), { expirationTtl: QUOTA_TTL });
}

export async function handleLabQuota(request: Request, env: Env): Promise<Response> {
  const key = new URL(request.url).searchParams.get("key") || "";
  if (!env.ADMIN_PASSWORD || key !== env.ADMIN_PASSWORD)
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: CORS });

  const raw = await env.BIZLI_MEMORY.get(`lab_quota_${todayUTC()}`);
  const data: Record<string, { ok: number; fail_429: number; fail_other: number }> =
    raw ? JSON.parse(raw) : {};

  const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  const keysConfigured = [
    env.GEMINI_API_KEY, env.GEMINI_API_KEY_2, env.GEMINI_API_KEY_3,
    env.GEMINI_API_KEY_4, env.GEMINI_API_KEY_5,
  ].filter(Boolean).length;

  let totalCalls = 0, totalSuccessful = 0, total429 = 0;
  const exhaustedKeyModels: string[] = [];
  for (const [slot, c] of Object.entries(data)) {
    totalCalls += c.ok + c.fail_429 + c.fail_other;
    totalSuccessful += c.ok;
    total429 += c.fail_429;
    if (c.fail_429 > 0 && c.ok === 0) exhaustedKeyModels.push(slot);
  }

  return new Response(JSON.stringify({
    date: todayUTC(),
    gemini: { keysConfigured, models: MODELS, totalCalls, totalSuccessful, total429,
               byKeyModel: data, exhaustedKeyModels },
  }), { headers: CORS });
}
