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

### Current version: v12.2.0

---

## ARCHITECTURE

### Bizli's chat brain chain (in order)
1. **Groq** (primary): 16 keys × 3 tool-capable models = 48 attempts
   - llama-3.3-70b-versatile (primary)
   - llama-4-maverick-17b-128e-instruct (fallback)
   - llama-4-scout-17b-16e-instruct (third)
2. **OpenRouter** (fallback): meta-llama/llama-3.1-8b-instruct:free
3. **Cloudflare Worker AI** (last resort): @cf/meta/llama-3.1-8b-instruct

### Lab Agent (separate diagnostic AI)
- **Gemini** only, 4 keys × 3 models = 12 attempts
- gemini-2.5-flash → gemini-2.0-flash → gemini-1.5-flash
- Bizli's chat **never** touches Gemini (architectural separation since v11.87.0)

### Vision (image input)
- Locked to llama-4-scout-17b-16e-instruct
- No rotation

### Memory extraction
- Uses llama-3.1-8b-instant via callGroqJSON
- Separate path, leave alone

---

## FILE STRUCTURE

```
worker/
  index.ts         (~486 lines) — HTTP routing + cron triggers
  brain.ts         (~800 lines) — AI brain, model rotation, persona
  tools.ts         (~400 lines) — 10 production tools
  commands.ts      (~872 lines) — User slash commands
  admin.ts         (~548 lines) — Admin commands (!approve, !ban, etc.)
  apis.ts          (~521 lines) — Third-party API wrappers
  search.ts        (~334 lines) — Web search (Tavily + Serper)
  auth.ts          (~285 lines) — User registration + PIN auth
  utils.ts         (~293 lines) — Helpers (key getters, script detection)
  telegram.ts      (~257 lines) — Telegram API wrappers
  stats.ts         (~226 lines) — /admin/stats endpoint
  agents.ts        (~154 lines) — Cron agents
  memory.ts        (~126 lines) — KV + Supabase memory
  lab.ts           (~135 lines) — Lab Agent backend
  quota.ts         (~59 lines)  — Lab quota tracking
  discord.ts       (~167 lines) — Discord handler
  facebook.ts      (~60 lines)  — Facebook Messenger
  group.ts         (~118 lines) — Telegram groups
  html.ts          (~391 lines) — Dashboard HTML assembler (thin)
  dashboard/       — 17 split modules for the dashboard UI
    styles.ts, scripts.ts, gate.ts, topbar.ts, leftnav.ts
    orb.ts, rightpanel.ts
    tabs/
      overview.ts, keys.ts, errors.ts, tools.ts, users.ts, vitals.ts
      brains.ts                  ← active
      models.ts                  ← empty (Phase 2 to populate)
      livefeed.ts                ← empty (Phase 2 to populate)
      maintenance.ts             ← empty (Phase 2 to populate)
```

### Files to DELETE eventually
- `worker/index_BACKUP_v11.80.2.ts` — 7,116-line backup, never imported, safe to remove

---

## SECRETS (Cloudflare Workers)

- 16 Groq keys: GROQ_API_KEY_1 through _16
- 4 Gemini keys: GEMINI_API_KEY, _2, _3, _4
- 5 Tavily keys: TAVILY_API_KEY, _2, _3, _4, _5
- Other API keys: OPENROUTER, GOOGLE, GIPHY, TMDB, GUARDIAN, NEWS, NASA, API_NINJAS, SERPER, HF
- Platform: TELEGRAM_BOT_TOKEN, FB_PAGE_ACCESS_TOKEN, FB_VERIFY_TOKEN, DISCORD_APP_ID, DISCORD_BOT_TOKEN, DISCORD_PUBLIC_KEY
- Storage: SUPABASE_URL, SUPABASE_SERVICE_KEY
- Auth: ADMIN_CHAT_ID, ADMIN_PASSWORD
- KV namespace: BIZLI_MEMORY

---

## BIZLI'S 10 ACTIVE TOOLS (in BIZLI_TOOLS)

1. **get_weather** — current weather, any location worldwide
2. **get_current_time** — time in any city/country (timezone-aware)
3. **search_web** — Tavily primary, Serper fallback
4. **convert_currency** — all major currencies
5. **get_movie_info** — TMDB API, all languages
6. **read_url** — read and summarize any public URL
7. **save_to_vault** — private diary entries (KV, capped 50)
8. **send_gif** — Giphy API
9. **search_youtube** — YouTube Data API v3
10. **show_map** — Google Maps URL

### NOT in BIZLI_TOOLS (dead code in executeTool, should clean up)
- translate_text, get_crypto_price, get_recipe, get_joke, get_quote
- define_word, get_nasa_apod, calculate_math, get_country_info
- get_iss_location, get_stock_price, shorten_url, get_holidays
- get_fun_fact, generate_qr, search_products, get_news

(17 dead handlers. Promote them back to BIZLI_TOOLS OR delete them. Decision pending.)

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
- ⏳ **Supabase `test_results` table** — SQL needs to be run to unblock Tests tab data
- ⏳ Anomaly detection (proactive alerts when quality drops — auto-testing foundation laid)
- ⏳ Cross-session memory + pattern recognition (future)

---

## BIZLI'S KNOWN BUGS (Phase 4 — Lab is ready, fix these now)

Use Lab Agent's diagnostic power to find root causes before fixing.

- Feminine Hindi grammar sometimes wrong (sakti vs sakta)
- Timezone handling for non-Indian countries occasionally wrong
- !agent command list display issue (minor)
- autoExtractMemory doubles Groq calls every 4 messages (quota risk at scale)
- Dead callGemini() in brain.ts (getGeminiKeys("bizli") returns [] — dead code, clean up)
- 17 dead tool handlers in executeTool() (translate, crypto, recipe, etc.) — delete or promote

**Approach:** Use Lab Agent's diagnostic power to find root causes before fixing.

---

## FUTURE (Phase 4, not scheduled yet)

- **WhatsApp via Meta Cloud API sandbox** — free, 5 whitelisted numbers, ~3 hours
- Voice transcription enhancements
- Group chat support
- Additional language testing

---

## KNOWN TECHNICAL DEBT

1. `callGemini()` in brain.ts is dead code (getGeminiKeys("bizli") returns []). Should be removed for clarity.
2. 17 unreachable tool handlers in executeTool() (translate, crypto, recipe, etc.). Delete or promote.
3. `autoExtractMemory` doubles Groq calls every 4 messages. Quota risk at scale.
4. `index_BACKUP_v11.80.2.ts` (7,116 lines) in repo unused. Delete safely.
5. Cron at 1,000 users sends ~1,000 messages per tick. Rate limit risk.
6. Web search rate-limited 15/hour/user.

---

## DECISIONS USER HAS MADE (LOCKED IN)

- **Gemini = Lab-only forever** (separated from Bizli's chat)
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
