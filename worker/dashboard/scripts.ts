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
  orb.classList.remove("red","amber");
  if(errs>=5){
    orb.classList.add("red");
    ost.textContent="⚠ ERROR SPIKE";ost.style.color="var(--red)";
  }else if(lb&&lb!=="groq"){
    orb.classList.add("amber");
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
  var cerActive=lastBrain==="cerebras";
  var cerdot=document.getElementById("b-cer-dot");
  var cerstat=document.getElementById("b-cer-status");
  if(cerdot&&cerstat){cerdot.className="bdot "+(cerActive?"bdot-green":"bdot-standby");cerstat.textContent=cerActive?"ACTIVE":"STANDBY";}
  var cerkeys=document.getElementById("b-cer-keys");
  if(cerkeys)cerkeys.textContent=(d.cerebras?d.cerebras.keysConfigured:0)+" configured";
  var cermodels=document.getElementById("b-cer-models");
  if(cermodels&&d.cerebras&&d.cerebras.liveModels&&d.cerebras.liveModels.length)cermodels.textContent=d.cerebras.liveModels.join(" · ");
  var cerlast=document.getElementById("b-cer-last");
  if(cerlast){var cel=d.lastBrains&&d.lastBrains.find(function(b){return b.brain.toLowerCase()==="cerebras";});cerlast.textContent=cel?cel.timeAgo:"never";}
  var orActive=lastBrain==="openrouter";
  var ordot=document.getElementById("b-or-dot");
  var orstat=document.getElementById("b-or-status");
  if(ordot&&orstat){ordot.className="bdot "+(orActive?"bdot-green":"bdot-standby");orstat.textContent=orActive?"ACTIVE":"STANDBY";}
  var orkey=document.getElementById("b-or-key");
  if(orkey)orkey.textContent=(d.openrouter&&d.openrouter.configured)?"Configured":"Not configured";
  var ormodels=document.getElementById("b-or-models");
  if(ormodels&&d.openrouter&&d.openrouter.liveModels&&d.openrouter.liveModels.length){
    var orm=d.openrouter.liveModels;
    ormodels.textContent=orm.slice(0,2).map(function(id){return (id.split("/").pop()||id).replace(":free","");}).join(" · ")+(orm.length>2?" +"+(orm.length-2)+" more":"");
  }
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
  var nodes=["pn-groq","pn-cer","pn-or","pn-cf","pn-gem"];
  nodes.forEach(function(id){var n=document.getElementById(id);if(n){n.classList.remove("pl-active","pl-fallback");}});
  var active=lb==="groq"?"pn-groq":lb==="cerebras"?"pn-cer":lb==="openrouter"?"pn-or":(lb==="cf ai"||lb==="worker ai")?"pn-cf":lb==="gemini"?"pn-gem":null;
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
  var cerl=document.getElementById("m-cer-list");
  if(cerl){
    var ch="";
    var cms=(d.cerebras&&d.cerebras.liveModels)||[];
    if(cms.length){
      cms.forEach(function(id,i){ch+="<div class='mmodel-item'><span class='mmodel-num'>"+(i+1)+".</span><span class='mmodel-id'>"+esc(id)+"</span><span class='mmodel-tag mmodel-tag-live'>LIVE</span></div>";});
    }else{ch="<div style='color:var(--muted);font-size:.72rem;padding:6px'>No models discovered yet &mdash; run !agent refresh models</div>";}
    cerl.innerHTML=ch;
  }
  var orl=document.getElementById("m-or-list");
  if(orl){
    var oh="";
    var oms=(d.openrouter&&d.openrouter.liveModels)||[];
    if(oms.length){
      oms.forEach(function(id,i){oh+="<div class='mmodel-item'><span class='mmodel-num'>"+(i+1)+".</span><span class='mmodel-id'>"+esc(id)+"</span><span class='mmodel-tag mmodel-tag-live'>FREE</span></div>";});
    }else{oh="<div style='color:var(--muted);font-size:.72rem;padding:6px'>Pool not fetched yet &mdash; run !agent refresh models</div>";}
    orl.innerHTML=oh;
  }
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
function updateCodeStream(d){
  var el=document.getElementById("lc-stream");
  if(!el||!d)return;
  var L=[];
  var ready=0,total=d.groq?d.groq.length:0;
  if(d.groq){for(var i=0;i<d.groq.length;i++)if(d.groq[i].status==="ready")ready++;}
  L.push("<div class='lcs-cmt'>// bizli-worker "+esc(d.version||"")+" \\u00b7 live</div>");
  L.push("<div><span class='lcs-kw'>const</span> pool = groq.ready(<span class='lcs-key'>"+ready+"</span>/"+total+");</div>");
  if(d.lastBrains&&d.lastBrains.length){
    d.lastBrains.slice(0,10).forEach(function(b){
      var brain=(b.brain||"groq").toLowerCase();
      L.push("<div><span class='lcs-kw'>await</span> "+esc(brain)+".invoke(key=<span class='lcs-key'>"+esc(String(b.key!=null?b.key:"-"))+"</span>); <span class='lcs-cmt'>// "+esc(b.timeAgo||"")+"</span></div>");
    });
  }
  if(d.recentErrors&&d.recentErrors.length){
    d.recentErrors.slice().reverse().slice(0,8).forEach(function(e){
      var det=(e.detail||"").slice(0,90);
      L.push("<div class='lcs-err'>throw Error("+esc(JSON.stringify(det))+");</div>");
    });
  }
  L.push("<div><span class='lcs-kw'>await</span> next_tick();<span class='lcs-cur'>\\u258B</span></div>");
  el.innerHTML=L.join("");
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
        try{initMatrix();}catch(e){}
        try{autoAdjustLab();}catch(e){}
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
function setLabState(collapsed,animate,persist){
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
  if(persist!==false){try{localStorage.setItem("bizli_lab_collapsed",collapsed?"1":"0");}catch(e){}}
}
// Auto-collapse the desktop Lab sidebar when the window is too narrow to fit it,
// restore the user's saved preference when there's room. Does not persist auto changes.
function autoAdjustLab(){
  if(window.innerWidth<=800)return; // mobile uses the bottom-sheet, handled by CSS
  if(window.innerWidth<1300){setLabState(true,false,false);}
  else{
    var pref=false;try{pref=localStorage.getItem("bizli_lab_collapsed")==="1";}catch(e){}
    setLabState(pref,false,false);
  }
}
var _labRz;
window.addEventListener("resize",function(){clearTimeout(_labRz);_labRz=setTimeout(function(){try{autoAdjustLab();}catch(e){}},160);});
function labToggleDesktop(){setLabState(!document.getElementById("lab").classList.contains("collapsed"),true,true);}
function labToggle(){document.getElementById("lab").classList.toggle("open");}
// Phone: AGENT nav item opens the Lab sheet; close (x) in its header shuts it.
function openAgent(){
  var lab=document.getElementById("lab");if(lab)lab.classList.add("open");
  var nav=document.getElementById("leftnav");if(nav)nav.classList.remove("open");
}
function closeAgent(){var lab=document.getElementById("lab");if(lab)lab.classList.remove("open");}
// Summary stat strip collapse toggle (persists across the 3s refresh)
function toggleSummary(){
  var r=document.getElementById("summary-row");if(!r)return;
  var c=r.classList.toggle("collapsed");
  try{localStorage.setItem("bizli_summary_collapsed",c?"1":"0");}catch(e){}
}
try{if(localStorage.getItem("bizli_summary_collapsed")==="1"){var _sr=document.getElementById("summary-row");if(_sr)_sr.classList.add("collapsed");}}catch(e){}
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

// Holographic Bizli — click for bounce + chirp (blink/butterfly are CSS-driven)
function initCat(){
  var holoEl=document.getElementById("cat-holo");
  if(!holoEl)return;
  var img=document.getElementById("biz-cat-img");
  holoEl.addEventListener("click",function(){
    if(img)img.classList.add("bounce");
    setTimeout(function(){if(img)img.classList.remove("bounce");},380);
    if(!sfxOn())return;
    try{
      var ctx=new(window.AudioContext||window.webkitAudioContext)();
      var o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.type="sine";
      o.frequency.setValueAtTime(900,ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1400,ctx.currentTime+0.07);
      o.frequency.exponentialRampToValueAtTime(700,ctx.currentTime+0.22);
      g.gain.setValueAtTime(0,ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.11,ctx.currentTime+0.02);
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.28);
      o.start(ctx.currentTime);o.stop(ctx.currentTime+0.3);
    }catch(ex){}
  });
}
try{initCat();}catch(e){}

// ===== Settings + procedural ambient music engine =====
function sfxOn(){try{return localStorage.getItem("bizli_sfx")!=="0";}catch(e){return true;}}

var BizMusic=(function(){
  var ctx=null,master=null,delay=null,fb=null,wet=null;
  var nodes=[],timers=[],playing=false,curIdx=-1,vol=0.5;
  var VIBES=[
    {name:"Deep Space",  root:110,scale:[0,3,7,10,12,15],wave:"sine",    tempo:2600,cutoff:700, detune:6, noise:0,  pad:[0,7,12]},
    {name:"Neon Rain",   root:146,scale:[0,2,5,7,9,12],  wave:"triangle",tempo:1800,cutoff:1200,detune:8, noise:.10,pad:[0,5,7]},
    {name:"Cyber Dawn",  root:130,scale:[0,4,7,11,12,16],wave:"sine",    tempo:2000,cutoff:1400,detune:5, noise:0,  pad:[0,4,7]},
    {name:"Void",        root:82, scale:[0,5,7,12],      wave:"sine",    tempo:3400,cutoff:500, detune:4, noise:0,  pad:[0,7,12]},
    {name:"Data Stream", root:174,scale:[0,2,4,7,9,12],  wave:"triangle",tempo:1100,cutoff:1800,detune:7, noise:0,  pad:[0,4,7]},
    {name:"Aurora",      root:196,scale:[0,3,7,10,12,17],wave:"sine",    tempo:1500,cutoff:2200,detune:10,noise:0,  pad:[0,7,12]},
    {name:"Lo-Fi Pulse", root:98, scale:[0,3,7,10,14],   wave:"sawtooth",tempo:2200,cutoff:900, detune:6, noise:.05,pad:[0,3,7,10]},
    {name:"Quantum",     root:120,scale:[0,2,4,6,8,10],  wave:"sine",    tempo:2400,cutoff:1000,detune:9, noise:0,  pad:[0,4,8]},
    {name:"Midnight",    root:104,scale:[0,3,7,10,12],   wave:"sine",    tempo:3000,cutoff:600, detune:5, noise:0,  pad:[0,7,12]},
    {name:"Solaris",     root:165,scale:[0,4,7,9,12,16], wave:"triangle",tempo:1600,cutoff:1600,detune:7, noise:0,  pad:[0,4,7]},
    {name:"Glacier",     root:138,scale:[0,2,5,9,12],    wave:"sine",    tempo:2800,cutoff:800, detune:4, noise:.04,pad:[0,5,9]},
    {name:"Nebula",      root:92, scale:[0,3,5,8,10,15],  wave:"sawtooth",tempo:2000,cutoff:1100,detune:8, noise:0,  pad:[0,3,8]},
    {name:"Monsoon",     root:117,scale:[0,2,4,7,11,14],  wave:"triangle",tempo:1400,cutoff:1300,detune:6, noise:.08,pad:[0,4,7]},
    {name:"Obsidian",    root:78, scale:[0,5,8,12],       wave:"sawtooth",tempo:3200,cutoff:520, detune:5, noise:0,  pad:[0,8,12]}
  ];
  function ntof(root,semi){return root*Math.pow(2,semi/12);}
  function ensure(){
    if(ctx)return;
    ctx=new(window.AudioContext||window.webkitAudioContext)();
    master=ctx.createGain();master.gain.value=vol;master.connect(ctx.destination);
    delay=ctx.createDelay(2.0);delay.delayTime.value=0.42;
    fb=ctx.createGain();fb.gain.value=0.42;
    wet=ctx.createGain();wet.gain.value=0.35;
    delay.connect(fb);fb.connect(delay);delay.connect(wet);wet.connect(master);
  }
  function clearAll(){
    for(var i=0;i<timers.length;i++)clearTimeout(timers[i]);
    timers=[];
    for(var j=0;j<nodes.length;j++){try{if(nodes[j].stop)nodes[j].stop();}catch(e){}try{nodes[j].disconnect();}catch(e){}}
    nodes=[];
  }
  function startPad(v){
    for(var i=0;i<v.pad.length;i++){
      var o=ctx.createOscillator();o.type=v.wave;o.frequency.value=ntof(v.root,v.pad[i]);o.detune.value=(i-1)*v.detune;
      var g=ctx.createGain();g.gain.value=0;
      var f=ctx.createBiquadFilter();f.type="lowpass";f.frequency.value=v.cutoff;
      o.connect(f);f.connect(g);g.connect(master);g.connect(delay);o.start();
      g.gain.linearRampToValueAtTime(0.055,ctx.currentTime+4);
      var lfo=ctx.createOscillator();lfo.frequency.value=0.03+Math.random()*0.05;
      var lg=ctx.createGain();lg.gain.value=v.cutoff*0.4;
      lfo.connect(lg);lg.connect(f.frequency);lfo.start();
      nodes.push(o,lfo);
    }
  }
  function bell(v){
    if(!playing)return;
    var semi=v.scale[Math.floor(Math.random()*v.scale.length)]+(Math.random()<0.3?12:0);
    var o=ctx.createOscillator();o.type=v.wave;o.frequency.value=ntof(v.root,semi);
    var g=ctx.createGain();g.gain.value=0;
    o.connect(g);g.connect(delay);g.connect(master);
    var t=ctx.currentTime;
    g.gain.linearRampToValueAtTime(0.09,t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0008,t+1.8);
    o.start(t);o.stop(t+2);
    timers.push(setTimeout(function(){bell(v);},v.tempo*(0.6+Math.random()*0.9)));
  }
  function startNoise(v){
    if(!v.noise)return;
    var buf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*0.5;
    var src=ctx.createBufferSource();src.buffer=buf;src.loop=true;
    var f=ctx.createBiquadFilter();f.type="bandpass";f.frequency.value=1200;f.Q.value=0.7;
    var g=ctx.createGain();g.gain.value=v.noise;
    src.connect(f);f.connect(g);g.connect(master);src.start();nodes.push(src);
  }
  return{
    VIBES:VIBES,
    play:function(idx){ensure();if(ctx.state==="suspended")ctx.resume();clearAll();curIdx=idx;playing=true;var v=VIBES[idx];startPad(v);startNoise(v);timers.push(setTimeout(function(){bell(v);},600));},
    stop:function(){playing=false;clearAll();},
    setVol:function(x){vol=x;if(master)master.gain.linearRampToValueAtTime(x,(ctx?ctx.currentTime:0)+0.1);},
    isPlaying:function(){return playing;},
    current:function(){return curIdx;}
  };
})();

function playVibe(i){
  try{
    BizMusic.play(i);
    try{localStorage.setItem("bizli_mus_last",String(i));}catch(e){}
    var now=document.getElementById("mus-now");if(now)now.textContent="\\u266A Now playing \\u2014 "+BizMusic.VIBES[i].name;
    var chips=document.querySelectorAll(".mus-chip");
    for(var k=0;k<chips.length;k++)chips[k].classList.toggle("active",k===i);
  }catch(e){}
}
function BizStopMusic(){
  try{
    BizMusic.stop();
    var now=document.getElementById("mus-now");if(now)now.textContent="Nothing playing";
    var chips=document.querySelectorAll(".mus-chip");
    for(var k=0;k<chips.length;k++)chips[k].classList.remove("active");
  }catch(e){}
}
function setToast(){var t=document.getElementById("set-toast");if(!t)return;t.style.display="block";setTimeout(function(){t.style.display="none";},1200);}
function initSettings(){
  var grid=document.getElementById("music-grid");
  if(grid){
    var h="";
    for(var i=0;i<BizMusic.VIBES.length;i++)h+='<button class="mus-chip" onclick="playVibe('+i+')">'+BizMusic.VIBES[i].name+'</button>';
    grid.innerHTML=h;
  }
  var storedVol=0.5;try{var sv=localStorage.getItem("bizli_mus_vol");if(sv!==null)storedVol=parseFloat(sv);}catch(e){}
  BizMusic.setVol(storedVol);
  var vol=document.getElementById("mus-vol");
  if(vol){vol.value=String(Math.round(storedVol*100));
    vol.addEventListener("input",function(){var x=parseInt(vol.value,10)/100;BizMusic.setVol(x);try{localStorage.setItem("bizli_mus_vol",String(x));}catch(e){}});}
  var FONTS={mono:'"Courier New",monospace',console:'Consolas,"Lucida Console",Monaco,monospace',sans:'"Segoe UI","Helvetica Neue",Arial,sans-serif',tahoma:'Tahoma,Geneva,Verdana,sans-serif',trebuchet:'"Trebuchet MS",Helvetica,sans-serif',serif:'Georgia,"Times New Roman",serif',palatino:'"Palatino Linotype","Book Antiqua",Palatino,serif',system:'system-ui,-apple-system,"Segoe UI",sans-serif'};
  var storedScale=100;try{var ss=localStorage.getItem("bizli_ui_scale");if(ss!==null)storedScale=parseInt(ss,10);}catch(e){}
  document.documentElement.style.setProperty("--ui-scale",String(storedScale/100));
  var ts=document.getElementById("set-textsize"),tsv=document.getElementById("set-textsize-val");
  if(ts){ts.value=String(storedScale);if(tsv)tsv.textContent=storedScale+"%";
    ts.addEventListener("input",function(){var v=parseInt(ts.value,10);document.documentElement.style.setProperty("--ui-scale",String(v/100));if(tsv)tsv.textContent=v+"%";try{localStorage.setItem("bizli_ui_scale",String(v));}catch(e){}});}
  var storedFont="mono";try{var sf=localStorage.getItem("bizli_ui_font");if(sf&&FONTS[sf])storedFont=sf;}catch(e){}
  document.documentElement.style.setProperty("--font",FONTS[storedFont]);
  var fnt=document.getElementById("set-font");
  if(fnt){fnt.value=storedFont;fnt.addEventListener("change",function(){var v=fnt.value;if(!FONTS[v])return;document.documentElement.style.setProperty("--font",FONTS[v]);try{localStorage.setItem("bizli_ui_font",v);}catch(e){}setToast();});}
  var sfx=document.getElementById("set-sfx");
  if(sfx){sfx.checked=sfxOn();sfx.addEventListener("change",function(){try{localStorage.setItem("bizli_sfx",sfx.checked?"1":"0");}catch(e){}setToast();});}
  var rm=false;try{rm=localStorage.getItem("bizli_reduce_motion")==="1";}catch(e){}
  if(rm)document.body.classList.add("reduce-motion");
  var mo=document.getElementById("set-motion");
  if(mo){mo.checked=rm;mo.addEventListener("change",function(){document.body.classList.toggle("reduce-motion",mo.checked);try{localStorage.setItem("bizli_reduce_motion",mo.checked?"1":"0");}catch(e){}setToast();});}
  var auto=false;try{auto=localStorage.getItem("bizli_mus_auto")==="1";}catch(e){}
  var au=document.getElementById("mus-auto");
  if(au){au.checked=auto;au.addEventListener("change",function(){try{localStorage.setItem("bizli_mus_auto",au.checked?"1":"0");}catch(e){}setToast();});}
  try{if(typeof lucide!=="undefined")lucide.createIcons();}catch(e){}
}
var _autoStarted=false;
function _maybeAutoMusic(){
  if(_autoStarted)return;_autoStarted=true;
  try{
    if(localStorage.getItem("bizli_mus_auto")==="1"){
      var li=parseInt(localStorage.getItem("bizli_mus_last")||"-1",10);
      if(li>=0)playVibe(li);
    }
  }catch(e){}
}
document.addEventListener("pointerdown",_maybeAutoMusic,{once:true});
try{initSettings();}catch(e){}`;
