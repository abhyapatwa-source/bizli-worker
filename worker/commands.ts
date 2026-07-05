import type { Env } from './types';
import { db } from './db';
import { getGroqKeys, cityToTimezone, inferTimezoneFromLangCode, calculateAge, parseDOB } from './utils';
import { sendTelegram, sendAnimatedText, editTelegramMessage, answerCallback, sendSupportToAdmin } from './telegram';
import { isAdminSession, setAuthStateHelper, getAuthStateHelper, clearAuthState, getKVHistory, getUserMemories, lookupUser, saveMemory } from './memory';
import { searchWebDeep } from './search';
import { checkRateLimit, RATE_LIMITS } from './tools';
import { callGroq, getGroqStatus } from './brain';
import { runHelpMenu, runAdminMenu, runAgentCommand, approveUser, denyUser, blockUser, getUserCardItem, startAdminRecover, clearAdminLocks } from './admin';


// Shared single implementations — used by handleUserCommand (logged-in users,
// all platforms) AND the index.ts pre-auth intercept (works during maintenance
// and for logged-out users). Never inline-copy these flows again.
// `via` (optional) replaces the user-facing send — the help menu's ▶ Run
// passes it to render the result inside the menu message instead.
export async function sendForgotPinRequest(env: Env, chatId: string, platform: string, u: any, via?: (text: string, rows?: any[]) => Promise<void>): Promise<void> {
  await sendTelegram(env, env.ADMIN_CHAT_ID,
    `🔑 PIN Reset\n\nName: ${u?.display_name || "Unknown"}\nCode: ${u?.identity_code || "N/A"}\nGmail: ${u?.gmail || "N/A"}\nID: ${u?.id || chatId}\nPlatform: ${platform}`,
    { reply_markup: { inline_keyboard: [[{ text: "🔑 Reset PIN", callback_data: `resetpin:${u?.id || chatId}` }, { text: "💬 Reply", callback_data: `reply:${chatId}` }]] } }
  );
  const confirm = "request sent! admin will reset your PIN shortly 🙏";
  if (via) await via(confirm);
  else await sendTelegram(env, chatId, confirm);
}

export async function sendSupportPrompt(env: Env, chatId: string, via?: (text: string, rows?: any[]) => Promise<void>): Promise<void> {
  const text = "what do you need help with?";
  const rows = [[{ text: "🔑 PIN Issue", callback_data: `support_cat:${chatId}|pin` }, { text: "🔐 Can't Login", callback_data: `support_cat:${chatId}|login` }, { text: "💬 Other", callback_data: `support_cat:${chatId}|other` }]];
  if (via) await via(text, rows);
  else await sendTelegram(env, chatId, text, { reply_markup: { inline_keyboard: rows } });
}

// Settings card builder — shared by !settings (typed + ▶ Run) and the
// st:greet_* toggle refresh, so the card can never go stale or drift.
export async function buildSettingsCard(env: Env, userId: string): Promise<{ text: string; rows: any[] }> {
  const off = await env.BIZLI_MEMORY.get(`greet_off_${userId}`);
  const explicitTz = await env.BIZLI_MEMORY.get(`tz_${userId}`);
  const u = (await db(env, `users?id=eq.${userId}&select=city&limit=1`))?.[0];
  const cityTz = u?.city ? cityToTimezone(u.city) : "";
  const lang = await env.BIZLI_MEMORY.get(`lang_${userId}`);
  const inferredTz = lang ? inferTimezoneFromLangCode(lang) : "";
  const activeTz = explicitTz || cityTz || inferredTz;
  const tzSource = explicitTz ? "" : cityTz ? "from your city" : inferredTz ? "auto-detected" : "";
  return {
    text: `⚙️ Settings\n\n` +
      `🕐 Timezone: ${activeTz || "not set (UTC)"}${tzSource ? ` (${tzSource})` : ""}\n` +
      `🌅 Daily greetings: ${off ? "OFF" : "ON"}\n\n` +
      `To set timezone, type:\n!timezone set Asia/Kolkata`,
    rows: [
      [off
        ? { text: "🌅 Turn greetings ON", callback_data: "st:greet_on" }
        : { text: "🌙 Turn greetings OFF", callback_data: "st:greet_off" }],
      [{ text: "📍 Update my city", callback_data: "hcmd:editloc" }],
    ],
  };
}

export async function detectIntent(env: Env, text: string, chatId: string, userId: string): Promise<boolean> {
  const lower = text.toLowerCase().trim();

  const imageKw = ["draw ", "paint ", "sketch ", "illustrate ", "create an image", "generate an image", "make a picture", "make an image", "show me a picture of", "create a photo", "!imagine", "!image", "banao image", "image banao", "photo banao", "tasveer banao", "give me a pic of", "give me a photo of", "give me an image of", "show me a pic of", "generate a pic", "make a pic"];
  if (imageKw.some(k => lower.includes(k))) {
    // Strip the verb AND filler ("draw me a golden bird" → "golden bird", not "me a golden bird")
    const prompt = text.replace(/^(draw|paint|sketch|illustrate|create an image of|generate an image of|make a picture of|make an image of|show me a picture of|create a photo of)\s+(me\s+|us\s+)?(a\s+|an\s+|the\s+)?/i, "").trim();
    if (prompt.length > 2) {
      const rl = await checkRateLimit(env, chatId, "image");
      if (!rl.allowed) {
        await sendTelegram(env, chatId, `image limit reached for now — try again in ${rl.resetInMin} min 🎨 (keeps things running smoothly for everyone!)`);
        return true;
      }
      await setAuthStateHelper(env, chatId, { step: "image_style", userId, prompt });
      await sendTelegram(env, chatId, "what style? 🎨\n\nrealistic · anime · artistic · cartoon · sketch · cinematic\n\nOr just say 'skip'");
      return true;
    }
  }

  return false;
}

export async function handleCallback(env: Env, callbackQuery: any): Promise<void> {
  const fromId = String(callbackQuery.from.id);
  const cbMessageId: number | undefined = callbackQuery.message?.message_id;
  const data: string = callbackQuery.data || "";
  const cbId: string = callbackQuery.id;

  if (data.startsWith("start_reg:")) {
    const cid = data.slice("start_reg:".length);
    await answerCallback(env, cbId, "✨");
    await setAuthStateHelper(env, cid, { step: "reg_name" });
    await sendTelegram(env, cid, "yay! 🎉 let's get you set up — it's quick.\n\nFirst, what's your name?");
    return;
  }
  if (data.startsWith("start_login:")) {
    const cid = data.slice("start_login:".length);
    await answerCallback(env, cbId, "🔑");
    await setAuthStateHelper(env, cid, { step: "login_code" });
    await sendTelegram(env, cid, "welcome back! 😊 what's your identity code? (looks like BZ-XXXX)\n\n(type cancel anytime to start over)");
    return;
  }
  if (data.startsWith("start_recover:")) {
    const cid = data.slice("start_recover:".length);
    await answerCallback(env, cbId, "🔁");
    await setAuthStateHelper(env, cid, { step: "recover_gmail" });
    await sendTelegram(env, cid, "no problem! 😊 what's the Gmail you registered with? I'll help you recover your account.");
    return;
  }

  if (data.startsWith("news_yes:")) {
    await answerCallback(env, cbId, "");
    await sendTelegram(env, fromId, "just ask me for news anytime — like \"latest news\" or \"news about cricket\" 📰");
    return;
  }
  if (data === "news_no") {
    await answerCallback(env, cbId, "👍");
    return;
  }

  if (data.startsWith("help:")) {
    const payload = data.slice("help:".length);
    if (payload.startsWith("r:")) {
      // ▶ Run: execute the card item's command and morph the result INTO the
      // menu message — its own buttons + Back/Main-Menu rows (no extra msgs).
      const [, gs, is] = payload.split(":");
      const item = getUserCardItem(parseInt(gs), parseInt(is));
      if (item?.run) {
        const identity = await db(env, `platform_identities?platform=eq.telegram&platform_id=eq.${fromId}&limit=1`);
        const userId = identity?.[0]?.user_id;
        if (!userId) { await answerCallback(env, cbId, ""); await sendTelegram(env, fromId, "please log in first"); return; }
        await answerCallback(env, cbId, "▶️");
        const nav = [[{ text: "⬅️ Back", callback_data: `help:c:${gs}` }, { text: "🏠 Main Menu", callback_data: "help:m" }]];
        await handleUserCommand(env, fromId, item.run, userId, "telegram", cbMessageId ? { messageId: cbMessageId, nav } : undefined);
      } else {
        await answerCallback(env, cbId, "");
        await runHelpMenu(env, fromId, "m", cbMessageId);
      }
      return;
    }
    if (payload.startsWith("a:")) {
      // ✍️ Type it here: ask for the value in the card; the next plain
      // message becomes the command's argument (await_input, auth.ts).
      const [, gs, is] = payload.split(":");
      const item = getUserCardItem(parseInt(gs), parseInt(is));
      if (item?.ask) {
        const identity = await db(env, `platform_identities?platform=eq.telegram&platform_id=eq.${fromId}&limit=1`);
        const userId = identity?.[0]?.user_id;
        if (!userId) { await answerCallback(env, cbId, ""); await sendTelegram(env, fromId, "please log in first"); return; }
        await setAuthStateHelper(env, fromId, { step: "await_input", cmd: item.cmd.split(" ")[0], userId });
        await answerCallback(env, cbId, "✍️");
        const askText = `${item.ask}\n\n(type "cancel" to skip)`;
        const nav = { inline_keyboard: [[{ text: "⬅️ Back", callback_data: `help:c:${gs}` }, { text: "🏠 Main Menu", callback_data: "help:m" }]] };
        if (cbMessageId) await editTelegramMessage(env, fromId, cbMessageId, askText, nav);
        else await sendTelegram(env, fromId, askText);
      } else {
        await answerCallback(env, cbId, "");
        await runHelpMenu(env, fromId, "m", cbMessageId);
      }
      return;
    }
    // Navigating away drops any pending "type the value" wait so the next
    // plain message goes back to the brain, not a stale command.
    const pending = await getAuthStateHelper(env, fromId);
    if (pending?.step === "await_input") await clearAuthState(env, fromId);
    await answerCallback(env, cbId, "");
    await runHelpMenu(env, fromId, payload, cbMessageId);
    return;
  }

  if (data.startsWith("hcmd:")) {
    await answerCallback(env, cbId, "");
    const cmd = data.slice(5);
    const identity = await db(env, `platform_identities?platform=eq.telegram&platform_id=eq.${fromId}&limit=1`);
    const userId = identity?.[0]?.user_id;
    if (!userId) { await sendTelegram(env, fromId, "please log in first"); return; }
    const directCmds: Record<string, string> = {
      details: "!mydetails", memories: "!memories", greetings: "!greetings",
      settings: "!settings", changepin: "!changepin", support: "!support",
      forgotpin: "!forgotpin", recover: "!recover", status: "!status", usage: "!myusage",
      logout: "!logout",
    };
    if (directCmds[cmd]) { await handleUserCommand(env, fromId, directCmds[cmd], userId); return; }
    // "Just type the value" prompts — the next plain message is treated as the
    // command's argument (await_input state, consumed in auth.ts handleAuth).
    const asks: Record<string, { cmd: string; prompt: string }> = {
      editname:  { cmd: "!editname", prompt: "what should I call you? just type your new name 👇" },
      editgmail: { cmd: "!editgmail", prompt: "what's your new email? just type it 👇" },
      editdob:   { cmd: "!editdob", prompt: "when's your birthday? just type it (e.g. 15 Jan 2000) 👇" },
      editloc:   { cmd: "!editlocation", prompt: "which city are you in? just type it (e.g. Mumbai, India) 👇" },
      remember:  { cmd: "!remember", prompt: "what should I remember? just type it 👇" },
      forget:    { cmd: "!forget", prompt: "which memory number should I forget? just type the number (or \"all\") 👇" },
      feedback:  { cmd: "!feedback", prompt: "tell me anything — just type your feedback 👇" },
      search:    { cmd: "!search", prompt: "what should I search for? just type it 👇" },
    };
    if (asks[cmd]) {
      await setAuthStateHelper(env, fromId, { step: "await_input", cmd: asks[cmd].cmd, userId });
      await sendTelegram(env, fromId, `${asks[cmd].prompt}\n\n(type "cancel" to skip)`);
      return;
    }
    return;
  }

  if (data.startsWith("fb:")) {
    const parts = data.split(":");
    const rating = parts[1] === "up" ? "up" : "down";
    const fbId = parts[2];
    try {
      const ctxRaw = await env.BIZLI_MEMORY.get(`fb_ctx_${fbId}`);
      const ctx = ctxRaw ? JSON.parse(ctxRaw) : null;
      await db(env, "feedback", "POST", {
        user_id: ctx?.userId || null,
        platform: ctx?.platform || "telegram",
        rating,
        user_message: ctx?.u || null,
        bot_reply: ctx?.r || null,
      });
    } catch {}
    await answerCallback(env, cbId, rating === "up" ? "thanks! 💛" : "thanks, I'll do better 🙏");
    return;
  }

  if (data.startsWith("support_cat:")) {
    const payload = data.slice("support_cat:".length);
    const pipeIdx = payload.indexOf("|");
    const userChatId = payload.slice(0, pipeIdx);
    const category = payload.slice(pipeIdx + 1);
    await answerCallback(env, cbId, "✅ Got it");
    if (category === "other") {
      await setAuthStateHelper(env, userChatId, { step: "support_typing", category });
      await sendTelegram(env, userChatId, "tell me what's going on:");
    } else {
      const userInfo = await lookupUser(env, "telegram", userChatId);
      await sendSupportToAdmin(env, userChatId, "telegram", category, null, userInfo);
      await sendTelegram(env, userChatId, "support request sent! the admin will get back to you shortly 🙏");
    }
    return;
  }

  if (data === "st:greet_on" || data === "st:greet_off") {
    const identity = await db(env, `platform_identities?platform=eq.telegram&platform_id=eq.${fromId}&limit=1`);
    const uid = identity?.[0]?.user_id;
    if (!uid) { await answerCallback(env, cbId, "please log in first"); return; }
    if (data === "st:greet_on") {
      await env.BIZLI_MEMORY.delete(`greet_off_${uid}`);
      await answerCallback(env, cbId, "morning & night messages back on 🌅");
    } else {
      await env.BIZLI_MEMORY.put(`greet_off_${uid}`, "1", { expirationTtl: 31536000 });
      await answerCallback(env, cbId, "got it — no more morning/night messages 🌙");
    }
    // Refresh the settings card in place so the toggle never shows stale state.
    if (cbMessageId) {
      const card = await buildSettingsCard(env, uid);
      await editTelegramMessage(env, fromId, cbMessageId, card.text,
        { inline_keyboard: [...card.rows, [{ text: "🏠 Main Menu", callback_data: "help:m" }]] });
    }
    return;
  }

  if (data.startsWith("delme:")) {
    const uid = data.slice("delme:".length);
    const identity = await db(env, `platform_identities?platform=eq.telegram&platform_id=eq.${fromId}&limit=1`);
    if (!identity?.[0]?.user_id || identity[0].user_id !== uid) {
      await answerCallback(env, cbId, "that's not your account");
      return;
    }
    await answerCallback(env, cbId, "");
    // Children first (FK), then the user row, then KV traces.
    await db(env, `memories?user_id=eq.${uid}`, "DELETE");
    await db(env, `messages?user_id=eq.${uid}`, "DELETE");
    await db(env, `feedback?user_id=eq.${uid}`, "DELETE");
    await db(env, `platform_identities?user_id=eq.${uid}`, "DELETE");
    await db(env, `users?id=eq.${uid}`, "DELETE");
    const kvKeys = [`history_${uid}`, `tz_${uid}`, `greet_off_${uid}`, `lang_${uid}`, `logged_out_${fromId}`, `auth_${fromId}`, `greeted_${fromId}`,
      `rl_image_${fromId}`, `rl_search_${fromId}`, `rl_research_${fromId}`, `rl_vision_${fromId}`];
    await Promise.all(kvKeys.map(k => env.BIZLI_MEMORY.delete(k).catch(() => {})));
    const goodbye = "done — everything's deleted. it was really nice knowing you 💛 if you ever want to come back, just send /start";
    if (cbMessageId) await editTelegramMessage(env, fromId, cbMessageId, goodbye, { inline_keyboard: [] });
    else await sendTelegram(env, fromId, goodbye);
    await sendTelegram(env, env.ADMIN_CHAT_ID, `🗑️ Self-deletion: a user deleted their account + all data (id ${uid}).`);
    return;
  }
  if (data === "delme_no") {
    await answerCallback(env, cbId, "💛");
    const stay = "phew — staying right here with you 💛";
    if (cbMessageId) await editTelegramMessage(env, fromId, cbMessageId, stay, { inline_keyboard: [[{ text: "🏠 Main Menu", callback_data: "help:m" }]] });
    else await sendTelegram(env, fromId, stay);
    return;
  }

  // Input-confirm buttons (await_input → confirm_input flow, state in auth.ts).
  if (data === "ci:yes" || data === "ci:retype" || data === "ci:no") {
    const st = await getAuthStateHelper(env, fromId);
    if (st?.step !== "confirm_input" || !st.cmd) { await answerCallback(env, cbId, "that expired — start again from the menu 🙂"); return; }
    if (data === "ci:yes") {
      await clearAuthState(env, fromId);
      await answerCallback(env, cbId, "✅");
      await handleUserCommand(env, fromId, `${st.cmd} ${st.value}`, st.userId, "telegram",
        cbMessageId ? { messageId: cbMessageId, nav: [[{ text: "🏠 Main Menu", callback_data: "help:m" }]] } : undefined);
    } else if (data === "ci:retype") {
      await setAuthStateHelper(env, fromId, { step: "await_input", cmd: st.cmd, userId: st.userId });
      await answerCallback(env, cbId, "✍️");
      const t = "okay — type it again 👇";
      if (cbMessageId) await editTelegramMessage(env, fromId, cbMessageId, t, { inline_keyboard: [] });
      else await sendTelegram(env, fromId, t);
    } else {
      await clearAuthState(env, fromId);
      await answerCallback(env, cbId, "👍");
      const t = "no problem, cancelled 👍";
      if (cbMessageId) await editTelegramMessage(env, fromId, cbMessageId, t, { inline_keyboard: [[{ text: "🏠 Main Menu", callback_data: "help:m" }]] });
      else await sendTelegram(env, fromId, t);
    }
    return;
  }

  if (data.startsWith("admrec:")) {
    // Recover-by-gmail entry — must work for the LOCKED-OUT chat (any user)
    await answerCallback(env, cbId, "");
    await startAdminRecover(env, fromId);
    return;
  }

  if (fromId !== env.ADMIN_CHAT_ID) { await answerCallback(env, cbId, "Not authorized."); return; }

  if (data.startsWith("admunlock:")) {
    const target = data.slice(10);
    await clearAdminLocks(env, target);
    await answerCallback(env, cbId, "🔓 unlocked");
    await sendTelegram(env, fromId, `🔓 admin locks cleared for chat ${target}.`);
    return;
  }

  const colonIdx = data.indexOf(":");
  const action = data.slice(0, colonIdx);
  const payload = data.slice(colonIdx + 1);

  if (action === "agent") {
    if (!await isAdminSession(env, fromId)) { await answerCallback(env, cbId, "Admin session expired — type !admin <password>"); return; }
    await answerCallback(env, cbId, "⏳");
    await runAgentCommand(env, fromId, payload, cbMessageId);
    return;
  }

  if (action === "adm") {
    if (!await isAdminSession(env, fromId)) { await answerCallback(env, cbId, "Admin session expired — type !admin <password>"); return; }
    await answerCallback(env, cbId, "");
    await runAdminMenu(env, fromId, payload, cbMessageId);
    return;
  }

  if (action === "approve") {
    await approveUser(env, payload);
    await answerCallback(env, cbId, "✅ Approved");
    await sendTelegram(env, fromId, `✅ Approved`);
  } else if (action === "decline") {
    await denyUser(env, payload);
    await answerCallback(env, cbId, "❌ Declined");
    await sendTelegram(env, fromId, "❌ Declined");
  } else if (action === "block") {
    await blockUser(env, payload);
    await answerCallback(env, cbId, "🚫 Blocked");
    await sendTelegram(env, fromId, "🚫 Blocked");
  } else if (action === "resetpin") {
    let uid = payload;
    if (!payload.includes("-")) {
      const id = await db(env, `platform_identities?platform=eq.telegram&platform_id=eq.${payload}&limit=1`);
      if (id?.[0]) uid = id[0].user_id;
    }
    await db(env, `users?id=eq.${uid}`, "PATCH", { pin_hash: null });
    await env.BIZLI_MEMORY.delete(`pin_lock_${uid}`);
    await env.BIZLI_MEMORY.delete(`pin_att_${uid}`);
    const id = await db(env, `platform_identities?user_id=eq.${uid}&limit=1`);
    if (id?.[0]) {
      await sendTelegram(env, id[0].platform_id, "your PIN has been reset 🔑 Please set a new 4-digit PIN:");
      await setAuthStateHelper(env, id[0].platform_id, { step: "set_pin", userId: uid });
    }
    await answerCallback(env, cbId, "🔑 Reset");
    await sendTelegram(env, fromId, "🔑 PIN reset done");
  } else if (action === "reply") {
    await env.BIZLI_MEMORY.put(`admin_reply_to_${fromId}`, payload, { expirationTtl: 3600 });
    await answerCallback(env, cbId, "Type your reply");
    await sendTelegram(env, fromId, `💬 Replying to ${payload}. Type message or !close to end.`);
  } else if (action === "verify_recover") {
    const [uid, userChatId] = payload.split("|");
    const u = (await db(env, `users?id=eq.${uid}&limit=1`))?.[0];
    await db(env, `users?id=eq.${uid}`, "PATCH", { pin_hash: null });
    await env.BIZLI_MEMORY.delete(`pin_lock_${uid}`);
    await setAuthStateHelper(env, userChatId, { step: "set_pin", userId: uid });
    await sendTelegram(env, userChatId, `✅ Identity verified!\n\nYour code: ${u?.identity_code}\n\nSet a new 4-digit PIN:`);
    await answerCallback(env, cbId, "✅ Verified");
    await sendTelegram(env, fromId, `✅ Recovery verified for ${u?.display_name}`);
  }
}

// inPlace (set by the help menu's ▶ Run): render the command's result INSIDE
// the menu message — its own buttons merged with the menu's Back/Main-Menu
// rows. Typed commands (inPlace absent) send a fresh message as always.
export async function handleUserCommand(env: Env, chatId: string, text: string, userId: string, platform = "telegram", inPlace?: { messageId: number; nav: any[] }): Promise<boolean> {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const reply = async (text: string, rows: any[] = []) => {
    if (inPlace) await editTelegramMessage(env, chatId, inPlace.messageId, text, { inline_keyboard: [...rows, ...inPlace.nav] });
    else if (rows.length) await sendTelegram(env, chatId, text, { reply_markup: { inline_keyboard: rows } });
    else await sendTelegram(env, chatId, text);
  };

  if (lower === "!help") {
    await runHelpMenu(env, chatId, "menu");
    return true;
  }

  if (lower === "!status") {
    // Anatomy-only for users — never expose provider names, key names, or key counts.
    const keys = getGroqKeys(env);
    const gStatus = await getGroqStatus(env);
    const now = Date.now();
    const ready = keys.filter((_, i) => (gStatus.cooldowns[i] || 0) <= now).length;
    const healthy = keys.length === 0 ? false : ready / keys.length >= 0.3;
    const mems = await getUserMemories(env, userId);
    const hist = (await getKVHistory(env, userId)).filter((m: any) => m.role !== "system").length;
    const userTz = (await env.BIZLI_MEMORY.get(`tz_${userId}`)) || "UTC";
    const localTime = new Date().toLocaleTimeString("en-US", { timeZone: userTz, hour: "2-digit", minute: "2-digit", hour12: true });
    const statusMsg =
      (healthy ? `💛 feeling great!\n\n🧠 brain: all regions healthy\n` : `💛 I'm here! thinking a little slower than usual rn, but fully awake\n\n🧠 brain: some regions resting\n`) +
      `💾 memory: ${mems.length} things I remember about you\n` +
      `💬 short-term: ${hist}/15 messages in my head\n` +
      `🕐 your time: ${localTime} (${userTz})\n\n` +
      `_!settings to change timezone & greetings_`;
    await reply(statusMsg);
    return true;
  }

  if (lower === "!timezone") {
    const tz = await env.BIZLI_MEMORY.get(`tz_${userId}`);
    await sendTelegram(env, chatId,
      `🕐 Your timezone: ${tz || "not set (UTC)"}\n\nSet it with:\n!timezone set Asia/Kolkata\n!timezone set America/New_York\n!timezone set Europe/London\n!timezone set Asia/Dubai\n\nOr type any valid timezone name after !timezone set`
    );
    return true;
  }
  if (lower.startsWith("!timezone set ")) {
    const tz = trimmed.slice(14).trim();
    if (!tz.includes("/") || tz.length > 40) {
      await sendTelegram(env, chatId, "invalid timezone — use format like Asia/Kolkata or America/New_York");
      return true;
    }
    try {
      new Date().toLocaleTimeString("en-US", { timeZone: tz });
      await env.BIZLI_MEMORY.put(`tz_${userId}`, tz, { expirationTtl: 31536000 });
      const localTime = new Date().toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true });
      await sendTelegram(env, chatId, `✅ timezone set to ${tz}!\nYour current time: ${localTime} 🕐`);
    } catch {
      await sendTelegram(env, chatId, `couldn't recognise "${tz}" — try something like Asia/Kolkata or Europe/London`);
    }
    return true;
  }

  if (lower === "!greetings off") {
    await env.BIZLI_MEMORY.put(`greet_off_${userId}`, "1", { expirationTtl: 31536000 });
    await sendTelegram(env, chatId, "got it — no more morning/night messages from me. type !greetings on to bring them back");
    return true;
  }
  if (lower === "!greetings on") {
    await env.BIZLI_MEMORY.delete(`greet_off_${userId}`);
    await sendTelegram(env, chatId, "morning and night messages are back on");
    return true;
  }
  if (lower === "!greetings" || lower === "!settings") {
    const card = await buildSettingsCard(env, userId);
    await reply(card.text, card.rows);
    return true;
  }

  if (lower === "!myusage") {
    const lines: string[] = [];
    for (const feature of Object.keys(RATE_LIMITS) as (keyof typeof RATE_LIMITS)[]) {
      const cfg = RATE_LIMITS[feature];
      const raw = await env.BIZLI_MEMORY.get(`rl_${feature}_${chatId}`);
      const bucket = raw ? JSON.parse(raw) : { count: 0, resetAt: 0 };
      const now = Date.now();
      const used = bucket.resetAt > now ? bucket.count : 0;
      const resetMin = bucket.resetAt > now ? Math.ceil((bucket.resetAt - now) / 60000) : 0;
      lines.push(`${feature}: ${used}/${cfg.max}${resetMin ? ` (resets in ${resetMin}m)` : ""}`);
    }
    await reply(`📈 Your usage:\n\n${lines.join("\n")}`);
    return true;
  }

  if (lower === "!mydetails") {
    const u = (await db(env, `users?id=eq.${userId}&limit=1`))?.[0];
    const dobLine = u?.date_of_birth ? `\nDate of Birth: ${u.date_of_birth} (Age: ${calculateAge(u.date_of_birth)})` : "";
    const cityLine = u?.city ? `\nLocation: ${u.city}` : "";
    await reply(
      `👤 Your Details\n\nName: ${u?.display_name}\nCode: ${u?.identity_code}\nGmail: ${u?.gmail || "N/A"}${dobLine}${cityLine}\nStatus: ${u?.status}\n\nSave your code — needed to login anywhere.\n\nTap below to edit anything 👇`,
      [
        [{ text: "✏️ Name", callback_data: "hcmd:editname" }, { text: "📧 Email", callback_data: "hcmd:editgmail" }],
        [{ text: "📅 DOB", callback_data: "hcmd:editdob" }, { text: "📍 Location", callback_data: "hcmd:editloc" }],
        [{ text: "🔑 Change PIN", callback_data: "hcmd:changepin" }],
      ]);
    return true;
  }

  if (lower.startsWith("!editname ")) {
    const newName = trimmed.slice(10).trim().slice(0, 30);
    if (!newName) { await reply("usage: !editname <name>"); return true; }
    const u = (await db(env, `users?id=eq.${userId}&limit=1`))?.[0];
    await db(env, `users?id=eq.${userId}`, "PATCH", { display_name: newName });
    await reply(`✅ name updated to ${newName}!`);
    await sendTelegram(env, env.ADMIN_CHAT_ID, `✏️ Name change: ${u?.identity_code} | ${u?.display_name} → ${newName}`);
    return true;
  }

  if (lower.startsWith("!editgmail ")) {
    const newGmail = trimmed.slice(11).trim().toLowerCase();
    if (!newGmail.includes("@")) { await reply("hmm, that doesn't look like a valid email — it should look like name@gmail.com"); return true; }
    const u = (await db(env, `users?id=eq.${userId}&limit=1`))?.[0];
    await db(env, `users?id=eq.${userId}`, "PATCH", { gmail: newGmail });
    await reply(`✅ email updated!`);
    await sendTelegram(env, env.ADMIN_CHAT_ID, `✏️ Gmail change: ${u?.identity_code} | ${u?.gmail} → ${newGmail}`);
    return true;
  }

  if (lower.startsWith("!editdob ")) {
    const input = trimmed.slice(9).trim();
    const parsed = parseDOB(input);
    const age = parsed ? calculateAge(parsed) : -1;
    if (!parsed || age < 5 || age > 120) { await reply("couldn't read that date — try something like 15 Jan 2000"); return true; }
    const u = (await db(env, `users?id=eq.${userId}&limit=1`))?.[0];
    await db(env, `users?id=eq.${userId}`, "PATCH", { date_of_birth: parsed });
    await reply(`✅ date of birth updated — age set to ${age}`);
    await sendTelegram(env, env.ADMIN_CHAT_ID, `✏️ DOB change: ${u?.identity_code} | ${u?.date_of_birth || "none"} → ${parsed} (age ${age})`);
    return true;
  }

  if (lower === "!editdob") { await sendTelegram(env, chatId, "usage: !editdob <date>  e.g. !editdob 15 Jan 2000"); return true; }

  if (lower.startsWith("!editlocation ")) {
    const newCity = trimmed.slice(14).trim();
    if (newCity.length < 2 || newCity.length > 100) {
      await sendTelegram(env, chatId, "please enter a valid city and country (e.g. \"Mumbai, India\")");
      return true;
    }
    const u = (await db(env, `users?id=eq.${userId}&limit=1`))?.[0];
    await db(env, `users?id=eq.${userId}`, "PATCH", { city: newCity });
    await reply(`✅ location updated to: ${newCity}`);
    await sendTelegram(env, env.ADMIN_CHAT_ID, `✏️ Location change: ${u?.identity_code} | ${u?.city || "none"} → ${newCity}`);
    return true;
  }
  if (lower === "!editlocation") { await sendTelegram(env, chatId, "usage: !editlocation <city, country>  e.g. !editlocation Mumbai, India"); return true; }

  if (lower === "!changepin") {
    await setAuthStateHelper(env, chatId, { step: "change_pin_old", userId });
    await sendTelegram(env, chatId, "enter your current PIN:");
    return true;
  }

  if (lower.startsWith("!remember ")) {
    const mem = trimmed.slice(10).trim();
    if (!mem) { await reply("what should I remember?"); return true; }
    await saveMemory(env, userId, "fact", mem, [], 3);
    await reply("noted bestie 🧠✨"); return true;
  }

  if (lower === "!memories") {
    const mems = await getUserMemories(env, userId);
    if (!mems.length) { await reply("nothing saved yet."); return true; }
    await reply(`🧠 what I remember:\n\n${mems.map((m: any, i: number) => `${i+1}. ${m.content} [${m.category}]`).join("\n")}`);
    return true;
  }

  if (lower.startsWith("!forget ")) {
    const arg = trimmed.slice(8).trim();
    if (arg.toLowerCase() === "all") { await db(env, `memories?user_id=eq.${userId}`, "DELETE"); await reply("cleared everything 🗑️"); return true; }
    const mems = await getUserMemories(env, userId);
    const idx = parseInt(arg) - 1;
    if (isNaN(idx) || idx < 0 || idx >= mems.length) { await reply("hmm, I don't have a memory with that number — check the list with !memories"); return true; }
    await db(env, `memories?id=eq.${mems[idx].id}`, "DELETE");
    await reply("poof, gone fr 🗑️"); return true;
  }

  if (lower === "!forgotpin") {
    const u = (await db(env, `users?id=eq.${userId}&limit=1`))?.[0];
    await sendForgotPinRequest(env, chatId, platform, u || { id: userId }, inPlace ? reply : undefined);
    return true;
  }

  if (lower === "!support") {
    await sendSupportPrompt(env, chatId, inPlace ? reply : undefined);
    return true;
  }

  if (lower.startsWith("!support ")) {
    const msg = trimmed.slice(9).trim();
    const u = (await db(env, `users?id=eq.${userId}&limit=1`))?.[0];
    await sendSupportToAdmin(env, chatId, platform, "other", msg, u);
    await sendTelegram(env, chatId, "support request sent 🙏"); return true;
  }

  if (lower.startsWith("!vault edit ") && await isAdminSession(env, chatId)) {
    const rest = trimmed.slice(12).trim();
    const spaceIdx = rest.indexOf(" ");
    if (spaceIdx === -1) { await sendTelegram(env, chatId, "usage: !vault edit <number> <new text>"); return true; }
    const idx = parseInt(rest.slice(0, spaceIdx)) - 1;
    const newText = rest.slice(spaceIdx + 1).trim();
    const raw = await env.BIZLI_MEMORY.get("bizli_vault");
    const entries: any[] = raw ? JSON.parse(raw) : [];
    if (isNaN(idx) || idx < 0 || idx >= entries.length || !newText) {
      await sendTelegram(env, chatId, "usage: !vault edit <number> <new text>"); return true;
    }
    entries[idx].content = newText;
    await env.BIZLI_MEMORY.put("bizli_vault", JSON.stringify(entries));
    await sendTelegram(env, chatId, `entry #${idx + 1} updated.`); return true;
  }

  if (lower.startsWith("!feedback ")) {
    const msg = trimmed.slice(10).trim();
    const u = (await db(env, `users?id=eq.${userId}&limit=1`))?.[0];
    await sendTelegram(env, env.ADMIN_CHAT_ID, `💬 Feedback\n\nFrom: ${u?.display_name} (${u?.identity_code})\n\n${msg}`);
    try { await db(env, "feedback", "POST", { user_id: userId, platform, rating: null, user_message: msg, bot_reply: null }); } catch {}
    await reply("ty!! sending it over 🙏💛"); return true;
  }

  // Bare menu taps (/search, /feedback) → conversational ask; the next plain
  // message becomes the argument (await_input, consumed in auth.ts).
  if (lower === "!search" || lower === "!feedback") {
    const prompts: Record<string, string> = {
      "!search": "what should I search for? just type it 👇",
      "!feedback": "tell me anything — just type your feedback 👇",
    };
    await setAuthStateHelper(env, chatId, { step: "await_input", cmd: lower, userId });
    await reply(`${prompts[lower]}\n\n(type "cancel" to skip)`);
    return true;
  }

  if (lower.startsWith("!search ")) {
    // DEEP mode — the one place answers go long. Normal chat stays Snapchat-short.
    const query = trimmed.slice(8).trim();
    await sendTelegram(env, chatId, "searching deep... 🔍");
    const result = await searchWebDeep(env, query);
    if (result) {
        const formatted = await callGroq(env, [{ role: "user", content: `Present these search results as a DETAILED briefing: 5-8 informative bullet points (a full fact per bullet, with names/numbers/dates where the data has them), a one-line takeaway at the end, then 2-3 of the real source links from the data exactly as shown — prefer official/primary sources (government, official sites, major outlets) first. Complete sentences only — never stop mid-sentence. No filler, no invented links.\n\nQuery: ${query}\n\nData:\n${result.slice(0, 4000)}` }], "");
        await sendAnimatedText(env, chatId, formatted || result.slice(0, 1200));
    } else { await sendTelegram(env, chatId, "nothing found."); }
    return true;
  }

  if (lower === "!logout") {
    await env.BIZLI_MEMORY.delete(`history_${userId}`);
    await env.BIZLI_MEMORY.put(`logged_out_${chatId}`, "1", { expirationTtl: 2592000 });
    await reply("logged out 🔒 tap below whenever you want to come back 👇",
      [[{ text: "🔑 Log in", callback_data: `start_login:${chatId}` }]]);
    return true;
  }

  if (lower === "!deleteme") {
    await reply(
      "this permanently deletes your account, memories, and chat history — everything, no undo 💔\n\nare you sure?",
      [
        [{ text: "🗑️ Yes, delete everything", callback_data: `delme:${userId}` }],
        [{ text: "💛 No, keep my account", callback_data: "delme_no" }],
      ]);
    return true;
  }

  return false;
}
