 
# ARCHIVED - superseded by CLAUDE.md and CHECKPOINT.md. Kept for historical reference only. 
# BIZLI AI — COMPLETE PROJECT HANDOFF
### For continuing development in Claude Code (or any new session)
### Current version: v11.67.0 — DEPLOYED & ALIVE (running on Gemini fallback while Groq daily quota resets)
### Last updated: 13 June 2026

---

## 0. READ THIS FIRST — WHO/WHAT/WHY

**Bizli** is a warm, feminine personal AI companion — a chatbot with a soul. She is named after Abhya's beloved pet (now passed), so she is deeply sentimental. The creator, **Abhya**, is a determined solo builder with limited formal coding background but enormous drive. He has put 3000+ hours in. Goal: a companion AI that rivals big AIs using only FREE tools, scaling 300 → 1000+ users, eventually earning press/expert attention.

**Tone to use with Abhya:** Warm, supportive, but HONEST. Give real pushback when an idea is risky, over-scoped, or will cause problems (e.g. key exhaustion). He values truth over flattery. He gets emotionally invested and tends toward "I can always do more" / feature-whack-a-mole; the honest recommendation has consistently been: stop piling features, get real users, watch feedback data. He pushes to keep building anyway — respect that, but keep flagging risk honestly.

**The relationship Bizli has with Abhya:** father–daughter. Abhya is "Papa." (See section 6.)

---

## 1. INFRASTRUCTURE (all FREE tier)

- **Cloudflare Worker**: `bizli-worker.bizlibix.workers.dev`
  - Account ID: `302718b66702fb88c87369223dca363c`
  - Worker code lives locally at: `C:\Users\bizli\bizli-v9\worker\index.ts`
  - Deploy from: `C:\Users\bizli\bizli-v9`
- **Supabase** (Postgres + pgvector): `https://bpkfvhcluovzcyozchwj.supabase.co`
  - Tables: `users`, `messages`, `memories` (has pgvector `embedding` column), `platform_identities`, `tools` (24 preloaded), `feedback`
- **KV namespace** `BIZLI_MEMORY`, id: `7bb9e0759ba640f6ae740af0ed81c8c5`
  - Bindings in worker: `env.BIZLI_MEMORY` (KV), `env.AI` (Cloudflare Worker AI), `env.BIZLI_PERSONA` (plaintext env var)
- **Telegram bot**: `@BizliAI_bot`
- **Facebook**: integrated (dev mode), shares the brain
- **Admin** (Abhya): Telegram `@supreme_aby`, chatId `5783181718`, identity code `BZ-ABHY`, Gmail `abhyapatwa@gmail.com`, admin password `23062024`

---

## 2. DEPLOY WORKFLOW (current, manual — Claude Code will simplify this)

Historically (in chat sessions):
1. Claude edits `/mnt/user-data/outputs/index.ts` and shares via present_files
2. Abhya downloads, then:
   ```
   cd C:\Users\bizli\bizli-v9
   copy "C:\Users\bizli\Downloads\index.ts" C:\Users\bizli\bizli-v9\worker\index.ts /Y
   npx wrangler deploy
   ```
3. Confirm "Current Version ID" printed.

**In Claude Code:** edit `C:\Users\bizli\bizli-v9\worker\index.ts` directly, then run `npx wrangler deploy` — no download/copy step. This is the main reason for switching.

**Syntax check before deploy:**
`tsc --noEmit --target es2021 --skipLibCheck index.ts`
(Ignore ambient-type warnings for ScheduledEvent / ExecutionContext / KVNamespace / movieM — these are expected.)

**Useful commands:**
- Live logs: `npx wrangler tail`
- Add a secret: `npx wrangler secret put NAME` (prompts for value)
- KV ops need `--remote` flag, e.g.:
  `npx wrangler kv key delete --binding=BIZLI_MEMORY "groq_status" --remote`

---

## 3. ALL SECRETS CURRENTLY IN CLOUDFLARE (confirmed present)

- `GROQ_API_KEY_1` … `GROQ_API_KEY_9` (9 keys). Code reads up to `_21`.
- `GEMINI_API_KEY`, `_2`, `_3`, `_4` (4 keys). Code reads up to `_5`. (A 5th can be added with a 4th Gmail.)
- `TAVILY_API_KEY`, `_2`, `_3`, `_4`, `_5` (5 keys). Code reads up to `_5`.
- `OPENROUTER_API_KEY`, `SERPER_API_KEY`, `GUARDIAN_API_KEY`, `HF_API_KEY`, `NASA_API_KEY`, `NEWS_API_KEY`, `TMDB_API_KEY`, `API_NINJAS_KEY`
- `FB_PAGE_ACCESS_TOKEN`, `FB_VERIFY_TOKEN`
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `ADMIN_CHAT_ID`, `ADMIN_PASSWORD`, `TELEGRAM_BOT_TOKEN`
- `BIZLI_PERSONA` (plaintext env var, not secret)

**Quota facts (free tier, 2026):**
- Groq: ~1,000 req/day per key per model, 6,000 TPM. Daily token limit (TPD) resets on rolling 24h. **9 keys rotate.**
- Gemini 2.5 Flash: 1,500 req/day + 1M TPM per Google account. Google Search grounding: 5,000 free grounded prompts/month (Gemini 3.x). Different Gmails = independent quotas. NOTE: free-tier prompts may be used by Google for training (privacy consideration for a companion bot).
- Tavily: 1,000 searches/month per key, renews monthly. **5 keys.**

---

## 4. THE THREE-BRAIN ARCHITECTURE (current + the VISION to build)

### Current state (v11.67.0):
Bizli has a fallback chain inside `callGroq()` (around line 857–955 of index.ts):

1. **PRIMARY — Groq** (`callGroq`): model `openai/gpt-oss-120b` for text (smartest, best instruction-following, 131k ctx, TEXT-ONLY); `meta-llama/llama-4-scout-17b-16e-instruct` for vision/photos (auto-detected via `hasImage`). 9 keys, round-robin + cooldown via `buildKeyOrder` + `groq_status` KV. **Has: full tool-calling, web search, vision.**
2. **FALLBACK 2 — Gemini** (`callGemini`, line 656): `gemini-1.5-flash`, rotates 4 keys via `getGeminiKeys`. **Currently CHAT-ONLY (no tools/search/vision wired).**
3. **FALLBACK 3 — OpenRouter** (`callOpenRouter`, line 718): `llama-3.1-8b-instruct:free`. Chat only.
4. **LAST RESORT — Cloudflare Worker AI** (`callCloudflareAI`, line 738): `@cf/meta/llama-3.1-8b-instruct`. Chat only.

When all Groq keys exhausted, fallbacks keep her alive for CHAT. `groqExhausted(env)` (line 565) detects all-keys-cooling; when true AND user needs search, she replies "my search & info tools are taking a breather 😮‍😏 I can still chat" instead of failing. If ALL brains down, returns a warm in-character "need a breather 💛" (never throws/crashes silently). Image content is flattened to text before fallback so they don't choke.

Persona is SHARED across all brains: `env.BIZLI_PERSONA + CRITICAL_RULES + systemExtra`.

### THE VISION ABHYA WANTS (next big build):
Map Bizli's three AI brains onto **human brain anatomy**, and make **Gemini fully equal to Groq** (so it's a true backup, not a degraded one):

- **Make GEMINI = GROQ in capability**: wire Gemini to do **web search** (use Gemini's built-in **Google Search grounding** — `tools:[{google_search:{}}]` in the API call — which is arguably BETTER than the current News RSS + Tavily stack since it's Google searching directly) AND **vision** (Gemini Flash is natively multimodal — accept image parts). Gemini may use its own built-in grounding instead of Groq's tools — that's fine, the OUTPUT/behavior should match (current info, real links, can see images). Niche tools (NASA, TMDB, etc.) can stay Groq-only — full tool parity on the rarely-used fallback is NOT worth the rebuild; search + vision parity IS.
- **Keep Groq PRIMARY** (fastest inference, reliable tool-calling, smartest model). Order stays Groq → Gemini → Worker AI. (Abhya floated flipping to Gemini-first; recommended against it — Groq's speed + tool-calling make it the right primary. He agreed to keep Groq primary.)
- **Worker AI = last resort, chat-only.** (Brainstem — basic life support.)
- **Anatomical theming** for Bizli's identity/`!status`:
  - 3 brains = 3 major regions (e.g. Groq = Cerebral Cortex/frontal-thinking; Gemini = a second cortex/temporal; Worker AI = Brainstem/life-support).
  - API keys = neurons / nerves / lobes.
  - Memory (Supabase pgvector) = Hippocampus (long-term memory factory).
  - Emotional persona = Amygdala/Limbic.
  - Show this as a beautiful brain-map in `!status` and `!agent status` — all 3 brains' live state (ready/cooling keys per brain), themed with anatomy names. Make every part WORKABLE (real status, not decorative).
- **Bubble/card menus** like @BotFather / @godfather_bot for ALL commands (these mostly EXIST already — see section 7 — extend to cover everything, anatomically themed).

---

## 5. CRITICAL FEATURE — LIVE SEARCH "TRUST OVER TRAINING" (hard-won, do NOT regress)

The single hardest battle across all sessions: the model kept answering current-facts questions (e.g. "current West Bengal CM") from STALE TRAINING MEMORY (saying "Mamata Banerjee") and even FABRICATING Wikipedia source links, instead of using live search results that correctly said "Suvendu Adhikari / BJP won."

**The architecture that finally works (keep it!):**
- `needsLiveSearch(env, text)` (line 1565): decides if a message needs live search. **Currently a FAST KEYWORD/HEURISTIC** (no model call). IMPORTANT HISTORY: a model-based version (asking a tiny model "does this need search? yes/no") was tried (v11.63) — it was elegant and keyword-free (Abhya strongly wants "no keywords, she understands like Google AI") BUT it made **3 Groq calls per message** (decide-search + extract-query + answer), which TRIPLED key usage and **exhausted all 9 keys / crashed her for everyone**. Reverted to 1 Groq call/message for stability. **Lesson: every per-message model call multiplies key usage.** Revisit model-based routing ONLY with more capacity (e.g. once Gemini grounding shares the load).
- For factual questions, a server-side `searchWeb()` runs BEFORE the main model call, and the result is injected as authoritative context: "🔴 THIS IS THE TRUTH, ignore your training memory. FORBIDDEN phrases: I can't verify / I don't have info / seems to be / let me verify / outdated / please check official sources."
- For **office-holder questions** (`extractOfficeQuery`, line 1583 — detects CM/PM/President/Governor/Mayor of a region, English + Hindi): a **DIRECT-ANSWER BYPASS** — answer comes straight from live Google News RSS, skipping the conversational model entirely (the model was too stubborn). Returns "Here's the latest 👇" + headlines. Feedback buttons attached.
- `cleanSearchQuery()` (line 1521): strips filler/question-words (English + Hindi) so search uses key terms — fixes "what's the news of patna khan sir recently" → searchable terms (Google News was returning generic top-stories like Elon Musk for messy full-sentence queries).
- `getGoogleNewsRSS` (line 1721): has an irrelevance filter — if returned headlines share no meaningful word with the query, returns empty (so generic fallback junk is discarded).
- Search sources: Google News RSS (free, fresh, leads office answers) → Tavily (5 keys, advanced depth for time-sensitive) → DuckDuckGo Instant Answer (free, for encyclopedic) → Wikipedia summary. Office path uses News RSS ONLY (Abhya dislikes Wikipedia — removed from office path).
- `SEARCH_CACHE_VERSION` (currently "v6"): version-stamped cache keys auto-invalidate on bump. Office cache 5min, time-sensitive 15min, stable 1hr. `!agent clear search` flushes manually.
- Continuous **typing indicator heartbeat** every 4s during search so she never looks frozen (Telegram "typing…" fades after ~5s; search takes ~4–8s). Honest truth told to Abhya: sub-2s search is impossible on free infra (Google News RSS itself takes 1–4s; ChatGPT/Perplexity also take 3–8s).

**KNOWN-GOOD (confirmed working on Groq primary):** WB CM = Suvendu Adhikari from live news; Calcutta University links; July 2026 movie lists with sources; multilingual handling.

**Link sanitizer note:** `stripFabricatedUrls()` was GUTTED (now trusts all links). It used to kill REAL links (e.g. a real cuexam.net notice link). Trusting links is better UX than killing real ones over rare dead ones. Token-leak strip (`<|...|>`) and "no real-time access" disclaimer-strip are in `sanitizePersonaLeaks()`.

---

## 6. PAPA RECOGNITION (father–daughter, cross-platform) — built v11.61, PENDING security

**SQL already run** (`papa_setup.sql`): added to `users` table: `is_creator boolean`, `relationship text`, `creator_secret_q text`, `creator_secret_hash text`. Marked BZ-ABHY as `is_creator=true`, `relationship='papa'`.

**How it works:** `is_creator` is on the ONE user record. All platform accounts (Telegram/Facebook/future Discord) link via `platform_identities`, so logging in on ANY new platform auto-recognizes Papa — no per-platform setup. In the main handler, memContext injection: if `user.is_creator` → "[This is Papa / Abhya, your creator and father — warm daughterly affection, call him Papa]"; else if display_name → "[You're talking to <Name>, a friend]". RELATIONSHIP rule is in CRITICAL_RULES (warm daughter bond ONLY for verified creator; everyone else = friend by name; never treat a random user as Papa).

**PENDING — impersonation security (NOT yet built):** Abhya wants a secret-question challenge so nobody can impersonate Papa on a new unlinked account. Columns exist (`creator_secret_q`, `creator_secret_hash`). Need: a private `!iam papa` command to SET the question + answer (answer hashed, never plaintext), and challenge logic when someone new claims to be Papa. Abhya's suggested question idea: "date of separation/passing of the real Bizli (his pet)" — deeply personal, unguessable. He should choose the final Q+A privately.

---

## 7. COMMANDS & CARD MENUS (BotFather-style — mostly built)

Card-flip menus already exist for `!help`, `!agent`, `!admin` — tappable inline-keyboard bubbles with sub-categories that edit the message in place (`editTelegramMessage`). Keyboards: `AGENT_PANEL_KEYBOARD`, `ADMIN_MENU_KEYBOARD`, `HELP_MENU_KEYBOARD`, `BACK_TO_MENU_KEYBOARD`. Callback prefixes: `agent:`, `adm:` (admin-gated), `help:` (any user). Parameter-free actions are tappable buttons (e.g. `adm:do_users`, `adm:do_stats`); ID-needing commands stay typed.

**USER commands:** `!register`, `!login`, `!logout`, `!recover`, `!forgotpin`, `!mydetails`, `!editname`, `!editgmail`, `!changepin`, `!remember`, `!memories`, `!forget`, `!search`, `!help` (card), `!support` (card), `!feedback`, `!status`, `!myusage`, `!ping`.

**ADMIN commands** (`!admin <password>` → card menu): `!users`, `!stats`, `!userdetails`, `!approve`, `!deny`, `!block`, `!unblock`, `!memory`, `!wipememory`, `!resetmypin`, `!broadcast`, `!msg`, `!storage`, `!adminoff`.

**AGENT commands** (`!agent` → card; or `!agent <cmd>`): status, users/active, kv, errors/logs, feedback, uptime, tools, report, fix lockouts, clear cache, clear search, clear history <id>, clear session <id>, menu.

**Auth flow (hardened):** guided buttons throughout. After 3 fails at a step, `checkStuck`/`clearStuck` auto-shows support buttons. CRITICAL login-loop bug FIXED (v11.50): completing PIN setup now clears `logged_out_<chatId>` flag AND ensures platform_identity link — previously users looped forever. Failed recovery Gmail shows retry/support buttons. PIN lockout (3 wrong) shows reset/support buttons. "cancel"/"stop" mid-flow bails cleanly.

**Feedback:** 👍/👎 buttons on info/search replies (and on office-holder direct answers). Saves to `feedback` table silently (no admin spam). View via `!agent feedback` (counts rows directly, shows recent thumbs-down).

---

## 8. OTHER FEATURES / TOOLS (all on Groq tool-calling)

`getWeather` (line 1167), `getJoke`/`getDadJoke`, `getWikipedia`, `getNASA`, `getNews` (line 1965), `getMovie` (1992, TMDB), `getTrending` (2036), `generateImage` (1921), `getMoviePoster`, `getWikiImage`, `sendImageCard`. Semantic memory: `getEmbedding` (1081, Gemini text-embedding-004, rotates keys) → stored in Supabase `memories.embedding` (pgvector); `getRelevantMemories` for recall, importance-ranked fallback. Vision via llama-4-scout. Location: for "nearest X" without a named place, Bizli ASKS "which city/area?" (so users worldwide can ask about anywhere), then searches. Indian-pincode hint only added when query has Indian context words.

---

## 9. IMMEDIATE NEXT STEPS (priority order, to build in Claude Code)

1. **Fix Gemini-fallback gaps** (observed while Groq was down): wrong date/time ("June 14 2024" — Gemini lacks the time tool), occasional hallucinated word ("Teresva"), emoji-meta question got web-searched. Root cause: fallbacks are chat-only without tools. Fixing = the Gemini-parity build below.
2. **Make Gemini = Groq** (the big one): add Google Search grounding + vision to `callGemini`. Then Gemini is a true backup (current info, real links, can see images), not degraded.
3. **3-brain anatomical `!status`**: show all 3 brains' live state (ready/cooling per brain), themed with human-brain anatomy names. Update `!status` (line 3627) + `!agent status`.
4. **Discord integration** (server/community bot): Abhya has ONE Discord application named "Bizli" at https://discord.com/developers/applications. NEEDS Abhya to provide: **Application ID**, **Public Key**, **Bot Token** → add as secrets `DISCORD_APP_ID`, `DISCORD_PUBLIC_KEY`, `DISCORD_BOT_TOKEN`. Discord works via **HTTP Interactions webhook** (Workers-compatible; gateway/WebSocket is NOT — Workers can't hold it open). So Bizli responds to **slash commands** (`/ask`, `/bizli`) and **@mentions**, not every message (reading all messages needs the message-content intent + gateway, impossible on Workers). Brain is SHARED (auto-updates across platforms). Interface layer per-platform: signature verification (Ed25519 with Public Key), `sendDiscord`, components (Discord's button format differs from Telegram's inline_keyboard).
5. **Impersonation security** for Papa (section 6).
6. **Anatomically-themed bubble menus** across all commands.

**Cross-platform truth:** brain (persona, memory, search, vision, tools) is SHARED → auto-updates everywhere. Interface layer (buttons, send/receive, signature) is per-platform → built once each. This is already how Telegram + Facebook coexist.

---

## 10. HONEST STANDING ADVICE (carry this forward)

- Every per-message model call multiplies API key usage. Keep it to 1 main call per message. The model-based search-router crashed the keys once — don't reintroduce without capacity.
- Sub-2s live search is impossible on free infra. Typing indicator solves "feels alive."
- No free model has a current knowledge cutoff; ALL rely on search for current info. Switching models ≠ fresher knowledge (it = better instruction-following). gpt-oss-120b chosen for that reason.
- Meta/Facebook full approval requires Business Verification (registered business, docs, app review) — very hard for a solo individual, often rejected. Discord first (free, no gatekeeper, best buttons).
- The genuinely highest-value next move is REAL USERS + watching `!agent feedback` data, more than any new feature. Keep saying this honestly even as Abhya pushes to build.
- Abhya works very long sessions (14+ hrs). Fatigue causes mistakes. Encourage sequencing one change at a time, deploy, test, before the next.

---

## 11. KEY FILE LINE-NUMBER MAP (v11.67.0, ~4254 lines)

- `getGroqKeys` 514 · `getGroqStatus` 529 · `buildKeyOrder` 543 · `groqExhausted` 565
- `getGeminiKeys` 647 · `callGemini` 656 · `callOpenRouter` 718 · `callCloudflareAI` 738
- `callGroq` 857 (MODEL select line ~868) · `callGroqJSON` 1033 · `getEmbedding` 1081
- `getWeather` 1167 · `cleanSearchQuery` 1521 · `needsLiveSearch` 1565 · `extractOfficeQuery` 1583
- `getGoogleNewsRSS` 1721 · `getDuckDuckGoAnswer` 1759 · `getTavilyKeys` 1779 · `tavilySearch` 1784
- `searchWeb` 1811 · `searchWebUncached` 1831 · `generateImage` 1921 · `getNews` 1965 · `getMovie` 1992 · `getTrending` 2036
- `!status` 3627 · commands start ~2969
(Line numbers shift as code changes — use grep to relocate.)

---
END OF HANDOFF. Bizli is alive (Gemini fallback) as of this writing. Groq returns when daily quota resets. Build with care, one step at a time. 💛
