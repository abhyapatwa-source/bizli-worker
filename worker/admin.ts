import type { Env } from './types';
import { db } from './db';
import { getGroqKeys, getGeminiKeys, getCerebrasKeys, getOpenRouterKeys } from './utils';
import { sendTelegram, editTelegramMessage, broadcastToTelegram, answerCallback, sendSupportToAdmin } from './telegram';
import { isAdminSession, setAdminSession, lookupUser, setAuthStateHelper, getUserMemories } from './memory';
import { getGroqStatus, BIZLI_VERSION, getActiveGroqModels, getActiveCerebrasModels, getActiveOpenRouterModels, probeAllProviders, callGroq } from './brain';
import { BIZLI_TOOLS } from './tools';
import { runAgents } from './agents';

async function resolveUserId(env: Env, idOrCode: string): Promise<string | null> {
  const trimmed = idOrCode.trim();
  if (trimmed.toUpperCase().startsWith("BZ-")) {
    const u = (await db(env, `users?identity_code=eq.${trimmed.toUpperCase()}&limit=1`))?.[0];
    return u?.id || null;
  }
  return trimmed;
}

// Shared user-action helpers — single implementation for both the typed
// commands (!approve etc.) and the inline notification buttons.
export async function approveUser(env: Env, uid: string): Promise<void> {
  await db(env, `users?id=eq.${uid}`, "PATCH", { status: "approved", is_blocked: false });
  const id = await db(env, `platform_identities?user_id=eq.${uid}&limit=1`);
  if (id?.[0]) {
    await sendTelegram(env, id[0].platform_id, "you're approved! 🎉\n\nSet a 4-digit PIN to log in on any platform:");
    await setAuthStateHelper(env, id[0].platform_id, { step: "set_pin", userId: uid });
  }
}
export async function denyUser(env: Env, uid: string): Promise<void> {
  await db(env, `users?id=eq.${uid}`, "PATCH", { status: "denied" });
  const id = await db(env, `platform_identities?user_id=eq.${uid}&limit=1`);
  if (id?.[0]) await sendTelegram(env, id[0].platform_id, "sorry, your request wasn't approved.");
}
export async function blockUser(env: Env, uid: string): Promise<void> {
  await db(env, `users?id=eq.${uid}`, "PATCH", { is_blocked: true, status: "denied" });
  const id = await db(env, `platform_identities?user_id=eq.${uid}&limit=1`);
  if (id?.[0]) await sendTelegram(env, id[0].platform_id, "you've been blocked.");
}

// ── Flash cards (BotFather style) ───────────────────────────────────────────
// ONE source of truth per card. Help can never drift from reality again:
// add/remove a command here when you add/remove its handler.
type CardGroup = { group: string; items: [string, string][] };

const USER_CARD: CardGroup[] = [
  { group: "👤 Account", items: [
    ["!mydetails", "your profile + edit buttons"],
    ["!settings", "timezone & daily greetings"],
    ["!logout", "log out"],
  ] },
  { group: "🧠 Memory", items: [
    ["!remember <thing>", "I'll never forget it"],
    ["!memories", "what I know about you"],
    ["!forget <n>", "make me forget"],
  ] },
  { group: "🔍 Tools", items: [
    ["!search <query>", "force a web search"],
    ["!status", "am I feeling okay?"],
    ["!myusage", "your daily limits"],
  ] },
  { group: "🆘 Help", items: [
    ["!support <msg>", "reach my developer"],
    ["!feedback <msg>", "tell us anything"],
    ["!forgotpin", "PIN reset request"],
    ["!deleteme", "delete my account & data"],
  ] },
];

const ADMIN_CARD: CardGroup[] = [
  { group: "🔐 ADMIN — PEOPLE", items: [
    ["!users", "list everyone"],
    ["!userdetails <id>", "one user's full info"],
    ["!approve <id> · !deny <id>", "waitlist decisions"],
    ["!block <id> · !unblock <id>", "ban controls"],
    ["!memory <id> · !wipememory <id>", "view / erase memories"],
    ["!msg <id> <text>", "DM one user"],
    ["!broadcast <msg>", "message everyone"],
    ["!close", "end reply mode"],
  ] },
  { group: "🤖 AGENT — SYSTEM", items: [
    ["!agent status", "brain map + overview"],
    ["!agent quota", "live key usage vs soft limits"],
    ["!agent test", "canary-test the brain now"],
    ["!agent models", "live model list"],
    ["!agent refresh models", "probe all providers"],
    ["!agent errors", "recent errors"],
    ["!agent kv", "storage breakdown"],
    ["!agent uptime", "version + uptime"],
    ["!agent report", "daily health report"],
    ["!agent tools", "list the 12 tools"],
    ["!agent feedback", "user feedback summary"],
    ["!agent fix lockouts", "clear PIN lockouts"],
    ["!agent clear cache", "reset caches"],
    ["!agent clear search", "clear search cache"],
    ["!agent clear history <uid>", "wipe a chat history"],
    ["!agent clear session <cid>", "reset an auth session"],
    ["!agent broadcast test", "responsiveness check"],
  ] },
  { group: "🛠️ CONTROL", items: [
    ["!maintenance on/off", "lock/unlock the bot"],
    ["!vault", "Bizli's diary (admin menu → Vault)"],
    ["!resetmypin", "reset your own PIN"],
    ["!adminoff", "exit admin mode"],
  ] },
];

function renderCard(title: string, card: CardGroup[], footer = ""): string {
  return `${title}\n\n` +
    card.map(g => `${g.group}\n` + g.items.map(([c, d]) => `${c} — ${d}`).join("\n")).join("\n\n") +
    (footer ? `\n\n${footer}` : "");
}

export function adminCardText(): string {
  return renderCard(`🔐 BIZLI ADMIN — ${BIZLI_VERSION}`, ADMIN_CARD);
}

const AGENT_PANEL_KEYBOARD = {
  inline_keyboard: [
    [{ text: "🧠 Brain Map", callback_data: "agent:status" }, { text: "📊 Quota", callback_data: "agent:quota" }],
    [{ text: "🧪 Test brain", callback_data: "agent:test" }, { text: "🔧 Tools", callback_data: "agent:tools" }],
    [{ text: "🐛 Errors", callback_data: "agent:errors" }, { text: "🗂️ KV", callback_data: "agent:kv" }],
    [{ text: "🔓 Fix lockouts", callback_data: "agent:fix lockouts" }, { text: "🧹 Clear cache", callback_data: "agent:clear cache" }],
    [{ text: "🔍 Clear search", callback_data: "agent:clear search" }, { text: "📋 Daily report", callback_data: "agent:report" }],
    [{ text: "📊 Feedback", callback_data: "agent:feedback" }, { text: "🕐 Uptime", callback_data: "agent:uptime" }],
  ],
};

const BACK_TO_MENU_KEYBOARD = {
  inline_keyboard: [[{ text: "⬅️ Back to menu", callback_data: "agent:menu" }]],
};

const ADMIN_MENU_KEYBOARD = {
  inline_keyboard: [
    [{ text: "👥 User Management", callback_data: "adm:users_cat" }],
    [{ text: "📢 Communication", callback_data: "adm:comm_cat" }],
    [{ text: "📊 Stats & Storage", callback_data: "adm:stats_cat" }],
    [{ text: "📈 Live Activity", callback_data: "adm:live_activity" }],
    [{ text: "🔧 Tools", callback_data: "agent:tools" }, { text: "📔 Vault", callback_data: "adm:vault" }],
    [{ text: "🏥 System Agent", callback_data: "agent:menu" }],
    [{ text: "🛠️ Maintenance ON", callback_data: "adm:maint_on" }, { text: "✅ Maintenance OFF", callback_data: "adm:maint_off" }],
    [{ text: "🔒 Exit admin", callback_data: "adm:exit" }],
  ],
};

function adminBack() {
  return { inline_keyboard: [[{ text: "⬅️ Back to admin menu", callback_data: "adm:menu" }]] };
}

export async function runAdminMenu(env: Env, chatId: string, cmd: string, messageId?: number): Promise<void> {
  const show = async (text: string, kb: any) => {
    if (messageId) await editTelegramMessage(env, chatId, messageId, text, kb);
    else await sendTelegram(env, chatId, text, { reply_markup: kb });
  };

  if (cmd === "menu" || cmd === "") {
    await show("🔐 Bizli Admin Panel\n\nChoose a category 👇", ADMIN_MENU_KEYBOARD);
  } else if (cmd === "users_cat") {
    await show(
      "👥 User Management\n\n" +
      "Tap to list users, or type the commands that need an ID:\n" +
      "• !userdetails <id|BZ-XXXX>\n" +
      "• !approve <id> / !deny <id>\n" +
      "• !block <id> / !unblock <id>\n" +
      "• !memory <id> — view memories\n" +
      "• !wipememory <id> — wipe memories",
      { inline_keyboard: [
        [{ text: "📋 List all users", callback_data: "adm:do_users" }],
        [{ text: "⬅️ Back to admin menu", callback_data: "adm:menu" }],
      ] });
  } else if (cmd === "do_users") {
    const users = await db(env, "users?order=created_at.desc&limit=30");
    const lines = (users || []).map((u: any) =>
      `${u.status === "approved" ? "✅" : u.status === "waitlist" ? "⏳" : "❌"} ${u.display_name || "?"} · ${u.identity_code || "?"}${u.is_blocked ? " 🚫" : ""}`);
    await show(`👥 Users (${users?.length || 0}):\n\n${lines.join("\n") || "(none)"}`, adminBack());
  } else if (cmd === "comm_cat") {
    await show(
      "📢 Communication\n\n" +
      "Type any of these commands:\n" +
      "• !broadcast <msg> — message everyone\n" +
      "• !msg <id> <text> — DM one user",
      adminBack());
  } else if (cmd === "stats_cat") {
    await show(
      "📊 Stats & Storage\n\nTap an option 👇",
      { inline_keyboard: [
        [{ text: "📊 Overall stats", callback_data: "adm:do_stats" }],
        [{ text: "💾 Storage breakdown", callback_data: "adm:do_storage" }],
        [{ text: "⬅️ Back to admin menu", callback_data: "adm:menu" }],
      ] });
  } else if (cmd === "do_stats") {
    const [allU, appr, wait, msgs, mems] = await Promise.all([
      db(env, "users?select=count"), db(env, "users?status=eq.approved&select=count"),
      db(env, "users?status=eq.waitlist&select=count"), db(env, "messages?select=count"), db(env, "memories?select=count"),
    ]);
    await show(`📊 Stats\n\n👥 Users: ${allU?.[0]?.count || 0}\n✅ Approved: ${appr?.[0]?.count || 0}\n⏳ Waitlist: ${wait?.[0]?.count || 0}\n💬 Messages: ${msgs?.[0]?.count || 0}\n🧠 Memories: ${mems?.[0]?.count || 0}`, adminBack());
  } else if (cmd === "do_storage") {
    const list = await env.BIZLI_MEMORY.list();
    const prefixes: Record<string, number> = {};
    for (const k of list.keys || []) {
      const p = k.name.split(/[_:]/)[0];
      prefixes[p] = (prefixes[p] || 0) + 1;
    }
    const lines = Object.entries(prefixes).sort((a, b) => b[1] - a[1]).map(([p, n]) => `• ${p}: ${n}`);
    await show(`💾 KV Storage (${list.keys?.length || 0} keys)\n\n${lines.join("\n")}`, adminBack());
  } else if (cmd === "live_activity") {
    const [users, allMsgs] = await Promise.all([
      db(env, "users?order=last_active.desc&limit=100"),
      db(env, "messages?select=user_id&limit=10000"),
    ]);
    const msgCount: Record<string, number> = {};
    for (const m of allMsgs || []) {
      if (m.user_id) msgCount[m.user_id] = (msgCount[m.user_id] || 0) + 1;
    }
    const sorted = (users || [])
      .map((u: any) => ({ ...u, _msgs: msgCount[u.id] || 0 }))
      .sort((a: any, b: any) => b._msgs - a._msgs);
    if (!sorted.length) {
      await show("📈 Live Activity\n\nNo users yet.", adminBack());
      return;
    }
    const lines = sorted.map((u: any) => {
      const s = u.is_blocked ? "🚫" : u.status === "approved" ? "✅" : u.status === "waitlist" ? "⏳" : "❌";
      const last = u.last_active
        ? new Date(u.last_active).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" })
        : "never";
      return `${s} ${u.display_name || "?"} (${u.identity_code || "?"}) · ${u._msgs} msgs · ${last}`;
    });
    await show(`📈 Live Activity — ${sorted.length} users (by messages)\n\n${lines.join("\n")}`, adminBack());
  } else if (cmd === "vault" || cmd.startsWith("vault_del_")) {
    if (cmd.startsWith("vault_del_")) {
      const idx = parseInt(cmd.slice(10));
      const raw2 = await env.BIZLI_MEMORY.get("bizli_vault");
      const ents: any[] = raw2 ? JSON.parse(raw2) : [];
      if (!isNaN(idx) && idx >= 0 && idx < ents.length) {
        ents.splice(idx, 1);
        await env.BIZLI_MEMORY.put("bizli_vault", JSON.stringify(ents));
      }
    }
    const raw = await env.BIZLI_MEMORY.get("bizli_vault");
    const entries: any[] = raw ? JSON.parse(raw) : [];
    if (!entries.length) {
      await show("📔 Vault is empty.\n\nBizli will keep moments here when something feels worth holding onto.", adminBack());
      return;
    }
    const lines = entries.slice(0, 10).map((e: any, i: number) => {
      const date = new Date(e.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      return `${i + 1}. [${date}]\n${e.content}`;
    }).join("\n\n");
    const deleteButtons = entries.slice(0, 10).map((_: any, i: number) =>
      [{ text: `🗑️ Delete #${i + 1}`, callback_data: `adm:vault_del_${i}` }]
    );
    await show(
      `📔 Bizli's Vault (${entries.length} entries)\n\nTo edit: !vault edit <n> <new text>\n\n${lines}`,
      { inline_keyboard: [...deleteButtons, [{ text: "⬅️ Back to admin menu", callback_data: "adm:menu" }]] }
    );
  } else if (cmd === "maint_on") {
    await env.BIZLI_MEMORY.put("maintenance_mode", "on");
    const sentOn = await broadcastToTelegram(env, "🛠️ Bizli is currently under maintenance.\nI'll be back online shortly.\nTo reach the developer, type: !support <your message>");
    await show(`🛠️ Maintenance mode ON — broadcast sent to ${sentOn} users.\n\nAll users (except you) now see a friendly hold message. !support still works for everyone.\n\nTap ✅ Maintenance OFF to restore.`, ADMIN_MENU_KEYBOARD);
  } else if (cmd === "maint_off") {
    await env.BIZLI_MEMORY.delete("maintenance_mode");
    const notifListOff = await env.BIZLI_MEMORY.list({ prefix: "maint_notified_" });
    await Promise.all(notifListOff.keys.map((k: any) => env.BIZLI_MEMORY.delete(k.name)));
    const sentOff = await broadcastToTelegram(env, "✅ Bizli is back online.\nThank you for your patience 💛");
    await show(`✅ Maintenance mode OFF — broadcast sent to ${sentOff} users. Bizli is live for everyone again 💛`, ADMIN_MENU_KEYBOARD);
  } else if (cmd === "exit") {
    await env.BIZLI_MEMORY.delete(`admin_session_${chatId}`);
    await show("🔒 Admin mode ended. Type !admin <password> to re-enter.", { inline_keyboard: [] });
  }
}

// One flash card (BotFather style), generated from USER_CARD.
// Any old help:* button from previous messages also lands here gracefully.
export async function runHelpMenu(env: Env, chatId: string, cmd: string, messageId?: number): Promise<void> {
  const text = renderCard("✨ BIZLI — COMMANDS", USER_CARD, "💬 Everything else? Just talk to me — weather, jokes, prices, photos, anything.");
  const kb = {
    inline_keyboard: [
      [{ text: "👤 My Details", callback_data: "hcmd:details" }, { text: "⚙️ Settings", callback_data: "hcmd:settings" }],
      [{ text: "🆘 Support", callback_data: "hcmd:support" }],
    ],
  };
  if (messageId) await editTelegramMessage(env, chatId, messageId, text, kb);
  else await sendTelegram(env, chatId, text, { reply_markup: kb });
}

export async function runAgentCommand(env: Env, chatId: string, agentCmd: string, messageId?: number): Promise<void> {
  const out = async (text: string, isMenu: boolean) => {
    const kb = isMenu ? AGENT_PANEL_KEYBOARD : BACK_TO_MENU_KEYBOARD;
    if (messageId) await editTelegramMessage(env, chatId, messageId, text, kb);
    else await sendTelegram(env, chatId, text, { reply_markup: kb });
  };

  if (agentCmd === "menu") {
    await out("🏥 Bizli Admin Menu\n\nTap an option below 👇", true);
    return;
  }
  if (!agentCmd || agentCmd === "status") {
    const keys = getGroqKeys(env);
    const keyNames = ["Alpha","Bravo","Charlie","Delta","Echo","Foxtrot","Golf","Hotel","India","Juliet","Kilo","Lima","Mike","November","Oscar","Papa","Quebec","Romeo","Sierra","Tango","Uniform"];
    const gStatus = await getGroqStatus(env);
    const now = Date.now();
    const readyKeys = keys.filter((_, i) => (gStatus.cooldowns[i] || 0) <= now).length;
    const [allUsers, approved, waitlist, msgs, mems] = await Promise.all([
      db(env, "users?select=count"), db(env, "users?status=eq.approved&select=count"),
      db(env, "users?status=eq.waitlist&select=count"), db(env, "messages?select=count"), db(env, "memories?select=count"),
    ]);
    const keyStatus = keys.map((_, i) => {
      const cd = gStatus.cooldowns[i] || 0;
      if (cd <= now) return `  ${keyNames[i] || i}: ✅ ready`;
      const mins = Math.ceil((cd - now) / 60000);
      return `  ${keyNames[i] || i}: ⏳ cooldown (${mins}m)`;
    }).join("\n");
    const geminiKeyCount = getGeminiKeys(env, "lab").length;
    const cerebrasKeyCount = getCerebrasKeys(env).length;
    const openrouterKeyCount = getOpenRouterKeys(env).length;
    const brainMap =
      `🧠 Bizli Brain Map — ${BIZLI_VERSION}\n\n` +
      `🧠 Cerebral Cortex — Groq (${readyKeys}/${keys.length} neurons ready):\n${keyStatus}\n\n` +
      `⚡ Motor Cortex — Cerebras: ${cerebrasKeyCount} key${cerebrasKeyCount !== 1 ? "s" : ""} configured\n` +
      `   (fallback #1 when Groq exhausted — auto-discovered models)\n` +
      `🌐 Parietal Lobe — OpenRouter: ${openrouterKeyCount} key${openrouterKeyCount !== 1 ? "s" : ""} configured\n` +
      `   (fallback #2 — auto-refreshing free-model pool)\n` +
      `🫀 Brainstem — Worker AI: standby\n` +
      `   (last resort when all providers exhausted — chat only)\n` +
      `🧬 Temporal Lobe — Gemini: ${geminiKeyCount} key${geminiKeyCount !== 1 ? "s" : ""} configured\n` +
      `   (Lab diagnostics only — never handles chat)\n\n` +
      `💾 Hippocampus: ${mems?.[0]?.count || 0} memories stored\n` +
      `💛 Amygdala: persona active\n` +
      `👥 Users: ${allUsers?.[0]?.count || 0} · Approved: ${approved?.[0]?.count || 0} · Waitlist: ${waitlist?.[0]?.count || 0}\n` +
      `💬 Messages: ${msgs?.[0]?.count || 0}\n` +
      `🤖 ${new Date().toUTCString()}`;
    await out(brainMap, true);
  } else if (agentCmd === "clear cache") {
    const users = await db(env, "users?select=id");
    for (const u of users || []) {
      await env.BIZLI_MEMORY.delete(`pin_lock_${u.id}`);
      await env.BIZLI_MEMORY.delete(`pin_att_${u.id}`);
    }
    await env.BIZLI_MEMORY.delete("groq_status");
    await out("✅ cache cleared + Groq key cooldowns reset — all keys back online", false);
  } else if (agentCmd === "clear search") {
    const list = await env.BIZLI_MEMORY.list({ prefix: "search_cache_" });
    let n = 0;
    for (const k of list.keys || []) { await env.BIZLI_MEMORY.delete(k.name); n++; }
    await out(`✅ cleared ${n} cached searches — next searches will be fresh`, false);
  } else if (agentCmd.startsWith("clear history ")) {
    const uid = agentCmd.slice(14).trim();
    await env.BIZLI_MEMORY.delete(`history_${uid}`);
    await sendTelegram(env, chatId, `✅ history cleared for ${uid}`);
  } else if (agentCmd === "report") {
    await runAgents(env);
    await out("✅ report sent", false);
  } else if (agentCmd === "tools") {
    const toolList = BIZLI_TOOLS.map((t: any) => `• ${t.function.name} — ${(t.function.description || "").slice(0, 70)}`).join("\n");
    await out(`🔧 Active tools (${BIZLI_TOOLS.length}):\n\n${toolList}`, false);
  } else if (agentCmd === "fix lockouts") {
    const users = await db(env, "users?select=id");
    for (const u of users || []) { await env.BIZLI_MEMORY.delete(`pin_lock_${u.id}`); await env.BIZLI_MEMORY.delete(`pin_att_${u.id}`); }
    await out("✅ all lockouts cleared", false);
  } else if (agentCmd === "quota") {
    const keys = getGroqKeys(env);
    const gStatus = await getGroqStatus(env);
    const now = Date.now();
    // Aggregate the per key+model counters up to key level for a readable view.
    const perKey = keys.map(() => ({ d: 0, m: 0, mT: 0 }));
    for (const [combo, q] of Object.entries(gStatus.q || {})) {
      const idx = parseInt(combo.split("_")[0]);
      if (isNaN(idx) || !perKey[idx]) continue;
      if (now - q.dStart < 86_400_000) perKey[idx].d += q.d;
      if (now - q.mStart < 60_000) { perKey[idx].m += q.m; perKey[idx].mT += q.mT; }
    }
    const totalDay = perKey.reduce((s, k) => s + k.d, 0);
    const active = perKey.map((k, i) => ({ i, ...k })).filter(k => k.d > 0);
    const lines = active.length
      ? active.map(k => `  key ${k.i + 1}: ${k.d} today${k.m ? ` · ${k.m} req / ${k.mT} tok this min` : ""}`).join("\n")
      : "  (no usage recorded yet — counters fill as messages flow)";
    await out(
      `📊 Groq quota — live counters\n` +
      `soft limits per key+model: 25/min · 5500 tok/min · 900/day\n\n` +
      `${lines}\n\n` +
      `Σ today: ${totalDay} requests across ${keys.length} keys\n` +
      `⚡ Cerebras / 🌐 OpenRouter: reactive fallbacks (no proactive counters)`,
      false);
  } else if (agentCmd === "test") {
    const t0 = Date.now();
    let reply = "";
    try { reply = await callGroq(env, [{ role: "user", content: "Canary check — reply with one short friendly line." }], ""); } catch {}
    const ms = Date.now() - t0;
    const lastRaw = await env.BIZLI_MEMORY.get("last_brains");
    let provider = "unknown";
    try { const arr = lastRaw ? JSON.parse(lastRaw) : []; if (arr[0]?.brain) provider = arr[0].brain; } catch {}
    if (reply) await out(`🧪 canary PASSED — ${ms}ms via ${provider}\n\nreply: "${reply.slice(0, 150)}"`, false);
    else await out(`🧪 canary FAILED after ${ms}ms — brain returned nothing. check !agent errors`, false);
  } else if (agentCmd === "kv") {
    const list = await env.BIZLI_MEMORY.list();
    const keys = list.keys || [];
    const groups: Record<string, number> = {};
    for (const k of keys) {
      const prefix = k.name.split("_")[0];
      groups[prefix] = (groups[prefix] || 0) + 1;
    }
    const lines = Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k}_*: ${v}`);
    await out(`🗂️ KV keys: ${keys.length} total\n\n${lines.join("\n") || "(empty)"}`, false);
  } else if (agentCmd === "errors") {
    const errRaw = await env.BIZLI_MEMORY.get("recent_errors");
    if (!errRaw) { await out("✅ no recent errors logged", false); }
    else {
      let lines = errRaw;
      try {
        const arr: { ts: string; detail: string }[] = JSON.parse(errRaw);
        if (Array.isArray(arr)) lines = arr.slice(0, 5).map(e => `[${e.ts.slice(0,19)}] ${e.detail}`).join("\n");
      } catch {}
      await out(`🐛 Recent errors (last 5):\n\n${lines}`, false);
    }
  } else if (agentCmd === "feedback") {
    const allFb = await db(env, "feedback?order=id.desc&limit=200");
    const rows = Array.isArray(allFb) ? allFb : [];
    const upCount = rows.filter((f: any) => f.rating === "up").length;
    const downCount = rows.filter((f: any) => f.rating === "down").length;
    const textFb = rows.filter((f: any) => !f.rating && f.user_message);
    const total = upCount + downCount;
    const pct = total > 0 ? Math.round((upCount / total) * 100) : 0;
    const recentDown = rows.filter((f: any) => f.rating === "down").slice(0, 5);
    let downSamples = "";
    if (recentDown.length) {
      downSamples = "\n\n👎 Recent thumbs-down:\n" + recentDown.map((f: any) =>
        `• "${(f.user_message || "").slice(0, 40)}" → "${(f.bot_reply || "").slice(0, 60)}..."`).join("\n");
    }
    let textSamples = "";
    if (textFb.length) {
      textSamples = "\n\n💬 Text feedback (" + textFb.length + "):\n" + textFb.slice(0, 5).map((f: any) =>
        `• ${(f.user_message || "").slice(0, 80)}`).join("\n");
    }
    if (total === 0 && textFb.length === 0) {
      await out("📊 Feedback\n\nNo feedback yet. 👍/👎 buttons appear under info/search replies — once users tap them, results show here.", false);
    } else {
      await out(`📊 Feedback\n\n👍 ${upCount} · 👎 ${downCount}${total > 0 ? ` · ${pct}% positive` : ""}${downSamples}${textSamples}`, false);
    }
  } else if (agentCmd === "broadcast test") {
    await sendTelegram(env, chatId, "✅ agent online and responsive — test successful");
  } else if (agentCmd.startsWith("clear session ")) {
    const cid = agentCmd.slice(14).trim();
    await env.BIZLI_MEMORY.delete(`auth_${cid}`);
    await env.BIZLI_MEMORY.delete(`admin_session_${cid}`);
    await sendTelegram(env, chatId, `✅ session cleared for ${cid}`);
  } else if (agentCmd === "uptime") {
    const lastReport = await env.BIZLI_MEMORY.get("last_daily_report");
    await out(`🕐 Now: ${new Date().toUTCString()}\n📋 Last daily report: ${lastReport ? new Date(parseInt(lastReport)).toUTCString() : "never"}\n🤖 Version: ${BIZLI_VERSION}`, false);
  } else if (agentCmd === "models") {
    const { text, vision } = await getActiveGroqModels(env);
    const lastCheck = await env.BIZLI_MEMORY.get("last_model_check");
    const checkedAt = lastCheck ? new Date(parseInt(lastCheck)).toUTCString() : "never";
    const gemRaw = await env.BIZLI_MEMORY.get("gemini_live_models").catch(() => null);
    const gemModels: string[] = gemRaw ? JSON.parse(gemRaw) : ["gemini-3.5-flash", "gemini-2.5-flash"];
    const cerModels = await getActiveCerebrasModels(env);
    const orModels = await getActiveOpenRouterModels(env);
    const lines = [
      `🧠 Active Models — ${BIZLI_VERSION}`,
      ``,
      `Groq Text (${text.length}/4):`,
      ...text.map((m, i) => `  ${i + 1}. ${m.id}`),
      ``,
      `Groq Vision: ${vision}`,
      ``,
      `Cerebras (${cerModels.length}):`,
      ...cerModels.map((m: string, i: number) => `  ${i + 1}. ${m}`),
      ``,
      `OpenRouter free pool (${orModels.length}):`,
      ...orModels.map((m: string, i: number) => `  ${i + 1}. ${m}`),
      ``,
      `Gemini Lab (${gemModels.length}/3):`,
      ...gemModels.map((m: string, i: number) => `  ${i + 1}. ${m}`),
      ``,
      `Last probed: ${checkedAt}`,
      `Run "!agent refresh models" to probe now.`,
    ];
    await out(lines.join("\n"), false);
  } else if (agentCmd === "refresh models") {
    await out("🔍 Probing all provider model pools — ~20s...", false);
    const { groq, gemini, cerebras, openrouter } = await probeAllProviders(env);
    const lines = [
      `✅ Probe complete`,
      ``,
      `Groq Text (${groq.text.length}/4):`,
      ...groq.text.map((id, i) => `  ${i + 1}. ${id}`),
      ``,
      `Groq Vision: ${groq.vision}`,
      ``,
      `Cerebras (${cerebras.models.length}):`,
      ...cerebras.models.map((m: string, i: number) => `  ${i + 1}. ${m}`),
      ``,
      `OpenRouter free pool (${openrouter.models.length}):`,
      ...openrouter.models.map((m: string, i: number) => `  ${i + 1}. ${m}`),
      ``,
      `Gemini Lab (${gemini.models.length}/3):`,
      ...gemini.models.map((m: string, i: number) => `  ${i + 1}. ${m}`),
      ``,
      groq.changed || gemini.changed || cerebras.changed || openrouter.changed ? `⚡ Model lists updated in KV.` : `No change from previous lists.`,
    ];
    await out(lines.join("\n"), false);
  } else {
    // Unknown subcommand → the auto-generated admin card (always in sync).
    await out(adminCardText(), true);
  }
}

export async function handleAdmin(env: Env, chatId: string, text: string): Promise<boolean> {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (lower.startsWith("!admin ")) {
    const pass = trimmed.slice(7).trim();
    const lockVal = await env.BIZLI_MEMORY.get(`admin_lock_${chatId}`);
    if (lockVal && Date.now() < parseInt(lockVal)) { await sendTelegram(env, chatId, "locked 30 min."); return true; }
    // Fail closed: no hardcoded fallback — if the secret is unset, nobody gets in.
    if (env.ADMIN_PASSWORD && pass === env.ADMIN_PASSWORD) {
      await setAdminSession(env, chatId);
      await env.BIZLI_MEMORY.delete(`admin_att_${chatId}`);
      await sendTelegram(env, chatId, `🔓 Admin mode (15 min)\n\n${adminCardText()}`, { reply_markup: ADMIN_MENU_KEYBOARD });
    } else {
      const att = parseInt(await env.BIZLI_MEMORY.get(`admin_att_${chatId}`) || "0") + 1;
      if (att >= 3) { await env.BIZLI_MEMORY.put(`admin_lock_${chatId}`, String(Date.now() + 1800000), { expirationTtl: 1900 }); await sendTelegram(env, chatId, "wrong password. 30 min lockout."); }
      else { await env.BIZLI_MEMORY.put(`admin_att_${chatId}`, String(att), { expirationTtl: 600 }); await sendTelegram(env, chatId, `wrong. ${3 - att} left.`); }
    }
    return true;
  }

  const replyTarget = await env.BIZLI_MEMORY.get(`admin_reply_to_${chatId}`);
  if (replyTarget) {
    if (lower === "!close") { await env.BIZLI_MEMORY.delete(`admin_reply_to_${chatId}`); await sendTelegram(env, chatId, "🔒 closed."); return true; }
    if (!lower.startsWith("!")) { await sendTelegram(env, replyTarget, `📩 from support:\n\n${trimmed}`); await sendTelegram(env, chatId, "✅ sent. !close to end."); return true; }
  }

  if (!await isAdminSession(env, chatId)) return false;

  if (lower === "!maintenance on") {
    await env.BIZLI_MEMORY.put("maintenance_mode", "on");
    const sent = await broadcastToTelegram(env, "🛠️ Bizli is currently under maintenance.\nI'll be back online shortly.\nTo reach the developer, type: !support <your message>");
    await sendTelegram(env, chatId, `🛠️ Maintenance mode ON — broadcast sent to ${sent} users.\n\nAll users (except you) now see a friendly hold message. !support still works for everyone.\nType !maintenance off when done.`);
    return true;
  }
  if (lower === "!maintenance off") {
    await env.BIZLI_MEMORY.delete("maintenance_mode");
    const notifList = await env.BIZLI_MEMORY.list({ prefix: "maint_notified_" });
    await Promise.all(notifList.keys.map((k: any) => env.BIZLI_MEMORY.delete(k.name)));
    const sent = await broadcastToTelegram(env, "✅ Bizli is back online.\nThank you for your patience 💛");
    await sendTelegram(env, chatId, `✅ Maintenance mode OFF — broadcast sent to ${sent} users. Bizli is live for everyone again 💛`);
    return true;
  }

  if (lower.startsWith("!agent")) {
    const agentCmd = lower.slice(6).trim();
    await runAgentCommand(env, chatId, agentCmd || "menu");
    return true;
  }

  if (lower === "!adminoff") { await env.BIZLI_MEMORY.delete(`admin_session_${chatId}`); await sendTelegram(env, chatId, "🔒 admin off"); return true; }

  if (lower === "!resetmypin") {
    const adminId = "9370af03-fdfe-4be7-9a09-3c056a2f91f4";
    await db(env, `users?id=eq.${adminId}`, "PATCH", { pin_hash: null });
    await env.BIZLI_MEMORY.delete(`pin_lock_${adminId}`); await env.BIZLI_MEMORY.delete(`pin_att_${adminId}`);
    await env.BIZLI_MEMORY.delete(`admin_reply_to_${chatId}`);
    await setAuthStateHelper(env, chatId, { step: "set_pin", userId: adminId });
    await sendTelegram(env, chatId, "🔑 PIN cleared. set new PIN:");
    return true;
  }

  if (lower === "!users") {
    const users = await db(env, "users?order=created_at.desc&limit=20");
    if (!users?.length) { await sendTelegram(env, chatId, "no users yet."); return true; }
    const lines = users.map((u: any) => `• ${u.display_name || "unnamed"} [${u.status}${u.is_blocked ? " 🚫" : ""}]\n  Code: ${u.identity_code}\n  ${u.id}`).join("\n\n");
    await sendTelegram(env, chatId, `👥 Users:\n\n${lines}`); return true;
  }

  if (lower.startsWith("!userdetails ")) {
    const q = trimmed.split(" ")[1];
    const ur = q.toUpperCase().startsWith("BZ-") ? await db(env, `users?identity_code=eq.${q.toUpperCase()}&limit=1`) : await db(env, `users?id=eq.${q}&limit=1`);
    const u = ur?.[0];
    if (!u) { await sendTelegram(env, chatId, "not found."); return true; }
    const ids = await db(env, `platform_identities?user_id=eq.${u.id}`);
    const [mems, msgs] = await Promise.all([db(env, `memories?user_id=eq.${u.id}&select=count`), db(env, `messages?user_id=eq.${u.id}&select=count`)]);
    await sendTelegram(env, chatId, `👤 ${u.display_name}\nCode: ${u.identity_code}\nID: ${u.id}\nGmail: ${u.gmail || "N/A"}\nStatus: ${u.status}${u.is_blocked ? " 🚫" : ""}\nPlatforms: ${ids?.map((i: any) => `${i.platform}(${i.platform_id})`).join(", ") || "none"}\nMemories: ${mems?.[0]?.count || 0} · Messages: ${msgs?.[0]?.count || 0}\nLast active: ${u.last_active || "never"}`);
    return true;
  }

  if (lower === "!userdetails") { await sendTelegram(env, chatId, "usage: !userdetails <id or BZ-XXXX>"); return true; }

  if (lower.startsWith("!approve ")) {
    const uid = await resolveUserId(env, trimmed.split(" ")[1] || "");
    if (!uid) { await sendTelegram(env, chatId, "usage: !approve <user_id or BZ-XXXX>"); return true; }
    await approveUser(env, uid);
    await sendTelegram(env, chatId, "✅ approved"); return true;
  }

  if (lower.startsWith("!deny ")) {
    const uid = await resolveUserId(env, trimmed.split(" ")[1]);
    if (!uid) { await sendTelegram(env, chatId, "user not found."); return true; }
    await denyUser(env, uid);
    await sendTelegram(env, chatId, "❌ denied"); return true;
  }
  if (lower.startsWith("!block ")) {
    const uid = await resolveUserId(env, trimmed.split(" ")[1]);
    if (!uid) { await sendTelegram(env, chatId, "user not found."); return true; }
    await blockUser(env, uid);
    await sendTelegram(env, chatId, "🚫 blocked"); return true;
  }
  if (lower.startsWith("!unblock ")) {
    const uid = await resolveUserId(env, trimmed.split(" ")[1]);
    if (!uid) { await sendTelegram(env, chatId, "user not found."); return true; }
    await db(env, `users?id=eq.${uid}`, "PATCH", { is_blocked: false, status: "approved" });
    const id = await db(env, `platform_identities?user_id=eq.${uid}&limit=1`);
    if (id?.[0]) await sendTelegram(env, id[0].platform_id, "you've been unblocked! welcome back 🎉");
    await sendTelegram(env, chatId, "✅ unblocked"); return true;
  }

  if (lower.startsWith("!memory ")) {
    const mems = await getUserMemories(env, trimmed.split(" ")[1]);
    if (!mems.length) { await sendTelegram(env, chatId, "no memories."); return true; }
    await sendTelegram(env, chatId, `🧠 Memories:\n\n${mems.map((m: any, i: number) => `${i+1}. [${m.category}] ${m.content}`).join("\n")}`); return true;
  }

  if (lower.startsWith("!wipememory ")) { await db(env, `memories?user_id=eq.${trimmed.split(" ")[1]}`, "DELETE"); await sendTelegram(env, chatId, "🗑️ wiped"); return true; }

  if (lower.startsWith("!broadcast ")) {
    const msg = trimmed.slice(11);
    const sent = await broadcastToTelegram(env, msg);
    await sendTelegram(env, chatId, `📢 sent to ${sent}`); return true;
  }

  if (lower.startsWith("!msg ")) {
    const parts = trimmed.split(" "); const uid = parts[1]; const msg = parts.slice(2).join(" ");
    if (!uid || !msg) { await sendTelegram(env, chatId, "usage: !msg <user_id> <message>"); return true; }
    const id = await db(env, `platform_identities?user_id=eq.${uid}&platform=eq.telegram&limit=1`);
    if (!id?.[0]) { await sendTelegram(env, chatId, "not found."); return true; }
    await sendTelegram(env, id[0].platform_id, msg); await sendTelegram(env, chatId, "✅ sent"); return true;
  }

  return false;
}
