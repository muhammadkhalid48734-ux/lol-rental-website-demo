// "My request" builder. Vanilla JS, no dependencies, no network calls.
// Demo only: submitting the form never sends anything anywhere.

const STORE = 'lol-demo-request-v1';
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const cards = $$('[data-rental]');
const catalog = new Map(cards.map((c) => [c.dataset.id, { id: c.dataset.id, name: c.dataset.name }]));

const bar = $('#request-bar');
const barCount = $('#bar-count');
const barItems = $('#bar-items');
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
  // Re-set on the next frame so repeated messages are still announced.
  requestAnimationFrame(() => { live.textContent = msg; });
}

function render() {
  const n = selected.length;

  for (const card of cards) {
    const on = selected.includes(card.dataset.id);
    const btn = $('[data-add]', card);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? `Remove ${card.dataset.name} from my request` : `Add ${card.dataset.name} to my request`);
    $('.add-label', btn).textContent = on ? 'Added ✓' : 'Add to my request';
    card.classList.toggle('is-picked', on);
  }

  barCount.textContent = String(n);
  barItems.textContent = names().join(', ');
  bar.classList.toggle('is-open', n > 0);
  bar.toggleAttribute('inert', n === 0);
  document.documentElement.classList.toggle('has-request', n > 0);

  pickedList.replaceChildren(
    ...selected.map((id) => {
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = catalog.get(id).name;
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'picked-remove';
      rm.dataset.remove = id;
      rm.setAttribute('aria-label', `Remove ${catalog.get(id).name}`);
      rm.textContent = '×';
      li.append(label, rm);
      return li;
    })
  );
  pickedEmpty.hidden = n > 0;
  itemsField.value = names().join(', ');
}

function toggle(id) {
  const i = selected.indexOf(id);
  const name = catalog.get(id).name;
  if (i === -1) selected.push(id); else selected.splice(i, 1);
  save();
  render();
  announce(`${i === -1 ? 'Added' : 'Removed'} ${name}. ${selected.length} ${selected.length === 1 ? 'item' : 'items'} in my request.`);
}

// Add / remove from cards
$('#grid').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add]');
  if (btn) toggle(btn.closest('[data-rental]').dataset.id);
});

// Remove from the form list
pickedList.addEventListener('click', (e) => {
  const rm = e.target.closest('[data-remove]');
  if (!rm) return;
  const next = rm.closest('li').nextElementSibling || rm.closest('li').previousElementSibling;
  toggle(rm.dataset.remove);
  const target = next ? $('[data-remove]', next) : $('#f-name');
  target?.focus();
});

// Sticky bar -> form
$('#bar-open').addEventListener('click', () => {
  const section = $('#request');
  section.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  const heading = $('#request-h');
  window.setTimeout(() => heading.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 450);
});

// Filter chips
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
      if (show) shown += 1;
    }
    filterStatus.textContent = `Showing ${shown} ${shown === 1 ? 'rental' : 'rentals'}`;
  })
);

// Event date can't be in the past
const dateInput = $('#f-date');
const t = new Date();
const pad = (n) => String(n).padStart(2, '0');
dateInput.min = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;

function prettyDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// Demo submit: show the confirmation, send nothing.
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
  // The summary above already captured the chosen items; clear the live
  // selection so the sticky bar doesn't linger over the confirmation.
  selected = [];
  save();
  render();
  form.hidden = true;
  confirmBox.hidden = false;
  confirmBox.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
  confirmBox.focus({ preventScroll: true });
});

$('#restart').addEventListener('click', () => {
  form.reset();
  confirmBox.hidden = true;
  form.hidden = false;
  $('#f-name').focus();
});

render();
