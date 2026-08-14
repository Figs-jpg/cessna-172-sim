# Cessna 172 SIM

### ▶ [Launch the sim](https://figs-jpg.github.io/cessna-172-sim/)

An interactive Cessna 172K instrument panel and flows checklist trainer, built
for practising cockpit flows away from the aircraft.

Runs in any browser — nothing to install, works on a phone or tablet.

Modelled on **N46519** — a 172K with a Garmin retrofit (dual G5s, GMA 340,
GNS 430) and a JPI EDM engine monitor. Panel positions were measured from
photographs of the actual cockpit, then squared up so the spatial layout is
true to what you see from the left seat.

## Running it

No build step, no dependencies. Either:

- **Double-click `index.html`**, or
- Serve the folder and open it in a browser:

```bash
python -m http.server 8000
```

## What it does

**The panel is simulated, not a picture with hotspots.** Mixture to idle cutoff
kills the engine. The mag check gives a real RPM drop — and each magneto's drop
is re-rolled on every page load, so you have to actually read and compare them
against the 150 max / 50 diff limits rather than memorise a number. Carb heat
costs about 70 RPM. Oil pressure and temperature come up as the engine warms.

**Flows are bound to the panel.** All 12 phases from the checklist card are
included. Items tagged `PANEL` only tick when you set that control for real —
you fly the flow with the switches, not with a checkbox.

Three modes:

| Mode | Behaviour |
| --- | --- |
| **Study** | Everything visible; the matching control pulses on the panel |
| **Practice** | In order. Skipping an unmet item counts as a miss |
| **Recall** | The list is blurred ahead of you — call it from memory |

Items that are *already* correct when you reach them show a green `SET` chip and
wait for you to call and confirm them. Only a real change auto-ticks, because a
flow means touching every item, including the ones already set.

Other controls:

- **Set scene** — puts the aircraft into a realistic state for the selected
  phase, so any flow can be drilled in isolation without flying up to it.
- **Cold & dark** — everything off and secured, as found on the ramp.
- **Hide labels** — blanks every printed name on the panel, to test yourself on
  where things are.

## Layout

`index.html` is a bare shell; everything else is JavaScript.

```
index.html          document skeleton and script tags only
css/app.css         all styling
js/svg.js           SVG drawing helpers (arcs, ticks, dials)
js/state.js         the aircraft state object every file reads and writes
js/flows.js         the 12 checklist flows and V-speeds
js/layout.js        page chrome (header, panel card, checklist)
js/panel.js         cockpit geometry — builds the SVG
js/physics.js       engine, electrical and flight model
js/controls.js      click and drag wiring
js/render.js        draws state onto the panel
js/app.js           checklist UI and the main loop
```

Scripts are plain `<script src>` tags rather than ES modules, so the page works
from a `file://` double-click as well as over HTTP.

## Caveat

This is a study aid, not a certified reference. The aircraft POH and the current
checklist card are always authoritative. The flight model is deliberately
shallow — it trains flows and panel familiarity, not stick and rudder.
