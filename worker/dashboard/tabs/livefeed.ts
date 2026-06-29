export const LIVEFEED_HTML = `<div class="panel" id="livefeed-section">
  <div class="ptitle">LIVE FEED <span style="font-size:.6rem;color:var(--muted);font-weight:400;letter-spacing:.04em;margin-left:6px">auto-refreshes every 3s</span></div>

  <div style="margin-bottom:14px">
    <div style="font-size:.72rem;color:var(--muted);letter-spacing:.12em;margin-bottom:7px">BRAIN ACTIVITY</div>
    <div id="lf-brains" style="display:flex;flex-direction:column;gap:5px;max-height:260px;overflow-y:auto">
      <div style="color:var(--muted);font-size:.72rem;padding:4px">Waiting for activity&hellip;</div>
    </div>
  </div>

  <div style="border-top:1px solid rgba(0,212,255,.07);padding-top:12px">
    <div style="font-size:.72rem;color:var(--muted);letter-spacing:.12em;margin-bottom:7px">ERROR LOG</div>
    <div id="lf-errors" style="font-family:'Courier New',monospace;font-size:.72rem;line-height:1.65;color:#22c55e;background:#030805;border-radius:6px;padding:9px;max-height:300px;overflow-y:auto;border:1px solid rgba(34,197,94,.18)">
      <div class="no-err">&#9632; All systems nominal</div>
    </div>
  </div>
</div>`;
