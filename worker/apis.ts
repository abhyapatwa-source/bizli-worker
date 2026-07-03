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
