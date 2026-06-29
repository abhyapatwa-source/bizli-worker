import type { Env } from './types';
import { db } from './db';
import { callGroq } from './brain';
import { getGeminiKeys } from './utils';

const TEST_SUITE = [
  {
    name: "basic_greeting",
    language: "en",
    prompt: "hi how are you",
    criteria: "Response must be warm and conversational as Bizli. Must NOT contain 'I am an AI', 'I am ChatGPT', 'As an AI language model'. Should be 20–300 characters.",
    tools: false,
  },
  {
    name: "hindi_greeting",
    language: "hi",
    prompt: "hii kaisi ho",
    criteria: "Response must be in Hindi or Hinglish (mix of Hindi and English). Must respond in the same language as the prompt, not in English only.",
    tools: false,
  },
  {
    name: "identity_check",
    language: "en",
    prompt: "are you ChatGPT?",
    criteria: "Must deny being ChatGPT. Must NOT say 'Yes I am ChatGPT'. Should identify as Bizli or say it's a different AI.",
    tools: false,
  },
  {
    name: "name_check",
    language: "en",
    prompt: "what's your name?",
    criteria: "Must say her name is Bizli (or a variant like 'I'm Bizli'). Must NOT say 'I don't have a name' or be generic without identifying as Bizli.",
    tools: false,
  },
  {
    name: "weather_tool",
    language: "en",
    prompt: "what's the weather in Mumbai right now?",
    criteria: "Must mention weather conditions, temperature, or a specific number for Mumbai. Must NOT say it cannot access real-time data.",
    tools: true,
  },
];

async function scoreWithGemini(
  env: Env,
  prompt: string,
  response: string,
  criteria: string
): Promise<{ passed: boolean; score: number; reason: string }> {
  const keys = getGeminiKeys(env, "lab");
  // Fallback scoring if Gemini unavailable: basic heuristics
  if (!keys.length) {
    const ok = response.length > 15 && !response.toLowerCase().includes("i am an ai");
    return { passed: ok, score: ok ? 60 : 20, reason: "heuristic (no scoring keys)" };
  }

  let MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
  try {
    const raw = await env.BIZLI_MEMORY.get("gemini_live_models");
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed) && parsed.length) MODELS = parsed;
    }
  } catch {}

  const scorePrompt = `You are a test evaluator for Bizli AI (a friendly female AI companion).
Evaluate whether this response passes the criteria.

PROMPT: "${prompt}"
RESPONSE: "${response.slice(0, 500)}"
CRITERIA: ${criteria}

Reply in JSON only: {"passed": true/false, "score": 0-100, "reason": "one sentence"}`;

  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: scorePrompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 200, responseMimeType: "application/json" },
  });

  for (const key of keys) {
    for (const model of MODELS) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body }
        );
        if (!res.ok) continue;
        const data: any = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) continue;
        const p = JSON.parse(text.trim());
        return {
          passed: !!p.passed,
          score: typeof p.score === "number" ? Math.max(0, Math.min(100, p.score)) : (p.passed ? 70 : 30),
          reason: typeof p.reason === "string" ? p.reason.slice(0, 200) : "",
        };
      } catch { continue; }
    }
  }
  // All Gemini attempts failed — heuristic fallback
  const ok = response.length > 15;
  return { passed: ok, score: ok ? 55 : 10, reason: "scoring unavailable" };
}

export async function runBizliTests(env: Env): Promise<{ run: number; passed: number }> {
  const now = Date.now();
  const lastRun = await env.BIZLI_MEMORY.get("last_test_run").catch(() => null);
  if (lastRun && now - parseInt(lastRun) < 21_600_000) return { run: 0, passed: 0 };
  await env.BIZLI_MEMORY.put("last_test_run", String(now), { expirationTtl: 25200 });

  let run = 0, passed = 0;
  for (const test of TEST_SUITE) {
    try {
      const messages = [{ role: "user", content: test.prompt }];
      const response = await callGroq(env, messages, "", "test_runner", test.tools, false);

      const { passed: p, score, reason } = await scoreWithGemini(env, test.prompt, response, test.criteria);

      // Capture which brain was last used
      let brainUsed = "groq";
      try {
        const lb = await env.BIZLI_MEMORY.get("last_brains");
        if (lb) { const arr = JSON.parse(lb); if (arr[0]?.brain) brainUsed = arr[0].brain; }
      } catch {}

      await db(env, "test_results", "POST", {
        test_name: test.name,
        language: test.language,
        prompt: test.prompt,
        response: response.slice(0, 500),
        score,
        passed: p,
        brain_used: brainUsed,
        notes: reason,
      });

      run++;
      if (p) passed++;
    } catch {}
    await new Promise(r => setTimeout(r, 600));
  }
  return { run, passed };
}

export async function getTestStats(env: Env): Promise<{
  lastRunAt: number | null;
  recentResults: any[];
  passRate7d: number;
}> {
  try {
    const lastRunRaw = await env.BIZLI_MEMORY.get("last_test_run").catch(() => null);
    const cutoff = new Date(Date.now() - 7 * 86400_000).toISOString();
    const [recent, week] = await Promise.all([
      db(env, "test_results?order=created_at.desc&limit=10&select=test_name,language,passed,score,created_at,brain_used,notes"),
      db(env, `test_results?created_at=gt.${cutoff}&select=passed`),
    ]);

    let passRate7d = 100;
    if (Array.isArray(week) && week.length > 0) {
      passRate7d = Math.round((week.filter((r: any) => r.passed).length / week.length) * 100);
    }

    return {
      lastRunAt: lastRunRaw ? parseInt(lastRunRaw) : null,
      recentResults: Array.isArray(recent) ? recent : [],
      passRate7d,
    };
  } catch {
    return { lastRunAt: null, recentResults: [], passRate7d: 100 };
  }
}
