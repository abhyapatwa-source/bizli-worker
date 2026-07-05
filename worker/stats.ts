import type { Env } from './types';
import { db } from './db';
import { getGroqKeys, getGeminiKeys, getCerebrasKeys, getOpenRouterKeys, hashPin, timeAgo, todayContext } from './utils';
import { DASHBOARD_HTML } from './html';
import { getGroqStatus, BIZLI_VERSION, callGroq, autoExtractMemory, sanitizePersonaLeaks, getActiveCerebrasModels, getActiveOpenRouterModels } from './brain';
import { BIZLI_TOOLS } from './tools';
import { getKVHistory, appendKVHistory, getRelevantMemories } from './memory';
import { getTestStats } from './tests';

const TOOL_KEY_MAP: Record<string, string> = {
  get_weather:     "API_NINJAS_KEY",
  get_news:        "NEWS_API_KEY",
  get_movie_info:  "TMDB_API_KEY",
  get_movie_poster:"TMDB_API_KEY",
  get_trending:    "TMDB_API_KEY",
  generate_image:  "HF_API_KEY",
  get_nasa_apod:   "NASA_API_KEY",
  search_web:      "TAVILY_API_KEY",
  send_gif:        "GIPHY_API_KEY",
  get_stock_price: "API_NINJAS_KEY",
  get_fun_fact:    "API_NINJAS_KEY",
  get_holidays:    "API_NINJAS_KEY",
};

const STATS_CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "no-store",
};

export async function handleAdminStats(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "";
  if (!env.ADMIN_PASSWORD || key !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: STATS_CORS });
  }

  const KEY_NAMES = ["Alpha","Bravo","Charlie","Delta","Echo","Foxtrot","Golf","Hotel",
    "India","Juliet","Kilo","Lima","Mike","November","Oscar","Papa","Quebec","Romeo",
    "Sierra","Tango","Uniform"];

  const [groqStatusRaw, lastBrainsRaw, errorsRaw, usersRows, msgsRows, memsCount,
    groqLiveRaw, geminiLiveRaw, lastModelCheckRaw, maintenanceModeRaw] = await Promise.all([
    env.BIZLI_MEMORY.get("groq_status"),
    env.BIZLI_MEMORY.get("last_brains"),
    env.BIZLI_MEMORY.get("recent_errors"),
    db(env, "users?select=id,status,display_name,identity_code,last_active&limit=500"),
    db(env, "messages?select=user_id&limit=10000"),
    db(env, "memories?select=count"),
    env.BIZLI_MEMORY.get("groq_live_models"),
    env.BIZLI_MEMORY.get("gemini_live_models"),
    env.BIZLI_MEMORY.get("last_model_check"),
    env.BIZLI_MEMORY.get("maintenance_mode"),
  ]);

  const groqKeys = getGroqKeys(env);
  const gStatus: { ptr: number; cooldowns: Record<number, number> } =
    groqStatusRaw ? (() => { try { return JSON.parse(groqStatusRaw); } catch { return { ptr: 0, cooldowns: {} }; } })()
    : { ptr: 0, cooldowns: {} };
  const now = Date.now();
  const groqData = groqKeys.map((_, i) => {
    const cd = gStatus.cooldowns[i] || 0;
    const remaining = cd - now;
    if (remaining > 0) {
      const kind = remaining > 60_000 ? "tpd_cooling" : "rpm_cooling";
      return { name: KEY_NAMES[i] || `Key${i}`, status: kind, secondsLeft: Math.ceil(remaining / 1000) };
    }
    const mc: Record<string, number> = (gStatus as any).mc || {};
    const keySlots = Object.entries(mc).filter(([k]) => k.startsWith(`${i}_`));
    const anyReady = !keySlots.length || keySlots.some(([, v]) => v <= now);
    if (anyReady) return { name: KEY_NAMES[i] || `Key${i}`, status: "ready", secondsLeft: 0 };
    const maxExpiry = Math.max(...keySlots.map(([, v]) => v));
    return { name: KEY_NAMES[i] || `Key${i}`, status: "rpm_cooling", secondsLeft: Math.ceil((maxExpiry - now) / 1000) };
  });

  let lastBrains: { brain: string; key?: number; timeAgo: string }[] = [];
  try {
    const arr: { brain: string; key?: number; ts: number }[] = lastBrainsRaw ? JSON.parse(lastBrainsRaw) : [];
    lastBrains = arr.slice(0, 10).map(e => ({ brain: e.brain, key: e.key, timeAgo: timeAgo(e.ts) }));
  } catch {}

  let recentErrors: { timestamp: string; detail: string }[] = [];
  if (errorsRaw) {
    try {
      const arr: { ts: string; detail: string }[] = JSON.parse(errorsRaw);
      if (Array.isArray(arr)) recentErrors = arr.slice(0, 20).map(e => ({ timestamp: e.ts, detail: e.detail }));
    } catch {
      recentErrors = [{ timestamp: new Date().toISOString(), detail: errorsRaw.slice(0, 300) }];
    }
  }

  const users: any[] = Array.isArray(usersRows) ? usersRows : [];
  const total = users.length;
  const approved = users.filter((u: any) => u.status === "approved").length;
  const waitlist = users.filter((u: any) => u.status === "waitlist").length;

  const msgCountMap: Record<string, number> = {};
  for (const m of (Array.isArray(msgsRows) ? msgsRows : [])) {
    if (m.user_id) msgCountMap[m.user_id] = (msgCountMap[m.user_id] || 0) + 1;
  }
  const totalMessages = (Array.isArray(msgsRows) ? msgsRows : []).length;

  const perUser = users
    .map((u: any) => ({
      name: u.display_name || "?",
      code: u.identity_code || "?",
      count: msgCountMap[u.id] || 0,
      lastOnlineIST: u.last_active
        ? new Date(u.last_active).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" })
        : "never",
    }))
    .sort((a: any, b: any) => b.count - a.count);

  const tools = BIZLI_TOOLS.map((t: any) => {
    const name: string = t.function.name;
    const reqKey = TOOL_KEY_MAP[name];
    const keyConfigured = !reqKey || !!((env as any)[reqKey]);
    return { name, keyConfigured };
  });

  const nowDate = new Date();
  const serverTime = {
    utc: nowDate.toUTCString(),
    ist: nowDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "medium" }),
  };

  let groqLiveText: string[] = [];
  let groqLiveVision = "llama-3.2-90b-vision-preview";
  try {
    if (groqLiveRaw) {
      const p = JSON.parse(groqLiveRaw);
      if (p?.text?.length) { groqLiveText = p.text; groqLiveVision = p.vision || groqLiveVision; }
    }
  } catch {}
  let geminiLiveModels: string[] = [];
  try { if (geminiLiveRaw) { const p = JSON.parse(geminiLiveRaw); if (Array.isArray(p)) geminiLiveModels = p; } } catch {}

  const payload = {
    version: BIZLI_VERSION,
    groq: groqData,
    gemini: { keysConfigured: getGeminiKeys(env, "lab").length, status: "standby" },
    cerebras: { keysConfigured: getCerebrasKeys(env).length, liveModels: await getActiveCerebrasModels(env), status: "standby" },
    openrouter: { configured: !!env.OPENROUTER_API_KEY, keysConfigured: getOpenRouterKeys(env).length, liveModels: await getActiveOpenRouterModels(env) },
    workerAI: { status: "standby" },
    lastBrains,
    recentErrors,
    users: { total, approved, waitlist },
    messages: { total: totalMessages, perUser },
    tools,
    memory: { count: memsCount?.[0]?.count ?? 0 },
    serverTime,
    models: {
      groqText: groqLiveText,
      groqVision: groqLiveVision,
      geminiLab: geminiLiveModels,
      lastProbeAt: lastModelCheckRaw ? parseInt(lastModelCheckRaw) : null,
    },
    maintenance: { on: maintenanceModeRaw === "on" },
    tests: await getTestStats(env),
  };

  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: STATS_CORS });
}

export function handleDashboard(_request: Request, _env: Env): Response {
  return new Response(DASHBOARD_HTML, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": "no-store, no-cache",
    },
  });
}

export async function handleWebChat(request: Request, env: Env): Promise<Response> {
  const R = (data: any, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

  let body: any;
  try { body = await request.json(); } catch { return R({ ok: false, error: "Invalid JSON" }, 400); }

  if (body.action === "login") {
    const code = (body.code || "").trim().toUpperCase();
    const pin = String(body.pin || "").trim();
    if (!code || !pin) return R({ ok: false, error: "Code and PIN required" });

    const users = await db(env, `users?identity_code=eq.${code}&limit=1`);
    if (!users?.length) return R({ ok: false, error: "Code not found — check it looks like BZ-XXXX" });
    const user = users[0];
    if (user.status === "waitlist") return R({ ok: false, error: "You're on the waitlist ⏳ hang tight!" });
    if (user.status === "denied" || user.is_blocked) return R({ ok: false, error: "Access not granted. Contact support." });

    const lockVal = await env.BIZLI_MEMORY.get(`pin_lock_${user.id}`);
    if (lockVal && Date.now() < parseInt(lockVal)) {
      const mins = Math.ceil((parseInt(lockVal) - Date.now()) / 60000);
      return R({ ok: false, error: `Locked for ${mins} more min — too many wrong PINs.` });
    }

    const hash = await hashPin(pin);
    if (hash !== user.pin_hash) {
      const attKey = `pin_att_${user.id}`;
      const att = parseInt(await env.BIZLI_MEMORY.get(attKey) || "0") + 1;
      if (att >= 3) {
        await env.BIZLI_MEMORY.put(`pin_lock_${user.id}`, String(Date.now() + 600000), { expirationTtl: 700 });
        await env.BIZLI_MEMORY.delete(attKey);
        return R({ ok: false, error: "3 wrong tries — locked for 10 min to keep you safe 🔒" });
      }
      await env.BIZLI_MEMORY.put(attKey, String(att), { expirationTtl: 600 });
      return R({ ok: false, error: `Wrong PIN — ${3 - att} tr${3 - att === 1 ? "y" : "ies"} left` });
    }

    await env.BIZLI_MEMORY.delete(`pin_att_${user.id}`);
    const tokenBytes = crypto.getRandomValues(new Uint8Array(24));
    const token = Array.from(tokenBytes, (b: number) => b.toString(16).padStart(2, "0")).join("");
    await env.BIZLI_MEMORY.put(`web_sess_${token}`, user.id, { expirationTtl: 86400 });
    return R({ ok: true, token, name: user.display_name });
  }

  const token = (body.token || "").trim();
  const message = (body.message || "").trim().slice(0, 2000);
  if (!token || !message) return R({ ok: false, error: "Missing token or message" }, 400);

  const userId = await env.BIZLI_MEMORY.get(`web_sess_${token}`);
  if (!userId) return R({ ok: false, error: "Session expired — please log in again" });

  const chatUser = (await db(env, `users?id=eq.${userId}&limit=1`))?.[0];
  if (!chatUser || chatUser.status !== "approved" || chatUser.is_blocked) return R({ ok: false, error: "Access denied" });

  // Maintenance gate — same rule as Telegram (creator passes through). Without
  // this, web users could keep chatting while Telegram users were locked out.
  if (!chatUser.is_creator) {
    const maintMode = await env.BIZLI_MEMORY.get("maintenance_mode");
    if (maintMode === "on") return R({ ok: false, error: "Bizli is under development right now 🛠️ I'll be back soon 💛" });
  }

  try {
    const [memories, kvHistory] = await Promise.all([
      getRelevantMemories(env, userId, message),
      getKVHistory(env, userId),
    ]);
    // Same self-awareness context web users get as Telegram users: who they are
    // + which platform this conversation lives on.
    const webSince = chatUser?.created_at
      ? new Date(chatUser.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : "recently";
    const webName = chatUser?.display_name || "friend";
    const webCode = chatUser?.identity_code ? ` | Code: ${chatUser.identity_code}` : "";
    const userBlock = chatUser?.is_creator
      ? `[CURRENT USER — PAPA: ${webName}${webCode} | Member since ${webSince} | Platform: Bizli Web Chat | This is your creator and father — warm daughterly affection, call him Papa. PRIVACY: strictly private conversation with Papa only.]`
      : `[CURRENT USER: ${webName}${webCode} | Member since ${webSince} | Platform: Bizli Web Chat | PRIVACY: This is a strictly private 1-on-1 conversation — address ${webName} warmly by name when natural.]`;
    const webTz = await env.BIZLI_MEMORY.get(`tz_${userId}`).catch(() => null);
    const memContext = todayContext(webTz || undefined) + "\n" + userBlock + "\n" + (memories.length > 0
      ? "[Memories]:\n" + memories.map((m: any) => `- ${m.content}`).join("\n")
      : "");
    const msgs = [...kvHistory.map((m: any) => ({ role: m.role, content: m.content })), { role: "user", content: message }];

    let reply = await callGroq(env, msgs, memContext, userId, true);
    if (reply === "IMAGE_GENERATED") {
      reply = "I just generated an image 🎨 If you're also on Telegram it'll be waiting there! Web image delivery is coming soon 💛";
    } else if (reply.startsWith("RICH_SENT:")) {
      reply = reply.slice(10);
    }
    // NEVER-SILENT: sanitizer can eat a whole reply — never return an empty one
    const cleaned = sanitizePersonaLeaks(reply).trim() || "okay my thoughts scrambled for a sec 😅 say that again?";

    await Promise.all([
      appendKVHistory(env, userId, "user", message),
      appendKVHistory(env, userId, "assistant", cleaned),
      db(env, "messages", "POST", { user_id: userId, platform: "web", role: "user", content: message }),
      db(env, "messages", "POST", { user_id: userId, platform: "web", role: "assistant", content: cleaned }),
      db(env, `users?id=eq.${userId}`, "PATCH", { last_active: new Date().toISOString() }),
    ]);
    setTimeout(() => autoExtractMemory(env, userId, message, cleaned).catch(() => {}), 0);
    return R({ ok: true, reply: cleaned });
  } catch {
    return R({ ok: true, reply: "give me a sec — I got a little tangled up 😅 try again?" });
  }
}
