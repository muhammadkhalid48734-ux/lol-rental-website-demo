// Leaps of Laughter demo: all interactions. Vanilla JS, no dependencies, no network calls.
// Demo only: submitting the form never sends anything anywhere.

const STORE = 'lol-demo-request-v1';
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const COLORS = ['#ffc933', '#5ad1f2', '#ff4d4d', '#ffffff', '#ff8ac4'];

/* ------------------------------------------------------------------ */
/* Header: mobile menu + scroll-spy                                    */
/* ------------------------------------------------------------------ */
const menuBtn = $('[data-menu]');
const nav = $('[data-nav]');
function setMenu(open) {
  menuBtn.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
}
menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
});
document.addEventListener('click', (e) => {
  if (nav.classList.contains('is-open') && !e.target.closest('[data-header]')) setMenu(false);
});

const navLinks = $$('a[href^="#"]', nav);
const spyTargets = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window) {
  const spy = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        navLinks.forEach((a) => {
          const on = a.getAttribute('href') === `#${en.target.id}`;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      }
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  spyTargets.forEach((t) => spy.observe(t));
}

/* ------------------------------------------------------------------ */
/* Scroll reveal                                                       */
/* ------------------------------------------------------------------ */
const revealEls = $$('.reveal');
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const el = en.target;
        const sibs = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains('reveal')) : [el];
        el.style.setProperty('--rd', `${Math.min(sibs.indexOf(el) % 3, 2) * 90}ms`);
        el.classList.add('is-in');
        io.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-in'));
}

/* ------------------------------------------------------------------ */
/* Hero collage: gentle pointer parallax (fine pointers only)          */
/* ------------------------------------------------------------------ */
const collage = $('[data-parallax]');
if (collage && finePointer.matches && !reduceMotion.matches) {
  const layers = $$('[data-depth]', collage);
  const hero = collage.closest('.hero');
  let raf = 0;
  hero.addEventListener('pointermove', (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      for (const l of layers) {
        const d = Number(l.dataset.depth);
        l.style.setProperty('--px', `${(nx * d).toFixed(1)}px`);
        l.style.setProperty('--py', `${(ny * d).toFixed(1)}px`);
      }
    });
  });
}

/* ------------------------------------------------------------------ */
/* Card art: subtle 3D tilt (fine pointers only)                       */
/* ------------------------------------------------------------------ */
if (finePointer.matches && !reduceMotion.matches) {
  $$('.card .art').forEach((art) => {
    const svg = $('.art-svg', art);
    art.addEventListener('pointermove', (e) => {
      const r = art.getBoundingClientRect();
      svg.style.setProperty('--rx', `${(((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2)}deg`);
      svg.style.setProperty('--ry', `${(-((e.clientY - r.top) / r.height - 0.5) * 8).toFixed(2)}deg`);
    });
    art.addEventListener('pointerleave', () => {
      svg.style.removeProperty('--rx');
      svg.style.removeProperty('--ry');
    });
  });
}

/* ------------------------------------------------------------------ */
/* "My request" builder                                                */
/* ------------------------------------------------------------------ */
const cards = $$('[data-rental]');
const catalog = new Map(
  cards.map((c) => [c.dataset.id, { id: c.dataset.id, name: c.dataset.name, price: c.dataset.price, art: c.dataset.art }])
);

const bar = $('#request-bar');
const barCount = $('#bar-count');
const barItems = $('#bar-items');
const barThumbs = $('#bar-thumbs');
const live = $('#request-live');
const form = $('#request-form');
const pickedList = $('#picked-list');
const pickedEmpty = $('#picked-empty');
const itemsField = $('#items-field');
const confirmBox = $('#confirm');
const summary = $('#confirm-summary');

let selected = load();

function load() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(STORE) || '[]');
    return Array.isArray(raw) ? raw.filter((id) => catalog.has(id)) : [];
  } catch {
    return [];
  }
}
function save() {
  try { sessionStorage.setItem(STORE, JSON.stringify(selected)); } catch { /* storage unavailable: fine */ }
}
const names = () => selected.map((id) => catalog.get(id).name);

function announce(msg) {
  live.textContent = '';
  requestAnimationFrame(() => { live.textContent = msg; });
}

const SVG_NS = 'http://www.w3.org/2000/svg';
function artSvg(art, slice = false) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 400 280');
  svg.setAttribute('aria-hidden', 'true');
  if (slice) svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#art-${art}`);
  svg.append(use);
  return svg;
}

function render() {
  const n = selected.length;

  for (const card of cards) {
    const on = selected.includes(card.dataset.id);
    const btn = $('[data-add]', card);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? `Remove ${card.dataset.name} from my request` : `Add ${card.dataset.name} to my request`);
    $('.add-label', btn).textContent = on ? 'Added' : 'Add to my request';
    card.classList.toggle('is-picked', on);
  }

  barCount.textContent = String(n);
  barItems.textContent = names().join(', ');
  bar.classList.toggle('is-open', n > 0);
  bar.toggleAttribute('inert', n === 0);
  document.documentElement.classList.toggle('has-request', n > 0);

  // Overlapping thumbnails in the bar (last three picks)
  barThumbs.replaceChildren(
    ...selected.slice(-3).map((id) => {
      const t = document.createElement('span');
      t.className = 'bar-thumb';
      t.dataset.art = catalog.get(id).art;
      t.append(artSvg(catalog.get(id).art, true));
      return t;
    })
  );

  pickedList.replaceChildren(
    ...selected.map((id) => {
      const item = catalog.get(id);
      const li = document.createElement('li');
      const thumb = document.createElement('span');
      thumb.className = 'thumb';
      thumb.dataset.art = item.art;
      thumb.append(artSvg(item.art, true));
      const label = document.createElement('span');
      label.className = 'picked-name';
      label.textContent = item.name;
      const price = document.createElement('span');
      price.className = 'picked-price';
      price.textContent = `$${item.price}`;
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'picked-remove';
      rm.dataset.remove = id;
      rm.setAttribute('aria-label', `Remove ${item.name}`);
      rm.textContent = '×';
      li.append(thumb, label, price, rm);
      return li;
    })
  );
  pickedEmpty.hidden = n > 0;
  itemsField.value = names().join(', ');
}

/* Sparks: a small burst of confetti from a point */
function burst(x, y, count = 14) {
  if (reduceMotion.matches) return;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    const size = 7 + Math.random() * 7;
    s.style.cssText = `width:${size}px;height:${size}px;background:${COLORS[i % COLORS.length]};border-radius:${i % 3 === 0 ? '50%' : '2px'};border:2px solid #1a0b2e`;
    document.body.append(s);
    const a = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 70;
    const dx = Math.cos(a) * dist;
    const dy = Math.sin(a) * dist - 20;
    const anim = s.animate(
      [
        { transform: `translate(${x}px, ${y}px) scale(.4) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${x + dx}px, ${y + dy}px) scale(1) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${x + dx * 1.15}px, ${y + dy + 40}px) scale(.8) rotate(${Math.random() * 540}deg)`, opacity: 0 },
      ],
      { duration: 650 + Math.random() * 250, easing: 'cubic-bezier(.2,.8,.3,1)' }
    );
    anim.onfinish = () => s.remove();
  }
}

/* The picture "flies" from the card into the My request bar */
function fly(card) {
  if (reduceMotion.matches) return;
  const art = $('.art', card);
  const from = art.getBoundingClientRect();
  const clone = document.createElement('div');
  clone.className = 'fly';
  clone.dataset.art = card.dataset.art;
  const w = Math.min(from.width, 200);
  const h = w * 0.7;
  clone.style.width = `${w}px`;
  clone.style.height = `${h}px`;
  clone.append(artSvg(card.dataset.art, true));
  document.body.append(clone);
  const barRect = bar.getBoundingClientRect();
  const tx = barRect.left + 54 - w / 2;
  const ty = window.innerHeight - 42 - h / 2;
  const sx = from.left + from.width / 2 - w / 2;
  const sy = from.top + from.height / 2 - h / 2;
  const anim = clone.animate(
    [
      { transform: `translate(${sx}px, ${sy}px) scale(1) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${(sx + tx) / 2}px, ${Math.min(sy, ty) - 60}px) scale(.6) rotate(-8deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${tx}px, ${ty}px) scale(.18) rotate(6deg)`, opacity: 0.2 },
    ],
    { duration: 650, easing: 'cubic-bezier(.5,0,.3,1)' }
  );
  anim.onfinish = () => {
    clone.remove();
    barCount.closest('.request-bar-title').animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
      { duration: 320, easing: 'ease-out' }
    );
  };
}

function toggle(id, sourceBtn) {
  const i = selected.indexOf(id);
  const item = catalog.get(id);
  const card = cards.find((c) => c.dataset.id === id);
  if (i === -1) selected.push(id); else selected.splice(i, 1);
  save();
  render();
  if (i === -1 && sourceBtn && card) {
    const r = sourceBtn.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2);
    fly(card);
  }
  announce(`${i === -1 ? 'Added' : 'Removed'} ${item.name}. ${selected.length} ${selected.length === 1 ? 'item' : 'items'} in my request.`);
}

$('#grid').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add]');
  if (btn) toggle(btn.closest('[data-rental]').dataset.id, btn);
});

pickedList.addEventListener('click', (e) => {
  const rm = e.target.closest('[data-remove]');
  if (!rm) return;
  toggle(rm.dataset.remove);
  ($('[data-remove]', pickedList) || $('#f-name'))?.focus();
});

$('#bar-open').addEventListener('click', () => {
  $('#request').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  const heading = $('#request-h');
  window.setTimeout(() => heading.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 500);
});

/* Filter chips */
const chips = $$('[data-filter]');
const filterStatus = $('#filter-status');
chips.forEach((chip) =>
  chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    let shown = 0;
    for (const card of cards) {
      const show = f === 'all' || card.dataset.cat === f;
      card.hidden = !show;
      card.classList.remove('pop-in');
      if (show) {
        card.classList.add('is-in');
        if (!reduceMotion.matches) {
          void card.offsetWidth; // restart the animation
          card.style.setProperty('--rd', '0s');
          card.classList.add('pop-in');
        }
        shown += 1;
      }
    }
    filterStatus.textContent = `Showing ${shown} ${shown === 1 ? 'rental' : 'rentals'}`;
  })
);

/* Event date can't be in the past */
const dateInput = $('#f-date');
const t = new Date();
const pad = (n) => String(n).padStart(2, '0');
dateInput.min = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;

function prettyDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/* Demo submit: show the confirmation, send nothing. */
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const data = new FormData(form);
  const rows = [
    ['Name', data.get('name')],
    ['Phone', data.get('phone')],
    ['Email', data.get('email')],
    ['Event date', data.get('date') ? prettyDate(String(data.get('date'))) : ''],
    ['ZIP', data.get('zip')],
    ['Items', names().join(', ') || 'None chosen'],
    ['Notes', data.get('notes')],
  ].filter(([, v]) => v && String(v).trim());

  summary.replaceChildren(
    ...rows.flatMap(([k, v]) => {
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = k;
      dd.textContent = String(v);
      return [dt, dd];
    })
  );
  // The summary captured the chosen items; clear the live selection so the bar
  // doesn't linger over the confirmation.
  selected = [];
  save();
  render();
  form.hidden = true;
  confirmBox.hidden = false;
  confirmBox.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
  confirmBox.focus({ preventScroll: true });
  const r = confirmBox.getBoundingClientRect();
  burst(r.left + r.width / 2, Math.max(120, r.top + 80), 26);
});

$('#restart').addEventListener('click', () => {
  form.reset();
  confirmBox.hidden = true;
  form.hidden = false;
  $('#f-name').focus();
});

render();
