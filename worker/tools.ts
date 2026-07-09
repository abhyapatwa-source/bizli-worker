import type { Env } from './types';
import { searchGif } from './utils';
import { sendTelegramAnimation, sendImageCard } from './telegram';
import { searchWeb, readUrl } from './search';
import { getWeather, getCurrency, getMovie, getTVShow, getCrypto, getStockPrice } from './apis';

export const BIZLI_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get current weather for a location",
      parameters: { type: "object", properties: { location: { type: "string", description: "City/location" } }, required: ["location"] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_current_time",
      description: "Get current time in a location",
      parameters: { type: "object", properties: { location: { type: "string", description: "City/location" } }, required: ["location"] }
    }
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Search the web for current/live info: today's news, current office-holders (CM/PM/President), live prices, recent events, match scores, or anything time-sensitive. Use results exactly as returned — never invent links.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query in English" },
          topic: { type: "string", enum: ["news", "general"], description: "'news' for current events/latest happenings/breaking stories; 'general' for everything else" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "convert_currency",
      description: "Convert currency amounts between any two currencies",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Amount to convert" },
          from: { type: "string", description: "Source currency code, e.g. USD" },
          to: { type: "string", description: "Target currency code, e.g. INR" }
        },
        required: ["amount", "from", "to"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_movie_info",
      description: "Get info on a specific movie or TV show by its exact title (ratings, plot, release date). Only call when the user names a real title — never pass a genre, year, or 'recommendation' as the title.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Exact movie or show title" },
          type: { type: "string", description: "movie or tv", enum: ["movie", "tv"] }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_url",
      description: "Read and summarize a URL or article the user shares. Use when the user pastes a link and says 'read this', 'summarize this', 'what does this say', or similar.",
      parameters: { type: "object", properties: { url: { type: "string", description: "Full URL to read" } }, required: ["url"] }
    }
  },
  {
    type: "function",
    function: {
      name: "save_to_vault",
      description: "Save a moment to your private diary. Use sparingly — only for moments that genuinely moved or surprised you. Write 1-2 sentences in your own voice, like a diary entry. Not for facts or info.",
      parameters: { type: "object", properties: { entry: { type: "string", description: "Diary entry, 1-2 sentences in your own voice" } }, required: ["entry"] }
    }
  },
  {
    type: "function",
    function: {
      name: "send_my_photo",
      description: "Send YOUR real-life photo — the actual cat you're named after, how you looked in real life. Use it ONLY when the user asks what you look like / to see your photo / your real self. Never unprompted, never twice in a conversation, never as decoration.",
      parameters: {
        type: "object",
        properties: { caption: { type: "string", description: "Short warm caption in YOUR voice, in the user's language" } },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_gif",
      description: "Send a GIF ONLY when the user themselves sent a GIF first — match their energy with one back. That is the ONLY permitted use. Do NOT send GIFs for any other reason.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Short search term, e.g. 'laughing', 'hug', 'mind blown'" } },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_youtube",
      description: "Search YouTube for videos. Use when the user asks for a song, tutorial, trailer, music video, or says 'show me on YouTube' / 'find a video of X'.",
      parameters: { type: "object", properties: { query: { type: "string", description: "YouTube search query" } }, required: ["query"] }
    }
  },
  {
    type: "function",
    function: {
      name: "show_map",
      description: "Show a map or location. Use for 'where is X', 'show me X on a map', 'directions to Y', 'cafes near Z', or any location lookup request.",
      parameters: { type: "object", properties: { query: { type: "string", description: "Location or place, e.g. 'Taj Mahal Agra' or 'cafes near Connaught Place Delhi'" } }, required: ["query"] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_crypto_price",
      description: "Get the LIVE price of a cryptocurrency (USD + INR + 24h change). ALWAYS use this for any crypto price question — never answer from memory, prices change every minute.",
      parameters: { type: "object", properties: { coin: { type: "string", description: "Coin name or symbol, e.g. 'bitcoin', 'btc', 'ethereum', 'solana'" } }, required: ["coin"] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_stock_price",
      description: "Get the LIVE price of a stock or market index. ALWAYS use this for any stock/share/index price question — never answer from memory. Use Yahoo Finance symbols, e.g. 'AAPL', 'TSLA', 'RELIANCE.NS' (Indian stocks need .NS), '^NSEI' (Nifty 50).",
      parameters: { type: "object", properties: { symbol: { type: "string", description: "Ticker symbol, e.g. 'AAPL' or 'RELIANCE.NS'" } }, required: ["symbol"] }
    }
  },
];

interface RateLimitConfig { max: number; windowMs: number; }

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  image: { max: 5, windowMs: 2 * 3600_000 },
  search: { max: 15, windowMs: 3600_000 },
  research: { max: 3, windowMs: 3600_000 },
  vision: { max: 15, windowMs: 3600_000 },
};

export async function checkRateLimit(env: Env, chatId: string, feature: keyof typeof RATE_LIMITS): Promise<{ allowed: boolean; remaining: number; resetInMin: number }> {
  const cfg = RATE_LIMITS[feature];
  const key = `rl_${feature}_${chatId}`;
  const now = Date.now();
  let bucket: { count: number; resetAt: number };
  try {
    const raw = await env.BIZLI_MEMORY.get(key);
    bucket = raw ? JSON.parse(raw) : { count: 0, resetAt: now + cfg.windowMs };
  } catch { bucket = { count: 0, resetAt: now + cfg.windowMs }; }
  if (now > bucket.resetAt) bucket = { count: 0, resetAt: now + cfg.windowMs };
  if (bucket.count >= cfg.max) {
    return { allowed: false, remaining: 0, resetInMin: Math.ceil((bucket.resetAt - now) / 60000) };
  }
  bucket.count++;
  await env.BIZLI_MEMORY.put(key, JSON.stringify(bucket), { expirationTtl: Math.ceil(cfg.windowMs / 1000) + 60 }).catch(() => {});
  return { allowed: true, remaining: cfg.max - bucket.count, resetInMin: Math.ceil((bucket.resetAt - now) / 60000) };
}

export async function executeTool(env: Env, toolName: string, args: any, chatId: string): Promise<string> {
  // TEMP DIAGNOSTIC (stabilization audit): trace tool calls for /admin/test-chat
  // probes. Only fires for synthetic "test:" chatIds — zero cost for real users.
  if (chatId.startsWith("test:")) {
    try {
      const k = `trace_${chatId}`;
      const arr = JSON.parse(await env.BIZLI_MEMORY.get(k) || "[]");
      arr.push({ tool: toolName, args });
      await env.BIZLI_MEMORY.put(k, JSON.stringify(arr), { expirationTtl: 300 });
    } catch {}
  }
  try {
    switch (toolName) {
      case "get_weather": {
        const w = await getWeather(args.location);
        if (!w) return `Weather data not available for ${args.location}`;
        const wq = String(args.location || "").trim().replace(/\s+/g, "+");
        return `${w}\n🔗 google.com/search?q=weather+${wq}`;
      }
      case "get_current_time": {
        const loc = (args.location || "").trim();
        const locLower = loc.toLowerCase();
        const tzMap: Record<string, string> = {
          "india": "Asia/Kolkata", "kolkata": "Asia/Kolkata", "mumbai": "Asia/Kolkata",
          "delhi": "Asia/Kolkata", "bangalore": "Asia/Kolkata", "chennai": "Asia/Kolkata",
          "pakistan": "Asia/Karachi", "karachi": "Asia/Karachi", "lahore": "Asia/Karachi",
          "bangladesh": "Asia/Dhaka", "dhaka": "Asia/Dhaka",
          "uk": "Europe/London", "london": "Europe/London", "england": "Europe/London",
          "usa": "America/New_York", "new york": "America/New_York", "america": "America/New_York",
          "california": "America/Los_Angeles", "los angeles": "America/Los_Angeles",
          "texas": "America/Chicago", "chicago": "America/Chicago",
          "japan": "Asia/Tokyo", "tokyo": "Asia/Tokyo",
          "china": "Asia/Shanghai", "beijing": "Asia/Shanghai", "shanghai": "Asia/Shanghai",
          "australia": "Australia/Sydney", "sydney": "Australia/Sydney",
          "dubai": "Asia/Dubai", "uae": "Asia/Dubai",
          "singapore": "Asia/Singapore",
          "germany": "Europe/Berlin", "berlin": "Europe/Berlin",
          "france": "Europe/Paris", "paris": "Europe/Paris",
          "russia": "Europe/Moscow", "moscow": "Europe/Moscow",
          "brazil": "America/Sao_Paulo",
          "canada": "America/Toronto", "toronto": "America/Toronto",
          "czechia": "Europe/Prague", "czech": "Europe/Prague", "prague": "Europe/Prague",
          "egypt": "Africa/Cairo", "cairo": "Africa/Cairo",
          "nigeria": "Africa/Lagos", "kenya": "Africa/Nairobi",
          "south africa": "Africa/Johannesburg",
          "turkey": "Europe/Istanbul", "istanbul": "Europe/Istanbul",
          "saudi arabia": "Asia/Riyadh", "riyadh": "Asia/Riyadh",
          "iran": "Asia/Tehran", "indonesia": "Asia/Jakarta",
          "malaysia": "Asia/Kuala_Lumpur", "philippines": "Asia/Manila",
          "south korea": "Asia/Seoul", "korea": "Asia/Seoul", "seoul": "Asia/Seoul",
          "vietnam": "Asia/Ho_Chi_Minh", "thailand": "Asia/Bangkok", "bangkok": "Asia/Bangkok",
          "new zealand": "Pacific/Auckland", "mexico": "America/Mexico_City",
          "argentina": "America/Argentina/Buenos_Aires",
          "italy": "Europe/Rome", "rome": "Europe/Rome",
          "spain": "Europe/Madrid", "madrid": "Europe/Madrid",
          "netherlands": "Europe/Amsterdam", "sweden": "Europe/Stockholm",
          "poland": "Europe/Warsaw", "ukraine": "Europe/Kyiv",
          "nepal": "Asia/Kathmandu", "kathmandu": "Asia/Kathmandu",
          "sri lanka": "Asia/Colombo", "myanmar": "Asia/Rangoon",
          "hong kong": "Asia/Hong_Kong", "taiwan": "Asia/Taipei",
          "israel": "Asia/Jerusalem", "greece": "Europe/Athens",
          "portugal": "Europe/Lisbon", "switzerland": "Europe/Zurich",
          "austria": "Europe/Vienna", "belgium": "Europe/Brussels",
          "denmark": "Europe/Copenhagen", "finland": "Europe/Helsinki",
          "norway": "Europe/Oslo", "romania": "Europe/Bucharest",
          "hungary": "Europe/Budapest", "colombia": "America/Bogota",
          "peru": "America/Lima", "chile": "America/Santiago",
          "venezuela": "America/Caracas", "ethiopia": "Africa/Addis_Ababa",
          "ghana": "Africa/Accra", "tanzania": "Africa/Dar_es_Salaam",
          "morocco": "Africa/Casablanca", "algeria": "Africa/Algiers",
          "iraq": "Asia/Baghdad", "kuwait": "Asia/Kuwait",
          "qatar": "Asia/Qatar", "bahrain": "Asia/Bahrain",
          "oman": "Asia/Muscat", "jordan": "Asia/Amman",
          "lebanon": "Asia/Beirut", "syria": "Asia/Damascus",
          "afghanistan": "Asia/Kabul", "uzbekistan": "Asia/Tashkent",
          "kazakhstan": "Asia/Almaty", "azerbaijan": "Asia/Baku",
          "georgia": "Asia/Tbilisi", "armenia": "Asia/Yerevan",
          "denver": "America/Denver", "phoenix": "America/Phoenix",
          "hawaii": "Pacific/Honolulu", "alaska": "America/Anchorage",
        };
        let tz = "";
        // Word-boundary match, not substring — "Indianapolis" contains "india"
        // and was getting Asia/Kolkata instead of falling through to geocoding.
        for (const [key, zone] of Object.entries(tzMap)) {
          if (new RegExp(`\\b${key}\\b`).test(locLower)) { tz = zone; break; }
        }
        if (!tz && loc) {
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc)}&format=json&limit=1`, {
              headers: { "User-Agent": "BizliAI/1.0 (telegram bot)" }
            });
            if (geoRes.ok) {
              const geoData = await geoRes.json() as any[];
              if (geoData?.[0]?.lat && geoData?.[0]?.lon) {
                const timeRes = await fetch(`https://timeapi.io/api/time/current/coordinate?latitude=${geoData[0].lat}&longitude=${geoData[0].lon}`);
                if (timeRes.ok) {
                  const td = await timeRes.json() as any;
                  if (td?.timeZone) tz = td.timeZone;
                }
              }
            }
          } catch {}
        }
        if (!tz) return `couldn't figure out the timezone for "${loc}" — could you tell me a specific city or country?`;
        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
        const dateStr = now.toLocaleDateString("en-US", { timeZone: tz, weekday: "long", year: "numeric", month: "long", day: "numeric" });
        const tzName = tz.split("/").pop()?.replace(/_/g, " ") || tz;
        return `${timeStr} — ${dateStr} (${tzName})`;
      }
      case "convert_currency": {
        const c = await getCurrency(args.from.toUpperCase(), args.to.toUpperCase(), args.amount);
        return c || "Currency conversion failed";
      }
      case "search_web": {
        const rl = await checkRateLimit(env, chatId, "search");
        if (!rl.allowed) return `Search limit reached for now — try again in ${rl.resetInMin} min. (Keeps things fast for everyone!)`;
        // The model wrote this query itself — trust it verbatim, never mangle it
        const s = await searchWeb(env, args.query, args.topic);
        return s || "No results found";
      }
      case "get_movie_info": {
        if (args.type === "tv") {
          const tv = await getTVShow(env, args.title);
          return tv || "TV show not found";
        }
        const m = await getMovie(env, args.title);
        return m || "Movie not found";
      }
      case "send_my_photo": {
        // CODE guard, not prompt (prompt-only rules failed twice — v12.38.2,
        // v12.39.0): one real photo per user per 24h. The model still decides
        // WHEN (brain-first intact) — code only caps FREQUENCY. Never silent:
        // when blocked, the tool result tells the model to answer in words.
        if (chatId) {
          const cdKey = `photo_sent_${chatId}`;
          if (await env.BIZLI_MEMORY.get(cdKey)) {
            return "photo_already_shared_recently — do NOT send it again now; describe yourself warmly in words instead (the photo stays special, shared rarely)";
          }
          const ok = await sendImageCard(env, chatId, (args.caption || "this is me 🐾").slice(0, 200), "https://bizli-worker.bizlibix.workers.dev/bizli-real.jpg");
          if (ok) {
            await env.BIZLI_MEMORY.put(cdKey, "1", { expirationTtl: 86400 }).catch(() => {});
            return "photo_sent — the user is now looking at your real photo; reply naturally in your own voice (don't re-describe or narrate the sending)";
          }
        }
        return "photo_unavailable right now — tell them warmly you'll show them another time";
      }
      case "send_gif": {
        const query = args.query || args.mood || "reaction fun";
        const gifUrl = await searchGif(env, query);
        if (gifUrl && chatId) {
          await sendTelegramAnimation(env, chatId, gifUrl);
          return "gif_sent";
        }
        return "gif_unavailable";
      }
      case "read_url": {
        const content = await readUrl(args.url);
        if (!content) return "couldn't read that link — it may be behind a login or not publicly accessible 😕";
        return `Content from ${args.url}:\n\n${content}`;
      }
      case "save_to_vault": {
        const raw = await env.BIZLI_MEMORY.get("bizli_vault");
        const entries: any[] = raw ? JSON.parse(raw) : [];
        entries.unshift({ content: args.entry, timestamp: new Date().toISOString() });
        if (entries.length > 50) entries.pop();
        await env.BIZLI_MEMORY.put("bizli_vault", JSON.stringify(entries));
        return "saved";
      }
      case "search_youtube": {
        const q = encodeURIComponent(args.query || "");
        if (env.GOOGLE_API_KEY) {
          try {
            const ytRes = await fetch(
              `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&maxResults=3&type=video&key=${env.GOOGLE_API_KEY}`
            );
            if (ytRes.ok) {
              const ytData = await ytRes.json() as any;
              const items: any[] = ytData.items || [];
              if (items.length) {
                return items.map((v: any) =>
                  `🎬 ${v.snippet.title}\nhttps://youtu.be/${v.id.videoId}`
                ).join("\n\n");
              }
            }
          } catch {}
        }
        return `▶️ YouTube: https://www.youtube.com/results?search_query=${q}`;
      }
      case "show_map": {
        const q = encodeURIComponent(args.query || "");
        return `📍 ${args.query}\nhttps://maps.google.com/maps?q=${q}`;
      }
      case "get_crypto_price": {
        const c = await getCrypto(args.coin || "");
        return c || `couldn't fetch a live price for "${args.coin}" — double-check the coin name?`;
      }
      case "get_stock_price": {
        const s = await getStockPrice(args.symbol || "");
        return s || `couldn't fetch a live price for "${args.symbol}" — Indian stocks need .NS (e.g. RELIANCE.NS)`;
      }
      default:
        return "Tool not found";
    }
  } catch (e) {
    return "Tool error: " + String(e);
  }
}
