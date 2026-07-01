export const TOPBAR_HTML = `<div id="topbar">
  <span class="t-logo">&#x2B21; BIZLI LAB</span>
  <div class="t-live"><span class="live-dot"></span><span class="live-txt">LIVE</span></div>
  <div id="health-pct">
    <span class="h-integrity">&#8593; SYSTEM INTEGRITY</span>
    <canvas id="ekg-canvas" width="80" height="22"></canvas>
    <span class="h-dot"></span>
    <span class="h-num">&#8212;</span>
    <span class="h-lbl">LOADING</span>
  </div>
  <span id="sync-time">connecting...</span>
  <div id="t-lab-status">
    <div class="t-lab-name">LAB AGENT</div>
    <div class="t-lab-sub">AI ASSIST <span class="lab-dot-inline"></span> ONLINE</div>
  </div>
  <span class="t-lab-arrows">&#8594; &#8594;</span>
  <span class="live-dot" style="flex-shrink:0;width:6px;height:6px"></span>
</div>`;
