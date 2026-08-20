# Cessna 172 SIM — developer log

Handoff document. Drop this into a fresh session together with the repo and
you have everything needed to carry on.

**Live:** https://figs-jpg.github.io/cessna-172-sim/
**Repo:** https://github.com/Figs-jpg/cessna-172-sim (public, GitHub Pages from `main` / root)
**Local:** `C:\00 AI\01 Claude\Flight School`

---

## What this is

A browser trainer for a specific aeroplane — **N46519, a Cessna 172K** — built
so a student pilot can drill cockpit flows and checklists away from the
aircraft. Two halves that work together:

1. **An interactive panel** that actually simulates. Not a picture with
   hotspots. Mixture to idle cutoff kills the engine; the mag check gives a
   real RPM drop; carb heat costs ~75 RPM.
2. **Checklist flows bound to that panel.** Where an item maps to a control,
   you satisfy it by *working the control*, not ticking a box.

The point is muscle memory and spatial familiarity, not flight simulation.

---

## Running and deploying

No build step, no dependencies.

```bash
# local
python -m http.server 8123 --directory "Flight School"
```

Double-clicking `index.html` also works — scripts are plain `<script src>`,
not ES modules, specifically so `file://` keeps working.

```bash
# deploy
git add -A && git commit -m "..." && git push
```

**Bump `?v=N` on every one of the eleven asset lines in `index.html` when you
deploy.** GitHub Pages caches JS and CSS for ~10 minutes; without the bump a
pushed change keeps running the old code. This bit us once and cost an hour of
confusion. Currently at `v=17`.

---

## File map

```
index.html        bare shell: script tags and a <div id="app">. No logic, no styling.
css/app.css       all styling
js/svg.js         SVG helpers: polar coords, arcs, tick marks, dial shells
js/state.js       S — the one state object every file reads and writes. Plus setMags().
js/flows.js       FLOWS (20 phases) and VSPEEDS
js/layout.js      page chrome: header, top tabs, the three tab panes
js/panel.js       cockpit geometry — builds the whole panel SVG
js/physics.js     engine, electrical and flight model
js/controls.js    click and drag wiring
js/render.js      draws S onto the panel. Runs on every input and every frame.
js/app.js         checklist UI, tab switching, main loop
js/pattern.js     traffic pattern diagram
```

Load order matters and is fixed in `index.html`. Top-level `const` in classic
scripts share one global lexical scope, so `S`, `FLOWS`, `P` etc. are visible
across files as long as the defining file loads first.

---

## Architecture

**One state object.** `S` in `state.js` holds everything: switch positions,
control values, engine and flight state. Controls write to it, `render()` draws
it, checklist predicates read it. `COLD_DARK` is a deep copy taken at load,
used by "Cold & dark" and as the base for every scene.

**Checklist items are arrays:** `[title, action, test?, hl?]`

- `test` — a predicate on `S`. If present the item auto-ticks when the panel
  reaches that state, and the item shows a `PANEL` chip.
- `hl` — id suffix of a highlight rect (`hl_mixture` etc.) that pulses in Study
  mode as a hint.
- Neither → a spoken call, advanced with Space or a click.

**Phases carry a `scene`** — an object merged over `COLD_DARK` by "Set scene",
putting the aeroplane in a realistic state for that phase so any flow can be
drilled in isolation.

---

## Design decisions worth knowing (and not re-litigating)

**Input repaints immediately.** Every click and drag calls `render()` itself.
`frame()` is wrapped in try/catch and always re-arms `requestAnimationFrame`.
Both exist because a single throw once killed the loop permanently: the panel
froze while the checklist kept working, which looked like "clicking does
nothing". Do not make the panel depend solely on the animation loop.

**Only a real change auto-ticks.** In Practice and Recall, an item that is
*already* satisfied when you arrive shows a green `SET` chip and waits for
acknowledgement instead of ticking itself. A flow means touching every item,
including the ones already correct. `UI.arrivedSatisfied` implements this.

**Mag drops are randomised per page load** (`MAG_DROP` in `physics.js`), so the
150 max / 50 diff limits must be read and compared rather than memorised. Some
loads legitimately hand you a scrub.

**Flight model: pitch for speed, power for altitude.** The trim wheel sets the
speed the aeroplane holds; the throttle decides whether that speed is flown
level, climbing or descending. Nothing is capped.

```
trim 0.50 (takeoff setting) -> 80 MPH Vy      trim 0.75 -> 100 MPH level on 2,300 RPM
rpmLevel = 1300 + 10*ias + 18*flaps           sinkMax  = 700 + flaps*12
excess >= 0 ? excess*1.5 (climb) : excess*0.75 (descend)
```

Airspeed and vertical speed used to be derived from RPM independently, which
produced a fast climb and a high cruise speed simultaneously — energy from
nowhere. Do not go back to that.

**Panel geometry was measured from photographs** of the real cockpit
(`Images - 01/`, gitignored), then squared up — the camera sat left of centre
and raw pixel positions carry perspective skew that would teach the wrong
spatial habit.

**Speeds are MPH**, matching this aeroplane's ASI. The instructor's emergency
card says 75 kts for best glide; that's noted as ≈86 MPH.

---

## Testing approach

There is no test framework. Verification is done by driving the live page from
`javascript_tool` in the browser preview. Two patterns do most of the work:

**Drive the sim deterministically** rather than waiting on rAF — the preview
pane pauses `requestAnimationFrame` when it is not compositing:

```js
const step=(s,n)=>{n=n||Math.max(4,Math.round(s*40));
  for(let i=0;i<n;i++){physics(s/n);flowsAuto();}};
const ack=()=>{for(let i=0;i<80;i++){
  if(UI.idx>=FLOWS[UI.phase].items.length) return;
  const x=FLOWS[UI.phase].items[UI.idx];
  if(!x[2]||UI.arrivedSatisfied){document.getElementById('next').click();} else return;}};
```

**The standing regression** is: set every phase's scene, fly it from the
controls, and assert `UI.done.length === items.length && !UI.missed.length` for
all 20. Plus a text-overlap sweep across phases.

Traps that have caught me:

- `getBBox()` on a `<g transform=...>` returns *local* coordinates. Use
  `getBoundingClientRect()` when transforms are involved.
- Overlap checks must compare text against **shapes** too, not just other text —
  a caption printing on top of a filled rect is invisible to a text-vs-text sweep.
- Clipped text still reports its full bbox. Exclude `[clip-path]` descendants.
- The preview pane serves stale `index.html` and JS aggressively. Navigate to
  `http://localhost:8123/index.html?nocache=<random>` to force a fresh load.
- Screenshot coordinates are in the *screenshot* frame, which may be scaled from
  the viewport. Clicking with viewport coordinates misses.

---

## Current state

**20 checklist phases, 185 items**, all verified to complete from the panel with
zero missed.

Preflight is split into **Inside** (6, panel-bound) and **Walk-around** (34, no
bindings — pure recall for memorisation). Then the normal sequence: Before
Start, Engine Start, Before Taxi, Run-up, Cleared for Takeoff, After Takeoff,
Climb, Cruise, Descent/Approach, Traffic Pattern, Before Landing, After
Landing, Shutdown. Then five emergency drills.

Sources: the instructor's **Cessna 172 Normal / Emergency** card and
**Pre-Flight Check List** (photos in `Images - 01/new checklists/`). Where that
card generalises, detail was restored from the earlier **RMC Aviation** card —
Climb, Cruise, Descent and the whole Run-up came from there, as did numbers
like "1× hot, 2× cold" for the primer. Before Takeoff was merged into Run-up
because they overlapped almost entirely.

**Three top-level tabs:** Flows (with Trainer/Reference sub-tabs), Traffic
Pattern, SIM.

---

## Where we were heading

**The SIM tab is the next piece and is currently an empty placeholder.** The
intent, as described: the Traffic Pattern tab is the static diagram; SIM is
where it becomes flyable. Nothing has been designed for it yet — ask before
building.

Open questions I have flagged and not resolved:

- **Pattern altitude** is captioned as the standard 1,000 ft AGL. The real
  field's figure is unknown.
- **Runway 03/21, left-hand traffic** — confirmed. One runway; the selector
  offers its two ends. The tarmac is pinned in `pattern.js` (`AXIS`, `CTR`) and
  only the circuit moves, because it is the same physical runway either way.
- `SPOT TRACKER — CHECK` and `DEPARTURE BRIEF — REVIEW` are kept at the end of
  the Run-up from the old card; the instructor's card does not have them.
- Before Takeoff's flaps item accepted 0° or 10°; the Run-up's now demands 10°
  because the user asked for it. Only the strict one survives the merge.

---

## Working style that has been effective

Verify by measuring, not by looking. Several real bugs were found only because
positions and predicates were checked numerically — an 8px-off aircraft symbol,
a flaps check that passed without the lever moving, a descent rate pinned at
its clamp for the whole pattern. Screenshots miss these.

State findings plainly, including when a "failure" turns out to be the test
harness rather than the code — that has happened several times and saying so
is faster than quietly re-running.
