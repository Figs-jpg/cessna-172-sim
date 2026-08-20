"use strict";
/* Cessna 172 SIM - N46519
   Traffic pattern diagram: a north-up plan view of the runway with the
   rectangular circuit around it, annotated with the numbers from the
   Traffic Pattern checklist. */

const PAT = { rwy: 21, hand: 'L' };          // active runway end, left/right traffic

/* Each leg carries the call from the checklist, so the diagram and the
   side panel can never disagree. */
const PAT_LEGS = [
  {leg:'UPWIND',    call:'Climb 80 MPH'},
  {leg:'CROSSWIND', call:'Level, accelerate 90–100 MPH'},
  {leg:'DOWNWIND',  call:'2,200 RPM · pattern altitude'},
  {leg:'ABEAM',     call:'1,700 RPM · carb heat ON · flap 10° · 80 MPH'},
  {leg:'BASE',      call:'1,500 RPM · flap 20°'},
  {leg:'FINAL',     call:'Flap 30° · 75/70 MPH'}
];

(function(){
const SVG = document.getElementById('patternSvg');
if(!SVG) return;
const VW = 1000, VH = 760;
const rad = d => d*Math.PI/180;
const add = (a,b,k=1) => [a[0]+b[0]*k, a[1]+b[1]*k];
const mid = (a,b) => [(a[0]+b[0])/2, (a[1]+b[1])/2];
const f = n => Math.round(n*10)/10;

function build(){
  const h = PAT.rwy*10;                       // magnetic heading of the active end
  const recip = ((PAT.rwy*10+180)%360)/10;    // the other end's number
  const fwd  = [Math.sin(rad(h)), -Math.cos(rad(h))];
  const turn = PAT.hand==='L' ? h-90 : h+90;  // direction the pattern lies
  const side = [Math.sin(rad(turn)), -Math.cos(rad(turn))];

  const L = 250, D = 200, EXT = 95, HW = 15;  // runway length, pattern width, extension, half-width

  // A = threshold you land on, B = far end
  let A = [0,0], B = add(A, fwd, L);
  const P1 = add(B,  fwd,  EXT);              // end of upwind
  const P2 = add(P1, side, D);                // end of crosswind
  const P3 = add(P2, fwd, -(L+2*EXT));        // end of downwind
  const P4 = add(P3, side, -D);               // end of base = start of final
  const ABEAM = add(A, side, D);              // abeam the numbers

  // fit the whole circuit into the view
  const pts = [A,B,P1,P2,P3,P4,ABEAM];
  const xs = pts.map(p=>p[0]), ys = pts.map(p=>p[1]);
  const cx = (Math.min(...xs)+Math.max(...xs))/2, cy = (Math.min(...ys)+Math.max(...ys))/2;
  const ox = VW/2 - cx, oy = VH/2 - cy + 10;
  const T = p => [f(p[0]+ox), f(p[1]+oy)];
  const [a,b,p1,p2,p3,p4,ab] = [A,B,P1,P2,P3,P4,ABEAM].map(T);

  const perp = [-fwd[1], fwd[0]];             // across the runway
  const corner = (base,s) => T(add(base, perp, s));
  const c1=corner(A,HW), c2=corner(A,-HW), c3=corner(B,-HW), c4=corner(B,HW);

  // arrowhead pointing along dir, sitting at point p
  const arrow = (p,dir,size=11)=>{
    const n=[-dir[1],dir[0]];
    const t=add(p,dir,size), l=add(add(p,dir,-size*0.5), n, size*0.55),
          r=add(add(p,dir,-size*0.5), n,-size*0.55);
    return `<path d="M${f(t[0])} ${f(t[1])} L${f(l[0])} ${f(l[1])} L${f(r[0])} ${f(r[1])} Z" class="pat-arrow"/>`;
  };
  // label placed beside a leg, offset away from the runway
  const label = (p, dx, dy, lines, cls='') =>
    `<g class="pat-lbl ${cls}" transform="translate(${f(p[0]+dx)},${f(p[1]+dy)})">` +
    lines.map((t,i)=>`<text y="${i*13}" class="${i?'pat-sub':'pat-leg'}">${t}</text>`).join('') + '</g>';

  const legMid = (u,v) => mid(T(u),T(v));
  const out = [];

  // ---- ground ----
  out.push(`<rect x="0" y="0" width="${VW}" height="${VH}" fill="#0d1512"/>`);
  for(let i=0;i<VW;i+=50)
    out.push(`<line x1="${i}" y1="0" x2="${i}" y2="${VH}" stroke="#131c18" stroke-width="1"/>`);
  for(let i=0;i<VH;i+=50)
    out.push(`<line x1="0" y1="${i}" x2="${VW}" y2="${i}" stroke="#131c18" stroke-width="1"/>`);

  // ---- the circuit ----
  out.push(`<path class="pat-track" d="M${a[0]} ${a[1]} L${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]}
             L${p3[0]} ${p3[1]} L${p4[0]} ${p4[1]} L${a[0]} ${a[1]}"/>`);

  // direction arrows at each leg midpoint
  const legs = [
    ['UPWIND',    a,  p1,  fwd],
    ['CROSSWIND', p1, p2,  side],
    ['DOWNWIND',  p2, p3,  [-fwd[0],-fwd[1]]],
    ['BASE',      p3, p4,  [-side[0],-side[1]]],
    ['FINAL',     p4, a,   fwd]
  ];
  legs.forEach(([, s, e, dir]) => out.push(arrow(mid(s,e), dir, 12)));

  // ---- runway ----
  out.push(`<path class="pat-rwy" d="M${c1[0]} ${c1[1]} L${c4[0]} ${c4[1]} L${c3[0]} ${c3[1]} L${c2[0]} ${c2[1]} Z"/>`);
  for(let i=1;i<9;i++){                              // centreline dashes
    const s=T(add(A,fwd,L*i/9 - 8)), e=T(add(A,fwd,L*i/9 + 8));
    out.push(`<line x1="${s[0]}" y1="${s[1]}" x2="${e[0]}" y2="${e[1]}" class="pat-cl"/>`);
  }
  [[A,1],[B,-1]].forEach(([end,dir])=>{               // threshold bars
    for(let k=-3;k<=3;k++){
      if(!k) continue;
      const o1=T(add(add(end,perp,k*4),fwd,dir*8)), o2=T(add(add(end,perp,k*4),fwd,dir*26));
      out.push(`<line x1="${o1[0]}" y1="${o1[1]}" x2="${o2[0]}" y2="${o2[1]}" class="pat-thr"/>`);
    }
  });
  // runway numbers, oriented with the runway as they are painted
  const nA=T(add(A,fwd,42)), nB=T(add(B,fwd,-42));
  out.push(`<text class="pat-num" x="${nA[0]}" y="${nA[1]}" transform="rotate(${h} ${nA[0]} ${nA[1]})">${String(PAT.rwy).padStart(2,'0')}</text>`);
  out.push(`<text class="pat-num" x="${nB[0]}" y="${nB[1]}" transform="rotate(${(h+180)%360} ${nB[0]} ${nB[1]})">${String(recip).padStart(2,'0')}</text>`);

  // ---- abeam marker ----
  out.push(`<circle cx="${ab[0]}" cy="${ab[1]}" r="6" class="pat-abeam"/>`);
  out.push(`<line x1="${a[0]}" y1="${a[1]}" x2="${ab[0]}" y2="${ab[1]}" class="pat-tie"/>`);

  // ---- leg labels ----
  const away = (v,k)=>[v[0]*k, v[1]*k];
  const [sx,sy] = away(side, 1);
  out.push(label(legMid(A,P1),   -sx*58, -sy*58, ['UPWIND', PAT_LEGS[0].call]));
  out.push(label(legMid(P1,P2),   fwd[0]*46,  fwd[1]*46, ['CROSSWIND', PAT_LEGS[1].call]));
  out.push(label(legMid(P2,P3),   sx*58,  sy*58, ['DOWNWIND', PAT_LEGS[2].call]));
  out.push(label(legMid(P3,P4),  -fwd[0]*52, -fwd[1]*52, ['BASE', PAT_LEGS[4].call]));
  out.push(label(legMid(P4,A),   -sx*58, -sy*58, ['FINAL', PAT_LEGS[5].call]));
  out.push(label([ab[0],ab[1]],   sx*22+12, sy*22+4, ['ABEAM THE NUMBERS', PAT_LEGS[3].call], 'pat-key'));

  // ---- north arrow ----
  out.push(`<g transform="translate(72,${VH-92})">
      <circle r="34" fill="#0b1310" stroke="#2a3a33"/>
      <path d="M0 -26 L7 6 L0 1 L-7 6 Z" fill="#e6edf3"/>
      <text class="pat-n" y="-30">N</text>
      <text class="pat-sub" y="26" style="text-anchor:middle">MAG</text>
    </g>`);

  // ---- caption ----
  out.push(`<text class="pat-title" x="${VW-24}" y="42">RUNWAY ${String(PAT.rwy).padStart(2,'0')}</text>`);
  out.push(`<text class="pat-title2" x="${VW-24}" y="66">${PAT.hand==='L'?'LEFT':'RIGHT'}-HAND TRAFFIC · ${String(h).padStart(3,'0')}°</text>`);

  SVG.innerHTML = out.join('\n');

  // side panel: the same calls, in order
  const rows = [PAT_LEGS[0],PAT_LEGS[1],PAT_LEGS[2],PAT_LEGS[3],PAT_LEGS[4],PAT_LEGS[5]];
  document.getElementById('patLegs').innerHTML = rows.map(r=>
    `<tr><td><b>${r.leg}</b></td><td style="text-align:left;color:var(--txt);font-family:inherit;font-weight:400">${r.call}</td></tr>`
  ).join('');
  document.getElementById('patNote').innerHTML =
    `Plan view, north up. Runway ${String(PAT.rwy).padStart(2,'0')} runs ${String(h).padStart(3,'0')}° magnetic; `+
    `the reciprocal is ${String(recip).padStart(2,'0')}. Calls are from the Traffic Pattern checklist. `+
    `Pattern altitude is normally 1,000 ft AGL — confirm your field's.`;
}

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
