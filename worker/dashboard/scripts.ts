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
function updateAll(d){
  lastD=d;
  updateHealth(d);updateOrb(d);updateBrain(d);updateDrive(d);updateErrors(d);
  updateUsers(d);updateTools(d);updateVitals(d);updateBrains(d);updateModels(d);updateMaintenance(d);updateLiveFeed(d);updatePipeline(d);
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
        fetchLabQuota();
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
