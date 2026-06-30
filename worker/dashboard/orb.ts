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
      <svg id="biz-cat" viewBox="0 0 188 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="display:block;cursor:pointer">
        <defs>
          <filter id="cglow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="eglow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <radialGradient id="bdygrad" cx="38%" cy="35%" r="62%">
            <stop offset="0%" stop-color="rgba(0,212,255,0.22)"/>
            <stop offset="100%" stop-color="rgba(0,30,70,0.07)"/>
          </radialGradient>
          <radialGradient id="hdgrad" cx="36%" cy="32%" r="60%">
            <stop offset="0%" stop-color="rgba(0,212,255,0.18)"/>
            <stop offset="100%" stop-color="rgba(0,20,50,0.05)"/>
          </radialGradient>
        </defs>
        <!-- Tail (behind body) -->
        <g id="tail-grp">
          <path d="M 148 178 C 175 188, 180 154, 164 132 C 150 114, 130 112, 120 128"
                fill="none" stroke="rgba(0,212,255,0.72)" stroke-width="5.5"
                stroke-linecap="round" filter="url(#cglow)"/>
          <ellipse cx="120" cy="132" rx="7" ry="5"
                   fill="rgba(0,212,255,0.18)" stroke="rgba(0,212,255,0.65)" stroke-width="1.2" filter="url(#cglow)"/>
        </g>
        <!-- Body -->
        <ellipse cx="94" cy="170" rx="50" ry="52"
                 fill="url(#bdygrad)" stroke="rgba(0,212,255,0.82)" stroke-width="1.5" filter="url(#cglow)"/>
        <!-- Front paws -->
        <ellipse cx="72" cy="215" rx="17" ry="9"
                 fill="rgba(0,212,255,0.13)" stroke="rgba(0,212,255,0.7)" stroke-width="1.3" filter="url(#cglow)"/>
        <ellipse cx="116" cy="215" rx="17" ry="9"
                 fill="rgba(0,212,255,0.13)" stroke="rgba(0,212,255,0.7)" stroke-width="1.3" filter="url(#cglow)"/>
        <!-- Paw toe lines -->
        <line x1="63" y1="213" x2="63" y2="221" stroke="rgba(0,212,255,0.45)" stroke-width="0.9" stroke-linecap="round"/>
        <line x1="72" y1="212" x2="72" y2="222" stroke="rgba(0,212,255,0.45)" stroke-width="0.9" stroke-linecap="round"/>
        <line x1="81" y1="213" x2="81" y2="221" stroke="rgba(0,212,255,0.45)" stroke-width="0.9" stroke-linecap="round"/>
        <line x1="107" y1="213" x2="107" y2="221" stroke="rgba(0,212,255,0.45)" stroke-width="0.9" stroke-linecap="round"/>
        <line x1="116" y1="212" x2="116" y2="222" stroke="rgba(0,212,255,0.45)" stroke-width="0.9" stroke-linecap="round"/>
        <line x1="125" y1="213" x2="125" y2="221" stroke="rgba(0,212,255,0.45)" stroke-width="0.9" stroke-linecap="round"/>
        <!-- Head -->
        <circle cx="94" cy="98" r="40"
                fill="url(#hdgrad)" stroke="rgba(0,212,255,0.88)" stroke-width="1.5" filter="url(#cglow)"/>
        <!-- Left ear -->
        <g id="ear-l-grp">
          <polygon points="62,83 58,52 85,80"
                   fill="rgba(0,212,255,0.14)" stroke="rgba(0,212,255,0.82)" stroke-width="1.5" stroke-linejoin="round" filter="url(#cglow)"/>
          <polygon points="66,80 64,58 80,78"
                   fill="rgba(61,219,217,0.28)" stroke="rgba(61,219,217,0.5)" stroke-width="0.8" stroke-linejoin="round"/>
        </g>
        <!-- Right ear -->
        <g id="ear-r-grp">
          <polygon points="103,80 130,52 126,83"
                   fill="rgba(0,212,255,0.14)" stroke="rgba(0,212,255,0.82)" stroke-width="1.5" stroke-linejoin="round" filter="url(#cglow)"/>
          <polygon points="108,78 124,58 122,80"
                   fill="rgba(61,219,217,0.28)" stroke="rgba(61,219,217,0.5)" stroke-width="0.8" stroke-linejoin="round"/>
        </g>
        <!-- Left eye -->
        <g id="eye-l-grp">
          <ellipse id="eye-left-outer" cx="77" cy="97" rx="11" ry="12"
                   fill="rgba(0,8,22,0.9)" stroke="rgba(0,212,255,0.72)" stroke-width="1.2"/>
          <ellipse id="pupil-left" cx="77" cy="97" rx="5" ry="8.5"
                   fill="rgba(0,212,255,0.95)" filter="url(#eglow)"/>
          <circle id="shine-left" cx="80" cy="92" r="2.5" fill="rgba(255,255,255,0.92)"/>
        </g>
        <!-- Right eye -->
        <g id="eye-r-grp">
          <ellipse id="eye-right-outer" cx="111" cy="97" rx="11" ry="12"
                   fill="rgba(0,8,22,0.9)" stroke="rgba(0,212,255,0.72)" stroke-width="1.2"/>
          <ellipse id="pupil-right" cx="111" cy="97" rx="5" ry="8.5"
                   fill="rgba(0,212,255,0.95)" filter="url(#eglow)"/>
          <circle id="shine-right" cx="114" cy="92" r="2.5" fill="rgba(255,255,255,0.92)"/>
        </g>
        <!-- Nose -->
        <polygon points="91,111 94,116 97,111" fill="rgba(61,219,217,0.92)" stroke="rgba(61,219,217,0.5)" stroke-width="0.6"/>
        <!-- Mouth -->
        <path d="M 94 116 Q 88 123 84 120" fill="none" stroke="rgba(0,212,255,0.62)" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M 94 116 Q 100 123 104 120" fill="none" stroke="rgba(0,212,255,0.62)" stroke-width="1.2" stroke-linecap="round"/>
        <!-- Whiskers left -->
        <g opacity="0.6" filter="url(#cglow)">
          <line x1="82" y1="110" x2="46" y2="104" stroke="rgba(0,212,255,0.85)" stroke-width="0.75"/>
          <line x1="82" y1="114" x2="46" y2="114" stroke="rgba(0,212,255,0.85)" stroke-width="0.75"/>
          <line x1="82" y1="118" x2="46" y2="124" stroke="rgba(0,212,255,0.85)" stroke-width="0.75"/>
        </g>
        <!-- Whiskers right -->
        <g opacity="0.6" filter="url(#cglow)">
          <line x1="106" y1="110" x2="142" y2="104" stroke="rgba(0,212,255,0.85)" stroke-width="0.75"/>
          <line x1="106" y1="114" x2="142" y2="114" stroke="rgba(0,212,255,0.85)" stroke-width="0.75"/>
          <line x1="106" y1="118" x2="142" y2="124" stroke="rgba(0,212,255,0.85)" stroke-width="0.75"/>
        </g>
        <!-- Scan line inside SVG -->
        <rect id="cat-scan-svg" x="0" y="-8" width="188" height="5" fill="rgba(0,212,255,0.16)" rx="0"/>
        <!-- Glitch bars -->
        <rect id="glitch-1" x="0" y="60" width="188" height="2" fill="rgba(0,212,255,0.45)" opacity="0"/>
        <rect id="glitch-2" x="18" y="120" width="152" height="1" fill="rgba(255,255,255,0.3)" opacity="0"/>
        <!-- Decorative base lines -->
        <line x1="10" y1="232" x2="46" y2="232" stroke="rgba(0,212,255,0.28)" stroke-width="0.8"/>
        <line x1="142" y1="232" x2="178" y2="232" stroke="rgba(0,212,255,0.28)" stroke-width="0.8"/>
        <line x1="10" y1="236" x2="34" y2="236" stroke="rgba(0,212,255,0.16)" stroke-width="0.5"/>
        <line x1="154" y1="236" x2="178" y2="236" stroke="rgba(0,212,255,0.16)" stroke-width="0.5"/>
      </svg>
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
</div>`;
