"use strict";
/* Cessna 172 SIM - N46519
   Click and drag wiring for the panel controls. */

/* ==========================================================================
   4. CONTROL WIRING
   ========================================================================== */
const $ = (s)=>document.querySelector(s);

P.addEventListener('click',(e)=>{
  const g = e.target.closest('[data-ctl],[data-ign],[data-fuel],[data-flap],[data-xpdr],[data-ign-step],[data-fuel-step]');
  if(!g) return;
  // The primer is a pump, not a switch — each click is one stroke.
  if(g.dataset.ctl==='primer') S.primer = (S.primer+1) % 7;
  else if(g.dataset.ctl) S[g.dataset.ctl] = !S[g.dataset.ctl];
  if(g.dataset.ign)  setMags(g.dataset.ign);
  if(g.dataset.fuel) S.fuel = g.dataset.fuel;
  // clicking the body of a rotary steps it round, which is what people try first
  if(g.dataset.ignStep){ const R=['OFF','R','L','BOTH','START'];
    setMags(R[(R.indexOf(S.mags)+1)%R.length]); }
  if(g.dataset.fuelStep){ const R=['OFF','LEFT','BOTH','RIGHT'];
    S.fuel = R[(R.indexOf(S.fuel)+1)%R.length]; }
  if(g.dataset.flap) S.flaps = +g.dataset.flap;
  if(g.dataset.xpdr) S.xpdr = g.dataset.xpdr;
  render();   // repaint now — never wait on the animation frame for input
});


/* Plungers: drag vertically, or click above/below the knob to nudge. */
let drag=null;
P.addEventListener('pointerdown',(e)=>{
  const g=e.target.closest('[data-plunger]'); if(!g) return;
  const id=g.dataset.plunger;
  if(id==='carbheat'){ S.carb=!S.carb; render(); return; }   // carb heat is on/off
  drag={id, el:g}; P.setPointerCapture(e.pointerId); applyDrag(e);
});
P.addEventListener('pointermove',(e)=>{ if(drag) applyDrag(e); });
P.addEventListener('pointerup',  ()=>{ drag=null; });
P.addEventListener('pointercancel',()=>{ drag=null; });

function applyDrag(e){
  const pt=P.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY;
  const loc=pt.matrixTransform(P.getScreenCTM().inverse());
  if(drag.id==='trim'){
    const top=TRIM[1]-44, len=88;
    S.trim = 1 - Math.max(0,Math.min(1,(loc.y-top)/len));
  }else{
    // Plungers: pushed IN (knob high) = open / rich. Pulled out = closed / lean.
    const top=PLUNGER.y-8, len=PLUNGER.travel;
    S[drag.id] = 1 - Math.max(0,Math.min(1,(loc.y-top)/len));
  }
  render();
}
