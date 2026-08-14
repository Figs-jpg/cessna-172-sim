"use strict";
/* Cessna 172 SIM - N46519
   Aircraft state - the one object every other file reads and writes. */

/* ==========================================================================
   1. AIRCRAFT STATE
   One plain object. Everything on the panel reads from it, everything you
   click writes to it, and the checklist inspects it to auto-tick items.
   ========================================================================== */
const S = {
  bat:false, alt:false, avionics:false,
  mags:'OFF',                 // OFF | R | L | BOTH | START
  throttle:0,                 // 0..1  (0 = closed)
  mixture:0,                  // 0..1  (0 = idle cutoff, 1 = full rich)
  carb:false,                 // carb heat
  fuel:'OFF',                 // OFF | LEFT | BOTH | RIGHT
  flaps:0,                    // 0 | 10 | 20 | 30
  brake:false,                // parking brake
  beacon:false, land:false, taxi:false, strobe:false, nav:false, pitot:false,
  xpdr:'OFF',                 // OFF | SBY | ON | ALT
  trim:0.5,                   // 0..1, .5 = takeoff
  primer:0,                   // pump strokes: 1 hot, 2 cold

  running:false, starterT:0,
  rpm:0, oilP:0, oilT:60, vac:0, amps:0, cht:60, egt:0,
  fuelL:19, fuelR:19,         // usable gallons per side
  hobbs:2417.3,

  airborne:false, ias:0, altFt:1200, vsi:0, hdg:270, pitch:0, bank:0,
  magSeenL:false, magSeenR:false,   // for the run-up mag check
  qnh:29.92
};
const COLD_DARK = JSON.parse(JSON.stringify(S));

function setMags(m){
  S.mags = m;
  if(m==='L') S.magSeenL = true;
  if(m==='R') S.magSeenR = true;
  if(m==='START') S.starterT = 0;
  if(m==='OFF'){ S.running=false; }
}
