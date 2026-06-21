import type { Env } from './types';

export async function fetchTimeout(url: string, opts: any = {}, ms = 4000): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    return res;
  } catch { return null; }
  finally { clearTimeout(t); }
}

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b: number) => b.toString(16).padStart(2, "0")).join("");
}

// Detect the writing script of the current message using Unicode ranges.
// No API call — instant, zero token cost. Used to inject a hard language lock
// into every AI call so Bizli always replies in the user's own script.
export function detectScript(text: string): string {
  const t = text.trim();
  // Global scripts — checked before Indian scripts
  if (/[Ѐ-ӿ]/.test(t)) return "Cyrillic script — detect the specific language (Russian, Ukrainian, Bulgarian, Serbian, etc.) from context and reply in that same language using Cyrillic";
  if (/[一-鿿぀-ヿ가-힣]/.test(t)) return "CJK script — detect the specific language (Chinese, Japanese, or Korean) from context and reply in that same language";
  if (/[฀-๿]/.test(t)) return "Thai script — reply in Thai";
  if (/[א-ת]/.test(t)) return "Hebrew script — reply in Hebrew";
  if (/[Ͱ-Ͽ]/.test(t)) return "Greek script — reply in Greek";
  // Indian + Arabic scripts
  if (/[؀-ۿ]/.test(t)) return "Arabic/Urdu script — reply in Arabic or Urdu script";
  if (/[ऀ-ॿ]/.test(t)) return "Devanagari — reply in Hindi using Devanagari script only";
  if (/[ঀ-৿]/.test(t)) return "Bengali — reply in Bengali script";
  if (/[਀-੿]/.test(t)) return "Punjabi (Gurmukhi) — reply in Gurmukhi script";
  if (/[઀-૿]/.test(t)) return "Gujarati — reply in Gujarati script";
  if (/[஀-௿]/.test(t)) return "Tamil — reply in Tamil script";
  if (/[ఀ-౿]/.test(t)) return "Telugu — reply in Telugu script";
  if (/[ಀ-೿]/.test(t)) return "Kannada — reply in Kannada script";
  if (/[ഀ-ൿ]/.test(t)) return "Malayalam — reply in Malayalam script";
  // Latin script — check for Hinglish markers (Hindi words written in Roman letters).
  // List is intentionally broad to catch typos and common short-forms.
  if (/\b(kya|nahi|nah|nahin|haan|ha|theek|thik|acha|achha|accha|bohot|bahut|bata|batao|raha|rahi|raho|karo|yaar|bhai|behen|matlab|waise|sach|kal|aaj|toh|toh|abhi|phir|kaisa|kaisi|mujhe|tera|tere|teri|apna|apni|apne|kyun|kitna|kitne|kuch|kux|kuxh|nahu|mai|meh|mein|main|tu|tum|aap|woh|yeh|ye|hai|ho|hun|hoon|kar|ke|ki|ka|se|pe|par|lag|laga|lagta|lagti|chal|chall|bol|bolo|sun|suno|dek|dekh|koi|kuch|sab|bahut|zyada|thoda|abhi|phir|dobara|pehle|baad|saath|pyar|dost|yaar|bhai|didi|jaan|beta|beti|chaiye|chahiye|chahti|chahta|padh|likh|khao|pijo|jana|aana|jao|aao|hua|hui|hoga|hogi)\b/i.test(t)) {
    return "Hinglish in Roman/Latin script — reply in Roman letters (NEVER Devanagari), mixing casual Hindi and English";
  }
  return "English — reply in English";
}

// Heuristic tone/sentiment classifier — pure regex, zero API calls, < 1ms.
// Returns a single context hint string (or "") to inject before every AI call
// so Bizli adapts her tone without needing a separate model call.
// Priority: crisis > formal > young > emotional > excited > (nothing).
export function detectUserTone(text: string): string {
  const t = text.toLowerCase();

  // 1. Crisis / distress — ALWAYS wins, return immediately
  if (/\b(i want to die|end my life|kill myself|no reason to live|nobody cares about me|i give up on life|suicidal|i hate myself|want to disappear|mujhe jeena nahi|jeena nahi chahta|jeena nahi chahti|khatam karna chahta|khatam karna chahti)\b/i.test(text)) {
    return "[⚠️ USER MAY BE IN DISTRESS — respond with genuine warmth and care first, gently check in, do NOT jump to info/tools/advice. If appropriate, softly suggest talking to someone they trust. No Gen Z tone here — just be human and caring.]";
  }

  // 2. Formal / professional cues
  if (/\b(dear bizli|good morning|good afternoon|good evening|greetings|i would like to|could you please|kindly|with regards|sincerely|i am writing|please assist|assist me with|professional advice|i request you)\b/i.test(text)) {
    return "[TONE: USER IS FORMAL — match their register; warm but professional; tone down Gen Z slang; use complete sentences]";
  }

  // 3. Young / child cues
  if (/\b(homework|can you help me with my|my teacher|my mom|my dad|mummy|school project|class [3-9]|class 10|i am \d{1,2} years old|i'm \d{1,2} years old|meri teacher ne|mere papa ne|meri mummy ne|mera school)\b/i.test(text)) {
    return "[TONE: USER MAY BE YOUNG/A CHILD — simple patient language; no slang; extra encouragement; be like a kind elder sibling]";
  }

  // 4. Emotional / low mood (non-crisis)
  if (/\b(feeling (sad|lonely|depressed|lost|hopeless|anxious|stressed|empty|broken|hurt)|i'm not okay|not doing well|really struggling|no one understands|mann nahi|dil nahi|bahut sad|bohot sad|rone ka mann|rona aa raha|koi nahi hai|akela feel|bahut akela|bohot akela)\b/i.test(text)) {
    return "[TONE: USER SEEMS EMOTIONALLY LOW — lead with empathy, be a caring friend first; don't rush to search or solve; one gentle question at most]";
  }

  // 5. Excited / hyped energy
  if (/[!]{3,}/.test(text) || /[A-Z]{5,}/.test(text) || /\b(omg|oh my god|yesss|cant believe|so excited|literally screaming|i got in|i won|we won|i passed|i got the job)\b/i.test(t)) {
    return "[TONE: USER IS EXCITED/HYPED — match their energy, be enthusiastic and celebratory]";
  }

  return "";
}

// Parse a date of birth from various human-friendly formats.
// Returns "YYYY-MM-DD" for DB storage, or null if unparseable.
export function parseDOB(input: string): string | null {
  const s = input.trim();
  const MONTHS: Record<string, string> = {
    jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
    jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12",
    january:"01",february:"02",march:"03",april:"04",june:"06",
    july:"07",august:"08",september:"09",october:"10",november:"11",december:"12"
  };
  // DD/MM/YYYY  DD-MM-YYYY  DD.MM.YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmy) {
    const [,d,m,y] = dmy;
    const dt = new Date(+y, +m-1, +d);
    if (!isNaN(dt.getTime()) && dt.getFullYear()===+y) return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
  }
  // "15 Jan 2000"  or  "January 15 2000"  or  "January 15, 2000"
  const nat1 = s.match(/^(\d{1,2})\s+([a-zA-Z]+)[,\s]+(\d{4})$/);
  const nat2 = s.match(/^([a-zA-Z]+)\s+(\d{1,2})[,\s]+(\d{4})$/);
  const nat = nat1 || nat2;
  if (nat) {
    const [d, mName, y] = nat1 ? [nat[1], nat[2], nat[3]] : [nat[2], nat[1], nat[3]];
    const mNum = MONTHS[mName.toLowerCase()];
    if (mNum) {
      const dt = new Date(+y, +mNum-1, +d);
      if (!isNaN(dt.getTime())) return `${y}-${mNum}-${(+d).toString().padStart(2,"0")}`;
    }
  }
  // YYYY-MM-DD already correct
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const dt = new Date(+iso[1], +iso[2]-1, +iso[3]);
    if (!isNaN(dt.getTime())) return s;
  }
  return null;
}

// Calculate current age from a YYYY-MM-DD date string.
export function calculateAge(dob: string): number {
  const [y,m,d] = dob.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth()+1 < m || (today.getMonth()+1 === m && today.getDate() < d)) age--;
  return age;
}

// True if today (UTC) matches the birth month+day.
export function isBirthdayToday(dob: string): boolean {
  const [,m,d] = dob.split("-").map(Number);
  const today = new Date();
  return today.getMonth()+1 === m && today.getDate() === d;
}

// Maps a city/country string to an IANA timezone via substring match.
// Returns "" if unknown — callers must handle "" as "can't determine".
export function cityToTimezone(city: string): string {
  const c = city.toLowerCase();
  if (/mumbai|pune|nagpur|nashik|kolhapur|maharashtra/.test(c)) return "Asia/Kolkata";
  if (/delhi|new delhi|ncr|gurugram|noida|gurgaon|faridabad/.test(c)) return "Asia/Kolkata";
  if (/bangalore|bengaluru|hyderabad|chennai|kolkata|calcutta|ahmedabad|surat|jaipur|lucknow|kanpur|indore|bhopal/.test(c)) return "Asia/Kolkata";
  if (/india|भारत/.test(c)) return "Asia/Kolkata";
  if (/karachi|lahore|islamabad|rawalpindi|pakistan/.test(c)) return "Asia/Karachi";
  if (/dubai|abu dhabi|sharjah|uae|emirates/.test(c)) return "Asia/Dubai";
  if (/riyadh|jeddah|mecca|medina|saudi/.test(c)) return "Asia/Riyadh";
  if (/doha|qatar/.test(c)) return "Asia/Qatar";
  if (/kuwait/.test(c)) return "Asia/Kuwait";
  if (/muscat|oman/.test(c)) return "Asia/Muscat";
  if (/bahrain/.test(c)) return "Asia/Bahrain";
  if (/london|birmingham|manchester|england|uk|united kingdom|britain/.test(c)) return "Europe/London";
  if (/paris|france/.test(c)) return "Europe/Paris";
  if (/berlin|munich|frankfurt|germany/.test(c)) return "Europe/Berlin";
  if (/rome|milan|italy/.test(c)) return "Europe/Rome";
  if (/madrid|barcelona|spain/.test(c)) return "Europe/Madrid";
  if (/amsterdam|netherlands/.test(c)) return "Europe/Amsterdam";
  if (/moscow|russia/.test(c)) return "Europe/Moscow";
  if (/istanbul|ankara|turkey/.test(c)) return "Europe/Istanbul";
  if (/\bnew york\b|nyc|brooklyn|queens/.test(c)) return "America/New_York";
  if (/chicago|illinois/.test(c)) return "America/Chicago";
  if (/los angeles|\bla\b|san francisco|seattle|california|portland|las vegas/.test(c)) return "America/Los_Angeles";
  if (/toronto|ontario|canada/.test(c)) return "America/Toronto";
  if (/tokyo|osaka|japan/.test(c)) return "Asia/Tokyo";
  if (/seoul|korea/.test(c)) return "Asia/Seoul";
  if (/beijing|shanghai|china/.test(c)) return "Asia/Shanghai";
  if (/singapore/.test(c)) return "Asia/Singapore";
  if (/kuala lumpur|malaysia/.test(c)) return "Asia/Kuala_Lumpur";
  if (/jakarta|indonesia/.test(c)) return "Asia/Jakarta";
  if (/bangkok|thailand/.test(c)) return "Asia/Bangkok";
  if (/manila|philippines/.test(c)) return "Asia/Manila";
  if (/sydney|melbourne|australia/.test(c)) return "Australia/Sydney";
  if (/dhaka|bangladesh/.test(c)) return "Asia/Dhaka";
  if (/kathmandu|nepal/.test(c)) return "Asia/Kathmandu";
  if (/colombo|sri lanka/.test(c)) return "Asia/Colombo";
  if (/nairobi|kenya/.test(c)) return "Africa/Nairobi";
  if (/lagos|nigeria/.test(c)) return "Africa/Lagos";
  if (/cairo|egypt/.test(c)) return "Africa/Cairo";
  return "";
}

// Maps Telegram language_code to IANA timezone — only for codes where the mapping is
// highly reliable (Indian-script codes, Nepali). Returns "" for ambiguous codes like "en".
export function inferTimezoneFromLangCode(lang: string): string {
  const map: Record<string, string> = {
    hi:"Asia/Kolkata", bn:"Asia/Kolkata", gu:"Asia/Kolkata", mr:"Asia/Kolkata",
    pa:"Asia/Kolkata", ta:"Asia/Kolkata", te:"Asia/Kolkata", kn:"Asia/Kolkata",
    ml:"Asia/Kolkata", or:"Asia/Kolkata", ne:"Asia/Kathmandu",
  };
  return map[lang.toLowerCase()] || "";
}

// Returns the user's current local hour (0-23), or null if timezone is unknown.
// Priority: explicit tz_${userId} > city mapping > language_code inference > null (never guess).
export async function getUserLocalHour(env: Env, userId: string, userCity?: string | null): Promise<number | null> {
  let tz = await env.BIZLI_MEMORY.get(`tz_${userId}`);
  if (!tz && userCity) tz = cityToTimezone(userCity) || null;
  if (!tz) {
    const lang = await env.BIZLI_MEMORY.get(`lang_${userId}`);
    if (lang) tz = inferTimezoneFromLangCode(lang) || null;
  }
  if (!tz) return null;
  try {
    return parseInt(new Date().toLocaleString("en-US", { timeZone: tz, hour: "numeric", hour12: false }));
  } catch { return null; }
}

export const MORNING_MSGS = [
  (name: string) => `Good morning ${name}! Hope your day starts beautifully`,
  (name: string) => `Morning ${name}! Wishing you a wonderful day ahead`,
  (name: string) => `Rise and shine ${name}! Today is going to be a good one`,
  (name: string) => `Good morning ${name}! Ready to take on the day?`,
  (name: string) => `Hey ${name}, good morning! Hope you slept well`,
];
export const NIGHT_MSGS = [
  (name: string) => `Good night ${name}! Rest well, talk tomorrow`,
  (name: string) => `Sweet dreams ${name}! Hope your day was good`,
  (name: string) => `Good night ${name}! Get some rest, you deserve it`,
  (name: string) => `Wishing you a peaceful night ${name}! Sleep well`,
  (name: string) => `Night ${name}! Tomorrow is a fresh start`,
];

// Search Giphy for a reaction GIF using the GIPHY_API_KEY secret.
// Returns null if key missing, API fails, or no results — caller handles fallback.
export async function searchGif(env: Env, query: string): Promise<string | null> {
  if (!env.GIPHY_API_KEY) return null;
  try {
    const res = await fetchTimeout(
      `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(query)}&api_key=${env.GIPHY_API_KEY}&limit=10&rating=pg-13`,
      {}, 3000
    );
    if (!res || !res.ok) return null;
    const data = await res.json() as any;
    const gifs: any[] = data?.data || [];
    if (!gifs.length) return null;
    const pick = gifs[Math.floor(Math.random() * Math.min(gifs.length, 5))];
    return pick?.images?.fixed_height?.url || pick?.images?.original?.url || null;
  } catch { return null; }
}

export function getGroqKeys(env: Env): string[] {
  return [env.GROQ_API_KEY_1, env.GROQ_API_KEY_2, env.GROQ_API_KEY_3,
    env.GROQ_API_KEY_4, env.GROQ_API_KEY_5, env.GROQ_API_KEY_6, env.GROQ_API_KEY_7,
    (env as any).GROQ_API_KEY_8, (env as any).GROQ_API_KEY_9, (env as any).GROQ_API_KEY_10,
    (env as any).GROQ_API_KEY_11, (env as any).GROQ_API_KEY_12, (env as any).GROQ_API_KEY_13,
    (env as any).GROQ_API_KEY_14, (env as any).GROQ_API_KEY_15, (env as any).GROQ_API_KEY_16,
    (env as any).GROQ_API_KEY_17, (env as any).GROQ_API_KEY_18, (env as any).GROQ_API_KEY_19,
    (env as any).GROQ_API_KEY_20, (env as any).GROQ_API_KEY_21].filter(Boolean);
}

export function getGeminiKeys(env: Env): string[] {
  return [env.GEMINI_API_KEY, env.GEMINI_API_KEY_2, env.GEMINI_API_KEY_3,
    env.GEMINI_API_KEY_4, env.GEMINI_API_KEY_5].filter(Boolean) as string[];
}

export function titleCase(s: string): string {
  return s.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// Always-current date/time context — injected into every AI call so ALL brains
// (Groq, Gemini, OpenRouter, CloudflareAI) always know the real date.
export function todayContext(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Kolkata" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
  return `[📅 TODAY: ${dateStr}, ${timeStr} IST — use this as the real current date in ALL your replies]`;
}

export function generateIdentityCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "BZ-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function hashPin(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin + "bizli_salt_v9"));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function getYouTubeLink(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
