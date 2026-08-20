"use strict";
/* Cessna 172 SIM - N46519
   Checklist UI and the main loop. */

/* ==========================================================================
   8. FLOWS UI
   ========================================================================== */
const UI = { phase:0, mode:'study', idx:0, done:[], missed:[], t0:null, elapsed:0,
             arrivedSatisfied:false };

const phaseSel = document.getElementById('phase');
FLOWS.forEach((p,i)=> phaseSel.add(new Option(`${i+1}. ${p.name}`, i)));

function currentPhase(){ return FLOWS[UI.phase]; }
function itemAt(i){
  const raw = currentPhase().items[i];
  return {title:raw[0], action:raw[1], test:raw[2], hl:raw[3]};
}

/* Record whether the item we just landed on was ALREADY in the right state.
   If it was, we make the pilot acknowledge it rather than ticking it for them —
   a flow means touching every item, including the ones already correct. */
function noteArrival(){
  const ph=currentPhase();
  const it = UI.idx<ph.items.length ? itemAt(UI.idx) : null;
  UI.arrivedSatisfied = !!(it && it.test && it.test(S));
}

function resetFlow(){
  UI.idx=0; UI.done=[]; UI.missed=[]; UI.t0=null; UI.elapsed=0;
  noteArrival();
  renderItems();
}

function renderItems(){
  const list = document.getElementById('items');
  const ph = currentPhase();
  list.innerHTML = ph.items.map((raw,i)=>{
    const it = {title:raw[0], action:raw[1], test:raw[2]};
    const done = UI.done.includes(i);
    const cur  = i===UI.idx && !done;
    const miss = UI.missed.includes(i);
    // Recall mode hides items you haven't reached yet.
    const blur = UI.mode==='recall' && !done && i>=UI.idx;
    // Already in the right state when you got here — call it and confirm.
    const preset = cur && it.test && UI.arrivedSatisfied && UI.mode!=='study';
    const chip = !it.test ? ''
      : preset ? '<span class="auto ok">SET</span>'
               : '<span class="auto">PANEL</span>';
    return `<li class="${done?'done':''} ${cur?'cur':''} ${miss?'miss':''} ${blur?'hidden':''}" data-i="${i}">
      <span class="box"></span>
      <span class="txt"><b>${it.title}</b><span class="act">${it.action}</span></span>
      ${chip}
    </li>`;
  }).join('');
  const pct = ph.items.length ? UI.done.length/ph.items.length*100 : 0;
  document.getElementById('meter').style.width = pct+'%';
  document.getElementById('scoreChip').textContent = `${UI.done.length}/${ph.items.length}`;
  updateHighlight();
  const cur = list.querySelector('li.cur');
  if(cur) cur.scrollIntoView({block:'nearest'});
}

/* Pulse the control that satisfies the current item (Study mode only). */
function updateHighlight(){
  document.querySelectorAll('.hl').forEach(e=>e.classList.remove('show'));
  if(UI.mode!=='study') return;
  const it = itemAt(UI.idx);
  if(it && it.hl){
    const e=document.getElementById('hl_'+it.hl);
    if(e) e.classList.add('show');
  }
}

function advance(auto=false){
  const ph=currentPhase();
  if(UI.idx>=ph.items.length) return;
  if(!UI.done.includes(UI.idx)) UI.done.push(UI.idx);
  if(!auto && UI.mode!=='study'){
    const it=itemAt(UI.idx);
    // In practice/recall, calling an item complete without having set the
    // control is a miss — that is the point of the drill.
    if(it.test && !it.test(S) && !UI.missed.includes(UI.idx)) UI.missed.push(UI.idx);
  }
  UI.idx++;
  noteArrival();
  if(UI.t0===null) UI.t0=performance.now();
  renderItems();
}

/* Auto-tick: if the current item is bound to a control and the panel now
   matches, it completes itself. This is what makes the drill physical. */
function flowsAuto(){
  const ph=currentPhase();
  if(UI.idx>=ph.items.length) return;
  const it=itemAt(UI.idx);
  if(!it.test || !it.test(S)) return;
  // Study mode ticks freely. Practice and Recall only tick on a real change,
  // so items that were already correct still have to be called.
  if(UI.mode!=='study' && UI.arrivedSatisfied) return;
  if(UI.t0===null) UI.t0=performance.now();
  advance(true);
}

document.getElementById('items').addEventListener('click',(e)=>{
  const li=e.target.closest('li'); if(!li) return;
  const i=+li.dataset.i;
  if(UI.mode==='study'){
    // free navigation
    if(UI.done.includes(i)) UI.done=UI.done.filter(x=>x!==i);
    else UI.done.push(i);
    UI.idx = Math.min(currentPhase().items.length, Math.max(...[-1,...UI.done])+1);
    renderItems();
  }else if(i===UI.idx){
    advance(false);
  }
});

document.getElementById('next').addEventListener('click',()=>advance(false));
document.getElementById('reset').addEventListener('click',resetFlow);

phaseSel.addEventListener('change',()=>{ UI.phase=+phaseSel.value; resetFlow(); });

document.getElementById('setScene').addEventListener('click',()=>{
  Object.assign(S, COLD_DARK, currentPhase().scene||{});
  // A scene that starts with the engine running should start with it warm,
  // so the CHT/EGT checks in the flow mean something straight away.
  if(S.running){
    S.cht = 250 + (S.rpm/2500)*110 + (1-S.mixture)*70;
    S.egt = 1150 + (1-S.mixture)*280;
  }
  resetFlow(); render();
});
document.getElementById('labels').addEventListener('click',(e)=>{
  const off = P.classList.toggle('nolabels');
  e.currentTarget.textContent = off ? 'Show labels' : 'Hide labels';
});
document.getElementById('coldDark').addEventListener('click',()=>{
  Object.assign(S, COLD_DARK);
  resetFlow(); render();
});

document.getElementById('modes').addEventListener('click',(e)=>{
  const b=e.target.closest('button'); if(!b) return;
  UI.mode=b.dataset.mode;
  [...e.currentTarget.children].forEach(c=>c.setAttribute('aria-pressed', c===b));
  document.getElementById('modeNote').textContent = {
    study:'Study — items are visible and the matching control pulses on the panel. Click any item to tick it, or just work the controls.',
    practice:'Practice — work top to bottom. Items marked PANEL only tick when you actually set that control. "Next item" skips, and counts as a miss.',
    recall:'Recall — the list is blurred ahead of you. Say the item aloud and set the control from memory; it reveals as you go.'
  }[UI.mode];
  resetFlow();
});
document.getElementById('modes').querySelector('button').click();

/* Space = next item */
addEventListener('keydown',(e)=>{
  if(e.code==='Space' && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)){
    e.preventDefault(); advance(false);
  }
});

/* v-speeds table */
document.getElementById('vtable').innerHTML =
  VSPEEDS.map(([a,b])=>`<tr><td>${a}</td><td>${b}</td></tr>`).join('');

/* top-level tabs: Flows / Traffic Pattern / SIM */
document.getElementById('topTabs').addEventListener('click',(e)=>{
  const b=e.target.closest('button'); if(!b) return;
  [...e.currentTarget.children].forEach(c=>c.setAttribute('aria-selected', c===b));
  const top=b.dataset.top;
  document.getElementById('topFlows').classList.toggle('hide',   top!=='flows');
  document.getElementById('topPattern').classList.toggle('hide', top!=='pattern');
  document.getElementById('topSim').classList.toggle('hide',     top!=='sim');
});

/* sub-tabs inside Flows: Trainer / Reference */
document.getElementById('subTabs').addEventListener('click',(e)=>{
  const b=e.target.closest('button'); if(!b) return;
  [...e.currentTarget.children].forEach(c=>c.setAttribute('aria-selected', c===b));
  document.getElementById('viewTrain').classList.toggle('hide', b.dataset.view!=='train');
  document.getElementById('viewRef').classList.toggle('hide', b.dataset.view!=='ref');
});

/* ==========================================================================
   9. MAIN LOOP
   ========================================================================== */
let loopErrs=0;
function frame(now){
  // Everything is guarded and rAF is ALWAYS re-armed: previously one bad
  // frame stopped the loop for good, which froze the panel while the
  // checklist carried on working.
  try{
    const dt=Math.min(0.1,(now-last)/1000); last=now;
    physics(dt);
    render();
    flowsAuto();
    if(UI.t0!==null && UI.idx<currentPhase().items.length){
      UI.elapsed=(now-UI.t0)/1000;
      const m=Math.floor(UI.elapsed/60), s=Math.floor(UI.elapsed%60);
      document.getElementById('clock').textContent=`${m}:${String(s).padStart(2,'0')}`;
    }
  }catch(err){
    if(!loopErrs++){
      console.error('panel loop error:', err);
      const st=document.getElementById('strip');
      if(st) st.insertAdjacentHTML('afterbegin',
        `<span class="chip dead">LOOP ERROR <b>${String(err && err.message || err)}</b></span>`);
    }
  }
  requestAnimationFrame(frame);
}
phaseSel.value=0; UI.phase=0; resetFlow();
render();                      // paint once up front, so the first view never
requestAnimationFrame(frame);  // depends on the animation loop having started
