export const LEFTNAV_HTML = `<nav id="leftnav">
  <div id="lnav-brand">
    <span class="lnav-logo">&#x2B21; BIZLI LAB</span>
    <span class="lnav-ver" id="lnav-ver"></span>
  </div>
  <div id="lnav-tabs">
    <div class="lnav-item active" data-tab="overview" onclick="switchTab('overview')"><i data-lucide="eye"></i><span>OVERVIEW</span></div>
    <div class="lnav-item" data-tab="keys" onclick="switchTab('keys')"><i data-lucide="key"></i><span>KEYS</span></div>
    <div class="lnav-item" data-tab="errors" onclick="switchTab('errors')"><i data-lucide="alert-triangle"></i><span>ERRORS</span></div>
    <div class="lnav-item" data-tab="tools" onclick="switchTab('tools')"><i data-lucide="wrench"></i><span>TOOLS</span></div>
    <div class="lnav-item" data-tab="users" onclick="switchTab('users')"><i data-lucide="users"></i><span>USERS</span></div>
    <div class="lnav-item" data-tab="vitals" onclick="switchTab('vitals')"><i data-lucide="activity"></i><span>VITALS</span></div>
    <div class="lnav-sep"></div>
    <div class="lnav-item" data-tab="brains" onclick="switchTab('brains')"><i data-lucide="brain"></i><span>BRAINS</span></div>
    <div class="lnav-item" data-tab="models" onclick="switchTab('models')"><i data-lucide="cpu"></i><span>MODELS</span></div>
    <div class="lnav-item" data-tab="livefeed" onclick="switchTab('livefeed')"><i data-lucide="zap"></i><span>LIVE FEED</span></div>
    <div class="lnav-item" data-tab="maintenance" onclick="switchTab('maintenance')"><i data-lucide="settings"></i><span>MAINTENANCE</span></div>
    <div class="lnav-item" data-tab="tests" onclick="switchTab('tests')"><i data-lucide="check-circle"></i><span>TESTS</span></div>
    <div class="lnav-item" data-tab="settings" onclick="switchTab('settings')"><i data-lucide="sliders"></i><span>SETTINGS</span></div>
    <div class="lnav-item lnav-agent" onclick="openAgent()"><i data-lucide="message-square"></i><span>AGENT</span></div>
  </div>
  <div id="lnav-foot">
    <span class="live-dot"></span>
    <span class="live-txt">LIVE SYSTEM</span>
  </div>
</nav>`;
