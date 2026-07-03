export const BRAINS_HTML = `<div id="brains-section" class="panel">
  <div class="ptitle">BRAIN CHAIN</div>
  <div class="brain-grid">

    <div class="bcrd">
      <div class="bcrd-hdr">GROQ <span class="bpill bprimary">PRIMARY</span></div>
      <div class="bstat-row">
        <span class="bdot" id="b-groq-dot"></span>
        <span class="bstat-lbl" id="b-groq-status">&#8212;</span>
      </div>
      <div class="brow"><span class="bk">Keys</span><span class="bv" id="b-groq-keys">&#8212;</span></div>
      <div class="brow"><span class="bk">Models</span><span class="bv bmodels" id="b-groq-model">—</span></div>
      <div class="brow"><span class="bk">Last fired</span><span class="bv" id="b-groq-last">&#8212;</span></div>
    </div>

    <div class="bcrd">
      <div class="bcrd-hdr">CEREBRAS <span class="bpill bfallback">FALLBACK #1</span></div>
      <div class="bstat-row">
        <span class="bdot" id="b-cer-dot"></span>
        <span class="bstat-lbl" id="b-cer-status">&#8212;</span>
      </div>
      <div class="brow"><span class="bk">Keys</span><span class="bv" id="b-cer-keys">&#8212;</span></div>
      <div class="brow"><span class="bk">Models</span><span class="bv bmodels" id="b-cer-models">—</span></div>
      <div class="brow"><span class="bk">Last fired</span><span class="bv" id="b-cer-last">&#8212;</span></div>
    </div>

    <div class="bcrd">
      <div class="bcrd-hdr">OPENROUTER <span class="bpill bfallback">FALLBACK #2</span></div>
      <div class="bstat-row">
        <span class="bdot" id="b-or-dot"></span>
        <span class="bstat-lbl" id="b-or-status">&#8212;</span>
      </div>
      <div class="brow"><span class="bk">Key</span><span class="bv" id="b-or-key">&#8212;</span></div>
      <div class="brow"><span class="bk">Models</span><span class="bv bmodels" id="b-or-models">—</span></div>
      <div class="brow"><span class="bk">Last fired</span><span class="bv" id="b-or-last">&#8212;</span></div>
    </div>

    <div class="bcrd">
      <div class="bcrd-hdr">WORKER AI <span class="bpill blast">LAST RESORT</span></div>
      <div class="bstat-row">
        <span class="bdot bdot-standby"></span>
        <span class="bstat-lbl" style="color:var(--muted)">STANDBY</span>
      </div>
      <div class="brow"><span class="bk">Model</span><span class="bv">@cf/meta/llama-3.1-8b-instruct</span></div>
      <div class="brow"><span class="bk">Quota</span><span class="bv" style="color:var(--muted)">Cloudflare native</span></div>
      <div class="brow"><span class="bk">Last fired</span><span class="bv" id="b-cf-last">&#8212;</span></div>
    </div>

    <div class="bcrd">
      <div class="bcrd-hdr">GEMINI <span class="bpill blab">LAB-ONLY</span></div>
      <div class="bstat-row">
        <span class="bdot bdot-lab"></span>
        <span class="bstat-lbl" style="color:var(--amber)">LAB AGENT</span>
      </div>
      <div class="brow"><span class="bk">Keys</span><span class="bv" id="b-gem-keys">&#8212;</span></div>
      <div class="brow"><span class="bk">Models</span><span class="bv bmodels" id="b-gem-models">—</span></div>
      <div class="brow"><span class="bk">Calls today</span><span class="bv" id="b-gem-calls">&#8212;</span></div>
      <div class="brow"><span class="bk" style="color:var(--muted);font-size:.65rem">Not in Bizli&#39;s chain</span><span></span></div>
    </div>

  </div>
</div>`;
