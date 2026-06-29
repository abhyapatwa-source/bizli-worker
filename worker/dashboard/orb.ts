export const ORB_HTML = `<!-- ORB -->
<div class="panel" id="orb-section">
  <div id="orb-wrap">
    <div class="ring r1"></div>
    <div class="ring r2"></div>
    <div class="ring r3"></div>
    <div id="orb"></div>
    <div class="particle pa1"></div>
    <div class="particle pa2"></div>
    <div class="particle pa3"></div>
    <div class="particle pa4"></div>
    <div class="particle pa5"></div>
  </div>
  <div id="orb-info">
    <div id="orb-status">&#x25C9; CORE SYSTEM</div>
    <div id="orb-brain">INITIALIZING</div>
    <div id="orb-sub">awaiting first sync</div>
  </div>
</div>
<!-- BRAIN PIPELINE -->
<div class="panel" id="drive-section">
  <div class="ptitle">BRAIN PIPELINE</div>
  <div class="pl-wrap">
    <div class="plnode plnode-primary" id="pn-groq">
      <div class="pldot" id="pn-groq-dot"></div>
      <div class="plname">GROQ</div>
      <div class="plsub" id="pn-groq-sub">—/16 ready</div>
    </div>
    <div class="plarrow">&#x2192;</div>
    <div class="plnode" id="pn-or">
      <div class="pldot"></div>
      <div class="plname">OPENROUTER</div>
      <div class="plsub">free tier</div>
    </div>
    <div class="plarrow">&#x2192;</div>
    <div class="plnode plnode-last" id="pn-cf">
      <div class="pldot"></div>
      <div class="plname">WORKER AI</div>
      <div class="plsub">last resort</div>
    </div>
  </div>
  <div class="pl-lab-row">
    <span class="pldot pldot-lab"></span>
    <span style="font-size:.6rem;letter-spacing:.08em;color:var(--amber)">GEMINI</span>
    <span class="plsub" style="margin-left:4px">lab only &mdash; not in chain</span>
  </div>
  <div class="pl-divider"></div>
  <div style="font-size:.65rem;color:var(--muted);letter-spacing:.1em;margin-bottom:5px">RECENT CALLS</div>
  <div id="drive-list" style="display:flex;flex-direction:column;gap:4px;max-height:130px;overflow-y:auto">
    <div style="color:var(--muted);font-size:.68rem">awaiting data...</div>
  </div>
</div>`;
