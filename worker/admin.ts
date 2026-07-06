import type { Env } from './types';
import { db } from './db';
import { getGroqKeys, getGeminiKeys, getCerebrasKeys, getOpenRouterKeys } from './utils';
import { sendTelegram, editTelegramMessage, deleteTelegramMessage, broadcastToTelegram, answerCallback, sendSupportToAdmin } from './telegram';
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
// Card items are the SINGLE source of truth for the help menus: flash-card
// text, category pages, detail pages, and every bubble button are generated
// from these arrays. Adding/removing a command = update its handler AND here.
//
// run = what the ▶ Run button does.
//   USER_CARD:  a typed command executed via handleUserCommand with inPlace —
//               the result morphs INTO the menu message (the command's own
//               buttons merged with Back/Main-Menu rows). No extra messages.
//   ADMIN_CARD: "agent:<sub>" / "adm:<action>" dispatch through the existing
//               edit-in-place menu machinery; "!cmd" goes through handleAdmin.
//   No run → the detail page shows a "type it like" hint instead of ▶ Run.
// ask = for commands that need typed input: the ✍️ button sets an await_input
//       state with this prompt — the user's next plain message becomes the
//       argument (no "!command" typing needed). Consumed in auth.ts.
//
// NOTE: buttons carry array indices — reordering items between deploys makes
// buttons in old messages point elsewhere; out-of-range ones degrade to the
// main menu (acceptable).
type CardItem = { cmd: string; desc: string; btn: string; usage?: string; example?: string; run?: string; ask?: string };
type CardGroup = { group: string; items: CardItem[] };

const USER_CARD: CardGroup[] = [
  { group: "👤 Account", items: [
    { cmd: "!mydetails", desc: "your profile + edit buttons", btn: "👤 My Details", run: "!mydetails" },
    { cmd: "!settings", desc: "timezone & daily greetings", btn: "⚙️ Settings", run: "!settings" },
    { cmd: "!logout", desc: "log out", btn: "🚪 Logout", run: "!logout" },
  ] },
  { group: "🧠 Memory", items: [
    { cmd: "!remember <thing>", desc: "I'll never forget it", btn: "💾 Remember", example: "!remember I love mango ice cream", ask: "what should I remember? just type it 👇" },
    { cmd: "!memories", desc: "what I know about you", btn: "🧠 Memories", run: "!memories" },
    { cmd: "!forget <n>", desc: "make me forget", btn: "🗑️ Forget", usage: "!forget <n|all>", example: "!forget 2", ask: "which memory number should I forget? just type the number (or \"all\") 👇" },
  ] },
  { group: "🔍 Tools", items: [
    { cmd: "!search <query>", desc: "force a web search", btn: "🔍 Search", example: "!search latest AI news", ask: "what should I search for? just type it 👇" },
    { cmd: "!status", desc: "am I feeling okay?", btn: "💚 Status", run: "!status" },
    { cmd: "!myusage", desc: "your daily limits", btn: "📊 My Usage", run: "!myusage" },
  ] },
  { group: "🆘 Help", items: [
    { cmd: "!support <msg>", desc: "reach my developer", btn: "🆘 Support", example: "!support the bot feels slow today", run: "!support" },
    { cmd: "!feedback <msg>", desc: "tell us anything", btn: "📝 Feedback", example: "!feedback loving the new menus!", ask: "tell me anything — just type your feedback 👇" },
    { cmd: "!forgotpin", desc: "PIN reset request", btn: "🔑 Forgot PIN", run: "!forgotpin" },
    { cmd: "!deleteme", desc: "delete my account & data", btn: "❌ Delete Me", run: "!deleteme" },
  ] },
];

const ADMIN_CARD: CardGroup[] = [
  { group: "🔐 ADMIN — PEOPLE", items: [
    { cmd: "!users", desc: "list everyone", btn: "👥 List Users", run: "adm:do_users" },
    { cmd: "!userdetails <id>", desc: "one user's full info", btn: "🪪 User Details", example: "!userdetails BZ-1234" },
    { cmd: "!approve <id> · !deny <id>", desc: "waitlist decisions", btn: "✅ Approve / Deny", example: "!approve BZ-1234" },
    { cmd: "!block <id> · !unblock <id>", desc: "ban controls", btn: "🚫 Block / Unblock", example: "!block BZ-1234" },
    { cmd: "!memory <id> · !wipememory <id>", desc: "view / erase memories", btn: "🧠 User Memory", example: "!memory BZ-1234" },
    { cmd: "!msg <id> <text>", desc: "DM one user", btn: "💬 DM User", example: "!msg BZ-1234 hello from the dev" },
    { cmd: "!broadcast <msg>", desc: "message everyone", btn: "📢 Broadcast", example: "!broadcast Bizli gets new powers tonight 🎉" },
    { cmd: "!close", desc: "end reply mode", btn: "🔚 Close Reply", example: "!close" },
  ] },
  { group: "🤖 AGENT — SYSTEM", items: [
    { cmd: "!agent status", desc: "brain map + overview", btn: "🧠 Brain Map", run: "agent:status" },
    { cmd: "!agent quota", desc: "live key usage vs soft limits", btn: "📊 Quota", run: "agent:quota" },
    { cmd: "!agent test", desc: "canary-test the brain now", btn: "🧪 Test Brain", run: "agent:test" },
    { cmd: "!agent models", desc: "live model list", btn: "📡 Models", run: "agent:models" },
    { cmd: "!agent refresh models", desc: "probe all providers", btn: "🔄 Refresh Models", run: "agent:refresh models" },
    { cmd: "!agent errors", desc: "recent errors", btn: "🐛 Errors", run: "agent:errors" },
    { cmd: "!agent addendum", desc: "learned rules (self-improve kit)", btn: "📜 Learned Rules", run: "agent:addendum" },
    { cmd: "!agent kv", desc: "storage breakdown", btn: "🗂️ KV Storage", run: "agent:kv" },
    { cmd: "!agent uptime", desc: "version + uptime", btn: "🕐 Uptime", run: "agent:uptime" },
    { cmd: "!agent report", desc: "daily health report", btn: "📋 Daily Report", run: "agent:report" },
    { cmd: "!agent tools", desc: "list the 13 tools", btn: "🔧 Tools", run: "agent:tools" },
    { cmd: "!agent feedback", desc: "user feedback summary", btn: "💬 Feedback", run: "agent:feedback" },
    { cmd: "!agent fix lockouts", desc: "clear PIN lockouts", btn: "🔓 Fix Lockouts", run: "agent:fix lockouts" },
    { cmd: "!agent clear cache", desc: "reset caches", btn: "🧹 Clear Cache", run: "agent:clear cache" },
    { cmd: "!agent clear search", desc: "clear search cache", btn: "🔍 Clear Search", run: "agent:clear search" },
    { cmd: "!agent clear history <uid>", desc: "wipe a chat history", btn: "🗑️ Clear History", example: "!agent clear history <user-id>" },
    { cmd: "!agent clear session <cid>", desc: "reset an auth session", btn: "♻️ Clear Session", example: "!agent clear session 123456789" },
    { cmd: "!agent broadcast test", desc: "responsiveness check", btn: "📣 Broadcast Test", run: "agent:broadcast test" },
  ] },
  { group: "🛠️ CONTROL", items: [
    { cmd: "!maintenance on/off", desc: "lock/unlock the bot", btn: "🛠️ Maintenance", usage: "!maintenance on · !maintenance off", example: "!maintenance on" },
    { cmd: "!vault", desc: "Bizli's diary", btn: "📔 Vault", run: "adm:vault" },
    { cmd: "!resetmypin", desc: "reset your own PIN", btn: "🔑 Reset My PIN", run: "!resetmypin" },
    { cmd: "!adminoff", desc: "exit admin mode", btn: "🔒 Exit Admin", run: "adm:exit" },
  ] },
];

function renderCard(title: string, card: CardGroup[], footer = ""): string {
  return `${title}\n\n` +
    card.map(g => `${g.group}\n` + g.items.map(it => `${it.cmd} — ${it.desc}`).join("\n")).join("\n\n") +
    (footer ? `\n\n${footer}` : "");
}

export function adminCardText(): string {
  return renderCard(`🔐 BIZLI ADMIN — ${BIZLI_VERSION}`, ADMIN_CARD);
}

export function getUserCardItem(g: number, i: number): CardItem | null {
  return USER_CARD[g]?.items[i] || null;
}

// --- Menu building blocks (shared by user help + admin menus) ---

function pairRows(btns: { text: string; callback_data: string }[]): any[] {
  const rows: any[] = [];
  for (let i = 0; i < btns.length; i += 2) rows.push(btns.slice(i, i + 2));
  return rows;
}

function navRow(backCb: string | null, homeCb: string, homeLabel: string): any[] {
  const row: any[] = [];
  if (backCb) row.push({ text: "⬅️ Back", callback_data: backCb });
  row.push({ text: `🏠 ${homeLabel}`, callback_data: homeCb });
  return [row];
}

function categoryPageText(grp: CardGroup): string {
  return `${grp.group}\n\n` + grp.items.map(it => `${it.cmd} — ${it.desc}`).join("\n") +
    `\n\n👇 Tap a command for details`;
}

function detailText(item: CardItem, groupName: string): string {
  const usage = item.usage || item.cmd;
  const ex = item.example || usage;
  return `${groupName}\n\n${item.cmd}\n${item.desc}\n\nUsage: ${usage}\nExample: ${ex}` +
    (item.run ? `\n\n▶ Tap Run below, or type it yourself.` :
     item.ask ? `\n\n✍️ Tap below and just type the value — no command needed.` :
     `\n\n⌨️ Type it like: ${ex}`);
}

function adminMainKeyboard() {
  return { inline_keyboard: [
    ...ADMIN_CARD.map((grp, g) => [{ text: grp.group, callback_data: `adm:c:${g}` }]),
    [{ text: "📈 Live Activity", callback_data: "adm:live_activity" }, { text: "📊 Stats & Storage", callback_data: "adm:stats_cat" }],
    [{ text: "🔒 Exit admin", callback_data: "adm:exit" }],
  ] };
}

function agentResultKeyboard() {
  return { inline_keyboard: navRow("adm:c:1", "adm:menu", "Admin Menu") };
}

function adminBack(backCb = "adm:menu") {
  if (backCb === "adm:menu") return { inline_keyboard: [[{ text: "🏠 Admin Menu", callback_data: "adm:menu" }]] };
  return { inline_keyboard: navRow(backCb, "adm:menu", "Admin Menu") };
}

export async function runAdminMenu(env: Env, chatId: string, cmd: string, messageId?: number): Promise<void> {
  const show = async (text: string, kb: any) => {
    if (messageId) await editTelegramMessage(env, chatId, messageId, text, kb);
    else await sendTelegram(env, chatId, text, { reply_markup: kb });
  };

  if (cmd === "menu" || cmd === "") {
    await show(`🔐 Bizli Admin — ${BIZLI_VERSION}\n\nChoose a realm 👇`, adminMainKeyboard());
  } else if (cmd.startsWith("c:")) {
    // Realm page: flash card + one bubble button per command.
    const g = parseInt(cmd.slice(2));
    const grp = ADMIN_CARD[g];
    if (!grp) { await runAdminMenu(env, chatId, "menu", messageId); return; }
    await show(categoryPageText(grp), { inline_keyboard: [
      ...pairRows(grp.items.map((it, i) => ({ text: it.btn, callback_data: `adm:d:${g}:${i}` }))),
      ...navRow(null, "adm:menu", "Admin Menu"),
    ] });
  } else if (cmd.startsWith("d:")) {
    // Command detail page: usage + example + Run (or typed hint).
    const [gs, is] = cmd.slice(2).split(":");
    const g = parseInt(gs);
    const grp = ADMIN_CARD[g];
    const item = grp?.items[parseInt(is)];
    if (!grp || !item) { await runAdminMenu(env, chatId, "menu", messageId); return; }
    const rows: any[] = [];
    if (item.cmd.startsWith("!maintenance")) {
      // Detail page doubles as the confirm step — these broadcast to everyone.
      rows.push([{ text: "🛠️ Maintenance ON", callback_data: "adm:maint_on" }, { text: "✅ Maintenance OFF", callback_data: "adm:maint_off" }]);
    } else if (item.run) {
      rows.push([{ text: "▶ Run", callback_data: `adm:r:${g}:${is}` }]);
    }
    rows.push(...navRow(`adm:c:${g}`, "adm:menu", "Admin Menu"));
    await show(detailText(item, grp.group), { inline_keyboard: rows });
  } else if (cmd.startsWith("r:")) {
    const [gs, is] = cmd.slice(2).split(":");
    const run = ADMIN_CARD[parseInt(gs)]?.items[parseInt(is)]?.run;
    if (!run) { await runAdminMenu(env, chatId, "menu", messageId); return; }
    if (run.startsWith("agent:")) await runAgentCommand(env, chatId, run.slice(6), messageId);
    else if (run.startsWith("adm:")) await runAdminMenu(env, chatId, run.slice(4), messageId);
    else await handleAdmin(env, chatId, run); // typed flows (e.g. !resetmypin) send fresh messages
  } else if (cmd === "users_cat" || cmd === "comm_cat") {
    // Legacy buttons in old messages → PEOPLE realm.
    await runAdminMenu(env, chatId, "c:0", messageId);
  } else if (cmd === "do_users") {
    const users = await db(env, "users?order=created_at.desc&limit=30");
    const lines = (users || []).map((u: any) =>
      `${u.status === "approved" ? "✅" : u.status === "waitlist" ? "⏳" : "❌"} ${u.display_name || "?"} · ${u.identity_code || "?"}${u.is_blocked ? " 🚫" : ""}`);
    await show(`👥 Users (${users?.length || 0}):\n\n${lines.join("\n") || "(none)"}`, adminBack("adm:c:0"));
  } else if (cmd === "stats_cat") {
    await show(
      "📊 Stats & Storage\n\nTap an option 👇",
      { inline_keyboard: [
        [{ text: "📊 Overall stats", callback_data: "adm:do_stats" }, { text: "💾 Storage breakdown", callback_data: "adm:do_storage" }],
        ...navRow(null, "adm:menu", "Admin Menu"),
      ] });
  } else if (cmd === "do_stats") {
    const [allU, appr, wait, msgs, mems] = await Promise.all([
      db(env, "users?select=count"), db(env, "users?status=eq.approved&select=count"),
      db(env, "users?status=eq.waitlist&select=count"), db(env, "messages?select=count"), db(env, "memories?select=count"),
    ]);
    await show(`📊 Stats\n\n👥 Users: ${allU?.[0]?.count || 0}\n✅ Approved: ${appr?.[0]?.count || 0}\n⏳ Waitlist: ${wait?.[0]?.count || 0}\n💬 Messages: ${msgs?.[0]?.count || 0}\n🧠 Memories: ${mems?.[0]?.count || 0}`, adminBack("adm:stats_cat"));
  } else if (cmd === "do_storage") {
    const list = await env.BIZLI_MEMORY.list();
    const prefixes: Record<string, number> = {};
    for (const k of list.keys || []) {
      const p = k.name.split(/[_:]/)[0];
      prefixes[p] = (prefixes[p] || 0) + 1;
    }
    const lines = Object.entries(prefixes).sort((a, b) => b[1] - a[1]).map(([p, n]) => `• ${p}: ${n}`);
    await show(`💾 KV Storage (${list.keys?.length || 0} keys)\n\n${lines.join("\n")}`, adminBack("adm:stats_cat"));
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
      { inline_keyboard: [...deleteButtons, ...navRow("adm:c:2", "adm:menu", "Admin Menu")] }
    );
  } else if (cmd === "maint_on") {
    await env.BIZLI_MEMORY.put("maintenance_mode", "on");
    const sentOn = await broadcastToTelegram(env, "🛠️ Bizli is currently under maintenance.\nI'll be back online shortly.\nTo reach the developer, type: !support <your message>");
    await show(`🛠️ Maintenance mode ON — broadcast sent to ${sentOn} users.\n\nAll users (except you) now see a friendly hold message. !support still works for everyone.\n\nTap ✅ Maintenance OFF to restore.`, adminMainKeyboard());
  } else if (cmd === "maint_off") {
    await env.BIZLI_MEMORY.delete("maintenance_mode");
    const notifListOff = await env.BIZLI_MEMORY.list({ prefix: "maint_notified_" });
    await Promise.all(notifListOff.keys.map((k: any) => env.BIZLI_MEMORY.delete(k.name)));
    const sentOff = await broadcastToTelegram(env, "✅ Bizli is back online.\nThank you for your patience 💛");
    await show(`✅ Maintenance mode OFF — broadcast sent to ${sentOff} users. Bizli is live for everyone again 💛`, adminMainKeyboard());
  } else if (cmd === "exit") {
    await env.BIZLI_MEMORY.delete(`admin_session_${chatId}`);
    await show("🔒 Admin mode ended. Type !admin <password> to re-enter.", { inline_keyboard: [] });
  }
}

// Nested flash-card help menu, generated from USER_CARD — ONE message that
// morphs in place. cmd: "m"/default = main menu (category buttons),
// "c:<g>" = category page, "d:<g>:<i>" = command detail page.
// help:r:<g>:<i> (▶ Run) is handled in commands.ts, which owns handleUserCommand.
// Any old/stale help:* button from previous messages lands on the main menu.
export async function runHelpMenu(env: Env, chatId: string, cmd: string, messageId?: number): Promise<void> {
  const show = async (text: string, kb: any) => {
    if (messageId) await editTelegramMessage(env, chatId, messageId, text, kb);
    else await sendTelegram(env, chatId, text, { reply_markup: kb });
  };
  if (cmd.startsWith("c:")) {
    const g = parseInt(cmd.slice(2));
    const grp = USER_CARD[g];
    if (grp) {
      await show(categoryPageText(grp), { inline_keyboard: [
        ...pairRows(grp.items.map((it, i) => ({ text: it.btn, callback_data: `help:d:${g}:${i}` }))),
        ...navRow(null, "help:m", "Main Menu"),
      ] });
      return;
    }
  } else if (cmd.startsWith("d:")) {
    const [gs, is] = cmd.slice(2).split(":");
    const g = parseInt(gs);
    const grp = USER_CARD[g];
    const item = grp?.items[parseInt(is)];
    if (grp && item) {
      const rows: any[] = [];
      if (item.run) rows.push([{ text: "▶ Run", callback_data: `help:r:${g}:${is}` }]);
      else if (item.ask) rows.push([{ text: "✍️ Type it here", callback_data: `help:a:${g}:${is}` }]);
      rows.push(...navRow(`help:c:${g}`, "help:m", "Main Menu"));
      await show(detailText(item, grp.group), { inline_keyboard: rows });
      return;
    }
  }
  // Main menu — also the graceful fallback for unknown/stale callbacks.
  await show(
    "✨ BIZLI — COMMANDS\n\nPick a category 👇\n\n💬 Everything else? Just talk to me — weather, jokes, prices, photos, anything.",
    { inline_keyboard: USER_CARD.map((grp, g) => [{ text: grp.group, callback_data: `help:c:${g}` }]) }
  );
}

export async function runAgentCommand(env: Env, chatId: string, agentCmd: string, messageId?: number): Promise<void> {
  // Every agent result edits in place (when tapped) with Back → AGENT realm.
  const out = async (text: string) => {
    const kb = agentResultKeyboard();
    if (messageId) await editTelegramMessage(env, chatId, messageId, text, kb);
    else await sendTelegram(env, chatId, text, { reply_markup: kb });
  };

  if (agentCmd === "menu") {
    // The AGENT realm page IS the agent panel now (legacy agent:menu buttons land here too).
    await runAdminMenu(env, chatId, "c:1", messageId);
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
    await out(brainMap);
  } else if (agentCmd === "clear cache") {
    const users = await db(env, "users?select=id");
    for (const u of users || []) {
      await env.BIZLI_MEMORY.delete(`pin_lock_${u.id}`);
      await env.BIZLI_MEMORY.delete(`pin_att_${u.id}`);
    }
    await env.BIZLI_MEMORY.delete("groq_status");
    await out("✅ cache cleared + Groq key cooldowns reset — all keys back online");
  } else if (agentCmd === "clear search") {
    const list = await env.BIZLI_MEMORY.list({ prefix: "search_cache_" });
    let n = 0;
    for (const k of list.keys || []) { await env.BIZLI_MEMORY.delete(k.name); n++; }
    await out(`✅ cleared ${n} cached searches — next searches will be fresh`);
  } else if (agentCmd.startsWith("clear history ")) {
    const uid = agentCmd.slice(14).trim();
    await env.BIZLI_MEMORY.delete(`history_${uid}`);
    await out(`✅ history cleared for ${uid}`);
  } else if (agentCmd === "report") {
    await runAgents(env);
    await out("✅ report sent");
  } else if (agentCmd === "tools") {
    const toolList = BIZLI_TOOLS.map((t: any) => `• ${t.function.name} — ${(t.function.description || "").slice(0, 70)}`).join("\n");
    await out(`🔧 Active tools (${BIZLI_TOOLS.length}):\n\n${toolList}`);
  } else if (agentCmd === "fix lockouts") {
    const users = await db(env, "users?select=id");
    for (const u of users || []) { await env.BIZLI_MEMORY.delete(`pin_lock_${u.id}`); await env.BIZLI_MEMORY.delete(`pin_att_${u.id}`); }
    await out("✅ all lockouts cleared");
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
      `⚡ Cerebras / 🌐 OpenRouter: reactive fallbacks (no proactive counters)`);
  } else if (agentCmd === "test") {
    const t0 = Date.now();
    let reply = "";
    try { reply = await callGroq(env, [{ role: "user", content: "Canary check — reply with one short friendly line." }], ""); } catch {}
    const ms = Date.now() - t0;
    const lastRaw = await env.BIZLI_MEMORY.get("last_brains");
    let provider = "unknown";
    try { const arr = lastRaw ? JSON.parse(lastRaw) : []; if (arr[0]?.brain) provider = arr[0].brain; } catch {}
    if (reply) await out(`🧪 canary PASSED — ${ms}ms via ${provider}\n\nreply: "${reply.slice(0, 150)}"`);
    else await out(`🧪 canary FAILED after ${ms}ms — brain returned nothing. check !agent errors`);
  } else if (agentCmd === "kv") {
    const list = await env.BIZLI_MEMORY.list();
    const keys = list.keys || [];
    const groups: Record<string, number> = {};
    for (const k of keys) {
      const prefix = k.name.split("_")[0];
      groups[prefix] = (groups[prefix] || 0) + 1;
    }
    const lines = Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k}_*: ${v}`);
    await out(`🗂️ KV keys: ${keys.length} total\n\n${lines.join("\n") || "(empty)"}`);
  } else if (agentCmd === "errors") {
    const errRaw = await env.BIZLI_MEMORY.get("recent_errors");
    if (!errRaw) { await out("✅ no recent errors logged"); }
    else {
      let lines = errRaw;
      try {
        const arr: { ts: string; detail: string }[] = JSON.parse(errRaw);
        if (Array.isArray(arr)) lines = arr.slice(0, 5).map(e => `[${e.ts.slice(0,19)}] ${e.detail}`).join("\n");
      } catch {}
      await out(`🐛 Recent errors (last 5):\n\n${lines}`);
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
      await out("📊 Feedback\n\nNo feedback yet. 👍/👎 buttons appear under info/search replies — once users tap them, results show here.");
    } else {
      await out(`📊 Feedback\n\n👍 ${upCount} · 👎 ${downCount}${total > 0 ? ` · ${pct}% positive` : ""}${downSamples}${textSamples}`);
    }
  } else if (agentCmd === "broadcast test") {
    await out("✅ agent online and responsive — test successful");
  } else if (agentCmd.startsWith("clear session ")) {
    const cid = agentCmd.slice(14).trim();
    await env.BIZLI_MEMORY.delete(`auth_${cid}`);
    await env.BIZLI_MEMORY.delete(`admin_session_${cid}`);
    await out(`✅ session cleared for ${cid}`);
  } else if (agentCmd === "addendum clear") {
    // Self-improvement kit: wipe the admin-approved learned rules
    await env.BIZLI_MEMORY.delete("rules_addendum");
    await out("🧽 learned-rules addendum cleared — her brain runs on CRITICAL_RULES only now");
  } else if (agentCmd === "addendum") {
    const a = (await env.BIZLI_MEMORY.get("rules_addendum")) || "";
    await out(a
      ? `📜 LEARNED RULES (${a.length}/600 chars, live in every reply):\n\n${a}\n\n🧽 Clear: !agent addendum clear`
      : "📜 learned-rules addendum is empty — approve ideas from the daily 💡 report to teach her new rules");
  } else if (agentCmd === "uptime") {
    const lastReport = await env.BIZLI_MEMORY.get("last_daily_report");
    await out(`🕐 Now: ${new Date().toUTCString()}\n📋 Last daily report: ${lastReport ? new Date(parseInt(lastReport)).toUTCString() : "never"}\n🤖 Version: ${BIZLI_VERSION}`);
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
    await out(lines.join("\n"));
  } else if (agentCmd === "refresh models") {
    await out("🔍 Probing all provider model pools — ~20s...");
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
    await out(lines.join("\n"));
  } else {
    // Unknown subcommand → back to the admin main menu.
    await runAdminMenu(env, chatId, "menu", messageId);
  }
}

// ——— Admin gate v2 (v12.38.0): 12h lock after 3 wrong passwords, recover by
// gmail, hard lock (7 days) after 8 total failed attempts, admin alerts. ———

const ADMIN_MAX_ATTEMPTS = 8;      // passwords + gmail tries combined
const ADMIN_LOCK_MS = 43200000;    // 12h
const ADMIN_HARDLOCK_TTL = 604800; // 7 days

function adminLockKeyboard(chatId: string): any {
  return { reply_markup: { inline_keyboard: [
    [{ text: "🆘 Support", callback_data: `support_cat:${chatId}|adminlock` }],
    [{ text: "🔁 Recover by Gmail", callback_data: `admrec:${chatId}` }],
  ] } };
}

async function alertAdminLock(env: Env, chatId: string, att: number, kind: string): Promise<void> {
  await sendTelegram(env, env.ADMIN_CHAT_ID,
    `⚠️ Admin lockout: chat ${chatId} — ${att} failed attempts (${kind}).`,
    { reply_markup: { inline_keyboard: [[{ text: "🔓 Unlock", callback_data: `admunlock:${chatId}` }]] } });
}

// One failed try (wrong password OR wrong recovery gmail). Escalation:
// 3+ password fails → 12h lock · 8 total fails → 7-day hard lock.
async function adminFailedAttempt(env: Env, chatId: string, kind: "password" | "gmail"): Promise<void> {
  const att = parseInt(await env.BIZLI_MEMORY.get(`admin_att_${chatId}`) || "0") + 1;
  await env.BIZLI_MEMORY.put(`admin_att_${chatId}`, String(att), { expirationTtl: 43200 });
  if (att >= ADMIN_MAX_ATTEMPTS) {
    await env.BIZLI_MEMORY.put(`admin_hardlock_${chatId}`, "1", { expirationTtl: ADMIN_HARDLOCK_TTL });
    await env.BIZLI_MEMORY.delete(`admin_recover_wait_${chatId}`);
    await sendTelegram(env, chatId, "🔒 too many failed attempts — admin access is fully locked. contact !support.");
    await alertAdminLock(env, chatId, att, "HARD LOCK, 7 days");
  } else if (kind === "password" && att >= 3) {
    await env.BIZLI_MEMORY.put(`admin_lock_${chatId}`, String(Date.now() + ADMIN_LOCK_MS), { expirationTtl: 43500 });
    await sendTelegram(env, chatId, "wrong password — admin login is locked for 12 hours.", adminLockKeyboard(chatId));
    await alertAdminLock(env, chatId, att, "12h lock");
  } else if (kind === "gmail") {
    await sendTelegram(env, chatId, `that's not it. ${ADMIN_MAX_ATTEMPTS - att} tries left before a full lock — type the gmail again, or "cancel".`);
  } else {
    await sendTelegram(env, chatId, `wrong. ${3 - att} left.`);
  }
}

async function attemptAdminPassword(env: Env, chatId: string, pass: string, messageId?: number): Promise<void> {
  // The typed password never sits in chat history
  if (messageId) await deleteTelegramMessage(env, chatId, messageId);
  if (await env.BIZLI_MEMORY.get(`admin_hardlock_${chatId}`)) {
    await sendTelegram(env, chatId, "🔒 admin access is locked. contact !support."); return;
  }
  const lockVal = await env.BIZLI_MEMORY.get(`admin_lock_${chatId}`);
  if (lockVal && Date.now() < parseInt(lockVal)) {
    const hrs = Math.max(1, Math.ceil((parseInt(lockVal) - Date.now()) / 3600000));
    await sendTelegram(env, chatId, `🔒 admin login is locked (~${hrs}h left).`, adminLockKeyboard(chatId)); return;
  }
  // Fail closed: no hardcoded fallback — if the secret is unset, nobody gets in.
  if (env.ADMIN_PASSWORD && pass === env.ADMIN_PASSWORD) {
    await setAdminSession(env, chatId);
    await env.BIZLI_MEMORY.delete(`admin_att_${chatId}`);
    await env.BIZLI_MEMORY.delete(`admin_lock_${chatId}`);
    await sendTelegram(env, chatId, `🔓 Admin mode (15 min)\n\n🔐 Bizli Admin — ${BIZLI_VERSION}\n\nChoose a realm 👇`, { reply_markup: adminMainKeyboard() });
  } else {
    await adminFailedAttempt(env, chatId, "password");
  }
}

// Recovery: the typed gmail must match the ADMIN's registered gmail. A match
// only clears the lock — the password is still required to get in.
export async function startAdminRecover(env: Env, chatId: string): Promise<void> {
  if (await env.BIZLI_MEMORY.get(`admin_hardlock_${chatId}`)) {
    await sendTelegram(env, chatId, "🔒 admin access is locked. contact !support."); return;
  }
  await env.BIZLI_MEMORY.put(`admin_recover_wait_${chatId}`, "1", { expirationTtl: 600 });
  await sendTelegram(env, chatId, "enter the admin recovery gmail 👇 (or type \"cancel\")");
}

export async function clearAdminLocks(env: Env, chatId: string): Promise<void> {
  await Promise.all([
    env.BIZLI_MEMORY.delete(`admin_lock_${chatId}`),
    env.BIZLI_MEMORY.delete(`admin_hardlock_${chatId}`),
    env.BIZLI_MEMORY.delete(`admin_att_${chatId}`),
    env.BIZLI_MEMORY.delete(`admin_pw_wait_${chatId}`),
    env.BIZLI_MEMORY.delete(`admin_recover_wait_${chatId}`),
  ]);
}

export async function handleAdmin(env: Env, chatId: string, text: string, messageId?: number): Promise<boolean> {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Pending waits (set by bare /admin and the Recover button) — a plain
  // message is the password / recovery gmail. !/​/ messages drop the wait.
  if (!trimmed.startsWith("!") && !trimmed.startsWith("/")) {
    if (await env.BIZLI_MEMORY.get(`admin_recover_wait_${chatId}`)) {
      if (/^(cancel|stop|exit|quit)$/i.test(lower)) {
        await env.BIZLI_MEMORY.delete(`admin_recover_wait_${chatId}`);
        await sendTelegram(env, chatId, "cancelled 👍"); return true;
      }
      const adminUser = (await db(env, `users?gmail_hash=eq.tg_${env.ADMIN_CHAT_ID}&limit=1`))?.[0];
      if (adminUser?.gmail && lower === String(adminUser.gmail).toLowerCase().trim()) {
        await env.BIZLI_MEMORY.delete(`admin_recover_wait_${chatId}`);
        await env.BIZLI_MEMORY.delete(`admin_lock_${chatId}`);
        await env.BIZLI_MEMORY.delete(`admin_att_${chatId}`);
        await sendTelegram(env, chatId, "✅ verified — the lock is cleared. try your password again with /admin");
        if (chatId !== env.ADMIN_CHAT_ID) {
          await sendTelegram(env, env.ADMIN_CHAT_ID, `⚠️ Admin lock on chat ${chatId} was cleared via gmail recovery.`);
        }
      } else {
        await adminFailedAttempt(env, chatId, "gmail");
      }
      return true;
    }
    if (await env.BIZLI_MEMORY.get(`admin_pw_wait_${chatId}`)) {
      await env.BIZLI_MEMORY.delete(`admin_pw_wait_${chatId}`);
      if (/^(cancel|stop|exit|quit)$/i.test(lower)) { await sendTelegram(env, chatId, "cancelled 👍"); return true; }
      await attemptAdminPassword(env, chatId, trimmed, messageId);
      return true;
    }
  }

  // Bare /admin (menu tap) → ask for the password conversationally
  if (lower === "!admin") {
    if (await env.BIZLI_MEMORY.get(`admin_hardlock_${chatId}`)) {
      await sendTelegram(env, chatId, "🔒 admin access is locked. contact !support."); return true;
    }
    const lockVal = await env.BIZLI_MEMORY.get(`admin_lock_${chatId}`);
    if (lockVal && Date.now() < parseInt(lockVal)) {
      const hrs = Math.max(1, Math.ceil((parseInt(lockVal) - Date.now()) / 3600000));
      await sendTelegram(env, chatId, `🔒 admin login is locked (~${hrs}h left).`, adminLockKeyboard(chatId)); return true;
    }
    await env.BIZLI_MEMORY.put(`admin_pw_wait_${chatId}`, "1", { expirationTtl: 300 });
    await sendTelegram(env, chatId, "enter the admin password 👇 (or type \"cancel\")");
    return true;
  }

  if (lower.startsWith("!admin ")) {
    await attemptAdminPassword(env, chatId, trimmed.slice(7).trim(), messageId);
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
