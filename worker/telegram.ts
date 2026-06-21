import type { Env } from './types';
import { fetchTimeout, getGroqKeys } from './utils';
import { db } from './db';

export async function sendTelegramAnimation(env: Env, chatId: string, url: string, caption?: string): Promise<boolean> {
  try {
    const body: any = { chat_id: chatId, animation: url };
    if (caption) body.caption = caption;
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendAnimation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch { return false; }
}

export async function generateImage(env: Env, prompt: string, chatId: string): Promise<void> {
  try {
    // Try Cloudflare AI first
    if (env.AI) {
      const response = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt, num_steps: 4 });
      if (response?.image) {
        // CF AI returns base64
        const imageData = response.image;
        const binaryStr = atob(imageData);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

        const boundary = "----BizliBoundary" + Date.now();
        const header = new TextEncoder().encode(
          `--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n` +
          `--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n🎨 ${prompt.slice(0, 200)}\r\n` +
          `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="image.png"\r\nContent-Type: image/png\r\n\r\n`
        );
        const footer = new TextEncoder().encode(`\r\n--${boundary}--`);
        const body = new Uint8Array(header.length + bytes.length + footer.length);
        body.set(header, 0); body.set(bytes, header.length); body.set(footer, header.length + bytes.length);
        const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
          body,
        });
        const data = await res.json() as any;
        if (data.ok) return;
      }
    }
    // Fallback: send Pollinations link
    const enc = encodeURIComponent(prompt.slice(0, 400));
    await sendTelegram(env, chatId, `🎨 here's your image:\nhttps://image.pollinations.ai/prompt/${enc}?width=1024&height=1024&nologo=true&model=flux`);
  } catch {
    await sendTelegram(env, chatId, "couldn't generate image right now, try again!");
  }
}

export async function getWikiImage(query: string): Promise<string> {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
    if (!res.ok) return "";
    const data = await res.json() as any;
    return data.thumbnail?.source || data.originalimage?.source || "";
  } catch { return ""; }
}

// TMDB movie/show poster — more reliable than Wikipedia for film artwork
export async function getMoviePoster(env: Env, title: string): Promise<string> {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${env.TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
    if (!res.ok) return "";
    const data = await res.json() as any;
    const posterPath = data.results?.find((r: any) => r.poster_path)?.poster_path;
    return posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : "";
  } catch { return ""; }
}

// Sends a photo with the reply text as caption (image above text in Telegram).
// Returns true if the photo send succeeded.
export async function sendImageCard(env: Env, chatId: string, text: string, imgUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, photo: imgUrl, caption: text.slice(0, 1024) }),
    });
    const data = await res.json() as any;
    return !!data.ok;
  } catch { return false; }
}

export async function sendRichResponse(env: Env, chatId: string, text: string, query: string): Promise<void> {
  const imgUrl = await getWikiImage(query);
  if (imgUrl && await sendImageCard(env, chatId, text, imgUrl)) return;
  // No image — just send text
  await sendTelegram(env, chatId, text);
}

// Transcribe a Telegram voice/audio message.
// Tries Groq whisper-large-v3-turbo first (faster, better accuracy, handles
// Indian accents + Hinglish well). Falls back to Cloudflare AI Whisper.
// Groq audio uses a SEPARATE quota from chat completions — won't burn chat keys.
export async function transcribeVoice(env: Env, fileId: string): Promise<string | null> {
  try {
    const fileInfoRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
    const fileInfo = await fileInfoRes.json() as any;
    const filePath = fileInfo?.result?.file_path;
    if (!filePath) return null;
    const fileRes = await fetch(`https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${filePath}`);
    if (!fileRes.ok) return null;
    const buffer = await fileRes.arrayBuffer();

    // Try Groq Whisper (higher quality, better for Hinglish/Indian accents).
    // Cap at 3 keys × 6s = 18s max to stay within Cloudflare Worker wall-clock budget.
    const keys = getGroqKeys(env);
    let whisperAttempts = 0;
    for (const key of keys) {
      if (++whisperAttempts > 3) break;
      try {
        const form = new FormData();
        form.append("file", new Blob([buffer], { type: "audio/ogg" }), "voice.ogg");
        form.append("model", "whisper-large-v3-turbo");
        const r = await fetchTimeout("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${key}` },
          body: form,
        }, 6000);
        if (!r?.ok) continue;
        const d = await r.json() as any;
        if (d?.text?.trim()) return d.text.trim();
      } catch { continue; }
    }

    // Fallback: Cloudflare AI Whisper (always available, lower quality)
    const result = await env.AI.run("@cf/openai/whisper", { audio: [...new Uint8Array(buffer)] });
    return result?.text?.trim() || null;
  } catch { return null; }
}

export async function sendTelegram(env: Env, chatId: string, text: string, extra?: object): Promise<void> {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, ...extra }),
  });
}

// Edits an existing message in place (BotFather-style card flipping) — the
// same message swaps its text + buttons instead of sending a new one, keeping
// the chat clean. Used for menu navigation (Back / Main Menu, etc.).
export async function editTelegramMessage(env: Env, chatId: string, messageId: number, text: string, keyboard?: any): Promise<void> {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      reply_markup: keyboard || { inline_keyboard: [] },
    }),
  }).catch(() => {});
}

export async function sendTyping(env: Env, chatId: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  });
}

// Runs an async task while keeping the "typing…" bubble alive the whole time.
// Telegram's typing action only lasts ~5s, so for longer work (web search,
// etc.) we re-send it every 4s until the task finishes — so Bizli never looks
// "dead" mid-search.
export async function withTyping<T>(env: Env, chatId: string, task: Promise<T>): Promise<T> {
  let done = false;
  const keepAlive = (async () => {
    while (!done) {
      await sendTyping(env, chatId);
      // wait ~4s but bail early if the task finished
      for (let i = 0; i < 40 && !done; i++) await new Promise(r => setTimeout(r, 100));
    }
  })();
  try {
    return await task;
  } finally {
    done = true;
    await keepAlive.catch(() => {});
  }
}

// VISION — download a Telegram photo and base64-encode it for
// Groq's vision-capable model (llama-4-scout is multimodal).
export async function downloadTelegramFile(env: Env, fileId: string): Promise<{ base64: string; mime: string } | null> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
    const data = await res.json() as any;
    const filePath = data?.result?.file_path;
    if (!filePath) return null;
    const fileRes = await fetch(`https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${filePath}`);
    if (!fileRes.ok) return null;
    const buffer = await fileRes.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.byteLength; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    const mime = filePath.endsWith(".png") ? "image/png" : "image/jpeg";
    return { base64, mime };
  } catch { return null; }
}

export async function answerCallback(env: Env, id: string, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: id, text }),
  });
}

export async function sendSupportToAdmin(env: Env, chatId: string, platform: string, category: string, message: string | null, userInfo: any): Promise<void> {
  const name = userInfo?.display_name || "Unknown";
  const code = userInfo?.identity_code || "N/A";
  const uid = userInfo?.id || "N/A";
  const gmail = userInfo?.gmail || "N/A";
  const labels: Record<string, string> = {
    pin: "🔑 PIN Issue", login: "🔐 Can't Login", other: "💬 Other",
    reg_gmail: "📧 Stuck entering email during signup",
    set_pin: "🔢 Stuck setting PIN during signup",
    reg_name: "✍️ Stuck entering name during signup",
    login_code: "🆔 Stuck entering login code",
    login_pin: "🔐 Stuck entering login PIN",
  };
  await env.BIZLI_MEMORY.put(`support_${chatId}`, JSON.stringify({ chatId, platform, userId: uid }), { expirationTtl: 86400 });
  await sendTelegram(env, env.ADMIN_CHAT_ID,
    `🆘 Support\n\nCategory: ${labels[category] || "💬 Other"}\nName: ${name}\nCode: ${code}\nID: ${uid}\nGmail: ${gmail}\nPlatform: ${platform}\nChat ID: ${chatId}\nMessage: ${message || "(category selected)"}`,
    { reply_markup: { inline_keyboard: [[{ text: "💬 Reply", callback_data: `reply:${chatId}` }, { text: "🔑 Reset PIN", callback_data: `resetpin:${uid}` }]] } }
  );
}

export async function broadcastToTelegram(env: Env, msg: string): Promise<number> {
  const [ids, users] = await Promise.all([
    db(env, "platform_identities?platform=eq.telegram"),
    db(env, "users?status=eq.approved"),
  ]);
  const approvedIds = new Set((users || []).map((u: any) => u.id));
  let sent = 0;
  for (const id of ids || []) {
    if (approvedIds.has(id.user_id)) {
      await sendTelegram(env, id.platform_id, msg);
      sent++;
      await new Promise(r => setTimeout(r, 50));
    }
  }
  return sent;
}
