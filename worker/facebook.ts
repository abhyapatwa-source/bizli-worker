import type { Env } from './types';
import { db } from './db';
import { todayContext } from './utils';
import { getKVHistory, appendKVHistory, getRelevantMemories } from './memory';
import { callGroq, autoExtractMemory } from './brain';
import { handleAuth } from './auth';

export function handleFacebookVerify(request: Request, env: Env): Response {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === env.FB_VERIFY_TOKEN) return new Response(challenge, { status: 200 });
  return new Response("Forbidden", { status: 403 });
}

async function sendFacebook(env: Env, recipientId: string, text: string): Promise<void> {
  await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${env.FB_PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
  });
}

export async function handleFacebook(request: Request, env: Env): Promise<Response> {
  let body: any;
  try { body = await request.json(); } catch { return new Response("ok"); }
  if (body.object !== "page") return new Response("ok");
  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      if (!event.message || event.message.is_echo) continue;
      const senderId = String(event.sender.id);
      const text: string = event.message.text || "";
      if (!text) continue;
      const authResult = await handleAuth(env, senderId, text, "facebook");
      if (authResult.handled) continue;
      const identity = await db(env, `platform_identities?platform=eq.facebook&platform_id=eq.${senderId}&limit=1`);
      if (!identity?.length) { await sendFacebook(env, senderId, "type !register to sign up or !login if you have an account."); continue; }
      const isLoggedOut = await env.BIZLI_MEMORY.get(`logged_out_${senderId}`);
      if (isLoggedOut) { await sendFacebook(env, senderId, "you're logged out. type !login"); continue; }
      const userId = identity[0].user_id;
      const user = (await db(env, `users?id=eq.${userId}&limit=1`))?.[0];
      if (!user || user.status !== "approved" || user.is_blocked) continue;
      try {
        const kvHistory = await getKVHistory(env, userId);
        const memories = await getRelevantMemories(env, userId, text);
        const memContext = todayContext() + "\n" + (memories.length > 0 ? "[Memories]:\n" + memories.map((m: any) => `- ${m.content}`).join("\n") : "");
        const messages = [...kvHistory.map((m: any) => ({ role: m.role, content: m.content })), { role: "user", content: text }];
        let reply = await callGroq(env, messages, memContext, senderId, true);
        if (reply === "IMAGE_GENERATED") continue;
        if (reply.startsWith("RICH_SENT:")) reply = reply.slice(10);
        await appendKVHistory(env, userId, "user", text);
        await appendKVHistory(env, userId, "assistant", reply);
        await sendFacebook(env, senderId, reply);
        setTimeout(() => autoExtractMemory(env, userId, text, reply).catch(() => {}), 0);
      } catch { await sendFacebook(env, senderId, "give me a sec, try again."); }
    }
  }
  return new Response("ok");
}
