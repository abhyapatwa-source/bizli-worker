import type { Env } from './types';
import { db } from './db';
import { generateIdentityCode, parseDOB, calculateAge, hashPin } from './utils';
import { sendTelegram, sendSupportToAdmin, generateImage } from './telegram';
import { getAuthStateHelper, setAuthStateHelper, clearAuthState, lookupUser } from './memory';

// Single implementation of the recover entry point — used by handleAuth AND
// the index.ts pre-auth intercept (so recovery works during maintenance too).
export async function startRecoverFlow(env: Env, chatId: string): Promise<void> {
  await setAuthStateHelper(env, chatId, { step: "recover_gmail" });
  await sendTelegram(env, chatId, "enter the Gmail you registered with:");
}

export async function handleAuth(env: Env, chatId: string, text: string, platform = "telegram"): Promise<{ handled: boolean; userId?: string }> {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const state = await getAuthStateHelper(env, chatId);

  const checkStuck = async (stepName: string): Promise<boolean> => {
    const k = `stuck_${chatId}_${stepName}`;
    const n = parseInt(await env.BIZLI_MEMORY.get(k) || "0") + 1;
    await env.BIZLI_MEMORY.put(k, String(n), { expirationTtl: 1800 });
    if (n >= 3) {
      await env.BIZLI_MEMORY.delete(k);
      await sendTelegram(env, chatId,
        "looks like this step is giving you trouble 😟 no worries — I can connect you to a human, or you can start fresh 👇",
        { reply_markup: { inline_keyboard: [
          [{ text: "🆘 Talk to support", callback_data: `support_cat:${chatId}|${stepName}` }],
          [{ text: "🔄 Start over", callback_data: `start_reg:${chatId}` }, { text: "🔑 Log in instead", callback_data: `start_login:${chatId}` }],
        ] } });
      return true;
    }
    return false;
  };
  const clearStuck = async (stepName: string) => { await env.BIZLI_MEMORY.delete(`stuck_${chatId}_${stepName}`); };

  if (state?.step && /^(cancel|stop|start over|restart|exit|quit)$/i.test(lower)) {
    await clearAuthState(env, chatId);
    await sendTelegram(env, chatId, "no worries, cancelled 🙂 tap below whenever you're ready 👇",
      { reply_markup: { inline_keyboard: [[
        { text: "✨ Sign me up", callback_data: `start_reg:${chatId}` },
        { text: "🔑 I have an account", callback_data: `start_login:${chatId}` },
      ]] } });
    return { handled: true };
  }

  if (state?.step === "support_typing") {
    const userInfo = await lookupUser(env, platform, chatId);
    await sendSupportToAdmin(env, chatId, platform, state.category, trimmed, userInfo);
    await clearAuthState(env, chatId);
    await sendTelegram(env, chatId, "support request sent 🙏");
    return { handled: true };
  }

  if (state?.step === "image_style") {
    await clearAuthState(env, chatId);
    const validStyles = ["realistic", "anime", "artistic", "cartoon", "sketch", "cinematic"];
    const matched = validStyles.find(s => lower.includes(s));
    const finalPrompt = matched ? `${state.prompt}, ${matched} style` : state.prompt;
    await generateImage(env, finalPrompt, chatId);
    return { handled: true };
  }

  if (state?.step === "change_pin_old") {
    const user = await db(env, `users?id=eq.${state.userId}&limit=1`);
    if (await hashPin(trimmed) !== user?.[0]?.pin_hash) {
      await clearAuthState(env, chatId);
      await sendTelegram(env, chatId, "wrong current PIN. cancelled.");
      return { handled: true };
    }
    await setAuthStateHelper(env, chatId, { step: "change_pin_new", userId: state.userId });
    await sendTelegram(env, chatId, "enter your new 4-digit PIN:");
    return { handled: true };
  }

  if (state?.step === "change_pin_new") {
    if (!/^\d{4}$/.test(trimmed)) { await sendTelegram(env, chatId, "4 digits only, try again:"); return { handled: true }; }
    await db(env, `users?id=eq.${state.userId}`, "PATCH", { pin_hash: await hashPin(trimmed) });
    await clearAuthState(env, chatId);
    await sendTelegram(env, chatId, "✅ PIN changed!");
    return { handled: true };
  }

  if (lower === "!register") {
    const identity = await db(env, `platform_identities?platform=eq.${platform}&platform_id=eq.${chatId}&limit=1`);
    if (identity?.length > 0) {
      const user = await db(env, `users?id=eq.${identity[0].user_id}&limit=1`);
      if (user?.[0]?.status === "approved") { await sendTelegram(env, chatId, "you're already registered! type !login 😊"); return { handled: true }; }
      if (user?.[0]?.status === "waitlist") { await sendTelegram(env, chatId, "you're already on the waitlist ⏳"); return { handled: true }; }
      if (user?.[0]?.status === "denied") { await sendTelegram(env, chatId, "your request wasn't approved. type !support if you think this is a mistake."); return { handled: true }; }
    }
    await setAuthStateHelper(env, chatId, { step: "reg_name" });
    await sendTelegram(env, chatId, "okay bestie, first things first — what's your name? 😊");
    return { handled: true };
  }

  if (state?.step === "reg_name") {
    await setAuthStateHelper(env, chatId, { step: "reg_gmail", name: trimmed.slice(0, 30) });
    await sendTelegram(env, chatId, `love that name, ${trimmed.slice(0, 30)}! 💛\n\nquick one — what's your email? just for account recovery if you ever forget your PIN (safe with me, promise 🔐)`);
    return { handled: true };
  }

  if (state?.step === "reg_gmail") {
    const gmail = trimmed.toLowerCase().trim();
    if (!gmail.includes("@") || !gmail.includes(".")) {
      if (await checkStuck("reg_gmail")) return { handled: true };
      await sendTelegram(env, chatId, "that doesn't look like a valid email 🤔 it should look like name@gmail.com — try again:");
      return { handled: true };
    }
    await clearStuck("reg_gmail");
    const existing = await db(env, `users?gmail=eq.${gmail}&limit=1`);
    if (existing?.[0]) {
      await clearAuthState(env, chatId);
      const u = existing[0];
      if (u.status === "approved") { await sendTelegram(env, chatId, `you already have an account! type !login and use code ${u.identity_code}`); return { handled: true }; }
      await sendTelegram(env, chatId, `you already registered. your code is ${u.identity_code}. type !login to continue.`);
      return { handled: true };
    }
    const existingPlatform = await db(env, `platform_identities?platform=eq.${platform}&platform_id=eq.${chatId}&limit=1`);
    if (existingPlatform?.[0]) {
      await clearAuthState(env, chatId);
      const u = (await db(env, `users?id=eq.${existingPlatform[0].user_id}&limit=1`))?.[0];
      await sendTelegram(env, chatId, `you already have an account! code: ${u?.identity_code}. type !login`);
      return { handled: true };
    }
    const name = state.name;
    const identityCode = generateIdentityCode();
    const created = await db(env, "users", "POST", { gmail_hash: `tg_${chatId}`, gmail, display_name: name, identity_code: identityCode, status: "approved", last_active: new Date().toISOString() });
    const userId = created?.[0]?.id;
    if (!userId) { await sendTelegram(env, chatId, "something went wrong, try again."); await clearAuthState(env, chatId); return { handled: true }; }
    await db(env, "platform_identities", "POST", { user_id: userId, platform, platform_id: chatId }).catch(() => {});
    await setAuthStateHelper(env, chatId, { step: "reg_dob", userId, name });
    await sendTelegram(env, chatId, `yesss ${name}, almost there!\n\n📝 your identity code: ${identityCode}\nsave this — it's how you log in anywhere with your same memories.\n\none more quick thing — what's your date of birth? (e.g. 15 Jan 2000)\n\ntype "skip" if you'd rather not share`);
    await sendTelegram(env, env.ADMIN_CHAT_ID, `📬 New user joined!\n\nName: ${name}\nGmail: ${gmail}\nPlatform: ${platform}\nCode: ${identityCode}\nID: ${userId}`,
      { reply_markup: { inline_keyboard: [[{ text: "🚫 Block (if spam)", callback_data: `block:${userId}` }]] } }
    );
    return { handled: true };
  }

  if (state?.step === "reg_dob") {
    if (trimmed.toLowerCase() === "skip") {
      await setAuthStateHelper(env, chatId, { step: "reg_location", userId: state.userId });
      await sendTelegram(env, chatId, "no worries! one more thing — what city and country are you in? (e.g. \"Mumbai, India\" or \"Dubai, UAE\")\n\n(type \"skip\" to skip this too)");
      return { handled: true };
    }
    const parsed = parseDOB(trimmed);
    const age = parsed ? calculateAge(parsed) : -1;
    if (!parsed || age < 5 || age > 120) {
      if (await checkStuck("reg_dob")) return { handled: true };
      await sendTelegram(env, chatId, "hmm, couldn't read that date — try something like \"15 Jan 2000\" or \"15/01/2000\".\n\n(or type \"skip\" to skip this)");
      return { handled: true };
    }
    await clearStuck("reg_dob");
    await db(env, `users?id=eq.${state.userId}`, "PATCH", { date_of_birth: parsed });
    await setAuthStateHelper(env, chatId, { step: "reg_location", userId: state.userId });
    await sendTelegram(env, chatId, `got it! one more — what city and country are you in? (e.g. "Mumbai, India" or "Dubai, UAE")\n\n(type "skip" to skip):`);
    return { handled: true };
  }

  if (state?.step === "reg_location") {
    if (trimmed.toLowerCase() === "skip") {
      await setAuthStateHelper(env, chatId, { step: "set_pin", userId: state.userId });
      await sendTelegram(env, chatId, "no worries! last step — pick a 4-digit PIN (numbers only):");
      return { handled: true };
    }
    if (trimmed.length < 2 || trimmed.length > 100) {
      await sendTelegram(env, chatId, "just type your city and country (e.g. \"Mumbai, India\").\n\n(or type \"skip\" to skip)");
      return { handled: true };
    }
    await db(env, `users?id=eq.${state.userId}`, "PATCH", { city: trimmed });
    await setAuthStateHelper(env, chatId, { step: "set_pin", userId: state.userId });
    await sendTelegram(env, chatId, `got it! last step — pick a 4-digit PIN (numbers only):`);
    return { handled: true };
  }

  if (state?.step === "set_pin") {
    if (!/^\d{4}$/.test(trimmed)) {
      if (await checkStuck("set_pin")) return { handled: true };
      await sendTelegram(env, chatId, "almost! it needs to be exactly 4 numbers (like 1234) — try again:");
      return { handled: true };
    }
    await clearStuck("set_pin");
    await db(env, `users?id=eq.${state.userId}`, "PATCH", { pin_hash: await hashPin(trimmed) });
    const existingLink = await db(env, `platform_identities?platform=eq.${platform}&platform_id=eq.${chatId}&limit=1`);
    if (!existingLink?.length) {
      await db(env, "platform_identities", "POST", { user_id: state.userId, platform, platform_id: chatId }).catch(() => {});
    }
    await env.BIZLI_MEMORY.delete(`logged_out_${chatId}`);
    await clearAuthState(env, chatId);
    await sendTelegram(env, chatId, "PIN locked in, we're good to go!! 🔐✨\n\nngl just talk to me like you'd text a friend 😊 try: \"tell me a joke\", \"what's the weather in Mumbai\", send me a photo — or honestly just say whatever's on your mind 💛");
    return { handled: true, userId: state.userId };
  }

  if (lower === "!login") {
    const loggedOut = await env.BIZLI_MEMORY.get(`logged_out_${chatId}`);
    if (!loggedOut) {
      const identity = await db(env, `platform_identities?platform=eq.${platform}&platform_id=eq.${chatId}&limit=1`);
      if (identity?.length > 0) {
        const user = await db(env, `users?id=eq.${identity[0].user_id}&limit=1`);
        if (user?.[0]?.status === "approved") { await sendTelegram(env, chatId, "bestie you're already in! just start typing 😄"); return { handled: true, userId: identity[0].user_id }; }
      }
    }
    await setAuthStateHelper(env, chatId, { step: "login_code" });
    await sendTelegram(env, chatId, "enter your identity code (BZ-XXXX):\n\n(type cancel anytime to start over)");
    return { handled: true };
  }

  if (state?.step === "login_code") {
    const code = trimmed.toUpperCase();
    const users = await db(env, `users?identity_code=eq.${code}&limit=1`);
    if (!users?.length) {
      await sendTelegram(env, chatId, "hmm that code isn't ringing a bell 🤔\n\ndouble-check it looks like BZ-XXXX (4 chars after BZ-) and try again, or:",
        { reply_markup: { inline_keyboard: [
          [{ text: "🔁 Forgot my code", callback_data: `start_recover:${chatId}` }],
          [{ text: "🆘 Get help", callback_data: `support_cat:${chatId}|login` }],
        ] } });
      return { handled: true };
    }
    const user = users[0];
    if (user.status === "waitlist") { await sendTelegram(env, chatId, "still on the waitlist ⏳ hang in there, you'll be in soon!"); await clearAuthState(env, chatId); return { handled: true }; }
    if (user.status === "denied" || user.is_blocked) { await sendTelegram(env, chatId, "access not granted. type !support if you think this is a mistake."); await clearAuthState(env, chatId); return { handled: true }; }
    await setAuthStateHelper(env, chatId, { step: "login_pin", userId: user.id, name: user.display_name });
    await sendTelegram(env, chatId, "enter your 4-digit PIN:");
    return { handled: true };
  }

  if (state?.step === "login_pin") {
    const userId = state.userId;
    const lockVal = await env.BIZLI_MEMORY.get(`pin_lock_${userId}`);
    if (lockVal && Date.now() < parseInt(lockVal)) {
      const mins = Math.ceil((parseInt(lockVal) - Date.now()) / 60000);
      await sendTelegram(env, chatId, `locked for ${mins} more min.\nForgot PIN? !forgotpin | Need help? !support`);
      return { handled: true };
    }
    const user = await db(env, `users?id=eq.${userId}&limit=1`);
    if (await hashPin(trimmed) !== user?.[0]?.pin_hash) {
      const attKey = `pin_att_${userId}`;
      const att = parseInt(await env.BIZLI_MEMORY.get(attKey) || "0") + 1;
      if (att >= 3) {
        await env.BIZLI_MEMORY.put(`pin_lock_${userId}`, String(Date.now() + 600000), { expirationTtl: 700 });
        await env.BIZLI_MEMORY.delete(attKey);
        await sendTelegram(env, chatId, "okay 3 wrong tries, locked for 10 min just to keep you safe 🔒\n\nforgot your PIN? nw — tap below and I'll sort it out 👇",
          { reply_markup: { inline_keyboard: [
            [{ text: "🔁 Reset my PIN", callback_data: `start_recover:${chatId}` }],
            [{ text: "🆘 Talk to support", callback_data: `support_cat:${chatId}|pin` }],
          ] } });
      } else {
        await env.BIZLI_MEMORY.put(attKey, String(att), { expirationTtl: 600 });
        await sendTelegram(env, chatId, `wrong PIN 🤔 ${3 - att} tr${3 - att === 1 ? "y" : "ies"} left — take it slow!`);
      }
      return { handled: true };
    }
    await db(env, "platform_identities", "POST", { user_id: userId, platform, platform_id: chatId }).catch(() => {});
    await env.BIZLI_MEMORY.delete(`pin_att_${userId}`);
    await env.BIZLI_MEMORY.delete(`logged_out_${chatId}`);
    await clearAuthState(env, chatId);
    await sendTelegram(env, chatId, `welcome back${state.name ? " " + state.name : ""}! 🎉 good to see you again 💛`);
    return { handled: true, userId };
  }

  if (lower === "!recover") {
    await startRecoverFlow(env, chatId);
    return { handled: true };
  }

  if (state?.step === "recover_gmail") {
    const gmail = trimmed.toLowerCase().trim();
    const users = await db(env, `users?gmail=eq.${gmail}&limit=1`);
    if (!users?.length) {
      if (await checkStuck("recover_gmail")) return { handled: true };
      await sendTelegram(env, chatId,
        "hmm, I don't see an account with that Gmail 🤔\n\nMake sure it's the exact one you signed up with, and type it again — or:",
        { reply_markup: { inline_keyboard: [
          [{ text: "🆘 Talk to support", callback_data: `support_cat:${chatId}|recover` }],
          [{ text: "✨ Sign up instead", callback_data: `start_reg:${chatId}` }],
        ] } });
      return { handled: true };
    }
    await clearStuck("recover_gmail");
    const user = users[0];
    await clearAuthState(env, chatId);
    await sendTelegram(env, env.ADMIN_CHAT_ID,
      `🔁 Recovery Request\n\nName: ${user.display_name}\nCode: ${user.identity_code}\nID: ${user.id}\nGmail: ${gmail}\nPlatform: telegram\nChat ID: ${chatId}`,
      { reply_markup: { inline_keyboard: [[{ text: "✅ Verify & Restore", callback_data: `verify_recover:${user.id}|${chatId}` }, { text: "🚫 Deny", callback_data: `block:${user.id}` }]] } }
    );
    await sendTelegram(env, chatId, `found your account! ✅ your code is ${user.identity_code}\n\nI've asked the admin to verify you — you'll be able to log in shortly 🙏`);
    return { handled: true };
  }

  return { handled: false };
}
