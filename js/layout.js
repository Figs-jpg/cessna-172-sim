"use strict";
/* Cessna 172 SIM - N46519
   Page chrome, built in JS so index.html stays a bare shell. */

document.getElementById('app').innerHTML = `
<header>
  <span class="brand">Cessna 172 SIM</span>
  <span class="tail">N46519 · C172K</span>
  <span class="grow"></span>
  <div class="tabs" role="tablist">
    <button role="tab" aria-selected="true"  data-view="train">Trainer</button>
    <button role="tab" aria-selected="false" data-view="ref">Reference</button>
  </div>
</header>

<main id="viewTrain">
  <!-- ================= PANEL ================= -->
  <section class="card" id="panelCard">
    <svg id="panel" viewBox="0 0 1400 950" aria-label="Cessna 172K cockpit"></svg>
    <div class="strip" id="strip"></div>
  </section>

  <!-- ================= FLOWS ================= -->
  <aside class="card">
    <h2>Flows &amp; Checklist</h2>

    <div class="row">
      <select id="phase" style="flex:1"></select>
      <button class="btn sm" id="setScene" title="Put the aircraft in a realistic state for this phase">Set scene</button>
    </div>

    <div class="row">
      <div class="seg" id="modes">
        <button data-mode="study"   aria-pressed="true">Study</button>
        <button data-mode="practice" aria-pressed="false">Practice</button>
        <button data-mode="recall"   aria-pressed="false">Recall</button>
      </div>
      <span class="grow"></span>
      <span class="chip"><b id="clock">0:00</b></span>
      <span class="chip" id="scoreChip">0/0</span>
    </div>

    <div class="meterbar"><i id="meter"></i></div>
    <ol class="items" id="items"></ol>

    <div class="foot">
      <button class="btn pri" id="next">Next item</button>
      <button class="btn" id="reset">Reset flow</button>
      <span class="grow"></span>
      <button class="btn sm" id="labels" title="Hide every printed label on the panel and test yourself">Hide labels</button>
      <button class="btn sm" id="coldDark" title="Return the aeroplane to cold &amp; dark">Cold &amp; dark</button>
    </div>
    <p class="note" id="modeNote"></p>
  </aside>
</main>

<!-- ================= REFERENCE ================= -->
<main id="viewRef" class="hide" style="grid-template-columns:1fr 1fr">
  <section class="card">
    <h2>V-Speeds &amp; Power Settings</h2>
    <table class="v" id="vtable"></table>
  </section>
  <section class="card">
    <h2>Memory Items</h2>
    <table class="v">
      <tr><td><b>Engine failure</b><br><span style="color:var(--dim)">First three actions</span></td>
          <td style="text-align:left;color:var(--txt);font-family:inherit;font-weight:400">
            Airspeed — 75 kts<br>Landing spot — locate<br>Air restart — accomplish</td></tr>
      <tr><td><b>Air restart</b><br><span style="color:var(--dim)">Flow</span></td>
          <td style="text-align:left;color:var(--txt);font-family:inherit;font-weight:400">
            Fuel selector — both<br>Mixture — full rich<br>Carb heat — on<br>
            Master &amp; mags — check<br>Engine instruments — check</td></tr>
      <tr><td><b>Engine fire in flight</b><br><span style="color:var(--dim)">Cut fuel first</span></td>
          <td style="text-align:left;color:var(--txt);font-family:inherit;font-weight:400">
            Mixture — idle cutoff<br>Fuel selector — off<br>Master — off<br>
            Vents — close<br>Airspeed — increase</td></tr>
      <tr><td><b>Distress</b></td><td>121.5<br>Squawk 7700</td></tr>
      <tr><td><b>Ground fire start</b></td><td>Run @ 1,700 RPM<br>Throttle full open</td></tr>
      <tr><td><b>Start</b></td><td>Throttle cracked 1/8″</td></tr>
      <tr><td><b>GUMS</b><br><span style="color:var(--dim)">Before landing</span></td>
          <td style="text-align:left;color:var(--txt);font-family:inherit;font-weight:400">
            Gas &mdash; both tanks<br>Undercarriage &mdash; checked<br>
            Mixture &mdash; full rich<br>Switches &mdash; lights, carb heat</td></tr>
      <tr><td><b>3 C's</b><br><span style="color:var(--dim)">Short final</span></td>
          <td style="text-align:left;color:var(--txt);font-family:inherit;font-weight:400">
            Configured<br>Cleared to land<br>Runway clear</td></tr>
      <tr><td><b>Mag check</b><br><span style="color:var(--dim)">1,700 RPM</span></td>
          <td>150 max drop<br>50 max diff</td></tr>
      <tr><td><b>Pattern</b></td><td>2,200 RPM downwind<br>1,700 abeam<br>1,500 base</td></tr>
    </table>
    <p class="note">
      This trainer is a study aid, not a certified reference. The aircraft POH and the
      current checklist card are always authoritative.
    </p>
  </section>
</main>
`;
