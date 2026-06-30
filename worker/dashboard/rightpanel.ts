export const RIGHT_PANEL_HTML = `<div id="lab">
  <div id="lab-hdr">
    <span class="lab-title">LAB AGENT</span>
    <button id="lab-snd-btn" onclick="labToggleSound()" title="Enable ambient sound">&#9675; SND</button>
    <span class="lab-dot"></span>
  </div>
  <div id="lab-body">
    <div class="lbsys">Lab Agent online. Read-only diagnostics.</div>
  </div>
  <div id="lab-proc">Processing...</div>
  <div id="lab-quota-bar">
    <div id="lab-quota-text">Quota: —</div>
    <div id="lab-quota-track"><div id="lab-quota-fill"></div></div>
  </div>
  <div id="lab-input">
    <textarea id="lab-ta" rows="1" placeholder="Ask about system health..."></textarea>
    <button id="lab-send">&#9658;</button>
  </div>
</div>
<button id="lab-btn" onclick="labToggleDesktop()">&#8250;</button>
<button id="lab-toggle" onclick="labToggle()">LAB</button>`;
