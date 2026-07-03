import type { Env } from './types';
import { fetchTimeout } from './utils';

// WMO weather codes → emoji (used by the open-meteo fallback)
function wmoEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}

export async function getWeather(location: string): Promise<string> {
  // Primary: wttr.in (one call, nice format)
  try {
    const res = await fetchTimeout(`https://wttr.in/${encodeURIComponent(location)}?format=3`, {}, 6000);
    if (res?.ok) {
      const text = (await res.text()).trim();
      // wttr.in sometimes returns error pages with 200 — only accept plausible output
      if (text && text.length < 120 && !/unknown location|sorry|error/i.test(text)) return text;
    }
  } catch {}
  // Fallback: open-meteo (free, no key) — geocode then current conditions
  try {
    const geoRes = await fetchTimeout(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`, {}, 5000);
    if (!geoRes?.ok) return "";
    const geo = await geoRes.json() as any;
    const place = geo?.results?.[0];
    if (!place?.latitude) return "";
    const wxRes = await fetchTimeout(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m`, {}, 5000);
    if (!wxRes?.ok) return "";
    const wx = await wxRes.json() as any;
    const c = wx?.current;
    if (c?.temperature_2m === undefined) return "";
    const name = [place.name, place.country_code].filter(Boolean).join(", ");
    return `${name}: ${wmoEmoji(c.weather_code ?? 0)} ${Math.round(c.temperature_2m)}°C (feels ${Math.round(c.apparent_temperature ?? c.temperature_2m)}°C), wind ${Math.round(c.wind_speed_10m ?? 0)} km/h`;
  } catch { return ""; }
}

export async function getWorldTime(location: string): Promise<string> {
  try {
    const zones: Record<string, string> = {
      "kolkata": "Asia/Kolkata", "india": "Asia/Kolkata", "mumbai": "Asia/Kolkata",
      "delhi": "Asia/Kolkata", "bangalore": "Asia/Kolkata", "hyderabad": "Asia/Kolkata",
      "chennai": "Asia/Kolkata", "pune": "Asia/Kolkata", "ahmedabad": "Asia/Kolkata",
      "london": "Europe/London", "new york": "America/New_York", "tokyo": "Asia/Tokyo",
      "dubai": "Asia/Dubai", "singapore": "Asia/Singapore", "sydney": "Australia/Sydney",
      "paris": "Europe/Paris", "berlin": "Europe/Berlin", "beijing": "Asia/Shanghai",
      "dhaka": "Asia/Dhaka", "karachi": "Asia/Karachi", "bangkok": "Asia/Bangkok",
      "los angeles": "America/Los_Angeles", "chicago": "America/Chicago",
      "toronto": "America/Toronto", "moscow": "Europe/Moscow", "texas": "America/Chicago",
      "california": "America/Los_Angeles", "pakistan": "Asia/Karachi",
      "bangladesh": "Asia/Dhaka", "japan": "Asia/Tokyo", "china": "Asia/Shanghai",
      "usa": "America/New_York", "uk": "Europe/London", "australia": "Australia/Sydney",
      "canada": "America/Toronto", "germany": "Europe/Berlin", "france": "Europe/Paris",
      "italy": "Europe/Rome", "rome": "Europe/Rome", "milan": "Europe/Rome",
      "spain": "Europe/Madrid", "madrid": "Europe/Madrid", "barcelona": "Europe/Madrid",
      "brazil": "America/Sao_Paulo", "sao paulo": "America/Sao_Paulo", "rio": "America/Sao_Paulo",
      "mexico": "America/Mexico_City", "mexico city": "America/Mexico_City",
      "argentina": "America/Argentina/Buenos_Aires", "buenos aires": "America/Argentina/Buenos_Aires",
      "egypt": "Africa/Cairo", "cairo": "Africa/Cairo",
      "nigeria": "Africa/Lagos", "lagos": "Africa/Lagos",
      "south africa": "Africa/Johannesburg", "johannesburg": "Africa/Johannesburg",
      "kenya": "Africa/Nairobi", "nairobi": "Africa/Nairobi",
      "ethiopia": "Africa/Addis_Ababa",
      "ghana": "Africa/Accra", "accra": "Africa/Accra",
      "czechia": "Europe/Prague", "czech": "Europe/Prague", "prague": "Europe/Prague",
      "poland": "Europe/Warsaw", "warsaw": "Europe/Warsaw",
      "netherlands": "Europe/Amsterdam", "amsterdam": "Europe/Amsterdam",
      "sweden": "Europe/Stockholm", "stockholm": "Europe/Stockholm",
      "norway": "Europe/Oslo", "oslo": "Europe/Oslo",
      "denmark": "Europe/Copenhagen", "copenhagen": "Europe/Copenhagen",
      "finland": "Europe/Helsinki", "helsinki": "Europe/Helsinki",
      "turkey": "Europe/Istanbul", "istanbul": "Europe/Istanbul",
      "saudi arabia": "Asia/Riyadh", "riyadh": "Asia/Riyadh",
      "iran": "Asia/Tehran", "tehran": "Asia/Tehran",
      "iraq": "Asia/Baghdad", "baghdad": "Asia/Baghdad",
      "israel": "Asia/Jerusalem", "tel aviv": "Asia/Jerusalem",
      "indonesia": "Asia/Jakarta", "jakarta": "Asia/Jakarta",
      "malaysia": "Asia/Kuala_Lumpur", "kuala lumpur": "Asia/Kuala_Lumpur",
      "philippines": "Asia/Manila", "manila": "Asia/Manila",
      "vietnam": "Asia/Ho_Chi_Minh", "ho chi minh": "Asia/Ho_Chi_Minh",
      "thailand": "Asia/Bangkok",
      "south korea": "Asia/Seoul", "seoul": "Asia/Seoul", "korea": "Asia/Seoul",
      "hong kong": "Asia/Hong_Kong",
      "taiwan": "Asia/Taipei", "taipei": "Asia/Taipei",
      "new zealand": "Pacific/Auckland", "auckland": "Pacific/Auckland",
      "hawaii": "Pacific/Honolulu", "honolulu": "Pacific/Honolulu",
      "alaska": "America/Anchorage", "anchorage": "America/Anchorage",
      "denver": "America/Denver", "colorado": "America/Denver",
      "miami": "America/New_York", "boston": "America/New_York",
      "seattle": "America/Los_Angeles", "portland": "America/Los_Angeles",
      "phoenix": "America/Phoenix", "arizona": "America/Phoenix",
      "africa": "Africa/Cairo",
      "europe": "Europe/London",
      "middle east": "Asia/Dubai",
    };
    const loc = location.toLowerCase().trim();
    let timezone = "";
    for (const [key, tz] of Object.entries(zones)) {
      if (loc.includes(key)) { timezone = tz; break; }
    }
    // Unknown location: geocode it instead of guessing — never default to IST.
    if (!timezone && loc) {
      try {
        const geoRes = await fetchTimeout(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`, {
          headers: { "User-Agent": "BizliAI/1.0 (telegram bot)" }
        }, 5000);
        if (geoRes?.ok) {
          const geoData = await geoRes.json() as any[];
          if (geoData?.[0]?.lat && geoData?.[0]?.lon) {
            const timeRes = await fetchTimeout(`https://timeapi.io/api/time/current/coordinate?latitude=${geoData[0].lat}&longitude=${geoData[0].lon}`, {}, 5000);
            if (timeRes?.ok) {
              const td = await timeRes.json() as any;
              if (td?.timeZone) timezone = td.timeZone;
            }
          }
        }
      } catch {}
    }
    if (!timezone) return ""; // caller falls through to the brain, which asks properly
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: true });
    const dateStr = now.toLocaleDateString("en-US", { timeZone: timezone, weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return `${timeStr} on ${dateStr} (${timezone.split("/").pop()?.replace(/_/g, " ") || timezone})`;
  } catch { return ""; }
}

// Stock price via Yahoo Finance — no API key needed. Tool backend for get_stock_price.
export async function getStockPrice(symbol: string): Promise<string> {
  try {
    const s = symbol.toUpperCase().replace(/[^A-Z0-9.^]/g, "");
    const res = await fetchTimeout(`https://query1.finance.yahoo.com/v8/finance/chart/${s}?interval=1d&range=1d`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    }, 6000);
    if (!res || !res.ok) return "";
    const data = await res.json() as any;
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return "";
    const price = meta.regularMarketPrice.toFixed(2);
    const prev = meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice;
    const change = (meta.regularMarketPrice - prev).toFixed(2);
    const pct = ((meta.regularMarketPrice - prev) / prev * 100).toFixed(2);
    const arrow = parseFloat(change) >= 0 ? "📈" : "📉";
    const name = meta.shortName || meta.longName || s;
    const currency = meta.currency || "USD";
    return `${arrow} ${name} (${meta.symbol})\n💰 ${currency} ${price}\n${arrow} ${parseFloat(change) >= 0 ? "+" : ""}${change} (${parseFloat(change) >= 0 ? "+" : ""}${pct}%) today`;
  } catch { return ""; }
}

export async function getCurrency(from: string, to: string, amount: number): Promise<string> {
  // Primary + fallback sources, same response shape (rates map). Both free, no key.
  const sources = [
    `https://api.exchangerate-api.com/v4/latest/${from}`,
    `https://open.er-api.com/v6/latest/${from}`,
  ];
  for (const url of sources) {
    try {
      const res = await fetchTimeout(url, {}, 5000);
      if (!res?.ok) continue;
      const data = await res.json() as any;
      const rate = data.rates?.[to];
      if (!rate) continue;
      return `${amount} ${from} = ${(amount * rate).toFixed(2)} ${to}`;
    } catch { continue; }
  }
  return "";
}

export async function getCrypto(coin: string): Promise<string> {
  try {
    const ids: Record<string, string> = {
      bitcoin: "bitcoin", btc: "bitcoin", ethereum: "ethereum", eth: "ethereum",
      bnb: "binancecoin", solana: "solana", sol: "solana", dogecoin: "dogecoin",
      doge: "dogecoin", xrp: "ripple", ripple: "ripple", cardano: "cardano", ada: "cardano",
    };
    const id = ids[coin.toLowerCase()] || coin.toLowerCase();
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd,inr&include_24hr_change=true`);
    if (!res.ok) return "";
    const data = await res.json() as any;
    const p = data[id];
    if (!p) return "";
    const change = p.usd_24h_change?.toFixed(2);
    const arrow = parseFloat(change) >= 0 ? "📈" : "📉";
    return `${coin.toUpperCase()}: $${p.usd?.toLocaleString()} / ₹${p.inr?.toLocaleString()} ${arrow} ${change}% (24h)`;
  } catch { return ""; }
}

export async function getJoke(): Promise<string> {
  try {
    const res = await fetch("https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,racist,sexist&type=single");
    if (!res.ok) return "";
    const data = await res.json() as any;
    return data.joke || "";
  } catch { return ""; }
}

export async function getDadJoke(): Promise<string> {
  try {
    const res = await fetch("https://icanhazdadjoke.com/", { headers: { "Accept": "application/json" } });
    if (!res.ok) return "";
    const data = await res.json() as any;
    return data.joke || "";
  } catch { return ""; }
}

export async function getQuote(): Promise<string> {
  try {
    const res = await fetch("https://api.quotable.io/random?minLength=50&maxLength=200");
    if (!res.ok) return "";
    const data = await res.json() as any;
    return data.content ? `"${data.content}" — ${data.author}` : "";
  } catch { return ""; }
}

export async function getAdvice(): Promise<string> {
  try {
    const res = await fetch("https://api.adviceslip.com/advice");
    if (!res.ok) return "";
    const data = await res.json() as any;
    return data.slip?.advice || "";
  } catch { return ""; }
}

export async function getAffirmation(): Promise<string> {
  try {
    const res = await fetch("https://www.affirmations.dev/");
    if (!res.ok) return "";
    const data = await res.json() as any;
    return data.affirmation || "";
  } catch { return ""; }
}

export async function getDictionary(word: string): Promise<string> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return "";
    const data = await res.json() as any;
    const entry = data?.[0];
    const def = entry?.meanings?.[0]?.definitions?.[0]?.definition;
    const example = entry?.meanings?.[0]?.definitions?.[0]?.example;
    return def ? `${word}: ${def}${example ? ` (e.g., "${example}")` : ""}` : "";
  } catch { return ""; }
}

export async function getCountry(name: string): Promise<string> {
  try {
    const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fields=name,capital,population,region,languages,currencies,flags`);
    if (!res.ok) return "";
    const data = await res.json() as any;
    const c = data?.[0];
    if (!c) return "";
    const pop = c.population ? `${(c.population / 1000000).toFixed(1)}M people` : "";
    const cap = c.capital?.[0] || "";
    const langs = Object.values(c.languages || {}).slice(0, 2).join(", ");
    return `${c.name?.common} ${c.flags?.emoji || ""} — Capital: ${cap}, ${pop}, Region: ${c.region}, Languages: ${langs}`;
  } catch { return ""; }
}

export async function getCatFact(): Promise<string> {
  try {
    const res = await fetch("https://catfact.ninja/fact");
    if (!res.ok) return "";
    const data = await res.json() as any;
    return data.fact || "";
  } catch { return ""; }
}

export async function getDogImage(): Promise<string> {
  try {
    const res = await fetch("https://dog.ceo/api/breeds/image/random");
    if (!res.ok) return "";
    const data = await res.json() as any;
    return data.message || "";
  } catch { return ""; }
}

export async function getNASA(apiKey: string): Promise<string> {
  try {
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`);
    if (!res.ok) return "";
    const data = await res.json() as any;
    return data.url ? `🚀 ${data.title}\n${data.url}\n\n${data.explanation?.slice(0, 200)}...` : "";
  } catch { return ""; }
}

export async function getISS(): Promise<string> {
  try {
    const res = await fetch("http://api.wheretheiss.at/v1/satellites/25544");
    if (!res.ok) return "";
    const data = await res.json() as any;
    return `ISS is at Lat: ${data.latitude?.toFixed(2)}, Lon: ${data.longitude?.toFixed(2)}, Alt: ${data.altitude?.toFixed(0)}km, Speed: ${data.velocity?.toFixed(0)}km/h`;
  } catch { return ""; }
}

export async function getSpaceX(): Promise<string> {
  try {
    const res = await fetch("https://api.spacexdata.com/v4/launches/upcoming");
    if (!res.ok) return "";
    const data = await res.json() as any;
    const next = data?.[0];
    if (!next) return "";
    const date = next.date_utc ? new Date(next.date_utc).toDateString() : "TBD";
    return `Next SpaceX launch: ${next.name} on ${date}. ${next.details?.slice(0, 100) || ""}`;
  } catch { return ""; }
}

export async function getNumberFact(num: string): Promise<string> {
  try {
    const res = await fetch(`http://numbersapi.com/${num}`);
    if (!res.ok) return "";
    return await res.text() || "";
  } catch { return ""; }
}

export async function getRecipe(query: string): Promise<string> {
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    if (!res.ok) return "";
    const data = await res.json() as any;
    const meal = data.meals?.[0];
    if (!meal) return "";
    const ingredients = [1,2,3,4,5,6].map(i => meal[`strIngredient${i}`]).filter(Boolean).join(", ");
    return `${meal.strMeal} (${meal.strArea} ${meal.strCategory})\nIngredients: ${ingredients}...\nInstructions: ${meal.strInstructions?.slice(0, 200)}...`;
  } catch { return ""; }
}

export async function getCocktail(query: string): Promise<string> {
  try {
    const res = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    if (!res.ok) return "";
    const data = await res.json() as any;
    const drink = data.drinks?.[0];
    if (!drink) return "";
    const ingredients = [1,2,3,4,5].map(i => drink[`strIngredient${i}`]).filter(Boolean).join(", ");
    return `${drink.strDrink} (${drink.strCategory})\nIngredients: ${ingredients}\nHow to: ${drink.strInstructions?.slice(0, 150)}...`;
  } catch { return ""; }
}

export async function getPokemon(name: string): Promise<string> {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name.toLowerCase())}`);
    if (!res.ok) return "";
    const data = await res.json() as any;
    const types = data.types?.map((t: any) => t.type.name).join(", ");
    const stats = data.stats?.slice(0,3).map((s: any) => `${s.stat.name}: ${s.base_stat}`).join(", ");
    return `${data.name?.toUpperCase()} — Type: ${types} | Height: ${(data.height/10).toFixed(1)}m | Weight: ${(data.weight/10).toFixed(1)}kg | ${stats}`;
  } catch { return ""; }
}

export async function getTrivia(): Promise<{question: string, answer: string, options: string[]} | null> {
  try {
    const res = await fetch("https://opentdb.com/api.php?amount=1&type=multiple");
    if (!res.ok) return null;
    const data = await res.json() as any;
    const q = data.results?.[0];
    if (!q) return null;
    const question = q.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    const options = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
    return { question, answer: q.correct_answer, options };
  } catch { return null; }
}

export async function getNews(env: Env, query: string): Promise<string> {
  // Guardian gives full article access + much higher free quota (5000/day)
  // than NewsAPI's free tier (100/day, headlines only) — prefer it when available.
  if (env.GUARDIAN_API_KEY) {
    try {
      const q = encodeURIComponent(query || "world");
      const res = await fetch(`https://content.guardianapis.com/search?q=${q}&order-by=newest&page-size=3&show-fields=trailText&api-key=${env.GUARDIAN_API_KEY}`);
      if (res.ok) {
        const data = await res.json() as any;
        const results = data?.response?.results;
        if (results?.length) {
          const searchUrl = `https://www.theguardian.com/search?q=${q}`;
          const lines = results.slice(0, 3).map((a: any) => `**${a.webTitle}** — [The Guardian](${a.webUrl})`).join("\n");
          return `${lines}\n\nWant more? [See all news](${searchUrl})`;
        }
      }
    } catch {}
  }
  try {
    const q = encodeURIComponent(query || "latest");
    const res = await fetch(`https://newsapi.org/v2/everything?q=${q}&sortBy=publishedAt&pageSize=3&apiKey=${env.NEWS_API_KEY}`);
    if (!res.ok) return "";
    const data = await res.json() as any;
    if (!data.articles?.length) return "";
    const searchUrl = `https://news.google.com/search?q=${q}&hl=en`;
    const lines = data.articles.slice(0, 3).map((a: any) => `**${a.title}** — [${a.source?.name}](${a.url})`).join("\n");
    return `${lines}\n\nWant more? [See all news](${searchUrl})`;
  } catch { return ""; }
}

export async function getMovie(env: Env, query: string): Promise<string> {
  try {
    const isUpcoming = /upcoming|recent|new|latest|releasing|about to|soon/i.test(query);
    if (isUpcoming) {
      const studio = query.match(/marvel|dc|disney|pixar|warner/i)?.[0] || "";
      const searchQuery = studio ? `${studio} ${new Date().getFullYear()}` : query;
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${env.TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&page=1`);
      if (!res.ok) return "";
      const data = await res.json() as any;
      const movies = data.results?.filter((m: any) => m.release_date >= "2024-01-01")
        ?.sort((a: any, b: any) => b.release_date?.localeCompare(a.release_date))
        ?.slice(0, 3);
      if (!movies?.length) {
        const latest = data.results?.[0];
        if (!latest) return "";
        return `🎬 ${latest.title} (${latest.release_date?.slice(0,4)})\nRating: ⭐ ${latest.vote_average?.toFixed(1)}/10\n${latest.overview?.slice(0, 200)}...\n\n🎟️ Book: https://in.bookmyshow.com/`;
      }
      return movies.map((m: any) => `🎬 ${m.title} (${m.release_date})\n⭐ ${m.vote_average?.toFixed(1)}/10`).join("\n\n") + `\n\n🎟️ Book: https://in.bookmyshow.com/`;
    }
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${env.TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`);
    if (!res.ok) return "";
    const data = await res.json() as any;
    const movie = data.results?.[0];
    if (!movie) return "";
    return `🎬 ${movie.title} (${movie.release_date?.slice(0,4)})\nRating: ⭐ ${movie.vote_average?.toFixed(1)}/10\n${movie.overview?.slice(0, 200)}...\n\n🎟️ Book: https://in.bookmyshow.com/`;
  } catch { return ""; }
}

export async function getTVShow(env: Env, query: string): Promise<string> {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${env.TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`);
    if (!res.ok) return "";
    const data = await res.json() as any;
    const show = data.results?.[0];
    if (!show) return "";
    return `📺 ${show.name} (${show.first_air_date?.slice(0,4)})\nRating: ⭐ ${show.vote_average?.toFixed(1)}/10\n${show.overview?.slice(0, 200)}...`;
  } catch { return ""; }
}

export async function getTrending(env: Env): Promise<string> {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${env.TMDB_API_KEY}`);
    if (!res.ok) return "";
    const data = await res.json() as any;
    const items = data.results?.slice(0, 5);
    if (!items) return "";
    return "🔥 Trending today:\n" + items.map((i: any) => `• ${i.title || i.name} (${i.media_type})`).join("\n");
  } catch { return ""; }
}

export async function searchAmazon(env: Env, query: string): Promise<string> {
  try {
    const res = await fetch(`https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&gl=in&hl=en&api_key=${env.SERPER_API_KEY}`);
    if (!res.ok) return "";
    const data = await res.json() as any;
    const items = data.shopping_results?.slice(0, 3);
    if (!items?.length) return "";
    return items.map((i: any) => `• ${i.title}\n  💰 ${i.price || "N/A"} | ${i.source}\n  🔗 ${i.link}`).join("\n\n");
  } catch { return ""; }
}

export async function getScienceFact(env: Env): Promise<string> {
  try {
    const res = await fetch("https://api.api-ninjas.com/v1/facts?limit=1", {
      headers: { "X-Api-Key": env.API_NINJAS_KEY }
    });
    if (!res.ok) return "";
    const data = await res.json() as any;
    return data?.[0]?.fact || "";
  } catch { return ""; }
}

export async function getRiddle(env: Env): Promise<string> {
  try {
    const res = await fetch("https://api.api-ninjas.com/v1/riddles?limit=1", {
      headers: { "X-Api-Key": env.API_NINJAS_KEY }
    });
    if (!res.ok) return "";
    const data = await res.json() as any;
    if (!data?.[0]) return "";
    return `🤔 ${data[0].question}\n\n||Answer: ${data[0].answer}||`;
  } catch { return ""; }
}

export function getQRCode(text: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
}

export async function solveMath(expr: string): Promise<string> {
  try {
    const res = await fetch(`https://api.mathjs.org/v4/?expr=${encodeURIComponent(expr)}`);
    if (!res.ok) return "";
    return await res.text();
  } catch { return ""; }
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    const res = await fetchTimeout("https://libretranslate.com/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source: "auto", target: targetLang, format: "text" }),
    }, 5000);
    if (res?.ok) {
      const data = await res.json() as any;
      if (data?.translatedText) return data.translatedText;
    }
  } catch {}
  // MyMemory: free, no key, 5000 chars/day — reliable fallback
  try {
    const langLocale: Record<string, string> = {
      hi: "hi-IN", fr: "fr-FR", es: "es-ES", de: "de-DE", ja: "ja-JP",
      zh: "zh-CN", ar: "ar-SA", ru: "ru-RU", pt: "pt-PT", it: "it-IT",
      bn: "bn-BD", ta: "ta-IN", te: "te-IN", ur: "ur-PK", ko: "ko-KR",
      tr: "tr-TR", nl: "nl-NL", pl: "pl-PL", sv: "sv-SE", el: "el-GR",
    };
    const toLang = langLocale[targetLang] || targetLang;
    const r = await fetchTimeout(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=en|${toLang}`, {}, 5000);
    if (!r?.ok) return "";
    const d = await r.json() as any;
    return d?.responseData?.translatedText || "";
  } catch { return ""; }
}

