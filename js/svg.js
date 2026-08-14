"use strict";
/* Cessna 172 SIM - N46519
   SVG drawing helpers. */

/* ==========================================================================
   2. SVG HELPERS
   ========================================================================== */
const T = (d)=> (d-90)*Math.PI/180;
const px = (cx,cy,r,d)=> [cx+r*Math.cos(T(d)), cy+r*Math.sin(T(d))];
const f  = (n)=> Math.round(n*100)/100;

/** Arc path string, used for the coloured operating-range bands. */
function arc(cx,cy,r,d0,d1){
  const [x0,y0]=px(cx,cy,r,d0), [x1,y1]=px(cx,cy,r,d1);
  const big = Math.abs(d1-d0)>180 ? 1 : 0;
  return `M${f(x0)} ${f(y0)} A${r} ${r} 0 ${big} 1 ${f(x1)} ${f(y1)}`;
}
/** Build a linear value→angle mapper. */
const mapper = (v0,v1,a0,a1)=> v=> a0 + (Math.max(v0,Math.min(v1,v))-v0)/(v1-v0)*(a1-a0);

/** Tick marks + numerals around a dial. */
/* Tick marks + numerals around a dial.
   `lblR` is the radius the numerals sit at and `lblSz` their size — both must
   scale with the dial, or a small instrument ends up with its numbers stacked
   on top of each other in the middle. */
function ticks(cx,cy,r,m,v0,v1,step,majEvery,labelStep,fmt=(v)=>v,lblR=null,lblSz=null){
  const LR = lblR ?? r-24;
  let s='';
  const n = Math.round((v1-v0)/step);
  for(let i=0;i<=n;i++){
    // Index-based so repeated addition can't drift (0.2 × 8 = 1.6000000000000003).
    const v = +(v0 + i*step).toFixed(6);
    const a=m(v), maj = i%majEvery===0;
    const [x0,y0]=px(cx,cy,r-(maj?9:5),a), [x1,y1]=px(cx,cy,r-1,a);
    s+=`<line class="tick${maj?' maj':''}" x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}"/>`;
    if(labelStep && Math.abs(v/labelStep - Math.round(v/labelStep))<1e-6){
      const [lx,ly]=px(cx,cy,LR,a);
      s+=`<text class="dlbl" x="${f(lx)}" y="${f(ly)}"${lblSz?` style="font-size:${lblSz}px"`:''}>${fmt(v)}</text>`;
    }
  }
  return s;
}
/** Round instrument shell. */
function shell(cx,cy,r,name){
  return `<circle class="bezel" cx="${cx}" cy="${cy}" r="${r+7}"/>
          <circle class="dial"  cx="${cx}" cy="${cy}" r="${r}"/>
          <text class="iname" x="${cx}" y="${cy+r+20}">${name}</text>`;
}
/** A tapered pointer, drawn pointing straight up from (cx,cy). */
function pointer(id,cx,cy,len,w=4.5,cls='needle'){
  return `<g id="${id}" style="transform-origin:${cx}px ${cy}px">
    <path class="${cls}" d="M${cx} ${cy-len} L${cx+w} ${cy+8} L${cx-w} ${cy+8} Z"/>
  </g>`;
}
