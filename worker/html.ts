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
*{box-sizing:border-box;margin:0;padding:0}
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
/* TOP BAR */
#topbar{
  position:sticky;top:0;z-index:100;display:flex;align-items:center;gap:14px;
  padding:9px 20px;background:rgba(6,9,18,.92);border-bottom:1px solid var(--border);
  backdrop-filter:blur(14px);
}
.t-logo{font-size:1rem;font-weight:700;letter-spacing:.22em;color:var(--blue);text-shadow:var(--glow-b)}
.t-live{display:flex;align-items:center;gap:6px;margin-left:4px}
.live-dot{width:7px;height:7px;border-radius:50%;background:var(--green);animation:lpulse 1.4s ease-in-out infinite;box-shadow:0 0 7px var(--green)}
@keyframes lpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.65)}}
.live-txt{color:var(--green);font-size:.68rem;letter-spacing:.12em}
#sync-time{margin-left:auto;color:var(--muted);font-size:.66rem;letter-spacing:.04em}
/* GATE */
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
#pw-err{color:var(--red);font-size:.72rem;margin-top:7px;min-height:16px}
/* LAYOUT */
#app{position:relative;z-index:1;padding:12px 14px;display:none;margin-left:240px;margin-right:360px;transition:margin-left 0.3s ease,margin-right 0.3s ease}
.summary-row{
  display:flex;gap:10px;padding:12px 16px;margin-bottom:12px;flex-wrap:wrap;
  background:rgba(0,212,255,.04);border:1px solid rgba(0,212,255,.1);border-radius:10px;
}
.sbox{flex:1;min-width:70px;text-align:center}
.snum{font-size:1.35rem;font-weight:700;color:var(--blue);font-family:"Courier New",monospace;min-width:1ch}
.slbl{font-size:.54rem;color:var(--muted);letter-spacing:.1em;margin-top:2px}
.grid{
  display:grid;gap:12px;
  grid-template-columns:1.05fr 1.2fr 1.2fr;
  grid-template-rows:auto auto auto;
}
/* PANELS */
.panel{
  background:var(--panel);border:1px solid var(--border);border-radius:12px;
  padding:15px;position:relative;overflow:hidden;
}
.panel::before{
  content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(135deg,rgba(0,212,255,.035) 0%,transparent 55%);
}
.ptitle{
  font-size:.6rem;letter-spacing:.2em;color:var(--blue);margin-bottom:11px;
  display:flex;align-items:center;gap:7px;
}
.ptitle::before{content:"▸";color:var(--cyan)}
/* ORB SECTION */
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
#orb-status{font-size:.6rem;letter-spacing:.26em;color:var(--blue);margin-bottom:5px}
#orb-brain{font-size:1.05rem;letter-spacing:.12em;font-weight:700}
#orb-sub{font-size:.65rem;color:var(--muted);margin-top:5px}
/* BRAIN MAP */
#brain-section{grid-column:2;grid-row:1}
.kgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.kdot{
  padding:7px 3px;border-radius:6px;text-align:center;
  font-size:.6rem;border:1px solid var(--border);
  transition:all .55s ease;
}
.kdot.ready{background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.4);color:var(--green);box-shadow:0 0 8px rgba(34,197,94,.18)}
.kdot.rpm_cooling{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.38);color:var(--amber)}
.kdot.tpd_cooling{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.3);color:var(--red)}
.kdot.ready.lastused{animation:kpulse .7s ease;border-color:var(--green);box-shadow:0 0 16px rgba(34,197,94,.6)}
@keyframes kpulse{0%,100%{box-shadow:0 0 16px rgba(34,197,94,.6)}50%{box-shadow:0 0 32px rgba(34,197,94,1)}}
.kcd{font-size:.5rem;opacity:.75;display:block;margin-top:2px}
.ainode{
  margin-top:7px;padding:8px 10px;border-radius:8px;
  display:flex;align-items:center;gap:8px;font-size:.7rem;
  border:1px solid var(--border);background:rgba(61,219,217,.04);
}
.adot{width:8px;height:8px;border-radius:50%;flex-shrink:0;transition:all .5s}
.adot.standby{background:var(--cyan);box-shadow:0 0 5px var(--cyan);opacity:.5}
.adot.active{background:var(--green);box-shadow:0 0 9px var(--green);opacity:1;animation:lpulse 1.2s infinite}
/* WHO'S DRIVING */
#drive-section{grid-column:3;grid-row:1}
#drive-list{display:flex;flex-direction:column;gap:6px;max-height:215px;overflow-y:auto}
.ditem{
  display:flex;align-items:center;gap:7px;padding:6px 9px;border-radius:6px;
  background:rgba(0,212,255,.03);border:1px solid rgba(0,212,255,.08);font-size:.66rem;
}
.ditem.newin{animation:slidein .38s ease}
@keyframes slidein{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
.dbrain{
  padding:2px 6px;border-radius:4px;font-size:.58rem;letter-spacing:.06em;
  font-weight:700;flex-shrink:0;
}
.dbrain.groq{background:rgba(0,212,255,.18);color:var(--blue)}
.dbrain.gemini{background:rgba(245,158,11,.18);color:var(--amber)}
.dbrain.openrouter{background:rgba(168,100,255,.18);color:#a864ff}
.dbrain.worker{background:rgba(90,90,90,.2);color:#999}
.dtime{margin-left:auto;color:var(--muted);font-size:.58rem;flex-shrink:0}
/* LIVE ERRORS */
#err-section{grid-column:2;grid-row:2}
#err-log{
  font-family:"Courier New",monospace;font-size:.58rem;line-height:1.65;
  color:#22c55e;background:#030805;
  border-radius:6px;padding:9px;max-height:210px;overflow-y:auto;
  border:1px solid rgba(34,197,94,.18);
}
.eline{margin-bottom:3px;word-break:break-all;opacity:.9}
.eline::before{content:"> ";color:rgba(34,197,94,.4)}
.ets{color:rgba(34,197,94,.45);font-size:.52rem}
.no-err{color:rgba(34,197,94,.35);font-size:.65rem;padding:6px 0}
/* USERS */
#users-section{grid-column:3;grid-row:2}
#user-list{display:flex;flex-direction:column;gap:6px;max-height:210px;overflow-y:auto}
.uitem{
  padding:7px 10px;border-radius:7px;
  background:rgba(0,212,255,.025);border:1px solid var(--border);
}
.utop{display:flex;align-items:center;gap:6px;font-size:.68rem;margin-bottom:4px}
.umsgs{margin-left:auto;color:var(--cyan);font-size:.64rem;font-weight:600}
.ubar-wrap{height:3px;background:rgba(0,212,255,.1);border-radius:2px;overflow:hidden}
.ubar{height:100%;background:linear-gradient(90deg,var(--blue),var(--cyan));border-radius:2px;transition:width .9s ease}
.ulast{color:var(--muted);font-size:.53rem;margin-top:3px}
.odot{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 5px var(--green);flex-shrink:0;animation:lpulse 1.6s infinite}
.xdot{width:6px;height:6px;border-radius:50%;background:var(--muted);flex-shrink:0}
/* TOOLS */
#tools-section{grid-column:1/3;grid-row:3}
#tools-wrap{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.tchip{
  padding:5px 11px;border-radius:20px;font-size:.6rem;letter-spacing:.04em;
  border:1px solid rgba(34,197,94,.3);background:rgba(34,197,94,.07);color:var(--green);
  transition:all .3s;
}
.tchip.dead{border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.07);color:var(--red)}
.tchip::before{content:"● ";font-size:.48rem;vertical-align:middle}
/* VITALS */
#vitals-section{grid-column:3;grid-row:3}
.vrow{
  display:flex;justify-content:space-between;align-items:center;
  padding:6px 0;border-bottom:1px solid rgba(0,212,255,.06);font-size:.68rem;
}
.vrow:last-child{border-bottom:none}
.vk{color:var(--muted);font-size:.62rem;letter-spacing:.08em}
.vv{color:var(--cyan);font-weight:600;letter-spacing:.04em;text-align:right}
/* SCROLLBAR */
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
/* RESPONSIVE */
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
/* LAB AGENT PANEL */
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
.lab-title{font-size:.62rem;letter-spacing:.28em;color:var(--blue);font-weight:700}
.lab-dot{width:7px;height:7px;border-radius:50%;background:var(--green);
  box-shadow:0 0 7px var(--green);animation:lpulse 1.6s ease-in-out infinite;
  flex-shrink:0;margin-left:auto}
#lab-body{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
.lbmsg{max-width:85%;padding:9px 12px;border-radius:12px;font-size:.68rem;line-height:1.55;word-break:break-word;white-space:pre-wrap}
.lbu{align-self:flex-end;background:rgba(0,212,255,.18);border:1px solid rgba(0,212,255,.3);color:var(--text);border-radius:12px 12px 3px 12px}
.lba{align-self:flex-start;background:#0d1422;border:1px solid rgba(0,212,255,.08);color:#c8ddf0;font-family:"Courier New",monospace;border-radius:12px 12px 12px 3px}
.lbsys{align-self:center;color:var(--muted);font-size:.58rem;font-style:italic;max-width:100%;text-align:center;padding:4px 0}
#lab-proc{
  padding:8px 16px;font-size:.58rem;color:var(--cyan);letter-spacing:.1em;
  display:none;flex-shrink:0;animation:procblink 1.2s ease-in-out infinite;
}
@keyframes procblink{0%,100%{opacity:.4}50%{opacity:1}}
#lab-input{
  padding:10px 12px;border-top:1px solid rgba(0,212,255,.1);
  display:flex;gap:8px;flex-shrink:0;align-items:flex-end;
}
#lab-ta{
  flex:1;background:#0a1020;border:1px solid rgba(0,212,255,.2);color:var(--text);
  border-radius:8px;padding:8px 10px;font-family:"Courier New",monospace;font-size:.68rem;
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
  font-size:.65rem;font-weight:700;letter-spacing:.06em;color:#060912;
}
/* LEFT NAV */
#leftnav{
  position:fixed;left:0;top:0;bottom:0;width:240px;
  background:rgba(8,12,22,.96);backdrop-filter:blur(14px);
  border-right:1px solid rgba(0,212,255,.12);
  z-index:200;display:none;flex-direction:column;
  transition:transform 0.3s ease,width 0.3s ease;overflow:hidden;
}
#lnav-brand{padding:16px 16px 12px;border-bottom:1px solid rgba(0,212,255,.08);flex-shrink:0}
.lnav-logo{font-size:.72rem;font-weight:700;letter-spacing:.2em;color:var(--blue);text-shadow:var(--glow-b);white-space:nowrap;display:block}
.lnav-ver{display:block;font-size:.52rem;color:var(--muted);letter-spacing:.08em;margin-top:4px;white-space:nowrap}
#lnav-tabs{flex:1;overflow-y:auto;padding:8px 0;overflow-x:hidden}
.lnav-item{
  display:flex;align-items:center;gap:12px;height:40px;padding:0 16px;
  cursor:pointer;color:#9ca3af;font-size:.7rem;letter-spacing:.06em;
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
#lnav-foot .live-txt{font-size:.6rem}
#lnav-ham{
  display:none;position:fixed;top:10px;left:10px;z-index:201;
  background:rgba(8,12,22,.96);border:1px solid rgba(0,212,255,.2);
  border-radius:6px;width:32px;height:32px;cursor:pointer;
  align-items:center;justify-content:center;color:rgba(0,212,255,.75);font-size:1.1rem;
}
/* TAB CONTENT */
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
</style>
</head>
<body>
<div id="stars"></div>
<button id="lnav-ham" onclick="lnavToggle()">&#9776;</button>
<!-- GATE -->
<div id="gate">
  <div class="gate-box">
    <div class="gate-logo">⬡</div>
    <h2>BIZLI LAB</h2>
    <p>Admin command center — restricted access</p>
    <form id="pw-form" onsubmit="submitPw();return false;">
      <input id="pw-input" type="password" placeholder="Enter admin password" autocomplete="off">
      <button type="submit" id="pw-btn">ENTER</button>
    </form>
    <div id="pw-err"></div>
  </div>
</div>
<!-- LEFT NAV -->
<nav id="leftnav">
  <div id="lnav-brand">
    <span class="lnav-logo">⬡ BIZLI LAB</span>
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
    <div class="lnav-item disabled" title="Phase 2"><i data-lucide="brain"></i><span>Brains</span></div>
    <div class="lnav-item disabled" title="Phase 2"><i data-lucide="cpu"></i><span>Models</span></div>
    <div class="lnav-item disabled" title="Phase 2"><i data-lucide="zap"></i><span>Live Feed</span></div>
    <div class="lnav-item disabled" title="Phase 2"><i data-lucide="settings"></i><span>Maintenance</span></div>
  </div>
  <div id="lnav-foot">
    <span class="live-dot"></span>
    <span class="live-txt">LIVE</span>
  </div>
</nav>
<!-- DASHBOARD -->
<div id="app">
  <div id="topbar">
    <span class="t-logo">⬡ BIZLI LAB</span>
    <div class="t-live">
      <span class="live-dot"></span>
      <span class="live-txt">LIVE</span>
    </div>
    <span id="sync-time">connecting...</span>
  </div>
  <div style="padding-top:4px">
    <!-- SUMMARY ROW -->
    <div class="summary-row">
      <div class="sbox"><div class="snum" id="s-users">—</div><div class="slbl">USERS</div></div>
      <div class="sbox"><div class="snum" id="s-appr">—</div><div class="slbl">APPROVED</div></div>
      <div class="sbox"><div class="snum" id="s-msgs">—</div><div class="slbl">MESSAGES</div></div>
      <div class="sbox"><div class="snum" id="s-mems">—</div><div class="slbl">MEMORIES</div></div>
      <div class="sbox"><div class="snum" id="s-keys">—</div><div class="slbl">GROQ LIVE</div></div>
      <div class="sbox"><div class="snum" id="s-tools">—</div><div class="slbl">TOOLS OK</div></div>
    </div>
    <!-- GRID -->
    <div class="grid">
      <!-- ORB -->
      <div class="panel" id="orb-section">
        <div id="orb-wrap">
          <div class="ring r1"></div>
          <div class="ring r2"></div>
          <div class="ring r3"></div>
          <div id="orb"></div>
          <div class="particle pa1"></div>
          <div class="particle pa2"></div>
          <div class="particle pa3"></div>
          <div class="particle pa4"></div>
          <div class="particle pa5"></div>
        </div>
        <div id="orb-info">
          <div id="orb-status">◉ CORE SYSTEM</div>
          <div id="orb-brain">INITIALIZING</div>
          <div id="orb-sub">awaiting first sync</div>
        </div>
      </div>
      <!-- BRAIN MAP -->
      <div class="panel" id="brain-section">
        <div class="ptitle">NEURAL MAP — GROQ KEYS</div>
        <div class="kgrid" id="kgrid"></div>
        <div id="ainodes" style="margin-top:9px">
          <div class="ainode">
            <div class="adot standby" id="gem-dot"></div>
            <div>
              <div style="font-size:.7rem">Gemini Flash</div>
              <div style="font-size:.56rem;color:var(--muted)" id="gem-sub">Standby</div>
            </div>
          </div>
          <div class="ainode" style="margin-top:6px">
            <div class="adot standby" id="wai-dot"></div>
            <div>
              <div style="font-size:.7rem">Worker AI</div>
              <div style="font-size:.56rem;color:var(--muted)">Last resort</div>
            </div>
          </div>
        </div>
      </div>
      <!-- WHO'S DRIVING -->
      <div class="panel" id="drive-section">
        <div class="ptitle">WHO'S DRIVING</div>
        <div id="drive-list"><div style="color:var(--muted);font-size:.68rem">awaiting data...</div></div>
      </div>
      <!-- LIVE ERRORS -->
      <div class="panel" id="err-section">
        <div class="ptitle">LIVE ERRORS — SYSTEM LOG</div>
        <div id="err-log"><div class="no-err">■ All systems nominal</div></div>
      </div>
      <!-- USERS -->
      <div class="panel" id="users-section">
        <div class="ptitle">USER LEADERBOARD</div>
        <div id="user-list"><div style="color:var(--muted);font-size:.68rem">awaiting data...</div></div>
      </div>
      <!-- TOOLS -->
      <div class="panel" id="tools-section">
        <div class="ptitle">TOOLS HEALTH</div>
        <div id="tools-wrap"></div>
      </div>
      <!-- VITALS -->
      <div class="panel" id="vitals-section">
        <div class="ptitle">VITALS</div>
        <div class="vrow"><span class="vk">VERSION</span><span class="vv" id="v-ver">—</span></div>
        <div class="vrow"><span class="vk">SERVER UTC</span><span class="vv" id="v-utc">—</span></div>
        <div class="vrow"><span class="vk">SERVER IST</span><span class="vv" id="v-ist">—</span></div>
        <div class="vrow"><span class="vk">LAST SYNC</span><span class="vv" id="v-sync">—</span></div>
        <div class="vrow"><span class="vk">ERRORS LOGGED</span><span class="vv" id="v-errc">—</span></div>
        <div class="vrow"><span class="vk">MEMORIES</span><span class="vv" id="v-mems">—</span></div>
        <div class="vrow"><span class="vk">WAITLIST</span><span class="vv" id="v-wait">—</span></div>
      </div>
    </div>
  </div>
</div>
<!-- LAB AGENT PANEL -->
<div id="lab">
  <div id="lab-hdr">
    <span class="lab-title">LAB AGENT</span>
    <span class="lab-dot"></span>
  </div>
  <div id="lab-body">
    <div class="lbsys">Lab Agent online. Read-only diagnostics.</div>
  </div>
  <div id="lab-proc">Processing...</div>
  <div id="lab-input">
    <textarea id="lab-ta" rows="1" placeholder="Ask about system health..."></textarea>
    <button id="lab-send">&#9658;</button>
  </div>
</div>
<button id="lab-btn" onclick="labToggleDesktop()">&#8250;</button>
<button id="lab-toggle" onclick="labToggle()">LAB</button>
<script>
try{(function(){
  var s=document.getElementById("stars");
  for(var i=0;i<130;i++){
    var el=document.createElement("div");
    el.className="star";
    var sz=Math.random()*2+.4;
    el.style.cssText="width:"+sz+"px;height:"+sz+"px;top:"+(Math.random()*100)+"%;left:"+
      (Math.random()*100)+"%;--d:"+(2+Math.random()*5)+"s;--delay:-"+(Math.random()*5)+
      "s;background:#ffffff;opacity:"+(0.08+Math.random()*.45);
    s.appendChild(el);
  }
})();}catch(e){}

var PW="",prevN={},knownDrive=[],started=false,lastD=null;

function submitPw(){
  var v=document.getElementById("pw-input").value.trim();
  if(!v){document.getElementById("pw-err").textContent="Enter password";return;}
  PW=v;
  document.getElementById("pw-err").textContent="Connecting...";
  fetchStats(true);
}
try{document.getElementById("pw-btn").addEventListener("click",submitPw);}catch(e){}
try{document.getElementById("pw-input").addEventListener("keydown",function(e){if(e.key==="Enter")submitPw();});}catch(e){}

function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function fmt(n){return n>=1000?(n/1000).toFixed(1)+"k":String(n);}
function secs(s){
  if(s<60)return s+"s";
  if(s<3600)return Math.floor(s/60)+"m "+Math.floor(s%60)+"s";
  return Math.floor(s/3600)+"h "+Math.floor((s%3600)/60)+"m";
}
function animN(el,to){
  var from=parseInt(el.textContent.replace("k",""))||0;
  if(from===to)return;
  var steps=22,st=0,diff=to-from;
  var t=setInterval(function(){
    st++;el.textContent=fmt(Math.round(from+diff*(st/steps)));
    if(st>=steps){clearInterval(t);el.textContent=fmt(to);}
  },24);
}
function setN(id,val){
  var el=document.getElementById(id);if(!el)return;
  if(prevN[id]!==val){animN(el,val);prevN[id]=val;}
}

function updateOrb(d){
  var orb=document.getElementById("orb");
  var obrain=document.getElementById("orb-brain");
  var osub=document.getElementById("orb-sub");
  var ost=document.getElementById("orb-status");
  var errs=d.recentErrors?d.recentErrors.length:0;
  var lb=d.lastBrains&&d.lastBrains.length?d.lastBrains[0].brain:"groq";
  var rk=d.groq?d.groq.filter(function(k){return k.status==="ready";}).length:0;
  orb.className="";
  if(errs>=5){
    orb.className="red";
    ost.textContent="⚠ ERROR SPIKE";ost.style.color="var(--red)";
  }else if(lb&&lb!=="groq"){
    orb.className="amber";
    ost.textContent="◉ FALLBACK ACTIVE";ost.style.color="var(--amber)";
  }else{
    ost.textContent="◉ CORE SYSTEM";ost.style.color="var(--blue)";
  }
  obrain.textContent=lb?lb.toUpperCase():"GROQ";
  osub.textContent=rk+" / "+(d.groq?d.groq.length:0)+" Groq keys ready";
}

function updateBrain(d){
  var grid=document.getElementById("kgrid");
  if(!d.groq||!d.groq.length)return;
  var lastKey=d.lastBrains&&d.lastBrains.length?d.lastBrains[0].key:null;
  var lastBrain=d.lastBrains&&d.lastBrains.length?d.lastBrains[0].brain:"groq";
  var h="";
  d.groq.forEach(function(k,i){
    var lu=(lastBrain==="groq"&&i===lastKey)?" lastused":"";
    var cd=k.secondsLeft>0?("<span class='kcd'>"+secs(k.secondsLeft)+"</span>"):"";
    h+="<div class='kdot "+k.status+lu+"' title='"+k.name+": "+k.status+"'>"+k.name+cd+"</div>";
  });
  grid.innerHTML=h;
  var gemActive=lastBrain==="gemini";
  var gemDot=document.getElementById("gem-dot");
  var gemSub=document.getElementById("gem-sub");
  gemDot.className="adot "+(gemActive?"active":"standby");
  gemSub.textContent=(d.gemini?d.gemini.keysConfigured:0)+" keys · "+(gemActive?"ACTIVE":"Standby");
}

function updateDrive(d){
  if(!d.lastBrains||!d.lastBrains.length)return;
  var list=document.getElementById("drive-list");
  var h="";
  d.lastBrains.forEach(function(b,i){
    var brain=b.brain||"groq";
    var kl=b.key!=null?" · key "+b.key:"";
    var sig=JSON.stringify(b);
    var isnew=i===0&&(!knownDrive.length||knownDrive[0]!==sig);
    h+="<div class='ditem"+(isnew?" newin":"")+"'>";
    h+="<span class='dbrain "+brain+"'>"+brain.toUpperCase()+"</span>";
    h+="<span style='color:var(--muted);font-size:.58rem'>"+kl+"</span>";
    h+="<span class='dtime'>"+b.timeAgo+"</span></div>";
  });
  list.innerHTML=h;
  knownDrive=d.lastBrains.map(function(b){return JSON.stringify(b);});
}

function updateErrors(d){
  var log=document.getElementById("err-log");
  if(!d.recentErrors||!d.recentErrors.length){
    log.innerHTML="<div class='no-err'>&#9632; All systems nominal</div>";return;
  }
  var h="";
  d.recentErrors.slice().reverse().forEach(function(e){
    var ts=e.timestamp?e.timestamp.replace("T"," ").slice(0,19):"";
    h+="<div class='eline'><span class='ets'>["+ts+"] </span>"+esc(e.detail)+"</div>";
  });
  log.innerHTML=h;
  log.scrollTop=log.scrollHeight;
}

function updateUsers(d){
  var list=document.getElementById("user-list");
  if(!d.messages||!d.messages.perUser||!d.messages.perUser.length){
    list.innerHTML="<div style='color:var(--muted);font-size:.68rem'>No users yet</div>";return;
  }
  var users=d.messages.perUser.slice(0,10);
  var maxc=users[0].count||1;
  var h="";
  users.forEach(function(u){
    var pct=Math.max(4,Math.round((u.count/maxc)*100));
    h+="<div class='uitem'>";
    h+="<div class='utop'><span class='xdot'></span><span>"+esc(u.name)+"</span>";
    h+="<span class='umsgs'>"+u.count+" msg</span></div>";
    h+="<div class='ubar-wrap'><div class='ubar' style='width:"+pct+"%'></div></div>";
    h+="<div class='ulast'>"+esc(u.lastOnlineIST)+"</div></div>";
  });
  list.innerHTML=h;
}

function updateTools(d){
  if(!d.tools)return;
  var wrap=document.getElementById("tools-wrap");
  var h="";
  d.tools.forEach(function(t){
    h+="<div class='tchip"+(t.keyConfigured?"":" dead")+"'>"+t.name.replace(/_/g," ")+"</div>";
  });
  wrap.innerHTML=h;
  setN("s-tools",d.tools.filter(function(t){return t.keyConfigured;}).length);
}

function updateVitals(d){
  var el=function(id){return document.getElementById(id);};
  if(el("v-ver"))el("v-ver").textContent=d.version||"—";
  if(el("lnav-ver"))el("lnav-ver").textContent=d.version||"";
  if(el("v-mems"))el("v-mems").textContent=d.memory?d.memory.count:"—";
  if(el("v-errc"))el("v-errc").textContent=d.recentErrors?d.recentErrors.length:0;
  if(el("v-wait"))el("v-wait").textContent=d.users?d.users.waitlist:"—";
}

function tickClock(){
  var n=new Date();
  var uel=document.getElementById("v-utc");
  var iel=document.getElementById("v-ist");
  if(uel)uel.textContent=n.toUTCString().replace(" GMT","");
  if(iel)iel.textContent=n.toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"short",timeStyle:"medium"});
}

function updateAll(d){
  lastD=d;
  updateOrb(d);updateBrain(d);updateDrive(d);updateErrors(d);
  updateUsers(d);updateTools(d);updateVitals(d);
  setN("s-users",d.users?d.users.total:0);
  setN("s-appr",d.users?d.users.approved:0);
  setN("s-msgs",d.messages?d.messages.total:0);
  setN("s-mems",d.memory?d.memory.count:0);
  setN("s-keys",d.groq?d.groq.filter(function(k){return k.status==="ready";}).length:0);
  var now=new Date();
  var ts=now.toLocaleTimeString();
  document.getElementById("sync-time").textContent="Last sync: "+ts;
  var sv=document.getElementById("v-sync");if(sv)sv.textContent=ts;
}

function fetchStats(first){
  if(!PW)return;
  fetch("/admin/stats?key="+encodeURIComponent(PW))
    .then(function(r){
      if(r.status===401){
        if(first){document.getElementById("pw-err").textContent="Wrong password";PW="";}
        return null;
      }
      return r.json();
    })
    .then(function(d){
      if(!d)return;
      if(first){
        document.getElementById("gate").style.display="none";
        document.getElementById("app").style.display="block";
        document.getElementById("lab").style.display="flex";
        document.getElementById("leftnav").style.display="flex";
        var lbtn=document.getElementById("lab-btn");if(lbtn)lbtn.style.display="flex";
        try{if(localStorage.getItem("bizli_lab_collapsed")==="1")setLabState(true,false);}catch(e){}
        try{switchTab(localStorage.getItem("bizli_nav_tab")||"overview");}catch(e){switchTab("overview");}
      }
      updateAll(d);
    })
    .catch(function(){
      if(first)document.getElementById("pw-err").textContent="Connection error — retry";
      var st=document.getElementById("sync-time");
      if(st)st.textContent="DISCONNECTED";
    });
}

setInterval(function(){fetchStats(false);},3000);
setInterval(tickClock,1000);
tickClock();

// LAB AGENT
var labHistory=[],labBusy=false,LAB_MAX=30;
(function(){
  try{
    var s=localStorage.getItem("bizli_lab_chat");
    if(s){
      var ms=JSON.parse(s);
      if(Array.isArray(ms)&&ms.length){
        labHistory=ms;
        var b=document.getElementById("lab-body");
        b.innerHTML="";
        ms.forEach(function(m){appendLabBubble(m.role==="user"?"u":"a",m.content,false);});
      }
    }
  }catch(e){}
})();
function appendLabBubble(type,text,scroll){
  var b=document.getElementById("lab-body");
  var d=document.createElement("div");
  d.className="lbmsg "+(type==="u"?"lbu":"lba");
  d.textContent=text;
  b.appendChild(d);
  if(scroll!==false)b.scrollTop=b.scrollHeight;
  return d;
}
function typewriterLab(el,text,onDone){
  var i=0;el.textContent="";
  var iv=setInterval(function(){
    el.textContent+=text[i];i++;
    document.getElementById("lab-body").scrollTop=document.getElementById("lab-body").scrollHeight;
    if(i>=text.length){clearInterval(iv);if(onDone)onDone();}
  },18);
}
function saveLabHistory(){
  try{localStorage.setItem("bizli_lab_chat",JSON.stringify(labHistory.slice(-LAB_MAX)));}catch(e){}
}
function labSend(){
  if(labBusy||!PW)return;
  var ta=document.getElementById("lab-ta");
  var msg=ta.value.trim();
  if(!msg)return;
  ta.value="";ta.style.height="auto";
  appendLabBubble("u",msg,true);
  labHistory.push({role:"user",content:msg});
  if(labHistory.length>LAB_MAX)labHistory=labHistory.slice(-LAB_MAX);
  saveLabHistory();
  labBusy=true;
  document.getElementById("lab-proc").style.display="block";
  fetch("/lab/agent",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({key:PW,messages:labHistory.map(function(m){return{role:m.role,content:m.content};}),dashboardData:lastD||{}})
  })
  .then(function(r){return r.json();})
  .then(function(data){
    document.getElementById("lab-proc").style.display="none";
    var reply=data.reply||"No response.";
    var el=appendLabBubble("a","",true);
    typewriterLab(el,reply,function(){
      labHistory.push({role:"assistant",content:reply});
      if(labHistory.length>LAB_MAX)labHistory=labHistory.slice(-LAB_MAX);
      saveLabHistory();
      labBusy=false;
    });
  })
  .catch(function(e){
    document.getElementById("lab-proc").style.display="none";
    appendLabBubble("a","Error: "+(e.message||"Connection failed"),true);
    labBusy=false;
  });
}
function switchTab(tab){
  var app=document.getElementById("app");
  app.className=app.className.replace(/\btab-\S+/g,"").trim();
  app.classList.add("tab-"+tab);
  var items=document.querySelectorAll(".lnav-item[data-tab]");
  for(var i=0;i<items.length;i++){
    items[i].classList.toggle("active",items[i].getAttribute("data-tab")===tab);
  }
  try{localStorage.setItem("bizli_nav_tab",tab);}catch(e){}
}
function lnavToggle(){document.getElementById("leftnav").classList.toggle("open");}
function setLabState(collapsed,animate){
  var lab=document.getElementById("lab");
  var btn=document.getElementById("lab-btn");
  var app=document.getElementById("app");
  if(!animate){lab.style.transition="none";if(btn)btn.style.transition="none";app.style.transition="none";}
  if(collapsed){
    lab.classList.add("collapsed");
    if(btn){btn.style.right="0";btn.textContent="‹";}
    app.style.marginRight="0";
  }else{
    lab.classList.remove("collapsed");
    if(btn){btn.style.right="344px";btn.textContent="›";}
    app.style.marginRight="360px";
  }
  if(!animate){lab.offsetHeight;lab.style.transition="";if(btn)btn.style.transition="";app.style.transition="";}
  try{localStorage.setItem("bizli_lab_collapsed",collapsed?"1":"0");}catch(e){}
}
function labToggleDesktop(){setLabState(!document.getElementById("lab").classList.contains("collapsed"),true);}
function labToggle(){document.getElementById("lab").classList.toggle("open");}
try{
  document.getElementById("lab-send").addEventListener("click",labSend);
  document.getElementById("lab-ta").addEventListener("keydown",function(e){
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();labSend();}
  });
  document.getElementById("lab-ta").addEventListener("input",function(){
    this.style.height="auto";
    this.style.height=Math.min(this.scrollHeight,120)+"px";
  });
}catch(e){}
try{if(typeof lucide!=="undefined")lucide.createIcons();}catch(e){}
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
