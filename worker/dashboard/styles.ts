export const DASHBOARD_STYLES = `*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#060912;--panel:#080e1d;--border:#152035;
  --blue:#00d4ff;--cyan:#3ddbd9;--amber:#f59e0b;
  --red:#ef4444;--green:#22c55e;--text:#ddeeff;--muted:#3a5070;
  --glow-b:0 0 18px rgba(0,212,255,.45),0 0 40px rgba(0,212,255,.15);
  --glow-c:0 0 18px rgba(61,219,217,.4);
}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:"Courier New",monospace;min-height:100vh;overflow-x:hidden}
#stars{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0}
.star{position:absolute;border-radius:50%;animation:twinkle var(--d,3s) ease-in-out infinite var(--delay,0s)}
@keyframes twinkle{0%,100%{opacity:.15}50%{opacity:.9}}
body::before{
  content:"";position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;
  background-image:linear-gradient(rgba(0,212,255,.025) 1px,transparent 1px),
    linear-gradient(90deg,rgba(0,212,255,.025) 1px,transparent 1px);
  background-size:56px 56px;
}
#topbar{
  position:sticky;top:0;z-index:100;display:flex;align-items:center;gap:14px;
  padding:9px 20px;background:rgba(6,9,18,.92);border-bottom:1px solid var(--border);
  backdrop-filter:blur(14px);
}
.t-logo{font-size:1rem;font-weight:700;letter-spacing:.22em;color:var(--blue);text-shadow:var(--glow-b)}
.t-live{display:flex;align-items:center;gap:6px;margin-left:4px}
.live-dot{width:7px;height:7px;border-radius:50%;background:var(--green);animation:lpulse 1.4s ease-in-out infinite;box-shadow:0 0 7px var(--green)}
@keyframes lpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.65)}}
.live-txt{color:var(--green);font-size:.75rem;letter-spacing:.12em}
#sync-time{color:var(--muted);font-size:.75rem;letter-spacing:.04em}
#health-pct{display:flex;align-items:center;gap:5px;margin:0 auto;font-size:.75rem;letter-spacing:.1em}
.h-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;transition:background .5s,box-shadow .5s}
.h-num{font-weight:700}
.h-lbl{letter-spacing:.12em;color:var(--muted)}
#health-pct.h-green .h-dot{background:var(--green);box-shadow:0 0 7px var(--green)}
#health-pct.h-green .h-num{color:var(--green)}
#health-pct.h-amber .h-dot{background:var(--amber);box-shadow:0 0 6px var(--amber)}
#health-pct.h-amber .h-num{color:var(--amber)}
#health-pct.h-red .h-dot{background:var(--red);box-shadow:0 0 6px var(--red)}
#health-pct.h-red .h-num{color:var(--red)}
@media(max-width:600px){.h-lbl{display:none}}
#gate{
  position:fixed;inset:0;z-index:999;display:flex;align-items:center;justify-content:center;
  background:rgba(6,9,18,.97);backdrop-filter:blur(10px);
}
.gate-box{
  border:1px solid var(--blue);border-radius:14px;padding:40px 36px;text-align:center;
  box-shadow:var(--glow-b),inset 0 0 60px rgba(0,212,255,.04);max-width:320px;width:90%;
}
.gate-logo{font-size:2rem;margin-bottom:6px}
.gate-box h2{color:var(--blue);letter-spacing:.25em;font-size:1.1rem;margin-bottom:6px}
.gate-box p{color:var(--muted);font-size:.75rem;margin-bottom:22px}
#pw-input{
  width:100%;background:#0d1a30;border:2px solid var(--blue);color:#fff;
  padding:11px 14px;border-radius:7px;font-family:inherit;font-size:.95rem;letter-spacing:.1em;
  outline:none;margin-bottom:12px;transition:box-shadow .2s;
  box-shadow:0 0 10px rgba(0,212,255,.25);
}
#pw-input::placeholder{color:#3a6080;letter-spacing:.05em}
#pw-input:focus{box-shadow:0 0 18px rgba(0,212,255,.5)}
#pw-btn{
  width:100%;background:var(--blue);color:#060912;border:none;padding:10px;
  border-radius:7px;font-family:inherit;font-weight:700;letter-spacing:.14em;
  cursor:pointer;font-size:.88rem;transition:opacity .18s;
}
#pw-btn:hover{opacity:.82}
#pw-err{color:var(--red);font-size:.75rem;margin-top:7px;min-height:16px}
#app{position:relative;z-index:1;padding:12px 14px;display:none;margin-left:240px;margin-right:360px;transition:margin-left 0.3s ease,margin-right 0.3s ease}
.summary-row{
  display:flex;gap:10px;padding:12px 16px;margin-bottom:12px;flex-wrap:wrap;
  background:rgba(0,212,255,.04);border:1px solid rgba(0,212,255,.1);border-radius:10px;
}
.sbox{flex:1;min-width:70px;text-align:center}
.snum{font-size:1.35rem;font-weight:700;color:var(--blue);font-family:"Courier New",monospace;min-width:1ch}
.slbl{font-size:.75rem;color:var(--muted);letter-spacing:.1em;margin-top:2px}
.grid{
  display:grid;gap:12px;
  grid-template-columns:1.05fr 1.2fr 1.2fr;
  grid-template-rows:auto auto auto;
}
.panel{
  background:var(--panel);border:1px solid var(--border);border-radius:12px;
  padding:15px;position:relative;overflow:hidden;
}
.panel::before{
  content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(135deg,rgba(0,212,255,.035) 0%,transparent 55%);
}
.ptitle{
  font-size:.76rem;letter-spacing:.2em;color:var(--blue);margin-bottom:11px;
  display:flex;align-items:center;gap:7px;
}
.ptitle::before{content:"▸";color:var(--cyan)}
#orb-section{
  grid-column:1;grid-row:1/3;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:20px 12px;min-height:360px;
}
#orb-wrap{position:relative;width:210px;height:210px;flex-shrink:0}
#orb{
  position:absolute;top:50%;left:50%;
  width:96px;height:96px;margin:-48px 0 0 -48px;
  border-radius:50%;
  background:radial-gradient(circle at 36% 34%,rgba(255,255,255,.28),rgba(0,212,255,.72) 38%,rgba(0,40,90,.95));
  box-shadow:0 0 28px var(--blue),0 0 56px rgba(0,212,255,.45),0 0 100px rgba(0,212,255,.18),inset 0 0 20px rgba(0,212,255,.15);
  animation:breathe 3.8s ease-in-out infinite;
  transition:box-shadow 1.2s ease,background 1.2s ease;
}
@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.09)}}
#orb.amber{
  background:radial-gradient(circle at 36% 34%,rgba(255,250,200,.28),rgba(245,158,11,.72) 38%,rgba(70,35,0,.95));
  box-shadow:0 0 28px var(--amber),0 0 56px rgba(245,158,11,.45),0 0 100px rgba(245,158,11,.18),inset 0 0 20px rgba(245,158,11,.15);
}
#orb.red{
  background:radial-gradient(circle at 36% 34%,rgba(255,210,210,.28),rgba(239,68,68,.72) 38%,rgba(70,0,0,.95));
  box-shadow:0 0 28px var(--red),0 0 56px rgba(239,68,68,.45),0 0 100px rgba(239,68,68,.18),inset 0 0 20px rgba(239,68,68,.15);
}
.ring{
  position:absolute;top:50%;left:50%;border-radius:50%;
  border:1px solid rgba(0,212,255,.28);
  transform:translate(-50%,-50%) rotateX(62deg);
}
.r1{width:138px;height:138px;animation:rspin 7s linear infinite;border-color:rgba(0,212,255,.4)}
.r2{width:168px;height:168px;animation:rspin 11s linear infinite reverse;border-color:rgba(61,219,217,.28)}
.r3{width:200px;height:200px;animation:rspin 17s linear infinite;border-color:rgba(0,212,255,.16);border-style:dashed}
@keyframes rspin{
  from{transform:translate(-50%,-50%) rotateX(62deg) rotateZ(0deg)}
  to{transform:translate(-50%,-50%) rotateX(62deg) rotateZ(360deg)}
}
.particle{
  position:absolute;top:50%;left:50%;
  width:5px;height:5px;border-radius:50%;
  margin:-2.5px 0 0 -2.5px;
  background:var(--blue);box-shadow:0 0 7px var(--blue);
}
.pa1{animation:ob1 4.8s linear infinite}
.pa2{animation:ob1 4.8s linear infinite .9s;background:var(--cyan);box-shadow:0 0 7px var(--cyan)}
.pa3{animation:ob2 6.8s linear infinite .4s}
.pa4{animation:ob2 6.8s linear infinite 1.9s;background:var(--cyan);box-shadow:0 0 7px var(--cyan)}
.pa5{animation:ob3 10s linear infinite .6s;width:4px;height:4px;margin:-2px 0 0 -2px;opacity:.7}
@keyframes ob1{from{transform:rotate(0deg) translateX(72px)}to{transform:rotate(360deg) translateX(72px)}}
@keyframes ob2{from{transform:rotate(0deg) translateX(88px)}to{transform:rotate(360deg) translateX(88px)}}
@keyframes ob3{from{transform:rotate(0deg) translateX(104px)}to{transform:rotate(360deg) translateX(104px)}}
#orb-info{margin-top:22px;text-align:center}
#orb-status{font-size:.75rem;letter-spacing:.26em;color:var(--blue);margin-bottom:5px}
#orb-brain{font-size:1.05rem;letter-spacing:.12em;font-weight:700}
#orb-sub{font-size:.75rem;color:var(--muted);margin-top:5px}
#brain-section{grid-column:2;grid-row:1}
.kgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.kdot{
  padding:7px 3px;border-radius:6px;text-align:center;
  font-size:.75rem;border:1px solid var(--border);
  transition:all .55s ease;
}
.kdot.ready{background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.4);color:var(--green);box-shadow:0 0 8px rgba(34,197,94,.18)}
.kdot.rpm_cooling{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.38);color:var(--amber)}
.kdot.tpd_cooling{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.3);color:var(--red)}
.kdot.ready.lastused{animation:kpulse .7s ease;border-color:var(--green);box-shadow:0 0 16px rgba(34,197,94,.6)}
@keyframes kpulse{0%,100%{box-shadow:0 0 16px rgba(34,197,94,.6)}50%{box-shadow:0 0 32px rgba(34,197,94,1)}}
.kcd{font-size:.65rem;opacity:.75;display:block;margin-top:2px}
.ainode{
  margin-top:7px;padding:8px 10px;border-radius:8px;
  display:flex;align-items:center;gap:8px;font-size:.76rem;
  border:1px solid var(--border);background:rgba(61,219,217,.04);
}
.adot{width:8px;height:8px;border-radius:50%;flex-shrink:0;transition:all .5s}
.adot.standby{background:var(--cyan);box-shadow:0 0 5px var(--cyan);opacity:.5}
.adot.active{background:var(--green);box-shadow:0 0 9px var(--green);opacity:1;animation:lpulse 1.2s infinite}
#drive-section{grid-column:3;grid-row:1}
#drive-list{display:flex;flex-direction:column;gap:6px;max-height:215px;overflow-y:auto}
.ditem{
  display:flex;align-items:center;gap:7px;padding:6px 9px;border-radius:6px;
  background:rgba(0,212,255,.03);border:1px solid rgba(0,212,255,.08);font-size:.76rem;
}
.ditem.newin{animation:slidein .38s ease}
@keyframes slidein{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
.dbrain{
  padding:2px 6px;border-radius:4px;font-size:.65rem;letter-spacing:.06em;
  font-weight:700;flex-shrink:0;
}
.dbrain.groq{background:rgba(0,212,255,.18);color:var(--blue)}
.dbrain.gemini{background:rgba(245,158,11,.18);color:var(--amber)}
.dbrain.openrouter{background:rgba(168,100,255,.18);color:#a864ff}
.dbrain.worker{background:rgba(90,90,90,.2);color:#999}
.dtime{margin-left:auto;color:var(--muted);font-size:.68rem;flex-shrink:0}
#err-section{grid-column:2;grid-row:2}
#err-log{
  font-family:"Courier New",monospace;font-size:.76rem;line-height:1.65;
  color:#22c55e;background:#030805;
  border-radius:6px;padding:9px;max-height:210px;overflow-y:auto;
  border:1px solid rgba(34,197,94,.18);
}
.eline{margin-bottom:3px;word-break:break-all;opacity:.9}
.eline::before{content:"> ";color:rgba(34,197,94,.4)}
.ets{color:rgba(34,197,94,.45);font-size:.65rem}
.no-err{color:rgba(34,197,94,.35);font-size:.75rem;padding:6px 0}
#users-section{grid-column:3;grid-row:2}
#user-list{display:flex;flex-direction:column;gap:6px;max-height:210px;overflow-y:auto}
.uitem{
  padding:7px 10px;border-radius:7px;
  background:rgba(0,212,255,.025);border:1px solid var(--border);
}
.utop{display:flex;align-items:center;gap:6px;font-size:.76rem;margin-bottom:4px}
.umsgs{margin-left:auto;color:var(--cyan);font-size:.75rem;font-weight:600}
.ubar-wrap{height:3px;background:rgba(0,212,255,.1);border-radius:2px;overflow:hidden}
.ubar{height:100%;background:linear-gradient(90deg,var(--blue),var(--cyan));border-radius:2px;transition:width .9s ease}
.ulast{color:var(--muted);font-size:.65rem;margin-top:3px}
.odot{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 5px var(--green);flex-shrink:0;animation:lpulse 1.6s infinite}
.xdot{width:6px;height:6px;border-radius:50%;background:var(--muted);flex-shrink:0}
#tools-section{grid-column:1/3;grid-row:3}
#tools-wrap{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.tchip{
  padding:5px 11px;border-radius:20px;font-size:.75rem;letter-spacing:.04em;
  border:1px solid rgba(34,197,94,.3);background:rgba(34,197,94,.07);color:var(--green);
  transition:all .3s;
}
.tchip.dead{border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.07);color:var(--red)}
.tchip::before{content:"● ";font-size:.62rem;vertical-align:middle}
#vitals-section{grid-column:3;grid-row:3}
.vrow{
  display:flex;justify-content:space-between;align-items:center;
  padding:6px 0;border-bottom:1px solid rgba(0,212,255,.06);font-size:.76rem;
}
.vrow:last-child{border-bottom:none}
.vk{color:var(--muted);font-size:.75rem;letter-spacing:.08em}
.vv{color:var(--cyan);font-weight:600;letter-spacing:.04em;text-align:right}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
@media(max-width:900px){
  .grid{grid-template-columns:1fr 1fr}
  #orb-section{grid-column:1/3;grid-row:auto;min-height:260px}
  #brain-section,#drive-section,#err-section,#users-section{grid-column:auto;grid-row:auto}
  #tools-section{grid-column:1/3}
  #vitals-section{grid-column:1/3}
}
@media(max-width:560px){
  .grid{grid-template-columns:1fr}
  #orb-section,#brain-section,#drive-section,#err-section,#users-section,#tools-section,#vitals-section{grid-column:1}
  #orb-wrap{width:170px;height:170px}
  #orb{width:78px;height:78px;margin:-39px 0 0 -39px}
  .r1{width:112px;height:112px}.r2{width:138px;height:138px}.r3{width:164px;height:164px}
}
#lab{
  position:fixed;right:0;top:0;bottom:0;width:360px;
  background:rgba(8,12,22,.96);backdrop-filter:blur(14px);
  border-left:1px solid rgba(0,212,255,.12);
  z-index:200;display:none;flex-direction:column;
  transition:transform 0.3s ease;
}
#lab-hdr{
  padding:14px 16px 12px;border-bottom:1px solid rgba(0,212,255,.1);
  display:flex;align-items:center;gap:8px;flex-shrink:0;
}
.lab-title{font-size:.76rem;letter-spacing:.28em;color:var(--blue);font-weight:700}
.lab-dot{width:7px;height:7px;border-radius:50%;background:var(--green);
  box-shadow:0 0 7px var(--green);animation:lpulse 1.6s ease-in-out infinite;
  flex-shrink:0;margin-left:auto}
#lab-body{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
.lbmsg{max-width:85%;padding:9px 12px;border-radius:12px;font-size:.8rem;line-height:1.55;word-break:break-word;white-space:pre-wrap}
.lbu{align-self:flex-end;background:rgba(0,212,255,.18);border:1px solid rgba(0,212,255,.3);color:var(--text);border-radius:12px 12px 3px 12px}
.lba{align-self:flex-start;background:#0d1422;border:1px solid rgba(0,212,255,.08);color:#c8ddf0;font-family:"Courier New",monospace;border-radius:12px 12px 12px 3px}
.lbsys{align-self:center;color:var(--muted);font-size:.68rem;font-style:italic;max-width:100%;text-align:center;padding:4px 0}
#lab-proc{
  padding:8px 16px;font-size:.68rem;color:var(--cyan);letter-spacing:.1em;
  display:none;flex-shrink:0;animation:procblink 1.2s ease-in-out infinite;
}
@keyframes procblink{0%,100%{opacity:.4}50%{opacity:1}}
#lab-input{
  padding:10px 12px;border-top:1px solid rgba(0,212,255,.1);
  display:flex;gap:8px;flex-shrink:0;align-items:flex-end;
}
#lab-ta{
  flex:1;background:#0a1020;border:1px solid rgba(0,212,255,.2);color:var(--text);
  border-radius:8px;padding:8px 10px;font-family:"Courier New",monospace;font-size:.76rem;
  resize:none;outline:none;line-height:1.5;min-height:36px;max-height:120px;
  transition:border-color .18s;
}
#lab-ta:focus{border-color:rgba(0,212,255,.5)}
#lab-ta::placeholder{color:var(--muted)}
#lab-send{
  width:36px;height:36px;flex-shrink:0;
  background:var(--blue);border:none;border-radius:8px;
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  color:#060912;font-size:.85rem;font-weight:700;
  transition:opacity .15s,transform .1s;
}
#lab-send:hover{opacity:.82;transform:translateY(-1px)}
#lab-send:active{transform:translateY(0)}
@media(min-width:801px){#lab.collapsed{transform:translateX(360px)}}
#lab-btn{
  position:fixed;right:344px;top:50%;
  transform:translateY(-50%);
  width:32px;height:32px;border-radius:50%;
  background:rgba(8,12,22,.96);border:1px solid rgba(0,212,255,.2);
  cursor:pointer;display:none;align-items:center;justify-content:center;
  color:rgba(0,212,255,.75);font-size:1.2rem;line-height:1;
  z-index:201;transition:right 0.3s ease,box-shadow 0.15s;
  user-select:none;
}
#lab-btn:hover{box-shadow:0 0 10px rgba(0,212,255,.35)}
#lab-toggle{
  display:none;position:fixed;bottom:20px;right:20px;
  width:46px;height:46px;border-radius:50%;
  background:var(--blue);border:none;cursor:pointer;
  z-index:300;box-shadow:var(--glow-b);
  align-items:center;justify-content:center;
  font-size:.75rem;font-weight:700;letter-spacing:.06em;color:#060912;
}
#leftnav{
  position:fixed;left:0;top:0;bottom:0;width:240px;
  background:rgba(8,12,22,.96);backdrop-filter:blur(14px);
  border-right:1px solid rgba(0,212,255,.12);
  z-index:200;display:none;flex-direction:column;
  transition:transform 0.3s ease,width 0.3s ease;overflow:hidden;
}
#lnav-brand{padding:16px 16px 12px;border-bottom:1px solid rgba(0,212,255,.08);flex-shrink:0}
.lnav-logo{font-size:.82rem;font-weight:700;letter-spacing:.2em;color:var(--blue);text-shadow:var(--glow-b);white-space:nowrap;display:block}
.lnav-ver{display:block;font-size:.68rem;color:var(--muted);letter-spacing:.08em;margin-top:4px;white-space:nowrap}
#lnav-tabs{flex:1;overflow-y:auto;padding:8px 0;overflow-x:hidden}
.lnav-item{
  display:flex;align-items:center;gap:12px;height:40px;padding:0 16px;
  cursor:pointer;color:#9ca3af;font-size:.76rem;letter-spacing:.06em;
  transition:background .15s,color .15s;border-left:3px solid transparent;
  white-space:nowrap;overflow:hidden;
}
.lnav-item:hover:not(.disabled){background:rgba(255,255,255,.04);color:#fff}
.lnav-item.active{background:rgba(0,212,255,.1);border-left-color:var(--blue);color:var(--blue)}
.lnav-item.disabled{opacity:.35;cursor:not-allowed}
.lnav-item svg{flex-shrink:0;width:16px;height:16px;stroke-width:1.5}
.lnav-sep{height:1px;background:rgba(0,212,255,.08);margin:6px 16px}
#lnav-foot{padding:12px 16px;border-top:1px solid rgba(0,212,255,.08);flex-shrink:0;display:flex;align-items:center;gap:6px}
#lnav-foot .live-dot{width:6px;height:6px}
#lnav-foot .live-txt{font-size:.72rem}
#lnav-ham{
  display:none;position:fixed;top:10px;left:10px;z-index:201;
  background:rgba(8,12,22,.96);border:1px solid rgba(0,212,255,.2);
  border-radius:6px;width:32px;height:32px;cursor:pointer;
  align-items:center;justify-content:center;color:rgba(0,212,255,.75);font-size:1.1rem;
}
#app:not(.tab-overview) .summary-row{display:none}
#app:not(.tab-overview) .grid{grid-template-columns:1fr!important}
#app:not(.tab-overview) .panel{grid-column:1!important;grid-row:auto!important}
#app.tab-keys #orb-section,#app.tab-keys #drive-section,#app.tab-keys #err-section,#app.tab-keys #users-section,#app.tab-keys #tools-section,#app.tab-keys #vitals-section{display:none}
#app.tab-errors #orb-section,#app.tab-errors #brain-section,#app.tab-errors #drive-section,#app.tab-errors #users-section,#app.tab-errors #tools-section,#app.tab-errors #vitals-section{display:none}
#app.tab-tools #orb-section,#app.tab-tools #brain-section,#app.tab-tools #drive-section,#app.tab-tools #err-section,#app.tab-tools #users-section,#app.tab-tools #vitals-section{display:none}
#app.tab-users #orb-section,#app.tab-users #brain-section,#app.tab-users #drive-section,#app.tab-users #err-section,#app.tab-users #tools-section,#app.tab-users #vitals-section{display:none}
#app.tab-vitals #orb-section,#app.tab-vitals #brain-section,#app.tab-vitals #drive-section,#app.tab-vitals #err-section,#app.tab-vitals #users-section,#app.tab-vitals #tools-section{display:none}
@media(max-width:800px){
  #app{margin-left:0!important;margin-right:0!important}
  #topbar{padding-left:52px}
  #lab{
    top:auto;right:0;left:0;width:100%;height:70vh;bottom:0;
    border-left:none;border-top:1px solid rgba(0,212,255,.18);
    transform:translateY(100%);transition:transform .3s ease;
  }
  #lab.open{transform:translateY(0)}
  #lab-toggle{display:flex}
  #lab-btn{display:none!important}
  #leftnav{transform:translateX(-240px)}
  #leftnav.open{transform:translateX(0)}
  #lnav-ham{display:flex}
}
@media(min-width:801px)and(max-width:1100px){
  #leftnav{width:60px}
  .lnav-item span,.lnav-ver,.lnav-sep{display:none}
  .lnav-item{justify-content:center;padding:0;border-left:none}
  .lnav-item.active{background:rgba(0,212,255,.1)}
  #app{margin-left:60px!important}
}
#lab-quota-bar{padding:5px 12px 6px;border-top:1px solid rgba(255,255,255,.07);flex-shrink:0}
#lab-quota-text{font-size:.68rem;color:var(--muted);margin-bottom:3px;letter-spacing:.04em}
#lab-quota-track{height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden}
#lab-quota-fill{height:100%;width:0%;border-radius:2px;transition:width .6s ease,background .4s}
.qgreen{background:#4ade80}.qamber{background:#fbbf24}.qred{background:#f87171}
#brains-section{display:none}
#app.tab-brains #brains-section{display:block}
#app.tab-brains #orb-section,#app.tab-brains #brain-section,#app.tab-brains #drive-section,#app.tab-brains #err-section,#app.tab-brains #users-section,#app.tab-brains #tools-section,#app.tab-brains #vitals-section{display:none}
.brain-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:4px}
.bcrd{background:rgba(0,212,255,.03);border:1px solid var(--border);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:4px}
.bcrd-hdr{font-size:.76rem;letter-spacing:.16em;color:var(--blue);margin-bottom:4px;display:flex;align-items:center}
.bstat-row{display:flex;align-items:center;gap:7px;margin:3px 0 7px}
.bdot{width:9px;height:9px;border-radius:50%;flex-shrink:0;transition:all .4s}
.bdot-green{background:var(--green);box-shadow:0 0 7px var(--green);animation:lpulse 1.4s infinite}
.bdot-amber{background:var(--amber);box-shadow:0 0 6px var(--amber)}
.bdot-red{background:var(--red);box-shadow:0 0 6px var(--red)}
.bdot-standby{background:var(--muted);opacity:.45}
.bdot-lab{background:var(--amber);opacity:.65;box-shadow:0 0 5px var(--amber)}
.bstat-lbl{font-size:.76rem;letter-spacing:.1em;font-weight:700}
.brow{display:flex;justify-content:space-between;align-items:center;font-size:.75rem;padding:3px 0;border-bottom:1px solid rgba(0,212,255,.05)}
.brow:last-child{border-bottom:none}
.bk{color:var(--muted)}.bv{color:var(--text);text-align:right;max-width:58%}
.bmodels{font-size:.68rem;color:var(--cyan)}
.bpill{font-size:.65rem;letter-spacing:.09em;padding:2px 6px;border-radius:20px;margin-left:6px}
.bprimary{background:rgba(0,212,255,.12);color:var(--blue);border:1px solid rgba(0,212,255,.28)}
.bfallback{background:rgba(168,100,255,.12);color:#a864ff;border:1px solid rgba(168,100,255,.28)}
.blast{background:rgba(120,120,120,.15);color:#999;border:1px solid rgba(120,120,120,.25)}
.blab{background:rgba(245,158,11,.12);color:var(--amber);border:1px solid rgba(245,158,11,.28)}`;
