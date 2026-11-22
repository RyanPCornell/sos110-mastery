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
    host.innerHTML = `<div class="fill">${q.text.replace(/\{\{(\d+)\}\}/g, (m, i) => { const b = q.blanks[+i];
      return `<input class="blank" data-b="${i}" inputmode="${b.num !== undefined ? 'decimal' : 'text'}" autocomplete="off" spellcheck="false" aria-label="Blank ${+i + 1}" style="--w:${b.w || (b.num !== undefined ? 6 : 10)}ch">${b.unit ? `<span class="unit">${b.unit}</span>` : ''}`; })}</div>`
      + (q.note ? `<div class="calcnote">${q.note}</div>` : '');
    const ins = $$('.blank', host);
    ins.forEach(i => i.addEventListener('input', () => { i.classList.remove('right', 'wrong'); ctx.changed(); }));
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

  return { mc, multi, fill, order, bins, match, slider, pick, slice, bars, figmc, diagram, VIZ, shuffle, esc };
})();
