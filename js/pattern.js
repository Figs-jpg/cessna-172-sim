"use strict";
/* Cessna 172 SIM - N46519
   Traffic pattern diagram: a north-up plan view of runway 03/21 with the
   rectangular circuit around it, annotated with the calls from the Traffic
   Pattern checklist.

   The runway is ONE piece of tarmac, so it is pinned: same place, same
   orientation, always. Choosing the other end or the other direction of
   turns moves the CIRCUIT around it, which is the thing that actually
   changes in the air. */

const PAT = { rwy: 21, hand: 'L', call: null };   // active end, turns, selected call

/* One list feeds both the diagram labels and the side panel, so they cannot
   drift apart. */
const PAT_LEGS = [
  {leg:'UPWIND',    call:'Climb 80 MPH'},
  {leg:'CROSSWIND', call:'Level, accelerate 90–100 MPH'},
  {leg:'DOWNWIND',  call:'2,200 RPM · 1,000 ft AGL'},
  {leg:'ABEAM',     call:'1,700 RPM · carb heat ON · flap 10° · 80 MPH'},
  {leg:'BASE',      call:'1,500 RPM · flap 20°'},
  {leg:'FINAL',     call:'Flap 30° · 75/70 MPH'}
];

/* Radio calls for a non-towered field, in AIM order: field, callsign,
   position and intention, field again. The aeroplane's own callsign is used;
   the field name is a placeholder until it is supplied. */
const PAT_FIELD = '[FIELD]';
const CALLSIGN  = 'Cessna four six five one niner';
const DIGITS = ['zero','one','two','three','four','five','six','seven','eight','niner'];
const spoken = r => String(r).padStart(2,'0').split('').map(d=>DIGITS[+d]).join(' ');

const PAT_CALLS = [
  {id:'taxi',      name:'Taxi',            say:(r,h)=>`taxiing to runway ${spoken(r)}`},
  {id:'departing', name:'Departing',       say:(r,h)=>`departing runway ${spoken(r)}, ${h} closed traffic`},
  {id:'crosswind', name:'Crosswind',       say:(r,h)=>`turning ${h} crosswind runway ${spoken(r)}`},
  {id:'entry45',   name:'45° entry',        arriving:true,
     say:(r,h)=>`on the forty-five, entering the ${h} downwind runway ${spoken(r)}`},
  {id:'downwind',  name:'Downwind',        say:(r,h)=>`midfield ${h} downwind runway ${spoken(r)}`},
  {id:'base',      name:'Base',            say:(r,h)=>`turning ${h} base runway ${spoken(r)}`},
  {id:'final',     name:'Final',           say:(r,h)=>`turning final runway ${spoken(r)}, full stop`},
  {id:'clear',     name:'Clear of runway', say:(r,h)=>`clear of runway ${spoken(r)}`}
];
const callText = c =>
  `${PAT_FIELD} traffic, ${CALLSIGN}, ${c.say(PAT.rwy, PAT.hand==='L'?'left':'right')}, ${PAT_FIELD}.`;

(function(){
const SVG = document.getElementById('patternSvg');
if(!SVG) return;

const VW = 1000, VH = 820;
const AXIS = 210;                          // runway 03/21 lies on 210°/030° magnetic
const CTR  = [VW/2, VH/2 + 8];             // runway centre — fixed, never moves
const L = 250, D = 200, EXT = 95, HW = 15; // runway length, pattern width, extension, half-width

const rad = d => d*Math.PI/180;
const add = (a,b,k=1) => [a[0]+b[0]*k, a[1]+b[1]*k];
const neg = v => [-v[0], -v[1]];
const mid = (a,b) => [(a[0]+b[0])/2, (a[1]+b[1])/2];
const f = n => Math.round(n*10)/10;

/* Fixed runway geometry — computed once, identical for every selection. */
const axis = [Math.sin(rad(AXIS)), -Math.cos(rad(AXIS))];   // points the way you fly runway 21
const perp = [-axis[1], axis[0]];
const E21  = add(CTR, axis, -L/2);         // north-east end, where "21" is painted
const E03  = add(CTR, axis,  L/2);         // south-west end, where "03" is painted
const N21  = add(E21, axis,  42);          // the painted numbers themselves
const N03  = add(E03, axis, -42);

function build(){
  const on21  = PAT.rwy === 21;
  const h     = PAT.rwy*10;                // 210 or 030
  const recip = on21 ? 3 : 21;
  const fwd   = on21 ? axis : neg(axis);   // direction of flight on the runway
  const A     = on21 ? E21 : E03;          // threshold you land on
  const B     = on21 ? E03 : E21;          // far end
  const NUMS  = on21 ? N21 : N03;

  const turn = h + (PAT.hand==='L' ? -90 : 90);
  const side = [Math.sin(rad(turn)), -Math.cos(rad(turn))];

  const P1 = add(B,  fwd,  EXT);           // end of upwind
  const P2 = add(P1, side, D);             // end of crosswind
  const P3 = add(P2, fwd, -(L+2*EXT));     // end of downwind
  const P4 = add(P3, side, -D);            // end of base = start of final
  const ABEAM = add(NUMS, side, D);        // abeam the painted numbers

  const R = p => [f(p[0]), f(p[1])];
  const [a,b_,p1,p2,p3,p4,ab,nums] = [A,B,P1,P2,P3,P4,ABEAM,NUMS].map(R);

  const arrow = (p,dir,size=12)=>{
    const n=[-dir[1],dir[0]];
    const t=add(p,dir,size), l=add(add(p,dir,-size*0.5), n, size*0.55),
          r=add(add(p,dir,-size*0.5), n,-size*0.55);
    return `<path d="M${f(t[0])} ${f(t[1])} L${f(l[0])} ${f(l[1])} L${f(r[0])} ${f(r[1])} Z" class="pat-arrow"/>`;
  };
  /* Labels run ALONG their leg, sitting just off it — so which leg a call
     belongs to is unmistakable, and a rotated label no longer has to be held
     far away to avoid crossing the line. Rotation is normalised to keep text
     the right way up; it may therefore read against the direction of flight,
     which is normal on a chart. */
  const lerp=(u,v,t)=>[u[0]+(v[0]-u[0])*t, u[1]+(v[1]-u[1])*t];
  const label = (p, along, lines, cls='', dist=26, outDir=null) => {
    let ang = Math.atan2(along[1], along[0]) * 180/Math.PI;
    if(ang >  90) ang -= 180;
    if(ang <= -90) ang += 180;
    const n0=[-along[1],along[0]], away=[p[0]-CTR[0], p[1]-CTR[1]];
    /* The away-from-centre test is degenerate when a leg points straight
       out from the runway (upwind, final): the perpendicular is orthogonal
       to `away`, the dot product is ~0, and the side comes out arbitrary.
       Those legs pass their side explicitly. */
    const n = outDir || ((n0[0]*away[0]+n0[1]*away[1])>=0 ? n0 : [-n0[0],-n0[1]]);
    const x=p[0]+n[0]*dist, y=p[1]+n[1]*dist;
    return `<g class="pat-lbl ${cls}" transform="translate(${f(x)},${f(y)}) rotate(${f(ang)})">
      <text y="-5" class="pat-leg">${lines[0]}</text>
      <text y="8" class="pat-sub">${lines[1]}</text></g>`;
  };

  const out = [];

  // ---- ground ----
  out.push(`<rect x="0" y="0" width="${VW}" height="${VH}" fill="#0d1512"/>`);
  for(let i=0;i<VW;i+=50) out.push(`<line x1="${i}" y1="0" x2="${i}" y2="${VH}" stroke="#131c18"/>`);
  for(let i=0;i<VH;i+=50) out.push(`<line x1="0" y1="${i}" x2="${VW}" y2="${i}" stroke="#131c18"/>`);

  // ---- circuit ----
  out.push(`<path class="pat-track" d="M${a[0]} ${a[1]} L${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]}
             L${p3[0]} ${p3[1]} L${p4[0]} ${p4[1]} Z"/>`);
  [[A,P1,fwd],[P1,P2,side],[P2,P3,neg(fwd)],[P3,P4,neg(side)],[P4,A,fwd]]
    .forEach(([s,e,dir]) => out.push(arrow(mid(s,e), dir)));

  // ---- runway: pinned, drawn identically whichever end is active ----
  const c = (base,s) => R(add(base, perp, s));
  const c1=c(E21,HW), c2=c(E21,-HW), c3=c(E03,-HW), c4=c(E03,HW);
  out.push(`<path class="pat-rwy" d="M${c1[0]} ${c1[1]} L${c4[0]} ${c4[1]} L${c3[0]} ${c3[1]} L${c2[0]} ${c2[1]} Z"/>`);
  for(let i=1;i<9;i++){
    const s=R(add(E21,axis,L*i/9-8)), e=R(add(E21,axis,L*i/9+8));
    out.push(`<line x1="${s[0]}" y1="${s[1]}" x2="${e[0]}" y2="${e[1]}" class="pat-cl"/>`);
  }
  [[E21,1],[E03,-1]].forEach(([end,dir])=>{
    for(let k=-3;k<=3;k++){
      if(!k) continue;
      const o1=R(add(add(end,perp,k*4),axis,dir*8)), o2=R(add(add(end,perp,k*4),axis,dir*26));
      out.push(`<line x1="${o1[0]}" y1="${o1[1]}" x2="${o2[0]}" y2="${o2[1]}" class="pat-thr"/>`);
    }
  });
  // both numbers always shown, oriented as painted; the active end is lit
  const t21=R(N21), t03=R(N03);
  out.push(`<text class="pat-num ${on21?'on':''}" x="${t21[0]}" y="${t21[1]}" transform="rotate(210 ${t21[0]} ${t21[1]})">21</text>`);
  out.push(`<text class="pat-num ${on21?'':'on'}" x="${t03[0]}" y="${t03[1]}" transform="rotate(30 ${t03[0]} ${t03[1]})">03</text>`);

  // ---- abeam the numbers ----
  out.push(`<line x1="${nums[0]}" y1="${nums[1]}" x2="${ab[0]}" y2="${ab[1]}" class="pat-tie"/>`);
  out.push(`<circle cx="${ab[0]}" cy="${ab[1]}" r="6" class="pat-abeam"/>`);

  // ---- leg labels: each pushed clear of its own leg ----
  // Upwind and final both lie on the runway centreline extended, so they are
  // held further out: their labels are longer than the short legs they belong
  // to and would otherwise overhang onto the tarmac.
  const outside = neg(side);          // away from the circuit, not into it
  out.push(label(mid(b_,p1),      fwd,       ['UPWIND',    PAT_LEGS[0].call], '', 40, outside));
  out.push(label(mid(p1,p2),      side,      ['CROSSWIND', PAT_LEGS[1].call]));
  // biased along the leg: the midfield downwind call point sits at the
  // midpoint, and the two would otherwise occupy the same spot
  out.push(label(lerp(p2,p3,0.3),  neg(fwd),  ['DOWNWIND',  PAT_LEGS[2].call]));
  out.push(label(mid(p3,p4),      neg(side), ['BASE',      PAT_LEGS[4].call]));
  // biased toward the threshold so it does not overhang into the base leg
  out.push(label(lerp(p4,a,0.72), fwd,       ['FINAL',     PAT_LEGS[5].call], '', 44, outside));

  /* Abeam gets a callout rather than a leg label: upright, left-aligned, set
     outside the circuit and joined to the marker by a leader. Exact placement
     waits until after render, when its width can be measured. */
  const q0 = add(ab, side, 62);
  out.push(`<line id="abeamLead" class="pat-lead" x1="${ab[0]}" y1="${ab[1]}" x2="${f(q0[0])}" y2="${f(q0[1])}"/>`);
  out.push(`<g id="abeamLbl" class="pat-lbl pat-key" transform="translate(${f(q0[0])},${f(q0[1])})">
      <text y="-4" class="pat-leg">ABEAM THE NUMBERS</text>
      <text y="9" class="pat-sub">${PAT_LEGS[3].call}</text></g>`);

  /* ---- 45-degree entry ----
     Joins the downwind upwind of midfield, arriving from outside the circuit.
     Track is 45 degrees off the downwind heading, so the inbound direction is
     the downwind heading turned half a right angle toward the outboard side. */
  const JOIN = add(P2, fwd, -66);                       // upwind end of the downwind
  const ENTRY_DIR = [(-fwd[0]-side[0])/Math.SQRT2, (-fwd[1]-side[1])/Math.SQRT2];
  const ENTRY_TAIL = add(JOIN, ENTRY_DIR, -118);
  const jn = R(JOIN), tl = R(ENTRY_TAIL);
  out.push(`<line class="pat-entry" x1="${tl[0]}" y1="${tl[1]}" x2="${jn[0]}" y2="${jn[1]}"/>`);
  out.push(arrow(mid(ENTRY_TAIL, JOIN), ENTRY_DIR, 11));
  /* Label near the tail, marker near the join. The label block is not
     symmetric about its origin, so which way it leans flips with the
     normalised rotation - they need ~60px of separation for the worst case. */
  out.push(label(lerp(jn, tl, 0.87), ENTRY_DIR, ['45° ENTRY', 'join the downwind'], 'pat-key', 24));

  /* ---- radio call points ----
     Positions follow the flight: hold short, lined up, then each turn, then
     clear of the runway. Numbered so the order is readable at a glance. */
  const callAt = {
    taxi:      add(add(A, side, 48), fwd, -22),
    departing: add(A, fwd, 34),
    crosswind: P1,
    entry45:   add(JOIN, ENTRY_DIR, -36),
    downwind:  mid(P2, P3),
    base:      P3,
    final:     P4,
    clear:     add(B, fwd, -38)
  };
  PAT_CALLS.forEach((c,i)=>{
    const q = R(callAt[c.id]);
    const on = PAT.call === c.id;
    out.push(`<g class="pat-call${on?' sel':''}" data-call="${c.id}">
        <circle cx="${q[0]}" cy="${q[1]}" r="11" class="pat-callhit"/>
        <circle cx="${q[0]}" cy="${q[1]}" r="9"/>
        <text x="${q[0]}" y="${q[1]}">${i+1}</text></g>`);
  });

  // ---- north arrow ----
  out.push(`<g transform="translate(74,${VH-90})">
      <circle r="34" fill="#0b1310" stroke="#2a3a33"/>
      <path d="M0 -26 L7 6 L0 1 L-7 6 Z" fill="#e6edf3"/>
      <text class="pat-n" y="-30">N</text>
      <text class="pat-sub" y="27" style="text-anchor:middle">MAG</text>
    </g>`);

  // ---- caption ----
  out.push(`<text class="pat-title" x="${VW-24}" y="42">RUNWAY ${on21?'21':'03'}</text>`);
  out.push(`<text class="pat-title2" x="${VW-24}" y="66">${PAT.hand==='L'?'LEFT':'RIGHT'}-HAND TRAFFIC · ${String(h).padStart(3,'0')}°</text>`);

  SVG.innerHTML = out.join('\n');

  /* Now it can be measured: keep the text left-aligned, but sit the whole box
     on the far side of the marker when the circuit is mirrored so it never
     doubles back across the pattern. */
  const lbl = SVG.querySelector('#abeamLbl'), lead = SVG.querySelector('#abeamLead');
  if(lbl && lead){
    const w = lbl.getBBox().width;
    let x = side[0] < 0 ? q0[0] - w - 12 : q0[0] + 12;
    x = Math.max(10, Math.min(VW - w - 10, x));          // keep it in frame
    const y = Math.max(26, Math.min(VH-30, q0[1]));
    lbl.setAttribute('transform', 'translate(' + f(x) + ',' + f(y) + ')');
    // leader meets whichever edge of the box faces the marker
    lead.setAttribute('x2', f(ab[0] < x ? x - 5 : x + w + 5));
    lead.setAttribute('y2', f(y));
  }

  document.getElementById('patLegs').innerHTML = PAT_LEGS.map(r=>
    `<tr><td><b>${r.leg}</b></td><td style="text-align:left;color:var(--txt);font-family:inherit;font-weight:400">${r.call}</td></tr>`
  ).join('');

  document.getElementById('patCalls').innerHTML = PAT_CALLS.map((c,i)=>
    `<div class="callrow${PAT.call===c.id?' sel':''}" data-call="${c.id}">
       <span class="callno">${i+1}</span>
       <span class="calltxt"><b>${c.name}</b><em>${callText(c)}</em></span>
     </div>`).join('');
}

/* Selecting from either the diagram or the list highlights both. */
function selectCall(id){ PAT.call = (PAT.call===id ? null : id); build(); }
SVG.addEventListener('click', e=>{
  const g = e.target.closest('[data-call]'); if(g) selectCall(g.dataset.call);
});
document.getElementById('patCalls').addEventListener('click', e=>{
  const r = e.target.closest('[data-call]'); if(r) selectCall(r.dataset.call);
});

document.getElementById('rwySel').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  [...e.currentTarget.children].forEach(c=>c.setAttribute('aria-pressed', c===b));
  PAT.rwy = +b.dataset.rwy; build();
});
document.getElementById('handSel').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  [...e.currentTarget.children].forEach(c=>c.setAttribute('aria-pressed', c===b));
  PAT.hand = b.dataset.hand; build();
});

build();
})();
