# BIZLI AI — Project Context

## THE MISSION

Bizli is a warm, emotionally intelligent AI companion built for **international users from every side of the world**. She is named after my late pet cat — a memorial project that has grown into something real.

She is NOT an Indian-only bot. She serves users globally, in their own languages, with their own cultural context. She is feminine, genuine, conversational — and she remembers what matters to people.

### Global from day one
- **Multilingual by design** — auto-detects user's language and replies in it
- **Multi-script** — Latin, Devanagari, Arabic, CJK, Cyrillic, Korean, etc.
- **Cross-cultural tools** — weather, time, currency, movies work worldwide
- **Multi-platform** — Telegram, Discord, Facebook, Web Chat (WhatsApp coming)
- **Time zones accurate globally** — not just Indian timezones
- **Cultural sensitivity** — no assumed references, localized when possible

---

## WHO I AM (Abhya)

- 21-year-old solo developer in Kolkata, India
- I communicate naturally in English with occasional Hindi
- **DO NOT use forced Hindi-English code-switching with me** — just clear English
- I've invested 3,000+ hours building Bizli
- I work 6-8 hours/day, deadline July 5-7, 2026 (~7 days from June 28)
- I'm @supreme_aby on Telegram (admin)
- Admin password: stored in Cloudflare secret ADMIN_PASSWORD (do not log or commit)

---

## WHAT BIZLI IS (Technical)

### Infrastructure (entirely free-tier)
- **Runtime:** Cloudflare Workers (TypeScript)
- **Storage:** Cloudflare KV (namespace BIZLI_MEMORY) + Supabase (PostgreSQL)
- **AI:** Groq (primary), OpenRouter, Cloudflare Worker AI, Gemini (Lab-only)
- **Search:** Tavily (5 keys) + Serper fallback

### Production
- **URL:** https://bizli-worker.bizlibix.workers.dev
- **GitHub:** https://github.com/abhyapatwa-source/bizli-worker
- **Telegram:** @BizliAI_bot
- **Current users:** 11 approved, 0 waitlist

### Current version: v12.36.0 (see BIZLI_VERSION in worker/brain.ts — single source of truth)

### BRAIN-FIRST (since v12.31.0) — the keyword router is DEAD
Every chat message in every language goes: commands check → brain (callGroq +
BIZLI_TOOLS). `detectIntent()` in commands.ts now contains ONLY the
image-generation flow (rate limit + style picker). There is no regex layer
answering informational queries anymore — the model decides tool use.
callGroq also does PROACTIVE quota management: per key+model counters
(25 req/min, 5500 tok/min, 900 req/day soft limits) stored in the existing
`groq_status` KV key — combos near limits are skipped silently before any 429.

---

## ARCHITECTURE

### Bizli's chat brain chain (in order) — ALL self-healing since v12.29.0
1. **Groq** (primary): up to 21 keys (GROQ_API_KEY_1..21) × auto-discovered models
   - Models auto-probed from GROQ_CANDIDATE_POOL, cached in KV `groq_live_models`
   - Current lead: openai/gpt-oss-120b → gpt-oss-20b (changes automatically)
2. **Cerebras** (fallback #1): 5 keys (CEREBRAS_API_KEY_1..5) × auto-discovered models
   - Lead: gemma-4-31b (direct-answer); gpt-oss-120b/zai-glm-4.7 are reasoning models (secondary)
3. **OpenRouter** (fallback #2): auto-fetched `:free` model pool, key rotation ready
4. **Cloudflare Worker AI** (last resort): @cf/meta/llama-3.1-8b-instruct

`probeAllProviders()` (brain.ts) re-probes ALL providers on the 12h cron — dead
models auto-drop, new ones auto-adopt. No code edits needed to stay current.

### Lab Agent (separate diagnostic AI)
- **Gemini** only, 5 keys, models auto-discovered (KV `gemini_live_models`)
- Bizli's chat **never** touches Gemini (architectural separation since v11.87.0)
- Gemini Lab keys ALSO power memory embeddings (`getEmbedding` uses "lab" scope)

### Vision (image input)
- Auto-probed from GROQ_VISION_CANDIDATES (KV-cached); llama-3.2 vision family

### Memory extraction
- `autoExtractMemory` → Cerebras-first (callCerebrasJSON), Groq fallback (callGroqJSON)
- Runs every 4th message; no longer competes with chat for Groq quota

### Chat sessions (v12.36.0)
- Short-term history (`history_<userId>` KV) is stored as `{ts, msgs}`. After
  an away-gap > 4h (SESSION_GAP_MS in memory.ts), getKVHistory KEEPS the old
  messages but appends a system note ("conversation above was ~Xh ago — greet
  fresh, don't continue old topics unless the user does"). ChatGPT-style:
  aware, not continuing. The note is never persisted — appendKVHistory reads
  raw history. Long-term Supabase memories unaffected. Telegram Bot API can't
  see online/offline presence; last-message time is the only away signal.
  Legacy plain-array histories read as ts 0 and upgrade on next write.

---

## FILE STRUCTURE

```
worker/
  index.ts         (~529 lines) — HTTP routing + cron triggers + pre-auth intercepts
  brain.ts         (~1023 lines) — AI brain, model rotation, quota mgmt, persona
  tools.ts         (~326 lines) — 12 production tools
  commands.ts      (~529 lines) — User commands + callbacks + image-gen intent
  admin.ts         (~640 lines) — Admin commands, flash cards, !agent subcommands
  apis.ts          (~142 lines) — Tool backends only (weather/stock/currency/crypto/movie/tv)
  search.ts        (~334 lines) — Web search (Tavily + Serper)
  auth.ts          (~291 lines) — User registration + PIN auth
  utils.ts         (~301 lines) — Helpers (key getters, script detection)
  telegram.ts      (~250 lines) — Telegram API wrappers
  stats.ts         (~226 lines) — /admin/stats endpoint
  agents.ts        (~154 lines) — Cron agents
  memory.ts        (~126 lines) — KV + Supabase memory
  lab.ts           (~135 lines) — Lab Agent backend
  quota.ts         (~59 lines)  — Lab quota tracking
  discord.ts       (~167 lines) — Discord handler
  facebook.ts      (~60 lines)  — Facebook Messenger
  group.ts         (~118 lines) — Telegram groups
  html.ts          (~391 lines) — Dashboard HTML assembler (thin)
  dashboard/       — split modules for the dashboard UI (ALL populated)
    styles.ts, scripts.ts, gate.ts, topbar.ts, leftnav.ts
    orb.ts, rightpanel.ts
    tabs/
      overview.ts, keys.ts, errors.ts, tools.ts, users.ts, vitals.ts,
      brains.ts, models.ts, livefeed.ts, maintenance.ts, tests.ts, settings.ts
```

(Backup file `index_BACKUP_v11.80.2.ts` already deleted — repo is clean of dead files as of v12.29.2.)

---

## SECRETS (Cloudflare Workers)

- Groq keys: GROQ_API_KEY_1 through _21 (code reads whatever exists)
- 5 Cerebras keys: CEREBRAS_API_KEY_1 through _5 (added v12.29.x)
- 5 Gemini keys: GEMINI_API_KEY, _2, _3, _4, _5 (Lab + embeddings only)
- 5 Tavily keys: TAVILY_API_KEY, _2, _3, _4, _5
- Other API keys: OPENROUTER, GOOGLE, GIPHY, TMDB, GUARDIAN, NEWS, NASA, API_NINJAS, SERPER, HF
- Platform: TELEGRAM_BOT_TOKEN, FB_PAGE_ACCESS_TOKEN, FB_VERIFY_TOKEN, DISCORD_APP_ID, DISCORD_BOT_TOKEN, DISCORD_PUBLIC_KEY
- Storage: SUPABASE_URL, SUPABASE_SERVICE_KEY
- Auth: ADMIN_CHAT_ID, ADMIN_PASSWORD
- KV namespace: BIZLI_MEMORY

### Local-only (gitignored `.dev.vars`, NOT Cloudflare secrets)
- SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF (`bpkfvhcluovzcyozchwj`) — lets
  Claude Code run SQL via the Supabase Management API
  (`POST https://api.supabase.com/v1/projects/<ref>/database/query`).
  Never print the token; Abhya can revoke at supabase.com/dashboard/account/tokens.

---

## BIZLI'S 12 ACTIVE TOOLS (in BIZLI_TOOLS)

1. **get_weather** — current weather, any location worldwide (wttr.in + open-meteo)
2. **get_current_time** — time in any city/country (timezone-aware, geocoding fallback)
3. **search_web** — Tavily primary, Serper fallback
4. **convert_currency** — all major currencies (dual-source)
5. **get_movie_info** — TMDB API, all languages
6. **read_url** — read and summarize any public URL
7. **save_to_vault** — private diary entries (KV, capped 50)
8. **send_gif** — Giphy API (GIF-for-GIF only)
9. **search_youtube** — YouTube Data API v3
10. **show_map** — Google Maps URL
11. **get_crypto_price** — live crypto prices (CoinGecko) — added v12.31.0
12. **get_stock_price** — live stock/index prices (Yahoo Finance) — added v12.31.0

### Keyword router — DELETED (v12.31.0)
`detectIntent()` keeps ONLY the image-generation flow. All informational
queries (jokes, weather, news, prices, shopping, translate, …) go to the
brain, which answers natively or calls a tool. apis.ts now contains ONLY
tool backends — nothing else references it.

## COMMANDS (nested menus since v12.34.0 — flash cards + bubble buttons)
- Help is generated from single arrays (USER_CARD / ADMIN_CARD in admin.ts).
  When adding/removing a command, update its handler AND the card array.
- Since v12.34.0 the cards are CardItem objects ({cmd, desc, btn, usage?,
  example?, run?}) and !help / !admin are ONE message that morphs in place:
  main menu (category buttons) → category flash card (button per command) →
  detail page (usage + example) with ▶ Run / ⬅ Back / 🏠 Main Menu.
  User Run = executes via handleUserCommand with inPlace → result morphs INTO
  the menu message (command's own buttons + nav rows merged, zero extra msgs);
  admin Run = agent:/adm: actions edit in place. Callback scheme:
  help:m · help:c:<g> · help:d:<g>:<i> · help:r:<g>:<i> (run, in commands.ts)
  and adm:menu · adm:c/d/r equivalents. Agent panel = the AGENT realm page
  (adm:c:1); legacy agent:menu / adm:users_cat callbacks redirect there.
- Input commands (v12.35.0): CardItem.ask + the hcmd asks map set an
  await_input state ({step, cmd, userId}, 10-min TTL) — the user's next plain
  message becomes the command's argument (consumed at the top of handleAuth in
  auth.ts). "cancel" cancels; !/​/ messages drop the wait and run normally;
  help-menu navigation clears a pending wait. Saving commands (edit*, remember,
  forget, feedback — CONFIRM_PROMPTS in auth.ts) confirm first: value parks in
  confirm_input state, ✅/✏️/❌ buttons (ci:* in commands.ts) or typed yes/no;
  typing a different value re-confirms it. !search runs without confirm.
- User commands (advertised): !mydetails (edit buttons) · !settings ·
  !logout · !remember/!memories/!forget · !search · !status (anatomy-only,
  NO provider/key names — privacy rule) · !myusage · !support · !feedback ·
  !forgotpin · !deleteme (verified full wipe). Typed !editname etc. still
  work but aren't advertised.
- Admin realms: !admin = PEOPLE (users/approve/deny/block/msg/broadcast…),
  !agent = SYSTEM (status/quota/test/models/errors/kv/uptime/report/clear…).
  Removed: !ping, !brains, !stats, !storage, !agent users + all aliases.
- Native / menu: /help /settings /status /support alias to ! commands
  (registered via /admin/set-menu?key=<ADMIN_PASSWORD>, re-run after
  changing the menu).
- !admin has NO fallback password since v12.32.0 — fails closed if the
  ADMIN_PASSWORD secret is unset.
- Shared single implementations: sendForgotPinRequest / sendSupportPrompt
  (commands.ts), startRecoverFlow (auth.ts), approveUser/denyUser/blockUser
  (admin.ts) — used by typed commands, buttons, AND the index.ts pre-auth
  intercept. Never inline-copy these flows.

---

## ENGINEERING PRINCIPLES (non-negotiable)

1. **Small edits, one at a time** — beats big-bang attempts that hit 32k output limits
2. **tsc must pass BEFORE deploy** — always `npx tsc --noEmit`
3. **Push to GitHub after every successful deploy** — never wait until "end"
4. **Verify reality before designing on top of it** — read existing code, don't assume
5. **Diagnose before fix** — find root cause, no guessing
6. **Don't add features when bugs are unresolved**
7. **Test in browser, not by asking Claude Code** — saves tokens
8. **Maintenance mode ON before risky deploys** — protect real users
9. **Skip when token-constrained** — ship what's working
10. **Refactor working code is clean, refactor broken code is double-risky**

---

## WORKFLOW

```cmd
cd C:\Users\bizli\bizli-v9     ← always
npx tsc --noEmit                ← check before deploy
npx wrangler deploy             ← CMD only, not PowerShell
git add . && git commit -m "vX.Y.Z: desc" && git push origin main
```

To find versioned downloads (Windows appends numbers):
```cmd
dir "C:\Users\bizli\Downloads\index*.ts" /OD
```

---

## PROJECT TIMELINE

- **Started:** June 25, 2026
- **Today:** June 30, 2026 (Day 6)
- **Target completion:** July 5-7, 2026 (Day 11-13)
- **Days remaining:** ~5-7

---

## PHASE 2 PROGRESS — COMPLETE

### All Phase 2 items deployed:
- ✅ v11.87.0: Gemini separated to Lab-only
- ✅ v11.88.0: Quota tracking + Brains tab populated
- ✅ v11.88.1: UX font fixes (39 size bumps)
- ✅ v11.89.0: Global Health % indicator in topbar
- ✅ v11.90.0: Groq multi-model rotation (16 keys × auto-discovered models)
- ✅ v11.90.1: 4 critical bug fixes (rotation, movie crash, fallback, Hindi classifier)
- ✅ v11.91.0: needsLiveSearch → pure sync heuristic (saves 300-800ms/msg)
- ✅ v11.92.0+v11.93.0: Full auto-model discovery (Groq + Gemini self-healing)
- ✅ v11.94.0: Models tab, Live Feed tab, Maintenance tab in dashboard
- ✅ v11.95.0: Brain pipeline visualization (live active-node highlight)
- ✅ v11.96.0: Skeleton loaders (shimmer placeholders on first data load)
- ✅ v11.97.0: Lab Agent memory vault (importance-scored Supabase, auto-prune 200 rows)
- ✅ v12.0.0: Scalable storage — recent_errors corruption fix; lab_memory age pruning

### Remaining Phase 2 (LOW priority, deferred):
- ⏳ Edit 12: Morphing Orb upgrade (5-layer animated)
- ⏳ Edit 13: Sound effects + animations polish

---

## PHASE 3 — AUTO-TESTING (DEPLOYED, partially)

- ✅ v12.1.0: tests.ts — 5-test suite, Gemini scorer, 6h cron gate, quality alert at <60%
- ✅ v12.1.0: Tests tab in dashboard (pass rate gauge, per-test result cards, skeleton loaders)
- ✅ v12.2.0: Lab Agent speed — parallel fetch, 2.0-flash first, 18s timeout
- ✅ Supabase `test_results` table — EXISTS with rows (verified via SQL 2026-07-04); if Tests tab shows no data, debug the tab/endpoint, not the table
- ⏳ Anomaly detection (proactive alerts when quality drops — auto-testing foundation laid)
- ⏳ Cross-session memory + pattern recognition (future)

---

## BIZLI'S KNOWN BUGS — ALL FIXED in v12.30.0 (2026-07-03)

- ✅ Feminine Hindi grammar — regex safety net in PHRASE_REPLACEMENTS ("X-ta hoon"→"X-ti hoon", Roman + Devanagari; safe because "hoon" is strictly first-person)
- ✅ Timezone for non-Indian countries — getWorldTime no longer defaults to IST; geocodes unknown cities (nominatim→timeapi.io) or falls through to the tool which asks; "what time is it" with no location uses the user's saved tz
- ✅ !agent command list — feedback + broadcast test added
- ✅ autoExtractMemory — now Cerebras-first, Groq only as fallback
- ✅ Dead callGemini() — deleted (v12.29.2)
- ✅ 17 dead tool handlers — deleted (v12.29.2)
- ✅ Semantic memory was silently OFF (getEmbedding used wrong key scope) — fixed, uses Lab keys + fallback embed model (768-dim locked for Supabase)
- ✅ !status/!brains/!agent status showed 0 Gemini keys — fixed, now show full 4-provider chain
- ✅ groqExhausted() checked stale model slots — now uses live model list

---

## FUTURE (Phase 4, not scheduled yet)

- **WhatsApp via Meta Cloud API sandbox** — free, 5 whitelisted numbers, ~3 hours
- Voice transcription enhancements
- Group chat support
- Additional language testing

---

## KNOWN TECHNICAL DEBT

1. Cron at 1,000 users sends ~1,000 messages per tick. Rate limit risk.
2. Web search rate-limited 15/hour/user.
3. GitHub `origin/main` diverged from local (local = deployed truth, ~v12.30.0;
   GitHub stuck at old v12.18.0 line). Local commits are safe on disk. Reconcile
   later — do NOT force-push without backing up the remote branch first.
4. ~~Supabase `test_results` table SQL~~ RESOLVED 2026-07-04: table exists, 79 rows. If Tests tab is empty, the bug is in the tab/stats endpoint.

---

## DECISIONS USER HAS MADE (LOCKED IN)

- **Gemini = Lab-only forever** (separated from Bizli's chat; Lab keys also power memory embeddings)
- **MCP rejected** — Bizli's models (Llama/gpt-oss via OpenAI-style function calling) don't speak MCP, and Workers are stateless. BIZLI_TOOLS array IS the on-demand tool mechanism. Do not add MCP.
- **Additive-only in brain.ts** — never rewrite the working callGroq tool-calling loop
- **OpenRouter** = future role: maintenance/cache cleanup analyzer
- **Worker AI** = last resort for basic chat
- **Privacy strict** — no user names/messages in dashboard UI
- **No emojis in dashboard production UI** (Lucide icons only)
- **WhatsApp** = future Phase 4, not now
- **Auto-testing** = real Phase 3, ~3-4 days
- **Memorial significance** — Bizli is named after my deceased pet, project carries emotional weight

---

## USER INTERACTION STYLE

- I prefer **clear, concise English** — no forced Hindi mixing from Claude Code
- I'll say "ok" or "yes" — interpret as "execute the plan"
- I push back when something feels wrong — listen, don't override
- I want **honest pushback** when I'm about to make a mistake
- I value **real engineering discipline** — verify, plan, execute, test, ship, push
- I appreciate **direct answers** over hedging

---

## MAINTENANCE STATUS CHECK

⚠️ **ALWAYS check at session start:** Is maintenance mode ON or OFF?
- If ON: Users locked out, safe deploy zone, take risks
- If OFF: Real users active, be careful with brain.ts changes

---

## STARTING A NEW SESSION — RUN FIRST

```cmd
git status
git log -3 --oneline
type worker\brain.ts | findstr BIZLI_VERSION
curl -s "https://bizli-worker.bizlibix.workers.dev/admin/stats?key=23062024" | head -c 200
```

Verify:
- Working tree clean
- Local = origin/main
- Deployed version matches local
- Lab Agent endpoint responds

---

## ASK USER BEFORE

- Any change to `brain.ts` (Bizli's chat is at stake)
- Any KV schema change (data migration risk)
- Any new external dependency (npm, API)
- Disabling maintenance mode
- Adding new platforms (WhatsApp, Instagram, etc.)
- Multi-language test changes (could affect global users)

## DON'T ASK USER BEFORE

- Running `tsc`
- Reading files
- `git status` / `git log`
- Small UX polish edits (already-approved plans)
- Following an approved plan step-by-step

---

## IDEAS BACKLOG (Abhya's notes — discuss at the right phase)

[Empty — add ideas here as user mentions them]

---

## AUTOMATIC RITUALS

### AT SESSION START — Always do these without being asked:
1. Read CLAUDE.md in full
2. Read CHECKPOINT.md in full
3. Run: git status
4. Run: git log -3 --oneline
5. Find current version: type worker\brain.ts | findstr BIZLI_VERSION
6. Quick health check: curl -s "https://bizli-worker.bizlibix.workers.dev/admin/stats?key=<ADMIN_PASSWORD>" | head -c 100
7. Summarize current state to Abhya in 5 lines or less
8. Then wait for instructions

### AT SESSION END — When Abhya says "stop", "exit", "done", "rest", "goodnight":
1. Update CHECKPOINT.md with:
   - Date of session
   - What we did this session
   - What's pending next session
   - Any decisions made
   - Any new bugs/ideas discovered
2. Update CLAUDE.md ONLY if architecture or phase structure changed
3. Commit: git add . && git commit -m "checkpoint: <2-line summary>"
4. Push: git push origin main
5. Confirm to Abhya: "Saved. You can resume tomorrow."

### WHEN TOKENS HIT 10% OR LOWER — Emergency save:
1. Stop current edit work immediately
2. Save anything in progress to CHECKPOINT.md under section "EMERGENCY SAVE"
3. Commit + push as "emergency checkpoint: <what was in progress>"
4. Tell Abhya: "Token limit approaching. All progress saved. Please /exit and restart later with fresh tokens. We left off at: <state>"

### WHEN ABHYA TELLS YOU AN IDEA — Add it to backlog:
1. Open CLAUDE.md
2. Add the idea under "## IDEAS BACKLOG" section
3. Include: idea description, suggested phase, whether to ask before implementing
4. Confirm: "Idea saved to backlog."

---

End of CLAUDE.md
