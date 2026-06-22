import type { Env } from './types';
import { db } from './db';
import { getGroqKeys, getGeminiKeys, fetchTimeout, cityToTimezone, inferTimezoneFromLangCode, calculateAge, parseDOB, getYouTubeLink } from './utils';
import { sendTelegram, answerCallback, sendSupportToAdmin, sendRichResponse } from './telegram';
import { isAdminSession, setAuthStateHelper, getKVHistory, getUserMemories, lookupUser, saveMemory } from './memory';
import { searchWeb, readUrl } from './search';
import { getWeather, getWorldTime, getCurrency, getCrypto, getJoke, getDadJoke, getQuote, getAffirmation, getAdvice, getDictionary, getCountry, getCatFact, getDogImage, getNASA, getISS, getSpaceX, getRecipe, getCocktail, getPokemon, getTrivia, getNumberFact, getNews, getMovie, getTVShow, getTrending, searchAmazon, getRiddle, getScienceFact, solveMath, translateText, getQRCode } from './apis';
import { checkRateLimit, RATE_LIMITS } from './tools';
import { callGroq, BIZLI_VERSION, getGroqStatus } from './brain';
import { runHelpMenu, runAdminMenu, runAgentCommand } from './admin';

async function classifyNewsIntent(env: Env, text: string): Promise<{ confidence: number; topic: string }> {
  const lower = text.toLowerCase();
  // Fast path: "news" anywhere → skip LLM entirely
  if (lower.includes("news")) {
    const topicM = text.match(/news(?: (?:about|on|in|of|regarding))? ?(.+)?/i);
    const topic = topicM?.[1]?.trim().slice(0, 40) || "world";
    return { confidence: 90, topic };
  }

  // LLM classifier for ambiguous / non-English cases
  const keys = getGroqKeys(env);
  if (!keys.length) return { confidence: 0, topic: "world" };
  const apiKey = keys[Math.floor(Math.random() * keys.length)];
  try {
    const prompt = `You are a classifier. Reply ONLY with: <0-100>|<topic>
0-100 = how likely is this message asking for news/headlines/current events.
topic = the subject (or "world" if general).
Examples: "what's happening?" → 85|world   "recipe for pasta?" → 2|world   "cricket match update?" → 92|cricket   "أخبار اليوم" → 95|world   "tell me something interesting" → 30|world   "ukraine war" → 88|ukraine
Message: ${text.slice(0, 200)}`;
    const res = await fetchTimeout("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 12,
        temperature: 0,
      }),
    }, 4000);
    if (!res?.ok) return { confidence: 0, topic: "world" };
    const data = await res.json() as any;
    const raw: string = (data.choices?.[0]?.message?.content || "").trim();
    const [numStr, topicStr] = raw.split("|");
    const confidence = Math.min(100, Math.max(0, parseInt(numStr) || 0));
    const topic = (topicStr || "world").trim().slice(0, 40) || "world";
    return { confidence, topic };
  } catch {
    return { confidence: 0, topic: "world" };
  }
}

export async function detectIntent(env: Env, text: string, chatId: string, userId: string): Promise<boolean> {
  const lower = text.toLowerCase().trim();

  const imageKw = ["draw ", "paint ", "sketch ", "illustrate ", "create an image", "generate an image", "make a picture", "make an image", "show me a picture of", "create a photo", "!imagine", "!image", "banao image", "image banao", "photo banao", "tasveer banao", "give me a pic of", "give me a photo of", "give me an image of", "show me a pic of", "generate a pic", "make a pic"];
  if (imageKw.some(k => lower.includes(k))) {
    const prompt = text.replace(/^(draw|paint|sketch|illustrate|create an image of|generate an image of|make a picture of|make an image of|show me a picture of|create a photo of)\s*/i, "").trim();
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

  const weatherRx = /weather (?:in |at |for )?(.+)|(?:how.s the weather|what.s the weather)(?: in (.+))?/i;
  const wm = text.match(weatherRx);
  if (wm || lower.includes("weather in ")) {
    const loc = (wm?.[1] || wm?.[2] || lower.split("weather in ")[1] || "").trim().slice(0, 50);
    if (loc) {
      const w = await getWeather(loc);
      if (w) { await sendTelegram(env, chatId, `🌤️ ${w}`); return true; }
    }
  }

  const timeRx = /(?:current time|what time is it|time in|time now|what.s the time|abhi time|kitne baje)(?: in| at)? ?(.+)?/i;
  const tm = text.match(timeRx);
  if (tm || lower.includes("current time") || lower.includes("what time") || lower.includes("time in ")) {
    const loc = (tm?.[1] || "").trim() || "India";
    const t = await getWorldTime(loc);
    if (t) { await sendTelegram(env, chatId, `🕐 ${t}`); return true; }
  }

  const currencyNames: Record<string, string> = {
    "dollar": "USD", "dollars": "USD", "usd": "USD", "euro": "EUR", "euros": "EUR", "eur": "EUR",
    "rupee": "INR", "rupees": "INR", "inr": "INR", "pound": "GBP", "pounds": "GBP", "gbp": "GBP",
    "yen": "JPY", "jpy": "JPY", "yuan": "CNY", "rmb": "CNY", "cny": "CNY",
    "taka": "BDT", "bdt": "BDT", "dirham": "AED", "aed": "AED",
    "riyal": "SAR", "sar": "SAR", "won": "KRW", "krw": "KRW",
    "ruble": "RUB", "rub": "RUB", "real": "BRL", "brl": "BRL",
    "peso": "MXN", "mxn": "MXN", "franc": "CHF", "chf": "CHF",
    "aud": "AUD", "cad": "CAD", "sgd": "SGD", "hkd": "HKD",
  };
  const normC = (s: string) => currencyNames[s.toLowerCase()] || s.toUpperCase().slice(0, 3);
  const currRx = /([\d,.]+)\s*([\w]+)\s*(?:to|in|into)\s*([\w]+)/i;
  const cm = text.match(currRx);
  if (cm) {
    const from = normC(cm[2]);
    const to = normC(cm[3]);
    const valid = ["USD","EUR","INR","GBP","JPY","CNY","BDT","AED","SAR","KRW","AUD","CAD","CHF","HKD","SGD","RUB","BRL","MXN","THB","MYR","IDR","PKR","LKR","NPR","VND","ZAR","NGN","EGP"];
    if (valid.includes(from) && valid.includes(to)) {
      const amount = parseFloat(cm[1].replace(",", ""));
      const result = await getCurrency(from, to, amount);
      if (result) { await sendTelegram(env, chatId, `💱 ${result}`); return true; }
    }
  }

  const cryptoKw = ["bitcoin price", "btc price", "ethereum price", "eth price", "crypto price", "price of bitcoin", "price of btc", "price of ethereum", "how much is bitcoin", "how much is btc"];
  const cryptoCoins = ["bitcoin", "btc", "ethereum", "eth", "bnb", "solana", "sol", "dogecoin", "doge", "xrp", "ripple", "cardano", "ada"];
  let detectedCoin = "";
  if (cryptoKw.some(k => lower.includes(k))) {
    detectedCoin = cryptoCoins.find(c => lower.includes(c)) || "bitcoin";
  } else if (lower.match(/^(btc|eth|bnb|sol|doge|xrp)$/)) {
    detectedCoin = lower;
  }
  if (detectedCoin) {
    const price = await getCrypto(detectedCoin);
    if (price) { await sendTelegram(env, chatId, `💰 ${price}`); return true; }
  }

  if (lower.includes("tell me a joke") || lower === "joke" || lower === "make me laugh" || lower.includes("funny joke")) {
    const joke = await getJoke();
    if (joke) { await sendTelegram(env, chatId, `😄 ${joke}`); return true; }
  }
  if (lower.includes("dad joke")) {
    const joke = await getDadJoke();
    if (joke) { await sendTelegram(env, chatId, `😄 ${joke}`); return true; }
  }

  if (lower.includes("motivate me") || lower.includes("inspire me") || lower.includes("quote") || lower === "motivation") {
    const q = await getQuote();
    if (q) { await sendTelegram(env, chatId, `✨ ${q}`); return true; }
  }

  if (lower.includes("affirmation") || lower.includes("positive thought") || lower.includes("cheer me up") || lower === "i need positivity") {
    const a = await getAffirmation();
    if (a) { await sendTelegram(env, chatId, `💫 ${a}`); return true; }
  }

  if (lower === "give me advice" || lower === "advice" || lower === "what should i do") {
    const a = await getAdvice();
    if (a) { await sendTelegram(env, chatId, `💡 ${a}`); return true; }
  }

  const dictRx = /(?:what does|define|meaning of|what is the meaning of|what is) ([a-zA-Z]+)(?: mean)?/i;
  const dm = text.match(dictRx);
  if (dm && dm[1].length > 2) {
    const def = await getDictionary(dm[1]);
    if (def) { await sendTelegram(env, chatId, `📖 ${def}`); return true; }
  }

  const countryRx = /(?:tell me about|info about|facts about) ([a-zA-Z ]+)|capital of ([a-zA-Z ]+)/i;
  const ctm = text.match(countryRx);
  if (ctm) {
    const cName = (ctm[1] || ctm[2]).trim();
    const info = await getCountry(cName);
    if (info) { await sendTelegram(env, chatId, `🌍 ${info}`); return true; }
  }

  if (lower.includes("cat fact") || lower === "tell me about cats" || lower === "cat fact please") {
    const f = await getCatFact();
    if (f) { await sendTelegram(env, chatId, `🐱 ${f}`); return true; }
  }

  if (lower.includes("show me a dog") || lower.includes("cute dog") || lower.includes("dog picture") || lower === "dog") {
    const url = await getDogImage();
    if (url) {
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, photo: url, caption: "🐶" }),
      });
      const d = await res.json() as any;
      if (d.ok) return true;
    }
  }

  if (lower.includes("nasa") || lower.includes("space picture") || lower.includes("astronomy picture") || lower.includes("apod")) {
    const n = await getNASA(env.NASA_API_KEY);
    if (n) { await sendTelegram(env, chatId, n); return true; }
  }

  if (lower.includes("where is the iss") || lower.includes("international space station") || lower.includes("iss location") || lower.includes("where is iss")) {
    const iss = await getISS();
    if (iss) { await sendTelegram(env, chatId, `🛸 ${iss}`); return true; }
  }

  if (lower.includes("spacex") || lower.includes("next rocket launch") || lower.includes("next spacex")) {
    const sx = await getSpaceX();
    if (sx) { await sendTelegram(env, chatId, `🚀 ${sx}`); return true; }
  }

  const recipeRx = /(?:recipe for|how to make|how to cook|how do i make|how do i cook) (.+)/i;
  const rm = text.match(recipeRx);
  if (rm) {
    const r = await getRecipe(rm[1]);
    if (r) { await sendTelegram(env, chatId, `🍽️ ${r}`); return true; }
  }

  const cocktailRx = /(?:cocktail|drink recipe for|how to make) (.+)/i;
  const ckm = text.match(cocktailRx);
  if (ckm && !ckm[1].includes("make")) {
    const c = await getCocktail(ckm[1]);
    if (c) { await sendTelegram(env, chatId, `🍹 ${c}`); return true; }
  }

  const pokemonRx = /(?:pokemon|tell me about pokemon) ([a-zA-Z]+)/i;
  const pm = text.match(pokemonRx);
  if (pm) {
    const p = await getPokemon(pm[1]);
    if (p) { await sendTelegram(env, chatId, `⚡ ${p}`); return true; }
  }

  if (lower.includes("trivia") || lower === "quiz me" || lower === "ask me a question" || lower === "test my knowledge") {
    const t = await getTrivia();
    if (t) {
      await sendTelegram(env, chatId, `🎯 ${t.question}\n\n${t.options.map((o: string, i: number) => `${i+1}. ${o}`).join("\n")}`);
      await env.BIZLI_MEMORY.put(`trivia_${chatId}`, t.answer, { expirationTtl: 120 });
      return true;
    }
  }

  const numRx = /(?:fact about the number|tell me about the number|number fact) (\d+)/i;
  const nm = text.match(numRx);
  if (nm) {
    const f = await getNumberFact(nm[1]);
    if (f) { await sendTelegram(env, chatId, `🔢 ${f}`); return true; }
  }

  {
    const { confidence, topic } = await classifyNewsIntent(env, text);
    if (confidence > 80) {
      const news = await getNews(env, topic);
      if (news) {
        const header = topic === "world" ? "📰 *Top Headlines*\n\n" : `📰 *${topic} news*\n\n`;
        await sendTelegram(env, chatId, `${header}${news}`);
        return true;
      }
    } else if (confidence >= 50) {
      const encoded = encodeURIComponent(topic).slice(0, 40);
      await sendTelegram(env, chatId,
        "want me to get the latest news for you? 📰",
        { reply_markup: { inline_keyboard: [[
          { text: "📰 Yes, get news!", callback_data: `news_yes:${encoded}` },
          { text: "No thanks", callback_data: "news_no" },
        ]] } }
      );
      return true;
    }
  }

  const movieRx = /(?:movie|film)(?: info| about| on| called)? (.+)|(?:tell me about the movie|search movie|recent movie|latest movie from) (.+)/i;
  const movieM = text.match(movieRx);
  if (movieM || lower.includes("marvel") || lower.includes("bollywood movie") || lower.includes("hollywood movie")) {
    const q = (movieM[1] || movieM[2]).trim();
    const m = await getMovie(env, q);
    if (m) { await sendTelegram(env, chatId, m); return true; }
  }

  const tvRx = /(?:tv show|series|show)(?: info| about)? (.+)|(?:tell me about the show|search show) (.+)/i;
  const tvM = text.match(tvRx);
  if (tvM) {
    const q = (tvM[1] || tvM[2]).trim();
    const t = await getTVShow(env, q);
    if (t) { await sendTelegram(env, chatId, t); return true; }
  }

  if (lower.includes("trending") || lower.includes("what's popular") || lower === "trending movies" || lower === "trending shows") {
    const t = await getTrending(env);
    if (t) { await sendTelegram(env, chatId, t); return true; }
  }

  const shopRx = /(?:find|search|show me|buy|recommend|suggest|price of|cheapest|best)(?: me)? (.+?) (?:on amazon|on flipkart|online|under [0-9]+|below [0-9]+|for under|good quality)/i;
  const shopM = text.match(shopRx);
  if (shopM || lower.includes("amazon") || lower.includes("flipkart") || lower.includes("buy online") || lower.includes("order online") || lower.includes("online shopping") || (lower.includes("under") && (lower.includes("rs") || lower.includes("rupee") || lower.includes("₹")))) {
    const rawQuery = (shopM?.[1] || text.replace(/amazon|flipkart|online|buy|find|search|recommend|suggest/gi, "").replace(/under [0-9]+/gi, "").trim()).trim();
    if (rawQuery.length > 2) {
      await sendTelegram(env, chatId, "searching... 🛍️");
      const q = encodeURIComponent(rawQuery);
      const amazonLink = `https://www.amazon.in/s?k=${q}`;
      const flipkartLink = `https://www.flipkart.com/search?q=${q}`;
      const results = await searchAmazon(env, rawQuery);
      if (results) {
        await sendTelegram(env, chatId, `🛍️ ${results}\n\n🔗 More: ${amazonLink}`);
      } else {
        await sendTelegram(env, chatId, `🛍️ Search results for "${rawQuery}":\n\n🛒 Amazon: ${amazonLink}\n🛒 Flipkart: ${flipkartLink}\n🛒 Myntra: https://www.myntra.com/${q}`);
      }
      return true;
    }
  }

  if (lower.includes("riddle") || lower === "give me a riddle" || lower === "ask me a riddle") {
    const r = await getRiddle(env);
    if (r) { await sendTelegram(env, chatId, r); return true; }
  }

  if (lower.includes("science fact") || lower === "random fact" || lower === "tell me a fact") {
    const f = await getScienceFact(env);
    if (f) { await sendTelegram(env, chatId, `🔬 ${f}`); return true; }
  }

  const mathRx = /(?:calculate|solve|compute) ([\d\s+\-*\/^%().]+)/i;
  const mathM = text.match(mathRx);
  if (mathM && mathM[1].match(/[\d+\-*\/]/)) {
    const result = await solveMath(mathM[1].trim());
    if (result) { await sendTelegram(env, chatId, `🔢 ${mathM[1].trim()} = ${result}`); return true; }
  }

  const qrRx = /(?:generate|create|make)(?: a)? qr code (?:for|of) (.+)/i;
  const qrM = text.match(qrRx);
  if (qrM) {
    const qrUrl = getQRCode(qrM[1].trim());
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, photo: qrUrl, caption: `QR code for: ${qrM[1].trim()}` }),
    });
    const d = await res.json() as any;
    if (d.ok) return true;
  }

  const translateRx = /(?:translate|say in|how do you say) (.+?) (?:to|in) ([a-zA-Z]+)/i;
  const transM = text.match(translateRx);
  if (transM) {
    const langCodes: Record<string, string> = {
      "hindi": "hi", "french": "fr", "spanish": "es", "german": "de", "japanese": "ja",
      "chinese": "zh", "arabic": "ar", "russian": "ru", "portuguese": "pt", "italian": "it",
      "bengali": "bn", "tamil": "ta", "telugu": "te", "urdu": "ur", "korean": "ko",
    };
    const lang = langCodes[transM[2].toLowerCase()];
    if (lang) {
      const translated = await translateText(transM[1], lang);
      if (translated) { await sendTelegram(env, chatId, `🌐 "${transM[1]}" in ${transM[2]}: ${translated}`); return true; }
    }
  }

  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    const url = urlMatch[0];
    const trustedDomains = ["wikipedia.org", "bbc.com", "reuters.com", "ndtv.com", "timesofindia.com", "github.com", "stackoverflow.com", "medium.com", "youtube.com", "twitter.com", "instagram.com", "amazon.in", "amazon.com", "flipkart.com", "google.com", "microsoft.com", "apple.com"];
    const isTrusted = trustedDomains.some(d => url.includes(d));
    if (isTrusted || !url.includes("ftp")) {
      const content = await readUrl(url);
      if (content.length > 100) {
        const summary = await callGroq(env, [{ role: "user", content: `Summarize this in 2-3 sentences plainly: ${content.slice(0, 600)}` }], "");
        await sendTelegram(env, chatId, `🔗 ${summary}`);
        return true;
      }
    }
  }

  const searchKw = ["what is", "who is", "when did", "how does", "latest news", "current", "today", "news about", "recent", "what happened", "tell me about", "explain", "how to fix", "why is", "where is"];
  if (searchKw.some(k => lower.startsWith(k)) || lower.startsWith("!search ")) {
    const query = lower.startsWith("!search ") ? text.slice(8).trim() : text;
    const result = await searchWeb(env, query);
    if (result) {
        const ytLink = getYouTubeLink(query);
        const formatted = await callGroq(env, [{ role: "user", content: `Present these search results professionally. Format as 3-5 short bullet points (one key fact each, concise), then list the real source links from the data exactly as shown. No long paragraphs, no filler.\n\nQuery: ${query}\n\nData:\n${result.slice(0, 600)}` }], "");
        await sendRichResponse(env, chatId, (formatted || result.slice(0, 500)) + `\n▶️ ${ytLink}`, query);
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
    await answerCallback(env, cbId, "📰 fetching...");
    const topic = decodeURIComponent(data.slice("news_yes:".length)) || "world";
    const news = await getNews(env, topic);
    const header = topic === "world" ? "📰 *Top Headlines*\n\n" : `📰 *${topic} news*\n\n`;
    await sendTelegram(env, fromId, news ? `${header}${news}` : "couldn't fetch news right now, try again soon 🙏");
    return;
  }
  if (data === "news_no") {
    await answerCallback(env, cbId, "👍");
    return;
  }

  if (data.startsWith("help:")) {
    await answerCallback(env, cbId, "");
    await runHelpMenu(env, fromId, data.slice("help:".length), cbMessageId);
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
      changepin: "!changepin", support: "!support", forgotpin: "!forgotpin",
      recover: "!recover", status: "!status", usage: "!myusage",
    };
    if (directCmds[cmd]) { await handleUserCommand(env, fromId, directCmds[cmd], userId); return; }
    const hints: Record<string, string> = {
      editname:  "to edit your name, type:\n!editname YourNewName",
      editgmail: "to edit your email, type:\n!editgmail your@email.com",
      editdob:   "to edit your date of birth, type:\n!editdob 15 Jan 2000",
      editloc:   "to edit your location, type:\n!editlocation Mumbai, India",
      remember:  "to save something, type:\n!remember <what you want me to remember>",
      forget:    "to make me forget something, type:\n!forget <what to forget>",
      feedback:  "to send feedback, type:\n!feedback <your message>",
      search:    "just ask me anything directly, or type:\n!search <your query>",
      logout:    "to log out, type:\n!logout",
    };
    if (hints[cmd]) { await sendTelegram(env, fromId, hints[cmd]); return; }
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

  if (fromId !== env.ADMIN_CHAT_ID) { await answerCallback(env, cbId, "Not authorized."); return; }

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
    await db(env, `users?id=eq.${payload}`, "PATCH", { status: "approved", is_blocked: false });
    const id = await db(env, `platform_identities?user_id=eq.${payload}&limit=1`);
    if (id?.[0]) {
      await sendTelegram(env, id[0].platform_id, "you're approved! 🎉\n\nSet a 4-digit PIN to log in on any platform:");
      await setAuthStateHelper(env, id[0].platform_id, { step: "set_pin", userId: payload });
    }
    await answerCallback(env, cbId, "✅ Approved");
    await sendTelegram(env, fromId, `✅ Approved`);
  } else if (action === "decline") {
    await db(env, `users?id=eq.${payload}`, "PATCH", { status: "denied" });
    const id = await db(env, `platform_identities?user_id=eq.${payload}&limit=1`);
    if (id?.[0]) await sendTelegram(env, id[0].platform_id, "sorry, your request wasn't approved.");
    await answerCallback(env, cbId, "❌ Declined");
    await sendTelegram(env, fromId, "❌ Declined");
  } else if (action === "block") {
    await db(env, `users?id=eq.${payload}`, "PATCH", { is_blocked: true, status: "denied" });
    const id = await db(env, `platform_identities?user_id=eq.${payload}&limit=1`);
    if (id?.[0]) await sendTelegram(env, id[0].platform_id, "you've been blocked.");
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

export async function handleUserCommand(env: Env, chatId: string, text: string, userId: string, platform = "telegram"): Promise<boolean> {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (lower === "!help") {
    await runHelpMenu(env, chatId, "menu");
    return true;
  }

  if (lower === "!ping") { const s = Date.now(); await db(env, "users?limit=1"); await sendTelegram(env, chatId, `🏓 pong! ${Date.now()-s}ms`); return true; }

  if (lower === "!status") {
    const keys = getGroqKeys(env);
    const gStatus = await getGroqStatus(env);
    const now = Date.now();
    const ready = keys.filter((_, i) => (gStatus.cooldowns[i] || 0) <= now).length;
    const cooling = keys.length - ready;
    const hist = (await getKVHistory(env, userId)).length;
    const mems = await getUserMemories(env, userId);
    const gemKeys = getGeminiKeys(env).length;
    const groqBar = "🟢".repeat(ready) + "🔴".repeat(cooling);
    const gemBar = "🟢".repeat(gemKeys) + "⚫".repeat(Math.max(0, 5 - gemKeys));
    const userTz = (await env.BIZLI_MEMORY.get(`tz_${userId}`)) || "UTC";
    const localTime = new Date().toLocaleTimeString("en-US", { timeZone: userTz, hour: "2-digit", minute: "2-digit", hour12: true });
    const statusMsg =
      `🧠 Bizli Brain Status — ${BIZLI_VERSION}\n\n` +
      `🧠 Frontal Cortex (Groq): ${groqBar}\n   ${ready}/${keys.length} neurons active${cooling ? ` · ${cooling} cooling` : ""}\n\n` +
      `🧬 Temporal Lobe (Gemini): ${gemBar}\n   ${gemKeys}/5 circuits ready · steps in if Groq rests\n\n` +
      `🫀 Brainstem (Worker AI): 🟢 always on · last resort\n\n` +
      `💾 Hippocampus: ${mems.length} memories stored\n` +
      `💬 Short-term: ${hist}/15 messages in context\n` +
      `🕐 Your time: ${localTime} (${userTz})\n\n` +
      `_Type !timezone to set your local time_`;
    await sendTelegram(env, chatId, statusMsg);
    return true;
  }

  if (lower === "!brains") {
    if (!await isAdminSession(env, chatId)) {
      await sendTelegram(env, chatId, "🔒 Admin only — use !admin <password> first.");
      return true;
    }
    const keyNames = ["Alpha","Bravo","Charlie","Delta","Echo","Foxtrot","Golf","Hotel","India","Juliet","Kilo","Lima","Mike","November","Oscar","Papa","Quebec","Romeo","Sierra","Tango","Uniform"];
    const keys = getGroqKeys(env);
    const gStatus = await getGroqStatus(env);
    const now = Date.now();
    const msAgo = (ms: number) => {
      const diff = now - ms;
      if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
      return `${Math.round(diff / 60000)}m ago`;
    };
    const lastBrainsRaw = await env.BIZLI_MEMORY.get("last_brains");
    const lastBrains: { brain: string; key?: number; ts: number }[] = lastBrainsRaw ? JSON.parse(lastBrainsRaw) : [];
    const brainLog = lastBrains.length
      ? lastBrains.map((e, idx) => {
          const keyLabel = e.key !== undefined ? ` · key ${e.key + 1} (${keyNames[e.key] || e.key})` : "";
          return `  ${idx + 1}. ${e.brain}${keyLabel} — ${msAgo(e.ts)}`;
        }).join("\n")
      : "  (no messages recorded yet)";
    const groqKeyLines = keys.map((_, i) => {
      const cd = gStatus.cooldowns[i] || 0;
      const name = keyNames[i] || String(i);
      if (cd <= now) return `  ${i + 1} ${name}: ✅ READY`;
      const remaining = cd - now;
      if (remaining > 60_000) {
        const h = Math.floor(remaining / 3600000);
        const m = Math.ceil((remaining % 3600000) / 60000);
        return `  ${i + 1} ${name}: 🔴 TPD — ready in ${h}h ${m}m`;
      }
      return `  ${i + 1} ${name}: ⏳ RPM — ready in ${Math.ceil(remaining / 1000)}s`;
    }).join("\n");
    const gemCount = getGeminiKeys(env).length;
    const msg =
      `🧠 Bizli Brains — Live View\n\n` +
      `🔵 Last 5 messages driven by:\n${brainLog}\n\n` +
      `🧠 Groq Neurons (${keys.length} configured):\n${groqKeyLines}\n\n` +
      `🧬 Gemini (${gemCount} key${gemCount !== 1 ? "s" : ""} configured): ✅ no cooldown tracking — all assumed ready\n` +
      `🫀 Brainstem (Worker AI): ✅ standby\n\n` +
      `🕐 ${new Date().toUTCString()}`;
    await sendTelegram(env, chatId, msg);
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
  if (lower === "!greetings") {
    const off = await env.BIZLI_MEMORY.get(`greet_off_${userId}`);
    const explicitTz = await env.BIZLI_MEMORY.get(`tz_${userId}`);
    const u = (await db(env, `users?id=eq.${userId}&select=city&limit=1`))?.[0];
    const cityTz = u?.city ? cityToTimezone(u.city) : "";
    const lang = await env.BIZLI_MEMORY.get(`lang_${userId}`);
    const inferredTz = lang ? inferTimezoneFromLangCode(lang) : "";
    const activeTz = explicitTz || cityTz || inferredTz;
    const tzSource = explicitTz ? "" : cityTz ? " (from your city)" : inferredTz ? " (auto-detected)" : "";
    await sendTelegram(env, chatId,
      `Good morning/night messages: ${off ? "OFF" : "ON"}\n` +
      `Timezone: ${activeTz || "not detected yet"}\n${tzSource ? `(${tzSource.trim()})\n` : ""}` +
      `\n• !greetings on/off — toggle messages\n• !editlocation <city, country> — update your city\n• !timezone set <zone> — set manually`
    );
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
    await sendTelegram(env, chatId, `📈 Your usage:\n\n${lines.join("\n")}`);
    return true;
  }

  if (lower === "!mydetails") {
    const u = (await db(env, `users?id=eq.${userId}&limit=1`))?.[0];
    const dobLine = u?.date_of_birth ? `\nDate of Birth: ${u.date_of_birth} (Age: ${calculateAge(u.date_of_birth)})` : "";
    const cityLine = u?.city ? `\nLocation: ${u.city}` : "";
    await sendTelegram(env, chatId, `👤 Your Details\n\nName: ${u?.display_name}\nCode: ${u?.identity_code}\nGmail: ${u?.gmail || "N/A"}${dobLine}${cityLine}\nStatus: ${u?.status}\n\nSave your code — needed to login anywhere.`);
    return true;
  }

  if (lower.startsWith("!editname ")) {
    const newName = trimmed.slice(10).trim().slice(0, 30);
    if (!newName) { await sendTelegram(env, chatId, "usage: !editname <name>"); return true; }
    const u = (await db(env, `users?id=eq.${userId}&limit=1`))?.[0];
    await db(env, `users?id=eq.${userId}`, "PATCH", { display_name: newName });
    await sendTelegram(env, chatId, `✅ name updated to ${newName}!`);
    await sendTelegram(env, env.ADMIN_CHAT_ID, `✏️ Name change: ${u?.identity_code} | ${u?.display_name} → ${newName}`);
    return true;
  }

  if (lower.startsWith("!editgmail ")) {
    const newGmail = trimmed.slice(11).trim().toLowerCase();
    if (!newGmail.includes("@")) { await sendTelegram(env, chatId, "invalid Gmail."); return true; }
    const u = (await db(env, `users?id=eq.${userId}&limit=1`))?.[0];
    await db(env, `users?id=eq.${userId}`, "PATCH", { gmail: newGmail });
    await sendTelegram(env, chatId, `✅ Gmail updated!`);
    await sendTelegram(env, env.ADMIN_CHAT_ID, `✏️ Gmail change: ${u?.identity_code} | ${u?.gmail} → ${newGmail}`);
    return true;
  }

  if (lower.startsWith("!editdob ")) {
    const input = trimmed.slice(9).trim();
    const parsed = parseDOB(input);
    const age = parsed ? calculateAge(parsed) : -1;
    if (!parsed || age < 5 || age > 120) { await sendTelegram(env, chatId, "couldn't read that date — try: !editdob 15 Jan 2000"); return true; }
    const u = (await db(env, `users?id=eq.${userId}&limit=1`))?.[0];
    await db(env, `users?id=eq.${userId}`, "PATCH", { date_of_birth: parsed });
    await sendTelegram(env, chatId, `date of birth updated — age set to ${age}`);
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
    await db(env, `users?id=eq.${userId}`, "PATCH", { city: newCity });
    await sendTelegram(env, chatId, `location updated to: ${newCity}`);
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
    if (!mem) { await sendTelegram(env, chatId, "what should I remember?"); return true; }
    await saveMemory(env, userId, "fact", mem, [], 3);
    await sendTelegram(env, chatId, "noted bestie 🧠✨"); return true;
  }

  if (lower === "!memories") {
    const mems = await getUserMemories(env, userId);
    if (!mems.length) { await sendTelegram(env, chatId, "nothing saved yet."); return true; }
    await sendTelegram(env, chatId, `🧠 what I remember:\n\n${mems.map((m: any, i: number) => `${i+1}. ${m.content} [${m.category}]`).join("\n")}`);
    return true;
  }

  if (lower.startsWith("!forget ")) {
    const arg = trimmed.slice(8).trim();
    if (arg.toLowerCase() === "all") { await db(env, `memories?user_id=eq.${userId}`, "DELETE"); await sendTelegram(env, chatId, "cleared everything 🗑️"); return true; }
    const mems = await getUserMemories(env, userId);
    const idx = parseInt(arg) - 1;
    if (isNaN(idx) || idx < 0 || idx >= mems.length) { await sendTelegram(env, chatId, "use !memories to see the list, then !forget <number>"); return true; }
    await db(env, `memories?id=eq.${mems[idx].id}`, "DELETE");
    await sendTelegram(env, chatId, "poof, gone fr 🗑️"); return true;
  }

  if (lower === "!forgotpin") {
    const u = (await db(env, `users?id=eq.${userId}&limit=1`))?.[0];
    await sendTelegram(env, env.ADMIN_CHAT_ID,
      `🔑 PIN Reset\n\nName: ${u?.display_name}\nCode: ${u?.identity_code}\nGmail: ${u?.gmail || "N/A"}\nID: ${userId}\nPlatform: ${platform}`,
      { reply_markup: { inline_keyboard: [[{ text: "🔑 Reset PIN", callback_data: `resetpin:${userId}` }, { text: "💬 Reply", callback_data: `reply:${chatId}` }]] } }
    );
    await sendTelegram(env, chatId, "request sent! admin will reset your PIN shortly 🙏"); return true;
  }

  if (lower === "!support") {
    await sendTelegram(env, chatId, "what do you need help with?",
      { reply_markup: { inline_keyboard: [[{ text: "🔑 PIN Issue", callback_data: `support_cat:${chatId}|pin` }, { text: "🔐 Can't Login", callback_data: `support_cat:${chatId}|login` }, { text: "💬 Other", callback_data: `support_cat:${chatId}|other` }]] } }
    );
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
    await sendTelegram(env, chatId, "ty!! sending it over 🙏💛"); return true;
  }

  if (lower.startsWith("!search ")) {
    const query = trimmed.slice(8).trim();
    await sendTelegram(env, chatId, "searching... 🔍");
    const result = await searchWeb(env, query);
    if (result) {
        const formatted = await callGroq(env, [{ role: "user", content: `Present these search results professionally. Format as 3-5 short bullet points (one key fact each, concise), then list the real source links from the data exactly as shown. No long paragraphs, no filler.\n\nQuery: ${query}\n\nData:\n${result.slice(0, 600)}` }], "");
        await sendTelegram(env, chatId, formatted || result.slice(0, 500));
    } else { await sendTelegram(env, chatId, "nothing found."); }
    return true;
  }

  if (lower === "!logout") {
    await env.BIZLI_MEMORY.delete(`history_${userId}`);
    await env.BIZLI_MEMORY.put(`logged_out_${chatId}`, "1", { expirationTtl: 2592000 });
    await sendTelegram(env, chatId, "logged out 🔒 tap below whenever you want to come back 👇",
      { reply_markup: { inline_keyboard: [[{ text: "🔑 Log in", callback_data: `start_login:${chatId}` }]] } });
    return true;
  }

  return false;
}
