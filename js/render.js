"use strict";
/* Cessna 172 SIM - N46519
   Draws state onto the panel. Runs on every input and every frame. */

/* ==========================================================================
   6. RENDER
   ========================================================================== */
const rot=(id,deg)=>{const e=document.getElementById(id); if(e) e.style.transform=`rotate(${deg}deg)`;};
const txt=(id,s)=>{const e=document.getElementById(id); if(e) e.textContent=s;};

function render(){
  const lit = S.bat || S.running;      // panel electrics awake?

  /* --- round instruments --- */
  rot('n_asi',  mASI(S.ias<40?40:S.ias));
  rot('n_tach', mTACH(Math.max(500,S.rpm)));
  rot('n_amm',  mAMM(S.amps));
  rot('n_vsi',  mVSI(lit?S.vsi:0));
  rot('n_alt_h',  (S.altFt%1000)/1000*360);
  rot('n_alt_th', (S.altFt%10000)/10000*360);
  rot('tc_plane', S.bank*0.9);
  const ball=document.getElementById('tc_ball');
  if(ball) ball.setAttribute('cx', SIX.tc[0] + Math.max(-14,Math.min(14,S.bank*0.32)));

  /* --- G5 attitude: horizon, roll pointer, scrolling tapes --- */
  const h=document.getElementById('g5a_horizon');
  if(h){
    const [cx,cy]=SIX.adi;
    h.style.transformOrigin=`${cx}px ${cy}px`;
    h.style.transform = lit ? `rotate(${-S.bank}deg) translateY(${S.pitch*1.7}px)` : 'translateY(200px)';
  }
  rot('g5a_roll', -S.bank);
  txt('g5a_ias', lit?Math.round(S.ias):'---');
  txt('g5a_alt', lit?Math.round(S.altFt):'-----');
  txt('g5a_hdg', lit?String(Math.round(S.hdg)).padStart(3,'0')+'°':'---°');
  txt('g5a_gs',  'GS '+(lit?Math.round(S.ias):0));
  txt('g5a_baro', S.qnh.toFixed(2));
  // tapes: label i carries base + (4-i)*step, offset by the fractional part
  const tape=(pre,val,step,pxs,hcy,fmt)=>{
    const b=Math.floor(val/step)*step, frac=(val-b)/step;
    for(let i=0;i<9;i++){
      const e=document.getElementById(pre+i); if(!e) continue;
      const v=b+(4-i)*step;
      e.textContent = (lit && v>=0) ? fmt(v) : '';
      e.setAttribute('y', hcy + (i-4)*pxs + frac*pxs + 2);
    }
  };
  const adiY = SIX.adi[1]-G5.h/2+13+45;                 // horizon centre line
  tape('g5a_sp', Math.max(0,S.ias), SP_STEP, SP_PX, adiY, v=>v);
  tape('g5a_al', Math.max(0,S.altFt), AL_STEP, AL_PX, adiY, v=>v);

  /* --- G5 HSI --- */
  rot('g5h_card', -S.hdg);
  rot('g5h_crs', 360-S.hdg);                        // course 360 held for reference
  txt('g5h_hdg', lit?String(Math.round(S.hdg)).padStart(3,'0')+'°':'---°');
  txt('g5h_trk', lit?String(Math.round(S.hdg)).padStart(3,'0')+'°':'---°');

  /* --- JPI EDM --- */
  const map=manifold(), ff=fuelFlow(), rem=S.fuelL+S.fuelR;
  rot('jpi_mapptr', mJMAP(map));
  rot('jpi_rpmptr', mJRPM(Math.max(500,S.rpm)));
  txt('jpi_map', S.running?map.toFixed(1):'--');
  txt('jpi_rpm', S.running?String(Math.round(S.rpm)):'----');
  for(const b of JPI_BARS){
    const v=b.get();
    txt('jpi_'+b.id, S.running||b.id==='rem' ? b.fmt(v) : '--');
    const el=document.getElementById('jpi_'+b.id+'bar');
    if(el) el.setAttribute('width', 26*Math.max(0,Math.min(1,(v-b.lo)/(b.hi-b.lo))));
  }
  txt('jpi_hm', ff>0.2 ? (()=>{const t=rem/ff; return `${Math.floor(t)}:${String(Math.round((t%1)*60)).padStart(2,'0')}`;})() : '--:--');
  const jbase = SIX.aux[1]-JPI.h/2+7+86, jmax = 42;
  for(let i=0;i<4;i++){
    const eg = S.running ? S.egt+CYL_EGT[i] : 0;
    const frac=Math.max(0,Math.min(1,(eg-200)/(1650-200)));
    const bar=document.getElementById('jpi_b'+i), cap=document.getElementById('jpi_k'+i);
    if(bar){ bar.setAttribute('y', jbase-frac*jmax); bar.setAttribute('height', frac*jmax); }
    if(cap){ cap.setAttribute('y', jbase-frac*jmax-2.5); }
  }
  txt('jpi_egt', S.running?String(Math.round(S.egt)):'----');
  txt('jpi_cht', S.running?String(Math.round(S.cht)):'---');

  /* --- four square engine gauges --- */
  const sqv={fuelL:S.fuelL, oilP:S.oilP, oilT:S.oilT, fuelR:S.fuelR};
  for(const q of SQG) rot('sq_'+q.id, q._m(sqv[q.id]));

  txt('hobbs', S.hobbs.toFixed(1));
  txt('hobbs_tach', S.hobbs.toFixed(1));
  txt('kollsman', S.qnh.toFixed(2));

  /* --- rotary positions --- */
  rot('ign_needle', {OFF:-90,R:-45,L:0,BOTH:45,START:90}[S.mags]);
  rot('fuel_needle', {LEFT:-90,BOTH:0,RIGHT:90,OFF:180}[S.fuel]);
  ['OFF','R','L','BOTH','START'].forEach(n=>{
    const e=document.getElementById('ipos_'+n); if(e) e.classList.toggle('on', S.mags===n);});
  ['LEFT','BOTH','RIGHT','OFF'].forEach(n=>{
    const e=document.getElementById('fupos_'+n); if(e) e.classList.toggle('on', S.fuel===n);});
  [0,10,20,30].forEach(d=>{
    const e=document.getElementById('fpos_'+d); if(e) e.classList.toggle('on', S.flaps===d);});
  ['OFF','SBY','ON','ALT'].forEach(m=>{
    const e=document.getElementById('xp_'+m); if(e) e.setAttribute('fill', S.xpdr===m?'#ffb020':'#20262c');});

  /* --- toggle switches (lever slides down when off) --- */
  for(const k of ['avionics','strobe','pitot']){
    const g=document.getElementById('ctl_'+k); if(!g) continue;
    g.classList.toggle('sw-on', !!S[k]);
    const lev=document.getElementById('lev_'+k);
    if(lev) lev.style.transform = S[k] ? 'translateY(0)' : 'translateY(19px)';
  }
  /* --- master rocker halves --- */
  for(const k of ['bat','alt']){
    const g=document.getElementById('ctl_'+k); if(!g) continue;
    g.classList.toggle('sw-on', !!S[k]);
    const lev=document.getElementById('lev_'+k);
    if(lev) lev.style.transform = S[k] ? 'translateY(0)' : 'translateY(13px)';
  }
  txt('primer_n', S.primer ? '×'+S.primer : '');
  const pg=document.getElementById('ctl_primer');
  if(pg) pg.classList.toggle('sw-on', S.primer>0);

  /* --- pull knobs travel out when on --- */
  for(const k of ['nav','beacon','land']){
    const g=document.getElementById('ctl_'+k); if(!g) continue;
    g.classList.toggle('sw-on', !!S[k]);
    const kn=document.getElementById('pk_'+k);
    if(kn) kn.style.transform = S[k] ? 'translateY(11px)' : 'translateY(0)';
  }

  /* --- push-pull plungers: pushed in (up) = open / rich --- */
  const setPlunger=(id,v)=>{
    const e=document.getElementById('kn_'+id);
    if(e) e.style.transform=`translateY(${(1-v)*PLUNGER.travel}px)`;
  };
  setPlunger('throttle', S.throttle);
  setPlunger('mixture',  S.mixture);
  setPlunger('carbheat', S.carb?0:1);          // carb heat ON = pulled out

  /* --- trim index and flap lever --- */
  const tk=document.getElementById('kn_trim');
  if(tk) tk.style.transform=`translateY(${(0.5-S.trim)*88}px)`;
  const fk=document.getElementById('flapKnob');
  if(fk) fk.style.transform=`translateY(${[0,10,20,30].indexOf(S.flaps)*26}px)`;

  /* --- readout strip --- */
  document.getElementById('strip').innerHTML = [
    `<span class="chip ${S.running?'live':'dead'}">ENG <b>${S.running?'RUN':'OFF'}</b></span>`,
    `<span class="chip">RPM <b>${Math.round(S.rpm/10)*10}</b></span>`,
    `<span class="chip">IAS <b>${Math.round(S.ias)}</b> mph</span>`,
    `<span class="chip">ALT <b>${Math.round(S.altFt/10)*10}</b> ft</span>`,
    `<span class="chip">OIL <b>${Math.round(S.oilP)}</b> psi</span>`,
    `<span class="chip">MIX <b>${Math.round(S.mixture*100)}%</b></span>`,
    `<span class="chip">THR <b>${Math.round(S.throttle*100)}%</b></span>`,
    `<span class="chip">FLAP <b>${S.flaps}°</b></span>`,
    `<span class="chip">FUEL <b>${S.fuel}</b></span>`,
    `<span class="chip">MAG <b>${S.mags}</b></span>`,
    S.carb?`<span class="chip live">CARB HT <b>ON</b></span>`:''
  ].join('');
}
