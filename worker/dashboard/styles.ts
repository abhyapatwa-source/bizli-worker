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
#cat-wrap{position:relative;width:210px;height:210px;flex-shrink:0}
#cat-holo{
  position:absolute;top:50%;left:50%;
  width:118px;height:150px;margin:-75px 0 0 -59px;
  border-radius:10px;overflow:hidden;
  border:1.5px solid rgba(0,212,255,.8);
  box-shadow:0 0 22px rgba(0,212,255,.9),0 0 44px rgba(0,212,255,.4),0 0 80px rgba(0,212,255,.15),inset 0 0 14px rgba(0,212,255,.12);
  animation:catbreathe 4.2s ease-in-out infinite;
  transition:box-shadow 1.2s ease,border-color 1.2s ease;
}
@keyframes catbreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.022)}}
#cat-holo.amber{
  border-color:rgba(245,158,11,.85);
  box-shadow:0 0 22px rgba(245,158,11,.9),0 0 44px rgba(245,158,11,.4),0 0 80px rgba(245,158,11,.15),inset 0 0 14px rgba(245,158,11,.12);
}
#cat-holo.red{
  border-color:rgba(239,68,68,.85);
  box-shadow:0 0 22px rgba(239,68,68,.9),0 0 44px rgba(239,68,68,.4),0 0 80px rgba(239,68,68,.15),inset 0 0 14px rgba(239,68,68,.12);
}
#cat-img{width:100%;height:100%;object-fit:cover;display:block;filter:brightness(1.06) saturate(1.2)}
.cat-scanline{
  position:absolute;left:0;right:0;height:35%;
  background:linear-gradient(to bottom,transparent,rgba(0,212,255,.14) 50%,transparent);
  animation:catscan 3.5s linear infinite;pointer-events:none;
}
.cat-glare{
  position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(0,212,255,.1) 0%,transparent 55%,rgba(0,212,255,.05) 100%);
  animation:catglare 5s ease-in-out infinite;pointer-events:none;
}
@keyframes catbreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.022)}}
@keyframes catscan{0%{top:-35%}100%{top:100%}}
@keyframes catglare{0%,100%{opacity:.25}50%{opacity:.75}}
.ring{
  position:absolute;top:50%;left:50%;border-radius:50%;
  border:1px solid rgba(0,212,255,.28);
  transform:translate(-50%,-50%) rotateX(62deg);
}
.r1{width:138px;height:138px;animation:rspin 7s linear infinite;border-color:rgba(0,212,255,.4)}
.r2{width:168px;height:168px;animation:rspin 11s linear infinite reverse;border-color:rgba(61,219,217,.28)}
.r3{width:192px;height:192px;animation:rspin 17s linear infinite;border-color:rgba(0,212,255,.16);border-style:dashed}
.r4{width:204px;height:204px;animation:rspin 24s linear infinite reverse;border-color:rgba(61,219,217,.1);border-style:dotted}
.r5{width:214px;height:214px;animation:rspin 33s linear infinite;border-color:rgba(0,212,255,.07);border-width:2px}
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
.pa6{animation:ob1 3.2s linear infinite 1.6s;width:3px;height:3px;margin:-1.5px 0 0 -1.5px;background:rgba(255,255,255,.85);box-shadow:0 0 5px rgba(255,255,255,.8)}
.pa7{animation:ob3 13s linear infinite 3.5s;width:3px;height:3px;margin:-1.5px 0 0 -1.5px;background:var(--cyan);box-shadow:0 0 5px var(--cyan);opacity:.6}
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
#tools-section{grid-column:1;grid-row:3}
#tools-wrap{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-top:8px}
.tchip{
  padding:5px 11px;border-radius:20px;font-size:.75rem;letter-spacing:.04em;
  border:1px solid rgba(34,197,94,.3);background:rgba(34,197,94,.07);color:var(--green);
  transition:all .3s;
}
.tchip.dead{border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.07);color:var(--red)}
.tchip::before{content:"● ";font-size:.62rem;vertical-align:middle}
.ticon-item{
  display:flex;flex-direction:column;align-items:center;gap:4px;
  padding:8px 4px;border-radius:8px;
  border:1px solid rgba(34,197,94,.25);background:rgba(34,197,94,.05);
  cursor:default;transition:all .25s;
}
.ticon-item:hover{background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.5);transform:translateY(-1px)}
.ticon-item.ticon-dead{border-color:rgba(239,68,68,.2);background:rgba(239,68,68,.04)}
.ticon-item.ticon-dead:hover{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.4)}
.ticon-ico{width:20px;height:20px;display:flex;align-items:center;justify-content:center;color:var(--green)}
.ticon-item.ticon-dead .ticon-ico{color:var(--red)}
.ticon-ico svg{width:16px;height:16px;stroke-width:1.5}
.ticon-lbl{font-size:.52rem;letter-spacing:.05em;color:var(--green);text-align:center;opacity:.8}
.ticon-item.ticon-dead .ticon-lbl{color:var(--red);opacity:.7}
#vitals-section{grid-column:2;grid-row:3}
#metrics-section{grid-column:3;grid-row:3;display:none}
#app.tab-overview #metrics-section{display:block}
.met-row{display:flex;flex-direction:column;gap:3px;padding:7px 0;border-bottom:1px solid rgba(0,212,255,.06)}
.met-row:last-child{border-bottom:none}
.met-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
.met-lbl{font-size:.68rem;letter-spacing:.12em;color:var(--muted)}
.met-val{font-size:.75rem;font-weight:700;color:var(--cyan)}
.met-track{height:4px;background:rgba(0,212,255,.08);border-radius:2px;overflow:hidden}
.met-fill{height:100%;border-radius:2px;transition:width .7s ease,background .4s}
.met-g{background:linear-gradient(90deg,var(--green),#4ade80)}
.met-b{background:linear-gradient(90deg,var(--blue),var(--cyan))}
.met-a{background:linear-gradient(90deg,var(--amber),#fbbf24)}
.met-r{background:linear-gradient(90deg,var(--red),#f87171)}
#ekg-canvas{vertical-align:middle;margin:0 5px;opacity:.75}
.h-integrity{font-size:.6rem;letter-spacing:.1em;color:var(--muted);white-space:nowrap}
@keyframes numflash{0%{opacity:1}40%{opacity:.35;color:#fff}100%{opacity:1}}
.num-flash{animation:numflash .45s ease}
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
  #vitals-section{grid-column:1}
  #metrics-section{grid-column:2}
}
@media(max-width:560px){
  .grid{grid-template-columns:1fr}
  #orb-section,#brain-section,#drive-section,#err-section,#users-section,#tools-section,#vitals-section,#metrics-section{grid-column:1}
  #cat-wrap{width:170px;height:170px}
  #cat-holo{width:96px;height:122px;margin:-61px 0 0 -48px}
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
#lab-snd-btn{background:none;border:1px solid rgba(0,212,255,.15);border-radius:4px;cursor:pointer;font-size:.6rem;letter-spacing:.08em;color:var(--muted);padding:2px 6px;transition:color .15s,border-color .15s;margin-left:auto;margin-right:6px;white-space:nowrap}
#lab-snd-btn:hover{color:var(--blue);border-color:rgba(0,212,255,.4)}
#lab-snd-btn.snd-on{color:var(--cyan);border-color:rgba(61,219,217,.4)}
.lab-dot{width:7px;height:7px;border-radius:50%;background:var(--green);
  box-shadow:0 0 7px var(--green);animation:lpulse 1.6s ease-in-out infinite;
  flex-shrink:0}
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
.lb-history-hdr{display:flex;align-items:center;gap:8px;margin:4px 0 8px}
.lb-history-line{flex:1;height:1px;background:rgba(0,212,255,.1)}
.lb-history-btn{font-size:.68rem;color:var(--muted);background:none;border:none;cursor:pointer;letter-spacing:.06em;white-space:nowrap;padding:2px 8px;border-radius:4px;transition:color .15s}
.lb-history-btn:hover{color:var(--blue)}
#lb-history-msgs{display:flex;flex-direction:column;gap:8px;margin-bottom:4px}
.lb-old{opacity:.45}
.lb-session-sep{text-align:center;font-size:.63rem;color:rgba(0,212,255,.28);letter-spacing:.14em;margin:4px 0 6px}
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
.blab{background:rgba(245,158,11,.12);color:var(--amber);border:1px solid rgba(245,158,11,.28)}
#models-section{display:none}
#app.tab-models #models-section{display:block}
#app.tab-models #orb-section,#app.tab-models #brain-section,#app.tab-models #drive-section,#app.tab-models #err-section,#app.tab-models #users-section,#app.tab-models #tools-section,#app.tab-models #vitals-section,#app.tab-models #brains-section{display:none}
#livefeed-section{display:none}
#app.tab-livefeed #livefeed-section{display:block}
#app.tab-livefeed #orb-section,#app.tab-livefeed #brain-section,#app.tab-livefeed #drive-section,#app.tab-livefeed #err-section,#app.tab-livefeed #users-section,#app.tab-livefeed #tools-section,#app.tab-livefeed #vitals-section,#app.tab-livefeed #brains-section{display:none}
#maintenance-section{display:none}
#app.tab-maintenance #maintenance-section{display:block}
#app.tab-maintenance #orb-section,#app.tab-maintenance #brain-section,#app.tab-maintenance #drive-section,#app.tab-maintenance #err-section,#app.tab-maintenance #users-section,#app.tab-maintenance #tools-section,#app.tab-maintenance #vitals-section,#app.tab-maintenance #brains-section{display:none}
.mgroup-hdr{display:flex;align-items:center;font-size:.72rem;letter-spacing:.14em;color:var(--blue);margin-bottom:6px}
.mgroup-hdr::before{content:"▸";color:var(--cyan);margin-right:5px}
.mmodel-list{display:flex;flex-direction:column;gap:5px;margin:4px 0 4px}
.mmodel-item{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:7px;background:rgba(0,212,255,.04);border:1px solid var(--border);font-size:.75rem;transition:background .2s}
.mmodel-item:hover{background:rgba(0,212,255,.07)}
.mmodel-num{width:16px;color:var(--muted);font-size:.67rem;flex-shrink:0}
.mmodel-id{flex:1;color:var(--text);font-family:"Courier New",monospace;font-size:.71rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mmodel-tag{font-size:.62rem;padding:2px 6px;border-radius:10px;flex-shrink:0;letter-spacing:.06em}
.mmodel-tag-live{background:rgba(34,197,94,.12);color:var(--green);border:1px solid rgba(34,197,94,.25)}
.mmodel-tag-vis{background:rgba(61,219,217,.12);color:var(--cyan);border:1px solid rgba(61,219,217,.25)}
.mmodel-tag-lab{background:rgba(245,158,11,.12);color:var(--amber);border:1px solid rgba(245,158,11,.25)}
.mmodel-loading{color:var(--muted);font-size:.72rem;padding:6px;animation:procblink 1.4s infinite}
.msub{font-size:.62rem;color:var(--muted);margin:3px 0 8px;line-height:1.5}
.maint-status{display:flex;align-items:center;gap:10px;padding:13px;border-radius:9px;margin:6px 0 4px;font-size:.8rem;font-weight:700;letter-spacing:.1em}
.maint-on{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);color:var(--amber)}
.maint-off{background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);color:var(--green)}
.maint-cmd{background:rgba(0,212,255,.04);border:1px solid rgba(0,212,255,.1);border-radius:7px;padding:9px 12px;font-size:.73rem;margin:5px 0;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:background .15s;user-select:none}
.maint-cmd:hover{background:rgba(0,212,255,.09)}
.maint-cmd code{color:var(--cyan);font-family:"Courier New",monospace;font-size:.72rem}
.pl-wrap{display:flex;align-items:center;gap:4px;margin:6px 0 4px}
.plnode{flex:1;padding:6px 4px;border-radius:7px;text-align:center;border:1px solid var(--border);background:rgba(0,212,255,.02);transition:all .4s ease;min-width:0}
.plnode-primary{border-color:rgba(0,212,255,.18)}
.plnode-last{border-color:rgba(120,120,120,.15)}
.plnode.pl-active{border-color:var(--blue);background:rgba(0,212,255,.1);box-shadow:0 0 12px rgba(0,212,255,.25)}
.plnode.pl-fallback{border-color:var(--amber);background:rgba(245,158,11,.08);box-shadow:0 0 8px rgba(245,158,11,.18)}
.pldot{width:6px;height:6px;border-radius:50%;background:var(--muted);margin:0 auto 3px;opacity:.4;transition:all .4s}
.plnode.pl-active .pldot{background:var(--green);opacity:1;box-shadow:0 0 6px var(--green);animation:lpulse 1.4s infinite}
.plnode.pl-fallback .pldot{background:var(--amber);opacity:1;box-shadow:0 0 5px var(--amber)}
.pldot-lab{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--amber);opacity:.6;vertical-align:middle;margin-right:4px}
.plname{font-size:.58rem;letter-spacing:.09em;color:var(--text)}
.plsub{font-size:.55rem;color:var(--muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.plarrow{color:var(--border);font-size:.8rem;flex-shrink:0;line-height:1}
.pl-lab-row{display:flex;align-items:center;margin:4px 0 6px;padding:4px 6px;background:rgba(245,158,11,.04);border-radius:5px;border:1px solid rgba(245,158,11,.1)}
.pl-divider{height:1px;background:rgba(0,212,255,.06);margin:6px 0}
@keyframes skelshine{0%{background-position:-400px 0}100%{background-position:calc(400px + 100%) 0}}
.skel-row{height:10px;border-radius:4px;background:linear-gradient(90deg,rgba(0,212,255,.04) 25%,rgba(0,212,255,.1) 50%,rgba(0,212,255,.04) 75%);background-size:400px 100%;animation:skelshine 1.5s infinite;margin-bottom:5px}
.skel-chip{height:24px;border-radius:12px;background:linear-gradient(90deg,rgba(0,212,255,.04) 25%,rgba(0,212,255,.1) 50%,rgba(0,212,255,.04) 75%);background-size:400px 100%;animation:skelshine 1.5s infinite;display:inline-block;margin:3px}
.skel-kdot{background:linear-gradient(90deg,rgba(0,212,255,.04) 25%,rgba(0,212,255,.09) 50%,rgba(0,212,255,.04) 75%)!important;background-size:400px 100%!important;animation:skelshine 1.5s infinite!important;border-color:rgba(0,212,255,.08)!important;color:transparent!important}
#tests-section{display:none}
#app.tab-tests #tests-section{display:block}
#app.tab-tests #orb-section,#app.tab-tests #brain-section,#app.tab-tests #drive-section,#app.tab-tests #err-section,#app.tab-tests #users-section,#app.tab-tests #tools-section,#app.tab-tests #vitals-section,#app.tab-tests #brains-section{display:none}
.tpass-wrap{display:flex;align-items:center;gap:14px;margin:6px 0 4px}
.tpass-num{font-size:2rem;font-weight:700;color:var(--blue);letter-spacing:.04em;min-width:64px}
.tpass-bar-track{flex:1;height:6px;background:rgba(0,212,255,.08);border-radius:3px;overflow:hidden}
.tpass-bar{height:100%;border-radius:3px;transition:width .8s ease,background .4s}
.tpass-bar.tpass-green{background:linear-gradient(90deg,var(--green),#4ade80)}
.tpass-bar.tpass-amber{background:linear-gradient(90deg,var(--amber),#fbbf24)}
.tpass-bar.tpass-red{background:linear-gradient(90deg,var(--red),#f87171)}
.tresult{display:flex;align-items:center;gap:7px;padding:7px 10px;border-radius:7px;font-size:.74rem;margin-bottom:5px;border:1px solid var(--border);background:rgba(0,212,255,.025)}
.tresult.tresult-pass{border-color:rgba(34,197,94,.18);background:rgba(34,197,94,.03)}
.tresult.tresult-fail{border-color:rgba(239,68,68,.18);background:rgba(239,68,68,.03)}
.tname{flex:1;color:var(--text);letter-spacing:.04em}
.tlang{font-size:.62rem;color:var(--muted);background:rgba(0,212,255,.06);padding:1px 5px;border-radius:3px}
.tscore{color:var(--cyan);font-weight:700;width:28px;text-align:right}
.tpass-chip{font-size:.6rem;letter-spacing:.08em;padding:2px 6px;border-radius:10px;flex-shrink:0}
.tpass-y{background:rgba(34,197,94,.12);color:var(--green);border:1px solid rgba(34,197,94,.25)}
.tpass-n{background:rgba(239,68,68,.1);color:var(--red);border:1px solid rgba(239,68,68,.22)}
.ttime{color:var(--muted);font-size:.62rem;flex-shrink:0}`;
