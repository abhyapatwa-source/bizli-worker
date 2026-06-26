export const GATE_HTML = `<div id="gate">
  <div class="gate-box">
    <div class="gate-logo">&#x2B21;</div>
    <h2>BIZLI LAB</h2>
    <p>Admin command center &#8212; restricted access</p>
    <form id="pw-form" onsubmit="submitPw();return false;">
      <input id="pw-input" type="password" placeholder="Enter admin password" autocomplete="off">
      <button type="submit" id="pw-btn">ENTER</button>
    </form>
    <div id="pw-err"></div>
  </div>
</div>`;
