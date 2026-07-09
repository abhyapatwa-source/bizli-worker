import type { Env } from './types';
import { db } from './db';
import { getGroqKeys, getUserLocalHour, MORNING_MSGS, NIGHT_MSGS, fetchTimeout } from './utils';
import { sendTelegram } from './telegram';
import { getGroqStatus, probeAllProviders } from './brain';
import { runIdeaReport } from './tests';

function pickProactiveMessage(name: string, localHour: number): string {
  const first = name.split(" ")[0];
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  if (localHour >= 6 && localHour < 12) {
    return pick([
      `good morning ${first}! ☀️ hope you slept well — what's the plan today?`,
      `hey ${first}! 🌅 new day. how are you starting it? energized or still half asleep lol`,
      `morning check-in! 😊 if today had to go one way, what would make it a good day for you ${first}?`,
      `rise and shine ${first}! 🌞 I was thinking — what's one thing you're actually looking forward to today?`,
    ]);
  }
  if (localHour >= 12 && localHour < 17) {
    return pick([
      `hey ${first}! 💫 afternoon check-in — how's the day treating you so far?`,
      `${first}! just thinking of you 😊 what's going on? busy or just vibing?`,
      `mid-day check-in 🕐 tell me something that happened today — good, bad, or just random lol`,
      `hey! how's your day going ${first}? I'm here if you wanna talk, vent, or just ramble 😄`,
    ]);
  }
  if (localHour >= 17 && localHour < 21) {
    return pick([
      `evening ${first}! 🌆 how was your day? tell me the highlight (or the disaster lol)`,
      `hey! the day's almost done — what was the best part of today ${first}? 💛`,
      `evening check-in 🌇 tired, energized, or somewhere in between?`,
      `${first}! 🌙 quick question — what's something that made you smile today? even tiny counts`,
    ]);
  }
  return pick([
    `hey ${first} 🌙 still up? how are you feeling tonight?`,
    `night thoughts hit different huh 💭 what's on your mind ${first}?`,
    `hey! just checking in before the day ends 🌟 how did today go for you?`,
    `${first} 💛 hope today was good to you. wanna chat for a bit?`,
  ]);
}

async function sendProactiveNudges(env: Env): Promise<void> {
  if (await env.BIZLI_MEMORY.get("maintenance_mode") === "on") return;
  const utcHour = new Date().getUTCHours();
  if (utcHour >= 22 || utcHour < 1) return;

  const [identities, allUsers] = await Promise.all([
    db(env, "platform_identities?platform=eq.telegram&select=user_id,platform_id"),
    db(env, "users?status=eq.approved&select=id,display_name,last_active,is_blocked"),
  ]);
  if (!identities?.length || !allUsers?.length) return;

  const cutoff = new Date(Date.now() - 14 * 86400_000).toISOString();
  const userMap = new Map((allUsers as any[]).map((u: any) => [u.id, u]));
  const now = Date.now();
  const COOLDOWN_MS = 19_800_000;

  for (const identity of (identities as any[])) {
    const user = userMap.get(identity.user_id);
    if (!user || user.is_blocked || !user.last_active || user.last_active < cutoff) continue;

    const lastNudge = await env.BIZLI_MEMORY.get(`proactive_${identity.user_id}`);
    if (lastNudge && now - parseInt(lastNudge) < COOLDOWN_MS) continue;

    const userTz = (await env.BIZLI_MEMORY.get(`tz_${identity.user_id}`)) || "Asia/Kolkata";
    const localHour = parseInt(new Date().toLocaleTimeString("en-US", { timeZone: userTz, hour: "2-digit", hour12: false }));
    if (localHour >= 23 || localHour < 6) continue;
    // Morning/night greetings own hours 8 and 22 — a nudge in the same hour
    // would double-ping the user within minutes.
    if (localHour === 8 || localHour === 22) continue;

    const msg = pickProactiveMessage(user.display_name || "friend", localHour);
    await sendTelegram(env, identity.platform_id, msg).catch(() => {});
    await env.BIZLI_MEMORY.put(`proactive_${identity.user_id}`, String(now), { expirationTtl: 19800 });
    await new Promise(r => setTimeout(r, 150));
  }
}

export async function runAgents(env: Env): Promise<void> {
  try {
    await sendProactiveNudges(env);

    const expiredMems = await db(env, `memories?expires_at=lt.${new Date().toISOString()}`);
    if (expiredMems?.length > 0) {
      for (const mem of expiredMems) {
        await db(env, `memories?id=eq.${mem.id}`, "DELETE");
      }
    }

    const users = await db(env, "users?select=id");
    for (const u of users || []) {
      const mems = await db(env, `memories?user_id=eq.${u.id}&order=importance.asc,last_referenced.asc&select=id`);
      if (mems?.length > 50) {
        const toRemove = mems.slice(0, mems.length - 50);
        for (const mem of toRemove) {
          await db(env, `memories?id=eq.${mem.id}`, "DELETE");
        }
      }
    }

    await db(env, `messages?created_at=lt.${new Date(Date.now() - 90 * 86400000).toISOString()}`, "DELETE");

    // Lab memory: prune low-importance entries older than 60 days
    await db(env, `lab_memory?created_at=lt.${new Date(Date.now() - 60 * 86400000).toISOString()}&importance=lt.0.3`, "DELETE");

    if (await env.BIZLI_MEMORY.get("maintenance_mode") !== "on") {
      const tgIdentities = await db(env, "platform_identities?platform=eq.telegram&select=user_id,platform_id");
      const approvedUsers = await db(env, "users?status=eq.approved&select=id,display_name,city");
      const approvedMap = new Map<string, { name: string; city: string | null }>((approvedUsers || []).map((u: any) => [u.id, { name: u.display_name, city: u.city ?? null }]));
      const today = new Date().toISOString().slice(0, 10);
      for (const identity of (tgIdentities || [])) {
        const uid: string = identity.user_id;
        const info = approvedMap.get(uid);
        if (!info) continue;
        if (await env.BIZLI_MEMORY.get(`greet_off_${uid}`)) continue;
        const hour = await getUserLocalHour(env, uid, info.city);
        if (hour === null) continue;
        if (hour === 8) {
          const key = `greeted_morning_${uid}_${today}`;
          if (!await env.BIZLI_MEMORY.get(key)) {
            const msg = MORNING_MSGS[Math.floor(Math.random() * MORNING_MSGS.length)](info.name);
            await sendTelegram(env, identity.platform_id, msg);
            await env.BIZLI_MEMORY.put(key, "1", { expirationTtl: 86400 });
          }
        }
        if (hour === 22) {
          const key = `greeted_night_${uid}_${today}`;
          if (!await env.BIZLI_MEMORY.get(key)) {
            const msg = NIGHT_MSGS[Math.floor(Math.random() * NIGHT_MSGS.length)](info.name);
            await sendTelegram(env, identity.platform_id, msg);
            await env.BIZLI_MEMORY.put(key, "1", { expirationTtl: 86400 });
          }
        }
      }
    }

    const keys = getGroqKeys(env);
    const status = await getGroqStatus(env);
    const now = Date.now();
    const coolingCount = keys.filter((_, i) => (status.cooldowns[i] || 0) > now).length;
    if (coolingCount >= Math.ceil(keys.length * 0.7)) {
      await sendTelegram(env, env.ADMIN_CHAT_ID, `⚠️ Bizli Health Alert: ${coolingCount}/${keys.length} Groq keys on cooldown!`);
    }

    const lastModelCheck = await env.BIZLI_MEMORY.get("last_model_check");
    if (!lastModelCheck || now - parseInt(lastModelCheck) > 43_200_000) {
      await env.BIZLI_MEMORY.put("last_model_check", String(now), { expirationTtl: 90000 });
      const { groq: groqResult, gemini: geminiResult, cerebras: cerebrasResult, openrouter: openrouterResult } = await probeAllProviders(env);
      const alerts: string[] = [];
      if (groqResult.changed && groqResult.text.length) {
        alerts.push(
          `Groq Text (${groqResult.text.length}/4):\n${groqResult.text.map((m, i) => `  ${i + 1}. ${m}`).join("\n")}\nGroq Vision: ${groqResult.vision}`
        );
      }
      if (geminiResult.changed && geminiResult.models.length) {
        alerts.push(
          `Gemini Lab (${geminiResult.models.length}):\n${geminiResult.models.map((m, i) => `  ${i + 1}. ${m}`).join("\n")}`
        );
      }
      if (cerebrasResult.changed && cerebrasResult.models.length) {
        alerts.push(
          `Cerebras (${cerebrasResult.models.length}):\n${cerebrasResult.models.map((m, i) => `  ${i + 1}. ${m}`).join("\n")}`
        );
      }
      if (openrouterResult.changed && openrouterResult.models.length) {
        alerts.push(
          `OpenRouter free pool (${openrouterResult.models.length}):\n${openrouterResult.models.map((m, i) => `  ${i + 1}. ${m}`).join("\n")}`
        );
      }
      if (alerts.length) {
        await sendTelegram(env, env.ADMIN_CHAT_ID,
          `🔄 Model list auto-updated\n\n${alerts.join("\n\n")}`
        ).catch(() => {});
      }
    }

    // Run quality tests every 6h — via SELF-FETCH so the battery gets its own
    // invocation with a FRESH subrequest budget. Inline, it shared this cron
    // invocation's budget with nudges/greetings/probes and blew Cloudflare's
    // per-invocation cap (live 2026-07-09: "Too many subrequests" mid-battery).
    // The 6h gate + <60% alert both live inside runBizliTests/the route.
    await fetchTimeout(
      `https://bizli-worker.bizlibix.workers.dev/admin/run-tests?key=${env.ADMIN_PASSWORD}`,
      {}, 180_000
    ).catch(() => {});

    const lastReport = await env.BIZLI_MEMORY.get("last_daily_report");
    if (!lastReport || now - parseInt(lastReport) > 86400000) {
      const [users2, msgs, mems] = await Promise.all([
        db(env, "users?status=eq.approved&select=count"),
        db(env, "messages?select=count"),
        db(env, "memories?select=count"),
      ]);
      await sendTelegram(env, env.ADMIN_CHAT_ID,
        `📊 Daily Report\n\n✅ Users: ${users2?.[0]?.count || 0}\n💬 Messages: ${msgs?.[0]?.count || 0}\n🧠 Memories: ${mems?.[0]?.count || 0}\n⏰ ${new Date().toUTCString()}`
      );
      await env.BIZLI_MEMORY.put("last_daily_report", String(now), { expirationTtl: 90000 });
    }

    // Self-improvement kit: daily idea report (Lab reads errors + test results,
    // proposes rules with confidence %; admin approves via sik: buttons)
    const lastIdeas = await env.BIZLI_MEMORY.get("last_idea_report");
    if (!lastIdeas || now - parseInt(lastIdeas) > 86400000) {
      await env.BIZLI_MEMORY.put("last_idea_report", String(now), { expirationTtl: 90000 });
      await runIdeaReport(env).catch(() => {});
    }
  } catch (e) {
    console.error("[Agent]", e);
  }
}
