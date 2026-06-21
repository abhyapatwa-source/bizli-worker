/// <reference types="@cloudflare/workers-types" />

export interface Env {
  TELEGRAM_BOT_TOKEN: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  GROQ_API_KEY_1: string; GROQ_API_KEY_2: string; GROQ_API_KEY_3: string;
  GROQ_API_KEY_4: string; GROQ_API_KEY_5: string; GROQ_API_KEY_6: string; GROQ_API_KEY_7: string;
  BIZLI_PERSONA: string;
  BIZLI_MEMORY: KVNamespace;
  ADMIN_CHAT_ID: string;
  ADMIN_PASSWORD: string;
  FB_VERIFY_TOKEN: string;
  FB_PAGE_ACCESS_TOKEN: string;
  NASA_API_KEY: string;

  TAVILY_API_KEY: string;
  TAVILY_API_KEY_2?: string;
  TAVILY_API_KEY_3?: string;
  TAVILY_API_KEY_4?: string;
  TAVILY_API_KEY_5?: string;
  AI: any;
  NEWS_API_KEY: string;
  TMDB_API_KEY: string;
  API_NINJAS_KEY: string;
  SERPER_API_KEY: string;
  GEMINI_API_KEY?: string;
  GEMINI_API_KEY_2?: string;
  GEMINI_API_KEY_3?: string;
  GEMINI_API_KEY_4?: string;
  GEMINI_API_KEY_5?: string;
  OPENROUTER_API_KEY?: string;
  GUARDIAN_API_KEY?: string;
  DISCORD_APP_ID?: string;
  DISCORD_PUBLIC_KEY?: string;
  DISCORD_BOT_TOKEN?: string;
  GIPHY_API_KEY?: string;
  HF_API_KEY?: string;
}
