export const SETTINGS_HTML = `<div class="panel" id="settings-section">
  <div class="ptitle">SETTINGS</div>

  <!-- BACKGROUND MUSIC -->
  <div class="set-block">
    <div class="set-hdr"><i data-lucide="music"></i> BACKGROUND MUSIC</div>
    <div class="set-desc">Procedural ambient soundscapes &mdash; generated live in your browser, no downloads. Pick a vibe.</div>
    <div id="mus-now" class="mus-now">Nothing playing</div>
    <div id="music-grid" class="mus-grid"></div>
    <div class="set-row">
      <span class="set-lbl">VOLUME</span>
      <input id="mus-vol" type="range" min="0" max="100" value="50" class="set-slider">
    </div>
    <div class="set-row">
      <button id="mus-stop" class="set-btn" onclick="BizStopMusic()">&#9632; STOP</button>
      <label class="set-check" style="margin-bottom:0"><input type="checkbox" id="mus-auto"> <span>Resume music on next visit</span></label>
    </div>
  </div>

  <!-- SOUND EFFECTS -->
  <div class="set-block">
    <div class="set-hdr"><i data-lucide="volume-2"></i> SOUND EFFECTS</div>
    <label class="set-check"><input type="checkbox" id="set-sfx" checked> <span>UI sound effects (Bizli chirp on click)</span></label>
  </div>

  <!-- DISPLAY -->
  <div class="set-block">
    <div class="set-hdr"><i data-lucide="monitor"></i> DISPLAY</div>
    <label class="set-check"><input type="checkbox" id="set-motion"> <span>Reduce motion (disable animations)</span></label>
  </div>

  <div id="set-toast" class="set-toast">Saved</div>
</div>`;
