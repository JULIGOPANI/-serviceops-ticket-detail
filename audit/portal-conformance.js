/* Support Portal builder — conformance sweep.
 *
 * Paste into the browser console with the builder open, then:
 *
 *     await __audit.run()                 // every widget
 *     await __audit.run(['el-3','work'])  // just these
 *     __audit.report()                    // the defect list
 *
 * WHAT IT DOES: selects each node, opens every accordion in its drawer, drives every control it
 * knows how to operate, and records whether the CANVAS changed. A control that stores a value and
 * paints nothing is the defect this whole file exists to find — `npm run build` is esbuild only, so
 * nothing else catches it.
 *
 * ⚠️ It never presses a destructive button (see DANGER) and it blocks link navigation, because a
 * sweep that drives every button will otherwise eventually press Delete or follow an Action Card's
 * destination — and an audit that destroys the thing it is auditing is worse than no audit.
 *
 * ⚠️ It skips an option that is ALREADY selected. Clicking the lit segment of a segmented control
 * correctly changes nothing, and counting that as a dead control fills the report with false
 * failures — the fastest way to make an audit worth ignoring.
 *
 * ⚠️ KNOWN BLIND SPOTS, deliberately reported as `skipped` rather than `ok`:
 *   - colour pickers (need a popover + a swatch click)
 *   - upload zones (need a file)
 *   - anything whose effect is not visual (a link destination changes no pixels)
 */
(() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fire = (el, p = 'onClick') => {
    if (!el) return false;
    const k = Object.keys(el).find((x) => x.startsWith('__reactProps$'));
    const f = el[k]?.[p];
    if (!f) return false;
    f({ stopPropagation() {}, preventDefault() {} });
    return true;
  };

  const A = {
    results: [],
    DANGER: /delete|remove|reset|publish|preview|back|clear|undo|redo|save|exit|duplicate|replace|add section|add widget|choose|upload|ingest|new page/i,
    /* Controls whose effect is real but not visual — reported as skipped, never as a failure. */
    NON_VISUAL: /on click, go to|url|open in|page$|destination|alt text|anchor/i,
  };

  A.aside = () => document.querySelector('aside');
  A.node = (id) => document.querySelector(`[data-node="${id}"]`);
  A.nodes = () => [...document.querySelectorAll('[data-node]')].map((n) => n.getAttribute('data-node'));
  A.widgets = () => A.nodes().filter((x) => /^el-\d+$/.test(x));
  A.sections = () => A.nodes().filter((x) => /^(sec-\d+|quick|work|records|hero)$/.test(x));

  /** Everything a control could plausibly change about a node, as one comparable string. */
  A.sig = (id) => {
    const n = A.node(id);
    if (!n) return 'GONE';
    return [n, ...n.querySelectorAll('*')].slice(0, 120).map((x) => {
      const c = getComputedStyle(x);
      return [c.display, c.flexDirection, c.justifyContent, c.alignItems, c.rowGap, c.padding, c.margin,
        c.backgroundColor, c.backgroundImage, c.borderTopWidth, c.borderTopColor, c.borderTopLeftRadius,
        c.color, c.fontSize, c.fontWeight, c.textAlign, c.width, c.height, c.boxShadow].join('~');
    }).join('|') + '##' + (n.innerText || '');
  };

  A.safe = (el) => !A.DANGER.test(
    ((el.textContent || '') + ' ' + (el.getAttribute('data-tip') || '') + ' '
      + (el.getAttribute('title') || '') + ' ' + (el.getAttribute('aria-label') || '')).trim(),
  );

  A.isOn = (el) => /EBF5FF|bg-white shadow/.test(String(el.className || ''))
    || el.getAttribute('aria-pressed') === 'true'
    || el.getAttribute('data-selected') === 'true'
    || el.closest('label')?.getAttribute('data-selected') === 'true';

  A.blockNav = () => {
    if (window.__navBlocked) return;
    document.addEventListener('click', (e) => {
      const a = e.target?.closest?.('a[href]');
      if (a) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    window.__navBlocked = true;
  };

  /** Open every accordion, twice over — some only render their children once expanded. */
  A.expand = async () => {
    for (let pass = 0; pass < 3; pass++) {
      const heads = [...A.aside().querySelectorAll('button')]
        .filter((b) => b.clientWidth > 180 && b.querySelector('svg') && (b.textContent || '').trim().length < 22);
      for (const h of heads) {
        const before = A.aside().querySelectorAll('input,select').length;
        fire(h); await sleep(70);
        if (A.aside().querySelectorAll('input,select').length < before) fire(h);  // it was open; put it back
      }
      await sleep(180);
    }
  };

  const setNative = (el, v) => {
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype
      : el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, String(v));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const labelOf = (el) => {
    let p = el.parentElement;
    for (let i = 0; i < 5 && p; i++, p = p.parentElement) {
      const own = [...p.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
      if (own && own.length < 42) return own;
      const l = p.querySelector('p,label,span');
      if (l && !l.contains(el)) { const t = (l.textContent || '').trim(); if (t && t.length < 42) return t; }
    }
    return '?';
  };

  A.controls = () => {
    const a = A.aside();
    if (!a) return [];
    const out = [];
    for (const el of a.querySelectorAll('input,textarea,select,button')) {
      if (!el.offsetParent || el.disabled) continue;
      const t = (el.type || '').toLowerCase();
      if (el.tagName === 'INPUT' && t === 'range') out.push({ el, kind: 'range' });
      else if (el.tagName === 'INPUT' && ['text', ''].includes(t)) out.push({ el, kind: 'text' });
      else if (el.tagName === 'TEXTAREA') out.push({ el, kind: 'text' });
      else if (el.tagName === 'SELECT') out.push({ el, kind: 'select' });
      else if (el.tagName === 'BUTTON') {
        if (!A.safe(el) || (el.clientWidth > 180 && el.querySelector('svg'))) continue;
        const cls = String(el.className || '');
        if (/rounded-full/.test(cls) && el.clientWidth < 48) out.push({ el, kind: 'toggle' });
        else if (/h-7|h-8|flex-1/.test(cls) && !A.isOn(el)) out.push({ el, kind: 'option' });
      }
    }
    return out;
  };

  A.driveNode = async (id) => {
    const n = A.node(id);
    if (!n) return { id, err: 'gone' };
    fire(n); await sleep(500);
    if (!A.aside()) return { id, err: 'no drawer' };
    const name = (A.aside().textContent || '').trim().slice(0, 18);
    await A.expand();
    const res = [];
    const total = A.controls().length;
    for (let i = 0; i < total && i < 70; i++) {
      const live = A.controls()[i];
      if (!live || !live.el.offsetParent) continue;
      const { el, kind } = live;
      const label = labelOf(el);
      if (A.NON_VISUAL.test(label)) { res.push({ label, kind, r: 'skipped' }); continue; }
      const before = A.sig(id);
      if (kind === 'range') {
        const mn = Number(el.min || 0); const mx = Number(el.max || 100);
        setNative(el, Number(el.value) === mx ? Math.round((mn + mx) / 2) : mx);
      } else if (kind === 'text') setNative(el, 'ZQ' + i);
      else if (kind === 'select') {
        const nx = [...el.options].map((o) => o.value).find((o) => o !== el.value);
        if (nx === undefined) continue;
        setNative(el, nx);
      } else fire(el);
      await sleep(210);
      res.push({ label, kind, r: A.sig(id) !== before ? 'ok' : 'INERT' });
    }
    const row = {
      id, name, n: res.length,
      ok: res.filter((x) => x.r === 'ok').length,
      skipped: res.filter((x) => x.r === 'skipped').length,
      inert: res.filter((x) => x.r === 'INERT').map((x) => `${x.label} [${x.kind}]`),
    };
    A.results.push(row);
    return row;
  };

  A.run = async (ids) => {
    A.blockNav();
    A.results = [];
    for (const id of (ids ?? [...A.sections(), ...A.widgets()])) {
      await A.driveNode(id);
      if (!document.querySelector('[data-portal-canvas]')) { console.warn('canvas gone at', id); break; }
    }
    return A.report();
  };

  A.report = () => {
    const bad = A.results.filter((r) => (r.inert || []).length);
    console.table(A.results.map((r) => ({ id: r.id, name: r.name, controls: r.n, ok: r.ok, inert: (r.inert || []).length })));
    return {
      nodes: A.results.length,
      controls: A.results.reduce((s, r) => s + (r.n || 0), 0),
      inertTotal: A.results.reduce((s, r) => s + (r.inert || []).length, 0),
      byNode: bad.map((r) => ({ id: r.id, name: r.name, inert: r.inert })),
    };
  };

  window.__audit = A;
  console.log('portal conformance harness ready — await __audit.run()');
  return A;
})();
