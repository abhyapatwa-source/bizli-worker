export const ORB_HTML = `<!-- BIZLI HOLOGRAM -->
<div class="panel" id="orb-section">
  <div class="ni-hdr">
    <div class="ni-title">NEURAL INTERFACE</div>
    <div class="ni-sub">GROQ &nbsp;&#183;&nbsp; AI ENTITY</div>
  </div>
  <div class="ni-corner ni-tl"></div>
  <div class="ni-corner ni-tr"></div>
  <div id="cat-wrap">
    <div id="cat-holo">
      <img id="biz-cat-img" src="/bizli-hologram.png" alt="Bizli">
      <span class="eyelid el"></span>
      <span class="eyelid er"></span>
      <div class="cat-scanline"></div>
      <div class="cat-glare"></div>
    </div>
    <div class="holo-butterfly" id="holo-butterfly" aria-hidden="true">
      <svg viewBox="0 0 40 34" width="26" height="22" xmlns="http://www.w3.org/2000/svg">
        <g class="bf-body" fill="none" stroke="rgba(61,219,217,0.95)" stroke-width="1.1">
          <path class="bf-wing bf-wl" d="M20 17 C 8 2, -2 6, 4 16 C -2 26, 10 32, 20 17 Z"
                fill="rgba(0,212,255,0.30)"/>
          <path class="bf-wing bf-wr" d="M20 17 C 32 2, 42 6, 36 16 C 42 26, 30 32, 20 17 Z"
                fill="rgba(0,212,255,0.30)"/>
          <line x1="20" y1="9" x2="20" y2="25" stroke="rgba(0,212,255,0.9)" stroke-width="1.4" stroke-linecap="round"/>
        </g>
      </svg>
    </div>
  </div>
  <div id="orb-info">
    <div class="ni-status-label">STATUS</div>
    <div id="orb-status">&#x25C9; CORE SYSTEM</div>
    <div id="orb-brain">INITIALIZING</div>
    <div id="orb-sub">awaiting first sync</div>
    <div id="orb-stable">AI CORE STABLE</div>
  </div>
</div>
<!-- BRAIN PIPELINE -->
<div class="panel" id="drive-section">
  <div class="ptitle">BRAIN PIPELINE</div>
  <div class="pl-wrap">
    <div class="plnode plnode-primary" id="pn-groq">
      <div class="pldot" id="pn-groq-dot"></div>
      <div class="plname">GROQ</div>
      <div class="plsub">AI Core</div>
    </div>
    <div class="plarrow">&#x2192;</div>
    <div class="plnode" id="pn-cer">
      <div class="pldot"></div>
      <div class="plname">CEREBRAS</div>
      <div class="plsub">Fallback #1</div>
    </div>
    <div class="plarrow">&#x2192;</div>
    <div class="plnode" id="pn-or">
      <div class="pldot"></div>
      <div class="plname">OPENROUTER</div>
      <div class="plsub">Fallback #2</div>
    </div>
    <div class="plarrow">&#x2192;</div>
    <div class="plnode plnode-last" id="pn-cf">
      <div class="pldot"></div>
      <div class="plname">WORKER AI</div>
      <div class="plsub">Task Assist</div>
    </div>
  </div>
  <div class="pl-lab-row">
    <span class="pldot pldot-lab"></span>
    <span style="font-size:.6rem;letter-spacing:.08em;color:var(--amber)">GEMINI mode active &mdash; not in chain</span>
  </div>
  <div class="pl-divider"></div>
  <div style="font-size:.65rem;color:var(--muted);letter-spacing:.1em;margin-bottom:5px">RECENT CALLS</div>
  <div id="drive-list" style="display:flex;flex-direction:column;gap:4px;max-height:110px;overflow-y:auto">
    <div class="skel-row"></div>
    <div class="skel-row" style="max-width:80%"></div>
    <div class="skel-row" style="max-width:65%"></div>
  </div>
  <div class="pl-divider"></div>
  <div class="mini-lb-title">USER LEADERBOARD</div>
  <div id="mini-user-list">
    <div class="skel-row"></div>
    <div class="skel-row" style="max-width:80%"></div>
    <div class="skel-row" style="max-width:65%"></div>
  </div>
  <div class="lc-box"><span class="lc-tag">SYS.STREAM &middot; live</span><div id="lc-stream" class="lc-stream"></div></div>
</div>`;
