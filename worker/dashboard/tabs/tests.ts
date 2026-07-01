export const TESTS_HTML = `<!-- QUALITY TESTS -->
<div class="panel" id="tests-section">
  <div class="ptitle">QUALITY TESTING <span id="t-grade" class="bpill bprimary">LOADING</span></div>
  <div class="msub" id="t-lastrun">last run: never</div>
  <div class="mgroup-hdr" style="margin-top:10px">7-DAY PASS RATE</div>
  <div class="tpass-wrap">
    <div class="tpass-num" id="t-passrate">—%</div>
    <div class="tpass-bar-track"><div class="tpass-bar" id="t-passbar" style="width:0%"></div></div>
  </div>
  <div class="mgroup-hdr" style="margin-top:14px">RECENT TEST RUNS</div>
  <div id="t-results">
    <div class="skel-row"></div>
    <div class="skel-row" style="max-width:80%"></div>
    <div class="skel-row" style="max-width:65%"></div>
  </div>
  <div class="msub" style="margin-top:12px">Tests run automatically every 6h via cron. 5 tests per run: greeting, Hindi, identity, name, weather tool.</div>
</div>`;
