# CHECKPOINT — Bizli Project Day-to-Day State

## Last session: 2026-07-04 evening (NESTED MENUS v12.34.0→v12.36.0 + Supabase access)

### Current production state
- Version: **v12.36.0** (deployed + /health verified)
- Maintenance mode: **still ON** (users locked out — Abhya must live-test and
  turn OFF: CONTROL realm → 🛠️ Maintenance → ✅ OFF, or type !maintenance off)
- Git: 6 new local commits this session (879b63e docs, b14ed2d v12.34.0,
  a5ced42 v12.34.1, fed1d7e v12.35.0, a363064 v12.36.0, + this checkpoint).
  GitHub still diverged/untouched (standing decision — back up remote first).

### What we shipped (v12.33.0 → v12.36.0)
- **v12.34.0 — NESTED FLASH-CARD MENUS:** !help and !admin are ONE message
  that morphs in place. USER_CARD/ADMIN_CARD items became objects
  {cmd,desc,btn,usage?,example?,run?,ask?} — still the single source of truth,
  all pages/buttons generated. /help → 4 category bubbles → category card
  (button per command) → detail page (usage+example) with ▶ Run / ⬅ Back /
  🏠 Main Menu. !admin <pw> → ONE message, 3 realm buttons (PEOPLE/AGENT/
  CONTROL) + Live Activity + Stats; the old agent panel IS the AGENT realm
  page now (AGENT_PANEL/BACK_TO_MENU/ADMIN_MENU keyboards deleted, generated
  instead — can't drift). Callback scheme: help:m/c/d/r + adm:menu/c/d/r;
  legacy agent:menu, adm:users_cat/comm_cat redirect gracefully; stale
  index-based buttons degrade to main menu. NEW: /admin <pw> slash alias
  (NOT in the public / menu). Maintenance detail page = confirm step with
  ON/OFF buttons.
- **v12.34.1 — RUN MORPHS IN PLACE:** handleUserCommand gained inPlace param +
  reply() helper — ▶ Run results render INSIDE the menu message (command's own
  buttons merged with nav rows, zero extra messages). Settings greet-toggle
  refreshes its card in place (buildSettingsCard shared builder); !deleteme
  confirm/cancel edit in place. Typed commands unchanged (send fresh msgs).
- **v12.35.0 — JUST TYPE THE VALUE + CONFIRM:** ✏️ edit buttons (mydetails)
  and ✍️ menu buttons ask conversationally ("what should I call you? 👇");
  the next plain message becomes the argument (await_input state, consumed at
  top of handleAuth in auth.ts; "cancel" cancels, !/ / drops the wait, 10-min
  TTL, menu navigation clears pending waits). Saving commands (edit*, remember,
  forget, feedback — CONFIRM_PROMPTS in auth.ts) confirm first: "set your name
  to \"Papa\"?" with ✅ Save / ✏️ Retype / ❌ Cancel (ci:* callbacks) or typed
  yes/no; typing a different value re-confirms it. !search runs instantly.
  Root cause fixed: user typed "Papa" after an edit hint and the brain ate it.
- **v12.36.0 — SESSION FRESHNESS (soft, ChatGPT-style):** history_ KV now
  {ts,msgs}; after >4h away-gap getKVHistory KEEPS old messages but appends a
  system note ("this was ~Xh ago — greet fresh, don't continue old topics
  unless the user does"). Note never persisted (appendKVHistory reads raw).
  One gate = all platforms. 4h kept deliberately (2h would misfire on normal
  Telegram reply gaps); dial = SESSION_GAP_MS in memory.ts. NOTE: Telegram
  Bot API cannot see online/offline presence — last-message time is the only
  away signal.
- **Supabase access for Claude Code:** personal access token + project ref
  (bpkfvhcluovzcyozchwj) in gitignored .dev.vars; SQL via Management API
  (POST /v1/projects/<ref>/database/query). Findings: `test_results` table
  ALREADY EXISTS with 79 rows (stale "SQL pending" blocker closed — if Tests
  tab is empty, debug the tab/endpoint); `memories` = 3 rows, 0 embeddings
  (inconclusive — no traffic since the v12.30.0 fix; re-check after
  maintenance OFF: `select count(*) from memories where embedding is not null`).

### Abhya's live checks pending (Telegram, before maintenance OFF)
1. /help → category → command detail → ▶ Run (result morphs in-card) → Back →
   Main Menu; 💾 Remember → ✍️ Type it here → type value → confirm ✅
2. My Details → Run → ✏️ Name → type "X" → "set your name to X?" → ✅ saves;
   "no" re-asks; "cancel" aborts; typed !editname still works
3. ⚙️ Settings → greet toggle refreshes in place; ❌ Delete Me → "No" morphs
   to stay-message (DON'T tap Yes on the real account)
4. /admin <pw> → realm menu; PEOPLE → List Users in place; AGENT → Brain Map/
   Quota/Test in place with Back/Home; CONTROL → Vault, Maintenance ON/OFF
5. Typed !agent status / !status / !help unchanged; old buttons in old
   messages degrade to main menu gracefully
6. Next morning: Bizli should greet fresh (not continue tonight's topic) but
   still know facts — session-freshness check

### Other pending
1. Maintenance OFF decision after live checks (then watch quota — brain-first
   means every message hits the LLM).
2. Embeddings re-check in Supabase after real traffic (I can run the SQL now).
3. GitHub reconcile (standing): back up remote main, then push local as truth.
4. Disk space: C: still tight (~1GB freed from npm cache; Downloads 3.9GB).
5. SESSION_GAP_MS tuning if real usage shows 4h is wrong (one-number change).
6. Automation ideas backlog unchanged (watchdog, daily digest, canary cron…).

---

## Previous session: 2026-07-04 (BRAIN-FIRST executed + command rearrangement + dashboard 4-chain)

### Current production state
- Version: **v12.33.0** (deployed + verified: /health, /admin/stats, dashboard markup)
- Maintenance mode: **ON** throughout the session (users locked out — Abhya must
  verify live and turn OFF when satisfied: `!maintenance off`)
- Git: 3 new local commits (25f9463 v12.31.0, ba64644 v12.32.0, ba44d03 v12.33.0).
  GitHub still diverged/untouched (see Other pending).

### What we did (v12.30.0 → v12.33.0)
- **v12.31.0 — BRAIN-FIRST (the paused plan, executed):** detectIntent gutted to
  image-gen flow only (classifyNewsIntent + ~28 regex branches deleted); 2 new
  tools get_crypto_price + get_stock_price (→12 total); CRITICAL_RULES forces all
  prices through tools; PROACTIVE Groq quota mgmt (per key+model counters
  {m,mT,mStart,d,dStart} in groq_status KV, soft limits 25rpm/5500tpm/900rpd,
  skip-before-429, zero new KV writes); waste cleanup: 26 orphaned apis.ts fns +
  sendRichResponse + getYouTubeLink deleted (+67/−774 lines).
- **v12.32.0 — COMMAND REARRANGEMENT (discussed & approved this session):**
  flash-card help generated from USER_CARD/ADMIN_CARD arrays in admin.ts (can't
  drift); NEW: !settings (tz+greetings toggles), !deleteme (ownership-verified
  full Supabase+KV wipe), !agent quota (live counters), !agent test (brain
  canary: latency+provider); REMOVED: !ping, !brains, !stats, !storage,
  !agent users + aliases (active/memory usage/logs), hardcoded admin fallback
  password ("06062024" — now fails closed); user !status is anatomy-only
  (privacy rule: NO provider/key names to users, ever); !mydetails edit buttons;
  dedup: sendForgotPinRequest/sendSupportPrompt/startRecoverFlow +
  approveUser/denyUser/blockUser shared by typed cmds, buttons, and index.ts
  intercept; native / menu (/help /settings /status /support) registered via
  new /admin/set-menu route (setMyCommands returned ok:true).
- **v12.33.0 — DASHBOARD 4-PROVIDER CHAIN:** Cerebras card in Brains tab +
  pipeline node (GROQ→CEREBRAS→OPENROUTER→WORKER AI); OpenRouter card now shows
  live :free pool (stale hardcoded model gone); Models tab gained Cerebras +
  OpenRouter groups; wired d.cerebras + d.openrouter.liveModels (existed since
  v12.30.0, unused). Dashboard template JS syntax-checked via node --check.
- CLAUDE.md fully synced (12 tools, router gone, command realms, file sizes,
  stale "empty tabs" note fixed).
- Session incident: C: drive hit 0 bytes free mid-deploy — cleared npm cache
  (~1GB freed). Downloads folder (3.9GB) untouched. Disk is still tight!

### Abhya's live checks pending (Telegram, before maintenance OFF)
1. "what is the capital of France" → short brain answer (no 📰/🔍 dump)
2. "bitcoin price" / "Apple stock price" → tool-driven live prices
3. !help → flash card · !mydetails → edit buttons · !settings → toggles
4. !status → anatomy-only (no Groq/key names) · !ping/!brains → brain replies
5. !admin <pw> → admin card · !agent quota · !agent test
6. Telegram "/" button shows the 4-command menu
7. Dashboard in browser: Brains tab 5 cards (Cerebras between Groq/OpenRouter),
   orb pipeline 4 nodes, Models tab shows Cerebras + OpenRouter pools
8. !deleteme — test ONLY with a throwaway account

### Other pending
1. GitHub reconcile (deferred): back up remote main, then push local as truth.
   Local = 11 commits ahead on separate history. Do NOT force-push blind.
2. ~~Supabase `test_results` SQL~~ RESOLVED 2026-07-04: table already exists
   with 79 rows (verified via Management API). If Tests tab is still empty,
   debug the tab/stats endpoint instead.
3. Verify semantic memory embeddings: as of 2026-07-04, `memories` has 3 rows,
   0 with embeddings — but maintenance ON = no traffic since the v12.30.0 fix,
   so inconclusive. Re-check after maintenance OFF + some real chats:
   `select count(*) from memories where embedding is not null`.
4. NEW 2026-07-04: Claude Code now has Supabase SQL access — personal access
   token + project ref in gitignored `.dev.vars` (see CLAUDE.md SECRETS).
5. Disk space: C: was at 0 bytes; ~1GB freed. Abhya should clear Downloads etc.
6. Automation ideas discussed (not built): watchdog + daily admin digest,
   post-probe canary cron (foundation now exists: !agent test), auto-degrade
   mode, memory hygiene cron.

---

## Previous session: 2026-07-03 (no-maintainer longevity: self-healing brains + fix-everything sweep)

### Current production state
- Version: **v12.30.0** (deployed + verified via /health and /admin/stats)
- Git: **REPAIRED** — corrupted refs/heads/main fixed (was 41 bytes of spaces; restored to recovered dangling commit v12.22.0). All session work committed LOCALLY. GitHub deliberately untouched (origin/main diverged at v12.18.0 line, ~51 commits of separate history — do NOT force-push without backing up remote first).

### What we did (v12.28.0 → v12.30.0)
- **v12.29.0** — Self-healing brain chain: Cerebras added as fallback #1 (5 keys, CEREBRAS_API_KEY_1..5, all added to CF secrets + verified live); OpenRouter upgraded to auto-fetched `:free` pool with key rotation; `probeAllProviders()` re-probes ALL providers on 12h cron. Chain: Groq → Cerebras → OpenRouter pool → Worker AI.
- **v12.29.1** — Cerebras model IDs corrected to real account catalog: gemma-4-31b (direct-answer, leads), gpt-oss-120b + zai-glm-4.7 (reasoning models, secondary, max_tokens 800).
- **v12.29.2** — Dead-code cleanup: 379 lines removed (17 unreachable executeTool cases, 5 unused apis.ts fns, 5 unused search.ts fns, dead callGemini + imageTopicForTool in brain.ts). Kept everything the commands.ts keyword router still uses.
- **v12.30.0** — Fix-everything sweep:
  - Semantic memory ON (getEmbedding → "lab" keys + gemini-embedding-001 fallback @768-dim)
  - !status/!brains/!agent status show real 4-provider chain (were showing 0 Gemini)
  - groqExhausted() now checks live model slots (was checking stale static slots)
  - Timezone: getWorldTime never defaults to IST; geocodes unknown cities; no-location "what time" uses user's saved tz
  - autoExtractMemory → Cerebras-first (Groq quota freed)
  - Hindi feminine grammar regex net (X-ta hoon→X-ti hoon, Roman + Devanagari)
  - !agent help list completed; !agent models/refresh models cover all 4 providers
  - /admin/stats: + cerebras/openrouter fields
  - Weather + currency tools now dual-source (open-meteo, open.er-api.com fallbacks — endpoints curl-verified)
  - CLAUDE.md fully synced to reality

### ✅ EXECUTED 2026-07-04 as v12.31.0 — plan below kept for reference only
### ⏸️ PAUSED MID-BUILD (2026-07-03) — "brain-first" build STARTED then stopped by Abhya ("we will do it later")
**State:** Production = v12.30.0, safe, untouched. Only 2 inert local edits made (committed as WIP):
1. `apis.ts` — `getStockPrice()` restored (Yahoo Finance, tool backend)
2. `tools.ts` — import line now includes `getCrypto, getStockPrice` (nothing calls them yet — tsc clean)

**RESUME PLAN (approved by Abhya, execute when he says go):**
1. **Add 2 tools to BIZLI_TOOLS** (→ 12 total): `get_crypto_price` (backend getCrypto, exists) + `get_stock_price` (backend restored). Add both executeTool cases.
2. **Fix CRITICAL_RULES TOOLS paragraph** (brain.ts): crypto/stock prices must come from TOOLS, never training data (current text wrongly says answer prices from training). Say "12 tools".
3. **Gut detectIntent()** (commands.ts) to ONLY the image-generation flow (rate limit + style picker). Delete: classifyNewsIntent + all regex branches (weather/time/currency/crypto/jokes/quotes/dictionary/country/catfact/dog/nasa/iss/spacex/recipe/cocktail/pokemon/trivia/numberfact/news/movies/tv/trending/shopping/riddle/sciencefact/math/qr/translate/URL-summary/searchKw). Make news_yes/news_no callbacks reply gracefully ("just ask me for news anytime") without getNews.
4. **Proactive quota management (Groq)** — piggyback on existing groq_status KV write (NO new KV keys; free-tier KV write limits matter): extend GroqStatus with per `${keyIdx}_${slot}` counters {m: reqs this minute, mT: tokens this minute (from data.usage.total_tokens), mStart, d: reqs today, dStart}. In callGroq model loop, SKIP combos over soft limits (~25 req/min, ~5500 tokens/min, ~900 req/day) — treat as cooling so rotation flows to next key/model silently. Keep existing reactive 429 handling. Users never see degradation ("without making user feel bizli sucks"). Cerebras/OpenRouter stay reactive (fallback-only, low volume).
5. **Waste cleanup after gutting** (grep-verify each): apis.ts delete getWorldTime, getNews, getJoke, getDadJoke, getQuote, getAdvice, getAffirmation, getDictionary, getCountry, getCatFact, getDogImage, getNASA, getISS, getSpaceX, getNumberFact, getRecipe, getCocktail, getPokemon, getTrivia, getTrending, searchAmazon, getScienceFact, getRiddle, getQRCode, solveMath, translateText; telegram.ts delete sendRichResponse; utils.ts delete getYouTubeLink. KEEP: generateImage (auth.ts uses it), getWeather/getCurrency/getCrypto/getStockPrice/getMovie/getTVShow (tool backends), searchGif.
6. tsc → v12.31.0 → deploy → /health → update CLAUDE.md (12 tools, router gone) → commit locally.

**Verified reference map (greps done):** detectIntent only called from index.ts:330; sendRichResponse only in commands searchKw branch; getYouTubeLink only in commands; generateImage used by auth.ts:53 (KEEP).

### Original direction note (context) — KILL THE KEYWORD ROUTER
**Decision:** Bizli must be brain-first like ChatGPT, for every language — with her Snapchat-AI short/simple voice. The `detectIntent()` keyword layer (commands.ts) is WRONG for a global product:
- It's English-only regex running BEFORE the brain → English users get hijacked into canned API dumps (no persona, no brevity); non-English users skip it and get the proper brain+tools path. Inconsistent by language = not global.
- It answers from pasted regex logic; the model is already trained — tools exist to give it REAL live data on demand, model-invoked.

**Target architecture:**
- ONE pipeline: every chat message → callGroq with BIZLI_TOOLS. Model decides tool use. No regex pre-emption of informational queries.
- Keyword layer shrinks to ONLY non-chat flows: `!commands` (help/status/etc.), image-generation flow (rate limit + style picker UX), auth/registration. Everything else (weather, time, news, jokes, movies, shopping, "what is X", translation, crypto) → the brain, which answers natively or calls a tool.
- Voice: CRITICAL_RULES' short Snapchat style becomes the ONLY voice since nothing bypasses her.
- Consider during build: does BIZLI_TOOLS need get_news added (search_web may suffice)? Groq load increases (every message hits the LLM) — chain now has Cerebras/OpenRouter cushion for that. Preserve trivia state? (minor).

### Other pending
1. GitHub reconcile (user deferred): back up remote main, then push local as truth.
2. Supabase `test_results` table SQL (Tests tab data blocker).
3. User live-checks on Telegram: !status, !brains, !agent status, "time in Reykjavik", "weather in Tokyo".
4. Verify semantic memory: Supabase memories rows should start gaining embeddings.
5. Dashboard tabs could display Cerebras/OpenRouter (stats fields exist now) — cosmetic, optional.

---

## Previous session: 2026-07-02 (monitoring room / dashboard UI polish)

### Current production state
- Version: **v12.28.0** (deployed + verified live via /admin/stats)
- Maintenance mode: **ON** (users locked out — safe deploy zone)
- Dashboard served at **/dashboard** (NOT root "/"; root returns a 15-byte stub)
- Admin stats: /admin/stats?key=<ADMIN_PASSWORD>

### What we did this session (v12.22.0 → v12.28.0)
All work was on the monitoring room (dashboard UI). Deploys were incremental.

- **v12.22.0** — NEURAL INTERFACE box ~32% narrower (grid col1 1.55fr→1.05fr); cat uses object-fit:contain (fits entirely); base font made fluid `clamp(12px,0.92vw,17px)` to auto-scale to desktop width.
- **v12.22.1** — Removed red glow on hologram box (#cat-holo.red neutralized to cyan); added `mix-blend-mode:screen` to #biz-cat-img so the PNG's dark background merges into the panel.
- **v12.23.0** — Cat width 75%→88%; Settings → Display gained TEXT SIZE slider (`--ui-scale` var, 80–130%, persisted) + FONT picker (`--font` var). Body font now `var(--font)`.
- **v12.24.0** — Full-size tab pages (min-height:100vh-ish + flex on non-overview panels). **← this caused breakage.**
- **v12.25.0 / .1** — Added LIVE CODE tab + Overview panel + updateLiveCode stream; centered agent figure; added initial `class="tab-overview"` on #app. **← also part of broken state.**
- **REVERT v12.26.0** — Rolled back v12.24 + v12.25 (full-height tabs, LIVE CODE tab/panel/JS, agent-centering, initial app class). Deleted worker/dashboard/tabs/livecode.ts. Kept the good v12.23.0 state.
- **v12.27.0** — Cat 88%→97%; agent avatar centered in VISION AI section (column-reverse, centered, blended via mix-blend-mode:screen, no border, 170px); +4 fonts (Console, Clean Sans, Modern Sans, Elegant Serif → 8 total); +7 music vibes (15 total).
- **v12.28.0** — Matrix code-rain canvas (#mtx-canvas, `.mtx-wrap`, tag "SYS.STREAM") in the empty area under USER LEADERBOARD inside the BRAIN PIPELINE (drive-section) panel; `initMatrix()` runs on first login.
- **KV (production, --remote)** — Replaced `bizli_robot_image` with new humanoid avatar (glowing-chest, Image #8). Served at /bizli-robot.png (183 KB, verified). Note: content-type is image/png but bytes are JPEG — browsers sniff, renders fine.

### Key dashboard facts (learned this session)
- Dashboard assembled in worker/html.ts → served by handleDashboard() in stats.ts.
- Tab system: switchTab() adds `tab-<name>` to #app; each tab's CSS hides the other panels. Non-overview = single panel, 1-col grid.
- Overview grid is a packed 3×3 (`grid-template-columns:1.05fr 1.15fr 1.2fr`). No free slot.
- Agent (Lab Agent) lives in right panel #lab. Phone (≤800px): already appears as `.lnav-agent` left-nav item → openAgent(). Avatar img #vai-robot-img loads /bizli-robot.png with SVG orb (#lva-orb) fallback on error.
- Images served from KV (BIZLI_MEMORY), NOT repo files: /bizli-cat.png←bizli_cat_image, /bizli-robot.png←bizli_robot_image, /bizli-hologram.png←bizli_hologram_image, /bizli-hologram.mp4←bizli_hologram_video.
- KV namespace id: 7bb9e0759ba640f6ae740af0ed81c8c5 (binding BIZLI_MEMORY). Use `wrangler kv key put --remote --namespace-id=... <key> --path=<file>` for production.
- Cat hologram PNG is 1130×1392 (ratio 0.8118); #cat-wrap aspect-ratio matches, so contain shows the whole image.
- **tsc does NOT check JS inside the DASHBOARD_SCRIPTS template string** — template JS syntax errors won't be caught by `npx tsc --noEmit`. Verify dashboard JS in browser.

### ⚠️ BLOCKER: Git is broken (no commits pushed all session)
- Repo has **no commits** ("No commits yet") and `.git/refs/heads/main` is **corrupt** (41 null bytes).
- `git commit`/`update-ref` fail: "cannot lock ref 'HEAD': reference broken".
- Fix requires deleting the ref file: **user must run `! rm .git/refs/heads/main`** (auto-mode classifier blocks Claude from rm-ing git internals). Then commit + push.
- Also: node_modules was staged in the index; already unstaged once (`git rm -r --cached node_modules`) but re-verify before first commit. .gitignore already lists node_modules.
- **Everything v12.22.0→v12.28.0 exists only locally + on Cloudflare. Nothing on GitHub yet.**

### Pending next session
1. **Fix git + push** all session work (needs the `! rm` above).
2. Awaiting user's browser verification of v12.28.0: new avatar (centered/blended), matrix box, cat at 97%.
3. Possible re-attempt (carefully, one at a time, browser-checked) of the reverted features if still wanted:
   - Full-size tab pages (broke last time — make boxes grow *nicely*, not forced 100vh)
   - LIVE CODE tab/panel
4. Older backlog (pre-existing): Supabase `test_results` table for Tests tab; Phase 4 Bizli bug fixes (Hindi grammar, timezones, dead code cleanup).

### Decisions made (locked)
- Gemini = Lab-only forever · OpenRouter = future maintenance role · WhatsApp = Phase 4
- No emojis in dashboard UI (Lucide icons) · Privacy strict (no user names in UI)
- Dashboard hologram = image-based (KV PNGs) with mix-blend-mode:screen to merge backgrounds

### Bugs / notes discovered
- Full-height-tabs (v12.24) approach broke the room — reverted. Root cause suspected: forcing ~100vh min-height on panels + grid interaction.
- #app had no initial tab class (fixed then reverted with the batch) — a real latent issue if switchTab ever fails.

---

Last updated: 2026-07-02 by Claude Code
