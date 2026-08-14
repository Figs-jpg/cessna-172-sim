"use strict";
/* Cessna 172 SIM - N46519
   Checklist flows, transcribed from the RMC Aviation C172K card. */

/* ==========================================================================
   7. FLOWS DATA
   Transcribed from the RMC Aviation C172K checklist card.
   `test`  — auto-ticks when the panel reaches this state.
   `hl`    — which control to pulse as a hint (Study mode only).
   ========================================================================== */
const near=(v,t,tol)=>Math.abs(v-t)<=tol;

const FLOWS = [
{id:'preflight', name:'Preflight', scene:{},
 items:[
  ['MX STATUS','COMPLETE'],
  ['HOBBS & TACH','CK & RECORD'],
  ['FIRE EXTINGUISHER','GREEN ARC'],
  ['FUEL SELECTOR','ON BOTH', s=>s.fuel==='BOTH','fuel'],
  ['MIXTURE','IDLE CUTOFF', s=>s.mixture<0.04,'mixture'],
  ['THROTTLE','CLOSED', s=>s.throttle<0.04,'throttle'],
  ['MAGS','OFF', s=>s.mags==='OFF','mags'],
  ['CIRCUIT BREAKERS','IN'],
  ['ELT SWITCH','OFF'],
  ['BATT SWITCH','ON', s=>s.bat,'master'],
  ['FUEL GAUGES','CK QUANTITY'],
  ['FLAPS','EXTEND', s=>s.flaps===30,'flaps'],
  ['JPI','PROGRAM'],
  ["EXT/INT LTS","CK / AS REQ'D", s=>s.beacon||s.land||s.nav,'beacon'],
  ['BATT SWITCH','OFF', s=>!s.bat,'master'],
  ['WINDSHIELD','CLEAR / CLEAN'],
  ['L. LANDING GEAR','CK'],
  ['L. FUEL DRAIN','CK'],
  ['L. FUSELAGE / STATIC ANTENNA','CK'],
  ['L. FUSELAGE / ELEVATOR / TRIM','CK'],
  ['VERT. STAB. / STABILIZER / ANTENNAS','CK'],
  ['RUDDER','CK'],
  ['TAIL TIE-DOWN','REMOVED'],
  ['R. FUSELAGE / ANTENNAE','CK'],
  ['R. MAIN GEAR / TIRE / BRAKES','CK'],
  ['R. FUEL DRAIN','DRAIN / CK'],
  ['R. FLAP / AILERON / STATIC WIC','CK'],
  ['R. WING TIP / LIGHTS','CK'],
  ['R. WING LEADING EDGE','CK'],
  ['R. WING INSPECTION PLATES','CK'],
  ['R. TIEDOWN','REMOVED'],
  ['R. FUEL CAP','CK'],
  ['R. FRESH AIR INLET','CLEAR'],
  ['OIL LEVEL','CK'],
  ['FUEL','DRAIN'],
  ['COWLING','SECURE'],
  ['PROPELLER & SPINNER','CK'],
  ['COWL AIR INLET (4)','CLEAR'],
  ['ALTERNATOR BELT','SECURE'],
  ['NOSE LANDING GEAR','CK'],
  ['HEATER INTAKE HOSES','CK'],
  ['PITOT TUBE','CK'],
  ['FUEL VENT','CK'],
  ['STALL WARNING VANE','CK'],
  ['L. WING INSPECTION','SAME AS RIGHT'],
  ['BAGGAGE DOOR','SECURE']
]},

{id:'start', name:'Starting Engine',
 scene:{bat:false,alt:false,mags:'OFF',throttle:0,mixture:0,fuel:'BOTH',flaps:0,running:false,rpm:0,airborne:false,ias:0,altFt:1200},
 items:[
  ['360° WALK-AROUND','COMPLETE'],
  ['TIEDOWN/CHOCKS','REMOVED'],
  ['PAX BRIEF','COMPLETE'],
  ['SEATS / SEATBELT','SECURED'],
  ['DOORS','CLOSED, LOCKED'],
  ['BRAKES','SET'],
  ['LIGHTS','ON AS REQ', s=>s.beacon,'beacon'],
  ['BATTERY / ALTERNATOR','ON', s=>s.bat&&s.alt,'master'],
  ['ENGINE PRIME','1x HOT, 2x COLD', s=>s.primer>0,'primer'],
  ['MIXTURE','FULL RICH', s=>s.mixture>0.93,'mixture'],
  ['THROTTLE','OPEN 1/2"', s=>s.throttle>0.05&&s.throttle<0.3,'throttle'],
  ['PROP AREA','CLEAR'],
  ['ENGINE START','THROTTLE 1000 RPM', s=>s.running&&near(s.rpm,1000,180),'mags'],
  ['OIL PRESS / TEMP','GREEN', s=>s.oilP>=60],
  ['AMMETER','CHARGING', s=>s.amps>3],
  ['MIXTURE','GROUND LEAN', s=>s.mixture>0.4&&s.mixture<0.78,'mixture'],
  ['FLAPS','RETRACT', s=>s.flaps===0,'flaps'],
  ['RADIO / TRANSPONDER','ON', s=>s.avionics&&s.xpdr!=='OFF','avionics']
]},

{id:'taxi', name:'Taxi',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:0.6,throttle:0.18,running:true,rpm:1000,
        oilP:68,oilT:150,vac:4.9,brake:false,beacon:true,flaps:0,airborne:false,altFt:1200,ias:0},
 items:[
  ['BRAKES / STEERING','CK'],
  ['FLT INSTRUMENTS','CK & SET'],
  ['LIGHTS','AS REQ', s=>s.beacon,'beacon'],
  ['FLIGHT CONTROLS','FULL / FREE'],
  ['WIND','CHECK']
]},

{id:'runup', name:'Before Takeoff — Run-up',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:0.6,throttle:0.18,running:true,rpm:1000,
        oilP:68,oilT:165,vac:4.9,brake:false,beacon:true,flaps:0,airborne:false,altFt:1200,ias:0,
        magSeenL:false,magSeenR:false},
 items:[
  ['BRAKES','SET'],
  ['TRIM','SET FOR TAKEOFF', s=>near(s.trim,0.5,0.12),'trim'],
  ['MIXTURE','SET FULL RICH', s=>s.mixture>0.93,'mixture'],
  ['OIL TEMP','GREEN', s=>s.oilT>=100],
  ['THROTTLE','1,700 RPM', s=>near(s.rpm,1700,90),'throttle'],
  ['MIXTURE',"LEAN (>3,000' MSL)"],
  ['MAG CHECK','150 MAX / 50 DIFF', s=>s.magSeenL&&s.magSeenR&&s.mags==='BOTH','mags'],
  // The card's VACUUM GAUGE check is dropped: no suction gauge is fitted.
  ["ENGINE T's & P's",'CK', s=>s.oilP>=60&&s.oilT>=100],
  ['CARB HEAT','ON', s=>s.carb,'carbheat'],
  ['THROTTLE','IDLE', s=>s.throttle<0.06,'throttle'],
  ['CARB HEAT','OFF', s=>!s.carb,'carbheat'],
  ['THROTTLE','1,000 RPM', s=>near(s.rpm,1000,140),'throttle'],
  ['FUEL SELECTOR','BOTH (SINGLE >5,000 FT)', s=>s.fuel==='BOTH','fuel'],
  ['FLAPS','SET A/R (10° SHORT/SOFT FIELD)', s=>s.flaps===0||s.flaps===10,'flaps'],
  ['LIGHTS','SET A/R', s=>s.land&&s.strobe,'land'],
  ['SPOT','CHECK'],
  ['DEPARTURE BRIEF','REVIEW']
]},

{id:'lineup', name:'Before Takeoff — Line-up',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:1,throttle:0.18,running:true,rpm:1000,
        oilP:70,oilT:175,vac:4.9,beacon:true,strobe:true,land:true,flaps:0,brake:false,
        airborne:false,altFt:1200,ias:0,hdg:270,xpdr:'SBY'},
 items:[
  ['HEADING','CONFIRMED WITH RWY'],
  ['INSTRUMENTS','CK'],
  ['TRANSPONDER','ALT', s=>s.xpdr==='ALT','xpdr'],
  ['TIME','NOTE'],
  ['SECURITY','SEATBELTS / WINDOW']
]},

{id:'climb', name:'Climb',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:1,throttle:1,running:true,rpm:2500,
        oilP:75,oilT:185,vac:5.0,beacon:true,strobe:true,land:true,flaps:10,
        airborne:true,ias:80,altFt:1800,vsi:700,hdg:270,pitch:8,xpdr:'ALT'},
 items:[
  ['AIRSPEED','80 MPH (100 MPH EXTENDED CLIMB)', s=>near(s.ias,80,12)],
  ['FLAPS','UP', s=>s.flaps===0,'flaps'],
  ['ENGINE INSTRUMENTS','CK, 400° CHT MAX', s=>s.cht<400],
  ['LIGHTS','A/R', s=>!s.land,'land'],
  ['MIXTURE',"LEAN AS REQ >3,000' MSL", s=>s.altFt<3000||s.mixture<0.9,'mixture'],
  ['FUEL',"SINGLE TANK >5,000' MSL", s=>s.altFt<5000||s.fuel==='LEFT'||s.fuel==='RIGHT','fuel']
]},

{id:'cruise', name:'Cruise',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:1,throttle:0.92,running:true,rpm:2450,
        oilP:74,oilT:190,vac:5.0,beacon:true,strobe:true,flaps:0,
        airborne:true,ias:118,altFt:4500,vsi:0,hdg:270,pitch:1,xpdr:'ALT'},
 items:[
  ['POWER','SET (2,300–2,400 RPM)', s=>s.rpm>=2250&&s.rpm<=2450,'throttle'],
  ['MIXTURE',"LEAN AS REQ >3,000' MSL", s=>s.mixture<0.85,'mixture'],
  ['ENGINE INST','MONITOR, CHT MAX 370°', s=>s.cht<370],
  ['FUEL','SWAP TANKS EVERY 30 MINS', s=>s.fuel!=='OFF','fuel']
]},

{id:'descent', name:'Descent / Approach',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'LEFT',mixture:0.7,throttle:0.9,running:true,rpm:2400,
        oilP:73,oilT:190,vac:5.0,beacon:true,strobe:true,flaps:0,
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

{id:'pattern', name:'Traffic Pattern',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:1,throttle:0.75,running:true,rpm:2200,
        oilP:72,oilT:188,vac:5.0,beacon:true,strobe:true,land:true,flaps:0,
        airborne:true,ias:95,altFt:2200,vsi:0,hdg:270,pitch:0,xpdr:'ALT'},
 items:[
  ['CLIMB','80 MPH'],
  ['LEVEL','ACCELERATE 90–100 MPH'],
  ['THROTTLE','2,200 RPM', s=>near(s.rpm,2200,120),'throttle'],
  ['DOWNWIND','HT, HDG, SPEED, SPACING'],
  ['ABEAM NUMBERS','THROTTLE 1,700 RPM', s=>near(s.rpm,1700,120),'throttle'],
  ['CARB HEAT','ON', s=>s.carb,'carbheat'],
  ['AIRSPEED','<100 MPH, FLAP 10°', s=>s.flaps===10,'flaps'],
  ['AIRSPEED','80 MPH', s=>near(s.ias,80,12)],
  ['THROTTLE','1,500 RPM', s=>near(s.rpm,1500,120),'throttle'],
  ['BASE TURN','FLAP 20°', s=>s.flaps===20,'flaps'],
  ['FINAL','FLAP 30°', s=>s.flaps===30,'flaps'],
  ['FINAL CHECKS','CCC'],
  ['AIRSPEED','75/70 MPH, 70/65 MPH SHORT']
]},

{id:'landing', name:'Before Landing',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:0.8,throttle:0.4,running:true,rpm:1500,
        oilP:70,oilT:186,vac:4.9,beacon:true,strobe:true,land:true,carb:true,flaps:20,
        airborne:true,ias:80,altFt:1600,vsi:-500,hdg:270,pitch:-2,xpdr:'ALT'},
 items:[
  ['MIXTURE',"FULL RICH <3,000' MSL", s=>s.mixture>0.93,'mixture'],
  ['LIGHTS','AS REQ', s=>s.land,'land'],
  ['GUMS CHECK','COMPLETE'],
  ["FINAL VERIFICATION","3 C's"]
]},

{id:'after', name:'After Landing',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:1,throttle:0.15,running:true,rpm:1000,
        oilP:68,oilT:185,vac:4.9,beacon:true,strobe:true,land:true,carb:true,flaps:30,
        airborne:false,ias:0,altFt:1200,vsi:0,xpdr:'ALT'},
 items:[
  ['FLAPS','UP', s=>s.flaps===0,'flaps'],
  ['TRANSPONDER','STBY', s=>s.xpdr==='SBY','xpdr'],
  ['NON-ESSENTIAL ELECTRICS','OFF', s=>!s.land&&!s.strobe&&!s.pitot,'land'],
  ['LIGHTS','A/R', s=>s.beacon,'beacon'],
  ['MIXTURE','GROUND LEAN', s=>s.mixture>0.4&&s.mixture<0.78,'mixture']
]},

{id:'shutdown', name:'Shutdown',
 scene:{bat:true,alt:true,avionics:true,mags:'BOTH',fuel:'BOTH',mixture:0.6,throttle:0.2,running:true,rpm:1100,
        oilP:68,oilT:182,vac:4.9,beacon:true,flaps:0,brake:false,
        airborne:false,ias:0,altFt:1200,xpdr:'SBY'},
 items:[
  ['BRAKES','SET'],
  ['THROTTLE','1,000 RPM', s=>near(s.rpm,1000,140),'throttle'],
  ['RADIOS / TX / LIGHTS','OFF', s=>!s.avionics&&s.xpdr==='OFF'&&!s.beacon&&!s.land&&!s.strobe,'avionics'],
  ['MIXTURE','IDLE CUTOFF', s=>s.mixture<0.06,'mixture'],
  ['IGNITION SWITCH','OFF', s=>s.mags==='OFF','mags'],
  ['MASTER SWITCH','OFF', s=>!s.bat&&!s.alt,'master'],
  ['SPOT','OFF'],
  ['CONTROL LOCK','FIT'],
  ['SECURE AIRCRAFT','TIEDOWN / CHOCKS'],
  ['CLOSE FLIGHT PLAN','IF FILED']
]}
];

const VSPEEDS = [
  ['Vr — Rotation','65 MPH'],
  ['Vx — Best angle of climb','68 MPH'],
  ['Vy — Best rate of climb','80 MPH'],
  ['Vcc — Cruise climb','100 MPH'],
  ['Cruise power','2,300–2,400 RPM · ROP'],
  ['Va — Manoeuvring','100–110 MPH'],
  ['Vfe — Max flap extended','100 MPH'],
  ['Vno — Max structural cruise','145 MPH'],
  ['Vne — Never exceed','182 MPH']
];
