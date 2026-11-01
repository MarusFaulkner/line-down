/*! Quality Rush: Line Down! — © 2026 Marcus Faulkner. Plain JS, no build step. */
// Art lives in assets/.
const ASSETS = {
  bg: "assets/bg.webp",
  cnc_bad: "assets/cnc_bad.webp",
  cnc_ok: "assets/cnc_ok.webp",
  cnc_warn: "assets/cnc_warn.webp",
  conv_bad: "assets/conv_bad.webp",
  conv_ok: "assets/conv_ok.webp",
  conv_warn: "assets/conv_warn.webp",
  cut_flex: "assets/cut_flex.webp",
  cut_lockout: "assets/cut_lockout.webp",
  cut_point: "assets/cut_point.webp",
  cut_ratchet: "assets/cut_ratchet.webp",
  cut_think: "assets/cut_think.webp",
  cut_thumbs: "assets/cut_thumbs.webp",
  end_down: "assets/end_down.webp",
  end_win: "assets/end_win.webp",
  face_confident: "assets/face_confident.webp",
  face_determined: "assets/face_determined.webp",
  face_fist: "assets/face_fist.webp",
  face_frustrated: "assets/face_frustrated.webp",
  face_happy: "assets/face_happy.webp",
  face_laugh: "assets/face_laugh.webp",
  face_surprised: "assets/face_surprised.webp",
  forklift: "assets/forklift.webp",
  idle: "assets/idle.webp",
  jump: "assets/jump.webp",
  logo: "assets/logo.webp",
  oil: "assets/oil.webp",
  press_bad: "assets/press_bad.webp",
  press_ok: "assets/press_ok.webp",
  press_warn: "assets/press_warn.webp",
  repair: "assets/repair.webp",
  robot_bad: "assets/robot_bad.webp",
  robot_ok: "assets/robot_ok.webp",
  robot_warn: "assets/robot_warn.webp",
  run1: "assets/run1.webp",
  run2: "assets/run2.webp",
  slip: "assets/slip.webp",
  t_grease: "assets/t_grease.webp",
  t_lock: "assets/t_lock.webp",
  t_meter: "assets/t_meter.webp",
  t_part: "assets/t_part.webp",
  t_wrench: "assets/t_wrench.webp"
};

/* ===================== Shared data ===================== */
const SHIFT=150, MAX_STRIKES=3, LINE_DOWN_AT=3;
const RANKS=["Apprentice","Technician","Lead Technician","Maintenance Pro","Reliability Champion"];
// The four tools. Each fault on the line needs exactly one of them.
const TOOLS={
  wrench:{name:"Wrench", short:"Wrench", key:"1", img:"t_wrench", use:"Loose bolts, mounts and fittings", lesson:"Vibration and rattling usually mean something has worked loose. Tighten it to spec."},
  meter: {name:"Multimeter", short:"Meter", key:"2", img:"t_meter", use:"Electrical, sensor and power faults", lesson:"No power, no signal, a dead sensor: measure before you replace anything."},
  grease:{name:"Grease gun", short:"Grease", key:"3", img:"t_grease", use:"Squealing, grinding, running dry", lesson:"Squeals and grinding are friction. Lubrication is the cheapest repair on the floor."},
  part:  {name:"Spare part", short:"Part", key:"4", img:"t_part", use:"Broken, stripped or worn-out parts", lesson:"When teeth are broken or a part is worn out, no adjustment fixes it. Swap the part."}
};
const TOOL_ORDER=["wrench","meter","grease","part"];
const MACHINES=[
  {id:"cnc",  name:"CNC Mill",     x:132, light:[-.126,.125], ok:"cnc_ok",  bad:"cnc_bad",  faults:[["wrench","Vise bolts loose, part chatter"],["meter","Tool-change sensor not reading"],["grease","Way lube dry, axis grinding"],["part","Spindle drive gear stripped"]]},
  {id:"conv", name:"Conveyor",     x:368, light:[-.085,.125], ok:"conv_ok", bad:"conv_bad", faults:[["wrench","Guide rail bolts rattling loose"],["meter","Photo-eye not seeing boxes"],["grease","Roller bearing squealing"],["part","Drive sprocket teeth broken"]]},
  {id:"robot",name:"Robot Welder", x:600, light:[-.303,.116], ok:"robot_ok",bad:"robot_bad",faults:[["wrench","Torch mount loose, welds off-line"],["meter","Wire feed motor has no power"],["grease","Wrist joint grinding"],["part","Feed-roll gear worn out"]]},
  {id:"press",name:"Hydraulic Press",x:834, light:[-.025,.142], ok:"press_ok",bad:"press_bad",faults:[["wrench","Die clamp bolts backing out"],["meter","Light curtain fault, press won't cycle"],["grease","Ram guide running dry"],["part","Pump coupling worn through"]]}
];

/* ===================== Sound ===================== */
let AC=null, SOUND=true;
function tone(seq,vol=.07){
  if(!SOUND) return;
  try{ AC = AC || new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==="suspended") AC.resume(); let t=AC.currentTime;
    seq.forEach(([f,d,type])=>{ const o=AC.createOscillator(), g=AC.createGain(); o.type=type||"square"; o.frequency.value=f;
      g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.001,t+d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t+d); t+=d*.8; });
  }catch(e){}
}
const SFX={jump:[[420,.06,"triangle"],[640,.08,"triangle"]], click:[[700,.04]], tick:[[440,.08]], go:[[880,.18]],
  lock:[[1200,.03],[300,.08,"square"],[180,.1,"square"]], ratchet:[[1600,.02,"square"],[1100,.02,"square"]],
  wrong:[[260,.22,"sawtooth"]], strike:[[200,.18,"sawtooth"],[150,.3,"sawtooth"]], fixed:[[523,.08],[784,.08],[1046,.16]],
  pm:[[659,.08],[880,.08],[1175,.1],[1568,.18]], alarm:[[880,.12,"square"],[660,.12,"square"]], down:[[220,.2,"sawtooth"],[165,.35,"sawtooth"]],
  slip:[[500,.06,"triangle"],[200,.25,"triangle"]], honk:[[330,.22,"sawtooth"],[330,.22,"sawtooth"]], bump:[[120,.3,"sawtooth"]],
  win:[[523,.14],[659,.14],[784,.14],[1046,.32]], over:[[392,.2,"triangle"],[311,.25,"triangle"],[233,.4,"triangle"]]};

/* Music: an original driving loop synthesized live (E minor, Em–C–D–B7 feel), with a metallic
   anvil hit on the off-beat. Tempo climbs from 118 to 146 BPM across the shift. */
const Music={on:false,timer:0,next:0,step:0,bus:null,noise:null,
  ensure(){ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==="suspended") AC.resume();
    if(!this.bus){ this.bus=AC.createGain(); this.bus.gain.value=.28; this.bus.connect(AC.destination);
      const n=AC.sampleRate*.4, b=AC.createBuffer(1,n,AC.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; this.noise=b; } },
  start(){ if(!SOUND||this.on) return; try{ this.ensure(); this.on=true; this.next=AC.currentTime+.06;
    clearInterval(this.timer); this.timer=setInterval(()=>this.tick(),25); }catch(e){} },
  stop(){ this.on=false; clearInterval(this.timer); },
  reset(){ this.stop(); this.step=0; },
  tick(){ if(!this.on) return; const bpm=118+28*(G?prog():0), s16=60/bpm/4;
    while(this.next<AC.currentTime+.12){ this.note(this.step,this.next,s16); this.next+=s16; this.step++; } },
  env(node,t,peak,dur){ const g=AC.createGain(); g.gain.setValueAtTime(peak,t); g.gain.exponentialRampToValueAtTime(.0008,t+dur); node.connect(g).connect(this.bus); return g; },
  osc(type,f,t,dur,peak,lp){ const o=AC.createOscillator(); o.type=type; o.frequency.setValueAtTime(f,t);
    let n=o; if(lp){ const fl=AC.createBiquadFilter(); fl.type="lowpass"; fl.frequency.value=lp; o.connect(fl); n=fl; }
    this.env(n,t,peak,dur); o.start(t); o.stop(t+dur+.02); return o; },
  hit(t,type,freq,peak,dur){ const s=AC.createBufferSource(); s.buffer=this.noise; const f=AC.createBiquadFilter(); f.type=type; f.frequency.value=freq;
    s.connect(f); this.env(f,t,peak,dur); s.start(t); s.stop(t+dur+.02); },
  note(i,t,s16){
    const k=i%16, bar=Math.floor(i/16)%4, section=Math.floor(i/64)%2;
    if(k===0||k===6||k===8||(k===14&&bar%2)){ const o=this.osc("sine",140,t,.16,.9); o.frequency.exponentialRampToValueAtTime(42,t+.12); }    // kick
    if(k===4||k===12){ this.hit(t,"bandpass",1800,.5,.12); }                                                                                 // snare
    if(k%2===1) this.hit(t,"highpass",8000,k%4===3?.2:.1,.03);                                                                               // hats
    if(k===10){ this.osc("square",1318,t,.05,.05); this.osc("square",1975,t,.08,.035); }                                                      // anvil
    const roots=[41.2,32.7,36.71,30.87];                                                                                                     // E C D B
    if(k%2===0||k===15){ const f=roots[bar]*(k%8===6?2:1); this.osc("sawtooth",f*2,t,s16*1.6,.3,560); }                                     // bass
    const chords=[[329.6,392,493.9],[261.6,329.6,392],[293.7,370,440],[246.9,311.1,370]], pat=[0,2,1,2,0,2,1,0];
    if(section===1 || prog()>.55){ const f=chords[bar][pat[k%8]]; this.osc("square",f,t,s16*.8,.06,2400); }                                 // arpeggio
    if(k===0&&section===0) this.osc("triangle",chords[bar][2]*2,t,s16*6,.06);                                                               // lead
  }};

/* ===================== Storage ===================== */
function loadBest(){ try{ return +localStorage.getItem("ld-best")||0; }catch(e){ return 0; } }
function saveBest(v){ try{ localStorage.setItem("ld-best",String(v)); }catch(e){} }

/* ===================== Images ===================== */
const IMG={};
function loadImg(src){ return new Promise(r=>{ const i=new Image(); i.onload=()=>r(i); i.onerror=()=>r(i); i.src=src; }); }
async function loadAll(){
  const keys=["bg","idle","run1","run2","jump","slip","repair","forklift","oil","t_lock",...MACHINES.flatMap(m=>[m.ok,m.bad,m.id+"_warn"]),...TOOL_ORDER.map(k=>TOOLS[k].img)];
  await Promise.all(keys.map(async k=>{ IMG[k]=await loadImg(ASSETS[k]); }));
}

/* ===================== UI helpers ===================== */
const $=id=>document.getElementById(id);
const face=n=>`<img alt="Mike" src="${ASSETS["face_"+n]}">`;
function show(id){ ["title","play","end"].forEach(s=>$(s).hidden=s!==id); scrollTo(0,0); }

/* ===================== Title screen ===================== */
function renderTitle(){
  const best=loadBest();
  $("title").innerHTML=`<div class="wrap">
    <img class="logo" src="${ASSETS.logo}" alt="Quality Rush: Line Down!">
    <section class="panel callout"><div class="face">${face("confident")}</div>
      <div class="bubble"><small>Mike · Maintenance</small>Four machines, one of me, two and a half minutes. Catch the warnings early, lock out before you touch anything, and keep this line running.</div></section>
    <button class="cta" id="startBtn"><span>START SHIFT<small>2:30 SHIFT · 4 MACHINES · 3 SAFETY STRIKES</small></span></button>
    ${best?`<div class="best">Your best <b>${best}</b></div>`:""}
    <div class="banner"><span>Every repair</span></div>
    <section class="panel steps">
      <div class="step"><i>1</i><b>RUN</b><span>Tap the machine with the warning light</span></div>
      <div class="step"><i>2</i><b>LOCK OUT</b><span>Lockout/tagout before any tool</span></div>
      <div class="step"><i>3</i><b>RIGHT TOOL</b><span>Read the symptom, pick the tool</span></div>
      <div class="step"><i>4</i><b>FIX IT</b><span>Tap Repair to fill the meter</span></div>
    </section>
    <section class="panel lotobox"><img src="${ASSETS.t_lock}" alt=""><div><b>Lockout/tagout comes first. Every time.</b>
      <p>Pick up a tool before the machine is locked out and you take a safety strike. Three strikes and the shift is stopped.</p></div></section>
    <div class="banner"><span>Read the symptom</span></div>
    <section class="panel tools">${TOOL_ORDER.map(k=>`<div class="tool"><img src="${ASSETS[TOOLS[k].img]}" alt=""><div><b>${TOOLS[k].name}</b><span>${TOOLS[k].use}</span></div></div>`).join("")}</section>
    <div class="banner"><span>Run the floor</span></div>
    <section class="panel rules">
      <div><b style="color:var(--warn-hi)">YELLOW</b><span>Warning. The machine is still running, so fix it now for a preventive-maintenance bonus.</span></div>
      <div><b class="neg">RED</b><span>Broken down. Downtime is ticking. ${LINE_DOWN_AT} machines down at once and the whole line goes down.</span></div>
      <div><b style="color:#8fc6ff">JUMP</b><span>Swipe up or tap Jump to hop oil spills. Hit one and you slip.</span></div>
      <div><b style="color:var(--orange)">HONK</b><span>Forklift coming. Stand still and let it pass. Walk into it and you get knocked down.</span></div>
    </section>
    <div class="banner"><span>Scoring</span></div>
    <section class="panel rules">
      <div><b class="pos">+150</b><span>Fix a machine on its yellow warning (preventive maintenance).</span></div>
      <div><b class="pos">+80</b><span>Fix a machine after it breaks down.</span></div>
      <div><b class="neg">−30</b><span>Wrong tool. It costs you time, too.</span></div>
      <div><b class="neg">−100</b><span>Safety strike: a tool used before lockout.</span></div>
      <div><b class="pos">+5×</b><span>Your final uptime %, as a bonus when you finish the shift.</span></div>
    </section>
    <button class="cta" id="startBtn2"><span>START SHIFT<small>KEEP IT RUNNING</small></span></button>
    <p class="foot">Part of the Quality Rush series with <a href="https://marusfaulkner.github.io/quality-rush/" target="_blank" rel="noopener">Defect Runner</a>.<br>© 2026 Marcus Faulkner · Quality Rush · Mister Quality™<br>A game, not safety or maintenance training. Follow your site's lockout/tagout procedure.</p>
  </div>`;
  const go=()=>{ tone(SFX.click); startGame(); };
  $("startBtn").onclick=go; $("startBtn2").onclick=go;
}

/* ===================== Game ===================== */
const W=960, H=540, FEET=506, MBASE=452, MH=150, MIKE_H=150, LANE=[46,914], SPEED=500;
const cv=$("cv"), ctx=cv.getContext("2d");
let SCALE=1, DPR=1, G=null, raf=0, last=0;

function resize(){
  const box=$("stagebox"), bw=box.clientWidth, bh=box.clientHeight; if(!bw) return;
  const portrait=matchMedia("(orientation:portrait) and (max-width:700px)").matches;
  SCALE=portrait?bw/W:Math.min(bw/W,bh/H); DPR=Math.min(window.devicePixelRatio||1,2.5);
  const rp=$("rp"), home=portrait?box:$("stage"); if(rp.parentNode!==home) home.appendChild(rp);
  cv.style.width=Math.floor(W*SCALE)+"px"; cv.style.height=Math.floor(H*SCALE)+"px";
  cv.width=Math.round(W*SCALE*DPR); cv.height=Math.round(H*SCALE*DPR);
  draw();
}
addEventListener("resize",()=>{ if(!$("play").hidden) resize(); });

function newMachine(m){ return {...m, state:"run", fault:null, warnLeft:0, warnMax:1, down:0, locked:false, phase:"lock", prog:0, need:8, lockOutT:0, flash:0, fixedT:-1, wasPM:false}; }
function newGame(){
  return { t:0, score:0, strikes:0, mach:MACHINES.map(newMachine), nextFault:1.6, downtime:0, unplanned:0,
    mx:480, tx:480, dir:1, at:-1, runPhase:0, jumpT:-1, slipT:-1, inv:0, moving:false,
    oils:[], nextOil:18, fork:null, nextFork:34,
    pm:0, fixes:0, wrong:0, slips:0, bumps:0, sudden:0, fx:[], byTool:Object.fromEntries(TOOL_ORDER.map(k=>[k,{right:0,wrong:0}])),
    state:"count", count:3.4, paused:false, over:false, sayUntil:0, lockUntil:0, bannerShown:0 };
}
const prog=()=>Math.min(G.t/SHIFT,1);
const lerp=(a,b,t)=>a+(b-a)*t;
const uptime=()=>G.t>0?Math.max(0,1-G.downtime/(MACHINES.length*G.t)):1;
const downCount=()=>G.mach.filter(m=>m.state==="down").length;

async function startGame(){
  await READY;
  show("play"); G=newGame(); resize(); renderHUD(); renderPanel(); say("confident","Line's running. Watch for yellow lights.",0);
  cutin("point","r");
  cancelAnimationFrame(raf); last=performance.now(); raf=requestAnimationFrame(loop);
  tone(SFX.tick);
}
function say(f,text,ms=1800){ $("mFace").innerHTML=face(f); $("mSay").textContent=text; if(G) G.sayUntil=G.t+ms/1000; }
let cutT=0;
function cutin(name,side){ if(!ASSETS["cut_"+name]) return; const old=document.querySelector(".cutin"); if(old) old.remove(); clearTimeout(cutT);
  const d=document.createElement("div"); d.className="cutin "+(side||"r"); d.innerHTML=`<img alt="" src="${ASSETS["cut_"+name]}">`; $("stage").appendChild(d);
  cutT=setTimeout(()=>d.remove(),1200); }
function announce(a,b,info){ const d=document.createElement("div"); d.className="banner-new"+(info?" info":""); d.innerHTML=`${a}<small>${b}</small>`; $("stage").appendChild(d); setTimeout(()=>d.remove(),2700); }

/* --- input --- */
const workX=i=>G.mach[i].x-58;
function goTo(x){ if(!G||G.state!=="run"||G.paused||G.slipT>=0) return; G.tx=Math.max(LANE[0],Math.min(LANE[1],x)); G.at=-1; G.target=undefined; renderPanel(); }
function goMachine(i){ if(!G||G.state!=="run"||G.paused) return; if(G.slipT>=0){ G.queued=i; return; } G.tx=workX(i); G.target=i; G.at=-1; renderPanel(); }
function doJump(){ if(!G||G.state!=="run"||G.paused||G.slipT>=0) return; if(G.jumpT<0){ G.jumpT=0; tone(SFX.jump); } }
function toLogical(e){ const r=cv.getBoundingClientRect(); return [(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H]; }
function machineAt(x,y){ let best=-1,bd=1e9; G.mach.forEach((m,i)=>{ const dx=Math.abs(m.x-x); if(dx<118 && y>MBASE-MH-100 && y<FEET+30 && dx<bd){ bd=dx; best=i; } }); return best; }
let ptr=null;
cv.addEventListener("pointerdown",e=>{ e.preventDefault(); if(!G) return;
  if(G.paused){ setPause(false); return; }
  ptr={id:e.pointerId,x:e.clientX,y:e.clientY,done:false,lx:toLogical(e)}; });
cv.addEventListener("pointermove",e=>{ if(!ptr||ptr.done||e.pointerId!==ptr.id) return;
  const dy=e.clientY-ptr.y, dx=e.clientX-ptr.x;
  if(dy<-24 && Math.abs(dy)>Math.abs(dx)){ ptr.done=true; doJump(); } });
cv.addEventListener("pointerup",e=>{ if(!ptr||ptr.done||e.pointerId!==ptr.id){ ptr=null; return; } const [x,y]=ptr.lx; ptr=null;
  if(!G||G.state!=="run") return; const i=machineAt(x,y); if(i>=0) goMachine(i); else goTo(x); });
addEventListener("pointercancel",()=>ptr=null);
const jb=$("bJump");
jb.addEventListener("pointerdown",e=>{ e.preventDefault(); jb.classList.add("down"); doJump(); });
["pointerup","pointerleave","pointercancel"].forEach(t=>jb.addEventListener(t,()=>jb.classList.remove("down")));
addEventListener("keydown",e=>{ if($("play").hidden||!G) return;
  const k=e.key;
  if(["p","P","Escape"].includes(k)){ setPause(!G.paused); return; }
  if(G.paused||G.state!=="run") return;
  const m=G.at>=0?G.mach[G.at]:null;
  if(k===" "||k==="Enter"){ e.preventDefault(); if(m&&m.fault&&m.phase==="fix") repairTap(); else doJump(); }
  else if(k==="ArrowUp"||k==="w"||k==="W"){ e.preventDefault(); doJump(); }
  else if(k==="ArrowLeft"||k==="a"||k==="A"){ e.preventDefault(); G.held=-1; }
  else if(k==="ArrowRight"||k==="d"||k==="D"){ e.preventDefault(); G.held=1; }
  else if((k==="l"||k==="L")&&m) lockout();
  else if(["1","2","3","4"].includes(k)&&m) useTool(TOOL_ORDER[+k-1]);
});
addEventListener("keyup",e=>{ if(!G) return; if(["ArrowLeft","a","A","ArrowRight","d","D"].includes(e.key)){ G.held=0; G.tx=G.mx; } });
$("pauseBtn").onclick=()=>setPause(!G.paused);
const SND_ON=`<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
      SND_OFF=`<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
function renderSnd(){ $("sndBtn").innerHTML=SOUND?SND_ON:SND_OFF; $("sndBtn").setAttribute("aria-label",SOUND?"Mute sound":"Turn sound on"); }
$("sndBtn").onclick=()=>{ SOUND=!SOUND; renderSnd(); if(!SOUND) Music.stop(); else if(G&&G.state==="run"&&!G.paused) Music.start(); }; renderSnd();
document.addEventListener("visibilitychange",()=>{ if(document.hidden && G && G.state==="run") setPause(true); });
function setPause(v){ if(!G||G.over) return; G.paused=v; if(v) Music.stop(); else if(G.state==="run") Music.start();
  $("ov").className="overlay"+(v?" pause":""); $("ov").innerHTML=v?`<div><b>PAUSED</b><span>Tap to resume</span></div>`:"";
  if(v) $("ov").onclick=()=>setPause(false); else { $("ov").onclick=null; last=performance.now(); } }

/* --- repair panel (DOM) --- */
function renderPanel(){
  const rp=$("rp");
  const m=G&&G.at>=0?G.mach[G.at]:null;
  if(!G||G.state!=="run"||!m||!m.fault){ rp.hidden=true; rp.dataset.key=""; return; }
  const key=[G.at,m.state,m.phase,m.locked].join("|");
  if(rp.dataset.key===key){ updateMeter(); return; }
  rp.dataset.key=key; rp.hidden=false;
  rp.className="rp"+(m.phase==="fix"?" fix":m.state==="down"?" down":"");
  const chip=m.phase==="fix"?"Repairing":m.state==="down"?"Down":m.locked?"Locked out":"Warning";
  const head=`<div class="rp-h"><span class="chip">${chip}</span><b>${m.name}</b><span class="txt">${m.fault.text}</span></div>`;
  if(m.phase==="fix"){
    rp.innerHTML=head+`<div class="fixrow"><button class="fixbtn" id="fixBtn">REPAIR!<small>TAP FAST</small></button><div class="meter"><i id="mtr"></i><span id="mtrT"></span></div></div>`;
    const b=$("fixBtn"); b.addEventListener("pointerdown",e=>{ e.preventDefault(); b.classList.add("down"); repairTap(); });
    ["pointerup","pointerleave","pointercancel"].forEach(t=>b.addEventListener(t,()=>b.classList.remove("down")));
    updateMeter(); return;
  }
  rp.innerHTML=head+`<div class="rp-row">
    <button class="tb loto${m.locked?" done":""}" id="tbL" aria-label="Lockout tagout"><kbd>L</kbd><img src="${ASSETS.t_lock}" alt=""><small>${m.locked?"Locked":"Lockout"}</small></button>
    ${TOOL_ORDER.map(k=>`<button class="tb" data-tool="${k}" aria-label="${TOOLS[k].name}"><kbd>${TOOLS[k].key}</kbd><img src="${ASSETS[TOOLS[k].img]}" alt=""><small><span class="long">${TOOLS[k].name}</span><span class="short">${TOOLS[k].short}</span></small></button>`).join("")}
  </div>`;
  $("tbL").addEventListener("pointerdown",e=>{ e.preventDefault(); lockout(); });
  rp.querySelectorAll("[data-tool]").forEach(b=>b.addEventListener("pointerdown",e=>{ e.preventDefault(); useTool(b.dataset.tool,b); }));
}
function updateMeter(){ const m=G&&G.at>=0?G.mach[G.at]:null; if(!m||m.phase!=="fix"||!$("mtr")) return;
  $("mtr").style.width=Math.round(100*m.prog/m.need)+"%"; $("mtrT").textContent=`${m.prog} / ${m.need}`; }

/* --- actions --- */
function lockout(){
  const m=G.mach[G.at]; if(!m||!m.fault||m.locked||G.t<G.lockUntil) return;
  m.locked=true; m.phase="tool"; if(m.state==="warn") m.state="pm";   // a planned stop: it can't fail while you work on it
  tone(SFX.lock); cutin("lockout","r"); say("confident","Locked and tagged. Now, what's it telling us?",1600);
  fx(m.x,MBASE-MH-82,"LOCKED OUT","Zero energy","#ff9a9a"); renderPanel(); renderHUD();
}
function useTool(k,btn){
  const m=G.mach[G.at]; if(!m||!m.fault||m.phase==="fix"||G.t<G.lockUntil) return;
  if(!m.locked){                                   // safety strike: a tool before lockout
    G.strikes++; G.score-=100; tone(SFX.strike);
    fx(m.x,MBASE-MH-82,"SAFETY STRIKE","Lock it out first","#ff6060"); say("frustrated","Whoa! Never work on a live machine. Lock it out first.",2400);
    if(btn){ btn.classList.remove("bad"); void btn.offsetWidth; btn.classList.add("bad"); }
    announce(`SAFETY STRIKE ${G.strikes}/${MAX_STRIKES}`,"Lockout/tagout before any tool");
    renderHUD(); if(G.strikes>=MAX_STRIKES) endGame("safety"); return;
  }
  if(k!==m.fault.tool){
    G.wrong++; G.byTool[m.fault.tool].wrong++; G.score-=30; G.lockUntil=G.t+.8; tone(SFX.wrong);
    if(btn){ btn.classList.remove("bad"); void btn.offsetWidth; btn.classList.add("bad"); }
    fx(m.x,MBASE-MH-82,"−30","Wrong tool","#ff6060"); say("frustrated",`${TOOLS[k].name}? Not for "${m.fault.text.toLowerCase()}." Read the symptom.`,2200);
    renderHUD(); return;
  }
  G.byTool[k].right++; m.phase="fix"; m.prog=0; m.need=m.state==="pm"?5:8; tone(SFX.click);
  say("determined",`${TOOLS[k].name}. Let's go to work.`,1200); renderPanel();
}
function repairTap(){
  const m=G.mach[G.at]; if(!m||m.phase!=="fix") return;
  m.prog++; tone(SFX.ratchet,.05); m.flash=.12;
  if(m.prog>=m.need){
    const pm=m.state==="pm", pts=pm?150:80; G.score+=pts; G.fixes++; if(pm) G.pm++;
    fx(m.x,MBASE-MH-82,`+${pts}`,pm?"Preventive maintenance":"Back online","#56f08a");
    tone(pm?SFX.pm:SFX.fixed);
    if(pm){ cutin("thumbs","r"); say("happy","Caught it before it failed. That's preventive maintenance.",2000); }
    else { cutin("flex","r"); say("happy","Back online. Lock removed, line's running.",1800); }
    Object.assign(m,{state:"run",fault:null,locked:false,phase:"lock",prog:0,down:0,fixedT:0});
    renderHUD();
  }
  renderPanel();
}
function fx(x,y,big,small,color){ G.fx.push({x,y,big,small,color,t:0}); }

/* --- faults & hazards --- */
function spawnFault(){
  const free=G.mach.map((m,i)=>i).filter(i=>G.mach[i].state==="run"&&!G.mach[i].fault&&G.mach[i].fixedT<0);
  if(!free.length) return;
  // don't always break the machine Mike is standing next to
  const pick=free.length>1?free.filter(i=>i!==G.at):free; const i=pick[Math.floor(Math.random()*pick.length)], m=G.mach[i];
  const [tool,text]=m.faults[Math.floor(Math.random()*m.faults.length)];
  m.fault={tool,text}; m.phase="lock"; m.locked=false; m.prog=0;
  const sudden=G.t>60 && Math.random()<lerp(.06,.2,prog());
  if(sudden){ m.state="down"; m.down=0; G.sudden++; tone(SFX.down); fx(m.x,MBASE-MH-82,"BREAKDOWN!","No warning","#ff6060"); say("surprised",`${m.name} just went down with no warning!`,1800); }
  else { m.state="warn"; m.warnMax=m.warnLeft=lerp(15,9,prog()); tone(SFX.alarm,.05); }
  if(G.at===i) renderPanel(); renderHUD();
}
function spawnOil(){
  let x, tries=0; do{ x=LANE[0]+60+Math.random()*(LANE[1]-LANE[0]-120); tries++; } while(tries<20 && (Math.abs(x-G.mx)<130 || G.mach.some((m,i)=>Math.abs(workX(i)-x)<44)));
  G.oils.push({x,t:0,life:14});
}
function spawnFork(){ const fromRight=Math.random()<.5; G.fork={x:fromRight?W+170:-170, v:fromRight?-300:300, warn:1.5, honked:false}; tone(SFX.honk,.06);
  say("surprised","Forklift! Stand still and let it pass.",1800); }

/* --- loop --- */
function loop(now){
  raf=requestAnimationFrame(loop);
  let dt=(now-last)/1000; last=now; if(dt>.1) dt=.016;
  if(!G||G.over) return;
  if(G.paused){ draw(); return; }
  if(G.state==="count"){
    const before=Math.ceil(G.count); G.count-=dt; const after=Math.ceil(G.count);
    if(after!==before && after>0) tone(SFX.tick);
    if(G.count<=0){ G.state="run"; tone(SFX.go); $("ov").innerHTML=""; Music.reset(); Music.start(); }
    else { const lab=G.count>.6?String(Math.ceil(G.count-.4)):"GO!"; if(lab!==G.countShown){ G.countShown=lab; $("ov").innerHTML=`<div class="big">${lab}</div>`; } }
    draw(); return;
  }
  step(dt); draw();
}
function step(dt){
  G.t+=dt;
  // --- Mike movement
  if(G.held){ G.tx=Math.max(LANE[0],Math.min(LANE[1],G.mx+G.held*80)); G.at=-1; G.target=undefined; }
  if(G.slipT>=0){ G.slipT+=dt/1.3; if(G.slipT>=1){ G.slipT=-1; if(G.queued!==undefined){ const q=G.queued; G.queued=undefined; goMachine(q); } } }
  const prevAt=G.at;
  if(G.slipT<0){
    const d=G.tx-G.mx, stepLen=SPEED*dt;
    G.moving=Math.abs(d)>1;
    if(G.moving){ G.dir=Math.sign(d); G.mx+=Math.sign(d)*Math.min(Math.abs(d),stepLen); G.runPhase+=dt*2.2; }
    if(!G.moving && G.target!==undefined && G.at<0){ G.at=G.target; G.target=undefined; G.dir=1; }
    // stopping next to a machine (keyboard or a floor tap) also puts Mike to work on it
    if(!G.moving && G.at<0 && G.target===undefined){ const n=G.mach.findIndex((m,i)=>Math.abs(workX(i)-G.mx)<46); if(n>=0){ G.at=n; G.dir=1; } }
  } else G.moving=false;
  if(G.at!==prevAt) renderPanel();
  if(G.jumpT>=0){ G.jumpT+=dt/.62; if(G.jumpT>=1) G.jumpT=-1; }
  G.inv=Math.max(0,G.inv-dt);
  // --- machines
  let downNow=0;
  G.mach.forEach((m,i)=>{
    if(m.fixedT>=0){ m.fixedT+=dt; if(m.fixedT>3.5) m.fixedT=-1; }
    m.flash=Math.max(0,m.flash-dt);
    if(m.state==="warn"){ m.warnLeft-=dt;
      if(m.warnLeft<=0){ m.state="down"; m.down=0; tone(SFX.down); 
        say("frustrated",`${m.name} is down. Downtime's running.`,1800); if(G.at===i) renderPanel(); renderHUD(); } }
    if(m.state==="down"){ m.down+=dt; G.downtime+=dt; G.unplanned+=dt; downNow++; }
    if(m.state==="pm") G.downtime+=dt;           // planned stop while you work: shorter, but still downtime
  });
  if(downNow>=LINE_DOWN_AT){ endGame("down"); return; }
  if(downNow===LINE_DOWN_AT-1 && !G.warnedTwo){ G.warnedTwo=true; announce("2 MACHINES DOWN","One more and the line stops"); }
  if(downNow<LINE_DOWN_AT-1) G.warnedTwo=false;
  // --- fault schedule
  G.nextFault-=dt;
  if(G.nextFault<=0 && G.t<SHIFT-4){ spawnFault(); G.nextFault=lerp(9.5,5.2,prog())+Math.random()*2.5; }
  // --- oil
  G.nextOil-=dt; if(G.nextOil<=0 && G.t<SHIFT-4){ spawnOil(); G.nextOil=lerp(16,10,prog())+Math.random()*4; }
  G.oils.forEach(o=>o.t+=dt);
  const air=G.jumpT>=0 && G.jumpT>.12 && G.jumpT<.9;
  for(const o of G.oils){ if(o.t<.4||o.hit) continue;
    if(Math.abs(o.x-G.mx)<34 && !air && G.slipT<0 && G.inv<=0 && (G.moving||G.jumpT>=0)){ o.hit=true; G.slipT=0; G.slips++; G.score-=20; G.inv=1.8; G.jumpT=-1; G.tx=G.mx; G.at=-1; G.target=undefined;
      tone(SFX.slip); fx(G.mx,FEET-170,"−20","Slipped","#ff6060"); say("frustrated","Oil on the floor! Jump the spills.",1600); renderPanel(); renderHUD(); } }
  G.oils=G.oils.filter(o=>!o.hit&&o.t<o.life);
  if(G.oils.length===0 && G.t>12 && !G.oilHint){ G.oilHint=true; }
  // --- forklift
  G.nextFork-=dt; if(!G.fork && G.nextFork<=0 && G.t<SHIFT-6){ spawnFork(); G.nextFork=lerp(24,16,prog())+Math.random()*5; }
  if(G.fork){ const f=G.fork;
    if(f.warn>0){ f.warn-=dt; if(f.warn<=.7&&!f.honked){ f.honked=true; tone(SFX.honk,.06); } }
    else { f.x+=f.v*dt;
      if(Math.abs(f.x-G.mx)<78 && G.moving && G.slipT<0 && G.inv<=0){ G.slipT=0; G.bumps++; G.score-=40; G.inv=2; G.jumpT=-1; G.tx=G.mx; G.at=-1; G.target=undefined;
        tone(SFX.bump); fx(G.mx,FEET-170,"−40","Forklift!","#ff6060"); say("frustrated","Forklift traffic has the right of way. Stop and let it pass.",2200); renderPanel(); renderHUD(); }
      if(f.x<-220||f.x>W+220) G.fork=null; } }
  // --- announcements
  if(G.bannerShown<1 && G.t>=60){ G.bannerShown=1; announce("NO-WARNING BREAKDOWNS","Not every failure gives a yellow light",true); }
  if(G.bannerShown<2 && G.t>=100){ G.bannerShown=2; announce("LAST 50 SECONDS","Faults are coming faster",true); }
  G.fx.forEach(f=>f.t+=dt); G.fx=G.fx.filter(f=>f.t<1.2);
  if(G.t>G.sayUntil && G.t>2){ G.sayUntil=G.t+999;
    const w=G.mach.find(m=>m.state==="warn"); say(w?"determined":"confident", w?`${w.name} is on yellow. Get there before it fails.`:G.t>100?"Home stretch. Keep it running.":"Line's running. Watch for yellow lights.",0); }
  if(Math.floor(G.t*4)!==Math.floor((G.t-dt)*4)) renderHUD();
  if(G.t>=SHIFT) endGame("complete");
}

/* --- HUD --- */
function renderHUD(){
  if(!G) return;
  $("hScore").textContent=G.score;
  const u=uptime(), e=$("hUp"); e.textContent=Math.round(u*100)+"%"; e.className="v "+(u>=.9?"good":u>=.75?"mid":"bad");
  const left=Math.max(0,Math.ceil(SHIFT-G.t)); $("hTime").textContent=`${Math.floor(left/60)}:${String(left%60).padStart(2,"0")}`;
  const dn=downCount(); $("hDown").innerHTML=Array.from({length:LINE_DOWN_AT},(_,k)=>`<i class="${k<dn?"dn":"ok"}"></i>`).join("");
  $("hSafe").innerHTML=Array.from({length:MAX_STRIKES},(_,k)=>`<i class="${k<G.strikes?"on":""}">✕</i>`).join("");
}

/* --- drawing --- */
function img(k,x,y,h,flip){ const i=IMG[k]; if(!i||!i.width) return 0; const w=i.width*h/i.height;
  if(flip){ ctx.save(); ctx.translate(x,0); ctx.scale(-1,1); ctx.drawImage(i,-w/2,y-h,w,h); ctx.restore(); } else ctx.drawImage(i,x-w/2,y-h,w,h); return w; }
function rrect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function draw(){
  if(!cv.width) return;
  ctx.setTransform(SCALE*DPR,0,0,SCALE*DPR,0,0); ctx.imageSmoothingQuality="high";
  const g=G||newGame();
  if(IMG.bg&&IMG.bg.width) ctx.drawImage(IMG.bg,0,0,W,H); else { ctx.fillStyle="#123"; ctx.fillRect(0,0,W,H); }
  // dim the plant behind the playfield so the four machines read first
  const dim=ctx.createLinearGradient(0,0,0,H); dim.addColorStop(0,"rgba(4,10,22,.30)"); dim.addColorStop(.62,"rgba(4,10,22,.42)"); dim.addColorStop(1,"rgba(4,10,22,.08)");
  ctx.fillStyle=dim; ctx.fillRect(0,0,W,H);
  // machines
  g.mach.forEach((m,i)=>drawMachine(m,i,g));
  // oil spills
  g.oils.forEach(o=>{ const a=Math.min(1,o.t/.4,(o.life-o.t)/.6); ctx.globalAlpha=Math.max(0,a); img("oil",o.x,FEET+14,34); ctx.globalAlpha=1;
    if(o.t<1.2){ ctx.fillStyle=`rgba(255,204,31,${.6*(1-o.t/1.2)})`; ctx.font="700 13px 'Barlow Condensed',sans-serif"; ctx.textAlign="center"; ctx.fillText("OIL SPILL",o.x,FEET-24); } });
  // target marker
  if(G&&G.state==="run"&&Math.abs(g.tx-g.mx)>4){ ctx.strokeStyle="rgba(255,204,31,.8)"; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(g.tx,FEET+4,22,6,0,0,Math.PI*2); ctx.stroke(); }
  drawMike(g);
  g.mach.forEach(drawPlate);
  drawFork(g);
  // floating text
  g.fx.forEach(f=>{ const a=Math.min(1,1.7-f.t*1.5); ctx.globalAlpha=Math.max(0,a); const y=f.y-f.t*40;
    ctx.textAlign="center"; ctx.lineWidth=5; ctx.strokeStyle="rgba(0,0,0,.8)";
    ctx.font="24px 'Lilita One',Impact,sans-serif"; ctx.strokeText(f.big,f.x,y); ctx.fillStyle=f.color; ctx.fillText(f.big,f.x,y);
    if(f.small){ ctx.font="700 14px 'Barlow Condensed',sans-serif"; ctx.lineWidth=4; ctx.strokeText(f.small.toUpperCase(),f.x,y+17); ctx.fillStyle="#fff"; ctx.fillText(f.small.toUpperCase(),f.x,y+17); }
    ctx.globalAlpha=1; });
  // red vignette when two machines are down
  if(G && downCount()>=LINE_DOWN_AT-1 && G.state==="run"){ const p=.25+.15*Math.sin(G.t*8); const v=ctx.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.9);
    v.addColorStop(0,"rgba(212,42,42,0)"); v.addColorStop(1,`rgba(212,42,42,${p})`); ctx.fillStyle=v; ctx.fillRect(0,0,W,H); }
}
function drawMachine(m,i,g){
  const broken=m.state==="down";
  const base=MBASE, h=MH;
  // floor glow by state
  const col=m.state==="down"?"212,42,42":m.state==="warn"?"255,176,0":m.state==="pm"?"255,120,120":m.fixedT>=0?"86,240,138":null;
  if(col){ const pulse=m.state==="warn"?.45+.3*Math.sin(g.t*10):.5; const gr=ctx.createRadialGradient(m.x,base,10,m.x,base,120); gr.addColorStop(0,`rgba(${col},${pulse})`); gr.addColorStop(1,`rgba(${col},0)`);
    ctx.fillStyle=gr; ctx.beginPath(); ctx.ellipse(m.x,base,120,26,0,0,Math.PI*2); ctx.fill(); }
  ctx.fillStyle="rgba(0,0,0,.4)"; ctx.beginPath(); ctx.ellipse(m.x,base+2,86,10,0,0,Math.PI*2); ctx.fill();
  let dx=0; if(broken) dx=Math.sin(g.t*40)*1.2; if(m.flash>0) dx=Math.sin(m.flash*90)*2.5;
  const warnLit=(m.state==="warn"&&Math.sin(g.t*10)>-.3)||m.state==="pm";
  img(broken?m.bad:warnLit?m.id+"_warn":m.ok,m.x+dx,base,h);
  // warning overlay: amber beacon over the stack light
  // (warning light handled by the amber sprite above)
  // lock tag hanging on a locked machine
  if(m.locked){ img("t_lock",m.x+58,base-26,46); }
  // status tag
  if(m.fault){
    const t=m.state==="warn"?"WARNING":m.state==="down"?"DOWN":"LOCKED OUT", c=m.state==="warn"?"#ffb000":m.state==="down"?"#d42a2a":"#c43b6b";
    const ty=base-h-44, tw=128; ctx.save();
    const bob=m.state==="warn"?Math.sin(g.t*6)*3:0;
    rrect(m.x-tw/2,ty+bob,tw,34,10); ctx.fillStyle="rgba(6,15,28,.92)"; ctx.fill(); ctx.lineWidth=3; ctx.strokeStyle=c; ctx.stroke();
    ctx.fillStyle=c; ctx.font="18px 'Lilita One',Impact,sans-serif"; ctx.textAlign="center"; ctx.fillText(t,m.x,ty+bob+23);
    // timer bar: time left before failure (warning) or downtime so far (down)
    if(m.state==="warn"){ const f=Math.max(0,m.warnLeft/m.warnMax); ctx.fillStyle="#3a2a00"; ctx.fillRect(m.x-tw/2+8,ty+bob+28,tw-16,4); ctx.fillStyle="#ffd54a"; ctx.fillRect(m.x-tw/2+8,ty+bob+28,(tw-16)*f,4); }
    if(m.state==="down"){ ctx.fillStyle="#ffb0b0"; ctx.font="700 13px 'Barlow Condensed',sans-serif"; ctx.fillText(`${m.down.toFixed(1)}s down`,m.x,ty+bob-6); }
    ctx.restore();
    // arrow pointer
    if(m.state!=="pm"){ ctx.fillStyle=c; ctx.beginPath(); const ay=ty+bob+36; ctx.moveTo(m.x-9,ay); ctx.lineTo(m.x+9,ay); ctx.lineTo(m.x,ay+10); ctx.fill(); }
  } else if(m.fixedT>=0 && m.fixedT<2.2){ ctx.globalAlpha=Math.max(0,1-m.fixedT/2.2); ctx.fillStyle="#56f08a"; ctx.font="18px 'Lilita One',Impact,sans-serif"; ctx.textAlign="center"; ctx.fillText("RUNNING",m.x,base-h-20); ctx.globalAlpha=1; }
}
function drawPlate(m){
  ctx.font="700 13px 'Barlow Condensed',sans-serif"; ctx.textAlign="center"; const nw=ctx.measureText(m.name.toUpperCase()).width+14;
  rrect(m.x-nw/2,MBASE+6,nw,18,5); ctx.fillStyle="rgba(6,15,28,.85)"; ctx.fill(); ctx.fillStyle="#dbe7f5"; ctx.fillText(m.name.toUpperCase(),m.x,MBASE+19);
}
function drawMike(g){
  let k, h=MIKE_H, y=FEET, x=g.mx, flip=g.dir<0;
  if(g.slipT>=0){ k="slip"; h=128; }
  else if(g.jumpT>=0){ k="jump"; h=140; y-=4*96*g.jumpT*(1-g.jumpT); }
  else if(g.at>=0 && g.mach[g.at].fault && g.mach[g.at].locked){ k="repair"; h=126; flip=false; x=g.mach[g.at].x-30; y=FEET-4; }
  else if(g.moving){ k=(Math.floor(g.runPhase*4)%2)?"run2":"run1"; y-=Math.abs(Math.sin(g.runPhase*Math.PI*4))*3; }
  else { k=IMG.idle&&IMG.idle.width?"idle":"run1"; if(k==="idle"){ h=186*(1+.012*Math.sin(g.t*2.6)); } }   // idle: slow breathing
  const lift=FEET-y; ctx.fillStyle=`rgba(0,0,0,${.4-lift/400})`; ctx.beginPath(); ctx.ellipse(g.mx,FEET+2,Math.max(18,40-lift/5),7,0,0,Math.PI*2); ctx.fill();
  if(g.inv>0 && g.slipT<0 && Math.floor(g.inv*12)%2===0) ctx.globalAlpha=.45;
  img(k,x,y,h,flip); ctx.globalAlpha=1;
}
function drawFork(g){
  const f=g.fork; if(!f) return;
  if(f.warn>0){ // flashing warning arrow at the side it comes from
    const left=f.v>0, a=.5+.5*Math.sin(g.t*16), x=left?40:W-40;
    ctx.globalAlpha=a; ctx.fillStyle="#ff8a1f"; ctx.beginPath();
    if(left){ ctx.moveTo(x+26,FEET-60); ctx.lineTo(x-14,FEET-90); ctx.lineTo(x-14,FEET-30); } else { ctx.moveTo(x-26,FEET-60); ctx.lineTo(x+14,FEET-90); ctx.lineTo(x+14,FEET-30); }
    ctx.fill(); ctx.globalAlpha=1;
    ctx.fillStyle="#ff8a1f"; ctx.font="20px 'Lilita One',Impact,sans-serif"; ctx.textAlign=left?"left":"right"; ctx.strokeStyle="rgba(0,0,0,.8)"; ctx.lineWidth=4;
    ctx.strokeText("FORKLIFT!",left?16:W-16,FEET-104); ctx.fillText("FORKLIFT!",left?16:W-16,FEET-104); return; }
  ctx.fillStyle="rgba(0,0,0,.4)"; ctx.beginPath(); ctx.ellipse(f.x,FEET+20,78,9,0,0,Math.PI*2); ctx.fill();
  img("forklift",f.x,FEET+24,128,f.v>0);    // sprite faces left; flip when driving right
}

/* --- end of shift --- */
function rankFor(r){
  let k=0; const u=r.uptime;
  if(u>=.70) k=1;
  if(u>=.80 && r.complete) k=2;
  if(u>=.88 && r.complete && r.strikes<=1) k=3;
  if(u>=.93 && r.complete && r.strikes===0 && r.pm>=r.fixes*.5 && r.slips+r.bumps<=4) k=4;
  if(!r.complete) k=0;
  return k;
}
function endGame(reason){
  if(G.over) return; G.over=true; G.state="over"; Music.stop(); renderPanel();
  const complete=reason==="complete", u=uptime();
  if(complete) G.score+=Math.round(u*100)*5;
  const r={reason,complete,score:G.score,uptime:u,downtime:G.downtime,unplanned:G.unplanned,pm:G.pm,fixes:G.fixes,wrong:G.wrong,strikes:G.strikes,slips:G.slips,bumps:G.bumps,sudden:G.sudden,byTool:G.byTool,t:Math.min(G.t,SHIFT)};
  const prevBest=loadBest(); r.newBest=r.score>prevBest; if(r.newBest) saveBest(r.score);
  tone(complete?SFX.win:SFX.over);
  setTimeout(()=>{ cancelAnimationFrame(raf); document.querySelectorAll(".cutin,.banner-new").forEach(e=>e.remove()); renderEnd(r); },complete?500:1100);
}
function renderEnd(r){
  const k=rankFor(r), pct=Math.round(r.uptime*100);
  const title=r.complete?"SHIFT COMPLETE":r.reason==="safety"?"SHIFT STOPPED":"LINE DOWN!";
  const sub=r.complete?`+${pct*5} uptime bonus`:r.reason==="safety"?`${MAX_STRIKES} safety strikes · stopped at ${fmt(r.t)}`:`${LINE_DOWN_AT} machines down · stopped at ${fmt(r.t)}`;
  const line=r.reason==="safety"?"We don't skip lockout. Not for speed, not for anything. Energy gets isolated before hands go in, every time.":
    !r.complete?"Too many machines down at once. Get to the yellow lights early so they never turn red.":
    k===4?"Clean shift. Safe, fast, and most of it caught before it broke. That's reliability.":
    r.pm<r.fixes/2?"Line made it through, but we fixed more breakdowns than warnings. Catch them on yellow.":"Good shift. Now get that uptime higher.";
  const tools=TOOL_ORDER.filter(t=>r.byTool[t].right+r.byTool[t].wrong>0);
  $("end").innerHTML=`<div class="wrap">
    <div class="endhero" style="--rc:${r.complete?"var(--gold)":"var(--stop-hi)"};--rg:${r.complete?"rgba(255,204,31,.4)":"rgba(255,60,60,.4)"}">
      <img src="${r.complete?ASSETS.end_win:ASSETS.end_down}" alt="${r.complete?"Mike celebrating a finished shift":"Mike at a stopped line"}">
      <div class="stamp"><h1>${title}</h1><div class="big">${pct}%</div><small>Uptime (availability)</small><small style="margin-top:6px;color:var(--gold)">${sub}</small></div>
    </div>
    <section class="panel callout"><div class="face">${face(!r.complete?"frustrated":k>=3?"laugh":"happy")}</div><div class="bubble"><small>Mike</small>${line}</div></section>
    <section class="panel rankp"><div class="k">Shift rank</div><div class="rankname">${RANKS[k]}</div>
      <div class="ladder">${RANKS.map((n,i)=>`<span class="${i===k?"on":""}">${n}</span>`).join("")}</div></section>
    <div class="kpis">
      <div class="kpi"><b class="pos">${r.score}</b><span>${r.newBest?"New best score!":loadBest()>0?"Score · best "+loadBest():"Score"}</span></div>
      <div class="kpi"><b style="color:${pct>=90?"var(--go-hi)":pct>=75?"var(--warn-hi)":"var(--stop-hi)"}">${pct}%</b><span>Uptime</span></div>
      <div class="kpi"><b>${r.pm}</b><span>Caught on warning</span></div>
      <div class="kpi"><b>${r.fixes-r.pm}</b><span>Breakdowns fixed</span></div>
      <div class="kpi"><b>${Math.round(r.unplanned)}s</b><span>Unplanned downtime</span></div>
      <div class="kpi"><b style="color:${r.strikes?"var(--stop-hi)":"var(--go-hi)"}">${r.strikes}</b><span>Safety strikes</span></div>
      <div class="kpi"><b>${r.wrong}</b><span>Wrong tools</span></div>
      <div class="kpi"><b>${r.slips+r.bumps}</b><span>Slips &amp; forklift hits</span></div>
    </div>
    <div class="banner"><span>Tool report</span></div>
    <section class="panel dtable">${tools.length?tools.map(t=>{const b=r.byTool[t];return `<div class="drow"><img alt="" src="${ASSETS[TOOLS[t].img]}"><div><b>${TOOLS[t].name}</b><p>${TOOLS[t].lesson}</p></div>
      <div class="n"><span style="color:var(--go-hi)">${b.right}</span> / <span style="color:${b.wrong?"var(--stop-hi)":"var(--muted)"}">${b.wrong}</span></div></div>`}).join("")+`<p class="foot" style="text-align:right;margin:2px 0 0">right tool / wrong tool</p>`:`<p class="note">No repairs reached the tool step this shift.</p>`}
      <p class="note"><b style="color:var(--fg)">About uptime:</b> it's the share of machine time the line was running. That's <i>availability</i>, the first of the three factors in OEE (availability × performance × quality). Planned stops for preventive maintenance count too, but they're far shorter than breakdowns.</p></section>
    <button class="cta" id="againBtn"><span>RUN ANOTHER SHIFT<small>${Math.max(r.score,loadBest())>0?"BEAT "+Math.max(r.score,loadBest()):"TRY AGAIN"}</small></span></button>
    <button class="cta alt" id="homeBtn"><span>BACK TO TITLE</span></button>
    <p class="foot">© 2026 Marcus Faulkner · Quality Rush · Mister Quality™</p>
  </div>`;
  show("end");
  $("againBtn").onclick=()=>{ tone(SFX.click); startGame(); };
  $("homeBtn").onclick=()=>{ tone(SFX.click); renderTitle(); show("title"); };
}
const fmt=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,"0")}`;

/* ===================== Boot ===================== */
const READY=loadAll();
(function boot(){ renderTitle(); show("title"); })();
