export const DASHBOARD_SCRIPTS = `try{(function(){
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

var PW="",prevN={},knownDrive=[],started=false,lastD=null,lastQ=null;
var ekgData=[],ekgColor="#22c55e",ekgRaf=null;

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
  el.classList.add("num-flash");
  setTimeout(function(){el.classList.remove("num-flash");},450);
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
  var orb=document.getElementById("cat-holo");
  var obrain=document.getElementById("orb-brain");
  var osub=document.getElementById("orb-sub");
  var ost=document.getElementById("orb-status");
  var errs=d.recentErrors?d.recentErrors.length:0;
  var lb=d.lastBrains&&d.lastBrains.length?d.lastBrains[0].brain.toLowerCase():"groq";
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
  var ostable=document.getElementById("orb-stable");
  if(ostable){ostable.textContent=errs>=5?"AI CORE STRESSED":"AI CORE STABLE";ostable.style.color=errs>=5?"var(--amber)":"var(--green)";}
}

function updateBrain(d){
  var grid=document.getElementById("kgrid");
  if(!d.groq||!d.groq.length)return;
  var lastKey=d.lastBrains&&d.lastBrains.length?d.lastBrains[0].key:null;
  var lastBrain=d.lastBrains&&d.lastBrains.length?d.lastBrains[0].brain.toLowerCase():"groq";
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
    var brain=(b.brain||"groq").toLowerCase();
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
  var mini=document.getElementById("mini-user-list");
  if(!d.messages||!d.messages.perUser||!d.messages.perUser.length){
    var empty="<div style='color:var(--muted);font-size:.68rem'>No users yet</div>";
    if(list)list.innerHTML=empty;
    if(mini)mini.innerHTML=empty;
    return;
  }
  var users=d.messages.perUser.slice(0,10);
  var maxc=users[0].count||1;
  var h="";
  users.forEach(function(u,i){
    var pct=Math.max(4,Math.round((u.count/maxc)*100));
    var isTop=i===0;
    var code="USER-"+(i+1);
    h+="<div class='uitem'>";
    h+="<div class='utop'><span class='"+(isTop?"odot":"xdot")+"'></span>";
    h+="<span style='color:"+(isTop?"var(--cyan)":"var(--text)")+"'>"+esc(code)+"</span>";
    h+="<span class='umsgs'>"+u.count+" msg</span></div>";
    var barStyle="width:"+pct+"%"+(isTop?";box-shadow:0 0 8px rgba(0,212,255,.5)":"");
    h+="<div class='ubar-wrap'><div class='ubar' style='"+barStyle+"'></div></div></div>";
  });
  if(list)list.innerHTML=h;
  if(mini)mini.innerHTML=h;
}

var TOOL_ICONS={get_weather:"cloud",get_current_time:"clock",search_web:"search",convert_currency:"dollar-sign",get_movie_info:"film",read_url:"link",save_to_vault:"lock",send_gif:"image",search_youtube:"play-circle",show_map:"map-pin"};
var TOOL_SHORT={get_weather:"WEATHER",get_current_time:"TIME",search_web:"SEARCH",convert_currency:"CURRENCY",get_movie_info:"MOVIES",read_url:"URL",save_to_vault:"VAULT",send_gif:"GIF",search_youtube:"YOUTUBE",show_map:"MAP"};
function updateTools(d){
  if(!d.tools)return;
  var wrap=document.getElementById("tools-wrap");
  var h="";
  d.tools.forEach(function(t){
    var alive=t.keyConfigured;
    var icon=TOOL_ICONS[t.name]||"tool";
    var lbl=TOOL_SHORT[t.name]||(t.name.replace(/_/g," ").toUpperCase().slice(0,8));
    h+="<div class='ticon-item"+(alive?"":" ticon-dead")+"' title='"+(alive?"ONLINE":"OFFLINE")+" &mdash; "+t.name+"'>";
    h+="<div class='ticon-ico'><i data-lucide='"+icon+"'></i></div>";
    h+="<div class='ticon-lbl'>"+lbl+"</div></div>";
  });
  wrap.innerHTML=h;
  var ok=d.tools.filter(function(t){return t.keyConfigured;}).length;
  var off=d.tools.length-ok;
  setN("s-tools",ok);
  setN("s-toff",off);
  var ts=document.getElementById("tools-status");
  if(ts){
    ts.innerHTML=off===0?"&#9658; ALL TOOLS OPERATIONAL":"&#9650; "+off+" TOOL"+(off>1?"S":"")+" OFFLINE";
    ts.style.color=off===0?"var(--green)":"var(--red)";
  }
  try{if(typeof lucide!=="undefined")lucide.createIcons();}catch(e){}
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

function updateBrains(d){
  var groq=d.groq||[];
  var ready=groq.filter(function(k){return k.status==="ready";}).length;
  var total=groq.length;
  var lastBrain=d.lastBrains&&d.lastBrains.length?d.lastBrains[0].brain.toLowerCase():"";
  var gdot=document.getElementById("b-groq-dot");
  var gstat=document.getElementById("b-groq-status");
  if(gdot&&gstat){
    if(ready===0){gstat.textContent="OFFLINE";gdot.className="bdot bdot-red";}
    else if(ready<total){gstat.textContent="DEGRADED";gdot.className="bdot bdot-amber";}
    else{gstat.textContent="ACTIVE";gdot.className="bdot bdot-green";}
  }
  var gkeys=document.getElementById("b-groq-keys");
  if(gkeys)gkeys.textContent=ready+"/"+total+" ready";
  var glast=document.getElementById("b-groq-last");
  if(glast){var gl=d.lastBrains&&d.lastBrains.find(function(b){return b.brain.toLowerCase()==="groq";});glast.textContent=gl?gl.timeAgo:"never";}
  var orActive=lastBrain==="openrouter";
  var ordot=document.getElementById("b-or-dot");
  var orstat=document.getElementById("b-or-status");
  if(ordot&&orstat){ordot.className="bdot "+(orActive?"bdot-green":"bdot-standby");orstat.textContent=orActive?"ACTIVE":"STANDBY";}
  var orkey=document.getElementById("b-or-key");
  if(orkey)orkey.textContent=(d.openrouter&&d.openrouter.configured)?"Configured":"Not configured";
  var orlast=document.getElementById("b-or-last");
  if(orlast){var ol=d.lastBrains&&d.lastBrains.find(function(b){return b.brain.toLowerCase()==="openrouter";});orlast.textContent=ol?ol.timeAgo:"never";}
  var cflast=document.getElementById("b-cf-last");
  if(cflast){var cl=d.lastBrains&&d.lastBrains.find(function(b){return b.brain.toLowerCase()==="cf ai";});cflast.textContent=cl?cl.timeAgo:"never";}
  var gemkeys=document.getElementById("b-gem-keys");
  if(gemkeys)gemkeys.textContent=(d.gemini?d.gemini.keysConfigured:0)+" configured";
  if(lastQ)updateBrainsQuota(lastQ);
}
function updateBrainsQuota(q){
  var el=document.getElementById("b-gem-calls");
  if(!el||!q||!q.gemini)return;
  el.textContent=q.gemini.totalCalls+" today ("+q.gemini.totalSuccessful+" ok, "+q.gemini.total429+" 429s)";
}

function updateHealth(d){
  var ready=d.groq?d.groq.filter(function(k){return k.status==="ready";}).length:0;
  var keyScore=ready/16;
  var errCount=0;
  if(d.recentErrors&&d.recentErrors.length){
    var cutoff=Date.now()-3600000;
    d.recentErrors.forEach(function(e){
      if(!e.timestamp||new Date(e.timestamp).getTime()>=cutoff)errCount++;
    });
  }
  var errBonus=errCount===0?1.0:errCount<=3?0.5:0.0;
  var pct=Math.round((keyScore*0.5+errBonus*0.3+1.0*0.2)*100);
  var cls,lbl;
  if(pct>=95){cls="h-green";lbl="EXCELLENT";}
  else if(pct>=80){cls="h-green";lbl="HEALTHY";}
  else if(pct>=60){cls="h-amber";lbl="DEGRADED";}
  else if(pct>=40){cls="h-amber";lbl="WARNING";}
  else{cls="h-red";lbl="CRITICAL";}
  var el=document.getElementById("health-pct");if(!el)return;
  el.className=cls;
  el.querySelector(".h-num").textContent=pct+"%";
  el.querySelector(".h-lbl").textContent=lbl;
  ekgColor=cls==="h-green"?"#22c55e":cls==="h-amber"?"#f59e0b":"#ef4444";
}

function updatePipeline(d){
  var lb=d.lastBrains&&d.lastBrains.length?d.lastBrains[0].brain.toLowerCase():"groq";
  var nodes=["pn-groq","pn-or","pn-cf","pn-gem"];
  nodes.forEach(function(id){var n=document.getElementById(id);if(n){n.classList.remove("pl-active","pl-fallback");}});
  var active=lb==="groq"?"pn-groq":lb==="openrouter"?"pn-or":(lb==="cf ai"||lb==="worker ai")?"pn-cf":lb==="gemini"?"pn-gem":null;
  if(active){var an=document.getElementById(active);if(an)an.classList.add(lb==="groq"?"pl-active":"pl-fallback");}
  var sub=document.getElementById("pn-groq-sub");
  if(sub&&d.groq){var rk=d.groq.filter(function(k){return k.status==="ready";}).length;sub.textContent=rk+"/"+d.groq.length+" ready";}
}
function updateModels(d){
  var m=d.models;if(!m)return;
  var lp=document.getElementById("m-lastprobe");
  if(lp){
    if(m.lastProbeAt){var diff=Date.now()-m.lastProbeAt;var h=Math.floor(diff/3600000);var mn=Math.floor((diff%3600000)/60000);lp.textContent="last probe: "+h+"h "+mn+"m ago";}
    else{lp.textContent="not probed yet — run !agent refresh models";}
  }
  var gl=document.getElementById("m-groq-text");
  if(gl){
    var h="";
    if(m.groqText&&m.groqText.length){
      m.groqText.forEach(function(id,i){h+="<div class='mmodel-item'><span class='mmodel-num'>"+(i+1)+".</span><span class='mmodel-id'>"+esc(id)+"</span><span class='mmodel-tag mmodel-tag-live'>LIVE</span></div>";});
    }else{h="<div style='color:var(--muted);font-size:.72rem;padding:6px'>No models discovered yet &mdash; run !agent refresh models in Telegram</div>";}
    gl.innerHTML=h;
  }
  var gv=document.getElementById("m-groq-vision");
  if(gv)gv.textContent=m.groqVision||"—";
  var geml=document.getElementById("m-gemini-text");
  if(geml){
    var gh="";
    if(m.geminiLab&&m.geminiLab.length){
      m.geminiLab.forEach(function(id,i){gh+="<div class='mmodel-item'><span class='mmodel-num'>"+(i+1)+".</span><span class='mmodel-id'>"+esc(id)+"</span><span class='mmodel-tag mmodel-tag-lab'>LAB</span></div>";});
    }else{gh="<div style='color:var(--muted);font-size:.72rem;padding:6px'>No models discovered yet</div>";}
    geml.innerHTML=gh;
  }
  var bgm=document.getElementById("b-groq-model");
  if(bgm&&m.groqText&&m.groqText.length){bgm.textContent=m.groqText.map(function(id){return(id.split("/").pop()||id).replace(/-instruct/,"");}).join(" · ");}
  var bgems=document.getElementById("b-gem-models");
  if(bgems&&m.geminiLab&&m.geminiLab.length){bgems.textContent=m.geminiLab.map(function(id){return id.replace("gemini-","");}).join(" · ");}
}
function updateMaintenance(d){
  var on=d.maintenance&&d.maintenance.on;
  var el=document.getElementById("maint-status-box");
  if(el){el.className="maint-status "+(on?"maint-on":"maint-off");el.innerHTML="<span class='bdot "+(on?"bdot-amber":"bdot-green")+"'></span>"+(on?"MAINTENANCE ON — Users locked out":"MAINTENANCE OFF — System live");}
  var cu=document.getElementById("maint-users");
  if(cu&&d.users)cu.textContent=(d.users.approved)+" approved users "+(on?"currently locked out":"currently active");
}
function updateLiveFeed(d){
  var lb=document.getElementById("lf-brains");
  if(lb&&d.lastBrains&&d.lastBrains.length){
    var h="";
    d.lastBrains.forEach(function(b){
      var brain=(b.brain||"groq").toLowerCase();var kl=b.key!=null?" &middot; key "+b.key:"";
      h+="<div class='ditem'><span class='dbrain "+brain+"'>"+brain.toUpperCase()+"</span><span style='color:var(--muted);font-size:.58rem'>"+kl+"</span><span class='dtime'>"+b.timeAgo+"</span></div>";
    });
    lb.innerHTML=h;
  }
  var le=document.getElementById("lf-errors");
  if(le){
    if(!d.recentErrors||!d.recentErrors.length){le.innerHTML="<div class='no-err'>&#9632; All systems nominal</div>";return;}
    var eh="";
    d.recentErrors.slice().reverse().forEach(function(e){var ts=e.timestamp?e.timestamp.replace("T"," ").slice(0,19):"";eh+="<div class='eline'><span class='ets'>["+ts+"] </span>"+esc(e.detail)+"</div>";});
    le.innerHTML=eh;le.scrollTop=le.scrollHeight;
  }
}
function copyCmd(cmd){
  try{navigator.clipboard.writeText(cmd);}catch(e){}
  var t=document.getElementById("maint-copy-toast");
  if(t){t.style.display="block";setTimeout(function(){t.style.display="none";},1800);}
}
function updateTests(d){
  var t=d.tests;if(!t)return;
  var pr=document.getElementById("t-passrate");
  if(pr)pr.textContent=t.passRate7d+"%";
  var pb=document.getElementById("t-passbar");
  if(pb){pb.style.width=t.passRate7d+"%";pb.className="tpass-bar "+(t.passRate7d>=80?"tpass-green":t.passRate7d>=60?"tpass-amber":"tpass-red");}
  var badge=document.getElementById("t-grade");
  if(badge){badge.textContent=t.passRate7d>=80?"HEALTHY":t.passRate7d>=60?"DEGRADED":"FAILING";badge.className="bpill "+(t.passRate7d>=80?"bprimary":t.passRate7d>=60?"bfallback":"blast");}
  var lr=document.getElementById("t-lastrun");
  if(lr&&t.lastRunAt){var diff=Date.now()-t.lastRunAt;var mins=Math.floor(diff/60000);lr.textContent="last run: "+(mins<60?mins+"m ago":Math.floor(mins/60)+"h "+Math.floor(mins%60)+"m ago");}
  var res=document.getElementById("t-results");
  if(!res||!t.recentResults||!t.recentResults.length)return;
  var h="";
  t.recentResults.forEach(function(r){
    var dt=r.created_at?r.created_at.slice(0,10):"";
    h+="<div class='tresult "+(r.passed?"tresult-pass":"tresult-fail")+"'>";
    h+="<span class='tname'>"+esc(r.test_name.replace(/_/g," "))+"</span>";
    h+="<span class='tlang'>"+esc(r.language)+"</span>";
    h+="<span class='tscore'>"+(r.score!=null?r.score:"—")+"</span>";
    h+="<span class='tpass-chip "+(r.passed?"tpass-y":"tpass-n")+"'>"+(r.passed?"PASS":"FAIL")+"</span>";
    h+="<span class='ttime'>"+esc(dt)+"</span></div>";
  });
  res.innerHTML=h;
}
function startEKG(){
  var canvas=document.getElementById("ekg-canvas");
  if(!canvas||!canvas.getContext)return;
  var ctx=canvas.getContext("2d");
  var w=canvas.width,h=canvas.height;
  ekgData=[];
  for(var i=0;i<w;i++)ekgData.push(h/2);
  var phase=0;
  function tick(){
    ekgData.shift();
    phase=(phase+1)%70;
    var y;
    if(phase===25){y=h*0.2;}
    else if(phase===26){y=h*0.82;}
    else if(phase===27){y=h*0.12;}
    else if(phase===28){y=h*0.5;}
    else if(phase===30){y=h*0.38;}
    else if(phase===32){y=h*0.5;}
    else{y=h*0.5+(Math.random()*0.5-0.25);}
    ekgData.push(y);
    ctx.clearRect(0,0,w,h);
    ctx.beginPath();
    ctx.strokeStyle=ekgColor;
    ctx.lineWidth=1.2;
    ctx.shadowColor=ekgColor;
    ctx.shadowBlur=4;
    for(var i=0;i<ekgData.length;i++){
      if(i===0)ctx.moveTo(i,ekgData[i]);
      else ctx.lineTo(i,ekgData[i]);
    }
    ctx.stroke();
    ekgRaf=requestAnimationFrame(tick);
  }
  if(ekgRaf)cancelAnimationFrame(ekgRaf);
  tick();
}
function updateMetrics(d,fetchMs){
  var mp=document.getElementById("met-panel");
  var ms=document.getElementById("met-stable");
  if(!mp)return;
  var latMs=fetchMs||0;
  var cpuPct=Math.min(99,Math.round(latMs/5));
  var memCount=d.memory?d.memory.count:0;
  var memPct=Math.min(99,Math.round(memCount/500*100));
  var errCount=d.recentErrors?d.recentErrors.length:0;
  var diskPct=Math.max(1,Math.min(99,100-Math.round(errCount/50*100)));
  var cpuCls=cpuPct<30?"met-ok":cpuPct<60?"met-blue":"met-warn";
  var memCls=memPct<60?"met-ok":memPct<80?"met-warn":"met-crit";
  var netCls=latMs<100?"met-blue":latMs<300?"met-warn":"met-crit";
  var diskCls=diskPct>70?"met-ok":diskPct>40?"met-warn":"met-crit";
  mp.innerHTML="<div class='met-grid'>"+
    "<div class='met-cell "+cpuCls+"'><div class='met-cell-lbl'>CPU</div><div class='met-cell-val'>"+cpuPct+"%</div></div>"+
    "<div class='met-cell "+memCls+"'><div class='met-cell-lbl'>MEMORY</div><div class='met-cell-val'>"+memPct+"%</div></div>"+
    "<div class='met-cell "+netCls+"'><div class='met-cell-lbl'>NETWORK</div><div class='met-cell-val'>"+latMs+"ms</div></div>"+
    "<div class='met-cell "+diskCls+"'><div class='met-cell-lbl'>DISK</div><div class='met-cell-val'>"+diskPct+"%</div></div>"+
  "</div>";
  if(ms){
    ms.innerHTML=errCount>0?("&#9650; "+errCount+" ERRORS DETECTED"):"&#9632; SYSTEM STABLE";
    ms.style.color=errCount>0?"var(--red)":"var(--green)";
  }
}
function updateAll(d,fetchMs){
  lastD=d;
  updateHealth(d);updateOrb(d);updateBrain(d);updateDrive(d);updateErrors(d);
  updateUsers(d);updateTools(d);updateVitals(d);updateBrains(d);updateModels(d);updateMaintenance(d);updateLiveFeed(d);updatePipeline(d);updateTests(d);
  updateMetrics(d,fetchMs||0);
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
  var t0=performance&&performance.now?performance.now():Date.now();
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
      var fetchMs=Math.round((performance&&performance.now?performance.now():Date.now())-t0);
      if(first){
        document.getElementById("gate").style.display="none";
        document.getElementById("app").style.display="block";
        document.getElementById("lab").style.display="flex";
        document.getElementById("leftnav").style.display="flex";
        var lbtn=document.getElementById("lab-btn");if(lbtn)lbtn.style.display="flex";
        fetchLabQuota();
        startEKG();
        try{if(localStorage.getItem("bizli_lab_collapsed")==="1")setLabState(true,false);}catch(e){}
        try{switchTab(localStorage.getItem("bizli_nav_tab")||"overview");}catch(e){switchTab("overview");}
      }
      updateAll(d,fetchMs);
    })
    .catch(function(){
      if(first)document.getElementById("pw-err").textContent="Connection error — retry";
      var st=document.getElementById("sync-time");
      if(st)st.textContent="DISCONNECTED";
    });
}

setInterval(function(){fetchStats(false);},3000);
setInterval(fetchLabQuota,30000);
setInterval(tickClock,1000);
tickClock();

// QUOTA
function updateLabQuota(d){
  var g=d&&d.gemini;if(!g)return;
  var total=g.totalCalls||0;
  var cap=12000;
  var pct=Math.min(100,Math.round((total/cap)*100));
  var fill=document.getElementById("lab-quota-fill");
  var text=document.getElementById("lab-quota-text");
  if(!fill||!text)return;
  fill.style.width=pct+"%";
  fill.className=pct<50?"qgreen":pct<80?"qamber":"qred";
  var warn=g.exhaustedKeyModels&&g.exhaustedKeyModels.length?" ⚠ "+g.exhaustedKeyModels.length+" exhausted":"";
  text.textContent="Quota: "+total+"/"+cap+" calls today"+warn;
}
function fetchLabQuota(){
  if(!PW)return;
  fetch("/lab/quota?key="+encodeURIComponent(PW))
    .then(function(r){return r.ok?r.json():null;})
    .then(function(d){if(d){lastQ=d;updateLabQuota(d);updateBrainsQuota(d);}})
    .catch(function(){});
}

// LAB SOUND ENGINE — CYBERPUNK
var labAudioCtx=null,labMasterGain=null,labVolGain=null,labSoundOn=false,labVolLevel=0;
var LAB_VOLS=[0,0.12,0.26,0.45];
var LAB_VLABELS=["&#9675; SND","&#9656; LOW","&#9656;&#9656; MED","&#9656;&#9656;&#9656; HIGH"];
function labGetCtx(){
  if(!labAudioCtx)labAudioCtx=new(window.AudioContext||window.webkitAudioContext)();
  if(labAudioCtx.state==="suspended")labAudioCtx.resume();
  return labAudioCtx;
}
function labMakeNoise(ctx){
  var sz=ctx.sampleRate*3,buf=ctx.createBuffer(1,sz,ctx.sampleRate),d=buf.getChannelData(0);
  for(var i=0;i<sz;i++)d[i]=Math.random()*2-1;
  var src=ctx.createBufferSource();src.buffer=buf;src.loop=true;return src;
}
function labMakeSatCurve(){
  var c=new Float32Array(256);
  for(var i=0;i<256;i++){var x=(i*2)/256-1;c[i]=x/(1+Math.abs(x*2.5));}
  return c;
}
function labStartAmbient(){
  var ctx=labGetCtx();
  // Master chain: volGain → masterGain (fade) → destination
  labMasterGain=ctx.createGain();labMasterGain.gain.value=0;labMasterGain.connect(ctx.destination);
  labVolGain=ctx.createGain();labVolGain.gain.value=LAB_VOLS[labVolLevel];labVolGain.connect(labMasterGain);
  // SUB BASS THROB 40Hz — foundation punch
  var sub=ctx.createOscillator();sub.type="sine";sub.frequency.value=40;
  var subG=ctx.createGain();subG.gain.value=1.1;sub.connect(subG);subG.connect(labVolGain);sub.start();
  // DETUNED INDUSTRIAL SAWTOOTH PAIR (120Hz + 124Hz — beating creates machine feel)
  var ws=ctx.createWaveShaper();ws.curve=labMakeSatCurve();
  var saw1=ctx.createOscillator();saw1.type="sawtooth";saw1.frequency.value=120;
  var saw2=ctx.createOscillator();saw2.type="sawtooth";saw2.frequency.value=124;
  var sawG=ctx.createGain();sawG.gain.value=0.22;
  saw1.connect(ws);saw2.connect(ws);ws.connect(sawG);sawG.connect(labVolGain);
  saw1.start();saw2.start();
  // HIGH SHIMMER 360Hz (thin metallic layer)
  var hi=ctx.createOscillator();hi.type="triangle";hi.frequency.value=360;
  var hiG=ctx.createGain();hiG.gain.value=0.08;hi.connect(hiG);hiG.connect(labVolGain);hi.start();
  // DIGITAL NOISE (bandpass filtered, slowly swept)
  var noise=labMakeNoise(ctx);
  var nf=ctx.createBiquadFilter();nf.type="bandpass";nf.frequency.value=1600;nf.Q.value=1.5;
  var nG=ctx.createGain();nG.gain.value=0.07;
  noise.connect(nf);nf.connect(nG);nG.connect(labVolGain);noise.start();
  // FILTER SWEEP LFO (0.06Hz — eerie slow movement)
  var fLFO=ctx.createOscillator();fLFO.frequency.value=0.06;
  var fLG=ctx.createGain();fLG.gain.value=900;
  fLFO.connect(fLG);fLG.connect(nf.frequency);fLFO.start();
  // PULSE LFO 0.5Hz — makes everything breathe/throb
  var pLFO=ctx.createOscillator();pLFO.type="sine";pLFO.frequency.value=0.5;
  var pLG=ctx.createGain();pLG.gain.value=0.06;
  pLFO.connect(pLG);pLG.connect(labVolGain.gain);pLFO.start();
  // Fade in
  labMasterGain.gain.setTargetAtTime(1,ctx.currentTime,0.4);
}
function labStopAmbient(){
  if(!labMasterGain)return;
  var g=labMasterGain;
  g.gain.setTargetAtTime(0,labAudioCtx.currentTime,0.4);
  setTimeout(function(){try{g.disconnect();}catch(e){}},2500);
  labMasterGain=null;labVolGain=null;
}
function labPlaySend(){
  if(!labSoundOn||labVolLevel===0)return;
  var ctx=labGetCtx(),vol=LAB_VOLS[labVolLevel];
  // Downward frequency sweep — data packet fired
  var o=ctx.createOscillator(),g=ctx.createGain();
  o.type="square";
  o.frequency.setValueAtTime(1600,ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(280,ctx.currentTime+0.09);
  g.gain.value=vol*1.4;o.connect(g);g.connect(ctx.destination);
  o.start();g.gain.setTargetAtTime(0,ctx.currentTime+0.03,0.025);o.stop(ctx.currentTime+0.12);
  // High confirmation click
  var o2=ctx.createOscillator(),g2=ctx.createGain();
  o2.type="sine";o2.frequency.value=2400;g2.gain.value=vol*0.9;
  o2.connect(g2);g2.connect(ctx.destination);
  o2.start(ctx.currentTime+0.07);
  g2.gain.setTargetAtTime(0,ctx.currentTime+0.08,0.012);o2.stop(ctx.currentTime+0.11);
}
function labPlayReply(){
  if(!labSoundOn||labVolLevel===0)return;
  var ctx=labGetCtx(),vol=LAB_VOLS[labVolLevel];
  // Ascending sweep — system activating
  var sw=ctx.createOscillator(),sg=ctx.createGain();
  sw.type="sawtooth";
  sw.frequency.setValueAtTime(100,ctx.currentTime);
  sw.frequency.exponentialRampToValueAtTime(1100,ctx.currentTime+0.14);
  sg.gain.value=vol*1.2;sw.connect(sg);sg.connect(ctx.destination);
  sw.start();sg.gain.setTargetAtTime(0,ctx.currentTime+0.08,0.035);sw.stop(ctx.currentTime+0.18);
  // Lock-in chord: root + fifth (A4 + E5)
  [440,659].forEach(function(f,i){
    var o=ctx.createOscillator(),g=ctx.createGain();
    o.type="sine";o.frequency.value=f;g.gain.value=0;
    o.connect(g);g.connect(ctx.destination);
    var t=ctx.currentTime+0.17;
    o.start(t);
    g.gain.setValueAtTime(vol*1.1,t);
    g.gain.setTargetAtTime(0,t+0.06,0.12);
    o.stop(t+0.7);
  });
}
function labCycleVolume(){
  labVolLevel=(labVolLevel+1)%4;
  labSoundOn=labVolLevel>0;
  var btn=document.getElementById("lab-snd-btn");
  if(btn){
    btn.innerHTML=LAB_VLABELS[labVolLevel];
    if(labSoundOn)btn.classList.add("snd-on");else btn.classList.remove("snd-on");
  }
  if(labSoundOn){
    if(!labMasterGain){labStartAmbient();}
    else if(labVolGain){labVolGain.gain.setTargetAtTime(LAB_VOLS[labVolLevel],labAudioCtx.currentTime,0.3);}
  }else{
    labStopAmbient();
  }
  try{localStorage.setItem("bizli_lab_vol",String(labVolLevel));}catch(e){}
}
// LAB AGENT
var labHistory=[],labBusy=false,LAB_MAX=30,labOldCount=0,labHistoryExpanded=false;
(function(){
  try{
    var s=localStorage.getItem("bizli_lab_chat");
    if(s){
      var ms=JSON.parse(s);
      if(Array.isArray(ms)&&ms.length){
        labHistory=ms;
        labOldCount=ms.length;
        var b=document.getElementById("lab-body");
        b.innerHTML="";
        var hdr=document.createElement("div");
        hdr.className="lb-history-hdr";
        hdr.id="lb-history-hdr";
        hdr.innerHTML="<span class='lb-history-line'></span><button class='lb-history-btn' onclick='toggleLabHistory()'>"+ms.length+" previous messages &nbsp;&#9662;</button><span class='lb-history-line'></span>";
        b.appendChild(hdr);
        var msgs=document.createElement("div");
        msgs.id="lb-history-msgs";
        b.appendChild(msgs);
        var sep=document.createElement("div");
        sep.className="lb-session-sep";
        sep.textContent="New Session";
        b.appendChild(sep);
        var sys=document.createElement("div");
        sys.className="lbsys";
        sys.textContent="Lab Agent online. Ready.";
        b.appendChild(sys);
        return;
      }
    }
  }catch(e){}
})();
function toggleLabHistory(){
  var msgs=document.getElementById("lb-history-msgs");
  var btn=document.querySelector(".lb-history-btn");
  if(!msgs||!btn)return;
  if(!labHistoryExpanded){
    labHistory.slice(0,labOldCount).forEach(function(m){
      var d=document.createElement("div");
      d.className="lbmsg lb-old "+(m.role==="user"?"lbu":"lba");
      d.textContent=m.content;
      msgs.appendChild(d);
    });
    btn.innerHTML=labOldCount+" previous messages &nbsp;&#9652;";
    labHistoryExpanded=true;
  }else{
    msgs.innerHTML="";
    btn.innerHTML=labOldCount+" previous messages &nbsp;&#9662;";
    labHistoryExpanded=false;
  }
}
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
function labQuickAction(msg){
  var ta=document.getElementById("lab-ta");
  if(ta){ta.value=msg;}
  labSend();
}
function labSend(){
  if(labBusy||!PW)return;
  var ta=document.getElementById("lab-ta");
  var msg=ta.value.trim();
  if(!msg)return;
  ta.value="";ta.style.height="auto";
  appendLabBubble("u",msg,true);
  labPlaySend();
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
    labPlayReply();
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
  app.className=app.className.replace(/\\btab-\\S+/g,"").trim();
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
try{if(typeof lucide!=="undefined")lucide.createIcons();}catch(e){}`;
