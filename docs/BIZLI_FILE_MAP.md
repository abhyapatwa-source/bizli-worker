# BIZLI — Project File Map

> Complete categorization of every file in `worker/`, grouped into 8 categories.
> Each file lists its purpose and its main exported functions ("mini-files").
> **Version:** v12.13.0 · **Total:** 41 `.ts` files in `worker/` (all active; dead `core/` + backup removed)
> This is a *map*, not a refactor — nothing here has moved. Read-only reference.

---

## How to read this

```
CATEGORY  (the 8 top groups)
  └─ file.ts   (the "sub-files")
       └─ exportedFunction()   (the "mini-files")
```

8 categories · 41 files · ~180 named functions. 8 files are over 500 lines (flagged ⚠️).

---

## (a) CORE RUNTIME & ROUTING

The entry points — where every request lands and gets routed.

| File | Lines | Purpose |
|------|-------|---------|
| `worker/index.ts` | 504 | Main Cloudflare Worker runtime + request router; Telegram/Discord/Facebook webhooks; cron triggers |
| `worker/types.ts` | 40 | Type definitions — the `Env` interface (all API keys + KV/Supabase bindings) |

**`index.ts` mini-files:** `default` (the fetch/scheduled module handler)
**`types.ts` mini-files:** `Env` (interface)

---

## (b) AI BRAIN & MODEL LOGIC

Bizli's actual intelligence — model rotation, prompting, self-healing.

| File | Lines | Purpose |
|------|-------|---------|
| `worker/brain.ts` | 881 ⚠️ | Core LLM orchestration — Groq/OpenRouter/Worker-AI chain, model probing, persona, sanitization |
| `worker/agents.ts` | 191 | Cron-driven autonomous agents — proactive nudges, birthday greetings, model refresh |
| `worker/lab.ts` | 220 | Lab Agent backend (admin diagnostic AI, Gemini-only) — system prompt + request handler |

**`brain.ts` mini-files:**
- `BIZLI_VERSION`, `RPM_COOLDOWN_MS` — version + cooldown constant
- `getActiveGroqModels()` — returns live text + vision models
- `probeGroqModels()` / `probeGeminiModels()` — auto-discovery / self-healing
- `CRITICAL_RULES`, `BANNED_LINE_PATTERNS`, `PHRASE_REPLACEMENTS`, `IMG_MARKER` — persona + output-cleaning constants
- `getGroqStatus()` / `saveGroqStatus()` — key cooldown state in KV
- `recordLastBrain()` — logs which brain fired (drives the dashboard pipeline)
- `appendError()` — structured error log to KV
- `groqExhausted()` — are all Groq keys cooling?
- `sanitizePersonaLeaks()` — strips model self-references from replies
- `callGemini()` — ⚠️ **dead in Bizli's chain** (Lab-only path; see Cleanup)
- `callOpenRouter()` — fallback brain
- `callCloudflareAI()` — last-resort brain
- `callGroqJSON()` — JSON-mode call (used by memory extraction)
- `autoExtractMemory()` — pulls durable facts from conversations (⚠️ quota cost, see Cleanup)
- `callGroq()` — **the primary brain**: 16 keys × 3 models, tool-calling, the heart of Bizli

**`agents.ts` mini-files:** `runAgents()`
**`lab.ts` mini-files:** `callLabAgent()`, `handleLabAgent()`

---

## (c) TOOLS & EXTERNAL APIs

What Bizli can *do* in the world — her hands.

| File | Lines | Purpose |
|------|-------|---------|
| `worker/tools.ts` | 400 ⚠️ | Tool definitions (`BIZLI_TOOLS`), rate limiting, tool dispatcher (`executeTool`) |
| `worker/apis.ts` | 521 ⚠️ | 20+ external API wrappers — weather, time, currency, movies, crypto, NASA, etc. |
| `worker/search.ts` | 346 | Web search orchestration — Tavily → Serper/DuckDuckGo → Wikipedia; URL reading |

**`tools.ts` mini-files:**
- `BIZLI_TOOLS` — the **10 live tools** exposed to the LLM: `get_weather`, `get_current_time`, `search_web`, `convert_currency`, `get_movie_info`, `read_url`, `save_to_vault`, `send_gif`, `search_youtube`, `show_map`
- `RATE_LIMITS`, `checkRateLimit()` — per-feature rate limiting
- `executeTool()` — dispatcher (⚠️ contains 17 dead handlers, see Cleanup)

**`apis.ts` mini-files:** `getWeather()`, `getWorldTime()`, `getCurrency()`, `getCrypto()`, `getJoke()`, `getQuote()`, `getDictionary()`, `getWikipedia()`, `getCountry()`, `getNASA()`, `getISS()`, `getSpaceX()`, `getRecipe()`, `getCocktail()` (+ more)
**`search.ts` mini-files:** `OFFICE_MAP`, `SEARCH_CACHE_VERSION`, `cleanSearchQuery()`, `extractSearchQuery()`, `needsLiveSearch()`, `searchWeb()`, `searchWebUncached()`, `getWikiSummary()`, `readUrl()`

---

## (d) COMMANDS (USER + ADMIN)

The command surface — slash commands, admin controls, intent routing.

| File | Lines | Purpose |
|------|-------|---------|
| `worker/commands.ts` | 872 ⚠️ | Intent detection, user command dispatch, callback-query handling |
| `worker/admin.ts` | 591 ⚠️ | Admin commands — menus, agent panel, broadcast, daily reports |

**`commands.ts` mini-files:** `detectIntent()`, `handleCallback()`, `handleUserCommand()`
**`admin.ts` mini-files:** `runAdminMenu()`, `runHelpMenu()`, `runAgentCommand()`, `handleAdmin()`, `helpNav()`

---

## (e) MEMORY & STORAGE

What Bizli remembers — KV, Supabase, embeddings, quotas.

| File | Lines | Purpose |
|------|-------|---------|
| `worker/memory.ts` | 126 | KV history, embeddings, memory save/retrieval, auth state, admin sessions |
| `worker/quota.ts` | 59 | Lab quota event tracking per key/model; today's usage |
| `worker/db.ts` | 16 | Supabase adapter (thin wrapper) |

**`memory.ts` mini-files:** `getKVHistory()`, `appendKVHistory()`, `getEmbedding()`, `getUserMemories()`, `getRelevantMemories()`, `saveMemory()`, `getAuthStateHelper()`, `setAuthStateHelper()`, `clearAuthState()`, `isAdminSession()`, `lookupUser()`
**`quota.ts` mini-files:** `recordQuotaEvents()`, `handleLabQuota()`, `QuotaEvent`
**`db.ts` mini-files:** `db`

---

## (f) PLATFORM HANDLERS

Where Bizli lives — one core, many front doors.

| File | Lines | Purpose |
|------|-------|---------|
| `worker/telegram.ts` | 257 | Telegram API — send messages/images/voice, transcription, image gen, typing |
| `worker/discord.ts` | 167 | Discord interaction verification (Ed25519) + handler + registration |
| `worker/group.ts` | 118 | Telegram group/supergroup message handling |
| `worker/facebook.ts` | 60 | Facebook Messenger webhook verify + handler |

**`telegram.ts` mini-files:** `sendTelegram()`, `sendTelegramAnimation()`, `sendImageCard()`, `generateImage()`, `transcribeVoice()`, `sendRichResponse()`, `sendTyping()`, `withTyping()`, `downloadTelegramFile()`, `editTelegramMessage()`, `answerCallback()`, `broadcastToTelegram()`, `sendSupportToAdmin()`, `getWikiImage()`, `getMoviePoster()`
**`discord.ts` mini-files:** `handleDiscordRegister()`, `handleDiscord()`
**`group.ts` mini-files:** `handleGroupMessage()`
**`facebook.ts` mini-files:** `handleFacebookVerify()`, `handleFacebook()`

---

## (g) LAB AGENT & TESTING

Bizli's self-diagnostics and quality guardrails.

| File | Lines | Purpose |
|------|-------|---------|
| `worker/tests.ts` | 171 | Auto quality suite — 5 tests, Gemini scorer, 6h cron; pass-rate stats |
| `worker/auth.ts` | 285 | Registration, login, PIN hashing/verification, auth state |
| `worker/utils.ts` | 293 | Shared helpers — hashing, timezone, tone/script detection, key rotation |

*(Note: `lab.ts` and `quota.ts` are the Lab Agent's own backend — see categories (b) and (e).)*

**`tests.ts` mini-files:** `runBizliTests()`, `getTestStats()`
**`auth.ts` mini-files:** `handleAuth()`
**`utils.ts` mini-files:** `fetchTimeout()`, `sha256()`, `detectScript()`, `detectUserTone()`, `parseDOB()`, `calculateAge()`, `isBirthdayToday()`, `cityToTimezone()`, `getUserLocalHour()`, `searchGif()`, `getGroqKeys()`, `getGeminiKeys()`, `titleCase()`, `timeAgo()`, `hashPin()`, `MORNING_MSGS`, `NIGHT_MSGS`

---

## (h) DASHBOARD UI (Monitoring Room)

The monitoring room. **Full feature-level breakdown lives in `MONITORING_ROOM_INVENTORY.md`** — this is just the file list.

| File | Lines | Purpose |
|------|-------|---------|
| `worker/stats.ts` | 258 | Dashboard backend — `/admin/stats`, dashboard render, web-chat |
| `worker/html.ts` | 405 ⚠️ | Static HTML templates — privacy, terms, dashboard shell, chat |
| `worker/dashboard/styles.ts` | 604 ⚠️ | All dashboard CSS |
| `worker/dashboard/scripts.ts` | 823 ⚠️ | All client-side JS (polling, EKG, Lab chat, audio, cat animation) |
| `worker/dashboard/gate.ts` | 12 | Password gate |
| `worker/dashboard/topbar.ts` | 18 | Sticky top bar |
| `worker/dashboard/leftnav.ts` | 24 | Left sidebar nav |
| `worker/dashboard/orb.ts` | 178 | The animated holographic cat (SVG) |
| `worker/dashboard/rightpanel.ts` | 50 | Lab Agent chat panel |
| `worker/dashboard/tabs/overview.ts` | 10 | Overview tab |
| `worker/dashboard/tabs/keys.ts` | 28 | Keys / neural map tab |
| `worker/dashboard/tabs/errors.ts` | 5 | Errors log tab |
| `worker/dashboard/tabs/tools.ts` | 15 | Tools health tab |
| `worker/dashboard/tabs/users.ts` | 9 | User leaderboard tab |
| `worker/dashboard/tabs/vitals.ts` | 11 | Vitals tab |
| `worker/dashboard/tabs/brains.ts` | 51 | Brain chain tab |
| `worker/dashboard/tabs/models.ts` | 30 | Models tab |
| `worker/dashboard/tabs/livefeed.ts` | 17 | Live feed tab |
| `worker/dashboard/tabs/maintenance.ts` | 38 | Maintenance tab |
| `worker/dashboard/tabs/tests.ts` | 17 | Tests tab |

**Backend mini-files (`stats.ts`):** `handleAdminStats()`, `handleDashboard()`, `handleWebChat()`
**Template mini-files (`html.ts`):** `PRIVACY_HTML`, `TERMS_HTML`, `DASHBOARD_HTML`, `CHAT_HTML`
**Each dashboard/UI file exports one HTML/CSS/JS constant** (e.g. `ORB_HTML`, `DASHBOARD_STYLES`, `DASHBOARD_SCRIPTS`, `OVERVIEW_HTML`, ...).

---

## CLEANUP / DEAD CODE

### ✅ Removed (cleanup commit, this session — 7,579 lines deleted)
| Item | What it was |
|------|-------------|
| ~~`core/gemini.ts`~~ | v9.0.0 relic — old Gemini-**primary** brain (contradicted "Gemini = Lab-only"). Not imported. |
| ~~`core/memory.ts`~~ | v9.0.0 relic — old Supabase layer, superseded by `worker/memory.ts`. Not imported. |
| ~~`core/persona.txt`~~ | v9.0.0 relic — old "flirty Snapchat" persona (opposite of today's warm/genuine Bizli). |
| ~~`main`~~ | 0-byte empty junk file at repo root. |
| ~~`worker/index_BACKUP_v11.80.2.ts`~~ | 7,116-line pre-modularization monolith backup. Never imported. |

### ⏳ Still flagged (not yet touched — needs a separate plan)
| Item | Where | Why it's dead / risky |
|------|-------|---------------|
| `callGemini()` in Bizli's chain | `brain.ts` | `getGeminiKeys("bizli")` returns `[]` → never fires for chat. Gemini is Lab-only by design. |
| **17 dead tool handlers** | `tools.ts` `executeTool()` | Cases exist but are NOT in `BIZLI_TOOLS`, so the LLM can never call them |
| `autoExtractMemory()` double-call | `brain.ts` | Doubles Groq calls every 4 messages — quota risk at scale (not dead, but flagged debt) |

**The 17 dead tool handlers** (in `executeTool` but not exposed in `BIZLI_TOOLS`):
`get_news`, `get_crypto_price`, `search_products`, `get_recipe`, `get_joke`, `get_quote`, `define_word`, `get_nasa_apod`, `translate_text`, `calculate_math`, `get_country_info`, `get_iss_location`, `generate_qr`, `get_stock_price`, `shorten_url`, `get_holidays`, `get_fun_fact`.

**Decision pending:** promote these back into `BIZLI_TOOLS` (give Bizli more abilities) OR delete them (cleaner code). This is a real Phase-4 fork worth discussing.

---

## AT-A-GLANCE COUNTS

- **8** categories
- **41** files (all active — dead `core/` folder, `main`, and 7,116-line backup removed this session)
- **~180** named exported functions/constants
- **8** files over 500 lines: `brain.ts` (881), `commands.ts` (872), `scripts.ts` (823), `styles.ts` (604), `admin.ts` (591), `apis.ts` (521), `html.ts` (405), `tools.ts` (400)
- **10** live tools, **17** dead tool handlers
- **11** dashboard tabs (see the monitoring-room doc for full depth)
