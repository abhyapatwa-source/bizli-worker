# CHECKPOINT — Bizli Project Day-to-Day State

## Last session: 2026-07-02 (monitoring room / dashboard UI polish)

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
