# Cessna 172 SIM — working rules

Browser trainer for **N46519, a Cessna 172K**: an interactive panel plus
checklist flows bound to it. No build step, no dependencies. Deployed to
GitHub Pages from `main` / root.

Read `DEVLOG.md` for architecture, current state and open questions. This file
is only the rules that apply every session.

---

## Deploying

**Bump `?v=N` on every asset line in `index.html` whenever you change JS or
CSS.** GitHub Pages caches those ~10 minutes; without the bump a pushed change
keeps running the old code. All lines must carry the same number.

Plain `<script src>`, never ES modules — the page must keep working from a
`file://` double-click.

## Verifying

**Measure, don't eyeball.** Drive the live page from the browser preview and
assert on numbers. Real bugs found only this way: an aircraft symbol 8px
off-centre, a flaps check that passed without the lever moving, a descent rate
pinned at its clamp for an entire circuit. Screenshots miss all of these.

The standing regression: set every phase's scene, fly it from the controls, and
assert `UI.done.length === items.length && !UI.missed.length` for all phases,
plus a text-overlap sweep. Helpers and traps are in `DEVLOG.md` — read them
before writing checks, they will save you an hour.

`requestAnimationFrame` is paused when the preview pane is not compositing, so
step the simulation manually rather than waiting on it.

When a check fails, work out whether the fault is the code or the test harness
before changing anything. It has repeatedly been the harness, and saying so
plainly is faster than quietly re-running.

## Invariants — do not undo these

- **Input repaints itself.** Every control handler calls `render()`. `frame()`
  is try/catch-wrapped and always re-arms rAF. A single throw once froze the
  panel while the checklist kept working, which read as "clicking does
  nothing". Never make the panel depend solely on the animation loop.
- **Only a real change auto-ticks.** In Practice and Recall an item already
  satisfied on arrival shows a `SET` chip and waits for acknowledgement. A flow
  means touching every item, including the ones already correct.
- **Pitch for speed, power for altitude.** Trim sets the speed held; throttle
  sets climb or descent. Never derive airspeed and vertical speed from RPM
  independently — that creates energy from nowhere.
- **Mag drops are randomised per page load**, so the 150 max / 50 diff limits
  have to be read and compared, not memorised.
- Panel geometry was measured from photographs of the real cockpit and then
  squared up. Do not "tidy" positions toward a generic 172 layout.

## Conventions

- `S` in `state.js` is the single state object. Controls write it, `render()`
  draws it, checklist predicates read it. `COLD_DARK` is the baseline.
- Checklist item = `[title, action, test?, hl?]`. `test` is a predicate on `S`
  that auto-ticks the item; `hl` names the control to pulse as a hint.
  **If an item names one control, its `test` should depend on that control** —
  a test needing two controls while the hint points at one reads as broken.
- Airspeeds are **MPH**, matching this aeroplane's ASI.

## Ask, don't invent

- **The SIM tab is a deliberate placeholder.** Do not design or build it
  without being asked.
- Do not invent aeronautical facts — runway numbers, pattern altitudes,
  V-speeds, procedures. If a checklist card or the user has not supplied it,
  ask. Flag assumptions explicitly rather than burying them.
- Checklist content comes from the user's cards. Restoring detail from the
  older card is fine when asked, but say which card each item came from.
