// ==========================================================
// shared.js  -  runs on EVERY page.
// It builds the menu, the phone tab bar, the footer and the
// WhatsApp bubble, and runs dark mode and the small effects.
// Change your contact details here and every page updates.
// ==========================================================

// ---- SET THESE (used on every page) ----
const SITE = {
  whatsapp: '2348184406739',   // country code + number. spaces and + are cleaned up automatically
  phone: '+2348184406739',     // for the Call us button. keep the + and no spaces
  email: 'info@example.com'
};
// ----------------------------------------

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const pad = n => String(n).padStart(2, '0');

// digits only, and a local number like 0818... becomes 234818...
const WA_DIGITS = SITE.whatsapp.replace(/\D/g, '').replace(/^0/, '234').replace(/^2340/, '234');

// ---- the pages. add one here and it shows up in every menu ----
const PAGES = [
  { id: 'home',      label: 'Home',      href: 'index.html',     icon: 'i-home' },
  { id: 'services',  label: 'Services',  href: 'services.html',  icon: 'i-grid' },
  { id: 'estimator', label: 'Estimator', short: 'Estimate', href: 'estimator.html', icon: 'i-calc' },
  { id: 'about',     label: 'About',     href: 'about.html',     icon: 'i-info' },
  { id: 'contact',   label: 'Contact',   href: 'contact.html',   icon: 'i-chat' }
];
const current = document.body.dataset.page || 'home';   // each page says which one it is in <body data-page="...">

// ---- the icon library (hidden). every icon on the site comes from here ----
const SPRITE = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <symbol id="i-home" viewBox="0 0 24 24"><path d="M4 10.5L12 4l8 6.5V20H4z"/><path d="M10 20v-5h4v5"/></symbol>
  <symbol id="i-grid" viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></symbol>
  <symbol id="i-calc" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/></symbol>
  <symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></symbol>
  <symbol id="i-chat" viewBox="0 0 24 24"><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4A8 8 0 1 1 20 12z"/></symbol>
  <symbol id="i-panel" viewBox="0 0 24 24"><path d="M6 4h12l3 11H3z"/><path d="M4.5 9.5h15M10 4L8.5 15M14 4l1.5 11M12 15v5M8 20h8"/></symbol>
  <symbol id="i-inverter" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 12c1.5-3 3-3 4.5 0s3 3 4.5 0"/></symbol>
  <symbol id="i-battery" viewBox="0 0 24 24"><rect x="2.5" y="7" width="16" height="10" rx="2"/><path d="M21.5 10.5v3M10.5 9.5L8.5 12h3l-2 2.5"/></symbol>
  <symbol id="i-gauge" viewBox="0 0 24 24"><path d="M4 17a8 8 0 0 1 16 0"/><path d="M12 17l4-5M12 8.5V10"/></symbol>
  <symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/></symbol>
  <symbol id="i-power" viewBox="0 0 24 24"><path d="M12 3v8M7 6.3a8 8 0 1 0 10 0"/></symbol>
  <symbol id="i-wifi" viewBox="0 0 24 24"><path d="M3 9c5-5 13-5 18 0M6 12.5c3.5-3.3 8.5-3.3 12 0M9 16c1.7-1.6 4.3-1.6 6 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/></symbol>
  <symbol id="i-radio" viewBox="0 0 24 24"><circle cx="12" cy="10" r="1.8"/><path d="M12 12v9M8 6.5a5.5 5.5 0 0 0 0 7M16 6.5a5.5 5.5 0 0 1 0 7M5.5 4a9 9 0 0 0 0 12M18.5 4a9 9 0 0 1 0 12"/></symbol>
  <symbol id="i-ethernet" viewBox="0 0 24 24"><path d="M6 4h12v10h-3v4H9v-4H6z"/><path d="M9 8v3M12 8v3M15 8v3"/></symbol>
  <symbol id="i-router" viewBox="0 0 24 24"><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 16.5h.01M11 16.5h.01M8 13L6.5 6.5M16 13l1.5-6.5"/></symbol>
  <symbol id="i-server" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="7" rx="1.5"/><rect x="4" y="14" width="16" height="7" rx="1.5"/><path d="M8 6.5h.01M8 17.5h.01M12 6.5h5M12 17.5h5"/></symbol>
  <symbol id="i-tag" viewBox="0 0 24 24"><path d="M4 4h8l8 8-8 8-8-8z"/><path d="M8.5 8.5h.01"/></symbol>
  <symbol id="i-camera" viewBox="0 0 24 24"><rect x="3" y="7" width="13" height="10" rx="2.5"/><path d="M16 11l5-3v8l-5-3z"/></symbol>
  <symbol id="i-recorder" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="8" rx="2"/><path d="M7 15h.01M11 15h6"/></symbol>
  <symbol id="i-database" viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></symbol>
  <symbol id="i-phone" viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/></symbol>
  <symbol id="i-wrench" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></symbol>
  <symbol id="i-clipboard" viewBox="0 0 24 24"><rect x="5" y="4.5" width="14" height="16.5" rx="2.5"/><path d="M9 4.5V3h6v1.5M9 13l2 2 4-4"/></symbol>
  <symbol id="i-upgrade" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 16.5v-9M8.5 11L12 7.5l3.5 3.5"/></symbol>
  <symbol id="i-headset" viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></symbol>
</svg>`;

// ---- the menu at the top ----
const HEADER = `
<header class="nav-wrap">
  <div class="navbar">
    <a href="index.html" class="logo"><span class="logo-main">Routel</span><span class="logo-sub">Solutions</span></a>
    <nav aria-label="Main">${PAGES.map(p => `<a href="${p.href}"${p.id === current ? ' class="active" aria-current="page"' : ''}>${p.label}</a>`).join('')}</nav>
    <div class="nav-cta">
      <button class="theme-toggle" id="themeToggle" type="button" role="switch" aria-checked="false" aria-label="Dark mode">
        <span class="knob">
          <svg class="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
          <svg class="i-moon" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg>
        </span>
      </button>
      <a href="tel:${SITE.phone}" class="call-btn">Call us</a>
      <a href="contact.html" class="quote-btn">Get a quote <span class="arrow">→</span></a>
    </div>
  </div>
</header>`;

// ---- the footer ----
const FOOTER = `
<footer>
  <div class="foot-links">${PAGES.map(p => `<a href="${p.href}">${p.label}</a>`).join('')}</div>
  <p>&copy; 2026 Routel Solutions and Consults Ltd. All rights reserved.</p>
</footer>`;

// ---- the glass tab bar at the bottom of the phone screen ----
const TABS = `
<div class="tabbar" role="navigation" aria-label="Main">
  ${PAGES.map(p => `<a href="${p.href}" class="tab${p.id === current ? ' active' : ''}"${p.id === current ? ' aria-current="page"' : ''}><svg><use href="#${p.icon}"/></svg><span>${p.short || p.label}</span></a>`).join('')}
</div>`;

// ---- the floating WhatsApp bubble (not shown on the Contact page, which already has WhatsApp buttons) ----
const WA_FLOAT = current === 'contact' ? '' : `
<a href="#" data-wa id="waFloat" class="wa-float" aria-label="Chat with Routel on WhatsApp">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
  <span class="wa-label">Chat with us</span>
</a>`;

// ---- put them on the page ----
document.body.insertAdjacentHTML('afterbegin', SPRITE + HEADER);
document.querySelector('main').insertAdjacentHTML('afterend', FOOTER + TABS + WA_FLOAT);

// ---- FAQ accordion ----
document.querySelectorAll('.faq-list').forEach(list => {
  list.addEventListener('click', event => {
    const btn = event.target.closest('.faq-q');
    if (!btn || !list.contains(btn)) return;

    const item = btn.closest('.faq-item');
    const willOpen = !item.classList.contains('open');

    list.querySelectorAll('.faq-item.open').forEach(other => {
      other.classList.remove('open');
      other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });

    if (willOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// any link marked data-wa opens a WhatsApp chat with the number above
document.querySelectorAll('[data-wa]').forEach(a => {
  const text = a.dataset.waText || "Hi Routel, I'd like to make an enquiry.";
  a.href = 'https://wa.me/' + WA_DIGITS + '?text=' + encodeURIComponent(text);
  a.target = '_blank';
  a.rel = 'noopener';
});

// ---- the WhatsApp bubble: on Home it appears after you scroll, on other pages shortly after loading ----
const waFloat = document.getElementById('waFloat');
if (waFloat) {
  if (current === 'home') {
    let ticking = false;
    const check = () => { waFloat.classList.toggle('show', window.scrollY > 400); ticking = false; };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(check); } }, { passive: true });
    check();
  } else {
    setTimeout(() => waFloat.classList.add('show'), 700);
  }
}

// ---- dark / light mode switch ----
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
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  let chosen = null;
  try { chosen = localStorage.getItem('theme'); } catch (err) { /* ignore */ }
  if (!chosen) applyTheme(e.matches ? 'dark' : 'light', false);
});

// ---- buttons that lean toward the mouse (the nav button leans a lot, the glass ones only a little) ----
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

// ---- things fade up as they scroll into view ----
const revealItems = document.querySelectorAll('.card, .point, h2, [data-reveal]');
revealItems.forEach(item => item.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealItems.forEach(item => observer.observe(item));

// ---- the menu switches look: white over the hero photo, normal once you pass it ----
(function () {
  const header = document.querySelector('.nav-wrap');
  const hero = document.querySelector('.hero-track');
  if (!header) return;

  // on pages without the photo hero, the menu is always the normal look
  if (!hero) { header.classList.add('on-light'); return; }

  let ticking = false;
  const check = () => {
    // once the bottom of the hero has scrolled above the menu, switch to the normal look
    header.classList.toggle('on-light', hero.getBoundingClientRect().bottom < header.offsetHeight);
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(check); }
  }, { passive: true });
  window.addEventListener('resize', check);
  check();
})();