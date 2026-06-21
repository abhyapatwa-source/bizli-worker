import type { Env } from './types';
import { db } from './db';
import { detectScript, detectUserTone, calculateAge, isBirthdayToday, todayContext } from './utils';
import { getKVHistory, appendKVHistory, getRelevantMemories } from './memory';
import { searchWeb, cleanSearchQuery, needsLiveSearch, extractOfficeQuery } from './search';
import { callGroq, sanitizePersonaLeaks } from './brain';

function hexToBytes(hex: string): Uint8Array {
  const b = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) b[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return b;
}

async function verifyDiscordSig(publicKey: string, sig: string, timestamp: string, body: string): Promise<boolean> {
  try {
    const key = await (crypto.subtle as any).importKey("raw", hexToBytes(publicKey), "Ed25519", false, ["verify"]);
    return await (crypto.subtle as any).verify("Ed25519", key, hexToBytes(sig), new TextEncoder().encode(timestamp + body));
  } catch { return false; }
}

async function discordFollowup(env: Env, token: string, content: string): Promise<void> {
  await fetch(`https://discord.com/api/v10/webhooks/${env.DISCORD_APP_ID}/${token}/messages/@original`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: content.slice(0, 2000) }),
  });
}

async function processDiscordInteraction(env: Env, discordId: string, username: string, displayName: string, text: string, token: string): Promise<void> {
  try {
    const platform = "discord";
    const name = displayName || username;

    const existing = await db(env, `platform_identities?platform=eq.${platform}&platform_id=eq.${discordId}&limit=1`);
    let userId = "";
    let user: any;
    if (existing?.[0]?.user_id) {
      userId = existing[0].user_id;
      user = (await db(env, `users?id=eq.${userId}&limit=1`))?.[0];
    } else {
      const created = await db(env, "users", "POST", {
        display_name: name, status: "approved",
        created_at: new Date().toISOString(), last_active: new Date().toISOString(),
      });
      userId = created?.[0]?.id || "";
      user = created?.[0];
      if (userId) await db(env, "platform_identities", "POST", { user_id: userId, platform, platform_id: discordId });
    }

    if (!userId) {
      await discordFollowup(env, token, "oops, something got tangled on my end 💛 try again in a sec!");
      return;
    }

    const [memories, kvHistory] = await Promise.all([getRelevantMemories(env, userId, text), getKVHistory(env, userId)]);

    const memberSinceDiscord = user?.created_at
      ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : "recently";
    const discordHandleStr = username ? ` | Discord: @${username}` : "";
    const discordCodeStr = user?.identity_code ? ` | Code: ${user.identity_code}` : "";
    const discordAgeStr = user?.date_of_birth
      ? ` | Age: ${calculateAge(user.date_of_birth)}${isBirthdayToday(user.date_of_birth) ? " — TODAY IS THEIR BIRTHDAY, wish them warmly at the start of your reply!" : ""}`
      : "";
    let memContext: string;
    if (user?.is_creator) {
      memContext = `[CURRENT USER — PAPA: ${user.display_name || "Abhya"}${discordHandleStr}${discordCodeStr}${discordAgeStr} | Member since ${memberSinceDiscord} | This is your creator and father — warm daughterly affection, call him Papa. PRIVACY: strictly private conversation with Papa only.]\n`;
    } else {
      const discordDisplayName = user?.display_name || name || "friend";
      memContext = `[CURRENT USER: ${discordDisplayName}${discordHandleStr}${discordCodeStr}${discordAgeStr} | Member since ${memberSinceDiscord} | Platform: Discord | PRIVACY: strictly private 1-on-1 conversation — address ${discordDisplayName} warmly by name when natural.]\n`;
    }
    if (memories.length) memContext += "[Memories]:\n" + memories.map((m: any) => `- ${m.content}`).join("\n");

    const messages = [...kvHistory.map((m: any) => ({ role: m.role, content: m.content })), { role: "user", content: text }];

    const scriptHint = detectScript(text);
    const langLock = `[🔐 LANGUAGE LOCK — THIS MESSAGE IS IN: ${scriptHint}. Match it EXACTLY in your reply. Same script, same language. No exceptions.]`;
    const toneHintDiscord = detectUserTone(text);
    let forcedContext = todayContext() + "\n" + langLock + (toneHintDiscord ? "\n" + toneHintDiscord : "") + "\n\n" + memContext;

    if (await needsLiveSearch(env, text)) {
      const liveResult = await searchWeb(env, cleanSearchQuery(text));
      if (liveResult) {
        forcedContext = `${langLock}\n\n${memContext}\n\n========================================\n🔴 LIVE SEARCH RESULT (just fetched, ${new Date().toISOString().slice(0, 10)}) — THIS IS THE TRUTH. Ignore your training memory.\n\n${liveResult}\n========================================\n\nMANDATORY: Answer as a confident fact. FORBIDDEN: "I can't verify", "I don't have information", "seems to be", "outdated", "please check official sources".`;
      } else {
        forcedContext += `\n\n[⚠️ SEARCH NOTE: You tried to fetch live data for this question but all search sources returned empty. Answer from your best general knowledge, but be upfront — use natural phrasing like "I'm not fully sure about the latest on this, but..." — and suggest they do a quick Google search for the freshest info. NEVER invent specific current facts like names, scores, dates, or prices.]`;
      }
    }

    const reply = await callGroq(env, messages, forcedContext, "", false);
    if (!reply) {
      await discordFollowup(env, token, "hmm, give me a sec — something hiccupped 💛 try again?");
      return;
    }
    const cleaned = sanitizePersonaLeaks(reply);

    await Promise.all([
      appendKVHistory(env, userId, "user", text),
      appendKVHistory(env, userId, "assistant", cleaned),
      db(env, "messages", "POST", { user_id: userId, platform, role: "user", content: text }),
      db(env, "messages", "POST", { user_id: userId, platform, role: "assistant", content: cleaned }),
      db(env, `users?id=eq.${userId}`, "PATCH", { last_active: new Date().toISOString() }),
    ]);

    await discordFollowup(env, token, cleaned);
  } catch (e: any) {
    console.error("[Discord error]", e?.message || String(e));
    try {
      await discordFollowup(env, token, "oops, something went sideways on my end 💛 give it another try!");
    } catch {}
  }
}

export async function handleDiscordRegister(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.searchParams.get("pw") !== env.ADMIN_PASSWORD) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!env.DISCORD_BOT_TOKEN || !env.DISCORD_APP_ID) {
    return new Response("DISCORD_BOT_TOKEN or DISCORD_APP_ID secret not set", { status: 500 });
  }
  const commands = [
    { name: "ask", description: "Ask Bizli anything", options: [{ name: "message", description: "Your message", type: 3, required: true }] },
    { name: "bizli", description: "Chat with Bizli", options: [{ name: "message", description: "Your message", type: 3, required: true }] },
  ];
  const results: string[] = [];
  for (const cmd of commands) {
    const res = await fetch(`https://discord.com/api/v10/applications/${env.DISCORD_APP_ID}/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bot ${env.DISCORD_BOT_TOKEN}` },
      body: JSON.stringify(cmd),
    });
    const data = await res.json() as any;
    results.push(`/${cmd.name}: ${res.ok ? "✅ registered (id: " + data.id + ")" : "❌ " + JSON.stringify(data)}`);
  }
  return new Response(results.join("\n"), { status: 200 });
}

export async function handleDiscord(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const sig = request.headers.get("x-signature-ed25519") || "";
  const ts = request.headers.get("x-signature-timestamp") || "";
  const body = await request.text();

  if (!env.DISCORD_PUBLIC_KEY || !await verifyDiscordSig(env.DISCORD_PUBLIC_KEY, sig, ts, body)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const ix = JSON.parse(body) as any;

  if (ix.type === 1) return new Response(JSON.stringify({ type: 1 }), { headers: { "Content-Type": "application/json" } });

  if (ix.type === 2) {
    const user = ix.member?.user || ix.user;
    const discordId: string = user?.id || "";
    const username: string = user?.username || "friend";
    const displayName: string = user?.global_name || user?.username || "friend";
    const text: string = (ix.data?.options?.[0]?.value || "").trim();
    const token: string = ix.token;

    if (!text) return new Response(JSON.stringify({ type: 4, data: { content: "Hey! What would you like to say? 💛" } }), { headers: { "Content-Type": "application/json" } });

    ctx.waitUntil(processDiscordInteraction(env, discordId, username, displayName, text, token));
    return new Response(JSON.stringify({ type: 5 }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ type: 1 }), { headers: { "Content-Type": "application/json" } });
}
