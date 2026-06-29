# BIZLI PROGRESS — Session Continuity File
# Read this first every new session. Update before ending.

---

## SESSION START RITUAL (always run first, takes 30s)

```powershell
git log -5 --oneline
git status
type worker\brain.ts | findstr BIZLI_VERSION
# Then open dashboard in browser: https://bizli-worker.bizlibix.workers.dev/admin/dashboard
```

---

## CURRENT STATE (update this every session)

| Field | Value |
|---|---|
| **Deployed version** | v12.1.0 |
| **Maintenance mode** | ON (users locked out — turn off before giving access) |
| **Git** | Ahead of origin/main — push with `! git push origin main` |
| **Last session** | 2026-06-30 |
| **Phase** | Phase 3 (Auto-testing) — DEPLOYED; needs Supabase SQL |

---

## VERSION LOG

| Version | What changed |
|---|---|
| v11.85.5 | Lab Agent backend + dashboard UI deployed, refactor start |
| v11.86.0 | Dashboard split into 17 modules (html.ts assembles them) |
| v11.87.0 | **Gemini separated to Lab-only** (persona drift + tool collision) |
| v11.88.0 | Quota tracking in KV + Brains tab populated |
| v11.88.1 | 39 font-size UX fixes + mobile topbar padding |
| v11.89.0 | Global Health % indicator in topbar |
| v11.90.0 | Groq multi-model rotation — 48 key-model slots (16 keys × 3 models) |
| v11.90.1 | 4 critical bug fixes: Groq rotation, movie crash, LLM fallback, Hindi classifier |
| v11.91.0 | needsLiveSearch rewritten: async LLM call → pure sync heuristic (saves 300-800ms/msg) |
| v11.92.0 | Auto-model discovery: probeGroqModels() + probeGeminiModels(); fix all dead models |
| v11.93.0 | Gemini auto-discovery added; self-healing system complete (Groq+Gemini) |
| v11.93.1 | Fix needsLiveSearch call sites in discord.ts + index.ts |
| v11.94.0 | Dashboard: Models tab, Live Feed tab, Maintenance tab; stats.ts slot fix |
| v11.94.1 | Fix brain name case bug (orb amber forever); fix maintenance command names |
| v11.95.0 | Brain pipeline visualization: WHO'S DRIVING → BRAIN PIPELINE with live active-node highlight |
| v11.96.0 | Skeleton loaders: shimmer placeholders in kgrid, drive-list, user-list, tools-wrap during first data fetch |
| v11.97.0 | Lab Agent memory vault: importance-scored Supabase persistence, auto-prune at 200 rows, context injection |
| v11.98.0 | Fix decommissioned vision model (90b→11b default+candidates); Lab memory error surfacing for diagnostics |
| v11.99.0 | Remove lab memory debug fields — memory confirmed working (needed Supabase GRANT for service_role) |
| v12.0.0 | Scalable storage: fix recent_errors corruption (raw put→appendError); lab_memory age pruning in daily cron |
| v12.1.0 | **Phase 3: Auto-testing infrastructure** — tests.ts (5-test suite, Gemini scorer, 6h cron gate), Tests tab in dashboard (pass rate gauge, result cards, skeleton loaders), quality alert at <60% pass rate |

---

## ARCHITECTURE (quick reference, do not change without Abhya)

```
Chat brain chain:
  Groq (16 keys × up to 4 models, tool calling) → OpenRouter (free, text) → Worker AI (text)
  Gemini: LAB-ONLY, NEVER Bizli chat (persona drift + tool collision)

Key KV entries:
  groq_status          — key rotation state (ptr, cooldowns{}, mc{i_slot})
  groq_live_models     — { text: string[], vision: string } (48h TTL)
  gemini_live_models   — string[] (48h TTL)
  last_model_check     — timestamp ms (25h TTL, gates 12h re-probe)
  last_brains          — array of { brain, key, ts } (1h TTL)
  recent_errors        — array of { ts, detail } (24h TTL)
  maintenance_mode     — "on" or absent
  last_daily_report    — timestamp ms

Telegram admin commands:
  !agent status          full health check
  !agent models          show active model lists
  !agent refresh models  probe & update both pools (~20s)
  !agent errors          recent error log
  !maintenance on/off    toggle maintenance + broadcast to users
  !admin <password>      open inline admin panel
```

---

## DASHBOARD TABS — STATUS

| Tab | Status | Section ID | What it shows |
|---|---|---|---|
| Overview | ✅ live | grid panels | Summary stats, orb, key grid, drive, errors, users, tools, vitals |
| Keys | ✅ live | brain-section | Groq key grid (16 dots, color by status) |
| Errors | ✅ live | err-section | Error log |
| Tools | ✅ live | tools-section | 10 active tools (green/red chips) |
| Users | ✅ live | users-section | Per-user message bars |
| Vitals | ✅ live | vitals-section | Version, memory count, sync time |
| **Brains** | ✅ live | brains-section | Brain chain cards (Groq/OR/Worker/Gemini) |
| **Models** | ✅ live | models-section | Live Groq text + vision + Gemini Lab model lists |
| **Live Feed** | ✅ live | livefeed-section | Brain activity stream + error log |
| **Maintenance** | ✅ live | maintenance-section | Status + click-to-copy Telegram commands |
| **Tests** | ✅ live | tests-section | 7-day pass rate gauge, per-test result cards — needs `test_results` Supabase table |

---

## PHASE 2 REMAINING ITEMS

| Edit | Description | Priority |
|---|---|---|
| Edit 6 | Brain Chain pipeline visualization (Overview redesign) | HIGH |
| ~~Edit 9~~ | ~~Skeleton loaders during data load~~ | ~~MEDIUM~~ DONE v11.96.0 |
| ~~Edit 10~~ | ~~Lab Agent memory in Supabase~~ | ~~HIGH~~ DONE v11.97.0 — **needs SQL table** |
| Edit 12 | Morphing Orb upgrade (5-layer animated) | LOW |
| Edit 13 | Sound effects + animations polish | LOW |

**Done this session:** 5B (Models tab), 8 (Live Feed), 11 (Maintenance tab), 6 (Brain pipeline), 9 (Skeleton loaders), 10 (Lab memory vault)

---

## KNOWN BUGS (Bizli behaviour, fix AFTER lab is done)

- Hindi feminine grammar sometimes wrong (sakti vs sakta)
- Timezone handling for non-Indian countries occasionally wrong
- !agent command list display issue (minor)
- Dead callGemini() in brain.ts (returns "" immediately, clean up later)
- 17 dead tool handlers in executeTool() (delete or promote decision pending)
- autoExtractMemory doubles Groq calls every 4 messages (quota risk at scale)

---

## DECISIONS LOCKED (never change without Abhya explicitly asking)

- **Gemini = Lab-only forever** — persona drift + tool collision
- **Worker AI = last resort** — basic text only
- **OpenRouter** = future role: maintenance/cache cleanup analyzer
- **No emojis in dashboard UI** (Lucide icons only)
- **Privacy strict** — no user names/messages in dashboard UI
- **WhatsApp** = Phase 4, not now

---

## FILES MAP (most-edited, know these by heart)

```
worker/
  brain.ts       — AI brain, BIZLI_VERSION, model rotation, probeGroqModels, probeGeminiModels
  stats.ts       — /admin/stats endpoint (payload for dashboard JS)
  agents.ts      — Cron: proactive nudges, memory cleanup, model health check
  admin.ts       — !agent / !maintenance / !admin panel commands
  search.ts      — needsLiveSearch() pure heuristic (NOT async, no LLM call)
  lab.ts         — Lab Agent (Gemini-only, reads gemini_live_models from KV)

worker/dashboard/
  scripts.ts     — ALL dashboard JS (updateAll, updateModels, updateBrains, etc.)
  styles.ts      — ALL dashboard CSS
  leftnav.ts     — Left nav items (tabs)
  tabs/
    brains.ts    — Brain chain cards HTML
    models.ts    — Model discovery tab HTML
    livefeed.ts  — Live feed tab HTML
    maintenance.ts — Maintenance tab HTML
```

---

## DEPLOY WORKFLOW

```powershell
# Check types first
npx tsc --noEmit --target es2021 --lib es2021 --moduleResolution bundler --module esnext --skipLibCheck worker/brain.ts

# Deploy (CMD, not PowerShell — or use PowerShell tool)
npx wrangler deploy

# Commit (after deploy)
git add <files>
git commit -m "vX.Y.Z: description"
# Push: user runs  ! git push origin main
```

---

Last updated: 2026-06-30 (v12.1.0 session)
