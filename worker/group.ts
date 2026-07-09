import type { Env } from './types';
import { db } from './db';
import { todayContext } from './utils';
import { sendTelegram, sendTyping } from './telegram';
import { getRelevantMemories } from './memory';
import { callGroq, autoExtractMemory, appendError } from './brain';

async function getBotInfo(env: Env): Promise<{ id: number; username: string } | null> {
  try {
    const cached = await env.BIZLI_MEMORY.get("bot_info");
    if (cached) return JSON.parse(cached);
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`);
    const data = await res.json() as any;
    if (!data.ok) return null;
    const info = { id: data.result.id, username: data.result.username };
    await env.BIZLI_MEMORY.put("bot_info", JSON.stringify(info), { expirationTtl: 30 * 86400 });
    return info;
  } catch { return null; }
}

async function appendGroupHistory(env: Env, chatId: string, name: string, text: string): Promise<void> {
  try {
    const key = `group_history_${chatId}`;
    const raw = await env.BIZLI_MEMORY.get(key);
    const hist: { name: string; text: string }[] = raw ? JSON.parse(raw) : [];
    hist.push({ name: name.slice(0, 30), text: text.slice(0, 300) });
    await env.BIZLI_MEMORY.put(key, JSON.stringify(hist.slice(-15)), { expirationTtl: 86400 });
  } catch {}
}

async function getGroupHistory(env: Env, chatId: string): Promise<{ name: string; text: string }[]> {
  try {
    const raw = await env.BIZLI_MEMORY.get(`group_history_${chatId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function isBotTagged(msg: any, bot: { id: number; username: string }): boolean {
  const text: string = msg.text || "";
  if (text.toLowerCase().includes(`@${bot.username.toLowerCase()}`)) return true;
  if (msg.entities?.some((e: any) => e.type === "mention" && text.slice(e.offset, e.offset + e.length).toLowerCase() === `@${bot.username.toLowerCase()}`)) return true;
  if (msg.reply_to_message?.from?.id === bot.id) return true;
  return false;
}

function stripBotMention(text: string, username: string): string {
  return text.replace(new RegExp(`@${username}`, "gi"), "").trim();
}

export async function handleGroupMessage(env: Env, msg: any): Promise<boolean> {
  try {
    const groupChatId = String(msg.chat.id);
    const isAnonAdmin = msg.from?.id === 1087968824 || msg.from?.username === "GroupAnonymousBot";
    const senderId = String(msg.from.id);
    const senderName = isAnonAdmin ? (msg.sender_chat?.title || "Admin") : (msg.from.first_name || msg.from.username || "someone");
    const text: string = msg.text || "";

    if (!text) {
      if (msg.animation || msg.sticker || msg.video_note) {
        const reacts = ["😂", "haha nice one!", "lol 😄", "😍", "love it!"];
        const r = reacts[Math.floor(Math.random() * reacts.length)];
        await env.BIZLI_MEMORY.put(`group_react_${groupChatId}`, "1", { expirationTtl: 30 }).catch(() => {});
        const recentReact = await env.BIZLI_MEMORY.get(`group_react_throttle_${groupChatId}`);
        if (!recentReact) {
          await env.BIZLI_MEMORY.put(`group_react_throttle_${groupChatId}`, "1", { expirationTtl: 60 }).catch(() => {});
          await sendTelegram(env, groupChatId, r, { reply_to_message_id: msg.message_id });
        }
      }
      return true;
    }

    await appendGroupHistory(env, groupChatId, senderName, text);

    const bot = await getBotInfo(env);
    const tagged = bot ? isBotTagged(msg, bot) : /@\w*bizli\w*/i.test(text) || (msg.reply_to_message?.from?.is_bot === true);
    if (!tagged) return true;

    let userId: string | undefined;
    if (!isAnonAdmin) {
      const identity = await db(env, `platform_identities?platform=eq.telegram&platform_id=eq.${senderId}&limit=1`);
      userId = identity?.[0]?.user_id;
      const user = userId ? (await db(env, `users?id=eq.${userId}&limit=1`))?.[0] : null;

      if (!user || user.status !== "approved" || user.is_blocked) {
        await sendTelegram(env, groupChatId,
          `hey ${senderName}, DM me first 🙂 send me a private message and type !register to get started!`,
          { reply_to_message_id: msg.message_id }
        );
        return true;
      }
    }

    const history = await getGroupHistory(env, groupChatId);
    const transcript = history.slice(0, -1).map(h => `${h.name}: ${h.text}`).join("\n");
    const cleanText = (bot ? stripBotMention(text, bot.username) : text.replace(/@\w*bizli\w*/i, "")).trim() || "hey";
    const memories = userId ? await getRelevantMemories(env, userId, cleanText) : [];
    let memContext = "";
    if (memories.length > 0) {
      memContext = "[Your memories about " + senderName + "]:\n" + memories.map((m: any) => `- ${m.content}`).join("\n");
    }
    const groupContext = transcript ? `[Recent group chat — for context only, don't address others unless relevant]:\n${transcript}\n\n` : "";
    const messages = [{ role: "user", content: `${groupContext}${senderName} (tagging you): ${cleanText}` }];
    const groupSystemContext = todayContext() + "\n" + (memContext || "");

    await sendTyping(env, groupChatId);
    let reply = await callGroq(env, messages, groupSystemContext, groupChatId, true);
    if (reply === "IMAGE_GENERATED") return true;
    if (reply.startsWith("RICH_SENT:")) return true;
    // NEVER-SILENT: same guard as the DM path — Telegram drops empty messages.
    if (!reply.trim()) reply = "okay my thoughts scrambled for a sec 😅 say that again?";
    await sendTelegram(env, groupChatId, reply, { reply_to_message_id: msg.message_id });
    if (userId) setTimeout(() => autoExtractMemory(env, userId!, cleanText, reply).catch(() => {}), 0);
    return true;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    await appendError(env, `group ${msg?.chat?.id}: ${errMsg.slice(0, 150)}`).catch(() => {});
    await sendTelegram(env, String(msg.chat.id), "give me a sec, try again!", { reply_to_message_id: msg.message_id }).catch(() => {});
    return true;
  }
}
