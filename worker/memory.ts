import type { Env } from './types';
import { db } from './db';
import { getGeminiKeys } from './utils';

// Short-term history behaves like a SESSION, ChatGPT-style: after an away-gap
// longer than SESSION_GAP_MS, the old messages are KEPT (Bizli still knows
// what was said) but a system note tells the model they're old — greet fresh,
// don't continue old topics unless the user does. Long-term Supabase memories
// are unaffected. Stored as { ts, msgs }; legacy plain arrays read as ts 0
// (note shows once) and upgrade on the next write.
const SESSION_GAP_MS = 4 * 60 * 60 * 1000; // 4 hours

async function readHistoryRaw(env: Env, userId: string): Promise<{ ts: number; msgs: any[] }> {
  const val = await env.BIZLI_MEMORY.get(`history_${userId}`);
  if (!val) return { ts: 0, msgs: [] };
  const parsed = JSON.parse(val);
  if (Array.isArray(parsed)) return { ts: 0, msgs: parsed }; // legacy format
  return { ts: parsed.ts || 0, msgs: parsed.msgs || [] };
}

export async function getKVHistory(env: Env, userId: string): Promise<any[]> {
  const { ts, msgs } = await readHistoryRaw(env, userId);
  const gapMs = Date.now() - ts;
  if (msgs.length && gapMs > SESSION_GAP_MS) {
    const ago = ts ? `about ${Math.round(gapMs / 3_600_000)} hours ago` : "a while ago";
    return [...msgs, { role: "system", content:
      `(note: the conversation above happened ${ago}. The user has just come back — greet them fresh and naturally, like a new chat. Do NOT continue or bring up the older topics unless the user mentions them first.)` }];
  }
  return msgs;
}

export async function appendKVHistory(env: Env, userId: string, role: string, content: string): Promise<void> {
  // Raw read — the session-gap note from getKVHistory must never be persisted.
  const { msgs: history } = await readHistoryRaw(env, userId);
  // Cap individual message length to keep context lean across 50 users
  const trimmedContent = content.slice(0, 500);
  history.push({ role, content: trimmedContent });
  // Keep 15 most recent turns (was 30 — halved to protect Groq TPM quota)
  let kept = history.slice(-15);
  // If total chars still exceed 7000, drop oldest pairs until under budget
  while (kept.length > 4 && kept.reduce((s: number, m: any) => s + (m.content?.length || 0), 0) > 7000) {
    kept = kept.slice(2);
  }
  await env.BIZLI_MEMORY.put(`history_${userId}`, JSON.stringify({ ts: Date.now(), msgs: kept }), { expirationTtl: 2592000 });
}


export async function getEmbedding(env: Env, text: string): Promise<number[] | null> {
  // Gemini keys live under the "lab" scope — the default ("bizli") is always empty.
  const keys = getGeminiKeys(env, "lab");
  if (!keys.length) return null;
  // Try text-embedding-004 first; fall back to gemini-embedding-001 if retired.
  // outputDimensionality: 768 keeps vectors compatible with the Supabase
  // vector(768) column used by rpc/match_memories.
  const models: { id: string; body: any }[] = [
    { id: "text-embedding-004", body: { content: { parts: [{ text: text.slice(0, 2000) }] } } },
    { id: "gemini-embedding-001", body: { content: { parts: [{ text: text.slice(0, 2000) }] }, outputDimensionality: 768 } },
  ];
  for (const { id, body } of models) {
    for (const key of keys) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${id}:embedContent?key=${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.status === 404) break; // model gone — try next model, not next key
        if (!res.ok) continue;
        const data = await res.json() as any;
        const values = data?.embedding?.values;
        if (Array.isArray(values) && values.length === 768) return values;
      } catch { continue; }
    }
  }
  return null;
}

// Importance-ranked memories — used as fallback when embeddings aren't
// available yet (older memories, or if Gemini is briefly down).
export async function getUserMemories(env: Env, userId: string): Promise<any[]> {
  const rows = await db(env, `memories?user_id=eq.${userId}&order=importance.desc&limit=15`);
  if (!rows || !Array.isArray(rows)) return [];
  return rows;
}

// Semantic search: memories most relevant to the CURRENT message.
// Falls back to importance-ranked if no embedding/RPC available.
export async function getRelevantMemories(env: Env, userId: string, queryText: string): Promise<any[]> {
  const embedding = await getEmbedding(env, queryText);
  if (!embedding) return getUserMemories(env, userId);
  try {
    const rows = await db(env, "rpc/match_memories", "POST", {
      query_embedding: embedding,
      match_user_id: userId,
      match_count: 8,
    });
    if (Array.isArray(rows) && rows.length > 0) return rows;
  } catch {}
  return getUserMemories(env, userId);
}

export async function saveMemory(env: Env, userId: string, category: string, content: string, keywords: string[], importance: number): Promise<void> {
  try {
    const embedding = await getEmbedding(env, content);
    const existing = await db(env, `memories?user_id=eq.${userId}&category=eq.${encodeURIComponent(category)}&limit=20`);
    if (existing?.length > 0) {
      for (const mem of existing) {
        if (mem.content.toLowerCase().includes(content.toLowerCase().slice(0, 20))) {
          const patch: any = { content, keywords, importance, last_referenced: new Date().toISOString() };
          if (embedding) patch.embedding = embedding;
          await db(env, `memories?id=eq.${mem.id}`, "PATCH", patch);
          return;
        }
      }
    }
    const insert: any = {
      user_id: userId, category, content, keywords, importance,
      expires_at: importance >= 4 ? null : new Date(Date.now() + 90 * 86400000).toISOString(),
    };
    if (embedding) insert.embedding = embedding;
    await db(env, "memories", "POST", insert);
  } catch (e) { console.error("[Memory]", e); }
}

export async function getAuthStateHelper(env: Env, chatId: string): Promise<any> {
  const val = await env.BIZLI_MEMORY.get(`auth_${chatId}`);
  return val ? JSON.parse(val) : null;
}

export async function setAuthStateHelper(env: Env, chatId: string, state: object): Promise<void> {
  await env.BIZLI_MEMORY.put(`auth_${chatId}`, JSON.stringify(state), { expirationTtl: 600 });
}

export async function clearAuthState(env: Env, chatId: string): Promise<void> {
  await env.BIZLI_MEMORY.delete(`auth_${chatId}`);
}

export async function isAdminSession(env: Env, chatId: string): Promise<boolean> {
  const val = await env.BIZLI_MEMORY.get(`admin_session_${chatId}`);
  if (!val) return false;
  if (Date.now() > parseInt(val)) { await env.BIZLI_MEMORY.delete(`admin_session_${chatId}`); return false; }
  return true;
}

export async function setAdminSession(env: Env, chatId: string): Promise<void> {
  await env.BIZLI_MEMORY.put(`admin_session_${chatId}`, String(Date.now() + 15 * 60 * 1000), { expirationTtl: 900 });
}

export async function lookupUser(env: Env, platform: string, platformId: string): Promise<any> {
  const identity = await db(env, `platform_identities?platform=eq.${platform}&platform_id=eq.${platformId}&limit=1`);
  if (identity?.[0]?.user_id) {
    const u = await db(env, `users?id=eq.${identity[0].user_id}&limit=1`);
    if (u?.[0]) return u[0];
  }
  const state = await getAuthStateHelper(env, platformId);
  if (state?.userId) {
    const u = await db(env, `users?id=eq.${state.userId}&limit=1`);
    if (u?.[0]) return u[0];
  }
  const u2 = await db(env, `users?gmail_hash=eq.tg_${platformId}&limit=1`);
  return u2?.[0] || null;
}
