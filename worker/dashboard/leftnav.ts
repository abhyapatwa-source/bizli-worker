export const LEFTNAV_HTML = `<nav id="leftnav">
  <div id="lnav-brand">
    <span class="lnav-logo">&#x2B21; BIZLI LAB</span>
    <span class="lnav-ver" id="lnav-ver"></span>
  </div>
  <div id="lnav-tabs">
    <div class="lnav-item active" data-tab="overview" onclick="switchTab('overview')"><i data-lucide="eye"></i><span>Overview</span></div>
    <div class="lnav-item" data-tab="keys" onclick="switchTab('keys')"><i data-lucide="key"></i><span>Keys</span></div>
    <div class="lnav-item" data-tab="errors" onclick="switchTab('errors')"><i data-lucide="alert-triangle"></i><span>Errors</span></div>
    <div class="lnav-item" data-tab="tools" onclick="switchTab('tools')"><i data-lucide="wrench"></i><span>Tools</span></div>
    <div class="lnav-item" data-tab="users" onclick="switchTab('users')"><i data-lucide="users"></i><span>Users</span></div>
    <div class="lnav-item" data-tab="vitals" onclick="switchTab('vitals')"><i data-lucide="activity"></i><span>Vitals</span></div>
    <div class="lnav-sep"></div>
    <div class="lnav-item" data-tab="brains" onclick="switchTab('brains')"><i data-lucide="brain"></i><span>Brains</span></div>
    <div class="lnav-item" data-tab="models" onclick="switchTab('models')"><i data-lucide="cpu"></i><span>Models</span></div>
    <div class="lnav-item" data-tab="livefeed" onclick="switchTab('livefeed')"><i data-lucide="zap"></i><span>Live Feed</span></div>
    <div class="lnav-item" data-tab="maintenance" onclick="switchTab('maintenance')"><i data-lucide="settings"></i><span>Maintenance</span></div>
    <div class="lnav-item" data-tab="tests" onclick="switchTab('tests')"><i data-lucide="check-circle"></i><span>Tests</span></div>
  </div>
  <div id="lnav-foot">
    <span class="live-dot"></span>
    <span class="live-txt">LIVE</span>
  </div>
</nav>`;
