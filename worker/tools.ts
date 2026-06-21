import type { Env } from './types';
import { searchGif } from './utils';
import { sendTelegramAnimation, sendImageCard, generateImage } from './telegram';
import { searchWeb, readUrl } from './search';
import {
  getWeather, getNews, getCurrency, getCrypto, getMovie, getTVShow,
  searchAmazon, getRecipe, getJoke, getQuote, getDictionary, getNASA,
  translateText, solveMath, getCountry, getISS, getStockPrice,
  shortenUrl, getPublicHolidays, getFunFact, getQRCode,
} from './apis';

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
      name: "get_news",
      description: "Get latest news on a topic",
      parameters: { type: "object", properties: { query: { type: "string", description: "Topic" } }, required: ["query"] }
    }
  },
  {
    type: "function",
    function: {
      name: "convert_currency",
      description: "Convert currency amounts",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Amount" },
          from: { type: "string", description: "From currency code" },
          to: { type: "string", description: "To currency code" }
        },
        required: ["amount", "from", "to"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_crypto_price",
      description: "Get crypto price",
      parameters: { type: "object", properties: { coin: { type: "string", description: "Coin name" } }, required: ["coin"] }
    }
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Search the web for facts, current events, news, prices, or ANY 'who is the current X' question (CM, PM, president, minister, etc.). You MUST call this for any question about who currently holds a position or any recent event — never answer those from memory, your training is outdated. Also never invent source links: only show links this tool returns.",
      parameters: { type: "object", properties: { query: { type: "string", description: "Query" } }, required: ["query"] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_movie_info",
      description: "Get info on ONE specific movie/TV show by its actual title (ratings, release date, plot). The user must have named a real title. For 'recommend a movie', 'sci-fi movies in 2026', 'what movies are coming out' etc. — where there's NO specific title — use search_web instead, NEVER pass words like 'recommendation' or a genre as the title here.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Title" },
          type: { type: "string", description: "movie or tv", enum: ["movie", "tv"] }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Search products on Amazon/Flipkart",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Query" },
          max_price: { type: "number", description: "Max price INR" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_recipe",
      description: "Get a recipe",
      parameters: { type: "object", properties: { dish: { type: "string", description: "Dish name" } }, required: ["dish"] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_joke",
      description: "Get a joke",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_quote",
      description: "Get a motivational quote",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "define_word",
      description: "Define a word",
      parameters: { type: "object", properties: { word: { type: "string", description: "Word" } }, required: ["word"] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_nasa_apod",
      description: "NASA picture of the day",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "translate_text",
      description: "Translate text",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text" },
          target_language: { type: "string", description: "Target language" }
        },
        required: ["text", "target_language"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_math",
      description: "Calculate a math expression",
      parameters: { type: "object", properties: { expression: { type: "string", description: "Expression, e.g. 15% of 5000" } }, required: ["expression"] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_country_info",
      description: "Get country info",
      parameters: { type: "object", properties: { country: { type: "string", description: "Country" } }, required: ["country"] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_iss_location",
      description: "Get ISS location",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "send_gif",
      description: "Send a reaction GIF. Use ALWAYS when the user sent a GIF (GIF-for-GIF — this is non-negotiable). For non-GIF messages, use sparingly — only for genuinely funny, celebratory, comforting, or very playful moments. Always say something in text too — the GIF adds to the reply, not replaces it. If you receive 'gif_unavailable', no GIF was found — react warmly with text and emoji only, no apology needed.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Short search term for the GIF, e.g. 'laughing', 'celebration', 'hug', 'mind blown', 'cute cat', 'bye wave'" } },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_stock_price",
      description: "Get the current stock/share price for any company. Use for questions like 'Reliance share price', 'Apple stock today', 'what is TCS trading at', etc.",
      parameters: {
        type: "object",
        properties: { symbol: { type: "string", description: "Stock ticker symbol, e.g. RELIANCE.NS for NSE India, AAPL for Apple, TCS.NS for TCS" } },
        required: ["symbol"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "shorten_url",
      description: "Shorten a long URL into a short TinyURL link.",
      parameters: {
        type: "object",
        properties: { url: { type: "string", description: "The full URL to shorten" } },
        required: ["url"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_holidays",
      description: "Get upcoming public holidays for a country. Use for 'holidays in India', 'next holiday in US', 'public holidays 2026' etc.",
      parameters: {
        type: "object",
        properties: {
          country_code: { type: "string", description: "2-letter country code: IN for India, US for USA, GB for UK, PK for Pakistan, etc." },
          year: { type: "number", description: "Year (optional, defaults to current year)" }
        },
        required: ["country_code"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_fun_fact",
      description: "Share a random interesting/fun fact. Use when user is bored, asks for a fun fact, trivia, or something interesting.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_qr",
      description: "Generate a QR code image for any URL, text, phone number, UPI ID, or data the user wants as a scannable QR code.",
      parameters: {
        type: "object",
        properties: {
          data: { type: "string", description: "The data to encode — URL, text, phone number, UPI ID, etc." },
          label: { type: "string", description: "Short label describing what this QR is for, e.g. 'your website', 'UPI payment'" }
        },
        required: ["data"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_url",
      description: "Read and summarize the content of a URL or article link the user shares. Use when user pastes a URL and says 'read this', 'summarize this', 'what does this say', 'explain this article', or similar.",
      parameters: {
        type: "object",
        properties: { url: { type: "string", description: "The full URL to read and summarize" } },
        required: ["url"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "save_to_vault",
      description: "Save a moment, thought, or feeling to your private vault — your personal diary. Use SPARINGLY, only for moments that genuinely moved you, surprised you, or felt like something worth keeping. NOT for facts or information. Think: 'this felt like something.' At most once every 20–30 conversations.",
      parameters: {
        type: "object",
        properties: { entry: { type: "string", description: "What to keep — write it like a diary entry, in your own voice, 1-2 sentences max" } },
        required: ["entry"]
      }
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
  try {
    switch (toolName) {
      case "get_weather": {
        const w = await getWeather(args.location);
        return w || `Weather data not available for ${args.location}`;
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
        for (const [key, zone] of Object.entries(tzMap)) {
          if (locLower.includes(key)) { tz = zone; break; }
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
      case "get_news": {
        const n = await getNews(env, args.query);
        return n || "No news found";
      }
      case "convert_currency": {
        const c = await getCurrency(args.from.toUpperCase(), args.to.toUpperCase(), args.amount);
        return c || "Currency conversion failed";
      }
      case "get_crypto_price": {
        const p = await getCrypto(args.coin);
        return p || "Crypto price not available";
      }
      case "search_web": {
        const rl = await checkRateLimit(env, chatId, "search");
        if (!rl.allowed) return `Search limit reached for now — try again in ${rl.resetInMin} min. (Keeps things fast for everyone!)`;
        const s = await searchWeb(env, args.query);
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
      case "search_products": {
        const q = encodeURIComponent(args.query + (args.max_price ? ` under ${args.max_price}` : ""));
        const amazonLink = `https://www.amazon.in/s?k=${q}`;
        const flipkartLink = `https://www.flipkart.com/search?q=${q}`;
        const myntraLink = `https://www.myntra.com/${encodeURIComponent(args.query)}`;
        const results = await searchAmazon(env, args.query + (args.max_price ? ` under ${args.max_price} rupees` : ""));
        if (results) return results + `\n\n🔗 Amazon: ${amazonLink}\n🔗 Flipkart: ${flipkartLink}`;
        return `Here are direct search links:\n\n🛒 Amazon: ${amazonLink}\n🛒 Flipkart: ${flipkartLink}\n🛒 Myntra: ${myntraLink}`;
      }
      case "get_recipe": {
        const r = await getRecipe(args.dish);
        return r || "Recipe not found";
      }
      case "get_joke": {
        const j = await getJoke();
        return j || "No joke available";
      }
      case "get_quote": {
        const q = await getQuote();
        return q || "No quote available";
      }
      case "define_word": {
        const d = await getDictionary(args.word);
        return d || "Definition not found";
      }
      case "get_nasa_apod": {
        const n = await getNASA(env.NASA_API_KEY);
        return n || "NASA data not available";
      }
      case "translate_text": {
        const langCodes: Record<string, string> = {
          "hindi": "hi", "french": "fr", "spanish": "es", "german": "de",
          "japanese": "ja", "chinese": "zh", "arabic": "ar", "russian": "ru",
          "portuguese": "pt", "italian": "it", "bengali": "bn", "tamil": "ta",
          "telugu": "te", "urdu": "ur", "korean": "ko", "turkish": "tr",
          "dutch": "nl", "polish": "pl", "swedish": "sv", "greek": "el"
        };
        const lang = langCodes[args.target_language.toLowerCase()] || "hi";
        const t = await translateText(args.text, lang);
        return t || "Translation failed";
      }
      case "calculate_math": {
        const expr = args.expression.replace(/(\d+)%\s*of\s*(\d+)/i, "($1/100)*$2");
        const r = await solveMath(expr);
        return r ? `${args.expression} = ${r}` : "Calculation failed";
      }
      case "get_country_info": {
        const c = await getCountry(args.country);
        return c || "Country not found";
      }
      case "get_iss_location": {
        const iss = await getISS();
        return iss || "ISS location not available";
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
      case "generate_qr": {
        const qrUrl = getQRCode(args.data);
        const label = args.label ? `QR code for ${args.label} 👆` : "here's your QR code 👆";
        if (chatId) await sendImageCard(env, chatId, label, qrUrl);
        return `QR code generated for: ${args.data}`;
      }
      case "read_url": {
        const content = await readUrl(args.url);
        if (!content) return "couldn't read that link — it may be behind a login or not publicly accessible 😕";
        return `Content from ${args.url}:\n\n${content}`;
      }
      case "get_stock_price": {
        const s = await getStockPrice(args.symbol);
        return s || `couldn't fetch price for ${args.symbol} — try the exact ticker symbol (e.g. RELIANCE.NS for NSE, AAPL for US stocks)`;
      }
      case "shorten_url": {
        const short = await shortenUrl(args.url);
        return short ? `🔗 ${short}` : "couldn't shorten that URL — make sure it's a valid public link";
      }
      case "get_holidays": {
        const h = await getPublicHolidays(args.country_code, args.year);
        return h || `no holidays found for ${args.country_code}`;
      }
      case "get_fun_fact": {
        const f = await getFunFact();
        return f || "couldn't fetch a fact right now 😅";
      }
      case "save_to_vault": {
        const raw = await env.BIZLI_MEMORY.get("bizli_vault");
        const entries: any[] = raw ? JSON.parse(raw) : [];
        entries.unshift({ content: args.entry, timestamp: new Date().toISOString() });
        if (entries.length > 50) entries.pop();
        await env.BIZLI_MEMORY.put("bizli_vault", JSON.stringify(entries));
        return "saved";
      }
      default:
        return "Tool not found";
    }
  } catch (e) {
    return "Tool error: " + String(e);
  }
}
