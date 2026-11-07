// Tiny accessible month calendar. Vanilla JS, no library.
// Keys: arrows move by day/week, Home/End = week start/end, PageUp/PageDown = month.
const WD = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const NOTE = 'Sample availability. In the live version this shows your real bookings.';
const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const add = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const fmt = (d, o) => d.toLocaleDateString('en-US', o);

/**
 * host: element to fill. opts: { months, value, state(iso) -> {cls,text,label}|null, legend:[{cls,text}], onPick(iso) }
 * Returns { set(isoOrEmpty), refresh() }.
 */
export function calendar(host, opts) {
  const { months = 12, state = () => null, legend = [], onPick = () => {} } = opts;
  const today = parse(iso(new Date()));
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + months, 0);
  let sel = opts.value || '';
  let view = sel ? new Date(parse(sel).getFullYear(), parse(sel).getMonth(), 1) : first;
  let focus = sel || iso(today);

  const root = document.createElement('div');
  root.className = 'cal';
  root.innerHTML =
    `<div class="cal-head"><button type="button" class="cal-nav" data-m="-1" aria-label="Previous month"><span aria-hidden="true">‹</span></button>` +
    `<h4 class="cal-title" aria-live="polite"></h4>` +
    `<button type="button" class="cal-nav" data-m="1" aria-label="Next month"><span aria-hidden="true">›</span></button></div>` +
    `<table class="cal-grid" role="grid"><thead><tr>${WD.map((w) => `<th scope="col" abbr="${w}">${w}</th>`).join('')}</tr></thead><tbody></tbody></table>` +
    `<ul class="cal-legend">${legend.map((l) => `<li><i class="cal-key ${l.cls}"></i>${l.text}</li>`).join('')}</ul>` +
    `<p class="cal-note">${NOTE}</p>`;
  host.replaceChildren(root);
  const title = root.querySelector('.cal-title');
  const body = root.querySelector('tbody');
  const [prev, next] = root.querySelectorAll('.cal-nav');

  function render() {
    title.textContent = fmt(view, { month: 'long', year: 'numeric' });
    prev.disabled = view <= first;
    next.disabled = new Date(view.getFullYear(), view.getMonth() + 1, 1) > lastDay;
    const fd = parse(focus);
    if (fd.getMonth() !== view.getMonth() || fd.getFullYear() !== view.getFullYear() || fd < today) {
      focus = iso(view <= first ? today : view);
    }
    const start = add(view, -view.getDay());
    let html = '';
    for (let r = 0; r < 6; r++) {
      html += '<tr>';
      for (let c = 0; c < 7; c++) {
        const d = add(start, r * 7 + c);
        if (d.getMonth() !== view.getMonth()) { html += '<td></td>'; continue; }
        const i = iso(d);
        const past = d < today;
        const st = past ? null : state(i);
        const cls = ['cal-day', st && st.cls, i === sel && 'is-sel', +d === +today && 'is-today'].filter(Boolean).join(' ');
        const label = fmt(d, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + (st && st.label ? `, ${st.label}` : past ? ', unavailable (past)' : '');
        html += `<td><button type="button" class="${cls}" data-i="${i}" tabindex="${i === focus ? 0 : -1}" aria-label="${label}"${i === sel ? ' aria-pressed="true"' : ''}${past ? ' disabled' : ''}><span>${d.getDate()}</span>${st && st.text ? `<em>${st.text}</em>` : ''}</button></td>`;
      }
      html += '</tr>';
    }
    body.innerHTML = html;
  }

  function go(d) {
    if (d < today || d > lastDay) return;
    view = new Date(d.getFullYear(), d.getMonth(), 1);
    focus = iso(d);
    render();
    body.querySelector(`[data-i="${focus}"]`).focus();
  }

  root.addEventListener('click', (e) => {
    const m = e.target.closest('[data-m]');
    if (m) {
      view = new Date(view.getFullYear(), view.getMonth() + Number(m.dataset.m), 1);
      focus = sel && parse(sel).getMonth() === view.getMonth() ? sel : iso(view <= first ? today : view);
      render();
      return;
    }
    const b = e.target.closest('[data-i]');
    if (b && !b.disabled) { sel = focus = b.dataset.i; render(); body.querySelector(`[data-i="${sel}"]`).focus(); onPick(sel); }
  });

  body.addEventListener('keydown', (e) => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    const d = parse(b.dataset.i);
    const k = e.key;
    const t = { ArrowLeft: add(d, -1), ArrowRight: add(d, 1), ArrowUp: add(d, -7), ArrowDown: add(d, 7), Home: add(d, -d.getDay()), End: add(d, 6 - d.getDay()),
      PageUp: new Date(d.getFullYear(), d.getMonth() - 1, d.getDate()), PageDown: new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()) }[k];
    if (!t) return;
    e.preventDefault();
    go(t < today ? today : t);
  });

  render();
  return {
    set(v) {
      sel = v || '';
      if (sel) { const d = parse(sel); view = new Date(d.getFullYear(), d.getMonth(), 1); focus = sel; }
      render();
    },
    refresh: render,
  };
}
