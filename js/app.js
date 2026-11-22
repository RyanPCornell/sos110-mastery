/* SOS 110 Mastery: the app shell. Routes: #/ (course), #/ch11 (chapter), #/ch11/5 (concept 5), #/ch11/grades.
   Mastery model: each concept is mastered the first time a student answers one of its versions fully correctly.
   A miss shows the answer, the explanation and the resources, then offers a NEW version of the problem.
   Grade = concepts mastered ÷ concepts. Progress lives in this browser (localStorage); a save code moves it. */
(function () {
  const $ = (s, el) => (el || document).querySelector(s), $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = WG.esc, CHS = window.MB_CHAPTERS, KEY = 'sos110-mastery:v1';
  const app = $('#app'), hdr = $('#hdr');
  let S = load(), view = null, cleanup = [];

  /* ── storage ── */
  function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return s; } catch (e) {} return { v: 1, student: null, ch: {} }; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save progress in this browser (private mode?). Use a save code.'); } }
  function chState(id) { return S.ch[id] || (S.ch[id] = { c: {}, t0: Date.now(), time: 0, last: null, act: 0 }); }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rngOf(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function cState(ch, c) {
    const cs = chState(ch.id), r = cs.c[c.id];
    if (r) return r;
    const seq = WG.shuffle(c.variants.map((v, i) => i), rngOf(hash((S.student ? S.student.name : '') + '|' + c.id)));
    return (cs.c[c.id] = { tries: [], m: 0, mt: 0, seq, cur: 0 });
  }
  const statusOf = r => !r || !r.tries.length ? 'new' : r.m ? 'ok' : 'wip';
  function stats(ch) {
    const cs = chState(ch.id), rs = ch.concepts.map(c => cs.c[c.id]);
    const mastered = rs.filter(r => r && r.m).length, tried = rs.filter(r => r && r.tries.length);
    const first = tried.filter(r => r.tries[0][1] === 1).length, tries = tried.reduce((a, r) => a + r.tries.filter(t => !t[3]).length, 0);
    return { mastered, n: ch.concepts.length, pct: Math.round(mastered / ch.concepts.length * 100), tried: tried.length, first, firstPct: tried.length ? Math.round(first / tried.length * 100) : 0, tries, time: cs.time || 0 };
  }
  // active time: time between interactions, capped so an idle tab doesn't count
  function tick(ch) { const cs = chState(ch.id), now = Date.now(); if (cs.act) cs.time = (cs.time || 0) + Math.min(180, (now - cs.act) / 1000); cs.act = now; }

  /* ── little helpers ── */
  function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
  const fmtTime = s => s < 60 ? Math.round(s) + ' s' : s < 3600 ? Math.round(s / 60) + ' min' : (s / 3600).toFixed(1) + ' h';
  const fmtDate = ts => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ', ' + new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const secOf = (ch, c) => ch.sections.find(s => s.id === c.sec);
  const stripes = (n) => { const t = CH.D.temp, vmin = Math.min(...t.map(q => q[1])), vmax = Math.max(...t.map(q => q[1])); const step = Math.max(1, Math.floor(t.length / n));
    return t.filter((q, i) => i % step === 0).map(q => `<i style="background:${CH.stripe((q[1] - vmin) / (vmax - vmin))}"></i>`).join(''); };
  function ring(pct, size, label) {
    const r = 42, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
    return `<svg class="ring" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${pct}% ${label || ''}"><circle cx="50" cy="50" r="${r}" fill="none" stroke="#efe6d0" stroke-width="7"/>`
      + `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${pct >= 100 ? '#2f7a40' : '#8a6a2f'}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 50 50)" style="transition:stroke-dashoffset .8s"/>`
      + (size > 60 ? `<text x="50" y="49" text-anchor="middle" style="font:italic 900 22px Merriweather,serif;fill:#3b3222">${pct}%</text><text x="50" y="64" text-anchor="middle" style="font:800 7px Inter;letter-spacing:.14em;fill:#8a6a2f">${label || ''}</text>` : `<text x="50" y="58" text-anchor="middle" style="font:900 26px Inter;fill:#3b3222">${pct}</text>`) + `</svg>`;
  }
  const seal = (n, c) => `<svg class="seal" viewBox="0 0 46 46" style="--c:${c}"><circle class="face" cx="23" cy="23" r="21"/><circle class="rim" cx="23" cy="23" r="21"/><circle class="dash" cx="23" cy="23" r="17"/><text x="23" y="24">${n}</text></svg>`;

  /* ── header ── */
  function header(crumbs) {
    const st = S.student, ch = CHS.ch11, sg = st ? stats(ch) : null;
    hdr.innerHTML = `<div class="mb-topin"><a class="mb-brand" href="#/"><svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="15" fill="#fffaf0" stroke="#3b3222" stroke-width="1.6"/><circle cx="17" cy="17" r="11.5" fill="none" stroke="#8a6a2f" stroke-width="1" stroke-dasharray="2 2.4"/><path d="M17 5.5L19.6 17L17 28.5L14.4 17Z" fill="#3b3222"/><path d="M5.5 17L17 14.6L28.5 17L17 19.4Z" fill="#a8483f"/></svg><span><small>SOS 110</small><b>Mastery</b></span></a>`
      + `<nav class="mb-crumb" aria-label="Breadcrumb">${(crumbs || []).map((c, i) => (i ? '<i>/</i>' : '') + (c[1] ? `<a href="${c[1]}">${esc(c[0])}</a>` : `<span>${esc(c[0])}</span>`)).join('')}</nav>`
      + (st ? `<div class="mb-who"><a class="btn ghost sm" href="#/ch11/grades">Gradebook</a><button class="mb-chip" data-me title="Your account and progress">${ring(sg.pct, 30)}<em>${esc(st.name.split(' ')[0])}</em></button></div>` : '')
      + `</div><div class="mb-stripes" aria-hidden="true">${stripes(90)}</div>`;
    const me = $('[data-me]', hdr); if (me) me.onclick = accountMenu;
  }

  /* ── account / save codes ── */
  function modal(html, wire) { const m = document.createElement('div'); m.className = 'mdl'; m.innerHTML = `<div class="card rule" role="dialog" aria-modal="true">${html}</div>`; document.body.appendChild(m);
    const close = () => m.remove(); m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) close(); }); document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } }); wire && wire(m, close); return m; }
  const encode = () => btoa(unescape(encodeURIComponent(JSON.stringify(S)))).replace(/(.{76})/g, '$1\n');
  function accountMenu() {
    const st = S.student;
    modal(`<div class="eb">Your account</div><h2 class="h2" style="margin-top:4px">${esc(st.name)}</h2>${st.id ? `<p class="lede" style="font-size:14px;margin:4px 0 0">ASURITE: ${esc(st.id)}</p>` : ''}`
      + `<p style="margin:14px 0 0;font:14px/1.6 Merriweather,serif">Your progress is saved in <b>this browser on this computer</b>. To keep working on another computer, copy your save code there.</p>`
      + `<div class="row" style="justify-content:flex-start"><button class="btn sm" data-a="code">Get my save code</button><button class="btn ghost sm" data-a="load">Load a save code</button><button class="btn ghost sm" data-a="out">Switch student</button></div><div class="row"><button class="btn ghost sm" data-close>Close</button></div>`,
      (m, close) => {
        $('[data-a="code"]', m).onclick = () => { close(); modal(`<div class="eb">Save code</div><h2 class="h2" style="margin-top:4px">Copy this code</h2><p style="font:14px/1.6 Merriweather,serif;margin:8px 0 0">Paste it into <b>Load a save code</b> on another computer to bring your progress with you.</p><textarea readonly>${encode()}</textarea><div class="row"><button class="btn sm" data-copy>Copy</button><button class="btn ghost sm" data-close>Done</button></div>`,
          (m2) => { const ta = $('textarea', m2); ta.select(); $('[data-copy]', m2).onclick = () => { ta.select(); (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject()).then(() => toast('Save code copied'), () => { document.execCommand('copy'); toast('Save code copied'); }); }; }); };
        $('[data-a="load"]', m).onclick = () => { close(); loadModal(); };
        $('[data-a="out"]', m).onclick = () => { if (!confirm('Switch student? This browser will forget the current progress unless you have a save code.')) return; close(); S = { v: 1, student: null, ch: {} }; save(); location.hash = '#/'; route(); };
      });
  }

  function loadModal() {
    modal(`<div class="eb">Load progress</div><h2 class="h2" style="margin-top:4px">Paste your save code</h2><p style="font:14px/1.6 Merriweather,serif;margin:8px 0 0">This replaces any progress saved in this browser.</p><textarea placeholder="Paste the code here"></textarea><div class="row"><button class="btn sm" data-go>Load</button><button class="btn ghost sm" data-close>Cancel</button></div>`,
      (m2, close2) => { setTimeout(() => $('textarea', m2).focus(), 30); $('[data-go]', m2).onclick = () => { try { const s = JSON.parse(decodeURIComponent(escape(atob($('textarea', m2).value.replace(/\s/g, ''))))); if (!s || s.v !== 1 || !s.student) throw 0; S = s; save(); close2(); toast('Progress loaded'); if (!location.hash || location.hash === '#/') location.hash = '#/ch11'; route(); } catch (e) { toast('That code could not be read. Check that you copied all of it.'); } }; });
  }

  /* ── welcome ── */
  function plate() {
    const t = CH.D.temp, vmin = Math.min(...t.map(q => q[1])), vmax = Math.max(...t.map(q => q[1])), bw = 420 / t.length;
    const band = t.map((q, i) => `<rect x="${(50 + i * bw).toFixed(2)}" y="292" width="${(bw + .4).toFixed(2)}" height="42" fill="${CH.stripe((q[1] - vmin) / (vmax - vmin))}"/>`).join('');
    const lats = [-60, -30, 0, 30, 60].map(a => { const y = 168 - 96 * Math.sin(a * Math.PI / 180), rx = 96 * Math.cos(a * Math.PI / 180); return `<ellipse cx="260" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${(rx * .16).toFixed(1)}" fill="none" stroke="#3b3222" stroke-width=".8" opacity=".5"/>`; }).join('');
    const lons = [-60, -30, 0, 30, 60].map(a => `<ellipse cx="260" cy="168" rx="${(96 * Math.abs(Math.sin(a * Math.PI / 180))).toFixed(1)}" ry="96" fill="none" stroke="#3b3222" stroke-width=".8" opacity=".5"/>`).join('');
    return `<svg viewBox="0 0 520 420" role="img" aria-label="Plate eleven: a hand-drawn globe above the warming stripes, global temperature 1850 to 2025">
      <defs><filter id="plN" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="6"/><feDisplacementMap in="SourceGraphic" scale="2.4"/></filter>
      <radialGradient id="plG" cx=".4" cy=".35"><stop offset="0" stop-color="#eef3f2"/><stop offset=".7" stop-color="#c9d8de"/><stop offset="1" stop-color="#9fb3c4"/></radialGradient></defs>
      <rect x="8" y="8" width="504" height="404" rx="6" fill="#fbf5e6" stroke="#3b3222" stroke-width="2"/><rect x="18" y="18" width="484" height="384" rx="3" fill="none" stroke="#8a6a2f" stroke-width="1"/>
      <text x="260" y="50" text-anchor="middle" style="font:800 11px Inter;letter-spacing:.32em;fill:#8a6a2f">PLATE XI · CLIMATE</text>
      <g filter="url(#plN)"><circle cx="260" cy="168" r="96" fill="url(#plG)" stroke="#3b3222" stroke-width="1.8"/>${lats}${lons}
      <path d="M164 168h192" stroke="#a8483f" stroke-width="1.2" stroke-dasharray="4 3" opacity=".8"/></g>
      <circle cx="260" cy="168" r="112" fill="none" stroke="#7f97ad" stroke-width="1" stroke-dasharray="2 5"/>
      <text x="370" y="96" style="font:italic 600 10.5px Merriweather;fill:#5e5340">the atmosphere</text><path d="M366 99q-14 6 -22 14" fill="none" stroke="#5e5340" stroke-width=".8"/>
      <text x="148" y="172" text-anchor="end" style="font:italic 600 10.5px Merriweather;fill:#a8483f">equator</text>
      <path d="M180 92 q80 -40 160 0" fill="none" stroke="#a8483f" stroke-width="1.4" stroke-dasharray="3 4"/>
      ${band}<rect x="50" y="292" width="420" height="42" fill="none" stroke="#3b3222" stroke-width="1.4"/>
      <text x="50" y="352" style="font:700 10px Inter;fill:#5e5340">1850</text><text x="470" y="352" text-anchor="end" style="font:700 10px Inter;fill:#5e5340">2025</text>
      <text x="260" y="352" text-anchor="middle" style="font:italic 600 11px Merriweather;fill:#5e5340">global temperature, one stripe per year</text>
      <g transform="translate(444 92)"><circle r="22" fill="none" stroke="#3b3222" stroke-width="1"/><path d="M0 -26L4 0L0 26L-4 0Z" fill="#3b3222"/><path d="M-26 0L0 -4L26 0L0 4Z" fill="#a8483f"/><text y="-30" text-anchor="middle" style="font:800 9px Inter;fill:#3b3222">N</text></g>
      <text x="260" y="390" text-anchor="middle" style="font:italic 900 15px Merriweather;fill:#3b3222">How Does Global Climate Change?</text></svg>`;
  }
  function welcome() {
    header([]);
    app.innerHTML = `<section class="wl"><div class="wl-plate">${plate()}</div><div><div class="eb">SOS 110 · Introduction to Sustainability</div><h1 class="h1">Practice until it sticks.</h1>`
      + `<p class="lede">Twenty concepts from each chapter's lecture, with charts to read, diagrams to label, sliders to set and problems to work. Miss one, review the material, and try a new version until you have mastered it.</p>`
      + `<form class="card rule wl-form" data-form><div class="eb">Start here</div><label for="nm">Your name</label><input class="inp" id="nm" name="nm" autocomplete="name" required placeholder="First and last name">`
      + `<label for="ar">ASURITE ID <span style="font-weight:600;letter-spacing:0;text-transform:none">(optional, printed on your report)</span></label><input class="inp" id="ar" name="ar" autocomplete="username" placeholder="e.g. jsmith12">`
      + `<div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn" type="submit">Begin</button><button class="btn ghost" type="button" data-load>I have a save code</button></div>`
      + `<p class="wl-note">Your progress is saved in this browser only; nothing is sent anywhere. Use a save code to move it to another computer.</p></form></div></section>`;
    $('[data-form]').onsubmit = e => { e.preventDefault(); const nm = $('#nm').value.trim(); if (!nm) return; S.student = { name: nm, id: $('#ar').value.trim(), at: Date.now() }; save(); location.hash = '#/ch11'; };
    $('[data-load]').onclick = loadModal;
    setTimeout(() => $('#nm') && $('#nm').focus(), 50);
  }

  /* ── course page ── */
  function course() {
    header([['Course', null]]);
    const chs = Object.values(CHS);
    app.innerHTML = `<section class="home"><div class="eb">SOS 110 · Your chapters</div><h1 class="h1">Welcome back, ${esc(S.student.name.split(' ')[0])}.</h1><p class="lede">Each chapter has twenty concepts. Master them all for full credit.</p>`
      + `<div class="tiles" style="margin-top:24px;grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">${chs.map(ch => { const s = stats(ch);
        return `<a class="tile ${s.pct >= 100 ? 'ok' : s.tried ? 'wip' : ''}" href="#/${ch.id}" style="align-items:center">${ring(s.pct, 74, 'MASTERED')}<div><div class="eb">Chapter ${ch.num} · Plate ${ch.roman}</div><div class="tt" style="font-size:22px">${ch.title}</div><div class="ts">${ch.subtitle}</div><div class="st"><i></i>${s.mastered} of ${s.n} concepts mastered</div></div></a>`; }).join('')}</div>`
      + `<p class="gb-foot" style="margin-top:22px">More chapters will appear here as they are added.</p></section>`;
  }

  /* ── chapter page ── */
  function chapter(ch) {
    header([['Course', '#/'], ['Chapter ' + ch.num + ': ' + ch.title, null]]);
    const s = stats(ch), cs = chState(ch.id);
    const next = ch.concepts.findIndex(c => !(cs.c[c.id] && cs.c[c.id].m));
    const cta = s.mastered === s.n ? 'Review the chapter' : s.tried ? 'Continue: concept ' + (next + 1) : 'Start with concept 1';
    app.innerHTML = `<section class="home"><div class="home-hero"><div class="card rule hero-l"><div class="eb">Chapter ${ch.num} · Plate ${ch.roman}</div><h1 class="h1">${ch.title}: ${ch.subtitle}</h1>`
      + `<p class="lede" style="margin-top:10px">Twenty concepts from the Chapter ${ch.num} lecture. Each one has several versions: answer one correctly to master it. Miss it, and you will see why, review the material, and get a new version to try.</p>`
      + `<div class="meta"><span><b>${s.n}</b> concepts</span><span><b>${ch.concepts.reduce((a, c) => a + c.variants.length, 0)}</b> problem versions</span><span><b>${ch.sections.length}</b> sections</span></div>`
      + `<div class="hero-cta"><a class="btn" href="#/${ch.id}/${Math.max(0, next) + 1}">${cta} ▸</a><a class="btn ghost" href="#/${ch.id}/grades">Open gradebook</a><a class="btn ghost" href="${ch.deck}" target="_blank" rel="noopener">Lecture slides ↗</a></div>`
      + `<div class="hero-band" aria-hidden="true">${stripes(60)}</div></div>`
      + `<div class="card rule grade"><div class="gl">Chapter grade</div>${ring(s.pct, 168, 'MASTERED')}<div class="gs">${s.mastered} of ${s.n} concepts mastered</div>`
      + `<div class="stats"><div><b>${s.tried}</b><span>attempted</span></div><div><b>${s.tried ? s.firstPct + '%' : '–'}</b><span>first try</span></div><div><b>${fmtTime(s.time)}</b><span>practice</span></div></div></div></div>`
      + (s.mastered === s.n ? `<div class="done"><svg width="44" height="44" viewBox="0 0 46 46">${'<circle cx="23" cy="23" r="21" fill="#2f7a40"/><path d="M13 24l7 7 13-15" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'}</svg><div><b>Chapter ${ch.num} mastered.</b><div style="font:14px Merriweather,serif;color:#5e5340">Every concept is complete. Open the gradebook to print or save your report.</div></div></div>` : '')
      + ch.sections.map(sec => { const cc = ch.concepts.filter(c => c.sec === sec.id), done = cc.filter(c => cs.c[c.id] && cs.c[c.id].m).length;
        return `<div class="sec"><div class="sec-h" style="--c:${sec.c}"><span class="num">${sec.id}</span><span class="t">${sec.title}</span><span class="n">${done} of ${cc.length} mastered</span></div><div class="tiles">`
          + cc.map(c => { const i = ch.concepts.indexOf(c), r = cs.c[c.id], st = statusOf(r);
            const stt = st === 'ok' ? `Mastered${r.mt > 1 ? ' on try ' + r.mt : ' on the first try'}` : st === 'wip' ? `In progress · ${r.tries.length} ${r.tries.length === 1 ? 'try' : 'tries'}` : 'Not started';
            return `<a class="tile ${st}" href="#/${ch.id}/${i + 1}" style="--c:${sec.c}">${seal(i + 1, sec.c)}<div><div class="tt">${c.title}</div><div class="ts">${c.short}</div><div class="st"><i></i>${stt}</div></div></a>`; }).join('') + `</div></div>`; }).join('')
      + `</section>`;
  }

  /* ── study view ── */
  function study(ch, idx) {
    const c = ch.concepts[idx], sec = secOf(ch, c), cs = chState(ch.id), r = cState(ch, c);
    cs.last = c.id; cs.act = Date.now(); save();
    header([['Course', '#/'], ['Chapter ' + ch.num + ': ' + ch.title, '#/' + ch.id], ['Concept ' + (idx + 1), null]]);
    const narrow = () => window.matchMedia('(max-width:1280px)').matches;
    app.innerHTML = `<section class="study"><aside class="card rail" aria-label="Concepts">${railHTML(ch, idx)}</aside><div class="qcol" style="--c:${sec.c}" data-q></div><aside class="card rule res" data-res aria-label="Resources">${resHTML(ch, c)}</aside></section>`;
    $$('[data-res-close]').forEach(b => b.onclick = () => $('[data-res]').classList.remove('open'));
    const rail = $('.rail'); const on = $('.ri.on', rail); if (on) rail.scrollTop = on.offsetTop - rail.clientHeight / 2;
    // resources start folded so students try first; they open on request, after a miss, or once the concept is mastered
    const openRes = () => { const b = $('[data-resbody]'), t = $('[data-resteaser]'); if (b) b.hidden = false; if (t) t.hidden = true; };
    $('[data-resopen]').onclick = openRes;
    if (r.m) openRes();
    let practice = !!r.m, mode = 'answer', api = null;
    const draw = () => {
      const vi = r.seq[r.cur % r.seq.length], v = c.variants[vi], st = statusOf(r);
      const q = $('[data-q]');
      q.innerHTML = `<div class="qhead"><div><div class="eb">${sec.id} · Concept ${idx + 1} of ${ch.concepts.length}</div><h1 class="h1">${c.title}</h1></div><div class="pos">${r.m ? '<span class="tag ok">✓ Mastered</span>' : r.tries.length ? `<span class="tag">${r.tries.length} ${r.tries.length === 1 ? 'try' : 'tries'} so far</span>` : ''}</div></div>`
        + `<div class="pips" aria-label="All concepts">${ch.concepts.map((cc, i) => { const rr = cs.c[cc.id], s2 = statusOf(rr); return `<button class="${s2}${i === idx ? ' on' : ''}" data-go="${i}" title="${i + 1}. ${esc(cc.title)}" aria-label="Concept ${i + 1}: ${esc(cc.title)}"></button>`; }).join('')}</div>`
        + `<article class="card rule qcard"><div class="qmeta"><span class="tag v">Version ${(r.cur % r.seq.length) + 1} of ${r.seq.length}</span><span class="tag">${TYPE[v.type]}</span>${practice ? '<span class="tag ok">Practice: your grade is already recorded</span>' : ''}<span style="flex:1"></span><button class="btn ghost sm resbtn" data-openres>Resources</button></div>`
        + `<div class="qstem">${v.stem}</div>${v.hint ? `<div class="qhint"><button class="linkb" data-hint>Need a hint?</button><div class="hint" hidden>${v.hint}</div></div>` : ''}<div data-w></div><div data-fb></div>`
        + `<div class="qfoot"><button class="btn ghost sm" data-prev ${idx === 0 ? 'disabled' : ''}>◂ Previous</button><span class="sp"></span><span class="note" data-note>Press <span class="kbd">Enter</span> to check</span><button class="btn" data-check disabled>Check answer</button></div></article>`;
      const host = $('[data-w]', q);
      api = WG[v.type](v, host, { rng: rngOf(hash(c.id + '|' + r.cur + '|' + r.tries.length)), changed: () => { if (api) $('[data-check]', q).disabled = !api.ready(); } });
      $('[data-check]', q).onclick = check;
      $('[data-prev]', q).onclick = () => go(idx - 1);
      const hb = $('[data-hint]', q); if (hb) hb.onclick = () => { $('.hint', q).hidden = !$('.hint', q).hidden; hb.textContent = $('.hint', q).hidden ? 'Need a hint?' : 'Hide the hint'; };
      $$('[data-go]', q).forEach(b => b.onclick = () => go(+b.dataset.go));
      const ob = $('[data-openres]', q); if (ob) ob.onclick = () => $('[data-res]').classList.add('open');
      mode = 'answer';
      if (api.focus && !narrow()) setTimeout(() => api.focus(), 30);
    };
    const check = () => {
      if (!api || !api.ready()) return;
      tick(ch);
      const vi = r.seq[r.cur % r.seq.length], v = c.variants[vi], res = api.check(); api.reveal && !res.ok && api.reveal(); api.lock();
      r.tries.push([vi, res.ok ? 1 : 0, Date.now(), practice ? 1 : 0]);
      const firstMastery = res.ok && !r.m;
      if (firstMastery) { r.m = Date.now(); r.mt = r.tries.filter(t => !t[3]).length; }
      save();
      const q = $('[data-q]'), nextIdx = ch.concepts.findIndex((cc, i) => i > idx && !(cs.c[cc.id] && cs.c[cc.id].m)), anyLeft = ch.concepts.some(cc => !(cs.c[cc.id] && cs.c[cc.id].m));
      const s = stats(ch);
      $('[data-fb]', q).innerHTML = res.ok
        ? `<div class="fb ok" role="status"><div class="fh"><span class="stamp">✓</span>${firstMastery ? (r.mt === 1 ? 'Mastered on the first try.' : `Mastered on try ${r.mt}.`) : 'Correct.'}</div><div class="fx">${v.explain}</div>${firstMastery ? `<div class="fa">Chapter grade: ${s.pct}% · ${s.mastered} of ${s.n} concepts mastered</div>` : ''}</div>`
        : `<div class="fb no" role="status"><div class="fh"><span class="stamp">✕</span>Not quite${res.msg ? ': ' + esc(res.msg) : '.'}</div><div class="fx">${v.explain}</div><div class="fa">The correct answer is now marked in green. Review the resources, then try a new version of this problem.</div></div>`;
      const foot = $('.qfoot', q);
      foot.innerHTML = `<button class="btn ghost sm" data-prev ${idx === 0 ? 'disabled' : ''}>◂ Previous</button><span class="sp"></span>`
        + (res.ok ? (anyLeft || idx < ch.concepts.length - 1 ? `<button class="btn ghost sm" data-again>Practice another version</button><button class="btn grn" data-next>${nextIdx >= 0 ? 'Next concept ▸' : idx < ch.concepts.length - 1 ? 'Next concept ▸' : 'Back to the chapter'}</button>` : `<button class="btn ghost sm" data-again>Practice another version</button><a class="btn grn" href="#/${ch.id}/grades">See your gradebook ▸</a>`)
          : `<button class="btn ghost sm" data-skip>Skip for now</button><button class="btn gold" data-again>Try a new version ↻</button>`);
      $('[data-prev]', foot).onclick = () => go(idx - 1);
      const nx = $('[data-next]', foot); if (nx) nx.onclick = () => nextIdx >= 0 ? go(nextIdx) : idx < ch.concepts.length - 1 ? go(idx + 1) : (location.hash = '#/' + ch.id);
      const sk = $('[data-skip]', foot); if (sk) sk.onclick = () => go(nextIdx >= 0 ? nextIdx : (idx + 1) % ch.concepts.length);
      $('[data-again]', foot).onclick = () => { r.cur++; practice = !!r.m; save(); draw(); $('[data-q]').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
      if (!res.ok) { openRes(); const rs = $('[data-res]'); rs.style.boxShadow = '0 0 0 3px rgba(176,138,67,.45)'; setTimeout(() => rs.style.boxShadow = '', 1600); if (narrow()) $('[data-openres]', q) && $('[data-openres]', q).classList.add('gold'); }
      $('.rail').innerHTML = railHTML(ch, idx); wireRail(ch);
      header([['Course', '#/'], ['Chapter ' + ch.num + ': ' + ch.title, '#/' + ch.id], ['Concept ' + (idx + 1), null]]);
      $$('.pips button', q).forEach((b, i) => { const s2 = statusOf(cs.c[ch.concepts[i].id]); b.className = s2 + (i === idx ? ' on' : ''); });
      const tag = $('.pos', q); if (tag) tag.innerHTML = r.m ? '<span class="tag ok">✓ Mastered</span>' : `<span class="tag">${r.tries.length} ${r.tries.length === 1 ? 'try' : 'tries'} so far</span>`;
      mode = 'after';
      const btn = $('[data-next]', foot) || $('[data-again]', foot); btn && btn.focus({ preventScroll: true });
    };
    const go = i => { if (i < 0 || i >= ch.concepts.length) return; location.hash = '#/' + ch.id + '/' + (i + 1); };
    wireRail(ch);
    draw();
    const onKey = e => {
      if (e.target.closest('.mdl')) return;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target.type !== 'range';
      if (e.key === 'Enter' && mode === 'answer' && api && api.ready() && !e.target.closest('button')) { e.preventDefault(); check(); return; }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (mode === 'answer' && api && api.key && /^[a-hA-H]$/.test(e.key) && api.key(e.key)) { e.preventDefault(); return; }
      if (e.target.type === 'range' || e.target.closest('[data-plot]')) return;
      if (e.key === 'ArrowRight' && e.shiftKey === false && document.activeElement === document.body) go(idx + 1);
      if (e.key === 'ArrowLeft' && document.activeElement === document.body) go(idx - 1);
    };
    document.addEventListener('keydown', onKey); cleanup.push(() => document.removeEventListener('keydown', onKey));
  }
  const TYPE = { mc: 'Multiple choice', multi: 'Select all that apply', fill: 'Fill in the blank', order: 'Put in order', bins: 'Sort', match: 'Match', slider: 'Interactive slider', pick: 'Read the chart', slice: 'Read the chart', bars: 'Build the chart', figmc: 'Choose the figure', diagram: 'Label the diagram', loop: 'Build the loop' };
  function railHTML(ch, idx) {
    const cs = chState(ch.id), s = stats(ch);
    return `<div class="rh"><b>Chapter ${ch.num}</b><span>${s.mastered}/${s.n}</span></div>` + ch.sections.map(sec => `<div class="rs" style="--c:${sec.c}">${sec.id} ${sec.title}</div>`
      + ch.concepts.map((c, i) => [c, i]).filter(([c]) => c.sec === sec.id).map(([c, i]) => { const st = statusOf(cs.c[c.id]);
        return `<button class="ri ${st}${i === idx ? ' on' : ''}" data-ri="${i}" style="--c:${sec.c}"><span class="d">${i + 1}</span><span>${c.title}</span>${st === 'ok' ? '<span class="x">✓</span>' : ''}</button>`; }).join('')).join('');
  }
  function wireRail(ch) { $$('[data-ri]').forEach(b => b.onclick = () => { location.hash = '#/' + ch.id + '/' + (+b.dataset.ri + 1); }); }
  function resHTML(ch, c) {
    const sec = secOf(ch, c), R = c.review;
    return `<div class="rt"><span class="eb">Resources · Concept ${ch.concepts.indexOf(c) + 1}</span><button class="btn ghost sm resx" data-res-close aria-label="Close resources">Close ✕</button></div><h3>${c.title}</h3>`
      + `<div class="teaser" data-resteaser><p>Try the problem first. If you get stuck, the review notes, figures and lecture slides for this concept are here. Opening them never affects your grade.</p><button class="btn gold sm" data-resopen>Review the material</button>`
      + `<div class="eb" style="margin-top:16px">From the lecture</div><div class="slides">${c.slides.map(s => `<a class="slidelink" style="--c:${sec.c}" href="${ch.deck}#slide-${s[0]}" target="_blank" rel="noopener"><i>Slide ${s[0]}</i>${esc(s[1])} ↗</a>`).join('')}</div></div>`
      + `<div data-resbody hidden>${R.html}`
      + (R.terms ? `<div class="terms">${R.terms.map(t => `<div class="term"><b>${t[0]}</b><span>${t[1]}</span></div>`).join('')}</div>` : '')
      + (R.fig ? `<div class="fig">${CH.mini(R.fig)}${R.figcap ? `<div class="figcap">${R.figcap}</div>` : ''}</div>` : '')
      + `<div class="eb" style="margin-top:16px">From the lecture</div><div class="slides">${c.slides.map(s => `<a class="slidelink" style="--c:${sec.c}" href="${ch.deck}#slide-${s[0]}" target="_blank" rel="noopener"><i>Slide ${s[0]}</i>${esc(s[1])} ↗</a>`).join('')}</div>`
      + `<div class="src">Everything here matches the Chapter ${ch.num} lecture slides and the sources cited on them.</div></div>`;
  }

  /* ── gradebook ── */
  function grades(ch) {
    header([['Course', '#/'], ['Chapter ' + ch.num + ': ' + ch.title, '#/' + ch.id], ['Gradebook', null]]);
    const s = stats(ch), cs = chState(ch.id), st = S.student;
    app.innerHTML = `<section class="gb"><div class="gb-top"><div><div class="eb">Gradebook · Chapter ${ch.num}: ${ch.title}</div><h1 class="h1">${esc(st.name)}</h1><p class="lede" style="margin:6px 0 0">${st.id ? 'ASURITE ' + esc(st.id) + ' · ' : ''}Report generated ${fmtDate(Date.now())}</p></div>`
      + `<div class="gb-act"><button class="btn ghost sm" data-print>Print or save as PDF</button><button class="btn ghost sm" data-code>Save code</button><a class="btn sm" href="#/${ch.id}">Back to the chapter</a></div></div>`
      + `<div class="gb-sum"><div class="card"><span>Chapter grade</span><b>${s.pct}%</b><small>${s.mastered} of ${s.n} concepts mastered</small></div><div class="card"><span>Attempted</span><b>${s.tried} / ${s.n}</b><small>${s.tries} graded ${s.tries === 1 ? 'try' : 'tries'} in all</small></div>`
      + `<div class="card"><span>First-try accuracy</span><b>${s.tried ? s.firstPct + '%' : '–'}</b><small>${s.first} of ${s.tried} attempted concepts</small></div><div class="card"><span>Practice time</span><b>${fmtTime(s.time)}</b><small>active time on problems</small></div></div>`
      + `<div class="card tbl"><table><thead><tr><th style="width:40%">Concept</th><th>Status</th><th>Tries</th><th>Mastered</th><th class="noprint"></th></tr></thead><tbody>`
      + ch.sections.map(sec => `<tr class="sr2" style="--c:${sec.c}"><td colspan="5">${sec.id} · ${sec.title}</td></tr>` + ch.concepts.map((c, i) => [c, i]).filter(([c]) => c.sec === sec.id).map(([c, i]) => {
        const r = cs.c[c.id], stt = statusOf(r), graded = r ? r.tries.filter(t => !t[3]) : [];
        return `<tr><td><span class="n0">${i + 1}</span><span class="cn">${c.title}</span></td><td><span class="st2 ${stt}">${stt === 'ok' ? '✓ Mastered' : stt === 'wip' ? 'In progress' : 'Not started'}</span></td>`
          + `<td>${graded.length ? `<span class="tries">${graded.map(t => `<i class="${t[1] ? 'y' : ''}" title="${t[1] ? 'Correct' : 'Missed'} · ${fmtDate(t[2])}"></i>`).join('')}</span> <span style="font:700 12px Inter;color:#7a6d50;margin-left:4px">${graded.length}</span>` : '<span style="color:#b3a78a">–</span>'}</td>`
          + `<td>${r && r.m ? `<span style="font:600 13px Inter">${fmtDate(r.m)}</span>${r.mt > 1 ? ` <span style="font:700 11.5px Inter;color:#8a6a2f">(try ${r.mt})</span>` : ''}` : '<span style="color:#b3a78a">–</span>'}</td>`
          + `<td class="noprint" style="text-align:right"><a class="linkb" href="#/${ch.id}/${i + 1}">${stt === 'ok' ? 'Review' : stt === 'wip' ? 'Continue' : 'Start'}</a></td></tr>`; }).join('')).join('')
      + `</tbody></table></div><p class="gb-foot">Grading: a concept counts as mastered the first time you answer any version of it fully correctly. Practice after mastery never lowers your grade. Green squares are correct tries, red squares are misses.</p></section>`;
    $('[data-print]').onclick = () => window.print();
    $('[data-code]').onclick = accountMenu;
  }

  /* ── router ── */
  function route() {
    cleanup.forEach(f => f()); cleanup = [];
    window.scrollTo(0, 0);
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (!S.student || !S.student.name) return welcome();
    if (!parts.length) return course();
    const ch = CHS[parts[0]]; if (!ch) { location.hash = '#/'; return; }
    if (!parts[1]) return chapter(ch);
    if (parts[1] === 'grades') return grades(ch);
    const i = parseInt(parts[1], 10) - 1; if (i >= 0 && i < ch.concepts.length) return study(ch, i);
    location.hash = '#/' + ch.id;
  }
  window.addEventListener('hashchange', route);
  route();
})();
