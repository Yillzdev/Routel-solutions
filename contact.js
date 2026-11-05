// ==========================================================
// contact.js  -  runs on the CONTACT page only.
// The quote builder (builds the WhatsApp / email message) and
// the FAQ. It also picks up anything sent from other pages,
// like a service from a card or an estimate from the estimator.
// ==========================================================

// ---- the quote builder ----
(function () {
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

  // "Solar", "Solar and Surveillance", "Solar, Surveillance and Support"
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
    mailBtn.href = 'mailto:' + SITE.email + '?subject=' + encodeURIComponent('Quote request') + '&body=' + encodeURIComponent(msg);
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

  // anything sent from another page arrives in the address, like contact.html?service=Solar&note=...
  const params = new URLSearchParams(window.location.search);
  params.getAll('service').forEach(value => {
    const chip = Array.from(serviceChips).find(c => c.dataset.value === value);
    if (chip) {
      chip.setAttribute('aria-pressed', 'true');
      chip.classList.add('flash');
    }
  });
  const noteFromUrl = params.get('note');
  if (noteFromUrl) noteInput.value = noteFromUrl.slice(0, 300);

  update();
})();
