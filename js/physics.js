"use strict";
/* Cessna 172 SIM - N46519
   Engine, electrical and flight model. */

/* ==========================================================================
   5. PHYSICS  — a deliberately simple model.
   Enough fidelity that the flows behave correctly; not a flight simulator.
   ========================================================================== */
let last=performance.now();
function physics(dt){
  const elec = S.bat;

  /* --- starting --- */
  if(S.mags==='START' && elec){
    S.starterT += dt;
    const cranking = 250 + Math.sin(performance.now()/60)*30;
    if(!S.running) S.rpm += (cranking - S.rpm)*Math.min(1,dt*3);
    const canCatch = S.mixture>0.55 && S.fuel!=='OFF' && S.throttle<0.45 && fuelLeft()>0.2;
    if(S.starterT>1.1 && canCatch){ S.running=true; setMags('BOTH'); }
  }else if(S.mags!=='START'){ S.starterT=0; }

  /* --- running / shutdown --- */
  if(S.running){
    if(S.mixture<0.12 || S.mags==='OFF' || fuelLeft()<=0) S.running=false;
  }

  /* --- RPM --- */
  let target;
  if(S.running){
    target = 600 + S.throttle*1900;
    if(S.carb) target -= 75;                              // carb heat = unfiltered warm air
    if(S.mags==='L'||S.mags==='R') target -= MAG_DROP[S.mags];
    // over-lean mixture costs power; correct mixture is ~ full rich at sea level
    if(S.mixture<0.45) target -= (0.45-S.mixture)*2200;
    target = Math.max(450,target);
  }else if(S.mags==='START' && elec){
    target = S.rpm;
  }else target = 0;
  S.rpm += (target-S.rpm)*Math.min(1,dt*(S.running?2.2:1.4));
  if(S.rpm<25) S.rpm=0;

  /* --- engine indications --- */
  const oilTgt = S.running ? 55 + (S.rpm/2500)*28 : 0;
  S.oilP += (oilTgt-S.oilP)*Math.min(1,dt*1.2);
  const tTgt = S.running ? 175 + (S.rpm/2500)*35 : 55;
  S.oilT += (tTgt-S.oilT)*Math.min(1,dt/45);              // oil warms slowly
  const chtTgt = S.running ? 250 + (S.rpm/2500)*110 + (1-S.mixture)*70 : 60;
  S.cht += (chtTgt-S.cht)*Math.min(1,dt/25);
  const vTgt = S.running ? 4.6 + (S.rpm/2500)*0.55 : 0;
  S.vac += (vTgt-S.vac)*Math.min(1,dt*1.5);
  S.egt = S.running ? 1150 + (1-S.mixture)*280 : 0;

  /* --- electrics --- */
  let aTgt=0;
  if(S.running && S.alt) aTgt = 12 + (S.bat?8:0);
  else if(S.bat) aTgt = -(8 + (S.avionics?10:0) + (S.land?12:0) + (S.pitot?9:0) + (S.taxi?7:0));
  if(S.mags==='START' && S.bat && !S.running) aTgt = -55;
  S.amps += (aTgt-S.amps)*Math.min(1,dt*2.5);

  /* --- fuel burn --- */
  if(S.running){
    const g = fuelFlow()*dt/3600;
    if(S.fuel==='BOTH'){ S.fuelL=Math.max(0,S.fuelL-g/2); S.fuelR=Math.max(0,S.fuelR-g/2); }
    if(S.fuel==='LEFT')  S.fuelL=Math.max(0,S.fuelL-g);
    if(S.fuel==='RIGHT') S.fuelR=Math.max(0,S.fuelR-g);
    S.hobbs += dt/3600;
  }

  /* --- flight --- */
  if(S.airborne){
    const drag = S.flaps*0.42;
    const iasTgt = Math.max(45, 52 + (S.rpm-900)/1500*72 - drag);
    S.ias += (iasTgt-S.ias)*Math.min(1,dt*0.35);
    const vsTgt = Math.max(-1600,Math.min(1400,(S.rpm-2150)*0.85 - S.flaps*9));
    S.vsi += (vsTgt-S.vsi)*Math.min(1,dt*0.5);
    S.altFt = Math.max(0, S.altFt + S.vsi*dt/60);
  }else{
    S.ias += ((S.rpm>1500? Math.min(45,(S.rpm-1500)/40) : 0)-S.ias)*Math.min(1,dt*0.8);
    S.vsi += (0-S.vsi)*Math.min(1,dt*2);
  }
}
/* Each magneto gets its own drop, re-rolled every time the page loads, so the
   "150 max / 50 diff" limit is something you actually have to read and compare
   rather than a number you memorise. Occasionally one will be out of limits. */
const MAG_DROP = {
  L: 80 + Math.round(Math.random()*70),
  R: 80 + Math.round(Math.random()*70)
};

const fuelLeft = ()=> S.fuel==='OFF' ? 0
  : S.fuel==='LEFT' ? S.fuelL : S.fuel==='RIGHT' ? S.fuelR : S.fuelL+S.fuelR;

/* Fuel flow in US gal/hr — shared by the burn model and the JPI readout. */
const fuelFlow = ()=> S.running ? (2.2 + (S.rpm/2500)*7.5) * (0.75+S.mixture*0.35) : 0;

/* Manifold pressure: ambient falls ~1" per 1,000 ft, throttle plate does
   the rest. The O-320 is carburetted and normally aspirated. */
const manifold = ()=>{
  const ambient = 29.92 - S.altFt/1000;
  return S.running ? ambient*(0.34+0.66*S.throttle) : ambient;
};
