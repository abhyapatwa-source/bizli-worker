export const ORB_HTML = `<!-- BIZLI CAT -->
<div class="panel" id="orb-section">
  <div class="ni-hdr">
    <div class="ni-title">NEURAL INTERFACE</div>
    <div class="ni-sub">GROQ &nbsp;&#183;&nbsp; AI ENTITY</div>
  </div>
  <div class="ni-corner ni-tl"></div>
  <div class="ni-corner ni-tr"></div>
  <div id="cat-wrap">
    <div class="ring r1"></div>
    <div class="ring r2"></div>
    <div class="ring r3"></div>
    <div class="ring r4"></div>
    <div class="ring r5"></div>
    <div id="cat-holo">
      <img id="cat-img" src="/bizli-cat.png" alt="Bizli">
      <div class="cat-scanline"></div>
      <div class="cat-glare"></div>
    </div>
    <div class="particle pa1"></div>
    <div class="particle pa2"></div>
    <div class="particle pa3"></div>
    <div class="particle pa4"></div>
    <div class="particle pa5"></div>
    <div class="particle pa6"></div>
    <div class="particle pa7"></div>
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
    <div class="plnode" id="pn-or">
      <div class="pldot"></div>
      <div class="plname">OPENROUTER</div>
      <div class="plsub">Tools Core</div>
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
  <div id="drive-list" style="display:flex;flex-direction:column;gap:4px;max-height:130px;overflow-y:auto">
    <div class="skel-row"></div>
    <div class="skel-row" style="max-width:80%"></div>
    <div class="skel-row" style="max-width:65%"></div>
  </div>
</div>`;
