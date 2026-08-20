"use strict";
/* Cessna 172 SIM - N46519
   Checklist flows, transcribed from the instructor's Cessna 172 cards:
   "Pre-Flight Check List" and "Cessna 172 Normal / Emergency Checklists".

   `test`  - auto-ticks when the panel reaches this state.
   `hl`    - which control to pulse as a hint (Study mode only).
   Items with neither are spoken calls: advance with Space or by clicking.
   ========================================================================== */
const near=(v,t,tol)=>Math.abs(v-t)<=tol;

/* Handy shared predicates */
const lightsOff = s=>!s.land && !s.strobe && !s.nav;
const anyLight  = s=>s.land || s.strobe || s.nav || s.beacon;

const FLOWS = [

/* ============================ PRE-FLIGHT ============================= */
{id:'pre-inside', name:'Preflight · Inside', scene:{},
 items:[
  ['HOBBS & TACH','RECORD TIMES'],
  ['MASTER','ON', s=>s.bat,'master'],
  ['LIGHTS','ON & CHECK', s=>anyLight(s),'beacon'],
  ['FUEL QUANTITY','CHECK GAUGES AND JPI'],
  ['LIGHTS','OFF', s=>!anyLight(s),'beacon'],
  ['MASTER','OFF', s=>!s.bat,'master']
]},

{id:'pre-walk', name:'Preflight · Walk-around',
 // Nothing here touches the panel. Use Recall mode to drill it from memory.
 // Flaps stay down so the flap checks have something to look at.
 scene:{flaps:30},
 items:[
  // --- left side ---
  ['STATIC PORT','CLEAR'],
  ['OAT PROBE','CHECK'],
  ['AIR INLETS','CLEAR'],
  ['STALL HORN','CLEAR'],
  ['FUEL DRAIN','CLEAR'],
  ['LEADING EDGE','CHECK'],
  ['LANDING & TAXI LIGHTS','CHECK'],
  ['LEFT WING TIP','CHECK'],
  ['NAV & STROBE LIGHTS','CHECK'],
  ['LEFT AILERON','CHECK FREE & CLEAR'],
  ['LEFT FLAP','CHECK'],
  ['LEFT MAIN GEAR & BRAKES','CHECK'],
  ['BAGGAGE DOOR','CLOSED & LOCKED'],
  ['FUSELAGE','CHECK'],
  ['FUEL CAPS','CHECK'],
  ['ANTENNAS','CHECK'],
  ['LEFT ELEVATOR','CHECK FREE & CLEAR'],
  ['RUDDER','CHECK FREE & CLEAR'],
  // --- right side ---
  ['RIGHT ELEVATOR','CHECK FREE & CLEAR'],
  ['FUSELAGE','CHECK'],
  ['RIGHT LANDING GEAR & BRAKES','CHECK'],
  ['RIGHT FLAP','CHECK'],
  ['RIGHT AILERON','CHECK'],
  ['RIGHT WING TIP','CHECK'],
  ['LEADING EDGE','CHECK'],
  ['AIR INLETS','CLEAR'],
  ['OIL QUANTITY','CHECK'],
  ['SUMP FUEL','DRAIN'],
  // --- nose ---
  ['AIR INTAKES','CLEAR'],
  ['STARTER BELT','TAUT'],
  ['PROP','CLEAN & CLEAR'],
  ['SPINNER','CLEAN & CLEAR'],
  ['AIR FILTER','CLEAN & CLEAR'],
  ['NOSE GEAR','CHECK']
]},

/* ============================== NORMAL =============================== */
{id:'before-start', name:'Before Start',
 scene:{},
 items:[
  ['GUSTLOCKS, TOWBARS, CHOCKS','REMOVED'],
  ['I-PADS, ADSB SENTRY','ONBOARD, CHARGED'],
  ['DOORS','CLOSED, LATCHED'],
  ['PASSENGER BRIEFING','COMPLETE'],
  ['FUEL SELECTOR','BOTH', s=>s.fuel==='BOTH','fuel'],
  ['MIXTURE','RICH', s=>s.mixture>0.93,'mixture'],
  ['THROTTLE','CLOSED', s=>s.throttle<0.04,'throttle'],
  ['CARB HEAT','OFF', s=>!s.carb,'carbheat'],
  ['CIRCUIT BREAKERS','ALL IN'],
  ['ELECTRICAL SWITCHES','OFF, BEACON ON', s=>s.beacon&&lightsOff(s),'beacon'],
  ['AVIONICS MASTER','OFF', s=>!s.avionics,'avionics']
]},

{id:'engine-start', name:'Engine Start',
 scene:{fuel:'BOTH', mixture:1, beacon:true},
 items:[
  ['KEY IN IGNITION','CHECK'],
  ['MASTER SWITCH','ON', s=>s.bat&&s.alt,'master'],
  ['PRIMER','AS REQUIRED', s=>s.primer>0,'primer'],
  ['THROTTLE','CRACK 1/8 INCH', s=>s.throttle>0.05&&s.throttle<0.3,'throttle'],
  ['BRAKES','SET'],
  ['CRANK ENGINE','START', s=>s.running,'mags'],
  ['OIL PRESSURE','CHECK', s=>s.oilP>=60],
  ['AVIONICS MASTER','ON', s=>s.avionics,'avionics'],
  ['LIGHTS','TAXI LIGHTS ON', s=>s.land,'land']
]},

{id:'before-taxi', name:'Before Taxi',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:1,throttle:0.18,
        running:true,rpm:1000,oilP:68,oilT:150,beacon:true,land:true,flaps:0,
        airborne:false,altFt:1200,ias:0},
 items:[
  ['CONTROLS','FREE AND CLEAR'],
  ['INSTRUMENTS','FLIGHT, NAV, COM CHECK'],
  ['BRAKES','CHECK BOTH SIDES']
]},

{id:'before-takeoff', name:'Before Takeoff',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:1,throttle:0.18,
        running:true,rpm:1000,oilP:68,oilT:165,beacon:true,land:true,flaps:0,trim:0.3,
        airborne:false,altFt:1200,ias:0},
 items:[
  ['FLIGHT CONTROLS','FREE AND CORRECT'],
  ['INSTRUMENTS','FLIGHT, NAV, COMM'],
  ['GAS','QUANTITY CHECKED'],
  ['AIR TRIM','SET', s=>near(s.trim,0.5,0.12),'trim'],
  ['RUNUP','COMPLETE'],
  ['FLAPS','SET FOR TAKEOFF', s=>s.flaps===0||s.flaps===10,'flaps']
]},

/* ---- Run-up ------------------------------------------------------------
   The instructor's card compresses this to a single "RUNUP - COMPLETE" line
   in Before Takeoff, so the detail comes from the earlier RMC card. The
   engine models all of it: each magneto's drop is re-rolled on every page
   load, so the 150 max / 50 diff limits have to be read and compared. */
{id:'runup', name:'Run-up',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:0.6,throttle:0.18,
        running:true,rpm:1000,oilP:68,oilT:165,beacon:true,flaps:0,trim:0.3,carb:false,
        land:false,strobe:false,airborne:false,altFt:1200,ias:0,
        magSeenL:false,magSeenR:false},
 items:[
  ['BRAKES','SET'],
  ['TRIM','SET FOR TAKEOFF', s=>near(s.trim,0.5,0.12),'trim'],
  ['MIXTURE','SET FULL RICH', s=>s.mixture>0.93,'mixture'],
  ['OIL TEMP','GREEN', s=>s.oilT>=100],
  ['THROTTLE','1,700 RPM', s=>near(s.rpm,1700,90),'throttle'],
  ['MIXTURE',"LEAN (>3,000' MSL)"],
  ['MAG CHECK','150 MAX / 50 DIFF', s=>s.magSeenL&&s.magSeenR&&s.mags==='BOTH','mags'],
  ["ENGINE T's & P's",'CK', s=>s.oilP>=60&&s.oilT>=100],
  ['CARB HEAT','ON', s=>s.carb,'carbheat'],
  ['THROTTLE','IDLE', s=>s.throttle<0.06,'throttle'],
  ['CARB HEAT','OFF', s=>!s.carb,'carbheat'],
  ['THROTTLE','1,000 RPM', s=>near(s.rpm,1000,140),'throttle'],
  ['FUEL SELECTOR','BOTH (SINGLE >5,000 FT)', s=>s.fuel==='BOTH','fuel'],
  ['FLAPS','SET A/R (10° SHORT/SOFT FIELD)', s=>s.flaps===0||s.flaps===10,'flaps'],
  ['LIGHTS','SET A/R', s=>s.land||s.strobe,'land'],
  ['SPOT TRACKER','CHECK'],
  ['DEPARTURE BRIEF','REVIEW']
]},

{id:'cleared', name:'Cleared for Takeoff',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:1,throttle:0.18,
        running:true,rpm:1000,oilP:70,oilT:175,beacon:true,flaps:0,
        airborne:false,altFt:1200,ias:0,hdg:270,xpdr:'ALT'},
 items:[
  ['SEATS','SECURE'],
  ['LIGHTS AND STROBES','ON', s=>s.land&&s.strobe,'strobe'],
  ['POWER QUADRANT','CHECKED']
]},

{id:'after-takeoff', name:'After Takeoff',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:1,throttle:1,
        running:true,rpm:2500,oilP:75,oilT:185,beacon:true,strobe:true,land:true,flaps:10,
        airborne:true,ias:80,altFt:1800,vsi:700,hdg:270,pitch:8,xpdr:'ALT'},
 items:[
  ['FLAPS, POWER','UP, CLIMB POWER SET', s=>s.flaps===0,'flaps'],
  ['LIGHTS','AS REQUIRED']
]},

/* ---- Cruise-phase detail ----------------------------------------------
   The instructor's card jumps straight from After Takeoff to Before
   Landing, so these three come from the earlier RMC Aviation card. Speeds
   are in MPH, matching this aeroplane's ASI. */
{id:'climb', name:'Climb',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:1,throttle:1,
        running:true,rpm:2500,oilP:75,oilT:185,beacon:true,strobe:true,land:true,flaps:10,
        airborne:true,ias:80,altFt:1800,vsi:700,hdg:270,pitch:8,xpdr:'ALT'},
 items:[
  ['AIRSPEED',"80 MPH (100 MPH EXTENDED CLIMB)", s=>near(s.ias,80,12)],
  ['FLAPS','UP', s=>s.flaps===0,'flaps'],
  ['ENGINE INSTRUMENTS','CK, 400° CHT MAX', s=>s.cht<400],
  ['LIGHTS','A/R', s=>!s.land,'land'],
  ['MIXTURE',"LEAN AS REQ >3,000' MSL", s=>s.altFt<3000||s.mixture<0.9,'mixture'],
  ['FUEL',"SINGLE TANK >5,000' MSL", s=>s.altFt<5000||s.fuel==='LEFT'||s.fuel==='RIGHT','fuel']
]},

{id:'cruise', name:'Cruise',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:1,throttle:0.92,
        running:true,rpm:2450,oilP:74,oilT:190,beacon:true,strobe:true,flaps:0,
        airborne:true,ias:118,altFt:4500,vsi:0,hdg:270,pitch:1,xpdr:'ALT'},
 items:[
  ['POWER','SET (2,300–2,400 RPM)', s=>s.rpm>=2250&&s.rpm<=2450,'throttle'],
  ['MIXTURE',"LEAN AS REQ >3,000' MSL", s=>s.mixture<0.85,'mixture'],
  ['ENGINE INST','MONITOR, CHT MAX 370°', s=>s.cht<370],
  ['FUEL','SWAP TANKS EVERY 30 MINS', s=>s.fuel!=='OFF','fuel']
]},

{id:'descent', name:'Descent / Approach',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'LEFT',mixture:0.7,throttle:0.9,
        running:true,rpm:2400,oilP:73,oilT:190,beacon:true,strobe:true,flaps:0,
        airborne:true,ias:120,altFt:5500,vsi:0,hdg:270,pitch:0,xpdr:'ALT'},
 items:[
  ['THROTTLE','2,000 RPM', s=>near(s.rpm,2000,140),'throttle'],
  ['ENGINE','MONITOR CHT COOLING', s=>s.cht<370],
  ['FUEL',"BOTH THRU 5,000' MSL", s=>s.fuel==='BOTH','fuel'],
  ['MIXTURE','RICHEN A/R', s=>s.mixture>0.85,'mixture'],
  ['LIGHTS','AS REQ', s=>s.land,'land'],
  ['ALTIMETER','SET'],
  ['APPROACH BRIEF','COMPLETE']
]},

{id:'before-landing', name:'Before Landing',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'LEFT',mixture:0.7,throttle:0.4,
        running:true,rpm:1800,oilP:70,oilT:186,beacon:true,strobe:true,flaps:0,
        airborne:true,ias:95,altFt:2200,vsi:-400,hdg:270,pitch:-2,xpdr:'ALT'},
 items:[
  ['GAS, UNDERCARRIAGE','BOTH TANKS, CHECKED', s=>s.fuel==='BOTH','fuel'],
  ['MIXTURE, PROP, FLAPS','RICH, SET FOR LANDING', s=>s.mixture>0.93,'mixture'],
  ['LIGHTS','AS REQUIRED', s=>s.land,'land']
]},

{id:'after-landing', name:'After Landing',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:1,throttle:0.15,
        running:true,rpm:1000,oilP:68,oilT:185,beacon:true,strobe:true,land:true,
        carb:true,flaps:30,airborne:false,ias:0,altFt:1200,vsi:0,xpdr:'ALT'},
 items:[
  ['FLAPS, CARB HEAT','UP, OFF', s=>s.flaps===0&&!s.carb,'flaps'],
  ['LIGHTS, STROBES','OFF', s=>!s.land&&!s.strobe,'strobe'],
  ['SQUAWK','VFR 1200']
]},

{id:'shutdown', name:'Shutdown',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:0.6,throttle:0.2,
        running:true,rpm:1100,oilP:68,oilT:182,beacon:true,strobe:true,flaps:0,
        airborne:false,ias:0,altFt:1200,xpdr:'SBY'},
 items:[
  ['AVIONICS MASTER','OFF', s=>!s.avionics,'avionics'],
  ['ELECTRICAL SWITCHES','OFF, BEACON LEFT ON', s=>s.beacon&&lightsOff(s),'beacon'],
  ['MIXTURE','IDLE CUTOFF', s=>s.mixture<0.06,'mixture'],
  ['MASTER AND MAGNETOS','BOTH OFF', s=>!s.bat&&!s.alt&&s.mags==='OFF','master'],
  ['FLIGHT TIMES','RECORD']
]},

/* ============================ EMERGENCY ==============================
   Branch points are written into the item text, since the list is linear.
   ===================================================================== */
{id:'eng-fail-air', name:'⚠ Engine Failure Inflight',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'LEFT',mixture:0.6,throttle:0,
        running:false,rpm:180,oilP:0,oilT:150,beacon:true,strobe:true,flaps:0,
        airborne:true,ias:85,altFt:3500,vsi:-700,hdg:270,pitch:-4,xpdr:'ALT'},
 items:[
  ['AIRSPEED','75 KTS — BEST GLIDE'],
  ['LANDING SPOT','LOCATE'],
  ['AIR RESTART','ACCOMPLISH'],
  ['· FUEL SELECTOR','BOTH', s=>s.fuel==='BOTH','fuel'],
  ['· MIXTURE','FULL RICH', s=>s.mixture>0.93,'mixture'],
  ['· CARB HEAT','ON', s=>s.carb,'carbheat'],
  ['· MASTER & MAGS','CHECK', s=>s.bat&&s.mags==='BOTH','mags'],
  ['· ENGINE INSTRUMENTS','CHECK'],
  ['· PROP WINDMILLING?','CRANK ENGINE'],
  ['NO RESTART','CONTINUE BELOW'],
  ['RADIOS','121.5 — SQUAWK 7700', s=>s.xpdr==='ALT','xpdr'],
  ['MAYDAY','MAKE CALL'],
  ['SECURE','ACCOMPLISH']
]},

{id:'eng-fire-air', name:'⚠ Engine Fire In-Flight',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:1,throttle:0.8,
        running:true,rpm:2300,oilP:70,oilT:210,beacon:true,strobe:true,flaps:0,
        airborne:true,ias:110,altFt:3000,vsi:0,hdg:270,xpdr:'ALT'},
 items:[
  ['MIXTURE','IDLE CUTOFF', s=>s.mixture<0.06,'mixture'],
  ['FUEL SELECTOR','OFF', s=>s.fuel==='OFF','fuel'],
  ['MASTER SWITCH','OFF', s=>!s.bat&&!s.alt,'master'],
  ['AIR VENTS','CLOSE'],
  ['AIRSPEED','INCREASE'],
  ['FORCED LANDING','ACCOMPLISH']
]},

{id:'eng-fire-gnd', name:'⚠ Engine Fire — Ground',
 scene:{bat:true,alt:true,mags:'START',fuel:'BOTH',mixture:1,throttle:0.15,
        running:false,rpm:250,oilP:0,oilT:60,beacon:true,flaps:0,
        airborne:false,ias:0,altFt:1200},
 items:[
  ['IF CRANKING','CONTINUE CRANKING'],
  ['IF IT STARTS','RUN @ 1700 RPM A FEW MIN'],
  ['· THEN','SHUTDOWN AND INSPECT'],
  ['· THROTTLE','FULL OPEN', s=>s.throttle>0.9,'throttle'],
  ['IF NO START','MIXTURE — IDLE CUTOFF', s=>s.mixture<0.06,'mixture'],
  ['· CRANKING','CONTINUE'],
  ['THEN — MASTER SWITCH','OFF', s=>!s.bat&&!s.alt,'master'],
  ['IGNITION SWITCH','OFF', s=>s.mags==='OFF','mags'],
  ['FUEL SELECTOR','OFF', s=>s.fuel==='OFF','fuel']
]},

{id:'elec-fire', name:'⚠ Electrical Fire',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:1,throttle:0.8,
        running:true,rpm:2300,oilP:72,oilT:190,beacon:true,strobe:true,land:true,flaps:0,
        airborne:true,ias:110,altFt:3000,hdg:270,xpdr:'ALT'},
 items:[
  ['MASTER SWITCH','OFF', s=>!s.bat&&!s.alt,'master'],
  ['ALL ELECTRICAL','OFF', s=>lightsOff(s)&&!s.beacon&&!s.pitot,'beacon'],
  ['AVIONICS','OFF', s=>!s.avionics,'avionics'],
  ['AIR VENTS','CLOSED'],
  ['EXTINGUISHER','ACTIVATE'],
  ['CABIN','VENT']
]},

{id:'elec-fail', name:'⚠ Electrical Failures',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:1,throttle:0.85,
        running:true,rpm:2400,oilP:73,oilT:190,beacon:true,strobe:true,flaps:0,
        airborne:true,ias:115,altFt:4000,hdg:270,xpdr:'ALT'},
 items:[
  ['OVERCHARGE?','ALTERNATOR — OFF', s=>!s.alt,'master'],
  ['LOW VOLTAGE LIGHT?','AVIONICS — OFF', s=>!s.avionics,'avionics'],
  ['· MASTER SWITCH','RESET', s=>s.bat&&s.alt,'master'],
  ['IF LIGHT OFF','AVIONICS — ON', s=>s.avionics,'avionics'],
  ['IF LIGHT BACK ON','ALTERNATOR — OFF', s=>!s.alt,'master'],
  ['· NON-ESSENTIAL EQUIPMENT','OFF', s=>lightsOff(s)&&!s.pitot,'land'],
  ['· LAND','AS SOON AS PRACTICAL']
]}
];

/* Aircraft performance data — from the aeroplane, not the checklist cards.
   Note the cards call best glide in KNOTS while this panel's ASI is marked
   in MPH, as the instrument itself is. 75 kts ≈ 86 mph. */
const VSPEEDS = [
  ['Vr — Rotation','65 MPH'],
  ['Vx — Best angle of climb','68 MPH'],
  ['Vy — Best rate of climb','80 MPH'],
  ['Best glide','75 KTS ≈ 86 MPH'],
  ['Vcc — Cruise climb','100 MPH'],
  ['Cruise power','2,300–2,400 RPM · ROP'],
  ['Va — Manoeuvring','100–110 MPH'],
  ['Vfe — Max flap extended','100 MPH'],
  ['Vno — Max structural cruise','145 MPH'],
  ['Vne — Never exceed','182 MPH']
];
