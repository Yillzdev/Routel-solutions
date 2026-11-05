// ==========================================================
// home.js  -  runs on the HOME page only.
// Service card hover states and hero behavior.
// ==========================================================

const cards = document.querySelectorAll('.card');
const track = document.querySelector('.cards');

// ---- the card under the mouse keeps its hover look, even while scrolling ----
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
  if (e.pointerType !== 'mouse') return;
  lastX = e.clientX;
  lastY = e.clientY;
  updateCards();
});

if (canHover) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { updateCards(); ticking = false; });
  }, { passive: true });
}

if (track) {
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = 0;

  track.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
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
    if (moved > 5) track.scrollLeft = startScroll - dx;
  });

  const step = () => {
    const card = track.querySelector('.card');
    return card ? card.getBoundingClientRect().width + 22 : track.clientWidth * 0.8;
  };
  const next = document.getElementById('next');
  const prev = document.getElementById('prev');
  next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
}

// ---- the hero numbers count up when they come into view ----
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

document.addEventListener("DOMContentLoaded", () => {
  const heroQuoteBtn = document.querySelector('.hero-cta .cta-pill');

  if (heroQuoteBtn) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting && entry.boundingClientRect.top < 100) {
          document.body.classList.add('show-nav-btn');
        } else {
          document.body.classList.remove('show-nav-btn');
        }
      });
    }, { rootMargin: "-80px 0px 0px 0px" });

    observer.observe(heroQuoteBtn);
  }
});
