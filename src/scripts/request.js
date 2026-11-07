// Leaps of Laughter demo: all interactions. Vanilla JS, no dependencies, no network calls.
// Demo only: submitting the form never sends anything anywhere.
// Calendar availability is SAMPLE data (see sample-availability.js).

import { calendar, iso, parse, fmt } from './calendar.js';
import { isBooked } from './sample-availability.js';

const STORE = 'lol-demo-request-v2';
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const mobileDock = window.matchMedia('(max-width: 899px)');
const root = document.documentElement;
const COLORS = ['#ffc933', '#5ad1f2', '#ff4d4d', '#ffffff', '#ff8ac4'];
const money = (n) => `$${n}`;
const LONG = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };

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
/* Hero parallax + card tilt (fine pointers only)                      */
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
if (finePointer.matches && !reduceMotion.matches) {
  $$('.card .art').forEach((art) => {
    const svg = $('.art-svg', art);
    art.addEventListener('pointermove', (e) => {
      const r = art.getBoundingClientRect();
      svg.style.setProperty('--rx', `${(((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2)}deg`);
      svg.style.setProperty('--ry', `${(-((e.clientY - r.top) / r.height - 0.5) * 8).toFixed(2)}deg`);
    });
    art.addEventListener('pointerleave', () => { svg.style.removeProperty('--rx'); svg.style.removeProperty('--ry'); });
  });
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */
const cards = $$('[data-rental]');
const grid = $('#grid');
const catalog = new Map(
  cards.map((c) => [c.dataset.id, { id: c.dataset.id, name: c.dataset.name, price: Number(c.dataset.price), art: c.dataset.art }])
);
const ids = [...catalog.keys()];
const OFTEN_TRIGGERS = (grid.dataset.oftenTriggers || '').split(',').filter(Boolean);
const OFTEN_ITEMS = (grid.dataset.oftenItems || '').split(',').filter((id) => catalog.has(id));

const todayIso = iso(new Date());
const maxIso = iso(new Date(new Date().getFullYear(), new Date().getMonth() + 12, 0));
const validDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= todayIso && v <= maxIso;

let selected = [];
let date = '';
try {
  const saved = JSON.parse(sessionStorage.getItem(STORE) || '{}');
  if (Array.isArray(saved.items)) selected = saved.items.filter((id) => catalog.has(id));
  if (validDate(saved.date)) date = saved.date;
} catch { /* storage unavailable: fine */ }
function save() {
  try { sessionStorage.setItem(STORE, JSON.stringify({ items: selected, date })); } catch { /* ignore */ }
}

const names = () => selected.map((id) => catalog.get(id).name);
const total = () => selected.reduce((sum, id) => sum + catalog.get(id).price, 0);
const bookedOn = (id) => !!date && isBooked(id, date);

const bar = $('#request-bar');
const panel = $('#rb-panel');
const rbToggle = $('#rb-toggle');
const rbList = $('#rb-list');
const barThumbs = $('#bar-thumbs');
const live = $('#request-live');
const form = $('#request-form');
const pickedList = $('#picked-list');
const pickedEmpty = $('#picked-empty');
const itemsField = $('#items-field');
const confirmBox = $('#confirm');
const summary = $('#confirm-summary');
const dateInput = $('#f-date');
const cb = $('#contact-bar');
let formInView = false;

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
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */
function itemLi(id) {
  const item = catalog.get(id);
  const li = el('li');
  const thumb = el('span', 'thumb');
  thumb.dataset.art = item.art;
  thumb.append(artSvg(item.art, true));
  const label = el('span', 'picked-name', item.name);
  if (bookedOn(id)) label.append(el('span', 'picked-warn', 'Booked that day (sample)'));
  const rm = el('button', 'picked-remove', '×');
  rm.type = 'button';
  rm.dataset.remove = id;
  rm.setAttribute('aria-label', `Remove ${item.name}`);
  li.append(thumb, label, el('span', 'picked-price', money(item.price)), rm);
  return li;
}

function renderOften(box) {
  const show = selected.some((id) => OFTEN_TRIGGERS.includes(id));
  const suggestions = OFTEN_ITEMS.filter((id) => !selected.includes(id));
  if (!show || suggestions.length === 0) { box.hidden = true; box.replaceChildren(); return; }
  const list = el('ul', 'often-list');
  for (const id of suggestions) {
    const item = catalog.get(id);
    const li = el('li');
    const b = el('button', 'often-chip');
    b.type = 'button';
    b.dataset.often = id;
    b.disabled = bookedOn(id);
    b.setAttribute('aria-label', `Add ${item.name}, ${money(item.price)}${b.disabled ? ', booked that day' : ''}`);
    b.append(el('span', null, `+ ${item.name}`), el('b', null, money(item.price)));
    li.append(b);
    list.append(li);
  }
  box.replaceChildren(el('p', 'often-title', 'Often added'), list);
  box.hidden = false;
}

function dock() {
  let h = 0;
  if (bar.classList.contains('is-open')) h = bar.offsetHeight + 28;
  else if (mobileDock.matches && !formInView && !selected.length) h = cb.offsetHeight + 28;
  root.style.setProperty('--dock', `${h}px`);
}

function render() {
  const n = selected.length;

  for (const card of cards) {
    const id = card.dataset.id;
    const on = selected.includes(id);
    const booked = bookedOn(id);
    const btn = $('[data-add]', card);
    syncAdd(btn, id, on, booked, card.dataset.name);
    card.classList.toggle('is-picked', on);
  }

  $('#bar-count').textContent = String(n);
  $('#bar-items').textContent = names().join(', ');
  $('#bar-total').textContent = money(total());
  bar.classList.toggle('is-open', n > 0);
  bar.toggleAttribute('inert', n === 0);
  root.classList.toggle('has-request', n > 0);
  if (n === 0) setPanel(false);

  barThumbs.replaceChildren(
    ...selected.slice(-3).map((id) => {
      const t = el('span', 'bar-thumb');
      t.dataset.art = catalog.get(id).art;
      t.append(artSvg(catalog.get(id).art, true));
      return t;
    })
  );

  pickedList.replaceChildren(...selected.map(itemLi));
  rbList.replaceChildren(...selected.map(itemLi));
  renderOften($('#rb-often'));
  renderOften($('#form-often'));
  pickedEmpty.hidden = n > 0;
  $('#form-total-row').hidden = n === 0;
  $('#form-total').textContent = money(total());
  itemsField.value = names().join(', ');
  syncDetail();
  dock();
}

function syncAdd(btn, id, on, booked, name) {
  btn.setAttribute('aria-pressed', String(on));
  btn.disabled = booked && !on;
  const label = on ? 'Added' : booked ? 'Booked that day' : 'Add to my request';
  btn.setAttribute('aria-label', on ? `Remove ${name} from my request` : booked ? `${name} is booked that day (sample)` : `Add ${name} to my request`);
  $('.add-label', btn).textContent = label;
}

function setPanel(open) {
  panel.hidden = !open;
  rbToggle.setAttribute('aria-expanded', String(open));
  dock();
}
rbToggle.addEventListener('click', () => setPanel(panel.hidden));
bar.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { setPanel(false); rbToggle.focus(); } });
if ('ResizeObserver' in window) { const ro = new ResizeObserver(dock); ro.observe(bar); ro.observe(cb); }
window.addEventListener('resize', dock);

/* ------------------------------------------------------------------ */
/* Sparks + fly-to-bar                                                 */
/* ------------------------------------------------------------------ */
function burst(x, y, count = 14) {
  if (reduceMotion.matches) return;
  for (let i = 0; i < count; i++) {
    const s = el('span', 'spark');
    const size = 7 + Math.random() * 7;
    s.style.cssText = `width:${size}px;height:${size}px;background:${COLORS[i % COLORS.length]};border-radius:${i % 3 === 0 ? '50%' : '2px'};border:2px solid #1a0b2e`;
    document.body.append(s);
    const a = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 70;
    const dx = Math.cos(a) * dist;
    const dy = Math.sin(a) * dist - 20;
    s.animate(
      [
        { transform: `translate(${x}px, ${y}px) scale(.4) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${x + dx}px, ${y + dy}px) scale(1) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${x + dx * 1.15}px, ${y + dy + 40}px) scale(.8) rotate(${Math.random() * 540}deg)`, opacity: 0 },
      ],
      { duration: 650 + Math.random() * 250, easing: 'cubic-bezier(.2,.8,.3,1)' }
    ).onfinish = () => s.remove();
  }
}

function fly(card) {
  if (reduceMotion.matches) return;
  const from = $('.art', card).getBoundingClientRect();
  const clone = el('div', 'fly');
  clone.dataset.art = card.dataset.art;
  const w = Math.min(from.width, 200);
  const h = w * 0.7;
  clone.style.width = `${w}px`;
  clone.style.height = `${h}px`;
  clone.append(artSvg(card.dataset.art, true));
  document.body.append(clone);
  const barRect = bar.getBoundingClientRect();
  const tx = barRect.left + 54 - w / 2;
  const ty = window.innerHeight - 64 - h / 2;
  const sx = from.left + from.width / 2 - w / 2;
  const sy = from.top + from.height / 2 - h / 2;
  clone.animate(
    [
      { transform: `translate(${sx}px, ${sy}px) scale(1) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${(sx + tx) / 2}px, ${Math.min(sy, ty) - 60}px) scale(.6) rotate(-8deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${tx}px, ${ty}px) scale(.18) rotate(6deg)`, opacity: 0.2 },
    ],
    { duration: 650, easing: 'cubic-bezier(.5,0,.3,1)' }
  ).onfinish = () => {
    clone.remove();
    $('.request-bar-title', bar).animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' });
  };
}

/* ------------------------------------------------------------------ */
/* Add / remove                                                        */
/* ------------------------------------------------------------------ */
function toggle(id, sourceBtn, withFly = true) {
  const i = selected.indexOf(id);
  if (i === -1 && bookedOn(id)) return;
  const item = catalog.get(id);
  const card = cards.find((c) => c.dataset.id === id);
  if (i === -1) selected.push(id); else selected.splice(i, 1);
  save();
  render();
  if (i === -1 && sourceBtn) {
    const r = sourceBtn.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2);
    if (withFly && card) fly(card);
  }
  announce(`${i === -1 ? 'Added' : 'Removed'} ${item.name}. ${selected.length} ${selected.length === 1 ? 'item' : 'items'} in my request. Estimated total ${money(total())}.`);
}

grid.addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  if (add) { toggle(add.closest('[data-rental]').dataset.id, add); return; }
  const det = e.target.closest('[data-details]');
  if (det) openDetail(det.closest('[data-rental]').dataset.id);
});

document.addEventListener('click', (e) => {
  const rm = e.target.closest('[data-remove]');
  if (rm) {
    const inBar = !!rm.closest('#rb-list');
    toggle(rm.dataset.remove);
    const next = $('[data-remove]', inBar ? rbList : pickedList);
    (next || (inBar ? rbToggle : $('#f-name')))?.focus();
    return;
  }
  const often = e.target.closest('[data-often]');
  if (often) toggle(often.dataset.often, often, false);
});

$('#bar-open').addEventListener('click', () => {
  $('#request').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  const heading = $('#request-h');
  window.setTimeout(() => heading.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 500);
});

/* ------------------------------------------------------------------ */
/* Filter chips                                                        */
/* ------------------------------------------------------------------ */
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
        if (!reduceMotion.matches) { void card.offsetWidth; card.classList.add('pop-in'); }
        shown += 1;
      }
    }
    filterStatus.textContent = `Showing ${shown} ${shown === 1 ? 'rental' : 'rentals'}`;
  })
);

/* ------------------------------------------------------------------ */
/* Date: main calendar + date-filtered grid (SAMPLE availability)      */
/* ------------------------------------------------------------------ */
dateInput.min = todayIso;
const dateStatus = $('#date-status');
const dateClear = $('#date-clear');

let mainCal = null;
function initMainCal() {
  if (mainCal) return;
  mainCal = calendar($('#main-cal'), {
  value: date,
  legend: [{ cls: '', text: 'All free' }, { cls: 'l1', text: 'Some booked' }, { cls: 'l2', text: 'Many booked' }, { cls: 'l3', text: 'Mostly booked' }],
  state: (i) => {
    const n = ids.filter((id) => isBooked(id, i)).length;
    return { cls: n >= 6 ? 'l3' : n >= 3 ? 'l2' : n >= 1 ? 'l1' : '', label: `${ids.length - n} of ${ids.length} rentals free (sample)` };
  },
  onPick: (i) => setDate(i, 'main'),
  });
}
// Build the month grid only when the section is about to be seen (keeps first load light).
if ('IntersectionObserver' in window) {
  const calIo = new IntersectionObserver((entries) => {
    if (entries.some((en) => en.isIntersecting)) { initMainCal(); calIo.disconnect(); }
  }, { rootMargin: '700px 0px' });
  calIo.observe($('#datepick'));
} else {
  initMainCal();
}

function applyDate() {
  let free = 0;
  for (const card of cards) {
    const booked = bookedOn(card.dataset.id);
    card.classList.toggle('is-booked', booked);
    $('.booked-tag', card).hidden = !booked;
    if (!booked) free += 1;
  }
  dateClear.hidden = !date;
  dateStatus.textContent = date
    ? `${fmt(parse(date), LONG)}: ${free} of ${cards.length} rentals free (sample data). Booked ones are greyed out.`
    : 'No date picked yet. Showing every rental.';
}

let detailCal = null;
function setDate(v, source) {
  if (v && !validDate(v)) return;
  date = v || '';
  save();
  if (source !== 'main' && mainCal) mainCal.set(date);
  if (source !== 'detail' && detailCal) detailCal.set(date);
  if (source !== 'form') dateInput.value = date;
  applyDate();
  render();
}
dateClear.addEventListener('click', () => { setDate('', 'clear'); $('#main-cal .cal-day[tabindex="0"]')?.focus(); });
dateInput.addEventListener('change', () => {
  if (!dateInput.value) setDate('', 'form');
  else if (validDate(dateInput.value)) setDate(dateInput.value, 'form');
});

/* ------------------------------------------------------------------ */
/* Rental detail dialog (per-rental calendar)                          */
/* ------------------------------------------------------------------ */
const dlg = $('#detail');
let detailId = null;

function openDetail(id) {
  const card = cards.find((c) => c.dataset.id === id);
  detailId = id;
  const art = $('#detail-art');
  art.dataset.art = card.dataset.art;
  art.replaceChildren($('.art-svg', card).cloneNode(true));
  $('#detail-tag').textContent = $('.art .tag', card).textContent;
  $('#detail-title').textContent = card.dataset.name;
  $('#detail-price').textContent = money(catalog.get(id).price);
  const meta = $('#detail-meta');
  meta.replaceChildren();
  const specs = $('.specs', card);
  const note = $('.note', card);
  if (specs) meta.append(specs.cloneNode(true));
  if (note) meta.append(note.cloneNode(true));
  detailCal = calendar($('#detail-cal'), {
    value: date,
    legend: [{ cls: 'free', text: 'Free' }, { cls: 'booked', text: 'Booked' }],
    state: (i) => (isBooked(id, i) ? { cls: 'booked', text: 'Booked', label: 'Booked (sample)' } : { cls: 'free', label: 'Free (sample)' }),
    onPick: (i) => setDate(i, 'detail'),
  });
  dlg.showModal();
  syncDetail();
}

function syncDetail() {
  if (!detailId || !dlg.open) return;
  const name = catalog.get(detailId).name;
  const booked = bookedOn(detailId);
  $('#detail-status').textContent = date
    ? `${fmt(parse(date), LONG)}: ${booked ? 'Booked that day' : 'Free that day'} (sample data).`
    : 'Pick a date to see if this rental is free (sample data).';
  syncAdd($('#detail-add'), detailId, selected.includes(detailId), booked, name);
}
$('#detail-add').addEventListener('click', () => { if (detailId) toggle(detailId, $('#detail-add'), false); });
dlg.addEventListener('close', () => { detailId = null; detailCal = null; });

/* ------------------------------------------------------------------ */
/* Gallery lightbox (Esc closes; arrows browse)                        */
/* ------------------------------------------------------------------ */
const lb = $('#lightbox');
const tiles = $$('.g-tile');
const lbImg = $('#lb-img');
let lbIndex = 0;
function showPhoto(i) {
  lbIndex = (i + tiles.length) % tiles.length;
  const t = tiles[lbIndex];
  lbImg.width = Number(t.dataset.w) || 1000;
  lbImg.height = Number(t.dataset.h) || 667;
  lbImg.src = t.dataset.full;
  lbImg.alt = t.dataset.alt;
  $('#lb-cap').textContent = t.dataset.alt;
  $('#lb-count').textContent = `Photo ${lbIndex + 1} of ${tiles.length}. Sample photo from Unsplash.`;
}
tiles.forEach((t, i) => t.addEventListener('click', () => { showPhoto(i); lb.showModal(); }));
$('#lb-prev').addEventListener('click', () => showPhoto(lbIndex - 1));
$('#lb-next').addEventListener('click', () => showPhoto(lbIndex + 1));
lb.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') { e.preventDefault(); showPhoto(lbIndex - 1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); showPhoto(lbIndex + 1); }
});

// Close buttons and backdrop clicks for both dialogs
for (const d of [dlg, lb]) {
  d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
}

/* ------------------------------------------------------------------ */
/* Mobile quick-contact bar                                            */
/* ------------------------------------------------------------------ */
const cbCall = $('#cb-call');
const cbMenu = $('#cb-menu');
function setCall(open) { cbCall.setAttribute('aria-expanded', String(open)); cbMenu.hidden = !open; }
setCall(false);
cbCall.addEventListener('click', () => setCall(cbMenu.hidden));
document.addEventListener('click', (e) => { if (!cbMenu.hidden && !e.target.closest('#contact-bar')) setCall(false); });
cb.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !cbMenu.hidden) { setCall(false); cbCall.focus(); } });
if ('IntersectionObserver' in window) {
  new IntersectionObserver(
    ([en]) => { formInView = en.isIntersecting; root.classList.toggle('form-in-view', formInView); if (formInView) setCall(false); dock(); },
    { rootMargin: '0px 0px -15% 0px' }
  ).observe($('.req-card'));
}

/* ------------------------------------------------------------------ */
/* Form: demo submit                                                   */
/* ------------------------------------------------------------------ */
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const data = new FormData(form);
  const tot = total();
  const rows = [
    ['Name', data.get('name')],
    ['Phone', data.get('phone')],
    ['Email', data.get('email')],
    ['Event date', data.get('date') ? fmt(parse(String(data.get('date'))), LONG) : ''],
    ['ZIP', data.get('zip')],
    ['Items', names().join(', ') || 'None chosen'],
    ['Estimated total', tot ? money(tot) : ''],
    ['Notes', data.get('notes')],
  ].filter(([, v]) => v && String(v).trim());

  summary.replaceChildren(
    ...rows.flatMap(([k, v]) => [el('dt', null, k), el('dd', null, String(v))])
  );
  $('#confirm-est').hidden = tot === 0;
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
  setDate('', 'clear');
  confirmBox.hidden = true;
  form.hidden = false;
  $('#f-name').focus();
});

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */
// The static HTML is already in its default state; only re-render if something was restored.
if (date) { dateInput.value = date; applyDate(); }
if (selected.length || date) render(); else dock();
