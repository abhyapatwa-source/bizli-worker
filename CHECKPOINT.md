# CHECKPOINT — Bizli Project Day-to-Day State

## Last session: 2026-06-30

### What we did (since June 28):
- v11.90.1: 4 critical bug fixes (Groq rotation, movie crash, LLM fallback, Hindi classifier)
- v11.91.0: needsLiveSearch rewritten — async LLM call → pure sync heuristic (saves 300-800ms/msg)
- v11.92.0: Auto-model discovery — probeGroqModels() + probeGeminiModels(); all dead models fixed
- v11.93.0: Gemini auto-discovery added; full self-healing system (Groq + Gemini)
- v11.93.1: Fix needsLiveSearch call sites in discord.ts + index.ts
- v11.94.0: Dashboard — Models tab, Live Feed tab, Maintenance tab; stats.ts slot fix
- v11.94.1: Fix brain name case bug (orb stuck amber); fix maintenance command names
- v11.95.0: Brain pipeline visualization (WHO'S DRIVING → BRAIN PIPELINE with live active-node)
- v11.96.0: Skeleton loaders (shimmer placeholders in kgrid, drive-list, user-list, tools-wrap)
- v11.97.0: Lab Agent memory vault — importance-scored Supabase persistence, auto-prune at 200 rows
- v11.98.0: Fix decommissioned vision model (90b→11b); Lab memory error surfacing for diagnostics
- v11.99.0: Remove Lab memory debug fields — memory confirmed working (needed Supabase GRANT)
- v12.0.0: Scalable storage — fix recent_errors corruption (raw put→appendError); lab_memory age pruning in cron
- v12.1.0: **Phase 3 AUTO-TESTING** — tests.ts (5-test suite, Gemini scorer, 6h cron gate), Tests tab in dashboard
- v12.2.0: Lab Agent speed — parallel memory+KV fetch, 2.0-flash first, compact JSON, 18s timeout

### Current production state:
- Version: **v12.2.0**
- Maintenance mode: **ON** (users locked out — turn off before giving access)
- All 16 Groq keys + auto-discovery active (up to 4 live models auto-detected)
- Gemini: Lab-only, 4 keys, auto-discovery (2.5-flash → 2.0-flash → 1.5-flash)
- Phase 3 auto-testing deployed — **needs `test_results` Supabase table** before Tests tab works

### Pending next session:
1. **Create `test_results` Supabase table** (SQL — unblocks Tests tab)
2. **Phase 2 LOW items remaining:**
   - Edit 12: Morphing Orb upgrade (5-layer animated)
   - Edit 13: Sound effects + animations polish
3. **Phase 4: Bizli bug fixes** (use Lab Agent to diagnose root causes):
   - Hindi feminine grammar wrong (sakti vs sakta)
   - Timezone handling for non-Indian countries occasionally wrong
   - !agent command list display issue
   - autoExtractMemory doubles Groq calls every 4 messages (quota risk)
   - Dead callGemini() in brain.ts (returns "" immediately — clean up)
   - 17 dead tool handlers in executeTool() (delete or promote)
4. **Optional Phase 4 future:** WhatsApp via Meta Cloud API sandbox

### Decisions made (locked):
- Gemini = Lab-only forever
- OpenRouter = future maintenance/cache cleanup analyzer role
- WhatsApp = Phase 4, not now
- No emojis in dashboard UI (Lucide icons only)
- Privacy strict — no user names/messages in dashboard UI

### Bugs discovered:
- Tests tab needs Supabase `test_results` table to actually show data

### Ideas backlog:
(empty — add as Abhya shares ideas)

### Emergency save:
(empty — only populated if tokens run out mid-edit)

---

Last updated: 2026-06-30 by Claude Code
