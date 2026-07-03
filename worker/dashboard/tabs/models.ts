export const MODELS_HTML = `<div class="panel" id="models-section">
  <div class="ptitle">MODELS <span id="m-lastprobe" style="font-size:.6rem;color:var(--muted);font-weight:400;letter-spacing:.04em;margin-left:6px"></span></div>

  <div class="mgroup-hdr">GROQ TEXT <span class="bpill bprimary" style="font-size:.6rem;margin-left:6px">PRIMARY BRAIN</span></div>
  <div id="m-groq-text" class="mmodel-list">
    <div class="mmodel-loading">Loading&hellip;</div>
  </div>
  <div class="msub">Up to 4 live &middot; tried in order 1&#x2192;4 &middot; 16 keys each &middot; auto-heals every 12h</div>

  <div class="mgroup-hdr" style="margin-top:14px">GROQ VISION</div>
  <div class="mmodel-list">
    <div class="mmodel-item">
      <span class="mmodel-num">1.</span>
      <span class="mmodel-id" id="m-groq-vision">—</span>
      <span class="mmodel-tag mmodel-tag-vis">VISION</span>
    </div>
  </div>
  <div class="msub" style="margin-bottom:16px">Image understanding &middot; locked, not rotated</div>

  <div class="mgroup-hdr" style="margin-top:14px">CEREBRAS <span class="bpill bfallback" style="font-size:.6rem;margin-left:6px">FALLBACK #1</span></div>
  <div id="m-cer-list" class="mmodel-list">
    <div class="mmodel-loading">Loading&hellip;</div>
  </div>
  <div class="msub">Auto-discovered &middot; steps in when Groq is exhausted</div>

  <div class="mgroup-hdr" style="margin-top:14px">OPENROUTER FREE POOL <span class="bpill bfallback" style="font-size:.6rem;margin-left:6px">FALLBACK #2</span></div>
  <div id="m-or-list" class="mmodel-list">
    <div class="mmodel-loading">Loading&hellip;</div>
  </div>
  <div class="msub">Auto-fetched :free models &middot; key rotation ready</div>

  <div class="mgroup-hdr" style="margin-top:14px">GEMINI LAB <span class="bpill blab" style="font-size:.6rem;margin-left:6px">LAB-ONLY</span></div>
  <div id="m-gemini-text" class="mmodel-list">
    <div class="mmodel-loading">Loading&hellip;</div>
  </div>
  <div class="msub">Up to 3 live &middot; 4 keys each &middot; Lab Agent only &middot; not in Bizli chat</div>

  <div style="margin-top:16px;padding-top:10px;border-top:1px solid rgba(0,212,255,.07);display:flex;align-items:center;gap:8px">
    <span class="adot active"></span>
    <span style="font-size:.68rem;color:var(--muted)">Auto-heal active &middot; probes every 12h &middot; Telegram alert if changed &middot; run <code style="color:var(--cyan)">!agent refresh models</code> to force now</span>
  </div>
</div>`;
