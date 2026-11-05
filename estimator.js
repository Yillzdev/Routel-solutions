// ==========================================================
// estimator.js  -  runs on the ESTIMATOR page only.
// Works out the inverter, battery and solar panels from the
// equipment the visitor picks. The numbers you may want to
// change are in the "EDIT THESE" block at the top.
// ==========================================================
(function () {
  // ---- EDIT THESE TO MATCH HOW YOU REALLY SIZE SYSTEMS ----
  const POWER_FACTOR = 0.8;      // turns watts into VA
  const HEADROOM = 1.25;         // spare capacity kept on the inverter (25%)

  // the inverter sizes you supply:
  //   kva   = size of the inverter
  //   volts = battery voltage it runs on
  //   maxPv = the most solar power (W) it can take in
  // >>> the maxPv numbers are PLACEHOLDERS. replace them with the "max PV input power" from each inverter's datasheet
  const INVERTERS = [
    { kva: 1,   volts: 12,  maxPv: 500 },
    { kva: 1.5, volts: 12,  maxPv: 800 },
    { kva: 2.5, volts: 24,  maxPv: 1500 },
    { kva: 3.5, volts: 24,  maxPv: 2400 },
    { kva: 5,   volts: 48,  maxPv: 4000 },
    { kva: 7.5, volts: 48,  maxPv: 6000 },
    { kva: 10,  volts: 96,  maxPv: 8000 },
    { kva: 15,  volts: 96,  maxPv: 12000 },
    { kva: 20,  volts: 192, maxPv: 16000 }
  ];

  // >>> PLACEHOLDER: how many times its rating an inverter can briefly supply when a motor starts
  const SURGE_FACTOR = 2;

  const BATTERY_VOLTS = 12;      // voltage of ONE battery you supply
  const BATTERY_AH = 200;        // capacity of ONE battery you supply (Ah)
  const BATTERY_USABLE = 0.72;   // usable share of the battery. lithium is about 0.72. tubular lead-acid is about 0.45
  const MAX_PARALLEL = 4;        // most battery strings side by side before moving up to a higher voltage
  const SUN_HOURS = 4.5;         // average full-sun hours per day
  const SYSTEM_EFF = 0.75;       // losses in panels, cables and charging

  // panel sizes you supply (W), smallest first. small systems get the small panels,
  // and the size steps up automatically as the system grows, ending at the biggest one
  const PANEL_SIZES = [200, 330, 450, 550];
  const MAX_PANELS = 4;          // most panels of one size before stepping up to the next size

  // name, running watts, duty = share of the time it really draws power,
  // start = how many times its running watts it pulls for a moment when it starts
  const APPLIANCES = [
    { name: 'LED bulbs',              watts: 10,   duty: 1,    start: 1 },
    { name: 'Fans',                   watts: 75,   duty: 1,    start: 1.5 },
    { name: 'TV',                     watts: 100,  duty: 1,    start: 1 },
    { name: 'Fridge',                 watts: 150,  duty: 0.4,  start: 3 },
    { name: 'Freezer',                watts: 200,  duty: 0.4,  start: 3 },
    { name: 'Laptop',                 watts: 65,   duty: 1,    start: 1 },
    { name: 'Desktop computer',       watts: 200,  duty: 1,    start: 1 },
    { name: 'Router and Wi-Fi',       watts: 30,   duty: 1,    start: 1 },
    { name: 'CCTV system',            watts: 60,   duty: 1,    start: 1 },
    { name: 'Small server rack',      watts: 300,  duty: 1,    start: 1 },
    { name: 'Water pump (0.5 HP)',    watts: 400,  duty: 0.25, start: 3 },
    { name: 'Air conditioner 1 HP',   watts: 800,  duty: 0.6,  start: 3 },
    { name: 'Air conditioner 1.5 HP', watts: 1200, duty: 0.6,  start: 3 }
  ];
  const MAX_EACH = 30;
  // ----------------------------------------------------------

  const box = document.getElementById('calcBox');
  if (!box) return;

  const list = document.getElementById('appList');
  const hoursRange = document.getElementById('hoursRange');
  const hoursOut = document.getElementById('hoursOut');
  const results = document.getElementById('calcResults');
  const invNum = document.getElementById('invNum');
  const invNote = document.getElementById('invNote');
  const batNum = document.getElementById('batNum');
  const batNote = document.getElementById('batNote');
  const panNum = document.getElementById('panNum');
  const panUnit = document.getElementById('panUnit');
  const panNote = document.getElementById('panNote');
  const meterText = document.getElementById('meterText');
  const meterFill = document.getElementById('meterFill');
  const loadText = document.getElementById('calcLoad');
  const cta = document.getElementById('calcCta');

  // extra lines under the results: the battery bank, and why an inverter was sized up
  const bankText = document.createElement('p');
  bankText.className = 'calc-load';
  bankText.hidden = true;
  loadText.after(bankText);

  const limitText = document.createElement('p');
  limitText.className = 'calc-note';
  limitText.hidden = true;
  bankText.after(limitText);

  const qty = APPLIANCES.map(() => 0);
  let summary = '';

  const fmtW = w => w >= 1000 ? (w / 1000).toFixed(1).replace(/\.0$/, '') + ' kW' : Math.round(w) + ' W';
  const joinList = items => items.length <= 1 ? items.join('') : items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];

  // picks the smallest panel size that can do the job with MAX_PANELS panels or fewer
  function pickPanels(needW) {
    for (const size of PANEL_SIZES) {
      const count = Math.max(1, Math.ceil(needW / size));
      if (count <= MAX_PANELS) return { size: size, count: count };
    }
    // very big system: use the biggest panel and as many as needed
    const biggestPanel = PANEL_SIZES[PANEL_SIZES.length - 1];
    return { size: biggestPanel, count: Math.ceil(needW / biggestPanel) };
  }

  // numbers count up or down smoothly
  function animateNum(el, to, decimals) {
    const from = Number(el.dataset.v || 0);
    el.dataset.v = to;
    cancelAnimationFrame(el._raf);
    if (reduceMotion) { el.textContent = to.toFixed(decimals); return; }
    const start = performance.now();
    const dur = 450;
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (from + (to - from) * eased).toFixed(decimals);
      if (p < 1) el._raf = requestAnimationFrame(tick);
    })(start);
  }

  function showEmpty() {
    results.classList.add('empty');
    [invNum, batNum, panNum].forEach(el => { el.textContent = '—'; el.dataset.v = 0; });
    invNote.textContent = '';
    batNote.textContent = '';
    panNote.textContent = '';
    meterFill.style.width = '0%';
    meterFill.classList.remove('hot');
    meterText.textContent = '—';
    loadText.textContent = 'Select equipment to see your estimate.';
    bankText.textContent = '';
    bankText.hidden = true;
    limitText.textContent = '';
    limitText.hidden = true;
    cta.disabled = true;
    summary = '';
  }

  function calculate() {
    let connected = 0;    // everything running at once (W)
    let perHour = 0;      // average draw once fridges and ACs cycle on and off (W)
    let startExtra = 0;   // extra watts for the biggest motor starting up (one motor starts at a time)
    APPLIANCES.forEach((a, i) => {
      if (qty[i] === 0) return;
      connected += a.watts * qty[i];
      perHour += a.watts * a.duty * qty[i];
      startExtra = Math.max(startExtra, a.watts * (a.start - 1));
    });

    const hours = Number(hoursRange.value);
    hoursOut.textContent = hours + ' h';

    if (connected === 0) { showEmpty(); return; }
    results.classList.remove('empty');

    const peakW = connected + startExtra;                         // the moment a motor starts
    const needKva = (connected / POWER_FACTOR * HEADROOM) / 1000;

    // energy and solar needed (these do not depend on which inverter is chosen)
    const dailyKwh = perHour * hours / 1000;
    const batteryKwh = Math.max(0.5, Math.ceil(dailyKwh / BATTERY_USABLE * 2) / 2);
    const panelW = perHour * hours / SUN_HOURS / SYSTEM_EFF;
    const pick = pickPanels(panelW);
    const panels = pick.count;
    const arrayW = pick.size * panels;

    // the limits an inverter has to pass
    const checks = inverter => {
      const ahNeeded = Math.ceil(batteryKwh * 1000 / inverter.volts);
      const strings = Math.max(1, Math.ceil(ahNeeded / BATTERY_AH));
      return {
        solar: inverter.maxPv >= arrayW,                                            // can it take the solar array?
        bank: strings <= MAX_PARALLEL,                                              // battery strings side by side
        surge: inverter.kva * 1000 * POWER_FACTOR * SURGE_FACTOR >= peakW           // motor start-up
      };
    };

    const biggest = INVERTERS[INVERTERS.length - 1];
    const base = INVERTERS.find(s => s.kva >= needKva);             // big enough for the load alone
    const inv = INVERTERS.find(s => {                               // big enough AND passes every limit
      const c = checks(s);
      return s.kva >= needKva && c.solar && c.bank && c.surge;
    });
    const volts = (inv || biggest).volts;

    // inverter card, plus a note if a limit made it step up
    if (inv) {
      animateNum(invNum, inv.kva, Number.isInteger(inv.kva) ? 0 : 1);
      invNote.textContent = volts + ' V system';
    } else {
      invNum.textContent = biggest.kva + '+';
      invNum.dataset.v = biggest.kva;
      invNote.textContent = 'custom-size system';
    }

    let limitNote = '';
    if (!inv) {
      limitNote = 'This is larger than our standard sizes, so we would design it as a custom system.';
    } else if (inv !== base) {
      const c = checks(base);
      const why = [];
      if (!c.solar) why.push('the solar input');
      if (!c.bank) why.push('the battery bank');
      if (!c.surge) why.push('motor start-up surge');
      limitNote = 'Inverter sized up for ' + joinList(why) + '.';
    }
    limitText.textContent = limitNote;
    limitText.hidden = !limitNote;

    // battery: amp-hours at the system voltage, then how many batteries
    const ah = Math.ceil(batteryKwh * 1000 / volts);
    const inSeries = Math.max(1, Math.round(volts / BATTERY_VOLTS));
    const inParallel = Math.max(1, Math.ceil(ah / BATTERY_AH));
    const totalBatteries = inSeries * inParallel;

    animateNum(batNum, batteryKwh, 1);
    batNote.textContent = volts + ' V · ' + ah + ' Ah';
    bankText.textContent = 'Battery bank: ' + totalBatteries + ' × ' + BATTERY_VOLTS + ' V ' + BATTERY_AH + ' Ah batteries.';
    bankText.hidden = false;

    // panels
    animateNum(panNum, panels, 0);
    panUnit.textContent = panels === 1 ? 'panel' : 'panels';
    panNote.textContent = panels + ' × ' + pick.size + ' W';

    // inverter loading bar
    if (inv) {
      const usage = Math.min(100, connected / POWER_FACTOR / (inv.kva * 1000) * 100);
      meterFill.style.width = usage + '%';
      meterFill.classList.toggle('hot', usage >= 70);
      meterText.textContent = Math.round(usage) + '%';
    } else {
      meterFill.style.width = '100%';
      meterFill.classList.add('hot');
      meterText.textContent = '—';
    }

    loadText.textContent = 'Estimated load ' + fmtW(connected) + ' · about ' + dailyKwh.toFixed(1) + ' kWh over ' + hours + ' h.';
    cta.disabled = false;

    summary = 'Estimated requirement: ' + fmtW(connected) + ' load, about ' +
      (inv ? inv.kva + ' kVA / ' + volts + ' V inverter' : 'a custom-size inverter') + ', ' +
      batteryKwh.toFixed(1) + ' kWh battery (' + totalBatteries + ' x ' + BATTERY_VOLTS + ' V ' + BATTERY_AH + ' Ah) and ' +
      panels + ' x ' + pick.size + ' W solar panel' + (panels === 1 ? '' : 's') + '.';
  }

  // build one row per appliance
  APPLIANCES.forEach((a, i) => {
    const row = document.createElement('div');
    row.className = 'app';
    row.innerHTML =
      '<div class="app-info"><b>' + a.name + '</b><small>' + a.watts + ' W</small></div>' +
      '<div class="stepper">' +
        '<button type="button" aria-label="Remove one ' + a.name + '">−</button>' +
        '<span>0</span>' +
        '<button type="button" aria-label="Add one ' + a.name + '">+</button>' +
      '</div>';

    const buttons = row.querySelectorAll('button');
    const minus = buttons[0];
    const plus = buttons[1];
    const count = row.querySelector('span');

    function refresh() {
      count.textContent = qty[i];
      row.classList.toggle('on', qty[i] > 0);
      minus.disabled = qty[i] === 0;
      plus.disabled = qty[i] === MAX_EACH;
    }

    minus.addEventListener('click', () => { if (qty[i] > 0) { qty[i]--; refresh(); calculate(); } });
    plus.addEventListener('click', () => { if (qty[i] < MAX_EACH) { qty[i]++; refresh(); calculate(); } });

    refresh();
    list.appendChild(row);
  });

  hoursRange.addEventListener('input', calculate);

  // "Request a quote for this system": opens the Contact page with Solar ticked and the estimate in the message
  cta.addEventListener('click', () => {
    if (cta.disabled) return;
    window.location.href = 'contact.html?service=Solar&note=' + encodeURIComponent(summary);
  });

  showEmpty();
})();