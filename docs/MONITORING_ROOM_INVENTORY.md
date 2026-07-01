# BIZLI — Monitoring Room (Dashboard) Inventory

> A complete, expert-readable breakdown of the monitoring room: every tab, panel,
> feature, function, UI element, and data source. Built so the UI can be **rearranged**
> and **handed to a designer/expert** without them reading the code.
>
> **Version:** v12.13.0 · Read-only reference — nothing here has changed.
> For the whole-project file map, see `BIZLI_FILE_MAP.md`.

---

## 0. ARCHITECTURE & DATA FLOW

**Where it lives:** assembled in `worker/html.ts` → `DASHBOARD_HTML`, served by `handleDashboard()` in `worker/stats.ts`.

**Three data endpoints:**

| Endpoint | Method | Auth | Frequency | Feeds |
|----------|--------|------|-----------|-------|
| `/admin/stats?key=PASSWORD` | GET | admin password | **every 3s** | All stats: keys, brains, errors, users, tools, memory, models, maintenance, tests |
| `/lab/quota?key=PASSWORD` | GET | admin password | **every 30s** | Gemini quota (calls today, 429s, exhausted keys) |
| `/lab/agent` | POST | key + messages[] + dashboardData | on-demand | Lab Agent AI replies |

**Theme colors** (CSS `:root` variables in `styles.ts`):
- `--bg` #060912 (deep space) · `--panel` #080e1d · `--border` #152035
- `--blue` #00d4ff (primary) · `--cyan` #3ddbd9 · `--amber` #f59e0b · `--red` #ef4444 · `--green` #22c55e
- `--text` #ddeeff · `--muted` #3a5070

**Layout:** 3-column CSS grid `1.05fr 1.2fr 1.2fr` × 3 rows, on a twinkling starfield background. Left nav (240px) + main grid + right Lab panel (360px).

---

## 1. LAYOUT MODULES (the frame around everything)

### 1.1 Password Gate — `dashboard/gate.ts`
Full-screen overlay shown before anything loads.
- **Elements:** ⊕ logo · "BIZLI LAB" heading · "Admin command center — restricted access" subtext · password input · "ENTER" button · red error line
- **Behavior:** `submitPw()` → validates password → `fetchStats(true)` with PW in query. `401` → "Wrong password". Success → hides gate, reveals `#app`, `#lab`, `#leftnav`, starts EKG, restores last tab.

### 1.2 Top Bar — `dashboard/topbar.ts` (sticky)
Left → right:
1. `⊕ BIZLI LAB` logo (blue, glow)
2. Green pulsing dot + "LIVE"
3. **System integrity block:** "↑ SYSTEM INTEGRITY" label · EKG canvas (80×22px) · status dot · health % · health word (EXCELLENT / HEALTHY / DEGRADED / WARNING / CRITICAL)
4. "Last sync: HH:MM:SS" (muted)
5. **Lab Agent status:** "LAB AGENT" · "AI ASSIST ● ONLINE"
6. "→ →" spacer + final green dot
- **Data:** health % + EKG color from `updateHealth()`; sync time from `fetchStats()`.

### 1.3 Left Nav — `dashboard/leftnav.ts`
240px sidebar; collapses to 60px (icons only) at 801–1100px; hamburger drawer ≤800px.
- **Header:** ⊕ BIZLI LAB logo + version (from vitals).
- **Tabs (in order, all fully built):** OVERVIEW (eye) · KEYS (key) · ERRORS (alert-triangle) · TOOLS (wrench) · USERS (users) · VITALS (activity) · *—separator—* · BRAINS (brain) · MODELS (cpu) · LIVEFEED (zap) · MAINTENANCE (settings) · TESTS (check-circle)
- **Active tab:** blue left border + blue background. **Footer:** green dot + "LIVE SYSTEM".

### 1.4 Right Panel / Lab Agent — `dashboard/rightpanel.ts`
360px right column; slides off-screen (collapsible) on desktop, bottom drawer ≤800px.
- **Header:** "LAB AGENT" · "AI ASSIST ● ONLINE" · volume button (OFF→LOW→MED→HIGH) · green dot
- **Vision AI section (`#lab-va`):** "VISION AI ASSISTANT" title + fallback orb (core sphere + 3 orbiting rings + 3 circling nodes) + **3 hardcoded quick-action buttons:** "Check system health…", "Show me the live feed…", "Run a full diagnostic…"
- **Chat body:** scrollable; user bubbles (cyan, right) · agent bubbles (dark, monospace, left) · system messages (italic, centered) · typewriter effect (18ms/char) · collapsible old-session history
- **Processing indicator:** "Processing…" pulsing (`procblink` 1.2s)
- **Quota bar:** "Quota: XXX/12000 calls today [⚠ N exhausted]" + progress fill (green <50% / amber 50–80% / red >80%)
- **Input:** auto-grow textarea (max 120px) + send (▸); Enter or click submits
- **Data:** POST `/lab/agent` with chat history + current dashboard data.

### 1.5 The Hologram — `dashboard/orb.ts`
See **Section 5** for the full hologram baseline (it's big enough to deserve its own section).

---

## 2. THE 11 TABS (each panel + its data)

### 2.1 OVERVIEW — `tabs/overview.ts`
The default landing view. Two parts:

**A) Summary stat row (7 boxes, only on this tab):**
| Box | Icon | Element ID | Shows |
|-----|------|-----------|-------|
| USERS | user | `s-users` | total users |
| APPROVED | user-check | `s-appr` | approved users |
| MESSAGES | message-circle | `s-msgs` | total messages |
| MEMORIES | brain | `s-mems` | memory count |
| GROQ LIVE | cpu | `s-keys` | ready Groq keys |
| TOOLS OK | wrench (green) | `s-tools` | tools online |
| TOOLS OFF | tool (red) | `s-toff` | tools offline |

**B) Main grid panels** (see Section 4 for grid coordinates):
ORB · BRAIN PIPELINE · ERROR LOG · USER LEADERBOARD · TOOLS HEALTH · VITALS · SYSTEM METRICS.

**Data:** `/admin/stats` (all fields).

---

### 2.2 KEYS (Neural Map) — `tabs/keys.ts`
- **Key grid:** each of 16 Groq keys as a `.kdot`, named by phonetic alphabet (Alpha, Bravo, Charlie, Delta, Echo, Foxtrot, Golf, Hotel, …). States: `ready` (green) · `rpm_cooling` (amber) · `tpd_cooling` (red). Cooldown seconds shown in `.kcd` when >0. Last-used key gets `.lastused` highlight.
- **AI nodes:** Gemini Flash node + Worker AI node (dot + `.active`/`.standby`).
- **Data:** `d.groq[i]` = `{ name, status, secondsLeft }`; Gemini active if `d.lastBrains[0].brain === "gemini"`.

### 2.3 ERRORS — `tabs/errors.ts`
- **Log:** monospace green-on-dark. Each line `[YYYY-MM-DD HH:MM:SS] detail`, newest first. Empty → "◆ All systems nominal".
- **Data:** `d.recentErrors[]` = `{ timestamp, detail }` (timestamp sliced to 19 chars).

### 2.4 TOOLS — `tabs/tools.ts`
- **Tool grid:** 5-column icon items (lucide icon per tool: weather→cloud, etc.), 6–8 char label, green if key configured / red if offline, hover lift + tooltip (full name + status).
- **Status line:** "◆ ALL TOOLS OPERATIONAL" (green) or "◀ N TOOLS OFFLINE" (red).
- **Data:** `d.tools[]` = `{ name, keyConfigured }`.

### 2.5 USERS (Leaderboard) — `tabs/users.ts`
- **List (top 10):** status dot (green for top, gray rest) + anonymized "USER-1", "USER-2"… + message count + relative-length bar (blue→cyan gradient, top user glows).
- **Data:** `d.messages.perUser[]` sorted desc. **Privacy:** names never shown — index labels only.

### 2.6 VITALS — `tabs/vitals.ts`
7 key/value rows: VERSION (`v-ver`) · SERVER UTC (`v-utc`, ticks every 1s) · SERVER IST (`v-ist`) · LAST SYNC (`v-sync`) · ERRORS LOGGED (`v-errc`) · MEMORIES (`v-mems`) · WAITLIST (`v-wait`).
- **Data:** `d.version`, `d.serverTime.utc/ist`, `d.recentErrors.length`, `d.memory.count`, `d.users.waitlist`.

### 2.7 BRAINS (Brain Chain) — `tabs/brains.ts`
2×2 card grid:
- **GROQ [PRIMARY]:** dot + ACTIVE/DEGRADED/OFFLINE · "N/16 ready" · model list · last fired
- **OPENROUTER [FALLBACK]:** dot + ACTIVE/STANDBY · Configured? · `llama-3.1-8b-instruct:free` · last fired
- **WORKER AI [LAST RESORT]:** standby dot · `@cf/meta/llama-3.1-8b-instruct` · "Cloudflare native" · last fired
- **GEMINI [LAB-ONLY, amber]:** amber dot · N keys · model list · "N ok, M 429s" · "Not in Bizli's chain"
- **Data:** `d.groq[]`, `d.lastBrains[]`, `d.openrouter.configured`, `d.gemini.keysConfigured`, `d.models.*`.

### 2.8 MODELS — `tabs/models.ts`
- **GROQ TEXT [PRIMARY BRAIN]:** numbered live model IDs, "LIVE" tag, subtitle "Up to 4 live · tried 1→4 · 16 keys each · auto-heals every 12h"
- **GROQ VISION:** single locked model, "VISION" tag
- **GEMINI LAB [LAB-ONLY]:** numbered IDs, "LAB" tag, "Up to 3 live · 4 keys each · Lab Agent only"
- **Status line:** "Auto-heal active · probes every 12h · Telegram alert if changed · run `!agent refresh models` to force"
- **Data:** `d.models.groqText[]`, `d.models.groqVision`, `d.models.geminiLab[]`, `d.models.lastProbeAt`.

### 2.9 LIVEFEED — `tabs/livefeed.ts`
- **BRAIN ACTIVITY:** full history of brain calls — brain badge (color-coded) + key # + "Xm Ys ago", scrollable (260px). Placeholder "Waiting for activity…".
- **ERROR LOG:** full error list, monospace, newest first, auto-scroll (300px).
- **Data:** `d.lastBrains[]` (full) + `d.recentErrors[]` (full). Refreshes every 3s.

### 2.10 MAINTENANCE — `tabs/maintenance.ts`
- **Status box:** green "MAINTENANCE OFF — System live" or amber "MAINTENANCE ON — Users locked out" + approved-user count line.
- **Toggle via Telegram:** click-to-copy `!maintenance on` / `!maintenance off`.
- **Quick commands:** click-to-copy `!agent refresh models` / `!agent models` / `!agent status`.
- **Behavior:** `copyCmd(cmd)` copies + shows "Copied to clipboard" toast (1.8s). Commands run in Telegram, not here.
- **Data:** `d.maintenance.on`, `d.users.approved`.

### 2.11 TESTS — `tabs/tests.ts`
- **Header:** "QUALITY TESTING" + grade pill (HEALTHY/DEGRADED/FAILING) + "last run: Xm ago".
- **7-day pass rate:** big % + bar (green ≥80 / amber 60–79 / red <60).
- **Recent runs:** test name · language badge · score · pass/fail chip · date.
- **Info:** "Tests run automatically every 6h via cron. 5 tests per run: greeting, Hindi, identity, name, weather tool."
- **Data:** `d.tests` = `{ passRate7d, lastRunAt, recentResults[] }`.
- **⚠️ Note:** needs the Supabase `test_results` table created to show real data.

---

## 3. `scripts.ts` — CLIENT-SIDE FUNCTION CATALOG (823 lines)

**Polling & dispatch**
- `fetchStats(first)` — main poll, every **3s** → `/admin/stats`
- `fetchLabQuota()` — every **30s** → `/lab/quota`
- `tickClock()` — server-time display, every **1s**
- `updateAll(d, fetchMs)` — master dispatcher → calls all `update*` functions below

**Per-section updaters** — `updateOrb`, `updateBrain`, `updateDrive`, `updateErrors`, `updateUsers`, `updateTools`, `updateVitals`, `updateBrains`, `updateModels`, `updateMaintenance`, `updateLiveFeed`, `updateTests`, `updatePipeline`, `updateMetrics`, `updateHealth`

**Navigation** — `switchTab(tab)` (+ localStorage), `lnavToggle()` (mobile nav), `labToggle()` (mobile lab), `setLabState(collapsed, animate)` (desktop lab collapse)

**Number animation** — `animN(el, to)` (22 steps × 24ms + "num-flash" flicker), `setN(id, val)` (animate only on change)

**EKG heartbeat** — `startEKG()` (canvas, 70-phase cycle; QRS spike at phases 25–32; noise between; color = health), `ekgRaf` (frame handle)

**Lab Agent chat** — `labSend()`, `appendLabBubble(type, text, scroll)`, `typewriterLab(el, text, onDone)`, `toggleLabHistory()`; `labHistory` = last 30 msgs in localStorage; SFX `labPlaySend()` (1600→280Hz), `labPlayReply()` (100→1100Hz + chord)

**Ambient audio engine (cyberpunk)** — `labStartAmbient()`: 40Hz sub-bass + detuned saws 120/124Hz + 360Hz shimmer + bandpass noise @1600Hz w/ 0.06Hz LFO + 0.5Hz pulse LFO. `labCycleVolume()` rotates [0, 0.12, 0.26, 0.45].

**Cat animation** — `initCat()`; eye tracking (pupils/shine follow cursor, max 4px); `blink()` (scaleY 0.07, 120ms, every 2.8–7.3s); `twitch()` (random ear, 6–15s); `glitch()` (random rects, 70–130ms, every 4.5–13.5s); click → bounce (scale 1.07) + chirp (900→1400→700Hz)

**Utilities** — `esc(s)` (HTML escape), `fmt(n)` (1000→"1.2k"), `secs(s)` ("2h 35m 14s"), `submitPw()`

**localStorage keys** — `bizli_lab_collapsed` · `bizli_nav_tab` · `bizli_lab_vol` · `bizli_lab_chat`

---

## 4. `styles.ts` — STYLE CATALOG (604 lines)

**Layout grid** — main grid `1.05fr 1.2fr 1.2fr` × 3 rows; panels assigned by `grid-column`/`grid-row`.

**Keyframe animations** — `twinkle` (stars) · `lpulse` (status dot, 1.4s) · `catbreathe` (hologram scale, 4.2s) · `tailswish` (±10°, 3.2s) · `eartwitch` (0.55s) · `rspin` (orbital rings, 7–33s) · `skelshine` (skeleton shimmer) · `catscan` (scanline sweep) · `catglare` (glare pulse) · `numflash` (number flash) · `procblink` (Lab processing)

**Responsive breakpoints** — 1100px (nav collapses to 60px) · 800px (mobile drawers + hamburger) · 560px (single column, smaller cat 200px)

**Interactive transitions** — opacity/transform 0.15–0.3s on buttons; box-shadow glow on active states.

---

## 5. HOLOGRAM BASELINE — `orb.ts` (the "before" snapshot)

> This documents **exactly what exists today** so the future sci-fi "living identity"
> redesign has a clear baseline to replace. (The redesign is a separate, later step.)

**Container `#cat-holo`:** 188×240px, 1.5px cyan border + 4-layer glow box-shadow + inset glow/reflection; `catbreathe` scale 1→1.022 (4.2s). Status color modes: default `--blue` · `.amber` (fallback active) · `.red` (>5 errors).

**SVG (viewBox 188×240), elements:**
1. **Body** — ellipse (94,170) rx50 ry52, radial cyan→blue gradient, cyan stroke, Gaussian blur
2. **Head** — circle (94,98) r40, same styling
3. **Ears** (grouped) — left polygon (62,83 58,52 85,80), right (103,80 130,52 126,83); outer + inner layers; `.twitching` → 0.55s rotate
4. **Eyes** (grouped) — outer ellipse 11×12 (dark + cyan stroke); pupil ellipse 5×8.5 (bright cyan + glow); white shine 2.5px; blink = scaleY(0.07); pupils/shine translate for cursor tracking
5. **Nose & mouth** — cyan triangle nose + 2 Q-curve mouth paths
6. **Whiskers** — 6 lines (3 per side), cyan 0.75px, 60% opacity
7. **Tail** — arc path, 5.5px round cap, tip ellipse; `tailswish` ±10° around origin (148,175)
8. **Paws** — 2 ellipses (72,215)(116,215) 17×9 + 6 toe lines each

**Animations:** breathing · tail swish · blink (2.8–7.3s) · ear twitch (6–15s) · glitch rects (4.5–13.5s) · scanline sweep (3.5s) · glare pulse (5s) · click bounce + chirp.

**Rings (5)** — r1 210px/7s · r2 252px/11s reverse · r3 292px dashed/17s · r4 326px dotted/24s reverse · r5 358px/33s; all tilted 62° rotateX.

**Particles (7)** — orbiting cyan/blue/white dots, radii + speeds vary (3.2–13s), some glowing.

**Abhya's verdict:** current build reads as a *flat SVG cat*, not a *living sci-fi hologram*. → Redesign target for Step 2.

---

## 6. GRID MAP — "rearrange it better"

What each grid slot currently holds (Overview tab). Use this to move panels around and spot gaps.

| Slot (col / row) | Panel | Content |
|------------------|-------|---------|
| col 1 / rows 1–2 | **ORB** | Hologram + status ("◉ CORE SYSTEM" / "◉ FALLBACK" / "⚠ ERROR SPIKE") + brain name + "N/M keys ready" + "AI CORE STABLE/STRESSED" |
| col 2 / row 1 | **BRAIN PIPELINE** | GROQ → OPENROUTER → WORKER AI nodes (active glows) + "GEMINI not in chain" note + recent-calls list + mini leaderboard |
| col 2 / row 2 | **ERROR LOG** | Same as Errors tab |
| col 3 / row 2 | **USER LEADERBOARD** | Same as Users tab |
| col 1 / row 3 | **TOOLS HEALTH** | Same as Tools tab |
| col 2 / row 3 | **VITALS** | Same as Vitals tab |
| col 3 / row 3 | **SYSTEM METRICS** | 2×2: CPU (latency/5)% · MEMORY (memCount/500×100)% · NETWORK (fetch ms) · DISK (100 − errors/50×100)% + "◆ SYSTEM STABLE" / "◀ N ERRORS DETECTED" |

**Note on metrics:** CPU/MEMORY/DISK are *derived approximations*, not real host telemetry (Cloudflare Workers don't expose those). Worth deciding if that's honest enough for an expert-facing UI, or if these should be relabeled.

---

## 7. QUICK SUMMARY (for handoff)

- **11 tabs**, all functional: Overview · Keys · Errors · Tools · Users · Vitals · Brains · Models · LiveFeed · Maintenance · Tests
- **Live data:** 3s stats · 30s quota · 1s clock
- **Signature features:** EKG heartbeat · animated hologram cat · Lab Agent AI chat (typewriter + SFX + ambient audio) · skeleton loaders · brain pipeline visualization
- **3 endpoints:** `/admin/stats`, `/lab/quota`, `/lab/agent`
- **Known gaps:** Tests tab needs Supabase table · system metrics are approximations · hologram needs the sci-fi redesign
- **Design system:** deep-space dark + cyan/blue neon; 3-column responsive grid; ~11 keyframe animations
