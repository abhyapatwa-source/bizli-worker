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
// v11.86.0: Refactor — split DASHBOARD_HTML into 18 modules (styles/gate/topbar/leftnav/orb/rightpanel/scripts + 10 tabs)
// ============================================================

import type { Env } from './types';
import { db } from './db';
import { sha256, calculateAge, isBirthdayToday, detectScript, detectUserTone, todayContext } from './utils';
import { PRIVACY_HTML, TERMS_HTML, CHAT_HTML } from './html';
import { sendTelegram, sendAnimatedText, deleteTelegramMessage, sendTyping, withTyping, downloadTelegramFile, transcribeVoice, sendSupportToAdmin } from './telegram';
import { getKVHistory, appendKVHistory, getRelevantMemories, lookupUser, setAuthStateHelper } from './memory';
import { callGroq, callCerebras, callOpenRouter, callCloudflareAI, autoExtractMemory, sanitizePersonaLeaks, appendError, BIZLI_VERSION } from './brain';
import { checkRateLimit } from './tools';
import { runAgents } from './agents';
import { handleAdmin } from './admin';
import { detectIntent, handleUserCommand, handleCallback, sendForgotPinRequest, sendSupportPrompt } from './commands';
import { handleAuth, startRecoverFlow } from './auth';
import { searchWebDeep } from './search';
import { handleGroupMessage } from './group';
import { handleAdminStats, handleDashboard, handleWebChat } from './stats';
import { handleLabAgent } from './lab';
import { handleLabQuota } from './quota';
import { runBizliTests, getTestStats } from './tests';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/telegram") return handleTelegram(request, env, ctx);
    if (request.method === "GET" && url.pathname === "/health") return new Response(JSON.stringify({ status: "ok", version: BIZLI_VERSION }), { headers: { "Content-Type": "application/json" } });
    if (request.method === "GET" && url.pathname === "/admin/stats") return handleAdminStats(request, env);
    if (request.method === "GET" && url.pathname === "/admin/set-menu") {
      // One-time: register the native Telegram "/" command menu.
      if (url.searchParams.get("key") !== env.ADMIN_PASSWORD) return new Response("unauthorized", { status: 401 });
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setMyCommands`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commands: [
          { command: "help", description: "all my commands" },
          { command: "search", description: "deep web search — ask me anything" },
          { command: "settings", description: "timezone & daily greetings" },
          { command: "memories", description: "what I remember about you" },
          { command: "status", description: "am I feeling okay?" },
          { command: "feedback", description: "tell my developer what you think" },
          { command: "support", description: "reach my developer" },
          { command: "admin", description: "admin access (password protected)" },
        ] }),
      });
      return new Response(await res.text(), { headers: { "Content-Type": "application/json" } });
    }
    if (request.method === "GET" && url.pathname === "/dashboard") return handleDashboard(request, env);
    if (request.method === "GET" && url.pathname === "/chat") return new Response(CHAT_HTML, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
    if (request.method === "POST" && url.pathname === "/web-chat") return handleWebChat(request, env);
    if (request.method === "GET" && url.pathname === "/lab/quota") return handleLabQuota(request, env);
    if (request.method === "GET" && url.pathname === "/admin/run-tests") {
      const key = url.searchParams.get("key");
      if (key !== env.ADMIN_PASSWORD) return new Response("Unauthorized", { status: 401 });
      await env.BIZLI_MEMORY.delete("last_test_run");
      const { run, passed } = await runBizliTests(env);
      const stats = await getTestStats(env);
      return new Response(JSON.stringify({ run, passed, stats }), { headers: { "Content-Type": "application/json" } });
    }
    if (request.method === "POST" && url.pathname === "/admin/test-chat") {
      // TEMP DIAGNOSTIC (stabilization audit) — full-fidelity probe of the real
      // chat pipeline with a synthetic user. No history/Supabase writes.
      // Remove this route after stabilization.
      if (url.searchParams.get("key") !== env.ADMIN_PASSWORD) return new Response("Unauthorized", { status: 401 });
      const J = (data: any) => new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
      let body: any;
      try { body = await request.json(); } catch { return J({ ok: false, error: "bad json" }); }
      const text = String(body.message || "").trim();
      if (!text) return J({ ok: false, error: "message required" });
      const history: any[] = Array.isArray(body.history) ? body.history.slice(-12) : [];
      const testChatId = "test:" + Math.random().toString(36).slice(2, 10);
      const t0 = Date.now();

      // TEMP: body.deep = true → exercises the exact !search pipeline
      // (searchWebDeep + the same formatting callGroq) with timing breakdown.
      if (body.deep) {
        const raw = await searchWebDeep(env, text);
        const searchMs = Date.now() - t0;
        if (!raw) return J({ ok: true, path: "deep", found: false, searchMs, ms: Date.now() - t0 });
        const t2 = Date.now();
        const formatted = await callGroq(env, [{ role: "user", content: `Present these search results as a DETAILED briefing: 5-8 informative bullet points (a full fact per bullet, with names/numbers/dates where the data has them), a one-line takeaway at the end, then 2-3 of the real source links from the data exactly as shown — prefer official/primary sources (government, official sites, major outlets) first. Complete sentences only — never stop mid-sentence. No filler, no invented links.\n\nQuery: ${text}\n\nData:\n${raw.slice(0, 4000)}` }], "");
        return J({ ok: true, path: "deep", found: true, searchMs, formatMs: Date.now() - t2, rawLen: raw.length, formattedLen: (formatted || "").length, formatted, ms: Date.now() - t0 });
      }

      const memContext = `[CURRENT USER: Test | Member since Jul 2026 | Platform: Telegram | PRIVACY: This is a strictly private 1-on-1 conversation.]`;
      const scriptHint = detectScript(text);
      const langLock = `[🔐 LANGUAGE LOCK — THIS MESSAGE IS IN: ${scriptHint}. Match it EXACTLY in your reply. Same script AND same language — an English message gets an ENGLISH reply (never Hindi/Hinglish), a Hindi message gets Hindi. This applies to your FINAL reply even after using a tool. No exceptions — not even if previous messages were in a different language.]`;
      const toneHint = detectUserTone(text);
      let forcedContext = todayContext() + "\n" + langLock + (toneHint ? "\n" + toneHint : "") + "\n\n" + memContext;
      const messages: any[] = [...history, { role: "user", content: text }];

      // Optional vision probe: body.image = public image URL → attached like a
      // real Telegram photo (mirrors the photo path: tools off, no presearch).
      let imgAttached = false;
      if (body.image) {
        try {
          const ir = await fetch(String(body.image), { headers: { "User-Agent": "Mozilla/5.0 (BizliAI test probe)" } });
          if (ir.ok) {
            const buf = new Uint8Array(await ir.arrayBuffer());
            let bin = "";
            for (let o = 0; o < buf.length; o += 8192) bin += String.fromCharCode(...buf.subarray(o, o + 8192));
            const mime = ir.headers.get("content-type") || "image/jpeg";
            messages[messages.length - 1] = { role: "user", content: [
              { type: "text", text },
              { type: "image_url", image_url: { url: `data:${mime};base64,${btoa(bin)}` } },
            ] };
            imgAttached = true;
          }
        } catch {}
      }

      // Forced-fallback probes — persona-leak testing on the secondary brains
      const force = String(body.force || "");
      if (force) {
        let raw = "";
        if (force === "cerebras") raw = await callCerebras(env, messages, forcedContext);
        else if (force === "openrouter") raw = await callOpenRouter(env, messages, forcedContext);
        else if (force === "cf") raw = await callCloudflareAI(env, messages, forcedContext);
        else return J({ ok: false, error: "force must be cerebras|openrouter|cf" });
        return J({ ok: true, path: `forced:${force}`, reply: sanitizePersonaLeaks(raw), rawReply: raw, ms: Date.now() - t0 });
      }

      // Pure brain-first — mirrors the real pipeline exactly (no presearch layer)
      const path = imgAttached ? "vision" : "brain";
      const useTools = !imgAttached;
      const reply = await callGroq(env, messages, forcedContext, testChatId, useTools, false);
      let toolsUsed: any[] = [];
      try { toolsUsed = JSON.parse(await env.BIZLI_MEMORY.get(`trace_${testChatId}`) || "[]"); } catch {}
      let brain = "";
      try {
        const lb = JSON.parse(await env.BIZLI_MEMORY.get("last_brains") || "[]");
        if (lb[0]) brain = lb[0].brain + (lb[0].key !== undefined && lb[0].key !== null ? ` key ${lb[0].key}` : "");
      } catch {}
      return J({ ok: true, path, reply, tools: toolsUsed, brain, ms: Date.now() - t0 });
    }
    if (url.pathname === "/lab/agent") {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
      if (request.method === "POST") return handleLabAgent(request, env);
    }
    if (request.method === "GET" && url.pathname === "/bizli-cat.png") {
      const imgData = await env.BIZLI_MEMORY.get("bizli_cat_image", { type: "arrayBuffer" });
      if (!imgData) return new Response("Not found", { status: 404 });
      return new Response(imgData, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
    }
    if (request.method === "GET" && url.pathname === "/bizli-real.jpg") {
      // Bizli's REAL photo — the actual cat she's named after (memorial).
      const imgData = await env.BIZLI_MEMORY.get("bizli_real_photo", { type: "arrayBuffer" });
      if (!imgData) return new Response("Not found", { status: 404 });
      return new Response(imgData, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" } });
    }
    if (request.method === "GET" && url.pathname === "/bizli-robot.png") {
      const imgData = await env.BIZLI_MEMORY.get("bizli_robot_image", { type: "arrayBuffer" });
      if (!imgData) return new Response("Not found", { status: 404 });
      return new Response(imgData, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
    }
    if (request.method === "GET" && url.pathname === "/bizli-hologram.mp4") {
      const vidData = await env.BIZLI_MEMORY.get("bizli_hologram_video", { type: "arrayBuffer" });
      if (!vidData) return new Response("Not found", { status: 404 });
      return new Response(vidData, { headers: { "Content-Type": "video/mp4", "Cache-Control": "public, max-age=86400" } });
    }
    if (request.method === "GET" && url.pathname === "/bizli-hologram.png") {
      const imgData = await env.BIZLI_MEMORY.get("bizli_hologram_image", { type: "arrayBuffer" });
      if (!imgData) return new Response("Not found", { status: 404 });
      return new Response(imgData, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" } });
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

  // Native / menu aliases (registered with Telegram via setMyCommands) → ! commands
  {
    const firstWord = text.trim().split(/\s+/)[0].toLowerCase().replace(/@[a-z0-9_]+$/i, "");
    const slashAliases: Record<string, string> = { "/help": "!help", "/search": "!search", "/settings": "!settings", "/memories": "!memories", "/status": "!status", "/feedback": "!feedback", "/support": "!support", "/admin": "!admin" };
    if (slashAliases[firstWord]) text = slashAliases[firstWord] + text.trim().slice(text.trim().split(/\s+/)[0].length);
  }

  const lower = text.trim().toLowerCase();
  if (lower === "!forgotpin" || lower === "!recover" || lower === "!support" || lower.startsWith("!support ")) {
    // Pre-auth intercept: these must work for logged-out users and during
    // maintenance. Implementations are shared (commands.ts / auth.ts).
    const userInfo = await lookupUser(env, platform, chatId);
    if (lower === "!forgotpin") {
      await sendForgotPinRequest(env, chatId, platform, userInfo);
    } else if (lower === "!recover") {
      await startRecoverFlow(env, chatId);
    } else if (lower === "!support") {
      await sendSupportPrompt(env, chatId);
    } else {
      await sendSupportToAdmin(env, chatId, platform, "other", text.trim().slice(9).trim(), userInfo);
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

  if (await handleAdmin(env, chatId, text, msg.message_id)) return new Response("ok");

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

  // Never-silent guard: a throw inside a command used to vanish without a reply
  // (the silent /status bug, 2026-07-04) — now it's logged and the user hears back.
  try {
    if (await handleUserCommand(env, chatId, text, userId, platform)) return new Response("ok");
    if (!hasPhoto && !hasSticker && !hasAnimation && await detectIntent(env, text, chatId, userId)) return new Response("ok");
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error("[Command Error]", errMsg);
    appendError(env, `cmd chat=${chatId}: ${errMsg.slice(0, 150)}`).catch(() => {});
    await sendTelegram(env, chatId, "oops, that one hiccupped on my end — try again! 😅");
    return new Response("ok");
  }

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
    } else if (hasAnimation) {
      // GIF vibe-reading: Telegram animations carry a thumbnail frame — let her
      // actually SEE the GIF (the vision model also handles tools, so send_gif
      // still works). Soft rate-limit: if the vision budget is spent, keep the
      // text placeholder instead of blocking the exchange.
      const thumbId = msg.animation?.thumbnail?.file_id || null;
      if (thumbId) {
        const rlGif = await checkRateLimit(env, chatId, "vision");
        if (rlGif.allowed) {
          const file = await downloadTelegramFile(env, thumbId);
          if (file) {
            userMessage = {
              role: "user",
              content: [
                { type: "text", text: "[User sent a GIF — this image is a still frame from it. Read the vibe from the frame and react like a real friend (NEVER describe it). Reply with send_gif to match their energy — GIF-for-GIF.]" },
                { type: "image_url", image_url: { url: `data:${file.mime};base64,${file.base64}` } },
              ],
            };
            historyText = "[sent a GIF]";
          }
        }
      }
    }

    const messages = [...kvHistory.map((m: any) => ({ role: m.role, content: m.content })), userMessage];

    const scriptHint = detectScript(text);
    const langLock = `[🔐 LANGUAGE LOCK — THIS MESSAGE IS IN: ${scriptHint}. Match it EXACTLY in your reply. Same script AND same language — an English message gets an ENGLISH reply (never Hindi/Hinglish), a Hindi message gets Hindi. This applies to your FINAL reply even after using a tool. No exceptions — not even if previous messages were in a different language.]`;

    const toneHint = detectUserTone(text);
    const userTz = await env.BIZLI_MEMORY.get(`tz_${userId}`).catch(() => null);
    let forcedContext = todayContext(userTz || undefined) + "\n" + langLock + (toneHint ? "\n" + toneHint : "") + (memContext ? "\n\n" + memContext : "");
    // BRAIN-FIRST, fully (the presearch keyword layer is DEAD): every message
    // goes straight to the model + tools in every language — the model decides
    // when to search. "Trillions of words — we cannot hardcode everything."
    // Deep/detailed search output lives in the !search command instead.
    let reply = await withTyping(env, chatId, callGroq(env, messages, forcedContext, chatId, useTools, hasAnimation));
    if (reply === "IMAGE_GENERATED" || reply === "GIF_SENT") return new Response("ok");
    let alreadySent = false;
    let wasRichCard = false;
    if (reply.startsWith("RICH_SENT:")) { reply = reply.slice(10); alreadySent = true; wasRichCard = true; }
    // NEVER-SILENT: the persona-leak sanitizer can eat an entire reply (e.g.
    // an honest self-description that used banned phrasing) — she must never
    // just go quiet on a user.
    if (!alreadySent && !reply.trim()) reply = "okay my thoughts scrambled for a sec 😅 say that again?";
    await appendKVHistory(env, userId, "user", historyText);
    await appendKVHistory(env, userId, "assistant", reply);
    await db(env, "messages", "POST", { user_id: userId, platform, role: "user", content: historyText });
    await db(env, "messages", "POST", { user_id: userId, platform, role: "assistant", content: reply });
    await db(env, `users?id=eq.${userId}`, "PATCH", { last_active: new Date().toISOString() });

    const isInfoReply = wasRichCard || /https?:\/\/|🔗/.test(reply);

    if (!alreadySent) {
      let kb: any = undefined;
      // Her own reply routing someone to support (e.g. creator-privacy
      // boundary) gets a one-tap flash button — no typing needed.
      if (/!support|\/support/i.test(reply)) {
        kb = { reply_markup: { inline_keyboard: [[
          { text: "🆘 reach my developer", callback_data: `support_cat:${chatId}|creator` },
        ]] } };
      } else if (isInfoReply) {
        try {
          const fbId = `${Date.now()}`;
          await env.BIZLI_MEMORY.put(`fb_ctx_${fbId}`, JSON.stringify({ userId, platform, u: historyText.slice(0, 300), r: reply.slice(0, 500) }), { expirationTtl: 86400 });
          kb = { reply_markup: { inline_keyboard: [[
            { text: "👍 accurate", callback_data: `fb:up:${fbId}` },
            { text: "👎 wrong", callback_data: `fb:down:${fbId}` },
          ]] } };
        } catch {}
      }
      // ChatGPT-style text forming; feedback buttons attach on the final edit
      await sendAnimatedText(env, chatId, reply, kb);
    }
    setTimeout(() => autoExtractMemory(env, userId, text, reply).catch(() => {}), 0);
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error("[Worker Error]", errMsg);
    appendError(env, `chat=${chatId}: ${errMsg.slice(0, 150)}`).catch(() => {});
    if (errMsg.includes("exhausted")) {
      await sendTelegram(env, chatId, "give me a sec bestie, just cooling down... try again in a moment! ⏳");
    } else {
      await sendTelegram(env, chatId, "oops, give me a sec — try again! 😅");
    }
  }

  return new Response("ok");
}
