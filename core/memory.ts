// ============================================================
// BIZLI AI — MEMORY (SUPABASE READ / WRITE)
// core/memory.ts
// Version: 9.0.0
// ============================================================

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------
export interface BizliUser {
  id: string;
  gmail_hash: string;
  display_name: string | null;
  is_blocked: boolean;
  block_reason: string | null;
  msg_count_today: number;
  last_active: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Gemini expects this format for conversation history
export interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

// ------------------------------------------------------------
// SUPABASE CLIENT
// Uses service_role key — bypasses RLS, full access.
// Loaded from environment variables, never hardcoded.
// ------------------------------------------------------------
function getSupabaseUrl(): string {
  return (globalThis as any).__env?.SUPABASE_URL || "";
}

function getSupabaseKey(): string {
  return (globalThis as any).__env?.SUPABASE_SERVICE_KEY || "";
}

async function supabase(
  path: string,
  method: string = "GET",
  body?: object
): Promise<any> {
  const SUPABASE_URL = getSupabaseUrl();
  const SUPABASE_KEY = getSupabaseKey();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "return=representation" : "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase ${method} ${path} failed: ${err}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ------------------------------------------------------------
// USER RESOLUTION
// Finds or creates a user by gmail_hash.
// Called once per new platform identity.
// ------------------------------------------------------------
export async function getOrCreateUser(gmailHash: string): Promise<BizliUser> {
  // Try to find existing user
  const existing = await supabase(
    `users?gmail_hash=eq.${gmailHash}&limit=1`
  );

  if (existing && existing.length > 0) {
    return existing[0] as BizliUser;
  }

  // Create new user
  const created = await supabase("users", "POST", {
    gmail_hash: gmailHash,
    last_active: new Date().toISOString(),
  });

  return created[0] as BizliUser;
}

// ------------------------------------------------------------
// PLATFORM IDENTITY LINKING
// Maps platform_id (telegram chat_id, discord user_id, etc.)
// to a universal gmail_hash user_id.
// ------------------------------------------------------------
export async function linkPlatformIdentity(
  userId: string,
  platform: string,
  platformId: string
): Promise<void> {
  await supabase("platform_identities", "POST", {
    user_id: userId,
    platform,
    platform_id: platformId,
  }).catch(() => {
    // Unique constraint violation = already linked, safe to ignore
  });
}

export async function resolveUserByPlatform(
  platform: string,
  platformId: string
): Promise<BizliUser | null> {
  const identity = await supabase(
    `platform_identities?platform=eq.${platform}&platform_id=eq.${platformId}&limit=1`
  );

  if (!identity || identity.length === 0) return null;

  const user = await supabase(
    `users?id=eq.${identity[0].user_id}&limit=1`
  );

  return user && user.length > 0 ? (user[0] as BizliUser) : null;
}

// ------------------------------------------------------------
// BLOCK CHECK
// Called on every request before hitting Gemini.
// ------------------------------------------------------------
export async function isUserBlocked(userId: string): Promise<boolean> {
  const user = await supabase(`users?id=eq.${userId}&limit=1`);
  return user && user.length > 0 ? user[0].is_blocked : false;
}

// ------------------------------------------------------------
// MESSAGE HISTORY
// Fetches last 50 messages for a user, formatted for Gemini.
// Auto-prune trigger in DB keeps the table clean.
// ------------------------------------------------------------
export async function getHistory(userId: string): Promise<GeminiMessage[]> {
  const messages = await supabase(
    `messages?user_id=eq.${userId}&order=created_at.asc&limit=50`
  );

  if (!messages || messages.length === 0) return [];

  return messages.map((m: ChatMessage) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

// ------------------------------------------------------------
// SAVE MESSAGE
// Saves both user message and Bizli's reply after each turn.
// ------------------------------------------------------------
export async function saveMessage(
  userId: string,
  platform: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  await supabase("messages", "POST", {
    user_id: userId,
    platform,
    role,
    content,
  });
}

// ------------------------------------------------------------
// RATE LIMIT CHECK
// 30 messages per hour per user, enforced in Worker.
// ------------------------------------------------------------
export async function checkHourlyLimit(userId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
  const recent = await supabase(
    `messages?user_id=eq.${userId}&role=eq.user&created_at=gte.${oneHourAgo}`
  );
  return recent && recent.length >= 30;
}

// ------------------------------------------------------------
// UPDATE LAST ACTIVE + MESSAGE COUNT
// ------------------------------------------------------------
export async function updateUserActivity(userId: string): Promise<void> {
  await supabase(`users?id=eq.${userId}`, "PATCH", {
    last_active: new Date().toISOString(),
    msg_count_today: undefined, // incremented via raw SQL below
  });

  // Increment daily message counter
  await fetch(`${getSupabaseUrl()}/rest/v1/rpc/increment_msg_count`, {
    method: "POST",
    headers: {
      "apikey": getSupabaseKey(),
      "Authorization": `Bearer ${getSupabaseKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id_input: userId }),
  });
}

// ------------------------------------------------------------
// PROACTIVE MESSAGING HELPER
// Returns users inactive for 48+ hours (for GitHub Actions cron)
// Max 1 proactive message per user per 3 days.
// ------------------------------------------------------------
export async function getInactiveUsers(): Promise<BizliUser[]> {
  const cutoff = new Date(Date.now() - 48 * 3600_000).toISOString();
  const users = await supabase(
    `users?last_active=lt.${cutoff}&is_blocked=eq.false`
  );
  return users || [];
}
