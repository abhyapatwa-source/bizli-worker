// ============================================================
// BIZLI AI — GEMINI CONNECTION + KEY ROTATION
// core/gemini.ts
// Version: 9.0.0
// ============================================================



// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------
interface GeminiKey {
  value: string;
  requestsThisMinute: number;
  requestsToday: number;
  lastUsed: number;
  coolUntil: number;
  errorCount: number;
  disabled: boolean;
  minuteWindowStart: number;
}

interface Message {
  role: "user" | "model";
  parts: { text: string }[];
}

interface GeminiConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
}

// ------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------
const RPM_LIMIT = 15;           // free tier: 15 requests per minute per key
const RPD_LIMIT = 1500;         // free tier: 1500 requests per day per key
const MIN_GAP_MS = 200;         // minimum 200ms between requests on same key
const QUEUE_DELAY_MS = 8000;    // back-pressure delay when all keys exhausted
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const GEMINI_CONFIG: GeminiConfig = {
  temperature: 1.0,     // natural, varied responses
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 300, // Snapchat-style: short replies only
};

// ------------------------------------------------------------
// KEY POOL
// Loaded from environment variables at startup.
// Add more keys by adding GEMINI_KEY_5, GEMINI_KEY_6, etc.
// ------------------------------------------------------------
// KEY_POOL is now lazy — loaded per request via getKeyPool()
let _keyPool: GeminiKey[] | null = null;

function getKeyPool(): GeminiKey[] {
  if (_keyPool && _keyPool.length > 0) return _keyPool;
  const env = (globalThis as any).__env || {};
  const keys: GeminiKey[] = [];
  let i = 1;
  while (true) {
    const val = env[`GEMINI_KEY_${i}`];
    if (!val) break;
    keys.push({
      value: val,
      requestsThisMinute: 0,
      requestsToday: 0,
      lastUsed: 0,
      coolUntil: 0,
      errorCount: 0,
      disabled: false,
      minuteWindowStart: Date.now(),
    });
    i++;
  }
  if (keys.length === 0) {
    console.warn("[Gemini] No API keys found in env.");
  }
  _keyPool = keys;
  return keys;
}

// ------------------------------------------------------------
// KEY ROTATION — LRU with rate limit awareness
// ------------------------------------------------------------
function resetMinuteWindowIfNeeded(key: GeminiKey): void {
  const now = Date.now();
  if (now - key.minuteWindowStart >= 60_000) {
    key.requestsThisMinute = 0;
    key.minuteWindowStart = now;
  }
}

async function selectKey(keys: GeminiKey[]): Promise<GeminiKey> {
  const now = Date.now();

  for (const key of keys) {
    resetMinuteWindowIfNeeded(key);
  }

  const eligible = keys.filter(k =>
    !k.disabled &&
    k.coolUntil < now &&
    k.requestsThisMinute < RPM_LIMIT &&
    k.requestsToday < RPD_LIMIT &&
    (now - k.lastUsed) > MIN_GAP_MS
  );

  if (eligible.length === 0) {
    // All keys exhausted — silent back-pressure, no error shown to user
    await sleep(QUEUE_DELAY_MS);
    return selectKey(keys); // recursive retry
  }

  // LRU: pick the key used least recently
  return eligible.sort((a, b) => a.lastUsed - b.lastUsed)[0];
}

// PERSONA — loaded lazily on first request
function getSystemPrompt(): string {
  return (globalThis as any).__env?.BIZLI_PERSONA || 
    "You are Bizli. Talk like a real person. Be warm, short, natural.";
}

// ------------------------------------------------------------
// MAIN CALL — callGemini(messages)
// Pass full conversation history as messages array.
// Returns Bizli's reply as a plain string.
// ------------------------------------------------------------
export async function callGemini(messages: Message[]): Promise<string> {
  const key = await selectKey(getKeyPool());

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${key.value}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: getSystemPrompt() }]
        },
        contents: messages,
        generationConfig: GEMINI_CONFIG,
        tools: [{ googleSearch: {} }], // live web search enabled by default
      }),
    });

    // Rate limited — cool this key for 65 seconds, retry with next
    if (response.status === 429) {
      key.coolUntil = Date.now() + 65_000;
      console.warn(`[Gemini] Key rate limited. Cooling for 65s. Retrying...`);
      return callGemini(messages);
    }

    if (!response.ok) {
      throw new Error(`Gemini HTTP ${response.status}: ${await response.text()}`);
    }

    // Update key counters
    key.requestsThisMinute++;
    key.requestsToday++;
    key.lastUsed = Date.now();
    key.errorCount = 0;

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    return enforceSnapchatStyle(text);

  } catch (err) {
    key.errorCount++;
    if (key.errorCount > 3) {
      key.disabled = true;
      console.error(`[Gemini] Key auto-disabled after 3 errors.`);
    }
    console.error(`[Gemini] Error:`, err);
    return callGemini(messages); // self-heal with next available key
  }
}

// ------------------------------------------------------------
// SNAPCHAT STYLE ENFORCER
// Truncates at first natural sentence boundary after 120 chars.
// Keeps Bizli's replies short and conversational.
// ------------------------------------------------------------
function enforceSnapchatStyle(text: string): string {
  const cleaned = text.trim();
  if (cleaned.length <= 120) return cleaned;

  // Find first sentence boundary after 120 chars
  const boundaryMatch = cleaned.slice(120).match(/[.!?]\s/);
  if (boundaryMatch && boundaryMatch.index !== undefined) {
    return cleaned.slice(0, 120 + boundaryMatch.index + 1).trim();
  }

  // No boundary found — cut at last space before 200 chars
  const cut = cleaned.slice(0, 200);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut).trim();
}

// ------------------------------------------------------------
// UTILS
// ------------------------------------------------------------
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ------------------------------------------------------------
// KEY HEALTH REPORT — used by admin panel
// Returns sanitised status (no raw key values)
// ------------------------------------------------------------
export function getKeyHealth() {
  return getKeyPool().map((k, i) => ({
    slot: i + 1,
    requestsThisMinute: k.requestsThisMinute,
    requestsToday: k.requestsToday,
    lastUsed: k.lastUsed ? new Date(k.lastUsed).toISOString() : "never",
    coolingUntil: k.coolUntil > Date.now() ? new Date(k.coolUntil).toISOString() : null,
    errorCount: k.errorCount,
    disabled: k.disabled,
  }));
}
