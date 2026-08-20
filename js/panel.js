"use strict";
/* Cessna 172 SIM - N46519
   Panel geometry - builds the cockpit SVG. */

/* ==========================================================================
   3. PANEL GEOMETRY — measured off the N46519 cockpit photograph.

   Every position below was read off the photo as a fraction of the image,
   then converted into this 1400 x 1050 view (the cockpit is roughly 4:3).
   Rows and columns are then squared up: the camera sat left of centre, so
   raw pixel positions carry a perspective skew that would teach the wrong
   spatial habit. Sizes, ordering and grouping are as fitted.

   Layout, top to bottom:
     · main panel   — left six-pack (+2 blanked holes), centre radio stack,
                      right engine cluster
     · sub-panel    — ignition, master, breakers, light pulls, throttle
                      quadrant  (this is the shelf below the main panel)
     · pedestal     — elevator trim wheel and the floor fuel selector
     · yokes        — drawn as outlines for reference only
   ========================================================================== */
const P = document.getElementById('panel');

const GAUGE_R = 50;      // 3⅛" instrument
const SMALL_R = 35;      // 2¼" instrument
const COL = 128, ROW = 144;   // ROW must clear the G5 bezel plus its caption

/* ---- left cluster: standard six-pack, plus two blanked positions ---- */
const LX = 150, LY = 200;
const SIX = {
  asi :[LX,       LY],       adi :[LX+COL,   LY],
  altm:[LX+COL*2, LY],
  /* The JPI sits alone in the fourth column with nothing above or below
     it, so it is drawn larger than scale to fill that space and stay
     readable. Its own centre, not the six-pack grid. */
  aux :[570, 266],
  tc  :[LX,       LY+ROW],   hsi :[LX+COL,   LY+ROW],
  vsi :[LX+COL*2, LY+ROW]
};
/* ---- centre stack ---- */
const STK = {x:678, w:247, top:92};   // top edge — must stay below the dash top (84)
/* ---- right cluster ---- */
const TACH=[1009,148], AMM=[1160,156];
const SQ_Y = 270, SQ_X = [995,1085,1175,1265], SQ_W = 80, SQ_H = 56;
/* ---- sub-panel shelf ---- */
const SUB_Y = 462;                 // top edge of the shelf
const TIER_A = 520, TIER_B = 566;  // pull-knob row / breaker row
/* ---- throttle quadrant (push-pull plungers) ---- */
const PLUNGER = {y:504, travel:46};
/* ---- pedestal ---- */
const PED = {x:566, w:200, y:614};
// Trim sits high on the pedestal face: its ELEVATOR TRIM caption runs to
// ty+80, and the fuel selector's backing plate starts at 804.
const TRIM=[598,700], FUELSEL=[666,868];

/* value → angle mappers */
const mASI  = mapper(40,200, 25,335);
const mVSI  = v => 270 + (Math.max(-2000,Math.min(2000,v))/2000)*180;
const mTACH = mapper(500,3500, 205,515);
const mAMM  = mapper(-60,60, 305,415);

let svgParts = [];

/* backdrop: glareshield above, panel face, shelf, pedestal */
svgParts.push(`
  <rect x="0" y="0" width="1400" height="950" fill="#0a0d10"/>
  <path d="M0 84 Q 700 -18 1400 84 L1400 0 L0 0 Z" fill="#15191d"/>
  <rect class="plate" x="46" y="84" width="1308" height="378" rx="16"/>
  <rect class="plate" x="46" y="${SUB_Y}" width="1308" height="150" rx="10"/>
  <path class="plate" d="M${PED.x} ${PED.y} h${PED.w} v336 h-${PED.w} Z"/>
  <text class="iname" x="700" y="74" style="font-size:10px">N46519 · CESSNA 172K</text>`);

/* ---------- Airspeed (MPH — K model) ---------- */
{
  const [cx,cy]=SIX.asi, R=GAUGE_R;
  svgParts.push(shell(cx,cy,R,'AIRSPEED MPH'));
  svgParts.push(`<path class="arcW" stroke-width="4" d="${arc(cx,cy,R-4,mASI(45),mASI(100))}"/>`);
  svgParts.push(`<path class="arcG" stroke-width="4" d="${arc(cx,cy,R-9,mASI(55),mASI(145))}"/>`);
  svgParts.push(`<path class="arcY" stroke-width="4" d="${arc(cx,cy,R-9,mASI(145),mASI(182))}"/>`);
  svgParts.push(`<path class="arcR" stroke-width="4" d="${arc(cx,cy,R-9,mASI(182),mASI(190))}"/>`);
  // numerals every 40 mph — every 20 collides at this dial size
  svgParts.push(ticks(cx,cy,R,mASI,40,200,10,2,40,v=>v,R-23,8));
  svgParts.push(pointer('n_asi',cx,cy,R-14,3.5));
  svgParts.push(`<circle class="hub" cx="${cx}" cy="${cy}" r="5"/>`);
}

/* ---------- Garmin G5 attitude indicator ----------
   Drawn from the reference photo: heading strip across the top, airspeed
   tape left, altitude tape right with the baro setting under it, roll arc
   and pitch ladder on the horizon, and the bezel's power button + knob. */
const G5 = {w:112, h:120, sw:104, sh:90};   // bezel and screen, shared by both units
const SP_STEP=10, SP_PX=11, AL_STEP=100, AL_PX=11;
{
  const [cx,cy]=SIX.adi;
  const x=cx-G5.w/2, y=cy-G5.h/2;
  const sx=x+4, sy=y+13, sw=G5.sw, sh=G5.sh;
  const hcx=sx+52, hcy=sy+45;                       // horizon centre
  const tapeTop=sy+11, tapeBot=sy+79;

  let sp='', al='';
  for(let i=0;i<9;i++){
    sp+=`<text class="g5t" id="g5a_sp${i}" x="${sx+10}" y="0"></text>`;
    al+=`<text class="g5t" id="g5a_al${i}" x="${sx+93}" y="0"></text>`;
  }
  // roll arc ticks
  let roll='';
  [-60,-45,-30,-20,-10,0,10,20,30,45,60].forEach(a=>{
    const maj=[0,30,60,-30,-60].includes(a), r0=30, r1=r0-(maj?5:3);
    const [x0,y0]=px(hcx,hcy,r0,a), [x1,y1]=px(hcx,hcy,r1,a);
    roll+=`<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="#fff" stroke-width="1"/>`;
  });

  svgParts.push(`
   <rect class="bezel" x="${x-4}" y="${y-4}" width="${G5.w+8}" height="${G5.h+8}" rx="6"/>
   <rect x="${x}" y="${y}" width="${G5.w}" height="${G5.h}" rx="4" fill="#16191c"/>
   <text class="g5brand" x="${cx}" y="${y+9}">GARMIN</text>
   <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="#05070a"/>
   <clipPath id="g5aClip"><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}"/></clipPath>
   <g clip-path="url(#g5aClip)">
     <g id="g5a_horizon">
       <rect x="${hcx-120}" y="${hcy-240}" width="240" height="240" fill="#2f7ec4"/>
       <rect x="${hcx-120}" y="${hcy}"     width="240" height="240" fill="#8a5524"/>
       <line x1="${hcx-120}" y1="${hcy}" x2="${hcx+120}" y2="${hcy}" stroke="#fff" stroke-width="1.4"/>
       ${/* bars only — numerals on a ladder this small collide with the
             bottom strip as soon as the horizon translates */[-20,-10,10,20].map(p=>{
          const ww=(p%20)?7:14, yy=hcy-p*1.7;
          return `<line x1="${hcx-ww}" y1="${yy}" x2="${hcx+ww}" y2="${yy}" stroke="#fff" stroke-width=".9"/>`;
       }).join('')}
     </g>
     <g id="g5a_roll" style="transform-origin:${hcx}px ${hcy}px">${roll}</g>
     <path id="g5a_rollptr" d="M${hcx} ${hcy-30} l-3.5 6 h7 z" fill="#fff"/>

     <!-- semi-transparent tapes over the horizon, as on the real unit -->
     <rect x="${sx}" y="${tapeTop}" width="20" height="${tapeBot-tapeTop}" fill="rgba(0,0,0,.55)"/>
     <rect x="${sx+84}" y="${tapeTop}" width="20" height="${tapeBot-tapeTop}" fill="rgba(0,0,0,.55)"/>
     <clipPath id="g5aSp"><rect x="${sx}" y="${tapeTop}" width="20" height="${tapeBot-tapeTop}"/></clipPath>
     <clipPath id="g5aAl"><rect x="${sx+84}" y="${tapeTop}" width="20" height="${tapeBot-tapeTop}"/></clipPath>
     <g clip-path="url(#g5aSp)">${sp}</g>
     <g clip-path="url(#g5aAl)">${al}</g>
     <!-- airspeed colour band -->
     <rect x="${sx+18}" y="${tapeTop}" width="2.5" height="${tapeBot-tapeTop}" fill="#35d07f" opacity=".85"/>

     <!-- current value boxes -->
     <rect x="${sx-1}" y="${hcy-7}" width="23" height="14" fill="#000" stroke="#fff" stroke-width=".8"/>
     <text class="g5box" id="g5a_ias" x="${sx+10}" y="${hcy+4}">0</text>
     <rect x="${sx+82}" y="${hcy-7}" width="23" height="14" fill="#000" stroke="#fff" stroke-width=".8"/>
     <text class="g5box" id="g5a_alt" x="${sx+94}" y="${hcy+4}">0</text>

     <!-- heading strip -->
     <rect x="${sx}" y="${sy}" width="${sw}" height="11" fill="#0b0f13"/>
     <text class="g5c" id="g5a_hdg" x="${hcx}" y="${sy+8}">128°</text>
     <!-- bottom strip -->
     <rect x="${sx}" y="${sy+79}" width="${sw}" height="11" fill="#0b0f13"/>
     <text class="g5t" id="g5a_gs" x="${sx+16}" y="${sy+87}">GS 0</text>
     <text class="g5t" x="${hcx+6}" y="${sy+87}">NO VOR</text>
     <text class="g5c" id="g5a_baro" x="${sx+92}" y="${sy+87}">29.92</text>
   </g>
   <!-- yellow aircraft reference symbol -->
   <!-- 32px wide, so it starts at hcx-16 to sit centred on the horizon -->
   <path d="M${hcx-16} ${hcy} h11 l5 5 5 -5 h11" fill="none" stroke="#ffd21e" stroke-width="2"/>
   <rect x="${hcx-1.6}" y="${hcy-2}" width="3.2" height="4" fill="#ffd21e"/>
   <!-- bezel controls -->
   <circle cx="${x+18}" cy="${y+110}" r="6" fill="#20262c" stroke="#0a0d10"/>
   <path d="M${x+18} ${y+107} v4" stroke="#8b98a5" stroke-width="1.2"/>
   <circle cx="${cx}" cy="${y+110}" r="3" fill="#20262c" stroke="#0a0d10"/>
   <circle cx="${x+92}" cy="${y+110}" r="8.5" fill="#2c333a" stroke="#0a0d10" stroke-width="1.2"/>
   <path d="M${x+92} ${y+104} a6 6 0 0 1 0 12" fill="#1b2026"/>
   <text class="iname" x="${cx}" y="${y+G5.h+13}">G5 ATTITUDE</text>`);
}

/* ---------- Altimeter ---------- */
{
  const [cx,cy]=SIX.altm, R=GAUGE_R;
  svgParts.push(shell(cx,cy,R,'ALTITUDE FT'));
  svgParts.push(ticks(cx,cy,R,mapper(0,10,0,360),0,9.8,0.2,5,1,v=>v,R-26,8));
  // baro window sits outboard of the numerals, not on top of them
  svgParts.push(`<rect x="${cx+27}" y="${cy-6}" width="21" height="12" rx="2" fill="#05070a" stroke="#39424b"/>
                 <text id="kollsman" class="dlbl" x="${cx+37.5}" y="${cy+0.5}" style="font-size:5.5px">29.92</text>`);
  svgParts.push(pointer('n_alt_th',cx,cy,R-26,5,'needle2'));
  svgParts.push(pointer('n_alt_h', cx,cy,R-12,3));
  svgParts.push(`<circle class="hub" cx="${cx}" cy="${cy}" r="5"/>`);
}

/* ---------- JPI EDM engine monitor (top right of the six-pack) ----------
   Laid out from the reference screen: MAP/RPM arc top-left, oil and fuel
   bars top-right, per-cylinder EGT/CHT columns in the middle, and the
   selected EGT/CHT digits along the foot. Four columns, not the six in the
   reference photo — the O-320 in a 172K has four cylinders. */
const JPI = {w:172, h:240};   // geometry for render.js is stashed on this object
const JPI_BARS = [
  {id:'ot',  label:'O-T', lo:60, hi:250, get:()=>S.oilT,          fmt:v=>Math.round(v)},
  {id:'op',  label:'O-P', lo:0,  hi:100, get:()=>S.oilP,          fmt:v=>Math.round(v)},
  {id:'gph', label:'GPH', lo:0,  hi:14,  get:()=>fuelFlow(),      fmt:v=>v.toFixed(1)},
  {id:'rem', label:'REM', lo:0,  hi:38,  get:()=>S.fuelL+S.fuelR, fmt:v=>v.toFixed(1)}
];
/* fixed per-cylinder spread, so #3 always runs a little hotter — as it does */
const CYL_EGT = [0, -14, 26, -8], CYL_CHT = [0, -9, 18, -5];
const mJMAP = mapper(10,32, 140,400), mJRPM = mapper(500,2800, 140,400);

{
  const [cx,cy]=SIX.aux;
  const x=cx-JPI.w/2, y=cy-JPI.h/2;
  const sx=x+8, sy=y+10, sw=156, sh=190;
  const acx=sx+40, acy=sy+42;                          // MAP/RPM arc centre
  const barX=sx+84, barW=48;                           // right-hand strip gauges
  const colW=16, colPitch=28, col0=sx+28;              // cylinder columns
  const base=sy+146, colMax=40;                        // bar baseline and travel

  // stash for render.js so the two files cannot drift apart
  JPI.barW=barW; JPI.base=base; JPI.colMax=colMax;

  let bars='';
  JPI_BARS.forEach((b,i)=>{
    const by=sy+8+i*13;
    bars+=`
      <rect x="${barX}" y="${by}" width="${barW}" height="7" fill="#1b2026" stroke="#39424b" stroke-width=".5"/>
      <rect id="jpi_${b.id}bar" x="${barX}" y="${by}" width="0" height="7" fill="#35d07f"/>
      <text class="jt" id="jpi_${b.id}" x="${barX-4}" y="${by+6.5}" style="text-anchor:end">--</text>
      <text class="jt" x="${barX+barW+4}" y="${by+6.5}" style="text-anchor:start">${b.label}</text>`;
  });

  // At this size the per-cylinder figures fit again, as on the real unit.
  let cols='';
  for(let i=0;i<4;i++){
    const bx=col0+i*colPitch;
    cols+=`
      <text class="jtn" id="jpi_e${i}" x="${bx+colW/2}" y="${sy+92}" style="font-size:6.5px">----</text>
      <text class="jtn" id="jpi_c${i}" x="${bx+colW/2}" y="${sy+101}" style="font-size:6.5px;fill:#8b98a5">---</text>
      <rect id="jpi_b${i}" x="${bx}" y="${base}" width="${colW}" height="0" fill="#3b82d9"/>
      <rect id="jpi_k${i}" x="${bx}" y="${base}" width="${colW}" height="3" fill="#4dd2ff"/>
      <text class="jtn" x="${bx+colW/2}" y="${sy+155}" style="font-size:6.5px">${i+1}</text>`;
  }

  svgParts.push(`
   <rect class="bezel" x="${x-4}" y="${y-4}" width="${JPI.w+8}" height="${JPI.h+8}" rx="7"/>
   <rect x="${x}" y="${y}" width="${JPI.w}" height="${JPI.h}" rx="5" fill="#16191c"/>
   <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="#05070a"/>
   <clipPath id="jpiClip"><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}"/></clipPath>
   <g clip-path="url(#jpiClip)">
     <!-- MAP outer arc, RPM inner arc -->
     <path class="arcG" stroke-width="4" d="${arc(acx,acy,33,mJMAP(10),mJMAP(30))}"/>
     <path class="arcR" stroke-width="4" d="${arc(acx,acy,33,mJMAP(30),mJMAP(32))}"/>
     <path class="arcG" stroke-width="4" d="${arc(acx,acy,24,mJRPM(500),mJRPM(2700))}"/>
     <path class="arcR" stroke-width="4" d="${arc(acx,acy,24,mJRPM(2700),mJRPM(2800))}"/>
     <g id="jpi_mapptr" style="transform-origin:${acx}px ${acy}px">
       <path d="M${acx} ${acy-35} l-4 -5 h8 z" fill="#fff"/></g>
     <g id="jpi_rpmptr" style="transform-origin:${acx}px ${acy}px">
       <path d="M${acx} ${acy-26} l-4 -5 h8 z" fill="#fff"/></g>
     <text class="jt" x="${acx}" y="${acy-14}" style="text-anchor:middle;font-size:5px;fill:#8b98a5">MAP</text>
     <text class="jval" id="jpi_map" x="${acx}" y="${acy-4}" style="font-size:10px">--</text>
     <text class="jval" id="jpi_rpm" x="${acx}" y="${acy+8}" style="font-size:10px">----</text>
     <text class="jt" x="${acx}" y="${acy+17}" style="text-anchor:middle;font-size:5px;fill:#8b98a5">RPM</text>
     ${bars}
     <rect x="${barX}" y="${sy+62}" width="${barW}" height="12" fill="#000" stroke="#39424b" stroke-width=".5"/>
     <text class="jt" id="jpi_hm" x="${barX+barW/2}" y="${sy+71}" style="text-anchor:middle;fill:#4dd2ff">--:--</text>

     <!-- per-cylinder EGT / CHT -->
     ${cols}
     <text class="jtn" x="${sx+11}" y="${sy+110}" style="fill:#ff5f56">1650</text>
     <text class="jtn" x="${sx+11}" y="${base+2}" style="fill:#8b98a5">200</text>
     <text class="jtn" x="${sx+145}" y="${sy+110}" style="fill:#ff5f56">500</text>
     <text class="jtn" x="${sx+145}" y="${base+2}" style="fill:#8b98a5">°F</text>

     <!-- selected cylinder -->
     <text class="jt" x="${sx+5}" y="${sy+178}" style="text-anchor:start;fill:#8b98a5">EGT</text>
     <text class="jbig" id="jpi_egt" x="${sx+74}" y="${sy+181}" style="font-size:18px">----</text>
     <text class="jt" x="${sx+82}" y="${sy+178}" style="text-anchor:start;fill:#8b98a5">CHT</text>
     <text class="jbig" id="jpi_cht" x="${sx+151}" y="${sy+181}" style="font-size:18px">---</text>
   </g>
   <!-- bezel: lamp, round button, rocker, button -->
   <circle cx="${x+16}" cy="${y+220}" r="3" fill="#5a1f1f"/>
   <circle cx="${x+40}" cy="${y+220}" r="9" fill="#e6edf3" stroke="#0a0d10"/>
   <rect x="${x+68}" y="${y+212}" width="30" height="17" rx="3" fill="#20262c" stroke="#0a0d10"/>
   <rect x="${x+72}" y="${y+215}" width="22" height="7" rx="1.5" fill="#3a424b"/>
   <circle cx="${x+134}" cy="${y+220}" r="5" fill="#20262c" stroke="#0a0d10"/>
   <text class="iname" x="${cx}" y="${y+JPI.h+15}">JPI EDM  ENGINE MONITOR</text>`);
}


/* ---------- Turn coordinator ---------- */
{
  const [cx,cy]=SIX.tc, R=GAUGE_R;
  svgParts.push(shell(cx,cy,R,'TURN COORD'));
  svgParts.push(`<g id="tc_plane" style="transform-origin:${cx}px ${cy}px">
      <rect x="${cx-31}" y="${cy-2}" width="62" height="4" rx="2" fill="#e9eff5"/>
      <rect x="${cx-3}" y="${cy-11}" width="6" height="11" rx="3" fill="#e9eff5"/>
      <rect x="${cx-10}" y="${cy+6}" width="20" height="3.4" rx="1.7" fill="#e9eff5"/>
    </g>
    <line x1="${cx-38}" y1="${cy-12}" x2="${cx-28}" y2="${cy-12}" class="tick maj"/>
    <line x1="${cx+28}" y1="${cy-12}" x2="${cx+38}" y2="${cy-12}" class="tick maj"/>
    <text class="dlbl sm" x="${cx}" y="${cy-26}">2 MIN</text>
    <rect x="${cx-20}" y="${cy+21}" width="40" height="13" rx="6.5" fill="#05070a" stroke="#39424b"/>
    <circle id="tc_ball" cx="${cx}" cy="${cy+27.5}" r="4.2" fill="#1c1c1c" stroke="#555"/>`);
}

/* ---------- Garmin G5 HSI ----------
   Rotating compass card, white aircraft symbol, green course pointer and
   deviation bar, battery state top-left, CRS and track boxes at the foot. */
{
  const [cx,cy]=SIX.hsi;
  const x=cx-G5.w/2, y=cy-G5.h/2;
  const sx=x+4, sy=y+13, sw=G5.sw, sh=G5.sh;
  const rcx=sx+52, rcy=sy+46, r=33;                 // compass rose

  let card='';
  for(let hd=0; hd<360; hd+=5){
    const maj = hd%30===0;
    const [x0,y0]=px(rcx,rcy,r,hd), [x1,y1]=px(rcx,rcy,r-(maj?6:3),hd);
    card+=`<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="#fff" stroke-width="${maj?1.2:.7}"/>`;
    if(maj){
      // 5px: two-digit numerals at 30° spacing on a 33px rose collide at 6px
      const [lx,ly]=px(rcx,rcy,r-11,hd);
      const lbl={0:'N',90:'E',180:'S',270:'W'}[hd] ?? (hd/10);
      card+=`<text class="g5t" x="${f(lx)}" y="${f(ly)+1.8}" style="font-size:5px"
                   transform="rotate(${hd} ${f(lx)} ${f(ly)})">${lbl}</text>`;
    }
  }
  svgParts.push(`
   <rect class="bezel" x="${x-4}" y="${y-4}" width="${G5.w+8}" height="${G5.h+8}" rx="6"/>
   <rect x="${x}" y="${y}" width="${G5.w}" height="${G5.h}" rx="4" fill="#16191c"/>
   <text class="g5brand" x="${cx}" y="${y+9}">GARMIN</text>
   <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="#05070a"/>
   <clipPath id="g5hClip"><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}"/></clipPath>
   <g clip-path="url(#g5hClip)">
     <!-- battery + heading readout -->
     <text class="g5t" x="${sx+13}" y="${sy+8}" style="fill:#35d07f">100%</text>
     <rect x="${rcx-13}" y="${sy+1}" width="26" height="10" fill="#000" stroke="#4dd2ff" stroke-width=".7"/>
     <text class="g5c" id="g5h_hdg" x="${rcx}" y="${sy+9}">128°</text>

     <g id="g5h_card" style="transform-origin:${rcx}px ${rcy}px">${card}</g>

     <!-- course pointer + deviation bar, rotates with course vs heading -->
     <g id="g5h_crs" style="transform-origin:${rcx}px ${rcy}px">
       <path d="M${rcx} ${rcy-r+3} l-4 7 h8 z" fill="#35d07f"/>
       <rect x="${rcx-1.3}" y="${rcy-r+9}" width="2.6" height="9" fill="#35d07f"/>
       <rect x="${rcx-1.3}" y="${rcy+r-18}" width="2.6" height="9" fill="#35d07f"/>
       <rect id="g5h_dev" x="${rcx-1.3}" y="${rcy-11}" width="2.6" height="22" fill="#35d07f"/>
     </g>
     <text class="g5t" x="${sx+13}" y="${sy+18}" style="fill:#35d07f">VOR</text>
     <circle cx="${rcx}" cy="${rcy}" r="14" fill="none" stroke="#4dd2ff" stroke-width=".7" stroke-dasharray="2 3"/>

     <!-- aircraft symbol -->
     <!-- nose starts 10.3 above centre so the symbol straddles the rose centre -->
     <path d="M${rcx} ${rcy-10.3} l2 5 v3 l8 4 v2.5 l-8 -2 v4 l3 2.5 v1.5 l-5 -1 l-5 1 v-1.5 l3 -2.5 v-4 l-8 2 v-2.5 l8 -4 v-3 z"
           fill="#fff"/>

     <!-- CRS and track -->
     <rect x="${sx+2}" y="${sy+78}" width="34" height="10" fill="#000" stroke="#4dd2ff" stroke-width=".7"/>
     <text class="g5c" x="${sx+19}" y="${sy+86}">CRS 360°</text>
     <rect x="${sx+70}" y="${sy+78}" width="32" height="10" fill="#000" stroke="#4dd2ff" stroke-width=".7"/>
     <text class="g5c" id="g5h_trk" x="${sx+86}" y="${sy+86}">102°</text>
   </g>
   <!-- bezel controls -->
   <circle cx="${x+18}" cy="${y+110}" r="6" fill="#20262c" stroke="#0a0d10"/>
   <path d="M${x+18} ${y+107} v4" stroke="#8b98a5" stroke-width="1.2"/>
   <circle cx="${cx}" cy="${y+110}" r="3" fill="#20262c" stroke="#0a0d10"/>
   <circle cx="${x+92}" cy="${y+110}" r="8.5" fill="#2c333a" stroke="#0a0d10" stroke-width="1.2"/>
   <path d="M${x+92} ${y+104} a6 6 0 0 1 0 12" fill="#1b2026"/>
   <text class="iname" x="${cx}" y="${y+G5.h+13}">G5 HSI</text>`);
}

/* ---------- Vertical speed ---------- */
{
  const [cx,cy]=SIX.vsi, R=GAUGE_R;
  svgParts.push(shell(cx,cy,R,'VERT SPEED'));
  let t='';
  for(let v=-2000;v<=2000;v+=100){
    const a=mVSI(v), maj=v%500===0;
    const [x0,y0]=px(cx,cy,R-(maj?9:5),a), [x1,y1]=px(cx,cy,R-1,a);
    t+=`<line class="tick${maj?' maj':''}" x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}"/>`;
    // ±2000 is skipped: both ends converge at 3 o'clock and would overprint
    if(v%1000===0 && Math.abs(v)!==2000){const [lx,ly]=px(cx,cy,R-22,a);
      t+=`<text class="dlbl" x="${f(lx)}" y="${f(ly)}" style="font-size:8px">${Math.abs(v/1000)}</text>`;}
  }
  svgParts.push(t);
  svgParts.push(`<text class="dlbl" x="${cx}" y="${cy+17}" style="font-size:5.5px">FPM ×1000</text>`);
  svgParts.push(pointer('n_vsi',cx,cy,R-12,3));
  svgParts.push(`<circle class="hub" cx="${cx}" cy="${cy}" r="4"/>`);
}

/* ---------- Centre stack: speaker, GMA 340, GNS 430, nav/com, GTX ---------- */
{
  const x=STK.x, w=STK.w;
  const box=(y,h,fill='#141a1f')=>`<rect x="${x+6}" y="${y}" width="${w-12}" height="${h}" rx="4" fill="${fill}" stroke="#0a0d10" stroke-width="1.5"/>`;
  // The stack sits wholly inside the dash face (84–462), not above it.
  let g=`<g id="stackGrp"><rect class="plate" x="${x}" y="${STK.top}" width="${w}" height="360" rx="6"/>`;

  // speaker grille + service record card
  g+=`<text class="slbl tiny" x="${x+w/2}" y="${104}">SPEAKER</text>`;
  for(let i=0;i<3;i++) g+=`<line x1="${x+18}" y1="${110+i*5}" x2="${x+w-18}" y2="${110+i*5}" stroke="#2a3138" stroke-width="2"/>`;
  g+=box(128,24)+`<text class="slbl tiny" x="${x+w/2}" y="${143}">FREQ CARD</text>`;

  // GMA 340 audio panel
  g+=box(158,48);
  g+=`<text class="slbl tiny" x="${x+14}" y="${169}" style="text-anchor:start">GMA 340</text>`;
  ['COM1','COM2','NAV1','NAV2','DME','ADF'].forEach((n,i)=>{
    const bx=x+16+i*37;
    g+=`<rect x="${bx}" y="${173}" width="33" height="13" rx="2" fill="#20262c" stroke="#0a0d10"/>
        <text class="slbl tiny" x="${bx+16}" y="${182}">${n}</text>`;
  });
  g+=`<text class="slbl tiny" x="${x+16}" y="${200}" style="text-anchor:start">PILOT</text>
      <text class="slbl tiny" x="${x+w-16}" y="${200}" style="text-anchor:end">COPILOT</text>`;

  // GNS 430
  g+=box(212,100);
  g+=`<text class="slbl tiny" x="${x+w-14}" y="${223}" style="text-anchor:end">GNS 430</text>
      <rect x="${x+46}" y="${226}" width="${w-104}" height="58" rx="2" fill="#0a1420" stroke="#39424b"/>
      <path d="M${x+56} ${277} L${x+84} 247 L${x+112} 268 L${x+142} 239"
            fill="none" stroke="#7fd6a8" stroke-width="1.5" opacity=".75"/>
      <circle cx="${x+w/2}" cy="${273}" r="2.6" fill="var(--brand)"/>
      <circle cx="${x+26}" cy="${258}" r="11" fill="#20262c" stroke="#0a0d10"/>
      <circle cx="${x+w-26}" cy="${258}" r="11" fill="#20262c" stroke="#0a0d10"/>`;
  ['CDI','OBS','MSG','FPL','PROC'].forEach((n,i)=>{
    g+=`<text class="slbl tiny" x="${x+52+i*30}" y="${300}">${n}</text>`;
  });

  // second nav/com
  g+=box(318,42);
  g+=`<rect x="${x+46}" y="${324}" width="${w-104}" height="22" rx="2" fill="#0a1420" stroke="#39424b"/>
      <text class="slbl tiny" x="${x+14}" y="${330}" style="text-anchor:start">MON</text>
      <circle cx="${x+26}" cy="${346}" r="9" fill="#20262c" stroke="#0a0d10"/>
      <circle cx="${x+w-26}" cy="${342}" r="10" fill="#20262c" stroke="#0a0d10"/>`;

  // vent grille at the foot of the stack
  for(let i=0;i<5;i++) g+=`<line x1="${x+16}" y1="${424+i*6}" x2="${x+w-16}" y2="${424+i*6}" stroke="#20262c" stroke-width="3"/>`;
  g+=`</g>`;
  svgParts.push(g);
}

/* ---------- Transponder (GTX) — lives at the foot of the stack, live ---------- */
{
  const x=STK.x, w=STK.w, y=366;
  let g=`<g id="xpdrGrp">
    <rect x="${x+6}" y="${y}" width="${w-12}" height="52" rx="4" fill="#141a1f" stroke="#0a0d10" stroke-width="1.5"/>
    <rect x="${x+70}" y="${y+5}" width="${w-140}" height="18" rx="2" fill="#0a1420" stroke="#39424b"/>
    <text class="glass" x="${x+w/2}" y="${y+18}">1200</text>
    <text class="slbl tiny" x="${x+w-14}" y="${y+12}" style="text-anchor:end">GTX</text>`;
  // mode buttons in the rosette arrangement the real unit uses
  ['OFF','SBY','ON','ALT'].forEach((m,i)=>{
    const bx=x+14+i*56;
    g+=`<g class="ctl" data-xpdr="${m}">
      <rect class="hit" x="${bx}" y="${y+27}" width="52" height="20"/>
      <rect id="xp_${m}" x="${bx+1}" y="${y+28}" width="50" height="18" rx="4" fill="#20262c" stroke="#0a0d10"/>
      <text class="slbl" x="${bx+26}" y="${y+41}">${m}</text></g>`;
  });
  g+=`<rect class="hl" x="${x}" y="${y-6}" width="${w}" height="64" id="hl_xpdr"/></g>`;
  svgParts.push(g);
}

/* ---------- Right cluster: tachometer ---------- */
{
  const [cx,cy]=TACH, R=GAUGE_R;
  svgParts.push(shell(cx,cy,R,'RPM ×100'));
  svgParts.push(`<path class="arcG" stroke-width="4" d="${arc(cx,cy,R-5,mTACH(2200),mTACH(2700))}"/>`);
  svgParts.push(`<path class="arcR" stroke-width="4" d="${arc(cx,cy,R-5,mTACH(2700),mTACH(2800))}"/>`);
  svgParts.push(ticks(cx,cy,R,mTACH,500,3500,100,5,500,v=>v/100,R-18,8));
  // hour drum tucked inboard of the numerals
  svgParts.push(`<rect x="${cx-19}" y="${cy+9}" width="38" height="12" rx="2" fill="#05070a" stroke="#39424b"/>
                 <text id="hobbs_tach" class="dlbl" x="${cx}" y="${cy+15.5}" style="font-size:6px">0000.0</text>`);
  svgParts.push(pointer('n_tach',cx,cy,R-12,3.5));
  svgParts.push(`<circle class="hub" cx="${cx}" cy="${cy}" r="5"/>`);
}
/* ---------- Ammeter ---------- */
{
  const [cx,cy]=AMM, R=SMALL_R;
  svgParts.push(shell(cx,cy,R,'AMMETER'));
  // only the extremes and zero — this dial is 35px across
  svgParts.push(ticks(cx,cy,R,mAMM,-60,60,10,3,60,v=>Math.abs(v),R-13,7));
  svgParts.push(`<text class="dlbl" x="${cx-15}" y="${cy+13}" style="font-size:8px">−</text>
                 <text class="dlbl" x="${cx+15}" y="${cy+13}" style="font-size:8px">+</text>`);
  svgParts.push(pointer('n_amm',cx,cy,R-10,3));
  svgParts.push(`<circle class="hub" cx="${cx}" cy="${cy}" r="4"/>`);
}
/* ---------- Four square engine gauges: FUEL L · OIL PRESS · OIL TEMP · FUEL R ---------- */
const SQG = [
  {id:'fuelL', label:'FUEL LEFT',    lo:0,  hi:19,  g:[],        r:[0,2.5],  marks:['E','½','F']},
  {id:'oilP',  label:'OIL PRESSURE', lo:0,  hi:100, g:[60,90],   r:[0,25],   marks:['0','60','100']},
  {id:'oilT',  label:'OIL TEMP',     lo:60, hi:250, g:[100,245], r:[245,250],marks:['C','','H']},
  {id:'fuelR', label:'FUEL RIGHT',   lo:0,  hi:19,  g:[],        r:[0,2.5],  marks:['E','½','F']}
];
SQG.forEach((q,i)=>{
  const cx=SQ_X[i], cy=SQ_Y, w=SQ_W, h=SQ_H, x=cx-w/2, y=cy-h/2;
  /* Needle pivots low in the face and sweeps ±55° about vertical, so the
     scale sits where the needle actually points and the whole arc stays
     inside the bezel: at r=34 from (cx, cy+20) the extremes reach
     x = cx ±27.8 (box is ±40) and y = cy+0.5 .. cy-14 (box is ±28). */
  const m = mapper(q.lo,q.hi, -55, 55);
  const pcx = cx, pcy = cy+20, tr = 34, br = 30;
  let bands='';
  if(q.g.length) bands+=`<path class="arcG" stroke-width="3" d="${arc(pcx,pcy,br,m(q.g[0]),m(q.g[1]))}"/>`;
  if(q.r.length) bands+=`<path class="arcR" stroke-width="3" d="${arc(pcx,pcy,br,m(q.r[0]),m(q.r[1]))}"/>`;
  let tk='';
  for(let k=0;k<=4;k++){
    const v=q.lo+(q.hi-q.lo)*k/4, a=m(v);
    const [x0,y0]=px(pcx,pcy,tr-(k%2?4:7),a), [x1,y1]=px(pcx,pcy,tr,a);
    tk+=`<line class="tick${k%2?'':' maj'}" x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}"/>`;
  }
  svgParts.push(`
    <rect class="bezel" x="${x-4}" y="${y-4}" width="${w+8}" height="${h+8}" rx="5"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#05070a"/>
    ${bands}${tk}
    <text class="dlbl" x="${x+7}"   y="${cy-13}" style="font-size:6.5px">${q.marks[0]}</text>
    <text class="dlbl" x="${cx}"    y="${cy-19}" style="font-size:6.5px">${q.marks[1]}</text>
    <text class="dlbl" x="${x+w-7}" y="${cy-13}" style="font-size:6.5px">${q.marks[2]}</text>
    <g id="sq_${q.id}" style="transform-origin:${pcx}px ${pcy}px">
      <path class="needle" d="M${pcx} ${pcy-tr+2} L${pcx+2.2} ${pcy} L${pcx-2.2} ${pcy} Z"/>
    </g>
    <circle class="hub" cx="${pcx}" cy="${pcy}" r="2.6"/>
    <text class="iname" x="${cx}" y="${y+h+15}">${q.label}</text>`);
  q._m = m;
});

/* ---------- 28V payload power + Hobbs hour meter ---------- */
// Hobbs hour meter, centred under the engine gauge cluster now that the
// 28V payload switch that used to sit beside it has been removed.
svgParts.push(`
  <circle class="bezel" cx="1130" cy="368" r="34"/>
  <circle cx="1130" cy="368" r="28" fill="#141a1f"/>
  <text class="slbl tiny" x="1130" y="358">HOURS</text>
  <rect x="1106" y="362" width="48" height="15" rx="2" fill="#05070a" stroke="#39424b"/>
  <text id="hobbs" class="dlbl sm" x="1130" y="370">0000.0</text>
  <text class="slbl tiny" x="1130" y="388">HOBBS</text>`);

/* ==========================================================================
   SUB-PANEL SHELF
   ========================================================================== */

/* -- toggle switch factory -- */
function toggle(id,x,y,label,sub='',above=false){
  // `above` puts the caption over the switch, for switches sitting directly
  // on top of the breaker row whose rotated labels reach upward.
  return `<g class="ctl" data-ctl="${id}" id="ctl_${id}">
    <rect class="hit" x="${x-17}" y="${y-26}" width="34" height="58"/>
    <rect class="sw-body" x="${x-7}" y="${y-4}" width="14" height="22" rx="3"/>
    <g id="lev_${id}"><rect class="sw-lever" x="${x-4}" y="${y-17}" width="8" height="16" rx="4"/></g>
    <text class="slbl tiny" x="${x}" y="${above?y-24:y+29}">${label}</text>
    ${sub?`<text class="slbl tiny" x="${x}" y="${above?y-15:y+38}">${sub}</text>`:''}
    <rect class="hl" x="${x-19}" y="${y-28}" width="38" height="70" id="hl_${id}"/>
  </g>`;
}
/* -- pull knob factory (BEACON / NAV / LAND are pull-on) -- */
function pullKnob(id,x,y,label){
  return `<g class="ctl" data-ctl="${id}" id="ctl_${id}">
    <rect class="hit" x="${x-20}" y="${y-24}" width="40" height="56"/>
    <text class="slbl tiny" x="${x}" y="${y-16}">${label}</text>
    <rect x="${x-2}" y="${y-8}" width="4" height="18" fill="#11161b"/>
    <g id="pk_${id}"><circle class="lit" cx="${x}" cy="${y}" r="9" fill="#2c333a" stroke="#0a0d10" stroke-width="1.5"/></g>
    <rect class="hl" x="${x-22}" y="${y-26}" width="44" height="62" id="hl_${id}"/>
  </g>`;
}

/* Master — split red rocker, BAT | ALT — far left of the sub-panel,
   directly above the primer. */
{
  const mx=104, my=TIER_A-6;                       // centre of the rocker pair
  svgParts.push(`<g id="masterGrp">
  <text class="slbl tiny" x="${mx}" y="${my-14}">MASTER</text>
  <rect x="${mx-30}" y="${my-8}" width="60" height="32" rx="4" fill="#1b2026" stroke="#0a0d10" stroke-width="1.5"/>
  <g class="ctl" data-ctl="bat" id="ctl_bat">
    <rect class="hit" x="${mx-30}" y="${my-10}" width="30" height="36"/>
    <g id="lev_bat"><rect class="lit" x="${mx-25}" y="${my-4}" width="20" height="11" rx="2" fill="#c62828" stroke="#0a0d10"/></g>
    <text class="slbl tiny" x="${mx-15}" y="${my+34}">BAT</text>
  </g>
  <g class="ctl" data-ctl="alt" id="ctl_alt">
    <rect class="hit" x="${mx}" y="${my-10}" width="30" height="36"/>
    <g id="lev_alt"><rect class="lit" x="${mx+5}" y="${my-4}" width="20" height="11" rx="2" fill="#c62828" stroke="#0a0d10"/></g>
    <text class="slbl tiny" x="${mx+15}" y="${my+34}">ALT</text>
  </g>
  <rect class="hl" x="${mx-34}" y="${my-24}" width="68" height="66" id="hl_master"/>
</g>`);

  /* Primer — pull-and-push plunger, immediately below the master */
  const py=TIER_B+18;
  svgParts.push(`<g class="ctl" data-ctl="primer" id="ctl_primer">
    <rect class="hit" x="${mx-22}" y="${py-16}" width="44" height="42"/>
    <rect x="${mx-2}" y="${py-10}" width="4" height="12" fill="#11161b"/>
    <g id="pk_primer"><circle class="lit" cx="${mx}" cy="${py}" r="8.5" fill="#2c333a" stroke="#0a0d10" stroke-width="1.5"/></g>
    <text class="slbl tiny" x="${mx}" y="${py+20}">PRIMER</text>
    <text class="pos on" id="primer_n" x="${mx+20}" y="${py+3}"></text>
    <rect class="hl" x="${mx-24}" y="${py-18}" width="48" height="48" id="hl_primer"/></g>`);
}

/* Ignition — rotary, click a position */
{
  const cx=196, cy=TIER_A+16, r=20;
  const POS=[['OFF',-90],['R',-45],['L',0],['BOTH',45],['START',90]];
  let g=`<g id="ignGrp"><circle class="bezel" cx="${cx}" cy="${cy}" r="${r+6}"/>
         <circle class="knob" cx="${cx}" cy="${cy}" r="${r}" fill="#39424b"/>
         <g id="ign_needle" style="transform-origin:${cx}px ${cy}px">
           <rect x="${cx-2.5}" y="${cy-r+2}" width="5" height="${r-1}" rx="2.5" fill="#ffcc33"/></g>
         <circle cx="${cx}" cy="${cy}" r="4" fill="#20262c"/>
         <circle class="ctl" data-ign-step="1" cx="${cx}" cy="${cy}" r="${r}" fill="transparent"/>`;
  POS.forEach(([n,a])=>{
    const [lx,ly]=px(cx,cy,r+15,a);
    g+=`<g class="ctl" data-ign="${n}">
      <circle class="hit" cx="${f(lx)}" cy="${f(ly)}" r="14"/>
      <text class="pos" id="ipos_${n}" x="${f(lx)}" y="${f(ly)+3}">${n}</text></g>`;
  });
  // caption above the knob — below it would land in the breaker row
  g+=`<text class="slbl tiny" x="${cx}" y="${cy-r-24}">IGNITION</text>
      <rect class="hl" x="${cx-44}" y="${cy-50}" width="88" height="92" id="hl_mags"/></g>`;
  svgParts.push(g);
}

/* Avionics master */
svgParts.push(toggle('avionics',330,TIER_A+4,'AVIONICS','',true));

/* Light pulls: NAV · BEACON · LAND */
svgParts.push(pullKnob('nav',   430,TIER_A+6,'NAV LTS'));
svgParts.push(pullKnob('beacon',490,TIER_A+6,'BEACON'));
svgParts.push(pullKnob('land',  550,TIER_A+6,'LAND LTS'));

/* Breaker / switch row — mostly inert detail, STROBE and PITOT HT are live.
   Spread across TIER_B at 35px; at 25px the rotated captions collided with
   each other and with the throttle quadrant's placards. */
{
  const names=['AUDIO','GPS','COM1','COM2','XPDR','STROBE','BCN','FLAP','PITOT','INT LT','LAND LT','INST','GEN'];
  const amps =['5','5','10','10','5','','10','15','','10','20','10','60'];
  const x0=258, dx=27;
  let g='<g id="breakerRow">';
  names.forEach((n,i)=>{
    const bx=x0+i*dx;
    if(n==='STROBE' || n==='PITOT') return;   // drawn as live toggles below
    g+=`<circle cx="${bx}" cy="${TIER_B+12}" r="7" fill="#20262c" stroke="#5a646e" stroke-width="1.2"/>
        <text class="pos" x="${bx}" y="${TIER_B+15}">${amps[i]}</text>
        <text class="slbl tiny" x="${bx}" y="${TIER_B+2}" style="text-anchor:start;font-size:5px"
              transform="rotate(-90 ${bx} ${TIER_B+2})">${n}</text>`;
  });
  g+='</g>';
  svgParts.push(g);
  svgParts.push(toggle('strobe', x0+5*dx, TIER_B+8,'STROBE'));
  svgParts.push(toggle('pitot',  x0+8*dx, TIER_B+8,'PITOT','HEAT'));
}

/* Throttle quadrant: CARB HEAT · THROTTLE · MIXTURE, plus cabin heat/air */
function plunger(id,x,label,colour,sub){
  const y=PLUNGER.y, t=PLUNGER.travel;
  return `<g class="ctl" data-plunger="${id}" id="ctl_${id}">
    <text class="slbl" x="${x}" y="${y-16}">${label}</text>
    <rect x="${x-3}" y="${y-6}" width="6" height="${t+16}" rx="3" fill="#11161b" stroke="#0a0d10"/>
    <rect class="hit" x="${x-24}" y="${y-14}" width="48" height="${t+40}"/>
    <g id="kn_${id}">
      <rect x="${x-16}" y="${y-8}" width="32" height="17" rx="6" fill="${colour}" stroke="#0a0d10" stroke-width="1.5"/>
    </g>
    <text class="slbl tiny" x="${x}" y="${y+t+28}">${sub}</text>
    <rect class="hl" x="${x-26}" y="${y-30}" width="52" height="${t+64}" id="hl_${id}"/>
  </g>`;
}
svgParts.push(plunger('carbheat',616,'CARB HT','#e0e4e8','PULL ON'));
svgParts.push(plunger('throttle',700,'THROTTLE','#20262c','PUSH OPEN'));
svgParts.push(plunger('mixture', 784,'MIXTURE','#c62828','PULL LEAN'));
svgParts.push(`
  <text class="slbl tiny" x="856" y="${PLUNGER.y-16}">CABIN HT</text>
  <circle cx="856" cy="${PLUNGER.y+4}" r="8" fill="#2c333a" stroke="#0a0d10" stroke-width="1.5"/>
  <text class="slbl tiny" x="906" y="${PLUNGER.y-16}">CABIN AIR</text>
  <circle cx="906" cy="${PLUNGER.y+4}" r="8" fill="#2c333a" stroke="#0a0d10" stroke-width="1.5"/>`);

/* Wing flap lever — lower right of the panel, four detents */
{
  const x=1010, y0=PLUNGER.y-14, step=26;
  let g=`<g id="flapGrp"><text class="slbl" x="${x+18}" y="${y0-14}">WING FLAPS</text>
         <rect x="${x-3}" y="${y0}" width="6" height="${step*3+14}" rx="3" fill="#11161b" stroke="#0a0d10"/>`;
  [0,10,20,30].forEach((d,i)=>{
    g+=`<g class="ctl" data-flap="${d}">
      <rect class="hit" x="${x-18}" y="${y0+i*step-5}" width="62" height="24"/>
      <line x1="${x+7}" y1="${y0+i*step+7}" x2="${x+15}" y2="${y0+i*step+7}" class="tick"/>
      <text class="pos" id="fpos_${d}" x="${x+30}" y="${y0+i*step+10}">${d}°</text></g>`;
  });
  g+=`<g id="flapKnob"><rect x="${x-11}" y="${y0-2}" width="22" height="18" rx="5" fill="#39424b" stroke="#0a0d10" stroke-width="1.5"/></g>
      <rect class="hl" x="${x-22}" y="${y0-24}" width="74" height="${step*3+50}" id="hl_flaps"/></g>`;
  svgParts.push(g);
}

/* ==========================================================================
   PEDESTAL — trim wheel on the left face, fuel selector on the floor
   ========================================================================== */
{
  const [tx,ty]=TRIM;
  let g=`<g id="trimGrp">
    <text class="slbl tiny" x="${tx+4}" y="${ty-58}">NOSE DOWN</text>
    <rect x="${tx-13}" y="${ty-50}" width="26" height="100" rx="13" fill="#11161b" stroke="#0a0d10" stroke-width="1.5"/>
    <g id="trim_wheel" style="transform-origin:${tx}px ${ty}px">`;
  for(let i=0;i<14;i++){
    const yy = ty-46 + i*7;
    g+=`<line x1="${tx-11}" y1="${yy}" x2="${tx+11}" y2="${yy}" stroke="#39424b" stroke-width="1.6"/>`;
  }
  g+=`</g>
    <g class="ctl" data-plunger="trim" id="ctl_trim">
      <rect class="hit" x="${tx-20}" y="${ty-54}" width="40" height="108"/>
      <g id="kn_trim"><rect x="${tx-16}" y="${ty-4}" width="32" height="8" rx="3" fill="#ffcc33" opacity=".85"/></g>
    </g>
    <text class="slbl tiny" x="${tx+32}" y="${ty+3}">TAKE OFF</text>
    <line x1="${tx+15}" y1="${ty}" x2="${tx+24}" y2="${ty}" class="tick maj"/>
    <text class="slbl tiny" x="${tx+4}" y="${ty+64}">NOSE UP</text>
    <text class="iname" x="${tx}" y="${ty+80}">ELEVATOR TRIM</text>
    <rect class="hl" x="${tx-24}" y="${ty-70}" width="48" height="150" id="hl_trim"/></g>`;
  svgParts.push(g);
}
/* vent grille on the pedestal face — kept right of the trim placards */
for(let i=0;i<9;i++)
  svgParts.push(`<line x1="${PED.x+96}" y1="${PED.y+92+i*8}" x2="${PED.x+PED.w-16}" y2="${PED.y+92+i*8}" stroke="#20262c" stroke-width="4"/>`);

/* Fuel selector valve — on the floor between the seats */
{
  const [cx,cy]=FUELSEL, r=42;
  const POS=[['LEFT',-90],['BOTH',0],['RIGHT',90],['OFF',180]];
  let g=`<g id="fuelGrp">
    <rect x="${cx-70}" y="${cy-64}" width="140" height="140" rx="6" fill="#161b20" stroke="#0a0d10" stroke-width="2"/>
    <text class="slbl tiny" x="${cx}" y="${cy-52}">FUEL SELECTOR</text>
    <text class="slbl tiny" x="${cx}" y="${cy-43}">TAKEOFF &amp; LANDING — BOTH</text>
    <circle class="bezel" cx="${cx}" cy="${cy}" r="${r+7}"/>
    <circle class="knob" cx="${cx}" cy="${cy}" r="${r}" fill="#8a7233"/>`;
  for(let i=0;i<40;i++){
    const a=i*9, [x0,y0]=px(cx,cy,r-9,a), [x1,y1]=px(cx,cy,r-1,a);
    g+=`<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="#6b5a28" stroke-width="1.4"/>`;
  }
  g+=`<g id="fuel_needle" style="transform-origin:${cx}px ${cy}px">
        <rect x="${cx-4}" y="${cy-r+3}" width="8" height="${r}" rx="4" fill="#e9eff5"/></g>
      <circle cx="${cx}" cy="${cy}" r="7" fill="#3a3218"/>
      <circle class="ctl" data-fuel-step="1" cx="${cx}" cy="${cy}" r="${r}" fill="transparent"/>`;
  POS.forEach(([n,a])=>{
    const [lx,ly]=px(cx,cy,r+22,a);
    g+=`<g class="ctl" data-fuel="${n}">
      <circle class="hit" cx="${f(lx)}" cy="${f(ly)}" r="18"/>
      <text class="pos" id="fupos_${n}" x="${f(lx)}" y="${f(ly)+3}">${n}</text></g>`;
  });
  g+=`<rect class="hl" x="${cx-72}" y="${cy-66}" width="144" height="144" id="hl_fuel"/></g>`;
  svgParts.push(g);
}

P.innerHTML = svgParts.join('\n');
