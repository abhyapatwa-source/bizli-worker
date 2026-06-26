import { DASHBOARD_STYLES } from './dashboard/styles';
import { GATE_HTML } from './dashboard/gate';
import { TOPBAR_HTML } from './dashboard/topbar';
import { LEFTNAV_HTML } from './dashboard/leftnav';
import { ORB_HTML } from './dashboard/orb';
import { RIGHT_PANEL_HTML } from './dashboard/rightpanel';
import { DASHBOARD_SCRIPTS } from './dashboard/scripts';
import { OVERVIEW_HTML } from './dashboard/tabs/overview';
import { KEYS_HTML } from './dashboard/tabs/keys';
import { ERRORS_HTML } from './dashboard/tabs/errors';
import { TOOLS_HTML } from './dashboard/tabs/tools';
import { USERS_HTML } from './dashboard/tabs/users';
import { VITALS_HTML } from './dashboard/tabs/vitals';
import { BRAINS_HTML } from './dashboard/tabs/brains';
import { MODELS_HTML } from './dashboard/tabs/models';
import { LIVEFEED_HTML } from './dashboard/tabs/livefeed';
import { MAINTENANCE_HTML } from './dashboard/tabs/maintenance';

export const PRIVACY_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Privacy Policy — Bizli AI</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:40px 20px;background:#0a0a0f;color:#e8e8f0}h1{color:#a89cf7}h2{color:#7c6af7;margin-top:32px}p,li{line-height:1.8;color:#c8c8d8}a{color:#a89cf7}footer{margin-top:60px;color:#6b6b88;text-align:center}</style></head><body><h1>Privacy Policy — Bizli AI</h1><p><em>Last updated: June 2026</em></p><h2>1. Introduction</h2><p>Bizli AI is a personal AI companion built by Abhya using advanced AI research, Meta tools, and open-source resources. This policy explains how we handle your data.</p><h2>2. What We Collect</h2><ul><li>Display name and Gmail (for account recovery)</li><li>Platform identifiers (Telegram ID, Facebook ID)</li><li>Conversation history (last 30 messages)</li><li>Memories extracted from conversations</li><li>A hashed PIN (never stored in plain text)</li></ul><h2>3. How We Use It</h2><ul><li>To provide personalized AI companion experience</li><li>To remember context across conversations and platforms</li><li>For account verification and recovery</li></ul><h2>4. Data Storage</h2><p>Data is stored securely using Supabase (PostgreSQL) and Cloudflare Workers KV with encryption at rest.</p><h2>5. Your Rights</h2><p>You can delete your data anytime using !forget all and !wipememory commands, or by contacting bizlibix@gmail.com.</p><h2>6. Third-Party Services</h2><p>We use Groq (AI inference), Supabase (database), Cloudflare (hosting), Telegram and Meta APIs (messaging platforms).</p><h2>7. Contact</h2><p>Email: bizlibix@gmail.com | Bot: @BizliAI_bot</p><footer>Built with love by Abhya | Bizli AI 2026</footer></body></html>`;

export const TERMS_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Terms of Service — Bizli AI</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:40px 20px;background:#0a0a0f;color:#e8e8f0}h1{color:#a89cf7}h2{color:#7c6af7;margin-top:32px}p,li{line-height:1.8;color:#c8c8d8}a{color:#a89cf7}footer{margin-top:60px;color:#6b6b88;text-align:center}</style></head><body><h1>Terms of Service — Bizli AI</h1><p><em>Last updated: June 2026</em></p><h2>1. Acceptance</h2><p>By using Bizli AI, you agree to these terms. Bizli AI is a personal AI companion service built by Abhya.</p><h2>2. Use</h2><p>Bizli AI is for personal, non-commercial use. You must be 13+ to use this service. Do not use Bizli AI for harmful, illegal, or abusive purposes.</p><h2>3. Privacy</h2><p>Your data is handled per our Privacy Policy. We collect minimal data needed to provide the service.</p><h2>4. Availability</h2><p>We strive for 24/7 availability but cannot guarantee uninterrupted service.</p><h2>5. Contact</h2><p>Email: bizlibix@gmail.com</p><footer>Built with love by Abhya | Bizli AI 2026</footer></body></html>`;

export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BIZLI LAB — Command Center</title>
<script src="https://unpkg.com/lucide@0.344.0/dist/umd/lucide.min.js"></script>
<style>
${DASHBOARD_STYLES}
</style>
</head>
<body>
<div id="stars"></div>
<button id="lnav-ham" onclick="lnavToggle()">&#9776;</button>
${GATE_HTML}
${LEFTNAV_HTML}
<div id="app">
  ${TOPBAR_HTML}
  <div style="padding-top:4px">
    ${OVERVIEW_HTML}
    <div class="grid">
      ${ORB_HTML}
      ${KEYS_HTML}
      ${ERRORS_HTML}
      ${USERS_HTML}
      ${TOOLS_HTML}
      ${VITALS_HTML}
      ${BRAINS_HTML}
      ${MODELS_HTML}
      ${LIVEFEED_HTML}
      ${MAINTENANCE_HTML}
    </div>
  </div>
</div>
${RIGHT_PANEL_HTML}
<script>
${DASHBOARD_SCRIPTS}
</script>
</body>
</html>`;

export const CHAT_HTML = `<!DOCTYPE html>
<html lang='en'>
<head>
<meta charset='UTF-8'>
<meta name='viewport' content='width=device-width,initial-scale=1'>
<title>Bizli</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0a0a0f;--panel:#0f0f1a;--border:#1a1a2e;
  --cyan:#22d3ee;--purple:#a855f7;--text:#e8e8f0;--muted:#4a4a6a;
  --bb:rgba(168,85,247,.10);--bu:rgba(34,211,238,.10);
  --gc:0 0 20px rgba(34,211,238,.38);--gp:0 0 20px rgba(168,85,247,.32);
}
html,body{height:100%;overflow:hidden;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
#stars{position:fixed;inset:0;pointer-events:none;z-index:0}
.star{position:absolute;border-radius:50%;background:#fff;animation:twk var(--d,3s) ease-in-out infinite var(--delay,0s)}
@keyframes twk{0%,100%{opacity:.06}50%{opacity:.5}}
body::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
  background-image:linear-gradient(rgba(34,211,238,.016) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.016) 1px,transparent 1px);
  background-size:48px 48px}

/* LOGIN */
#ls{position:fixed;inset:0;z-index:10;display:flex;align-items:center;justify-content:center}
.lbox{
  position:relative;z-index:1;width:90%;max-width:360px;
  background:rgba(15,15,26,.96);border:1px solid var(--cyan);border-radius:18px;
  padding:40px 32px 36px;text-align:center;
  box-shadow:var(--gc),inset 0 0 60px rgba(34,211,238,.025);backdrop-filter:blur(12px)
}
.cat-wrap{margin:0 auto 16px;width:90px;height:90px;display:flex;align-items:center;justify-content:center}
.cat-big{width:90px;height:90px;animation:cpulse 2.8s ease-in-out infinite;
  filter:drop-shadow(0 0 7px rgba(34,211,238,.48))}
@keyframes cpulse{
  0%,100%{opacity:.82;transform:scale(1);filter:drop-shadow(0 0 6px rgba(34,211,238,.36))}
  50%{opacity:1;transform:scale(1.05);filter:drop-shadow(0 0 18px rgba(34,211,238,.72))}
}
.brand{font-size:1.6rem;font-weight:800;letter-spacing:.3em;margin-bottom:4px;
  background:linear-gradient(135deg,#22d3ee,#a855f7);-webkit-background-clip:text;
  -webkit-text-fill-color:transparent;background-clip:text}
.sub{font-size:.72rem;color:var(--muted);letter-spacing:.12em;margin-bottom:28px}
.linp{
  display:block;width:100%;background:#080810;border:1.5px solid var(--border);border-radius:9px;
  color:var(--text);padding:12px 14px;font-size:.95rem;outline:none;margin-bottom:12px;
  transition:border-color .2s,box-shadow .2s;letter-spacing:.06em;font-family:inherit
}
.linp::placeholder{color:var(--muted);letter-spacing:.04em}
.linp:focus{border-color:var(--cyan);box-shadow:0 0 12px rgba(34,211,238,.22)}
.lbtn{
  width:100%;padding:13px;border:none;border-radius:9px;
  background:linear-gradient(135deg,#22d3ee,#a855f7);
  color:#0a0a0f;font-weight:800;font-size:.92rem;letter-spacing:.14em;
  cursor:pointer;font-family:inherit;transition:opacity .18s,transform .12s;margin-top:4px
}
.lbtn:hover{opacity:.88;transform:translateY(-1px)}
.lbtn:active{transform:translateY(0)}
.lbtn:disabled{opacity:.42;cursor:not-allowed;transform:none}
.lerr{min-height:18px;font-size:.73rem;color:#f87171;margin-top:10px;letter-spacing:.02em}

/* CHAT */
#cs{position:fixed;inset:0;z-index:10;display:none;flex-direction:column}
.tbar{
  display:flex;align-items:center;gap:10px;padding:10px 16px;flex-shrink:0;
  background:rgba(10,10,15,.94);border-bottom:1px solid var(--border);backdrop-filter:blur(14px)
}
.tcat{width:28px;height:28px;filter:drop-shadow(0 0 5px rgba(34,211,238,.42))}
.tname{font-size:.9rem;font-weight:700;letter-spacing:.22em;
  background:linear-gradient(135deg,#22d3ee,#a855f7);-webkit-background-clip:text;
  -webkit-text-fill-color:transparent;background-clip:text}
.tlive{display:flex;align-items:center;gap:5px;margin-left:2px}
.ldot{width:6px;height:6px;border-radius:50%;background:#22c55e;animation:lp 1.4s ease-in-out infinite;box-shadow:0 0 6px #22c55e}
@keyframes lp{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.28;transform:scale(.58)}}
.ltxt{font-size:.62rem;color:#22c55e;letter-spacing:.1em}
.xbtn{
  margin-left:auto;background:none;border:1px solid var(--border);border-radius:6px;
  color:var(--muted);cursor:pointer;font-size:.78rem;padding:4px 10px;
  transition:border-color .18s,color .18s;font-family:inherit
}
.xbtn:hover{border-color:var(--cyan);color:var(--cyan)}
#msgs{flex:1;overflow-y:auto;padding:16px 12px;display:flex;flex-direction:column;gap:10px;position:relative;z-index:1}
#msgs::-webkit-scrollbar{width:3px}
#msgs::-webkit-scrollbar-thumb{background:rgba(168,85,247,.2);border-radius:4px}
.mrow{display:flex;gap:8px;max-width:84%;animation:fin .2s ease}
@keyframes fin{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
.mrow.biz{align-self:flex-start;align-items:flex-end}
.mrow.usr{align-self:flex-end;flex-direction:row-reverse}
.av{width:22px;height:22px;flex-shrink:0;margin-bottom:2px;filter:drop-shadow(0 0 4px rgba(168,85,247,.42))}
.bub{padding:10px 14px;font-size:.9rem;line-height:1.55;word-break:break-word;white-space:pre-wrap}
.mrow.biz .bub{background:var(--bb);border:1px solid rgba(168,85,247,.22);border-radius:0 14px 14px 14px}
.mrow.usr .bub{background:var(--bu);border:1px solid rgba(34,211,238,.22);border-radius:14px 0 14px 14px}
.tybub{background:var(--bb);border:1px solid rgba(168,85,247,.18);border-radius:0 14px 14px 14px;padding:12px 16px;display:flex;gap:5px}
.dot{width:7px;height:7px;border-radius:50%;background:var(--purple);opacity:.38;animation:bnc .9s ease-in-out infinite}
.dot:nth-child(2){animation-delay:.16s}
.dot:nth-child(3){animation-delay:.32s}
@keyframes bnc{0%,80%,100%{transform:translateY(0);opacity:.38}40%{transform:translateY(-5px);opacity:1}}
#anc{height:1px;flex-shrink:0}
.ibar{
  display:flex;align-items:flex-end;gap:10px;padding:12px 14px;flex-shrink:0;
  padding-bottom:calc(12px + env(safe-area-inset-bottom,0px));
  background:rgba(10,10,15,.94);border-top:1px solid var(--border);backdrop-filter:blur(14px)
}
#im{
  flex:1;background:#080810;border:1.5px solid var(--border);border-radius:10px;
  color:var(--text);padding:10px 13px;font-size:.92rem;outline:none;
  resize:none;max-height:120px;overflow-y:auto;font-family:inherit;line-height:1.45;
  transition:border-color .2s
}
#im::placeholder{color:var(--muted)}
#im:focus{border-color:var(--cyan)}
#sb{
  flex-shrink:0;width:42px;height:42px;border:none;border-radius:10px;
  background:linear-gradient(135deg,#22d3ee,#a855f7);
  cursor:pointer;font-size:1.05rem;transition:opacity .18s,transform .12s;color:#0a0a0f;font-weight:700
}
#sb:hover{opacity:.85;transform:scale(1.05)}
#sb:active{transform:scale(.95)}
#sb:disabled{opacity:.32;cursor:not-allowed;transform:none}
</style>
</head>
<body>
<div id='stars'></div>

<!-- LOGIN SCREEN -->
<div id='ls'>
<div class='lbox'>
  <div class='cat-wrap'>
    <svg class='cat-big' viewBox='0 0 100 90' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <filter id='cg' x='-30%' y='-30%' width='160%' height='160%'>
          <feGaussianBlur in='SourceGraphic' stdDeviation='2.4' result='b'/>
          <feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge>
        </filter>
      </defs>
      <polygon points='16,42 7,6 38,30' fill='#0a0a0f' stroke='#22d3ee' stroke-width='1.8' stroke-linejoin='round' filter='url(#cg)'/>
      <polygon points='18,38 12,14 33,29' fill='none' stroke='#22d3ee' stroke-width='0.9' opacity='0.48'/>
      <polygon points='84,42 93,6 62,30' fill='#0a0a0f' stroke='#22d3ee' stroke-width='1.8' stroke-linejoin='round' filter='url(#cg)'/>
      <polygon points='82,38 88,14 67,29' fill='none' stroke='#22d3ee' stroke-width='0.9' opacity='0.48'/>
      <path d='M16,42 C7,50 7,66 16,74 C25,82 36,87 50,87 C64,87 75,82 84,74 C93,66 93,50 84,42 C75,34 63,30 50,30 C37,30 25,34 16,42 Z' fill='#0a0a0f' stroke='#22d3ee' stroke-width='1.8' filter='url(#cg)'/>
      <line x1='2' y1='56' x2='30' y2='59' stroke='#22d3ee' stroke-width='1' opacity='0.66'/>
      <line x1='2' y1='63' x2='30' y2='63' stroke='#22d3ee' stroke-width='1' opacity='0.66'/>
      <line x1='4' y1='70' x2='30' y2='67' stroke='#22d3ee' stroke-width='1' opacity='0.66'/>
      <line x1='98' y1='56' x2='70' y2='59' stroke='#22d3ee' stroke-width='1' opacity='0.66'/>
      <line x1='98' y1='63' x2='70' y2='63' stroke='#22d3ee' stroke-width='1' opacity='0.66'/>
      <line x1='96' y1='70' x2='70' y2='67' stroke='#22d3ee' stroke-width='1' opacity='0.66'/>
    </svg>
  </div>
  <div class='brand'>BIZLI</div>
  <div class='sub'>your companion, everywhere</div>
  <input class='linp' id='ic' placeholder='BZ-XXXX' maxlength='7' autocomplete='off' spellcheck='false'>
  <input class='linp' id='ip' type='password' placeholder='4-digit PIN' maxlength='4' inputmode='numeric'>
  <button class='lbtn' id='bl'>ENTER &#9658;</button>
  <div class='lerr' id='le'></div>
</div>
</div>

<!-- CHAT SCREEN -->
<div id='cs'>
  <div class='tbar'>
    <svg class='tcat' viewBox='0 0 100 90' xmlns='http://www.w3.org/2000/svg'>
      <polygon points='16,42 7,6 38,30' fill='#0a0a0f' stroke='#22d3ee' stroke-width='2.2'/>
      <polygon points='84,42 93,6 62,30' fill='#0a0a0f' stroke='#22d3ee' stroke-width='2.2'/>
      <path d='M16,42 C7,50 7,66 16,74 C25,82 36,87 50,87 C64,87 75,82 84,74 C93,66 93,50 84,42 C75,34 63,30 50,30 C37,30 25,34 16,42 Z' fill='#0a0a0f' stroke='#22d3ee' stroke-width='2.2'/>
      <line x1='2' y1='58' x2='28' y2='61' stroke='#22d3ee' stroke-width='1.2' opacity='0.68'/>
      <line x1='2' y1='65' x2='28' y2='65' stroke='#22d3ee' stroke-width='1.2' opacity='0.68'/>
      <line x1='98' y1='58' x2='72' y2='61' stroke='#22d3ee' stroke-width='1.2' opacity='0.68'/>
      <line x1='98' y1='65' x2='72' y2='65' stroke='#22d3ee' stroke-width='1.2' opacity='0.68'/>
    </svg>
    <span class='tname'>BIZLI</span>
    <span class='tlive'><span class='ldot'></span><span class='ltxt'>LIVE</span></span>
    <button class='xbtn' id='bx'>&#215; logout</button>
  </div>
  <div id='msgs'><div id='anc'></div></div>
  <div class='ibar'>
    <textarea id='im' placeholder='say something…' rows='1'></textarea>
    <button id='sb'>&#9658;</button>
  </div>
</div>

<script>
(function(){
  var TOKEN=null;
  var ls=document.getElementById('ls');
  var cs=document.getElementById('cs');
  var ic=document.getElementById('ic');
  var ip=document.getElementById('ip');
  var bl=document.getElementById('bl');
  var le=document.getElementById('le');
  var msgs=document.getElementById('msgs');
  var anc=document.getElementById('anc');
  var im=document.getElementById('im');
  var sb=document.getElementById('sb');
  var tyRow=null;

  // Stars
  var sc=document.getElementById('stars');
  for(var i=0;i<52;i++){
    var s=document.createElement('div');s.className='star';
    var sz=(Math.random()*1.5+0.4).toFixed(1);
    s.style.cssText='width:'+sz+'px;height:'+sz+'px;left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;--d:'+(Math.random()*4+2).toFixed(1)+'s;--delay:-'+(Math.random()*5).toFixed(1)+'s';
    sc.appendChild(s);
  }

  // Format inputs
  ic.addEventListener('input',function(){ic.value=ic.value.toUpperCase().replace(/[^A-Z0-9\\-]/g,'');});
  ip.addEventListener('input',function(){ip.value=ip.value.replace(/[^0-9]/g,'');});
  ic.addEventListener('keydown',function(e){if(e.key==='Enter')ip.focus();});
  ip.addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
  bl.addEventListener('click',doLogin);

  function doLogin(){
    var code=ic.value.trim().toUpperCase();
    var pin=ip.value.trim();
    le.textContent='';
    if(code.length<7){le.textContent='Enter your identity code (BZ-XXXX)';return;}
    if(pin.length!==4){le.textContent='Enter your 4-digit PIN';return;}
    bl.disabled=true;bl.textContent='checking…';
    fetch('/web-chat',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'login',code:code,pin:pin})})
    .then(function(r){return r.json();})
    .then(function(d){
      bl.disabled=false;bl.innerHTML='ENTER &#9658;';
      if(d.ok){TOKEN=d.token;showChat(d.name);}
      else{le.textContent=d.error||'Login failed — check your code and PIN';}
    })
    .catch(function(){
      bl.disabled=false;bl.innerHTML='ENTER &#9658;';
      le.textContent='Connection error — try again';
    });
  }

  function showChat(name){
    ls.style.display='none';
    cs.style.display='flex';
    var g=name?('hey '+name+'! so good to see you 💰'):('hey! great to see you 💰');
    addBiz(g);
    im.focus();
  }

  document.getElementById('bx').addEventListener('click',function(){
    TOKEN=null;
    cs.style.display='none';
    ls.style.display='flex';
    clearMsgs();
    ic.value='';ip.value='';le.textContent='';
  });

  function clearMsgs(){
    var kids=Array.prototype.slice.call(msgs.children);
    for(var i=0;i<kids.length;i++){
      if(kids[i].id!=='anc')msgs.removeChild(kids[i]);
    }
    tyRow=null;
  }

  im.addEventListener('input',function(){
    im.style.height='auto';
    im.style.height=Math.min(im.scrollHeight,120)+'px';
  });
  im.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();doSend();}});
  sb.addEventListener('click',doSend);

  function doSend(){
    var msg=im.value.trim();
    if(!msg||!TOKEN||sb.disabled)return;
    im.value='';im.style.height='auto';
    sb.disabled=true;
    addUsr(msg);showTy();
    fetch('/web-chat',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({token:TOKEN,message:msg})})
    .then(function(r){return r.json();})
    .then(function(d){
      hideTy();sb.disabled=false;im.focus();
      if(d.ok){addBiz(d.reply);}
      else if(d.error&&d.error.indexOf('Session expired')>=0){
        TOKEN=null;cs.style.display='none';ls.style.display='flex';
        le.textContent='Session expired — please log in again';
      } else {addBiz('oops, something went sideways 😅 try again in a sec!');}
    })
    .catch(function(){
      hideTy();sb.disabled=false;im.focus();
      addBiz('connection hiccup 😅 try again!');
    });
  }

  var AV='<svg class="av" viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg">'+
    '<polygon points="16,42 7,6 38,30" fill="#0a0a0f" stroke="#a855f7" stroke-width="2.4"/>'+
    '<polygon points="84,42 93,6 62,30" fill="#0a0a0f" stroke="#a855f7" stroke-width="2.4"/>'+
    '<path d="M16,42 C7,50 7,66 16,74 C25,82 36,87 50,87 C64,87 75,82 84,74 C93,66 93,50 84,42 C75,34 63,30 50,30 C37,30 25,34 16,42 Z" fill="#0a0a0f" stroke="#a855f7" stroke-width="2.4"/>'+
    '<line x1="2" y1="56" x2="30" y2="59" stroke="#a855f7" stroke-width="1.1" opacity="0.65"/>'+
    '<line x1="2" y1="63" x2="30" y2="63" stroke="#a855f7" stroke-width="1.1" opacity="0.65"/>'+
    '<line x1="4" y1="70" x2="30" y2="67" stroke="#a855f7" stroke-width="1.1" opacity="0.65"/>'+
    '<line x1="98" y1="56" x2="70" y2="59" stroke="#a855f7" stroke-width="1.1" opacity="0.65"/>'+
    '<line x1="98" y1="63" x2="70" y2="63" stroke="#a855f7" stroke-width="1.1" opacity="0.65"/>'+
    '<line x1="96" y1="70" x2="70" y2="67" stroke="#a855f7" stroke-width="1.1" opacity="0.65"/>'+
    '</svg>';

  function addBiz(txt){
    var r=document.createElement('div');r.className='mrow biz';
    r.innerHTML=AV+'<div class="bub">'+esc(txt)+'</div>';
    msgs.insertBefore(r,anc);scrollBot();
  }

  function addUsr(txt){
    var r=document.createElement('div');r.className='mrow usr';
    r.innerHTML='<div class="bub">'+esc(txt)+'</div>';
    msgs.insertBefore(r,anc);scrollBot();
  }

  function showTy(){
    if(tyRow)return;
    tyRow=document.createElement('div');tyRow.className='mrow biz';
    tyRow.innerHTML=AV+'<div class="tybub"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
    msgs.insertBefore(tyRow,anc);scrollBot();
  }

  function hideTy(){
    if(tyRow){msgs.removeChild(tyRow);tyRow=null;}
  }

  function scrollBot(){anc.scrollIntoView({behavior:'smooth'});}

  function esc(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
})();
</script>
</body>
</html>`;
