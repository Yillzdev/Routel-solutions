// ===== 0. Helpers =====
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const pad = n => String(n).padStart(2, '0');

const cards = document.querySelectorAll('.card');
const track = document.querySelector('.cards');
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a');

// ===== 1. Scroll reveal =====
const items = document.querySelectorAll('.card, .point, h2');
items.forEach(item => item.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

items.forEach(item => observer.observe(item));

// ===== 2. Keep the hover look on the card under the mouse, even while scrolling =====
let lastX = null, lastY = null;

function updateCards() {
  if (lastX === null) return;
  cards.forEach(card => {
    const r = card.getBoundingClientRect();
    const inside = lastX >= r.left && lastX <= r.right &&
                   lastY >= r.top  && lastY <= r.bottom;
    card.classList.toggle('active', inside);
  });
}

window.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;      // ignore taps on phones
  lastX = e.clientX;
  lastY = e.clientY;
  updateCards();
});

// ===== 3. Slide the cards by dragging with the mouse =====
let isDown = false;
let startX = 0;
let startScroll = 0;
let moved = 0;

track.addEventListener('mousedown', e => {
  isDown = true;
  moved = 0;
  startX = e.pageX;
  startScroll = track.scrollLeft;
});

window.addEventListener('mouseup', () => {
  isDown = false;
  track.classList.remove('dragging');
});

window.addEventListener('mousemove', e => {
  if (!isDown) return;
  const dx = e.pageX - startX;
  moved = Math.max(moved, Math.abs(dx));
  if (moved > 5) track.classList.add('dragging');
  track.scrollLeft = startScroll - dx;
});

// ===== 4. Arrow buttons =====
const step = () => track.querySelector('.card').offsetWidth + 22;
document.getElementById('next').addEventListener('click', () => track.scrollBy({ left: step(),  behavior: 'smooth' }));
document.getElementById('prev').addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));

// ===== 5. Tap a card to open it (phones only, where there is no hover) =====
cards.forEach(card => {
  card.addEventListener('click', () => {
    if (moved > 5) return;
    if (!window.matchMedia('(hover: none)').matches) return;
    cards.forEach(c => { if (c !== card) c.classList.remove('open'); });
    card.classList.toggle('open');
  });
});

// ===== 6. Highlight the nav link for the section you are in =====
function updateNav() {
  let current = '';
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

  if (atBottom) {
    current = sections[sections.length - 1].id;   // always light up Contact at the very bottom
  } else {
    sections.forEach(s => {
      if (s.getBoundingClientRect().top <= window.innerHeight * 0.4) current = s.id;
    });
  }

  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateNav();
    if (canHover) updateCards();
    ticking = false;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
updateNav();

// ===== 7. Count-up numbers in the hero (starts when they come into view) =====
function countUp(el) {
  const target = Number(el.dataset.count);
  if (reduceMotion) { el.textContent = pad(target); return; }

  const duration = 900;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = pad(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      countUp(entry.target);
      countObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

// ===== 8. Magnetic buttons (they lean toward the mouse) =====
// the nav "Get a quote" button leans a lot; the glass contact buttons only lean a little and lift 2px
if (canHover && !reduceMotion) {
  document.querySelectorAll('.quote-btn, .btn').forEach(btn => {
    const soft = btn.classList.contains('btn');
    const pullX = soft ? 0.06 : 0.25;
    const pullY = soft ? 0.10 : 0.35;
    const lift  = soft ? -2 : 0;

    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * pullX;
      const y = (e.clientY - (r.top + r.height / 2)) * pullY + lift;
      btn.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });
}

// ===== 9. Dark / light mode switch =====
const root = document.documentElement;
const themeBtn = document.getElementById('themeToggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme, save) {
  root.setAttribute('data-theme', theme);
  themeBtn.setAttribute('aria-checked', String(theme === 'dark'));
  if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#0a1022' : '#2563eb');
  if (save) {
    try { localStorage.setItem('theme', theme); } catch (e) { /* storage blocked: that is fine */ }
  }
}

applyTheme(root.getAttribute('data-theme') || 'light', false);

themeBtn.addEventListener('click', () => {
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
});

// if the visitor never pressed the switch, follow their device when it changes
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
systemDark.addEventListener('change', e => {
  let chosen = null;
  try { chosen = localStorage.getItem('theme'); } catch (err) { /* ignore */ }
  if (!chosen) applyTheme(e.matches ? 'dark' : 'light', false);
});

// ===== 10. Quote builder (Contact section) =====
(function () {
  // ---- SET THESE TWO ----
  const WHATSAPP_NUMBER = '2348184406739';   // country code + number. spaces and + are cleaned up automatically
  const EMAIL = 'info@example.com';
  // -----------------------

  // keeps digits only, and turns a local number like 0818... into 234818...
  const WA_DIGITS = WHATSAPP_NUMBER.replace(/\D/g, '').replace(/^0/, '234').replace(/^2340/, '234');

  const box = document.getElementById('quoteBox');
  if (!box) return;

  const serviceChips = box.querySelectorAll('[data-group="services"] .chip');
  const placeChips = box.querySelectorAll('[data-group="place"] .chip');
  const nameInput = document.getElementById('qName');
  const noteInput = document.getElementById('qNote');
  const bubble = document.getElementById('qBubble');
  const waBtn = document.getElementById('sendWa');
  const mailBtn = document.getElementById('sendMail');

  const placeWords = { 'Home': 'a home', 'Office': 'an office', 'Estate': 'an estate', 'Remote site': 'a remote site' };
  const isOn = chip => chip.getAttribute('aria-pressed') === 'true';

  // "Solar", "Solar and CCTV cameras", "Solar, CCTV cameras and Support"
  function joinList(list) {
    if (list.length <= 1) return list.join('');
    return list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
  }

  function buildMessage() {
    const services = Array.from(serviceChips).filter(isOn).map(c => c.dataset.value);
    const placeChip = Array.from(placeChips).find(isOn);
    const place = placeChip ? placeWords[placeChip.dataset.value] : '';
    const name = nameInput.value.trim();
    const note = noteInput.value.trim().replace(/\s+/g, ' ');

    let msg;
    if (services.length && place) msg = 'Hi Routel, I need ' + joinList(services) + ' for ' + place + '.';
    else if (services.length)     msg = 'Hi Routel, I need ' + joinList(services) + '.';
    else if (place)               msg = "Hi Routel, I'd like a quote for " + place + '.';
    else                          msg = "Hi Routel, I'd like to make an enquiry.";

    if (note) msg += ' ' + (/[.!?]$/.test(note) ? note : note + '.');
    if (name) msg += ' My name is ' + name + '.';
    return msg;
  }

  let lastMsg = '';
  function update() {
    const msg = buildMessage();
    bubble.textContent = msg;
    if (msg !== lastMsg) {                      // little pop whenever the message changes
      bubble.classList.remove('pop');
      void bubble.offsetWidth;
      bubble.classList.add('pop');
      lastMsg = msg;
    }
    waBtn.href = 'https://wa.me/' + WA_DIGITS + '?text=' + encodeURIComponent(msg);
    mailBtn.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Quote request') + '&body=' + encodeURIComponent(msg);
  }

  // services: tap to switch each one on or off
  serviceChips.forEach(chip => chip.addEventListener('click', () => {
    chip.setAttribute('aria-pressed', isOn(chip) ? 'false' : 'true');
    update();
  }));

  // place: pick one (tap it again to clear)
  placeChips.forEach(chip => chip.addEventListener('click', () => {
    const wasOn = isOn(chip);
    placeChips.forEach(c => c.setAttribute('aria-pressed', 'false'));
    chip.setAttribute('aria-pressed', wasOn ? 'false' : 'true');
    update();
  }));

  nameInput.addEventListener('input', update);
  noteInput.addEventListener('input', update);

  // "Request a quote" button inside each card pop-up
  const tagToService = {
    'Solar': 'Solar',
    'Networking': 'Networking & Wi-Fi',
    'Security': 'CCTV cameras',
    'Support': 'Maintenance & support'
  };

  document.querySelectorAll('.card').forEach(card => {
    const panel = card.querySelector('.card-more');
    const tag = card.querySelector('.tag');
    if (!panel || !tag) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'req-btn';
    btn.textContent = 'Request a quote →';

    btn.addEventListener('click', e => {
      e.stopPropagation();                      // don't let the phone tap-to-close run
      const wanted = tagToService[tag.textContent.trim()];
      const chip = Array.from(serviceChips).find(c => c.dataset.value === wanted);
      if (chip) {
        chip.setAttribute('aria-pressed', 'true');
        update();
      }
      card.classList.remove('open');
      document.getElementById('contact').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      if (chip) {
        chip.classList.remove('flash');
        void chip.offsetWidth;
        chip.classList.add('flash');
      }
    });

    panel.appendChild(btn);
  });

  // fade the box in as it scrolls into view, like the other sections
  box.classList.add('reveal');
  observer.observe(box);

  update();
})();

// ===== 11. Solar system estimator =====
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

  // "Request a quote for this system": ticks Solar in the quote builder and adds the estimate to the note
  cta.addEventListener('click', () => {
    if (cta.disabled) return;
    const solarChip = document.querySelector('#quoteBox [data-group="services"] .chip[data-value="Solar"]');
    const noteInput = document.getElementById('qNote');
    if (solarChip && solarChip.getAttribute('aria-pressed') !== 'true') solarChip.click();
    if (noteInput) {
      noteInput.value = summary;
      noteInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    document.getElementById('contact').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  box.classList.add('reveal');
  observer.observe(box);

  showEmpty();
})();

// ===== 12. FAQ accordion =====
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const willOpen = !item.classList.contains('open');

    // only one answer open at a time
    document.querySelectorAll('.faq-item.open').forEach(other => {
      other.classList.remove('open');
      other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });

    if (willOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// ===== 13. Floating WhatsApp button =====
(function () {
  const btn = document.getElementById('waFloat');
  if (!btn) return;

  // uses the same number as the quote builder (set at the top of section 10), so the number lives in one place
  const sendWa = document.getElementById('sendWa');
  const match = sendWa ? /wa\.me\/(\d+)/.exec(sendWa.href) : null;
  if (!match) { btn.remove(); return; }
  btn.href = 'https://wa.me/' + match[1] + '?text=' + encodeURIComponent("Good day Routel, I'd like to make an enquiry.");

  const hero = document.getElementById('home');
  const contact = document.getElementById('contact');
  let pastHero = false;
  let atContact = false;

  // show it after the hero, and hide it while the quote form is on screen
  const apply = () => btn.classList.toggle('show', pastHero && !atContact);

  new IntersectionObserver(entries => {
    pastHero = entries[0].intersectionRatio < 0.35;
    apply();
  }, { threshold: [0, 0.35] }).observe(hero);

  new IntersectionObserver(entries => {
    atContact = entries[0].intersectionRatio > 0.15;
    apply();
  }, { threshold: [0, 0.15] }).observe(contact);
})()