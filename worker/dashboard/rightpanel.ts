export const RIGHT_PANEL_HTML = `<div id="lab">
  <div id="lab-hdr">
    <div style="flex:1;min-width:0">
      <span class="lab-title">LAB AGENT</span>
      <div class="lab-subtitle">AI ASSIST <span class="lab-dot-inline"></span> ONLINE</div>
    </div>
    <button id="lab-snd-btn" onclick="labCycleVolume()" title="Volume: OFF &#8594; LOW &#8594; MED &#8594; HIGH">&#9675; SND</button>
    <span class="lab-dot"></span>
    <button id="lab-close" onclick="closeAgent()" title="Close">&#10005;</button>
  </div>
  <div id="lab-va">
    <div class="lva-title">VISION AI ASSISTANT</div>
    <div class="lva-row">
      <div class="lva-text-col">
        <div class="lva-desc">Monitoring system vitals, vision model updates, and tool-chain diagnostics.</div>
      </div>
      <div class="lva-img-col">
        <img id="vai-robot-img" src="/bizli-robot.png" alt="AI Entity"
             onerror="this.style.display='none';var o=document.getElementById('lva-orb');if(o)o.style.display='flex'">
        <div id="lva-orb">
          <div class="vai-ring vai-r3"></div>
          <div class="vai-ring vai-r2"></div>
          <div class="vai-ring vai-r1"></div>
          <div class="vai-core"></div>
          <div class="vai-node vai-n1"></div>
          <div class="vai-node vai-n2"></div>
          <div class="vai-node vai-n3"></div>
        </div>
      </div>
    </div>
    <div id="lab-quick">
      <div class="lqa" onclick="labQuickAction('Check system health and report all key metrics')">Check system health</div>
      <div class="lqa" onclick="labQuickAction('Show me the live feed of recent AI brain calls and errors')">View live feed</div>
      <div class="lqa" onclick="labQuickAction('Run a full diagnostic and identify any issues')">Run diagnostics</div>
    </div>
  </div>
  <div id="lab-body">
    <div class="lbsys">Lab Agent online. Ready.</div>
  </div>
  <div id="lab-proc">Processing...</div>
  <div id="lab-quota-bar">
    <div id="lab-quota-text">Quota: &#8212;</div>
    <div id="lab-quota-track"><div id="lab-quota-fill"></div></div>
  </div>
  <div id="lab-input">
    <textarea id="lab-ta" rows="1" placeholder="Ask something..."></textarea>
    <button id="lab-send">&#9658;</button>
  </div>
</div>
<button id="lab-btn" onclick="labToggleDesktop()">&#8250;</button>`;
