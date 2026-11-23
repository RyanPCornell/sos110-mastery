/* SOS 110 Mastery: question widgets. Each renderer draws one problem into `host` and returns
   { ready(): bool, check(): {ok, msg?}, reveal(), lock() }. ctx = { rng, changed() }.
   Students can answer with mouse, touch or keyboard; drag-and-drop always has a click alternative. */
const WG = (function () {
  const $ = (s, el) => (el || document).querySelector(s), $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const LET = 'ABCDEFGH';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function shuffle(a, rng) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function derange(a, rng) { if (a.length < 2) return a.slice(); let s; do { s = shuffle(a, rng); } while (s.every((v, i) => v === a[i])); return s; }
  const num = s => { const t = String(s).replace(/[,\s$%°]/g, '').replace(/[−–]/g, '-').replace(/[a-zA-Z]+$/, ''); return t === '' || isNaN(+t) ? NaN : +t; };
  const norm = s => String(s).toLowerCase().replace(/[^a-z0-9₂₄.\-]/g, '');

  /* ── multiple choice (one answer) ── */
  function mc(q, host, ctx) {
    const order = q.keep ? q.choices.map((c, i) => i) : shuffle(q.choices.map((c, i) => i), ctx.rng);
    host.innerHTML = `<div class="opts" role="radiogroup" aria-label="Answer choices">${order.map((ci, k) =>
      `<button type="button" class="opt" role="radio" aria-checked="false" data-i="${ci}"><span class="k">${LET[k]}</span><span>${q.choices[ci]}</span></button>`).join('')}</div>`;
    let pick = null, locked = false;
    const set = i => { if (locked) return; pick = i; $$('.opt', host).forEach(b => { const on = +b.dataset.i === i; b.classList.toggle('sel', on); b.setAttribute('aria-checked', on); }); ctx.changed(); };
    host.addEventListener('click', e => { const b = e.target.closest('.opt'); if (b) set(+b.dataset.i); });
    return {
      ready: () => pick !== null,
      key: k => { const n = LET.indexOf(k.toUpperCase()); if (n >= 0 && n < order.length) { set(order[n]); return true; } },
      check() { const ok = pick === q.answer; $(`.opt[data-i="${pick}"]`, host).classList.add(ok ? 'right' : 'wrong'); return { ok }; },
      reveal() { $(`.opt[data-i="${q.answer}"]`, host).classList.add('right'); },
      lock() { locked = true; host.classList.add('locked'); },
    };
  }

  /* ── select all that apply ── */
  function multi(q, host, ctx) {
    const order = shuffle(q.choices.map((c, i) => i), ctx.rng), sel = new Set();
    let locked = false;
    host.innerHTML = `<div class="opts" role="group" aria-label="Select all that apply">${order.map((ci, k) =>
      `<button type="button" class="opt multi" role="checkbox" aria-checked="false" data-i="${ci}"><span class="k">${LET[k]}</span><span>${q.choices[ci]}</span></button>`).join('')}</div>`;
    const tog = i => { if (locked) return; sel.has(i) ? sel.delete(i) : sel.add(i); const b = $(`.opt[data-i="${i}"]`, host); b.classList.toggle('sel', sel.has(i)); b.setAttribute('aria-checked', sel.has(i)); ctx.changed(); };
    host.addEventListener('click', e => { const b = e.target.closest('.opt'); if (b) tog(+b.dataset.i); });
    return {
      ready: () => sel.size > 0,
      key: k => { const n = LET.indexOf(k.toUpperCase()); if (n >= 0 && n < order.length) { tog(order[n]); return true; } },
      check() {
        const want = new Set(q.answers); let ok = sel.size === want.size;
        sel.forEach(i => { const r = want.has(i); if (!r) ok = false; $(`.opt[data-i="${i}"]`, host).classList.add(r ? 'right' : 'wrong'); });
        const missed = q.answers.filter(i => !sel.has(i)).length;
        return { ok, msg: ok ? '' : missed ? `You missed ${missed} correct choice${missed > 1 ? 's' : ''}.` : 'One or more of your choices is not correct.' };
      },
      reveal() { q.answers.forEach(i => { const b = $(`.opt[data-i="${i}"]`, host); if (!sel.has(i)) b.classList.add('right', 'miss'); }); },
      lock() { locked = true; host.classList.add('locked'); },
    };
  }

  /* ── fill in the blank(s): text uses {{0}}, {{1}} ── */
  function fill(q, host, ctx) {
    // optional chart to read from: chart, chartOpts, cap, src. The pointer shows the exact value underneath; a click pins it.
    const C = q.chart ? CH[q.chart](q.chartOpts || {}) : null;
    host.innerHTML = (C ? `<div class="qfig">${q.cap ? `<div class="cap">${q.cap}</div>` : ''}<div class="readable" data-plot>${C.svg}</div>${q.src ? `<div class="src">${q.src}</div>` : ''}</div>`
        + `<p class="calcnote" data-read>${C.hit ? 'Move the pointer across the chart to read its values, then fill in the blanks.' : 'Read the chart, then fill in the blanks.'}</p>` : '')
      + `<div class="fill">${q.text.replace(/\{\{(\d+)\}\}/g, (m, i) => { const b = q.blanks[+i];
      return `<input class="blank" data-b="${i}" inputmode="${b.num !== undefined ? 'decimal' : 'text'}" autocomplete="off" spellcheck="false" aria-label="Blank ${+i + 1}" style="--w:${b.w || (b.num !== undefined ? 6 : 10)}ch">${b.unit ? `<span class="unit">${b.unit}</span>` : ''}`; })}</div>`
      + (q.note ? `<div class="calcnote">${q.note}</div>` : '');
    const ins = $$('.blank', host);
    ins.forEach(i => i.addEventListener('input', () => { i.classList.remove('right', 'wrong'); ctx.changed(); }));
    if (C && C.hit && C.mark) {
      const svg = $('svg', host), g = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g'); svg.appendChild(g);
      const toSvg = e => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
      const tip = (t, cls, color) => { const m = C.mark(t), lbl = t.label, w = Math.min(330, 12 + lbl.length * 6.8), left = m.x + w + 12 > C.f.W ? m.x - w - 10 : m.x + 10, ty = Math.max(14, m.y - 34);
        return `<g class="pickmark ${cls}"><path d="M${m.x} ${C.f.t}V${C.f.b}" stroke="${color}" stroke-width="1.2" stroke-dasharray="3 3"/><circle cx="${m.x}" cy="${m.y}" r="6" fill="${color}" stroke="#fffdf6" stroke-width="2.5"/>`
          + `<rect x="${left}" y="${ty}" width="${w}" height="22" rx="11" fill="${color}"/><text class="picktip" x="${left + w / 2}" y="${ty + 15}" text-anchor="middle">${esc(lbl)}</text></g>`; };
      let pinned = '';
      const inside = p => p.x >= C.f.l - 6 && p.x <= C.f.r + 6;
      svg.addEventListener('pointermove', e => { const p = toSvg(e); g.innerHTML = pinned + (inside(p) ? tip(C.hit(p.x, p.y), 'hov', '#3b3222') : ''); });
      svg.addEventListener('pointerleave', () => { g.innerHTML = pinned; });
      svg.addEventListener('click', e => { const p = toSvg(e); if (!inside(p)) return; const t = C.hit(p.x, p.y); pinned = tip(t, 'pin', '#8a6a2f'); g.innerHTML = pinned;
        $('[data-read]', host).innerHTML = `Pinned: <b>${esc(t.label)}</b>. Move the pointer to keep reading, or click elsewhere on the chart.`; });
    }
    const good = (b, v) => b.num !== undefined ? (Math.abs(num(v) - b.num) <= (b.tol || 0) + 1e-9) : (b.accept || []).some(a => norm(a) === norm(v));
    const show = b => b.num !== undefined ? (b.show || String(b.num)) : b.accept[0];
    return {
      ready: () => ins.every(i => i.value.trim() !== ''),
      check() { let ok = true; ins.forEach(i => { const b = q.blanks[+i.dataset.b], r = good(b, i.value); i.classList.add(r ? 'right' : 'wrong'); if (!r) ok = false; }); return { ok }; },
      reveal() { ins.forEach(i => { if (i.classList.contains('wrong')) { const b = q.blanks[+i.dataset.b]; i.insertAdjacentHTML('afterend', ` <span class="unit" style="color:var(--grn)">→ ${esc(show(b))}</span>`); } }); },
      lock() { ins.forEach(i => i.readOnly = true); },
      focus() { ins[0] && ins[0].focus(); },
    };
  }

  /* ── put in order (drag, or the ▲▼ buttons) ── */
  function order(q, host, ctx) {
    let cur = derange(q.items.map((t, i) => i), ctx.rng), locked = false, moved = false;
    const draw = () => {
      host.innerHTML = `<div class="order">${cur.map((ii, k) => `<div class="oi" data-i="${ii}"><span class="n">${k + 1}</span><span class="grip" aria-hidden="true">⋮⋮</span><span class="t">${q.items[ii]}</span>`
        + `<span class="mv"><button type="button" data-up aria-label="Move up">▲</button><button type="button" data-dn aria-label="Move down">▼</button></span></div>`).join('')}</div>`;
    };
    draw();
    host.addEventListener('click', e => {
      if (locked) return; const b = e.target.closest('button'); if (!b) return; const row = b.closest('.oi'), k = cur.indexOf(+row.dataset.i), to = b.hasAttribute('data-up') ? k - 1 : k + 1;
      if (to < 0 || to >= cur.length) return; [cur[k], cur[to]] = [cur[to], cur[k]]; moved = true; draw(); ctx.changed();
      const again = $(`.oi[data-i="${row.dataset.i}"] [${b.hasAttribute('data-up') ? 'data-up' : 'data-dn'}]`, host); again && again.focus();
    });
    // pointer drag
    host.addEventListener('pointerdown', e => {
      const g = e.target.closest('.oi'); if (!g || locked || e.target.closest('button')) return;
      e.preventDefault(); const list = $('.order', host), rows = $$('.oi', list), h = g.getBoundingClientRect().height + 8, y0 = e.clientY, k0 = cur.indexOf(+g.dataset.i);
      g.classList.add('drag'); g.setPointerCapture(e.pointerId);
      const mv = ev => { const dy = ev.clientY - y0; g.style.transform = `translateY(${dy}px)`; const k = Math.max(0, Math.min(cur.length - 1, k0 + Math.round(dy / h)));
        rows.forEach(r => { if (r === g) return; const kr = cur.indexOf(+r.dataset.i); let s = 0; if (k > k0 && kr > k0 && kr <= k) s = -h; if (k < k0 && kr < k0 && kr >= k) s = h; r.style.transform = s ? `translateY(${s}px)` : ''; r.style.transition = 'transform .15s'; }); };
      const up = ev => { g.releasePointerCapture(e.pointerId); g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up);
        const k = Math.max(0, Math.min(cur.length - 1, k0 + Math.round((ev.clientY - y0) / h))); if (k !== k0) { const [x] = cur.splice(k0, 1); cur.splice(k, 0, x); moved = true; }
        draw(); ctx.changed(); };
      g.addEventListener('pointermove', mv); g.addEventListener('pointerup', up);
    });
    return {
      ready: () => moved,
      check() { let ok = true; $$('.oi', host).forEach((r, k) => { const right = +r.dataset.i === k; r.classList.add(right ? 'right' : 'wrong'); if (!right) ok = false; }); return { ok }; },
      reveal() { $$('.oi', host).forEach((r, k) => { if (r.classList.contains('wrong')) r.insertAdjacentHTML('beforeend', `<span class="want">belongs at #${+r.dataset.i + 1}</span>`); }); },
      lock() { locked = true; $$('.mv', host).forEach(m => m.remove()); $$('.grip', host).forEach(m => m.remove()); },
    };
  }

  /* ── drag-and-drop helper shared by bins and the diagram ── */
  function dnd(host, ctx, opts) {
    // opts: { zones(): elements that accept chips, place(chip, zone), canDrag() }
    let picked = null;
    const pick = c => { $$('.chip.pick', host).forEach(x => x.classList.remove('pick')); picked = c; if (c) c.classList.add('pick'); host.classList.toggle('picking', !!c); $$(opts.zoneSel, host).forEach(z => z.classList.toggle('target', !!c)); };
    host.addEventListener('click', e => {
      if (!opts.canDrag()) return;
      if (host.__justDragged) { host.__justDragged = false; return; }
      // click a card to pick it up, then click a box to put it there; clicking another card in the pool switches cards
      const c = e.target.closest('.chip'), z = e.target.closest(opts.zoneSel);
      if (picked && c === picked) { pick(null); return; }
      if (picked && z && !(c && z.dataset.zone === 'pool')) { opts.place(picked, z); pick(null); ctx.changed(); return; }
      if (c) pick(c);
    });
    host.addEventListener('pointerdown', e => {
      const c = e.target.closest('.chip'); if (!c || !opts.canDrag() || e.button > 0) return;
      const r = c.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top, x0 = e.clientX, y0 = e.clientY; let fly = null, over = null;
      const mv = ev => {
        if (!fly && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return;
        if (!fly) { fly = c.cloneNode(true); fly.classList.add('flying'); fly.style.width = r.width + 'px'; document.body.appendChild(fly); c.classList.add('ghost'); pick(null); }
        fly.style.left = (ev.clientX - dx) + 'px'; fly.style.top = (ev.clientY - dy) + 'px';
        fly.style.display = 'none'; const el = document.elementFromPoint(ev.clientX, ev.clientY); fly.style.display = '';
        const z = el && el.closest(opts.zoneSel); if (over && over !== z) over.classList.remove('hot'); over = z && host.contains(z) ? z : null; if (over) over.classList.add('hot');
      };
      const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up);
        if (fly) { fly.remove(); c.classList.remove('ghost'); host.__justDragged = true; setTimeout(() => host.__justDragged = false, 50); if (over) { over.classList.remove('hot'); opts.place(c, over); ctx.changed(); } } };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
    return { pick };
  }

  /* ── sort into bins ── */
  function bins(q, host, ctx) {
    const items = shuffle(q.items.map((it, i) => i), ctx.rng); let locked = false;
    host.innerHTML = `<div class="bins"><div class="pool" data-zone="pool" aria-label="Cards to sort">${items.map(i => `<span class="chip" tabindex="0" data-i="${i}">${q.items[i].t}</span>`).join('')}</div>`
      + `<div class="binrow" style="--n:${q.bins.length}">${q.bins.map((b, k) => `<div class="bin" data-zone="${k}" style="--c:${b.c || 'var(--ink)'}"><div class="bh"><i></i>${b.name}</div><div class="bb"></div></div>`).join('')}</div></div>`
      + `<p class="calcnote" style="margin-top:10px">Drag each card into a box, or click a card and then click a box.</p>`;
    const place = (chip, zone) => { const target = zone.dataset.zone === 'pool' ? zone : $('.bb', zone); target.appendChild(chip); };
    dnd(host, ctx, { zoneSel: '[data-zone]', place, canDrag: () => !locked });
    host.addEventListener('keydown', e => { const c = e.target.closest('.chip'); if (!c || locked) return; const n = +e.key; if (n >= 1 && n <= q.bins.length) { place(c, $(`[data-zone="${n - 1}"]`, host)); ctx.changed(); c.focus(); } });
    return {
      ready: () => !$('.pool .chip', host),
      check() { let ok = true; $$('.bin', host).forEach(b => $$('.chip', b).forEach(c => { const r = q.items[+c.dataset.i].b === +b.dataset.zone; c.classList.add(r ? 'right' : 'wrong'); if (!r) ok = false; })); return { ok }; },
      reveal() { $$('.chip.wrong', host).forEach(c => c.insertAdjacentHTML('beforeend', ` <span class="why">→ ${q.bins[q.items[+c.dataset.i].b].name}</span>`)); },
      lock() { locked = true; },
    };
  }

  /* ── match each item to an option ── */
  function match(q, host, ctx) {
    const rows = shuffle(q.pairs.map((p, i) => i), ctx.rng), opts = shuffle(q.pairs.map((p, i) => i).concat((q.extra || []).map((e, i) => 100 + i)), ctx.rng);
    const optText = i => i >= 100 ? q.extra[i - 100] : q.pairs[i][1];
    host.innerHTML = `<div class="match">${rows.map(i => `<div class="mrow" data-i="${i}"><div class="ml">${q.pairs[i][0]}</div><select class="sel2" aria-label="${esc(q.pairs[i][0].replace(/<[^>]+>/g, ''))}"><option value="">Choose…</option>${opts.map(o => `<option value="${o}">${optText(o)}</option>`).join('')}</select></div>`).join('')}</div>`;
    const sels = $$('select', host); sels.forEach(s => s.addEventListener('change', () => { s.closest('.mrow').classList.remove('right', 'wrong'); ctx.changed(); }));
    return {
      ready: () => sels.every(s => s.value !== ''),
      check() { let ok = true; $$('.mrow', host).forEach(r => { const g = +$('select', r).value === +r.dataset.i; r.classList.add(g ? 'right' : 'wrong'); if (!g) ok = false; }); return { ok }; },
      reveal() { $$('.mrow.wrong', host).forEach(r => r.insertAdjacentHTML('beforeend', `<div class="want">Correct: ${q.pairs[+r.dataset.i][1]}</div>`)); },
      lock() { sels.forEach(s => s.disabled = true); },
    };
  }

  /* ── a slider with a live picture (VIZ) ── */
  function slider(q, host, ctx) {
    const V = VIZ[q.viz]; let val = q.start, touched = false, locked = false;
    host.innerHTML = `<div class="sld"><div class="viz" data-viz></div><div class="ctl"><div class="read"><b data-v></b><span>${q.unit || ''}</span></div><div class="sub" data-sub></div>`
      + `<input class="rng" type="range" min="${q.min}" max="${q.max}" step="${q.step}" value="${q.start}" aria-label="${esc(q.label || 'Value')}"><div class="ends"><span>${q.fmt ? q.fmt(q.min) : q.min}</span><span>${q.fmt ? q.fmt(q.max) : q.max}</span></div>`
      + `<div class="nudge"><button type="button" data-n="-10">−${q.step * 10}</button><button type="button" data-n="-1">−${q.step}</button><button type="button" data-n="1">+${q.step}</button><button type="button" data-n="10">+${q.step * 10}</button></div></div></div>`;
    const rng = $('.rng', host), dec = (String(q.step).split('.')[1] || '').length;
    const paint = (extra) => { $('[data-v]', host).textContent = q.fmt ? q.fmt(val) : val.toFixed(dec); const o = V(val, q, extra); $('[data-viz]', host).innerHTML = o.svg; $('[data-sub]', host).innerHTML = o.sub || ''; };
    const set = v => { if (locked) return; val = Math.max(q.min, Math.min(q.max, Math.round(v / q.step) * q.step)); val = +val.toFixed(dec); rng.value = val; touched = true; paint(); ctx.changed(); };
    rng.addEventListener('input', () => set(+rng.value));
    host.addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (b) set(val + (+b.dataset.n) * q.step); });
    paint();
    return {
      ready: () => touched,
      check() { const ok = Math.abs(val - q.answer) <= q.tol + 1e-9; return { ok, msg: ok ? '' : `You set ${q.fmt ? q.fmt(val) : val.toFixed(dec)}${q.unit ? ' ' + q.unit : ''}.` }; },
      reveal() { paint({ show: q.answer }); },
      lock() { locked = true; rng.disabled = true; $$('.nudge button', host).forEach(b => b.disabled = true); },
    };
  }

  /* ── click a point on a chart ── */
  function pick(q, host, ctx) {
    const c = CH[q.chart](q.chartOpts || {}); let sel = null, locked = false;
    host.innerHTML = `<div class="qfig">${q.cap ? `<div class="cap">${q.cap}</div>` : ''}<div class="pickable" data-plot>${c.svg}</div>${q.src ? `<div class="src">${q.src}</div>` : ''}</div>`
      + `<p class="calcnote" data-read>Click on the chart to choose. You can click again to change your choice.</p>`;
    const svg = $('svg', host);
    const toSvg = e => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
    const markup = (t, cls, color) => { const m = c.mark ? c.mark(t) : t; const lbl = t.label;
      const w = Math.min(330, 12 + lbl.length * 6.8), left = m.x + w + 12 > c.f.W ? m.x - w - 10 : m.x + 10, ty = Math.max(14, m.y - 34);
      return `<g class="pickmark ${cls}"><path d="M${m.x} ${c.f.t}V${c.f.b}" stroke="${color}" stroke-width="1.2" stroke-dasharray="3 3"/><circle cx="${m.x}" cy="${m.y}" r="7" fill="${color}" stroke="#fffdf6" stroke-width="2.5"/>`
        + `<rect x="${left}" y="${ty}" width="${w}" height="22" rx="11" fill="${color}"/><text class="picktip" x="${left + w / 2}" y="${ty + 15}" text-anchor="middle">${esc(lbl)}</text></g>`; };
    const hover = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g'); svg.appendChild(hover);
    svg.addEventListener('pointermove', e => { if (locked) return; const p = toSvg(e); if (p.x < c.f.l - 6 || p.x > c.f.r + 6) { hover.innerHTML = ''; return; } const t = c.hit(p.x, p.y); hover.innerHTML = `<g opacity=".38">${markup(t, 'hov', '#3b3222')}</g>`; });
    svg.addEventListener('pointerleave', () => hover.innerHTML = '');
    svg.addEventListener('click', e => { if (locked) return; const p = toSvg(e); if (p.x < c.f.l - 6 || p.x > c.f.r + 6) return; sel = c.hit(p.x, p.y);
      $$('.pickmark.sel', svg).forEach(n => n.remove()); svg.insertAdjacentHTML('beforeend', markup(sel, 'sel', '#3b3222')); $('[data-read]', host).innerHTML = `Your choice: <b>${esc(sel.label)}</b>`; ctx.changed(); });
    return {
      ready: () => !!sel,
      check() { const ok = q.accept(sel); $$('.pickmark.sel', svg).forEach(n => n.remove()); svg.insertAdjacentHTML('beforeend', markup(sel, 'sel', ok ? '#2f7a40' : '#a8483f')); return { ok }; },
      reveal() { const t = q.correct(); svg.insertAdjacentHTML('beforeend', markup(t, 'ans', '#2f7a40')); },
      lock() { locked = true; hover.innerHTML = ''; $('[data-plot]', host).classList.remove('pickable'); },
    };
  }

  /* ── click a slice of the donut ── */
  function slice(q, host, ctx) {
    const c = CH.donut({ hideValues: q.hideValues }); let sel = null, locked = false;
    host.innerHTML = `<div class="qfig">${q.cap ? `<div class="cap">${q.cap}</div>` : ''}<div class="pickable">${c.svg}</div></div><p class="calcnote" data-read>Click a slice of the ring.</p>`;
    const svg = $('svg', host);
    const paint = () => { $$('[data-seg]', svg).forEach(p => { const i = +p.dataset.seg; p.setAttribute('stroke', i === sel ? '#3b3222' : '#fffdf6'); p.setAttribute('stroke-width', i === sel ? 4 : 2); }); };
    svg.addEventListener('click', e => { if (locked) return; const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()), h = c.hitXY(p.x, p.y);
      if (!h) return; sel = h.i; paint(); $('[data-read]', host).innerHTML = `Your choice: <b>${c.segs[sel].name}</b>`; ctx.changed(); });
    return {
      ready: () => sel !== null,
      check() { const ok = sel === q.answer; $(`[data-seg="${sel}"]`, svg).setAttribute('stroke', ok ? '#2f7a40' : '#a8483f'); return { ok }; },
      reveal() { const p = $(`[data-seg="${q.answer}"]`, svg); p.setAttribute('stroke', '#2f7a40'); p.setAttribute('stroke-width', 5); },
      lock() { locked = true; },
    };
  }

  /* ── set the height of each bar ── */
  function bars(q, host, ctx) {
    const n = q.bars.length, W = 640, H = 330, l = 56, r = 20, t = 30, b = 64, bw = (W - l - r) / n, Y = v => H - b - (H - b - t) * v / q.max;
    const vals = q.bars.map(() => q.startAt), moved = q.bars.map(() => false); let locked = false, shown = false;
    const draw = () => {
      let s = '';
      for (let v = 0; v <= q.max; v += q.grid) s += `<path class="ch-grid" d="M${l} ${CH.r1(Y(v))}H${W - r}"/><text class="ch-tick" x="${l - 8}" y="${CH.r1(Y(v)) + 4}" text-anchor="end">${v}${q.unit}</text>`;
      q.bars.forEach((B, i) => {
        const x = l + i * bw, cx = x + bw / 2, w = Math.min(70, bw * .42);
        if (B.ref !== undefined) s += `<rect x="${CH.r1(cx - w - 4)}" y="${CH.r1(Y(B.ref))}" width="${CH.r1(w)}" height="${CH.r1(Y(0) - Y(B.ref))}" rx="3" fill="#b3c0c8"/><text class="ch-tick" x="${CH.r1(cx - w / 2 - 4)}" y="${CH.r1(Y(B.ref)) - 6}" text-anchor="middle">${B.ref}${q.unit}</text>`;
        const bx = B.ref !== undefined ? cx + 4 : cx - w / 2, v = vals[i];
        s += `<rect x="${CH.r1(bx)}" y="${CH.r1(Y(v))}" width="${CH.r1(w)}" height="${CH.r1(Y(0) - Y(v))}" rx="3" fill="${B.c || '#aa6553'}" data-col="${i}"/>`;
        s += `<g class="bh-handle" data-h="${i}"><rect x="${CH.r1(bx - 6)}" y="${CH.r1(Y(v) - 11)}" width="${CH.r1(w + 12)}" height="22" fill="transparent"/><rect x="${CH.r1(bx + w / 2 - 16)}" y="${CH.r1(Y(v) - 5)}" width="32" height="10" rx="5" fill="#3b3222"/></g>`;
        s += `<text class="ch-lab" x="${CH.r1(bx + w / 2)}" y="${CH.r1(Y(v)) - 14}" text-anchor="middle" style="font-weight:900">${Math.round(v)}${q.unit}</text>`;
        if (shown) s += `<path d="M${CH.r1(bx - 6)} ${CH.r1(Y(B.ans))}H${CH.r1(bx + w + 6)}" stroke="#2f7a40" stroke-width="3"/><text class="ch-lab" x="${CH.r1(bx + w + 8)}" y="${CH.r1(Y(B.ans)) + 4}" style="fill:#2f7a40">${B.ans}${q.unit}</text>`;
        s += `<text class="ch-lab" x="${CH.r1(cx)}" y="${H - b + 20}" text-anchor="middle">${B.label}</text>` + (B.sub ? `<text class="ch-tick" x="${CH.r1(cx)}" y="${H - b + 36}" text-anchor="middle">${B.sub}</text>` : '');
      });
      s += `<path class="ch-axis" d="M${l} ${Y(0)}H${W - r}"/>`;
      if (q.legend) s += `<rect x="${l}" y="6" width="12" height="12" rx="2" fill="#b3c0c8"/><text class="ch-tick" x="${l + 18}" y="16">${q.legend[0]}</text><rect x="${l + 190}" y="6" width="12" height="12" rx="2" fill="#aa6553"/><text class="ch-tick" x="${l + 208}" y="16">${q.legend[1]}</text>`;
      $('[data-plot]', host).innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bars you can drag up and down">${s}</svg>`;
    };
    host.innerHTML = `<div class="qfig barsw">${q.cap ? `<div class="cap">${q.cap}</div>` : ''}<div data-plot></div></div><p class="calcnote">Drag the dark handle on each bar up or down (or click inside a column). Arrow keys work too after you click a bar.</p>`;
    draw();
    let active = 0;
    const plot = $('[data-plot]', host);
    const setFrom = (e, i) => { const svg = $('svg', plot), pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      let v = (H - b - p.y) / (H - b - t) * q.max; v = Math.max(0, Math.min(q.max, Math.round(v / q.step) * q.step)); vals[i] = v; moved[i] = true; draw(); ctx.changed(); };
    plot.addEventListener('pointerdown', e => { if (locked) return; const svg = $('svg', plot), pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      const i = Math.floor((p.x - l) / bw); if (i < 0 || i >= n) return; active = i; e.preventDefault(); setFrom(e, i);
      const mv = ev => setFrom(ev, i), up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); });
    plot.tabIndex = 0;
    plot.addEventListener('keydown', e => { if (locked) return; if (e.key === 'ArrowLeft') active = Math.max(0, active - 1); else if (e.key === 'ArrowRight') active = Math.min(n - 1, active + 1);
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { vals[active] = Math.max(0, Math.min(q.max, vals[active] + (e.key === 'ArrowUp' ? q.step : -q.step))); moved[active] = true; draw(); ctx.changed(); } else return; e.preventDefault(); e.stopPropagation(); });
    return {
      ready: () => moved.some(Boolean),
      check() { const off = q.bars.map((B, i) => Math.abs(vals[i] - B.ans) > q.tol); const ok = !off.some(Boolean);
        $$('[data-col]', plot).forEach(rc => rc.setAttribute('fill', off[+rc.dataset.col] ? '#a8483f' : '#2f7a40'));
        return { ok, msg: ok ? '' : `${off.filter(Boolean).length} of ${n} bars are more than ${q.tol}${q.unit} away.` }; },
      reveal() { shown = true; const keep = $$('[data-col]', plot).map(rc => rc.getAttribute('fill')); draw(); $$('[data-col]', plot).forEach((rc, i) => rc.setAttribute('fill', keep[i])); },
      lock() { locked = true; },
    };
  }

  /* ── choose a figure ── */
  function figmc(q, host, ctx) {
    const order = shuffle(q.figs.map((f, i) => i), ctx.rng); let pick = null, locked = false;
    host.innerHTML = `<div class="figopts">${order.map((i, k) => `<button type="button" class="figopt" data-i="${i}">${q.figs[i].svg}<span class="k">${LET[k]}</span>${q.figs[i].label ? `<div class="fl">${q.figs[i].label}</div>` : ''}</button>`).join('')}</div>`;
    const set = i => { if (locked) return; pick = i; $$('.figopt', host).forEach(b => b.classList.toggle('sel', +b.dataset.i === i)); ctx.changed(); };
    host.addEventListener('click', e => { const b = e.target.closest('.figopt'); if (b) set(+b.dataset.i); });
    return {
      ready: () => pick !== null,
      key: k => { const n = LET.indexOf(k.toUpperCase()); if (n >= 0 && n < order.length) { set(order[n]); return true; } },
      check() { const ok = pick === q.answer; $(`.figopt[data-i="${pick}"]`, host).classList.add(ok ? 'right' : 'wrong'); return { ok }; },
      reveal() { $(`.figopt[data-i="${q.answer}"]`, host).classList.add('right'); },
      lock() { locked = true; },
    };
  }

  /* ── label a diagram: drop each label in its slot ── */
  function diagram(q, host, ctx) {
    const labs = shuffle(q.labels.map((l, i) => i), ctx.rng); let locked = false;
    host.innerHTML = `<div class="qfig dg"><div style="position:relative">${q.scene}${q.slots.map((s, k) => `<div class="slot" data-zone="${k}" style="left:${s.x}%;top:${s.y}%">${s.hint || 'Drop a label here'}</div>`).join('')}</div>`
      + `<div class="pool tray" data-zone="pool">${labs.map(i => `<span class="chip" data-i="${i}">${q.labels[i]}</span>`).join('')}</div></div><p class="calcnote">Drag each label onto the diagram, or click a label and then click a dashed box.</p>`;
    const place = (chip, zone) => {
      if (zone.dataset.zone === 'pool') { zone.appendChild(chip); return; }
      const old = $('.chip', zone); if (old && old !== chip) $('.tray', host).appendChild(old);
      zone.textContent = ''; zone.appendChild(chip);
    };
    dnd(host, ctx, { zoneSel: '[data-zone]', place, canDrag: () => !locked });
    return {
      ready: () => $$('.slot', host).every(s => $('.chip', s)),
      check() { let ok = true; $$('.slot', host).forEach(s => { const c = $('.chip', s), r = c && +c.dataset.i === q.slots[+s.dataset.zone].ans; s.classList.add(r ? 'right' : 'wrong'); if (!r) ok = false; }); return { ok }; },
      reveal() { $$('.slot.wrong', host).forEach(s => { s.title = 'Correct: ' + q.labels[q.slots[+s.dataset.zone].ans]; s.insertAdjacentHTML('beforeend', `<div style="font:700 11px Inter;color:#2f7a40;margin-top:3px">→ ${q.labels[q.slots[+s.dataset.zone].ans]}</div>`); }); },
      lock() { locked = true; },
    };
  }

  /* ── build a causal loop diagram ──
     Students place pieces, draw + and − arrows between them, and say whether their loop is reinforcing or
     balancing. Grading follows the Chapter 10 Loop Lab: a relationship is real if the bank lists it, or if a chain
     of up to three listed arrows implies it (the sign multiplied through), so a student may skip a step
     (Sea ice − Sunlight absorbed, leaving out albedo) and still be right. */
  function loopTruth(q) {
    const B = {}; q.links.forEach(([a, b, s]) => { B[a + '>' + b] = s === '-' ? -1 : 1; });
    const T = Object.assign({}, B); let cur = Object.assign({}, B);
    for (let pass = 0; pass < 2; pass++) {
      const add = {};
      Object.keys(cur).forEach(k1 => { const [a, m] = k1.split('>');
        Object.keys(B).forEach(k2 => { const [m2, c] = k2.split('>'); if (m2 !== m || c === a) return;
          const key = a + '>' + c; if (B[key] !== undefined) return;
          const s = cur[k1] * B[k2], prev = add[key] !== undefined ? add[key] : T[key];
          add[key] = prev === undefined || prev === s ? s : 0; });   // 0: two chains disagree, so either sign is defensible
      });
      Object.keys(add).forEach(k => { T[k] = add[k]; }); cur = add;
    }
    return T;
  }
  // every simple cycle in a list of links [{a, b, s}]; each cycle starts at its alphabetically first piece
  function loopCycles(L) {
    const ids = [...new Set(L.flatMap(l => [l.a, l.b]))].sort(), adj = {}, out = [];
    ids.forEach(i => { adj[i] = []; }); L.forEach((l, k) => adj[l.a].push(k));
    const dfs = (st, cur, path, eds) => { if (out.length > 60 || path.length > 8) return;
      adj[cur].forEach(k => { const j = L[k].b;
        if (j === st) { out.push({ n: path.slice(), e: eds.concat(k) }); return; }
        if (j > st && !path.includes(j)) dfs(st, j, path.concat(j), eds.concat(k)); }); };
    ids.forEach(i => dfs(i, i, [i], []));
    return out.map(c => Object.assign(c, { neg: c.e.filter(k => L[k].s < 0).length }));
  }
  // pure grader (also used by tools/check_bank.js, and later by the server): links = [{a, b, s: 1|-1}], kind = 'R'|'B'
  function loopGrade(q, links, kind) {
    const T = loopTruth(q), N = id => q.pieces[id], fb = [];
    // lower-case a name mid-sentence, but keep proper nouns and chemical formulas (Arctic, Earth’s, CO₂)
    const lc = id => { const t = N(id); return /^(Arctic|Antarctic|Earth|Greenland|[A-Z]{2}|[A-Z][A-Z₀-₉])/.test(t) ? t : t[0].toLowerCase() + t.slice(1); };
    const inSystem = id => Object.keys(T).some(k => k.split('>').includes(id));
    const cls = links.map(l => { const t = T[l.a + '>' + l.b]; return t === undefined ? 'bad' : t === 0 || t === l.s ? 'ok' : 'sign'; });
    const outside = new Set();
    links.forEach((l, k) => {
      if (cls[k] === 'bad') {
        const off = [l.a, l.b].filter(id => !inSystem(id));
        if (off.length) off.forEach(id => outside.add(id));
        else if (T[l.b + '>' + l.a] !== undefined) fb.push(`${N(l.a)} → ${N(l.b)} points the wrong way. Does ${lc(l.a)} change ${lc(l.b)}, or the other way around?`);
        else fb.push(`${N(l.a)} → ${N(l.b)} is not a cause-and-effect link in this system.`);
      }
      if (cls[k] === 'sign') fb.push(`Check the sign on ${N(l.a)} → ${N(l.b)}: when ${lc(l.a)} goes up, does ${lc(l.b)} go up (+) or down (−)?`);
    });
    outside.forEach(id => fb.unshift(`${N(id)} is not part of this feedback.`));
    const okIdx = links.map((l, k) => k).filter(k => cls[k] === 'ok'), real = okIdx.map(k => links[k]), cyc = loopCycles(real);
    const through = cyc.filter(c => q.goal.must.every(m => c.n.includes(m)));
    const goal = through.find(c => (c.neg % 2 ? 'B' : 'R') === q.goal.kind) || through[0] || null;
    if (!goal) {
      const anyLoop = loopCycles(links);
      const best = anyLoop.sort((x, y) => q.goal.must.filter(m => y.n.includes(m)).length - q.goal.must.filter(m => x.n.includes(m)).length)[0];
      const missing = best ? q.goal.must.filter(m => !best.n.includes(m)) : [];
      if (best && missing.length) fb.push(`Your loop leaves out ${missing.map(m => lc(m)).join(' and ')}. The feedback has to pass through it.`);
      else if (!best) fb.push(`Your arrows do not close a loop yet. Follow them from ${lc(q.goal.must[0])}: they should lead back to where they started.`);
    }
    const neg = goal ? goal.neg : null;
    if (kind !== q.goal.kind) fb.push(goal
      ? `Count the minus signs around your loop: ${neg === 0 ? 'none' : neg === 1 ? 'one' : neg}. An even number (zero counts) makes a reinforcing loop; an odd number makes a balancing loop.`
      : 'To name a loop, count its minus signs: an even number (zero counts) makes it reinforcing; an odd number makes it balancing.');
    const ok = !cls.some(c => c !== 'ok') && !!goal && kind === q.goal.kind;
    return { ok, cls, goal, goalLinks: goal ? goal.e.map(k => okIdx[k]) : null, fb: ok ? [] : fb };
  }

  function loop(q, host, ctx) {
    const W = 860, H = 480, NW = 196, ids = Object.keys(q.pieces), order = shuffle(ids, ctx.rng);
    const SLOTS = [[.17, .19], [.5, .15], [.83, .19], [.86, .52], [.83, .84], [.5, .87], [.17, .84], [.14, .52], [.5, .51]].map(([x, y]) => [x * W, y * H]);
    const lines = t => { const out = [], w = String(t).split(' '); let cur = ''; w.forEach(x => { if (cur && (cur + ' ' + x).length > 19) { out.push(cur); cur = x; } else cur = cur ? cur + ' ' + x : x; }); out.push(cur); return out; };
    const hOf = id => 26 + 21 * lines(q.pieces[id]).length;
    const clampN = (id, x, y) => { const h = hOf(id); return { x: Math.max(NW / 2 + 8, Math.min(W - NW / 2 - 8, x)), y: Math.max(h / 2 + 8, Math.min(H - h / 2 - 8, y)) }; };
    let built = false, nodes = {}, links = [], mode = 'p', pend = null, kind = null, locked = false, marks = null, drag = null, rubber = null, goalE = null;
    const freeSlot = () => { const taken = Object.values(nodes); let best = SLOTS[0], bd = -1;
      SLOTS.forEach(s => { const d = taken.length ? Math.min(...taken.map(n => Math.hypot(n.x - s[0], n.y - s[1]))) : 999; if (d > bd + 40) { bd = d; best = s; } });
      return best; };
    (q.start || []).forEach(id => { const s = freeSlot(); nodes[id] = clampN(id, s[0], s[1]); });

    const TOOLS = [['p', '<b class="lp-plus">+</b> arrow', 'Plus arrow: the two pieces move the same way'], ['n', '<b class="lp-minus">−</b> arrow', 'Minus arrow: the two pieces move in opposite ways'], ['m', 'Move', 'Move pieces'], ['x', 'Erase', 'Erase: click a piece or an arrow’s sign to remove it']];
    host.innerHTML = `<div class="lp">
      <div class="lp-tray" role="group" aria-label="Pieces you can add"><span class="lp-tl">Pieces</span>${order.map(id => `<button type="button" class="lp-piece" data-p="${id}">${esc(q.pieces[id])}</button>`).join('')}</div>
      <div class="lp-tools" role="toolbar" aria-label="Drawing tools">${TOOLS.map(([m, lab, tip]) => `<button type="button" data-mode="${m}" title="${tip}" aria-label="${tip}" aria-pressed="${m === mode}">${lab}</button>`).join('')}<span class="sp"></span><button type="button" data-clear>Clear</button></div>
      <div class="lp-canvas"><svg viewBox="0 0 ${W} ${H}" role="application" aria-label="Loop diagram canvas"></svg></div>
      <p class="calcnote lp-help" data-help></p>
      <div class="lp-status" data-status></div>
      <div class="lp-kind" role="radiogroup" aria-label="What kind of loop did you build?"><span class="lp-kq">Your loop is</span>
        <button type="button" role="radio" aria-checked="false" data-k="R"><b>R</b> Reinforcing</button><button type="button" role="radio" aria-checked="false" data-k="B"><b>B</b> Balancing</button></div>
      <div class="lp-fb" data-lfb></div><div data-sol></div><ul class="sr-only" data-list aria-label="Arrows in your diagram"></ul><div class="sr-only" data-say aria-live="polite"></div></div>`;
    const svg = $('svg', host), status = $('[data-status]', host);
    const HELP = { p: 'Drag from one piece to another to draw a <b>+</b> arrow, or click one piece and then the other. <b>+</b> means they move the same way: one goes up, the other goes up.',
      n: 'Drag from one piece to another to draw a <b>−</b> arrow, or click one piece and then the other. <b>−</b> means they move in opposite ways: one goes up, the other goes down.',
      m: 'Drag pieces to tidy your diagram. With the keyboard, focus a piece and use the arrow keys.', x: 'Click a piece or an arrow’s sign to remove it.' };
    const say = t => { $('[data-say]', host).textContent = t; };
    // describe a cycle starting from the piece the question names, so it reads like the prompt
    const tour = c => { const k = Math.max(0, c.n.indexOf(q.goal.must.find(m => c.n.includes(m)))), n = c.n.slice(k).concat(c.n.slice(0, k));
      return n.map(id => esc(q.pieces[id])).join(' → ') + ' → back to ' + esc(q.pieces[n[0]]); };

    const edge = (n, h, tx, ty, pad) => { const dx = tx - n.x, dy = ty - n.y, hw = NW / 2 + pad, hh = h / 2 + pad; const t = Math.min(hw / Math.abs(dx || 1e-6), hh / Math.abs(dy || 1e-6)); return [n.x + dx * t, n.y + dy * t]; };
    const geo = (N, a, b) => { const A = N[a], B = N[b], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, bend = Math.min(56, d * .16);
      const cx = (A.x + B.x) / 2 - dy / d * bend, cy = (A.y + B.y) / 2 + dx / d * bend, p0 = edge(A, A.h, cx, cy, 5), p1 = edge(B, B.h, cx, cy, 12);
      return { d: `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`, mx: .25 * p0[0] + .5 * cx + .25 * p1[0], my: .25 * p0[1] + .5 * cy + .25 * p1[1] }; };
    const COL = { ink: '#3b3222', grn: '#2f7a40', red: '#a8483f', gold: '#b08a43' };
    const defs = pre => `<defs>${Object.entries(COL).map(([k, c]) => `<marker id="${pre}${k}" viewBox="0 0 12 12" refX="3" refY="6" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L12 6L0 12z" fill="${c}"/></marker>`).join('')}</defs>`;
    // draw a diagram: N = {id: {x, y, h}}, L = [{a, b, s}], o = {marks, interactive, hi: set of highlighted link indexes, pre}
    function render(N, L, o) {
      let s = defs(o.pre);
      L.forEach((l, k) => { if (o.hi && o.hi.has(k)) { const g = geo(N, l.a, l.b); s += `<path d="${g.d}" fill="none" stroke="${COL.gold}" stroke-width="14" stroke-linecap="round" opacity=".28"/>`; } });
      L.forEach((l, k) => { const g = geo(N, l.a, l.b), m = o.marks && o.marks[k], col = m ? (m === 'ok' ? 'grn' : 'red') : 'ink';
        s += `<path d="${g.d}" fill="none" stroke="${COL[col]}" stroke-width="3" ${m === 'bad' ? 'stroke-dasharray="9 6"' : ''} marker-end="url(#${o.pre}${col})" ${o.interactive ? `data-lp="${k}"` : ''} class="lp-edge"/>`;
        const lab = `${q.pieces[l.a]} ${l.s > 0 ? 'plus' : 'minus'} ${q.pieces[l.b]}`;
        s += `<g class="lp-badge ${l.s > 0 ? 'pos' : 'neg'}${m ? ' m-' + m : ''}" transform="translate(${g.mx.toFixed(1)} ${g.my.toFixed(1)})" ${o.interactive ? `data-l="${k}" tabindex="0" role="button" aria-label="Arrow: ${esc(lab)}. Enter flips the sign; Delete removes it."` : ''}>`
          + `<circle r="15"/><text y="7" text-anchor="middle">${l.s > 0 ? '+' : '−'}</text>${m && m !== 'ok' ? `<g transform="translate(14 -14)"><circle r="9" class="x"/><text y="4.5" text-anchor="middle" class="x">✕</text></g>` : ''}</g>`; });
      Object.keys(N).forEach(id => { const n = N[id], ls = lines(q.pieces[id]), h = n.h;
        s += `<g class="lp-node${pend === id && o.interactive ? ' pend' : ''}" transform="translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})" ${o.interactive ? `data-n="${id}" tabindex="0" role="button" aria-label="${esc(q.pieces[id])}${pend === id ? ', arrow starts here' : ''}"` : ''}>`
          + `<rect x="${-NW / 2}" y="${-h / 2}" width="${NW}" height="${h}" rx="12"/>${ls.map((t, i) => `<text y="${(i - (ls.length - 1) / 2) * 21 + 6}" text-anchor="middle">${esc(t)}</text>`).join('')}</g>`; });
      return s;
    }
    const withH = N => { const o = {}; Object.keys(N).forEach(id => { o[id] = { x: N[id].x, y: N[id].y, h: hOf(id) }; }); return o; };

    function draw(focus) {
      const cyc = marks ? [] : loopCycles(links), big = cyc.sort((x, y) => y.n.length - x.n.length)[0];
      let s = render(withH(nodes), links, { marks, interactive: !locked, hi: marks ? goalE : big ? new Set(big.e) : null, pre: 'lpm' });
      if (rubber) { const A = nodes[rubber.from]; s += `<path d="M${A.x} ${A.y} L${rubber.x} ${rubber.y}" stroke="${mode === 'n' ? '#9a5a47' : '#2f4a66'}" stroke-width="3" stroke-dasharray="7 6" fill="none" pointer-events="none"/>`; }
      svg.innerHTML = s;
      $$('.lp-piece', host).forEach(b => { const on = !!nodes[b.dataset.p]; b.classList.toggle('on', on); b.setAttribute('aria-label', q.pieces[b.dataset.p] + (on ? ' (on the canvas)' : '')); });
      $('[data-help]', host).innerHTML = locked ? '' : HELP[mode] + (links.length && mode !== 'x' ? ' Click a sign to flip it.' : '');
      if (!marks) status.innerHTML = big ? `<span class="lp-ring">↻</span> Your arrows close a loop: ${tour(big)}.`
        : Object.keys(nodes).length < 2 ? 'Add pieces from the list above, then connect them with arrows.' : 'No closed loop yet: keep following the arrows until they lead back to where they started.';
      $('[data-list]', host).innerHTML = links.map(l => `<li>${esc(q.pieces[l.a])} ${l.s > 0 ? 'plus' : 'minus'} ${esc(q.pieces[l.b])}</li>`).join('');
      if (focus) { const el = $(focus, svg); if (el) el.focus({ preventScroll: true }); }
      if (built) ctx.changed();
    }
    const addNode = (id, x, y) => { if (nodes[id] || locked) return; const s = x === undefined ? freeSlot() : [x, y]; nodes[id] = clampN(id, s[0], s[1]); say(q.pieces[id] + ' added.'); draw(`[data-n="${id}"]`); };
    const removeNode = id => { delete nodes[id]; links = links.filter(l => l.a !== id && l.b !== id); if (pend === id) pend = null; draw(); say(q.pieces[id] + ' removed.'); };
    const addLink = (a, b) => { if (a === b) return; const s = mode === 'n' ? -1 : 1, k = links.findIndex(l => l.a === a && l.b === b);
      if (k >= 0) links[k].s = s; else links.push({ a, b, s }); pend = null; draw(`[data-n="${b}"]`);
      say(`Arrow: ${q.pieces[a]} ${s > 0 ? '+' : '−'} ${q.pieces[b]}.`); };
    const flip = k => { links[k].s *= -1; draw(`[data-l="${k}"]`); };
    const removeLink = k => { links.splice(k, 1); draw(); };
    const tapNode = id => {
      if (mode === 'x') { removeNode(id); return; }
      if (mode === 'm') return;
      if (pend && pend !== id) { addLink(pend, id); return; }
      pend = pend === id ? null : id; draw(`[data-n="${id}"]`);
      if (pend) say(`Arrow starts at ${q.pieces[id]}. Now choose the piece it points to.`);
    };
    const pt = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
    const nodeAt = e => { const el = document.elementFromPoint(e.clientX, e.clientY), g = el && el.closest('[data-n]'); return g && svg.contains(g) ? g.dataset.n : null; };

    svg.addEventListener('pointerdown', e => {
      if (locked || e.button > 0) return;
      const badge = e.target.closest('[data-l]'), edgeP = e.target.closest('[data-lp]'), node = e.target.closest('[data-n]');
      if (badge || (edgeP && mode === 'x')) { e.preventDefault(); const k = +(badge || edgeP).dataset[badge ? 'l' : 'lp']; mode === 'x' ? removeLink(k) : flip(k); return; }
      if (!node) { if (pend) { pend = null; draw(); } return; }
      e.preventDefault(); const p = pt(e), id = node.dataset.n;
      drag = { id, x0: p.x, y0: p.y, ox: nodes[id].x, oy: nodes[id].y, moved: false };
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener('pointermove', e => {
      if (!drag) return; const p = pt(e);
      if (!drag.moved && Math.hypot(p.x - drag.x0, p.y - drag.y0) < 7) return; drag.moved = true;
      if (mode === 'm') { nodes[drag.id] = clampN(drag.id, drag.ox + p.x - drag.x0, drag.oy + p.y - drag.y0); draw(); }
      else if (mode !== 'x') { rubber = { from: drag.id, x: p.x, y: p.y }; draw(); }
    });
    const end = e => {
      if (!drag) return; const d = drag; drag = null; const had = !!rubber; rubber = null;
      if (!d.moved) { tapNode(d.id); return; }
      if (had) { const to = nodeAt(e); if (to && to !== d.id) addLink(d.id, to); else draw(); }
    };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', () => { drag = null; rubber = null; draw(); });
    svg.addEventListener('keydown', e => {
      if (locked) return;
      const b = e.target.closest('[data-l]'), n = e.target.closest('[data-n]');
      if (b) { const k = +b.dataset.l;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); flip(k); }
        else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeLink(k); svg.focus(); } return; }
      if (!n) return; const id = n.dataset.n;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); tapNode(id); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeNode(id); }
      else if (e.key === 'Escape' && pend) { e.stopPropagation(); pend = null; draw(`[data-n="${id}"]`); say('Arrow cancelled.'); }
      else if (/^Arrow/.test(e.key)) { e.preventDefault(); e.stopPropagation(); const st = 20, v = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
        nodes[id] = clampN(id, nodes[id].x + v[0], nodes[id].y + v[1]); draw(`[data-n="${id}"]`); }
    });

    // the tray: click a piece to place it, or drag it onto the canvas
    $('.lp-tray', host).addEventListener('pointerdown', e => {
      const c = e.target.closest('.lp-piece'); if (!c || locked || nodes[c.dataset.p] || e.button > 0) return;
      const x0 = e.clientX, y0 = e.clientY; let fly = null;
      const mv = ev => { if (!fly && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return;
        if (!fly) { fly = c.cloneNode(true); fly.className = 'lp-piece flying'; document.body.appendChild(fly); }
        fly.style.left = (ev.clientX - 40) + 'px'; fly.style.top = (ev.clientY - 18) + 'px'; };
      const up = ev => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up);
        if (!fly) return; fly.remove(); c.__dragged = true; setTimeout(() => { c.__dragged = false; }, 60);
        const r = svg.getBoundingClientRect(); if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) { const p = pt(ev); addNode(c.dataset.p, p.x, p.y); } };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
    $('.lp-tray', host).addEventListener('click', e => { const c = e.target.closest('.lp-piece'); if (!c || locked || c.__dragged) return;
      const id = c.dataset.p; if (nodes[id]) { const g = $(`[data-n="${id}"]`, svg); g && g.focus(); return; } addNode(id); });
    $$('[data-mode]', host).forEach(b => b.onclick = () => { if (locked) return; mode = b.dataset.mode; pend = null; $$('[data-mode]', host).forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); });
    $('[data-clear]', host).onclick = () => { if (locked) return; const keep = {}; (q.start || []).forEach(id => { keep[id] = nodes[id]; }); nodes = keep; links = []; pend = null; draw(); say('Diagram cleared.'); };
    const setKind = k => { if (locked) return; kind = k; $$('[data-k]', host).forEach(x => x.setAttribute('aria-checked', x.dataset.k === k)); ctx.changed(); };
    $$('[data-k]', host).forEach(b => b.onclick = () => setKind(b.dataset.k));
    $('.lp-kind', host).addEventListener('keydown', e => { if (/^Arrow(Left|Right|Up|Down)$/.test(e.key)) { e.preventDefault(); e.stopPropagation(); const nk = kind === 'R' ? 'B' : 'R'; setKind(nk); $(`[data-k="${nk}"]`, host).focus(); } });
    draw(); built = true;

    return {
      ready: () => links.length >= 2 && !!kind,
      check() {
        const g = loopGrade(q, links, kind); marks = g.cls; goalE = g.goalLinks ? new Set(g.goalLinks) : null; pend = null; draw();
        status.innerHTML = g.goal ? `<span class="lp-ring">↻</span> Loop found: ${tour(g.goal)} (${g.goal.neg === 0 ? 'no' : g.goal.neg} minus sign${g.goal.neg === 1 ? '' : 's'}).` : '';
        $('[data-lfb]', host).innerHTML = g.ok ? '' : `<div class="lp-fbh">What to look at</div><ul>${g.fb.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
        $$('[data-k]', host).forEach(b => { if (b.dataset.k === kind) b.classList.add(kind === q.goal.kind ? 'right' : 'wrong'); });
        const n = g.cls.filter(c => c !== 'ok').length;
        return { ok: g.ok, msg: g.ok ? '' : n ? `${n} arrow${n > 1 ? 's need' : ' needs'} another look.` : !g.goal ? 'the loop is not complete.' : 'check what kind of loop it is.' };
      },
      reveal() {
        const sol = q.sol, cx = W / 2, cy = 190, rx = 290, ry = 130, N = {}, T = loopTruth(q);
        sol.forEach((id, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / sol.length; N[id] = { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) * (sol.length === 3 ? 1.05 : 1) + (sol.length === 3 ? 30 : 0), h: hOf(id) }; });
        const L = sol.map((id, i) => ({ a: id, b: sol[(i + 1) % sol.length], s: T[id + '>' + sol[(i + 1) % sol.length]] || 1 })), neg = L.filter(l => l.s < 0).length;
        $('[data-sol]', host).innerHTML = `<div class="qfig lp-solfig"><div class="cap">One correct loop · ${q.goal.kind === 'R' ? 'Reinforcing' : 'Balancing'} (${neg === 0 ? 'no' : neg} minus sign${neg === 1 ? '' : 's'})</div><svg viewBox="0 0 ${W} 400" role="img" aria-label="Correct loop: ${esc(L.map(l => q.pieces[l.a] + (l.s > 0 ? ' plus ' : ' minus ')).join('') + q.pieces[sol[0]])}">${render(N, L, { pre: 'lps' })}</svg></div>`;
        $$('[data-k]', host).forEach(b => { if (b.dataset.k === q.goal.kind) b.classList.add('right'); });
      },
      lock() { locked = true; host.querySelector('.lp').classList.add('locked'); draw(); },
    };
  }

  /* ── live pictures for the sliders ── */
  const VIZ = {
    // the greenhouse model: ΔT ≈ 3 °C × log2(CO2 / 280)
    co2temp(v, q, x) {
      const dT = 3 * Math.log2(v / 280), T0 = 15, Ts = T0 + dT, W = 420, H = 260, l = 40, r = 380, X = p => l + (r - l) * (p - 150) / (1150 - 150);
      const marks = [[180, 'ice age'], [280, 'pre-1800s'], [420, 'today'], [560, '2× pre-1800s'], [1120, '4×']].filter(m => !(q.hide || []).includes(m[0]));
      let s = `<rect x="${l}" y="40" width="${r - l}" height="18" rx="9" fill="url(#vzG)"/>` + marks.map(([p, t], i) => `<path d="M${X(p)} 36V62" stroke="#3b3222" stroke-width="1.2"/><text class="ch-tick" x="${X(p)}" y="${i % 2 ? 84 : 30}" text-anchor="middle">${p} · ${t}</text>`).join('');
      if (x && x.show !== undefined) s += `<path d="M${X(x.show)} 34V64" stroke="#2f7a40" stroke-width="4"/>`;
      s += `<circle cx="${X(v)}" cy="49" r="11" fill="#fffaf0" stroke="#3b3222" stroke-width="3"/>`;
      // thermometer
      const tx = 210, tTop = 110, tBot = 222, tY = t => tBot - (tBot - tTop) * (t - 8) / (26 - 8), fillY = tY(Math.max(8, Math.min(26, Ts)));
      s += `<rect x="${tx - 9}" y="${tTop - 6}" width="18" height="${tBot - tTop + 12}" rx="9" fill="#fffdf6" stroke="#3b3222" stroke-width="1.6"/><rect x="${tx - 5}" y="${fillY}" width="10" height="${tBot - fillY + 6}" rx="5" fill="${CH.stripe((Ts - 9) / 16)}"/>`
        + `<circle cx="${tx}" cy="${tBot + 14}" r="13" fill="${CH.stripe((Ts - 9) / 16)}" stroke="#3b3222" stroke-width="1.6"/>`;
      [10, 15, 20, 25].forEach(t => { s += `<path d="M${tx + 10} ${tY(t)}h7" stroke="#3b3222"/><text class="ch-tick" x="${tx + 21}" y="${tY(t) + 4}">${t}°C</text>`; });
      s += `<text x="${tx - 26}" y="${tY(Ts) + 5}" text-anchor="end" style="font:900 20px Merriweather,serif;fill:#3b3222">${Ts.toFixed(1)}°C</text><text class="ch-tick" x="${tx - 26}" y="${tY(Ts) + 22}" text-anchor="end">average surface</text>`;
      return { svg: `<svg viewBox="0 0 ${W} ${H}"><defs><linearGradient id="vzG">${CH.STRIPES.map((c, i) => `<stop offset="${i / 9}" stop-color="${c}"/>`).join('')}</linearGradient></defs>${s}</svg>`,
        sub: `Model warming vs pre-1800s: <b>${dT >= 0 ? '+' : '−'}${Math.abs(dT).toFixed(1)} °C</b>` };
    },
    // today's CO2 on the 800,000-year record (the modern spike hidden)
    ppm(v, q, x) {
      const c = CH.co2({ hideModern: true, hideCeiling: q.hideCeiling }), f = c.f;
      let add = `<path d="M${f.l} ${CH.r1(f.Y(v))}H${f.r}" stroke="#a8483f" stroke-width="2.4"/><circle cx="${CH.r1(f.X(2025))}" cy="${CH.r1(f.Y(v))}" r="7" fill="#a8483f" stroke="#fffdf6" stroke-width="2.5"/>`
        + `<text class="ch-big" x="${f.r - 12}" y="${CH.r1(f.Y(v)) - 10}" text-anchor="end">${Math.round(v)} ppm</text>`;
      if (x && x.show !== undefined) add += `<path d="M${f.l} ${CH.r1(f.Y(x.show))}H${f.r}" stroke="#2f7a40" stroke-width="2.4" stroke-dasharray="7 4"/><text class="ch-ann" x="${f.l + 8}" y="${CH.r1(f.Y(x.show)) - 8}" style="fill:#2f7a40">2025: ${x.show} ppm</text>`;
      return { svg: c.svg.replace('</svg>', add + '</svg>'), sub: 'Drag until the red line sits at the level the air reached in 2025.' };
    },
    // pH and hydrogen ions
    ph(v, q, x) {
      const ref = q.ref, mult = Math.pow(10, ref - v), W = 420, H = 250, n = Math.round(24 * mult);
      let rnd = 1; const R = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
      let dots = ''; for (let i = 0; i < Math.min(n, 400); i++) dots += `<circle cx="${(36 + R() * 150).toFixed(1)}" cy="${(70 + R() * 150).toFixed(1)}" r="3" fill="#a8483f" opacity=".75"/>`;
      let ref0 = ''; rnd = 7; for (let i = 0; i < 24; i++) ref0 += `<circle cx="${(236 + R() * 150).toFixed(1)}" cy="${(70 + R() * 150).toFixed(1)}" r="3" fill="#7f97ad" opacity=".75"/>`;
      const beaker = (x0, lab, sub) => `<path d="M${x0} 50V226Q${x0} 236 ${x0 + 10} 236H${x0 + 162}Q${x0 + 172} 236 ${x0 + 172} 226V50" fill="#eef3f5" stroke="#3b3222" stroke-width="1.6"/><path d="M${x0} 66H${x0 + 172}" stroke="#7f97ad" stroke-width="1" stroke-dasharray="3 4"/><text class="ch-lab" x="${x0 + 86}" y="30" text-anchor="middle">${lab}</text><text class="ch-tick" x="${x0 + 86}" y="44" text-anchor="middle">${sub}</text>`;
      const svg = `<svg viewBox="0 0 ${W} ${H}">${beaker(20, 'Your seawater', 'pH ' + v.toFixed(2))}${dots}${beaker(220, 'Starting seawater', 'pH ' + ref.toFixed(2))}${ref0}</svg>`;
      return { svg, sub: `Hydrogen ions: <b>${mult.toFixed(2)}×</b> the starting water (${mult >= 1 ? '+' : ''}${((mult - 1) * 100).toFixed(0)}%)` + (x && x.show !== undefined ? `<br>Target: pH ${x.show.toFixed(2)}` : '') };
    },
    // dollars per tonne
    usd(v, q, x) {
      const W = 420, H = 150, l = 20, r = 400, X = d => l + (r - l) * d / 400;
      let s = `<path d="M${l} 90H${r}" stroke="#3b3222" stroke-width="1.4"/>` + [0, 100, 200, 300, 400].map(d => `<path d="M${X(d)} 90v6" stroke="#3b3222"/><text class="ch-tick" x="${X(d)}" y="112" text-anchor="middle">$${d}</text>`).join('');
      s += `<rect x="${X(0)}" y="40" width="${X(20) - X(0)}" height="20" fill="#2f7a40" opacity=".75"/><text class="ch-tick" x="${X(20) + 6}" y="54">cutting over half of the emissions: under $20 a tonne</text>`;
      s += `<path d="M${X(v)} 64V90" stroke="#a8483f" stroke-width="3"/><circle cx="${X(v)}" cy="64" r="8" fill="#a8483f" stroke="#fffdf6" stroke-width="2.5"/>`;
      if (x && x.show !== undefined) s += `<path d="M${X(x.show)} 30V90" stroke="#2f7a40" stroke-width="3" stroke-dasharray="5 3"/><text class="ch-tick" x="${X(x.show)}" y="26" text-anchor="middle" style="fill:#2f7a40;font-weight:800">$${x.show}</text>`;
      return { svg: `<svg viewBox="0 0 ${W} ${H}">${s}</svg>`, sub: 'Damage from emitting one tonne of CO₂, in 2020 dollars.' };
    },
  };

  return { mc, multi, fill, order, bins, match, slider, pick, slice, bars, figmc, diagram, loop, loopTruth, loopGrade, loopCycles, VIZ, shuffle, esc };
})();
