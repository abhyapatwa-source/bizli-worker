// ============================================================
// BIZLI AI — PRODUCTION READY (modular)
// Built by Abhya | 3000+ hours | Meta tools + open research
// Version: see BIZLI_VERSION in brain.ts — single source of truth
// v11.75.0: Fix Groq model, strip Gemini grounding URLs, Giphy API key,
//           honest GIF fallback, feedback query fix, admin live activity view
// v11.75.1: Fix model again (Scout confirmed working), agent tools from code
// v11.76.0: GET /admin/stats data endpoint, rolling error log (last 20)
// v11.76.1: GET /dashboard live command-center dashboard
// v11.76.2: Fix callGroq synthesis fetches missing tools+tool_choice (Groq 400)
// v11.76.3: clear cache resets groq_status; audio null-text guard; group error fix
// v11.77.0: Switch text model to llama-3.3-70b-versatile (reliable tool calling);
//           catch Python-style leaked function calls; sanitize fallthrough; voice timeout cap
// v11.78.0: Fix webhook retry storm — instant 200 OK + background processing via ctx.waitUntil;
//           deduplicate by update_id in KV (TTL 120s) so no retry is ever processed twice
// v11.79.0: GET /chat web UI + POST /web-chat; web users share account/history/memories with Telegram
// v11.79.1: Circuit breaker: tool-call 400 retries without tools then breaks (no key cascade);
//           handle fused-JSON leak format search_web{"query":"..."} as defence in depth
// v11.80.0: Maintenance mode — !maintenance on/off (admin only); all non-admin users
//           blocked with friendly message; !support still works for everyone
// v11.80.1: Auto-broadcast on maintenance toggle; broadcastToTelegram helper with 50ms gap
// v11.80.2: Maintenance gate: once-only notice per user (maint_notified_*), then silent;
//           maint_notified_* keys cleared on OFF so flags reset for next maintenance
// v11.80.3: Suppress cron-driven proactive nudges and morning/night greetings during maintenance
// v11.81.0: Split 7116-line monolith into 19 typed modules (types/db/utils/html/telegram/memory/
//           search/apis/tools/brain/auth/agents/admin/commands/facebook/group/discord/stats/index)
// v11.85.0: Lab Agent backend — POST /lab/agent (Gemini multi-model rotation, admin auth, privacy sanitization)
// v11.85.3: Lab Agent UI — fixed right-side panel, chat bubbles, typewriter, localStorage history, mobile drawer
// v11.85.4: Lab Agent collapse toggle — slide panel, button tracks edge, localStorage state, no-flash restore
// v11.85.5: Left nav sidebar — 10 tabs, Lucide icons, tab switching, responsive (60px tablet / drawer mobile)
// ============================================================

import type { Env } from './types';
import { db } from './db';
import { sha256, calculateAge, isBirthdayToday, detectScript, detectUserTone, todayContext } from './utils';
import { PRIVACY_HTML, TERMS_HTML, CHAT_HTML } from './html';
import { sendTelegram, sendTyping, withTyping, downloadTelegramFile, transcribeVoice, sendSupportToAdmin } from './telegram';
import { getKVHistory, appendKVHistory, getRelevantMemories, lookupUser, setAuthStateHelper } from './memory';
import { searchWeb, cleanSearchQuery, needsLiveSearch, extractOfficeQuery } from './search';
import { callGroq, groqExhausted, autoExtractMemory, sanitizePersonaLeaks, appendError, BIZLI_VERSION } from './brain';
import { checkRateLimit } from './tools';
import { runAgents } from './agents';
import { handleAdmin } from './admin';
import { detectIntent, handleUserCommand, handleCallback } from './commands';
import { handleAuth } from './auth';
import { handleGroupMessage } from './group';
import { handleFacebook, handleFacebookVerify } from './facebook';
import { handleDiscord, handleDiscordRegister } from './discord';
import { handleAdminStats, handleDashboard, handleWebChat } from './stats';
import { handleLabAgent } from './lab';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/telegram") return handleTelegram(request, env, ctx);
    if (request.method === "POST" && url.pathname === "/facebook") return handleFacebook(request, env);
    if (request.method === "GET" && url.pathname === "/facebook") return handleFacebookVerify(request, env);
    if (request.method === "POST" && url.pathname === "/discord") return handleDiscord(request, env, ctx);
    if (request.method === "GET" && url.pathname === "/discord-register") return handleDiscordRegister(request, env);
    if (request.method === "GET" && url.pathname === "/health") return new Response(JSON.stringify({ status: "ok", version: BIZLI_VERSION }), { headers: { "Content-Type": "application/json" } });
    if (request.method === "GET" && url.pathname === "/admin/stats") return handleAdminStats(request, env);
    if (request.method === "GET" && url.pathname === "/dashboard") return handleDashboard(request, env);
    if (request.method === "GET" && url.pathname === "/chat") return new Response(CHAT_HTML, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
    if (request.method === "POST" && url.pathname === "/web-chat") return handleWebChat(request, env);
    if (url.pathname === "/lab/agent") {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
      if (request.method === "POST") return handleLabAgent(request, env);
    }
    if (request.method === "GET" && url.pathname === "/privacy") return new Response(PRIVACY_HTML, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
    if (request.method === "GET" && url.pathname === "/terms") return new Response(TERMS_HTML, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
    return new Response("Bizli is alive.", { status: 200 });
  },
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runAgents(env));
  },
};

async function handleTelegram(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let update: any;
  try { update = await request.json(); } catch { return new Response("ok"); }
  const updateId = update.update_id;
  if (updateId) {
    const seen = await env.BIZLI_MEMORY.get(`upd_${updateId}`);
    if (seen) return new Response("ok");
    await env.BIZLI_MEMORY.put(`upd_${updateId}`, "1", { expirationTtl: 120 });
  }
  ctx.waitUntil(processTelegramUpdate(update, env));
  return new Response("ok");
}

async function processTelegramUpdate(update: any, env: Env): Promise<Response> {
  if (update.callback_query) { await handleCallback(env, update.callback_query); return new Response("ok"); }

  const msg = update.message || update.edited_message;
  if (!msg) return new Response("ok");
  const chatId = String(msg.chat.id);
  const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";

  const tgFrom = msg.from || {};
  const tgUsername: string = tgFrom.username || "";
  const tgFirstName: string = tgFrom.first_name || "";
  const tgLastName: string = tgFrom.last_name || "";
  const tgLangCode: string = tgFrom.language_code || "";

  const hasPhoto = !!msg.photo && !isGroup;
  const hasSticker = !!msg.sticker && !isGroup;
  const hasAnimation = !!msg.animation && !isGroup;
  const hasVoice = !!(msg.voice || msg.audio) && !isGroup;

  let text: string = msg.text || (hasPhoto ? (msg.caption || "") : "");
  if (!text && hasSticker) {
    const emoji = msg.sticker?.emoji || "";
    const kind = msg.sticker?.is_animated ? "animated sticker" : msg.sticker?.is_video ? "video sticker" : "sticker";
    text = `[sent a ${kind}${emoji ? " " + emoji : ""}]`;
  }
  if (!text && hasAnimation) {
    text = "[sent a GIF — respond with send_gif to match their vibe, this is a GIF-for-GIF exchange]";
  }
  if (!text && hasVoice) {
    const voiceFileId = (msg.voice || msg.audio)?.file_id;
    if (voiceFileId) {
      const transcript = await transcribeVoice(env, voiceFileId);
      if (transcript) {
        text = transcript;
      } else {
        text = "[sent a voice message — couldn't transcribe]";
      }
    } else {
      text = "[sent a voice message]";
    }
  }
  if (!isGroup && !text && !hasPhoto && !hasSticker && !hasAnimation && !hasVoice) return new Response("ok");
  if (hasPhoto && !text) text = "is photo mein kya hai? bata do.";

  if (isGroup) {
    try {
      await handleGroupMessage(env, msg);
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.error("[Group Error]", errMsg);
      appendError(env, `group=${chatId}: ${errMsg.slice(0, 150)}`).catch(() => {});
    }
    return new Response("ok");
  }

  const platform = "telegram";
  const replyContext = msg.reply_to_message?.text ? `[Replying to: "${msg.reply_to_message.text.slice(0, 150)}"]` : "";

  if (text.startsWith("/start")) {
    const startIdentity = await db(env, `platform_identities?platform=eq.${platform}&platform_id=eq.${chatId}&limit=1`);
    if (startIdentity?.length && startIdentity[0]?.user_id) {
      const u = (await db(env, `users?id=eq.${startIdentity[0].user_id}&limit=1`))?.[0];
      if (u?.status === "approved") {
        await sendTelegram(env, chatId, `heyyy ${u.display_name || "you"} 👋 welcome back bestie! just say something, I'm right here 😊\n\n📸 you can send me photos too!\ntype !help if you wanna see everything I can do 💛`);
        return new Response("ok");
      }
      if (u?.status === "waitlist") {
        await sendTelegram(env, chatId, "you're on the waitlist ⏳ I'll literally ping you the second you're in — hang tight, it'll be worth it 💛");
        return new Response("ok");
      }
    }
    await sendTelegram(env, chatId,
      "heyyy 👋✨ I'm Bizli!\n\nngl I can do a lot — chat, remember things about you, search the web, even see your photos 😊 basically your bestie but smarter lol\n\nquick setup first, 20 secs promise 💫 what's your name?"
    );
    await setAuthStateHelper(env, chatId, { step: "reg_name" });
    return new Response("ok");
  }

  const lower = text.trim().toLowerCase();
  if (lower === "!forgotpin" || lower === "!recover" || lower === "!support" || lower.startsWith("!support ")) {
    const userInfo = await lookupUser(env, platform, chatId);
    if (lower === "!forgotpin") {
      await sendTelegram(env, env.ADMIN_CHAT_ID,
        `🔑 PIN Reset\n\nName: ${userInfo?.display_name || "Unknown"}\nCode: ${userInfo?.identity_code || "N/A"}\nGmail: ${userInfo?.gmail || "N/A"}\nPlatform: ${platform}\nChat ID: ${chatId}`,
        { reply_markup: { inline_keyboard: [[{ text: "🔑 Reset PIN", callback_data: `resetpin:${userInfo?.id || chatId}` }, { text: "💬 Reply", callback_data: `reply:${chatId}` }]] } }
      );
      await sendTelegram(env, chatId, "request sent 🙏 admin will help shortly");
    } else if (lower === "!recover") {
      await setAuthStateHelper(env, chatId, { step: "recover_gmail" });
      await sendTelegram(env, chatId, "enter the Gmail you registered with:");
    } else if (lower === "!support") {
      await sendTelegram(env, chatId, "what do you need help with?",
        { reply_markup: { inline_keyboard: [[{ text: "🔑 PIN Issue", callback_data: `support_cat:${chatId}|pin` }, { text: "🔐 Can't Login", callback_data: `support_cat:${chatId}|login` }, { text: "💬 Other", callback_data: `support_cat:${chatId}|other` }]] } }
      );
    } else {
      const userInfo2 = await lookupUser(env, platform, chatId);
      await sendSupportToAdmin(env, chatId, platform, "other", text.trim().slice(9).trim(), userInfo2);
      await sendTelegram(env, chatId, "support request sent 🙏");
    }
    return new Response("ok");
  }

  if (chatId !== env.ADMIN_CHAT_ID) {
    const maintMode = await env.BIZLI_MEMORY.get("maintenance_mode");
    if (maintMode === "on") {
      const notifyKey = `maint_notified_${chatId}`;
      const alreadyNotified = await env.BIZLI_MEMORY.get(notifyKey);
      if (!alreadyNotified) {
        await env.BIZLI_MEMORY.put(notifyKey, "1");
        await sendTelegram(env, chatId, "Bizli is under development right now 🛠️ I'll be back soon 💛 — type !support if you need to reach the developer");
      }
      return new Response("ok");
    }
  }

  if (await handleAdmin(env, chatId, text)) return new Response("ok");

  const authResult = await handleAuth(env, chatId, text, platform);
  if (authResult.handled) return new Response("ok");

  if (text.trim().toLowerCase() === "!iam papa") {
    const selfId = await db(env, `platform_identities?platform=eq.${platform}&platform_id=eq.${chatId}&limit=1`);
    if (!selfId?.length) {
      const creatorRows = await db(env, "users?is_creator=eq.true&select=id,creator_secret_hash,creator_secret_q") || [];
      const cr = creatorRows[0];
      if (!cr?.creator_secret_hash) {
        await sendTelegram(env, chatId, "Papa hasn't set up identity verification yet 💛 Only Papa can do that from his verified account.");
      } else {
        await env.BIZLI_MEMORY.put(`papa_challenge_${chatId}`, "awaiting", { expirationTtl: 600 });
        await sendTelegram(env, chatId, `💛 ${cr.creator_secret_q || "What is your secret answer?"}`);
      }
      return new Response("ok");
    }
  }
  const papaChallengeState = await env.BIZLI_MEMORY.get(`papa_challenge_${chatId}`);
  if (papaChallengeState === "awaiting") {
    const creatorRows = await db(env, "users?is_creator=eq.true&select=id,creator_secret_hash") || [];
    const cr = creatorRows[0];
    const givenHash = await sha256(text.trim());
    if (cr?.creator_secret_hash && givenHash === cr.creator_secret_hash) {
      await db(env, "platform_identities", "POST", { user_id: cr.id, platform, platform_id: chatId });
      await env.BIZLI_MEMORY.delete(`papa_challenge_${chatId}`);
      await sendTelegram(env, chatId, "Papa 💛 I'd know you anywhere. This account is now linked — welcome back!");
    } else {
      await env.BIZLI_MEMORY.delete(`papa_challenge_${chatId}`);
      await sendTelegram(env, chatId, "That doesn't match 💛 If you're really Papa, send !iam papa to try again.");
    }
    return new Response("ok");
  }

  const identity = await db(env, `platform_identities?platform=eq.${platform}&platform_id=eq.${chatId}&limit=1`);
  if (!identity?.length || !identity[0]?.user_id) {
    const greetedKey = `greeted_${chatId}`;
    const alreadyGreeted = await env.BIZLI_MEMORY.get(greetedKey);
    if (!alreadyGreeted) {
      await env.BIZLI_MEMORY.put(greetedKey, "1", { expirationTtl: 3600 });
      await sendTelegram(env, chatId,
        "hey 👋 I'm Bizli — your personal AI friend! I can chat, remember our conversations, search the web, even see photos you send 😊\n\nWe just need to get you set up first (takes 20 seconds). Ready?",
        { reply_markup: { inline_keyboard: [[
          { text: "✨ Let's go!", callback_data: `start_reg:${chatId}` },
          { text: "🔑 I have an account", callback_data: `start_login:${chatId}` },
        ]] } }
      );
    } else {
      await sendTelegram(env, chatId,
        "let's get you set up so we can chat properly 😊 just tap below 👇",
        { reply_markup: { inline_keyboard: [[
          { text: "✨ Sign me up", callback_data: `start_reg:${chatId}` },
          { text: "🔑 I have an account", callback_data: `start_login:${chatId}` },
        ]] } }
      );
    }
    return new Response("ok");
  }

  const isLoggedOut = await env.BIZLI_MEMORY.get(`logged_out_${chatId}`);
  if (isLoggedOut) {
    await sendTelegram(env, chatId, "you're logged out rn 🔒 tap below to come back 👇",
      { reply_markup: { inline_keyboard: [[{ text: "🔑 Log in", callback_data: `start_login:${chatId}` }]] } });
    return new Response("ok");
  }

  const userId = identity[0].user_id;
  const user = (await db(env, `users?id=eq.${userId}&limit=1`))?.[0];

  if (!user || user.status === "waitlist") { await sendTelegram(env, chatId, "you're on the waitlist ⏳ I'll literally ping you the second you're approved — won't be long 💛"); return new Response("ok"); }
  if (user.status === "denied") { await sendTelegram(env, chatId, "hmm, access wasn't approved 😕 if you think that's wrong, type !support and we'll sort it 🙏"); return new Response("ok"); }
  if (user.is_blocked) { await sendTelegram(env, chatId, "hey, I can't chat rn 🙏 take care of yourself 💛"); return new Response("ok"); }

  if (text.trim().toLowerCase() === "!iam papa" && user?.is_creator) {
    await env.BIZLI_MEMORY.put(`papa_setup_${chatId}`, "awaiting", { expirationTtl: 600 });
    await sendTelegram(env, chatId, "Of course Papa 💛 Send me your secret answer — I'll store only a hash of it, never the real thing:");
    return new Response("ok");
  }
  const papaSetupState = await env.BIZLI_MEMORY.get(`papa_setup_${chatId}`);
  if (papaSetupState === "awaiting" && user?.is_creator) {
    const hash = await sha256(text.trim());
    await db(env, `users?id=eq.${userId}`, "PATCH", {
      creator_secret_hash: hash,
      creator_secret_q: "What date did Bizli leave? (DDMMYYYY)",
    });
    await env.BIZLI_MEMORY.delete(`papa_setup_${chatId}`);
    await sendTelegram(env, chatId, "Secured, Papa 💛 On any new device or account, send !iam papa and answer correctly to be recognised as you.");
    return new Response("ok");
  }

  if (await handleUserCommand(env, chatId, text, userId, platform)) return new Response("ok");
  if (!hasPhoto && !hasSticker && !hasAnimation && await detectIntent(env, text, chatId, userId)) return new Response("ok");

  if (hasPhoto || hasSticker) {
    const rl = await checkRateLimit(env, chatId, "vision");
    if (!rl.allowed) {
      await sendTelegram(env, chatId, `vision limit reached for now — try again in ${rl.resetInMin} min 📸`);
      return new Response("ok");
    }
  }

  try {
    await sendTyping(env, chatId);
    await new Promise(r => setTimeout(r, 400));
    const kvHistory = await getKVHistory(env, userId);
    const memories = await getRelevantMemories(env, userId, text);
    let memoriesBlock = "";
    if (memories.length > 0) {
      memoriesBlock = "[Your memories about this person — use naturally when relevant]:\n" +
        memories.map((m: any) => `- ${m.content}`).join("\n");
    }

    const memberSince = user?.created_at
      ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : "recently";
    const tgHandleStr = tgUsername ? ` | Telegram: @${tgUsername}` : "";
    const tgFullName = [tgFirstName, tgLastName].filter(Boolean).join(" ");
    const codeStr = user?.identity_code ? ` | Code: ${user.identity_code}` : "";
    const langHint = tgLangCode ? ` | Telegram language setting: ${tgLangCode}` : "";
    const ageStr = user?.date_of_birth
      ? ` | Age: ${calculateAge(user.date_of_birth)}${isBirthdayToday(user.date_of_birth) ? " — TODAY IS THEIR BIRTHDAY, wish them warmly at the start of your reply!" : ""}`
      : "";
    const cityStr = user?.city ? ` | Location: ${user.city}` : "";

    if (tgLangCode && userId) {
      env.BIZLI_MEMORY.put(`lang_${userId}`, tgLangCode, { expirationTtl: 31536000 }).catch(() => {});
    }

    let memContext: string;
    if (user?.is_creator) {
      memContext = `[CURRENT USER — PAPA: ${user.display_name || "Abhya"}${tgHandleStr}${codeStr}${ageStr}${cityStr} | Member since ${memberSince}${langHint} | This is your creator and father — warm daughterly affection, call him Papa. PRIVACY: this is a strictly private conversation with Papa only.]\n` + memoriesBlock;
    } else {
      const displayName = user?.display_name || tgFullName || "friend";
      memContext = `[CURRENT USER: ${displayName}${tgHandleStr}${codeStr}${ageStr}${cityStr} | Member since ${memberSince}${langHint} | Platform: Telegram | PRIVACY: This is a strictly private 1-on-1 conversation — you know this specific person's details below and MUST NOT share them with or confuse them with any other user. Address ${displayName} warmly by name when natural.]\n` + memoriesBlock;
    }
    const userContent = replyContext ? `${replyContext}\nUser says: ${text}` : text;

    let userMessage: any = { role: "user", content: userContent };
    let historyText = text;
    let useTools = true;

    if (hasPhoto) {
      const photos = msg.photo;
      const photo = photos[Math.max(0, photos.length - 2)];
      const file = await downloadTelegramFile(env, photo.file_id);
      if (file) {
        userMessage = {
          role: "user",
          content: [
            { type: "text", text: userContent },
            { type: "image_url", image_url: { url: `data:${file.mime};base64,${file.base64}` } },
          ],
        };
        historyText = `[sent a photo] ${text}`;
        useTools = false;
      } else {
        userMessage = { role: "user", content: `${userContent}\n[note: couldn't load the photo, just text]` };
      }
    } else if (hasSticker) {
      const stickerFileId = (!msg.sticker.is_animated && !msg.sticker.is_video)
        ? msg.sticker.file_id
        : (msg.sticker.thumbnail?.file_id || null);
      if (stickerFileId) {
        const file = await downloadTelegramFile(env, stickerFileId);
        if (file) {
          userMessage = {
            role: "user",
            content: [
              { type: "text", text: `[User sent a sticker ${msg.sticker.emoji || ""}] React naturally to this sticker like a friend.` },
              { type: "image_url", image_url: { url: `data:image/webp;base64,${file.base64}` } },
            ],
          };
          historyText = `[sent a sticker ${msg.sticker.emoji || ""}]`;
          useTools = false;
        }
      }
    }

    const messages = [...kvHistory.map((m: any) => ({ role: m.role, content: m.content })), userMessage];

    const scriptHint = detectScript(text);
    const langLock = `[🔐 LANGUAGE LOCK — THIS MESSAGE IS IN: ${scriptHint}. Match it EXACTLY in your reply. Same script, same language. No exceptions — not even if previous messages were in a different language.]`;

    const toneHint = detectUserTone(text);
    let forcedContext = todayContext() + "\n" + langLock + (toneHint ? "\n" + toneHint : "") + (memContext ? "\n\n" + memContext : "");
    let directAnswer = "";
    if (!hasPhoto && await needsLiveSearch(env, text)) {
      if (await groqExhausted(env)) {
        await sendTelegram(env, chatId, "ngl my search tools are taking a lil breather rn 😮‍💨 still here to chat tho! ask me again in a bit for the live stuff 💛");
        return new Response("ok");
      }
      await sendTyping(env, chatId);
      const typingBeat = setInterval(() => { sendTyping(env, chatId).catch(() => {}); }, 4000);
      let liveResult = "";
      try {
        liveResult = await searchWeb(env, extractOfficeQuery(text) ? text : cleanSearchQuery(text));
      } finally {
        clearInterval(typingBeat);
      }
      if (liveResult) {
        await sendTyping(env, chatId);
        if (extractOfficeQuery(text)) {
          directAnswer = liveResult
            .replace(/⚡ CURRENT[^:]*:\s*/i, "")
            .trim();
          directAnswer = `Here's the latest 👇\n\n${directAnswer}`;
        } else {
          forcedContext = `${memContext}\n\n========================================\n🔴 LIVE SEARCH RESULT (just fetched, ${new Date().toISOString().slice(0, 10)}) — THIS IS THE TRUTH. The user's question is answered by the text below. Your training memory is OLD and WRONG; ignore it completely.\n\n${liveResult}\n========================================\n\nMANDATORY: State the answer from the search above as a confident FACT. If it names a person/winner/price, say that IS the answer — present tense, no hedging. FORBIDDEN phrases you must NEVER use: "I can't verify", "I don't have information", "seems to be", "let me verify", "as of my training", "outdated", "please check official sources", "I recommend checking". The search already verified it. Just tell the user the answer like a confident friend who just looked it up. Only use the source links shown above — invent nothing.`;
          useTools = false;
        }
      } else {
        forcedContext += `\n\n[⚠️ SEARCH NOTE: You tried to fetch live data for this question but all search sources returned empty. Answer from your best general knowledge, but be upfront — use natural phrasing like "I'm not fully sure about the latest on this, but..." or "from what I know..." — and at the end suggest they do a quick Google search for the freshest info. NEVER invent specific current facts like names, scores, dates, or prices.]`;
      }
    }

    if (directAnswer) {
      const cleaned = sanitizePersonaLeaks(directAnswer);
      await appendKVHistory(env, userId, "user", historyText);
      await appendKVHistory(env, userId, "assistant", cleaned);
      await db(env, "messages", "POST", { user_id: userId, platform, role: "user", content: historyText });
      await db(env, "messages", "POST", { user_id: userId, platform, role: "assistant", content: cleaned });
      await db(env, `users?id=eq.${userId}`, "PATCH", { last_active: new Date().toISOString() });
      let fbKb: any = undefined;
      try {
        const fbId = `${Date.now()}`;
        await env.BIZLI_MEMORY.put(`fb_ctx_${fbId}`, JSON.stringify({ userId, platform, u: historyText.slice(0, 300), r: cleaned.slice(0, 500) }), { expirationTtl: 86400 });
        fbKb = { reply_markup: { inline_keyboard: [[
          { text: "👍 accurate", callback_data: `fb:up:${fbId}` },
          { text: "👎 wrong", callback_data: `fb:down:${fbId}` },
        ]] } };
      } catch {}
      await sendTelegram(env, chatId, cleaned, fbKb);
      return new Response("ok");
    }

    let reply = await withTyping(env, chatId, callGroq(env, messages, forcedContext, chatId, useTools, hasAnimation));
    if (reply === "IMAGE_GENERATED" || reply === "GIF_SENT") return new Response("ok");
    let alreadySent = false;
    let wasRichCard = false;
    if (reply.startsWith("RICH_SENT:")) { reply = reply.slice(10); alreadySent = true; wasRichCard = true; }
    await appendKVHistory(env, userId, "user", historyText);
    await appendKVHistory(env, userId, "assistant", reply);
    await db(env, "messages", "POST", { user_id: userId, platform, role: "user", content: historyText });
    await db(env, "messages", "POST", { user_id: userId, platform, role: "assistant", content: reply });
    await db(env, `users?id=eq.${userId}`, "PATCH", { last_active: new Date().toISOString() });

    const isInfoReply = wasRichCard || /https?:\/\/|🔗/.test(reply);

    if (!alreadySent) {
      let kb: any = undefined;
      if (isInfoReply) {
        try {
          const fbId = `${Date.now()}`;
          await env.BIZLI_MEMORY.put(`fb_ctx_${fbId}`, JSON.stringify({ userId, platform, u: historyText.slice(0, 300), r: reply.slice(0, 500) }), { expirationTtl: 86400 });
          kb = { reply_markup: { inline_keyboard: [[
            { text: "👍 accurate", callback_data: `fb:up:${fbId}` },
            { text: "👎 wrong", callback_data: `fb:down:${fbId}` },
          ]] } };
        } catch {}
      }
      await sendTelegram(env, chatId, reply, kb);
    }
    setTimeout(() => autoExtractMemory(env, userId, text, reply).catch(() => {}), 0);
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error("[Worker Error]", errMsg);
    const ts = new Date().toISOString();
    env.BIZLI_MEMORY.put("recent_errors", `[${ts}] chat=${chatId}: ${errMsg.slice(0, 150)}`, { expirationTtl: 86400 }).catch(() => {});
    if (errMsg.includes("exhausted")) {
      await sendTelegram(env, chatId, "give me a sec bestie, just cooling down... try again in a moment! ⏳");
    } else {
      await sendTelegram(env, chatId, "oops, give me a sec — try again! 😅");
    }
  }

  return new Response("ok");
}
