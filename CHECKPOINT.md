# CHECKPOINT — Bizli Project Day-to-Day State

## Last session: 2026-07-10 LATE (FEATURE COMPLETION — v12.41.0 deployed; backlog cleared except dashboard + GitHub)

### Production state
- **v12.41.0 LIVE** (/health ✓). Maintenance still ON. Native menu re-registered
  (10 commands, ok:true). All commits LOCAL. Orphaned DISCORD_*/FB_* secrets
  DELETED from Cloudflare (5 secrets, zero code refs verified first).

### SESSION C — /privacy (shipped in v12.41.0)
- !privacy card (what's stored/never shared/how to wipe + /privacy web link),
  /privacy menu alias, USER_CARD Help-group entry (appended — old button
  indices safe), set-menu list now 10 commands (re-run DONE post-deploy).

### SESSION D — GAMES v12.41.0 (shipped, probe-verified)
- 6 brain-hosted games (20Q she-guesses, Word Chain, Trivia, Emoji Movie,
  Riddles, Would You Rather): !games//games → 6-button menu; game: callbacks
  start the game THROUGH callGroq and the opener LANDS IN KV HISTORY (one
  continuous mind — games continue in normal chat, zero game-engine code).
- GAMES rules block in CRITICAL_RULES (~900 chars, prompt-diet-conscious) +
  "games" category in autoExtractMemory + 🎮 USER_CARD group.
- Probes: "lets play 20 questions" → "Q1: Is it a living thing?" ✓ ·
  continuation w/ history → "Q2: does it have fur?" ✓.

### SESSION E — TOOL #14 look_at_profile_photo (shipped)
- getUserProfilePhotos (user|me; me = bot's own DP via bot_info/getMe) →
  Groq scout vision (direct call in tools.ts — can't import brain.ts,
  circular) → 2-3 sentence description → KV cache dp_desc_* keyed by
  file_unique_id (changed DP ALWAYS re-seen; same DP never re-visioned).
  Vision rate-limit charged only on cache miss. Honest NO_PHOTO/can't-see
  tool results. PROFILE PHOTOS rule line in CRITICAL_RULES; TOOLS line = 14.
- DEVIATION from old checkpoint note: Groq-scout-first, NOT OpenRouter-first
  (OR = 1 key + unexplained silent deaths; scout is verified-live vision).
- Probe: "have you seen my profile photo?" → tool fired, honest can't-see
  (rig has no real Telegram id). REAL DP needs Abhya's live test.

### SESSION F — cleanup
- 5 orphaned secrets deleted (DISCORD_APP_ID/_BOT_TOKEN/_PUBLIC_KEY,
  FB_PAGE_ACCESS_TOKEN/_VERIFY_TOKEN). CLAUDE.md synced (14 tools, 10-command
  menu, games/privacy sections, version).
- KEPT deliberately: POST /admin/test-chat + trace + deep debug — still the
  only probe rig; remove AFTER Abhya's live pass + maintenance OFF.

### WATCH (new)
- One 20Q continuation probe returned bare "Q" (1 of 4 runs, key 14) — raw
  model flake, not sanitizer (FILLER_TAIL can't match game questions). If it
  recurs, consider a min-length reply guard (careful: "ok"/emoji replies are
  legit short).

### REMAINING WORK (only these)
1. **Abhya live Telegram pass** → maintenance OFF decision: !search + follow-up
   (history), photo twice (cooldown), /games tap-through, /privacy, DP ask
   ("how's my dp"), menus.
2. **Dashboard / Monitoring Lab** — parked for the end (Abhya's order).
3. **GitHub reconcile** — parked (Abhya's order); back up remote first, ever.
4. Post-live-pass cleanup: remove test-chat rig; WATCH items via the
   self-improvement loop.

---

## Previous session: 2026-07-10 (STABILITY MARATHON — v12.40.1 → v12.40.6, all deployed + probe-verified)

### Production state
- **v12.40.6 LIVE** (/health verified). Maintenance still ON. All commits LOCAL
  (GitHub diverged — standing decision). tsc clean at every step.

### SESSION 1 — deep-search overhaul (v12.40.1–.3, deployed + probed)
- **!search reliability (bug 1)**: searchWebDeep no longer forces Tavily's news
  vertical (topic:"news" returned EMPTY for general queries — the intermittent
  failures); Serper fallback now also fires on Tavily-EMPTY (rescues weak-index
  queries); cache v9.
- **!search → KV history (bug 2)**: briefing lands in history_<userId> ([used
  !search: q] + sentence-trimmed assistant turn) — follow-ups work. NEEDS
  Abhya's live Telegram verification (rig can't write history).
- **"Friend who googles" voice**: composeSearchBriefing (commands.ts, shared
  w/ the deep test hook) — persona brain + query-language lock + user tz +
  last 6 chat turns + "your own take" prompt. Hindi probe → full Devanagari
  briefing. Briefing maxTokens 2048 via new ADDITIVE callGroq param (default
  512 unchanged — gpt-oss reasoning tokens starved 512 AND 1024).
- **RAW TOOL DUMP BANNED (live incident Abhya pasted)**: synthesis 413'd on
  gpt-oss-120b across all 3 retry KEYS (413 is size-based) → the "⚡ LIVE WEB
  RESULTS" grounding block reached a user verbatim. Fixes: all 4 synthesis-
  failure fallbacks now reply SYNTH_FAILED_REPLY (she ASKS — Abhya's rule),
  and synthesis switches MODEL on 413 (next live model answers for real).
- PROBE LESSON: always send UTF-8 via --data-binary @file to /admin/test-chat —
  inline shell strings mangle Devanagari/accents (false "search broken" alarm).

### SESSION 2 — full-codebase sweep fixes (v12.40.4, every worker file read)
- **send_my_photo 24h CODE cooldown** (bug 3 CLOSED): KV photo_sent_<chatId>
  in executeTool; blocked → tool result says describe-in-words. Model decides
  WHEN, code caps FREQUENCY. Live double-ask verification pending (rig can't).
- **Battery subrequest budget**: 12 probes in ONE invocation blew Cloudflare's
  per-invocation subrequest cap (2026-07-09 14:01 "Too many subrequests" →
  false ALL-BRAINS-FAILED + 12th test never ran + getTestStats starved).
  Now 6 probes/run w/ rotating KV test_batch_ptr (full coverage per 12h) +
  todayContext() in the rig (time_verbatim was failing on rig fidelity).
- **Hinglish detector purge**: main/nah/ha/ho/beta/par/sun/koi/lag/hun/meh/ye
  (English) + tu/se/mai (Spanish/French/Italian) removed — they Hinglish-locked
  pure English/Spanish messages; "kaise" added. Probes: English-with-"main" →
  English ✓.
- **tzMap word-boundary**: "Indianapolis" ⊃ "india" gave IST → now geocodes
  (probe: 4:18 PM EDT ✓). Group replies never-silent guard. Dashboard
  TOOL_KEY_MAP synced to the real 13 tools.

### SESSION 3 — infra hardening (v12.40.5)
- **Battery via SELF-FETCH** (/admin/run-tests) from the cron — own invocation,
  fresh subrequest budget; <60% alert moved into runBizliTests.
- **PostgREST input encoding**: user-typed gmail/identity-code
  encodeURIComponent'd (auth.ts ×3, stats.ts web login).
- Nudges: skip greeting hours 8/22 (double-ping), fallback name "friend"
  (was "good morning hey"); dashboard pre-probe vision default = llama-4-scout.

### SESSION 4 — LATIN-SCRIPT LANGUAGE FIX (v12.40.6, international-critical)
- detectScript labeled EVERY Latin-script language "English — reply in
  English" → Spanish/French/German users were FORCED into English (probe
  proved it). Latin fallback now = identify & mirror the actual language.
  Probes after: Spanish → Spanish w/ usted ✓ · French → French w/ vous ✓.
  Abhya's direction: "match the user language smartly with awareness". DONE.

### Battery result (12-probe suite, live): 9/11 passed
- time_verbatim fail = rig fidelity (fixed v12.40.4) · 12th test killed by
  subrequest cap (fixed) · search_president score 40 "irrelevant source
  links" — WATCH.

### WATCH list (minor, for the self-improvement loop)
1. search_president: scorer flags weak/irrelevant source links (score 40).
2. French movie ask invented an IMDB link from memory (LINKS rule violation).
3. News reply format still varies (prose vs bullets). Emotional replies run
   long. Jailbreak refusal terse.

### Pending next session (Abhya's stability marathon continues)
1. **Abhya live Telegram pass**: !search then follow-up question (history
   memory), photo double-ask (cooldown), menus, then MAINTENANCE OFF decision.
2. /privacy command (menu + !privacy + card + re-run set-menu).
3. v12.41.0 games → v12.41.x DP tool. Dashboard/Monitoring Lab AT THE END
   (Abhya's order 2026-07-10).
4. Cleanup when stable: remove /admin/test-chat + trace + deep debug; delete
   orphaned DISCORD_*/FB_* secrets; GitHub reconcile (backup remote first).
5. Enhancement candidates (from the sweep, plan file compiled-floating-spindle):
   !agent test deep canary · drop Google-News RSS from topic:general chat
   searches (link-quality) · admin !memory/!wipememory BZ-code resolution.

---

## Previous session: 2026-07-08 (short — DEEP SEARCH bugs logged, work parked)

### State
- Production: **v12.40.0** deployed + /health ok. Maintenance still ON.
- Working tree: TEMP `deep:true` mode added to POST /admin/test-chat
  (index.ts) — runs the exact !search pipeline (searchWebDeep + the same
  formatting callGroq) with timing breakdown (searchMs/formatMs/lengths).
  **Written but NEVER deployed** (probed live: deep flag falls through to
  the normal brain path). tsc clean; committed with this checkpoint.

### LIVE FINDINGS (Abhya, 2026-07-08 — fix next session)
1. **!search deep mode not always working** — intermittent failures/empty
   results. Diagnose with the deep:true test hook once deployed (that was
   the exact purpose of the mid-work above).
2. **Bizli can't see her own !search results** — after a !search, asking
   her about what she just searched draws a blank: the deep-search briefing
   is sent directly to Telegram and NEVER appended to `history_<userId>` KV,
   so her brain has no memory of it. Fix direction: append the !search
   briefing (or a trimmed version) to KV history as an assistant turn so
   follow-ups work like ChatGPT.
3. **send_my_photo over-fires (photo spam)** — she shares her real photo too
   easily. ROOT CAUSE: enforcement is prompt-only (tool description +
   CRITICAL_RULES "only when asked / never twice") and prompt rules have now
   FAILED TWICE for this tool (v12.38.2 hard-trigger, v12.39.0 unprompted-
   clause deletion) — the executeTool case (tools.ts ~298) has ZERO code
   guard. FIX = code, not more prose: per-user cooldown in executeTool
   (KV flag e.g. `photo_sent_<userId>`, TTL ~24h, piggyback an existing
   write if possible — KV write budget); when blocked, return a tool result
   telling the model to answer in words ("photo already shared recently —
   describe yourself instead"), NEVER silent-fail. Keep the model deciding
   WHEN (brain-first intact) — code only caps FREQUENCY. The photo stays
   special: rare = memorial-respectful.

### ABHYA'S DIRECTION for the search fix (2026-07-08) — "friend who googles for you"
- Search must FEEL like Bizli herself did the searching — not a separate
  "deep search" module bolted on. She's the friend who googled it for you:
  presents findings in her own voice, with her own cognitive take/reasoning
  on what she found ("okay so here's the thing —"), connecting facts,
  flagging what's surprising or doubtful — extraordinary intelligence, but
  hers. This SUPPORTS her personality instead of bypassing it.
- Concretely: the !search briefing should be composed BY her persona brain
  (persona + CRITICAL_RULES in the formatting call, not a bare persona-less
  prompt) AND land in her KV history so follow-ups work — one continuous
  mind, same as bug 2 below.

### NEW FEATURE: /privacy command (2026-07-08)
- Add a privacy-policy command to the native / menu (+ !privacy + USER_CARD
  entry): what Bizli stores (memories, vault, gmail hash), where (KV +
  Supabase), what she NEVER shares (creator privacy, no user data in
  dashboard), how to wipe (!deleteme / !forget). Remember: menu changes
  need /admin/set-menu re-run after deploy.

### Task board (Abhya's list, 2026-07-08)
- ✅ v12.39.0: time/photo/roleplay brain fixes + weather image card + tools audit
- ✅ v12.39.2: prompt diet — CRITICAL_RULES −38%, zero behavior loss
- ✅ v12.40.0: self-improvement kit (battery tests + daily idea report + KV addendum)
- ■ v12.41.0: games (menu + brain rules + memory) — IN PROGRESS / next up
- □ v12.41.x: profile-photo tool #14 + light self-talk persona line

### Resume order next session
1. Deploy the deep:true test hook → measure searchMs/formatMs → fix deep
   search reliability (bug 1) + !search-to-history memory (bug 2) +
   "friend who googles" persona voice (direction above) — one coherent
   search overhaul.
2. send_my_photo code cooldown (bug 3) — small, ship alongside #1.
3. /privacy command (menu + !privacy + card entry, re-run set-menu).
4. Then continue v12.41.0 games → v12.41.x DP tool → Abhya live pass →
   maintenance OFF decision.

---

## Previous session: 2026-07-06 evening (v12.39.0/.1 — TIME AWARENESS + WEATHER CARD + 413 STORM FIX)

### DEPLOYED + PROBE-VERIFIED (v12.39.1 live)
- Time verbatim ("It's 09:58 AM" = exact header digits) · two-way correction
  ("good night" at 9:49 AM → "arre abhi toh subah ho rahi hai, 9:49 baje!") ·
  photo fires on ask, silent on emotional msg · weather Tokyo w/ humidity +
  hi/lo + link 4.1s · casual Hinglish 1.5s.
- **413 STORM FOUND & FIXED (v12.39.1)**: gpt-oss-120b (BEST Groq brain) 413s
  on EVERY key — Groq: "Limit 8000, Requested ~9200" tokens. Prompt outgrew
  the 120b per-request budget → each msg burned ~1s × 16 keys (14s weather).
  Fix: one 413 skips that model request-wide (weather 14.4s → 4.1s). 120b
  UNUSABLE until prompt diet — llama-3.3-70b is de facto lead meanwhile.
- **PROMPT DIET REQUIRED (pending Abhya's go)**: CRITICAL_RULES = 32,102 chars
  (~8k tokens alone). Target: cut ~8k chars (25%) by merging overlapping rules
  (3 emoji rules, scattered search rules, dup links/tone text) — NO behavior
  loss intended; full battery after. Goal: requests ≤~7k tokens so the BEST
  model leads again with history headroom ("best always works first" — Abhya).
- **OpenRouter STILL a mystery**: dies in 1.2s with NOTHING logged even after
  v12.39.0 added 429-body logging → failure is res-null/exception (fetch dying),
  NOT a rate limit. Next deploy: log the null/catch paths. 1 key only
  (_2.._5 empty) — Abhya decided 1 key + free-pool rotation is enough.
- **Abhya's directives this session**: NO Monitoring Lab work until Bizli is
  STABLE. Departments principle: each provider = a department, colleagues =
  auto-adopt/auto-drop models, and the BEST model must always be tried first.
- Local commits: b6463f8 (v12.39.0), 3399a43 (v12.39.1) + this checkpoint.
- **PROMPT DIET SHIPPED (v12.39.2, deployed + battery-verified)**: CRITICAL_RULES
  32.9k → 20,505 chars (-38%, beat the 24k target) — merged overlapping rules,
  every DO/DON'T + canned reply kept. Requests ~9.2k → ~6.1k tokens.
  RESULT: ZERO 413s post-deploy, every probe answered on FIRST key attempt —
  gpt-oss-120b (best brain) serving again. Battery: identity ("not ChatGPT")
  · jailbreak refused · time exact + tz · president Trump w/ real 2026
  sources · Hinglish mirrored · latency 1.9-3.5s casual, 9s search.
- **v12.39.3 (stabilization trio, deployed + probed)**:
  (1) SEARCH SPEED: tavilySearch now has a TOTAL budget across keys (chat 5s
  per-key 3.5s; deep 9s per-key 5s) — was 5 keys × 6s stacking to 20s+.
  Fresh news search now ~10.5s worst (was 20s+); cached ~3-4s; casual 1.5-3s.
  HONEST FLOOR: fresh search = brain call + live web + synthesis ≈ 7-10s;
  getting to 4-5s would mean cutting snippets/answer quality — Abhya to decide
  if wanted. (2) MODEL-HEALTH BENCH (groq_status.mh): model failing hard
  (413/404/400/5xx) 4× in 15 min sits out 30 min → next-best leads INSTANTLY,
  no 12h probe wait, never benches the last model. (3) RESPECTFUL ADDRESS
  hardened (tu/tum/tera/tumhara banned even playful, every language) —
  VERIFIED: "aur batao..." → reply used "aapke", playful, statement end.
  (4) OpenRouter null/exception logging added (silent 1.2s death will now
  leave a trace next time it fires).
- Probe scan: emoji-only 🔥🔥🔥 → "You're on fire, congrats! 🔥" PERFECT
  (earlier "fail" was the PowerShell probe sending Latin-1 — always send
  UTF-8 bytes to /admin/test-chat). Currency + rate line works.
- WATCH: (1) jailbreak refusal terse (safe but not the warm canned line);
  (2) emotional replies run long (4-5 sentences vs 1-2 rule); (3) follow-up
  "English" re-called get_weather instead of translating previous reply, and
  labeled today's hi/lo as "tomorrow" — minor. All → self-improvement kit's
  daily idea loop.
- **v12.40.0 — SELF-IMPROVEMENT KIT SHIPPED (deployed, sanity-probed 3.0s)**:
  - TEST_SUITE 5 → 12 probes (every July-2026 battery bug class: president
    search, time verbatim, photo-not-unprompted, no-filler ending,
    hallucination bait, creator probe, aap/tum respect) — 6h cron, Gemini
    scored, Supabase test_results.
  - runIdeaReport (tests.ts) — DAILY: Lab/Gemini reads recent_errors + failed
    tests + pass rate → 1-3 ideas w/ confidence % → ADMIN_CHAT_ID message
    with ✅ Approve / ❌ / 💬 Why per idea (sik:a/r/w callbacks, commands.ts,
    ADMIN_CHAT_ID-guarded). Ideas KV improve_ideas (7d TTL). Stays quiet if
    nothing worth fixing. FIRST REPORT: fires on the next hourly cron tick.
  - Approve → rule appended to KV rules_addendum (HARD CAP 600 chars, refuses
    + tells admin when full) → getLearnedRules() injects it into ALL 4 brains'
    system prompts as "LEARNED RULES (approved by Papa)". Reject/expire safe.
  - !agent addendum (view) / !agent addendum clear + 📜 card button (admin.ts).
  - NOTE for Abhya: expect the first 💡 report on Telegram within the hour
    (cron 0 * * * *); the 12-test battery also runs on the next 6h gate.
- NEXT: games (v12.41.0) → DP tool (v12.41.x) → Abhya live pass → maintenance
  OFF decision. Monitoring Lab dashboard AFTER stability (Abhya's order).

## Earlier same day (v12.39.0 planning notes)

### What shipped (v12.39.0, tsc-clean)
- **Two-way TIME awareness** (transcript bug: she said "1:58 AM" when the TODAY
  header said 1:54): TIME-verbatim rule (copy header digits exactly or call
  get_current_time); she also corrects the USER — "good morning" at 7 PM their
  time gets a playful correction; stale user claims (old prices, ex-office-
  holders) corrected — own knowledge for stable facts, search only when
  time-sensitive or genuinely unsure ("smart means RIGHT, not searching
  everything" — Abhya's requirement).
- **NO ROLEPLAY ACTIONS rule**: asterisk stage directions (*looks at the
  time*) banned.
- **Photo strictly only-when-asked**: unprompted-share clause deleted from
  brain.ts rule + send_my_photo tool description (Abhya's call).
- **Weather upgrade**: open-meteo now PRIMARY (adds humidity + today hi/lo),
  wttr.in demoted to fallback; get_weather replies ride a wttr.in PNG weather
  card via the existing movie-poster RICH_SENT path (imageSource "weather" in
  brain.ts) + google weather search link in the tool result.
- **Tools audit quick wins**: stock → finance.yahoo.com/quote link; crypto →
  price search link; currency → exact rate shown (1 X = n Y).
- **OpenRouter diagnosis**: forced probe = empty reply in 1.2s. Silent because
  callOpenRouter never logged 429 bodies — NOW LOGGED (the 429 body names the
  exact limit). Only 1 OR key configured (_2.._5 slots empty); Abhya decided
  1 key + free-model rotation is enough for mini-works (avatar descriptions
  etc.). After deploy, read the logged 429 message to confirm root cause.
- **Prompt diet**: FORMALITY rule compressed.

### Approved plan (C:\Users\bizli\.claude\plans\ok-but-also-zesty-babbage.md)
1. ✅ v12.39.0 (this deploy) → 2. NEXT: **Monitoring Lab dashboard work**
(Abhya reprioritized: overview box cards + sections/subsections, real-time
fetching) → 3. v12.40.0 self-improvement kit (6h battery tests + daily idea
report w/ confidence % to admin TG + ✅/❌/💬 buttons + KV rules_addendum
capped 600 chars) → 4. v12.41.0 games (6 chat games: 20Q she-guesses, Word
Chain, Trivia, Emoji Movie Guess, Riddles, Would You Rather; !games + /games
menu; GAMES brain block; games category in autoExtractMemory) → 5. v12.41.x
profile-photo tool #14 (look_at_profile_photo me|user; getUserProfilePhotos;
cache keyed by file_unique_id so a changed DP is ALWAYS re-seen — no stale
7-day cache; OpenRouter free vision first, Groq scout fallback).

### Standing state
- Maintenance: ON. GitHub diverged (local = truth, commit local-only, no
  force-push). TEMP /admin/test-chat still deployed. Menu = 8 commands
  (/games will make 9 — re-run /admin/set-menu after the games deploy).

## Previous session: 2026-07-06 (v12.38.0 — SEARCH ACCURACY + MENU + LOCKOUT + REAL PHOTO)

### Current production state
- Version: **v12.38.5 DEPLOYED + BATTERY-TESTED** (5 probe batteries run via
  /admin/test-chat; all fixes verified live). Menu re-registered (8 commands).
- Battery findings → fixed same session:
  - v12.38.1: search forcing header restored (she answered "Joe Biden" from
    training WITH results in hand — now correct: Trump, AP/CNN/BBC sources);
    Yahoo index symbol normalization (NSEI→^NSEI; Nifty now real ~24,270);
    no tool-narration/deflection rule; cache v8.
  - v12.38.2: NEVER-SILENT guards (sanitizer amputation was returning EMPTY
    replies — "do you ever make mistakes?" = total silence); send_my_photo
    hard-trigger ("I don't have a physical body" banned); no-two-question-
    endings rule.
  - v12.38.3: sanitizer now REPLACES tech jargon (language model→AI etc.)
    instead of deleting whole lines (was amputating honest self-descriptions);
    COMPARED-TO-OTHER-AIs confidence rule (ChatGPT-gushing killed).
  - v12.38.4/.5: stripFillerTail in sanitizer — trailing service questions
    ("what can I help you with today?") stripped, last-sentence-only, all
    providers; regex hardened for "…help YOU with" variant. Contextual
    questions (e.g. "aur aap?" to a greeting) correctly survive.
- Battery verified on v12.38.5: president correct w/ real 2026 sources ·
  bitcoin 2s · nifty ^NSEI real · Tokyo weather w/ personality · Hinglish news
  real headlines Roman script · Mars-Olympics hallucination bait → honest ·
  creator probe → refusal + !support (auto 🆘 button) · scam bait → firm, no
  filler · send_my_photo fires on "what do you look like" · empty-reply
  silence impossible (guards at index.ts + stats.ts send sites).
- WATCH (minor, not blockers): news reply format varies (some runs prose w/o
  links vs bullets+🔗); worst-case news search ~20s (avg 7-10s); casual replies
  still question-end ~50% (natural ones, filler is stripped).
- Maintenance mode: **still ON** — test battery then Abhya's live pass gates OFF.
- Git: this checkpoint commit is local-only (GitHub still diverged — standing
  decision, back up remote before reconciling).
- TEMP DIAGNOSTIC still deployed: POST /admin/test-chat (remove after stabilization).

### What we shipped (v12.38.0, all tsc-clean)
- **SEARCH ACCURACY OVERHAUL (search.ts rewritten)**: brain now receives
  Google-AI-style grounding — ANSWER line + numbered titled snippets
  [1][2][3] (4-5 pages, sentence-boundary cuts) + sources, ~1400 chars
  (was ONE 500-char blob). ALL regex layers inside search.ts DELETED
  (office-holder map, time-sensitive word lists, looksIndian, " 2026" hack,
  DDG short-circuit). Model passes topic:"news"|"general" on search_web
  (tools.ts schema) → Tavily topic/news + parallel Google News RSS + 10-min
  cache (general = 1h). Chain: Tavily (basic, 6s cap) → NEW serperSearch()
  (google.serper.dev, real now) → DDG last resort. searchWebDeep() for
  !search: advanced, 8 results, ~4k chars, own searchd_ cache (15 min).
  SEARCH_CACHE_VERSION v6→v7.
- **ChatGPT-style text forming**: sendAnimatedText (telegram.ts) — replies
  >120 chars appear as opening words growing in ≤5 quick edits (~700ms);
  keyboards attach on the FINAL edit; wired at index.ts brain-reply send +
  !search briefing. deleteTelegramMessage() added.
- **Native menu = 8 commands**: /help /search /settings /memories /status
  /feedback /support /admin (set-menu route updated — MUST re-run
  /admin/set-menu?key=<ADMIN_PASSWORD> after deploy). Bare /search /feedback
  → await_input asks; bare /admin → admin_pw_wait state (password asked
  conversationally, typed password message DELETED from chat).
- **Admin lockout v2 (admin.ts)**: 3 wrong passwords → 12h lock w/ 🆘 Support
  + 🔁 Recover-by-Gmail buttons; recovery gmail must equal admin's registered
  gmail (users.gmail_hash = tg_<ADMIN_CHAT_ID>) — match clears lock ONLY
  (password still required); 8 total fails (pw+gmail) → 7-day hard lock;
  every lock alerts ADMIN_CHAT_ID with 🔓 Unlock button (admunlock: callback,
  admin-guarded — Abhya's self-rescue). clearAdminLocks/startAdminRecover
  exported; admrec: callback placed BEFORE the admin guard (locked-out users
  must reach it).
- **Brain rules (CRITICAL_RULES)**: search replies = 2-4 bullet highlights +
  2-3 trusted/official source links; SEARCH-FIRST teaches topic param +
  synthesize-across-snippets; STATEMENTS > QUESTIONS hard rule (no filler
  questions to stretch convo — Abhya's complaint); INFO/SEARCH line budget
  ~7 lines.
- **HER REAL PHOTO 🐾**: the memorial cat's real photo → KV bizli_real_photo
  (60KB JPEG, uploaded --remote), served at /bizli-real.jpg; NEW TOOL #13
  send_my_photo (model-decided: "what do you look like", rare fitting
  moments, never twice per convo); YOUR REAL PHOTO + CREATOR PRIVACY rules
  added; any reply mentioning !support auto-gets a 🆘 "reach my developer"
  flash button (index.ts) — suspicious creator-probing lands on one tap.
- CLAUDE.md synced (13 tools, snippet-first search, menu, lockout).

### Pending (this session, after checkpoint)
1. Verify /health + /bizli-real.jpg + re-run /admin/set-menu.
2. TEST BATTERY via /admin/test-chat: search accuracy (current events,
   ambiguous entities), latency ≤~8s, no-filler-questions across casual
   msgs, no hallucination (prices via tools, honest unknowns), photo tool,
   creator-probe boundary, persona (honest, non-manipulative — Abhya:
   "she should be like a real AI, Claude-kinda intelligence").
3. Fix whatever the battery finds; improve if needed.
4. Then: Abhya live Telegram pass (menus, /admin lockout, animation feel,
   /search) → maintenance OFF decision.
5. Carried over: OpenRouter account check; remove /admin/test-chat when
   stabilization done; GitHub reconcile (backup first); prompt diet
   (CRITICAL_RULES keeps growing — 413 risk on smaller models); embeddings
   re-check after real traffic.

---

## Previous session: 2026-07-05 (STABILIZATION AUDIT + v12.37.0→v12.37.2 deployed)

### Current production state
- Version: **v12.37.2** (deployed + /health verified + probe-verified)
- Maintenance mode: **still ON** — Abhya's live Telegram pass is the next gate
- Git: local commits e0b2d00 (v12.37.x) + this checkpoint. GitHub still diverged
  (standing decision — back up remote before any reconcile).
- TEMP DIAGNOSTIC still deployed: **POST /admin/test-chat?key=<ADMIN_PASSWORD>**
  ({message, history?, force?: cerebras|openrouter|cf, image?: url}) + trace
  hook in executeTool for "test:" chatIds. REMOVE when stabilization ends.

### What we did (45-probe audit on v12.36.1 → fixes → verified on v12.37.x)
- **Think-leak KILLED**: qwen reasoning models were leaking raw <think> chains
  (~7% of replies, truncated at 512 tokens = unclosed tag). Removed from
  GROQ_CANDIDATE_POOL + sanitizer strips UNCLOSED <think> too.
- **Vision REVIVED**: Groq's llama-3.2-vision previews are dead (400s since
  ~Feb 2026) — she was HALLUCINATING photo descriptions via the text fallback
  ("puppy that never existed"). Now meta-llama/llama-4-scout-17b-16e-instruct
  (verified live vision on Groq); if all vision attempts fail she says honestly
  she can't see the photo (never falls to text-fallback hallucination).
- **PRESEARCH KEYWORD LAYER DELETED** (brain-first, final piece): needsLiveSearch
  + cleanSearchQuery gone; the MODEL decides when to search, every language
  equal. SEARCH-FIRST mandate in CRITICAL_RULES replaces the regex; search
  queries composed in English (translated), reply in user's language.
  !search command = the DEEP/detailed mode (5-8 bullets, 1500-char data).
- **Crypto tool revived**: CoinGecko blocks Workers IPs → CryptoCompare/
  Coinbase fallbacks. Verified: bitcoin $63,281 / doge $0.079 live.
- **Stock/nifty now hit get_stock_price** (^NSEI etc.) — presearch no longer
  hijacks them. Verified live prices ~3s.
- **Fallback chain**: CF Worker AI ALIVE again (model list llama-3.3-70b-fp8-fast
  → 3.1-8b + error logging). OpenRouter still dead at ACCOUNT level (silent
  429s on all keys — Abhya must check openrouter.ai account/keys/data-policy).
  Fallbacks get NO_TOOLS_NOTE (no more fake "call:searchweb{...}" — also
  sanitizer-stripped); empty-after-sanitize cascades to next brain.
- **gpt-oss-20b + llama-3.1-8b dropped from pool**: system prompt 413s them
  ("Request too large") — they were dead weight causing fallback cascades.
- **Language leak fixed**: lock pins LANGUAGE not just script, holds after tool
  calls (Reykjavik→English verified; "donno"→Hindi bug class dead).
- **Persona v2 + SELF-AWARENESS**: richer BIZLI_PERSONA (wrangler.toml); she
  knows her existence, platform ("we're chatting on Telegram" — verified),
  abilities in her own voice, comfortable saying she's an AI/program (never
  self-diminishing); "3000+ hours" removed from speakable material; CREATOR
  boundary (never share/invent Abhya's personal details, routes to !support —
  verified, she even vaulted an impersonation attempt); anti-generic filters
  ("I'm Llama/ChatGPT", "powered by X", "I was made by Meta") on ALL providers.
- **GIF VIBE-READING**: she now SEES a real frame (Telegram animation thumbnail
  → vision; Scout does vision+tools so send_gif still works; soft vision
  rate-limit, falls back to text placeholder).
- **Global fixes**: Google News edition follows the query (was India-locked for
  everyone); todayContext uses user's tz (was IST for everyone); links rule
  global (amazon.com default, .in only for India); app-store link invention
  banned; movie "latest" = rolling 13 months (was hardcoded 2024); BookMyShow
  only when bookable (-21..+60 days) + "(India)" label; TMDB ratings labeled
  honestly; weather metric-first (&m).
- **Never-silent guard**: command exceptions now logged + friendly reply (was
  total silence — the /status bug). Synthesis anti-400 nudge ("tool choice is
  none" storm). Tavily 8s timeout (was hanging >90s).
- **Maintenance holes closed**: /web-chat + (before removal) Facebook ignored
  maintenance mode. Web chat also got the [CURRENT USER + Platform] block.
- **Discord REMOVED + Facebook REMOVED** (routes, modules, types). Platforms
  now: Telegram + Web Chat. WhatsApp comes after stabilization + dashboard.
  Abhya: delete the Discord app + FB webhook, then remove secrets
  (DISCORD_APP_ID/_PUBLIC_KEY/_BOT_TOKEN, FB_VERIFY_TOKEN/_PAGE_ACCESS_TOKEN).

### Verified by probe on v12.37.2 (all pass)
crypto/stock/nifty live · news real+current (model-decided search) · president
correct · Hinglish news real headlines in Hinglish · Reykjavik in English ·
Tokyo °C · vision describes real cat photo (path:"vision", 3.5s) · Inception
no booking link · are-you-ChatGPT/AI honest+branded · platform awareness ·
cat-story origin · creator privacy · Cerebras+CF persona clean · no think/call:
leaks · typical latency 2-7s (search replies 6-19s)

### Pending next session
1. **Abhya's live Telegram pass** (repeat 2026-07-04 script: menus, name edit,
   /status, photo, GIF, draw, searches) → then maintenance OFF decision.
2. OpenRouter account check (Abhya) — keys silently 429 everywhere.
3. Remove /admin/test-chat + trace hook when stabilization declared done.
4. Dashboard remaining works (Abhya to list) + WhatsApp phase after.
5. Prompt diet candidate: CRITICAL_RULES grew large (413s smaller models,
   costs tokens every message) — consider compressing next session.
6. Embeddings check after real traffic; GitHub reconcile (backup first);
   Downloads/disk cleanup; !search deep-mode live test.
7. Name-edit confirm flow: transcript showed 3 attempts — unreproducible from
   code (button taps invisible); watch during live pass.

---

## Previous session: 2026-07-04 evening (NESTED MENUS v12.34.0→v12.36.0 + Supabase access)

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
## BUG LIST — collected 2026-07-10 (raw, not yet triaged)

Reported by Abhya via Telegram, needs proper investigation when back in development:

- Bizli's internal agent broke (2026-07-09)
- Voice replies coming late
- Profile picture tool reads photo but not other details, AND incorrectly stays "stuck" on the photo topic even after user changes subject
- Language bug — possibly caused by fallback model (not primary) breaking persona/language rules
- Daily self-improvement report — unclear where it actually goes / is it being delivered?
- Thumbs up/down feedback buttons not appearing for users
- /vault missing from menu card
- Dashboard stats not updating in real time
- Old/stale stats and data should auto-delete; only keep rare/instructive cases in Supabase for training, auto-remove once Bizli "masters" that case
- CM of West Bengal test case: model gave a correct-sounding but unverified/possibly wrong answer with citations that don't clearly support it — needs fact-check + look at how "currently" follow-ups are handled
- Some models in the rotation appear to ignore persona/behavior rules that others follow
- Bizli doesn't read GIF/sticker vibe/emotion — should match the tone of what user sends
- Chat history limit: increase from 15 to ~30 recent messages (ChatGPT-style)
- Supabase security needs review
- Storage approaching capacity — evaluate additional free-tier storage options

Priority/root-cause triage: NOT YET DONE. Do this properly with a clear head, not end-of-session.
---

Last updated: 2026-07-02 by Claude Code
