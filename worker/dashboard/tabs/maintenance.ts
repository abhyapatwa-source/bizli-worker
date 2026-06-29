export const MAINTENANCE_HTML = `<div class="panel" id="maintenance-section">
  <div class="ptitle">MAINTENANCE</div>

  <div id="maint-status-box" class="maint-status maint-off">
    <span class="bdot bdot-green"></span>
    MAINTENANCE OFF &mdash; System live
  </div>
  <div id="maint-users" style="font-size:.7rem;color:var(--muted);margin-bottom:16px;padding:0 2px">&mdash; approved users currently active</div>

  <div style="font-size:.72rem;color:var(--muted);letter-spacing:.12em;margin-bottom:8px">TOGGLE VIA TELEGRAM</div>
  <div class="maint-cmd" onclick="copyCmd('!maint on')">
    <code>!maint on</code>
    <span style="font-size:.62rem;color:var(--muted)">Lock users out &rarr;</span>
  </div>
  <div class="maint-cmd" onclick="copyCmd('!maint off')">
    <code>!maint off</code>
    <span style="font-size:.62rem;color:var(--muted)">Bring users back &rarr;</span>
  </div>

  <div style="font-size:.72rem;color:var(--muted);letter-spacing:.12em;margin-top:16px;margin-bottom:8px">QUICK COMMANDS</div>
  <div class="maint-cmd" onclick="copyCmd('!agent refresh models')">
    <code>!agent refresh models</code>
    <span style="font-size:.62rem;color:var(--muted)">Force model probe &rarr;</span>
  </div>
  <div class="maint-cmd" onclick="copyCmd('!agent models')">
    <code>!agent models</code>
    <span style="font-size:.62rem;color:var(--muted)">Show active models &rarr;</span>
  </div>
  <div class="maint-cmd" onclick="copyCmd('!agent status')">
    <code>!agent status</code>
    <span style="font-size:.62rem;color:var(--muted)">Full health check &rarr;</span>
  </div>

  <div id="maint-copy-toast" style="display:none;margin-top:10px;font-size:.68rem;color:var(--green);text-align:center;letter-spacing:.08em">Copied to clipboard</div>
  <div style="margin-top:12px;font-size:.62rem;color:var(--muted);line-height:1.6;padding:8px;background:rgba(0,212,255,.03);border-radius:6px;border:1px solid rgba(0,212,255,.07)">
    Click any command above to copy it, then paste in Telegram to @BizliAI_bot
  </div>
</div>`;
