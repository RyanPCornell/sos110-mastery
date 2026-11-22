#!/usr/bin/env node
/* SOS 110 Mastery: question-bank checker.
   Usage:  node tools/check_bank.js            (checks every js/bank-*.js)
           node tools/check_bank.js ch12       (checks one chapter)
   Loads the chapter's data file (if any), charts.js, widgets.js and the bank in a sandbox, then checks the bank
   against docs/BANK-FORMAT.md. Exit code 1 if there are errors; warnings never fail the run.
   It also runs every "pick" problem's correct() through its own accept(), so an answer key that rejects its own
   answer is caught before students see it. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), JS = path.join(ROOT, 'js');
const only = process.argv[2];

const TYPES = ['mc', 'multi', 'fill', 'order', 'bins', 'match', 'slider', 'pick', 'slice', 'bars', 'figmc', 'diagram', 'loop'];
let errors = 0, warnings = 0;

function sandbox() {
  const win = {};
  const ctx = { window: win, console, Math, JSON, Date, document: { createElement: () => ({}) } };
  ctx.window = ctx;
  vm.createContext(ctx);
  return ctx;
}
function load(ctx, file) { vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: path.basename(file) }); }

function checkChapter(chId) {
  const ctx = sandbox();
  const dataFile = path.join(JS, `data-${chId}.js`);
  if (fs.existsSync(dataFile)) load(ctx, dataFile);
  load(ctx, path.join(JS, 'charts.js'));
  load(ctx, path.join(JS, 'widgets.js'));
  vm.runInContext('this.CH = CH; this.WG = WG;', ctx);       // top-level const bindings are not properties of the sandbox
  load(ctx, path.join(JS, `bank-${chId}.js`));
  const ch = ctx.MB_CHAPTERS && ctx.MB_CHAPTERS[chId];
  const where = [];
  const err = (m) => { errors++; console.log(`  ✗ ${where.join(' › ')}: ${m}`); };
  const warn = (m) => { warnings++; console.log(`  ! ${where.join(' › ')}: ${m}`); };
  console.log(`\n${chId}`);
  if (!ch) { where.push(chId); err(`bank-${chId}.js must set window.MB_CHAPTERS.${chId}`); return; }

  where.push(chId);
  for (const k of ['id', 'num', 'roman', 'title', 'subtitle', 'deck', 'sections', 'concepts']) if (ch[k] === undefined) err(`chapter is missing "${k}"`);
  if (ch.id !== chId) err(`chapter id "${ch.id}" must match the file name (${chId})`);
  if (!/^https:\/\//.test(ch.deck || '')) err('deck must be the deployed deck URL (https://…)');
  const secIds = new Set((ch.sections || []).map(s => s.id));
  (ch.sections || []).forEach(s => { if (!s.id || !s.title || !/^#[0-9a-f]{6}$/i.test(s.c || '')) err(`section ${s.id || '?'} needs id, title and a hex colour c`); });
  if ((ch.concepts || []).length !== 20) warn(`${(ch.concepts || []).length} concepts (the course standard is 20)`);

  const ids = new Set(), typesUsed = {};
  (ch.concepts || []).forEach((c, ci) => {
    where.length = 1; where.push(`concept ${ci + 1} (${c.id || '?'})`);
    if (!/^c\d\d$/.test(c.id || '')) err('id must look like c01…c20');
    if (ids.has(c.id)) err('duplicate concept id'); ids.add(c.id);
    if (!secIds.has(c.sec)) err(`sec "${c.sec}" is not one of the chapter's sections`);
    if (!c.title || !c.short) err('needs title and short');
    if (!c.review || !c.review.html) err('needs review.html (the resources panel)');
    if (c.review && c.review.fig && !['co2', 'temp', 'emis', 'phx', 'phanda', 'ph', 'donut'].includes(c.review.fig) && !(ctx.CH && ctx.CH[c.review.fig]))
      err(`review.fig "${c.review.fig}" is not a chart in charts.js`);
    if (!Array.isArray(c.slides) || !c.slides.length) err('needs slides: [[slideNumber, "title"], …]');
    else c.slides.forEach(s => { if (!Number.isInteger(s[0]) || !s[1]) err(`bad slide link ${JSON.stringify(s)}`); });
    const vs = c.variants || [];
    if (vs.length < 2) err(`only ${vs.length} version(s); a miss must lead to a different version (need at least 2, aim for 3–4)`);
    else if (vs.length < 3) warn('only 2 versions (aim for 3–4)');
    if (vs.length && vs.every(v => v.type === vs[0].type) && vs.length > 2 && vs[0].type !== 'loop') warn('every version is the same type; mix in another type');
    vs.forEach((v, vi) => {
      where.length = 2; where.push(`version ${vi + 1} (${v.type})`);
      typesUsed[v.type] = (typesUsed[v.type] || 0) + 1;
      checkVariant(ctx, v, err, warn);
      const text = JSON.stringify(v).replace(/\\u2014/g, '—');
      if (/ — /.test(text)) warn('contains " — " (an em dash between words); rewrite the sentence (course style)');
    });
  });
  where.length = 1;
  console.log(`  ${(ch.concepts || []).length} concepts, ${(ch.concepts || []).reduce((a, c) => a + (c.variants || []).length, 0)} versions; types: ${Object.entries(typesUsed).map(([k, n]) => k + ' ' + n).join(', ')}`);
  const visual = ['slider', 'pick', 'slice', 'bars', 'figmc', 'diagram', 'loop'].reduce((a, k) => a + (typesUsed[k] || 0), 0);
  if (visual < 8) warn(`only ${visual} visual/interactive versions (aim for 10+ per chapter)`);
}

function errorsIn(fn) { try { fn(); return false; } catch (e) { errors++; console.log('  ✗ loop check threw: ' + e.message); return true; } }
function inRange(i, arr) { return Number.isInteger(i) && i >= 0 && i < arr.length; }

function checkVariant(ctx, v, err, warn) {
  if (!TYPES.includes(v.type)) { err(`unknown type "${v.type}" (known: ${TYPES.join(', ')})`); return; }
  if (!v.stem) err('needs stem');
  if (!v.explain) err('needs explain (shown after every answer, right or wrong)');
  if (!v.hint) warn('no hint');
  const t = v.type;
  if (t === 'mc') {
    if (!Array.isArray(v.choices) || v.choices.length < 3) err('needs 3+ choices');
    else if (!inRange(v.answer, v.choices)) err('answer must be the index of the correct choice');
    if (v.choices && new Set(v.choices).size !== v.choices.length) err('duplicate choices');
  } else if (t === 'multi') {
    if (!Array.isArray(v.choices) || v.choices.length < 4) err('needs 4+ choices');
    if (!Array.isArray(v.answers) || !v.answers.length || !v.answers.every(i => inRange(i, v.choices || []))) err('answers must be indexes into choices');
    else if (v.answers.length === v.choices.length) warn('every choice is correct');
  } else if (t === 'fill') {
    const n = ((v.text || '').match(/\{\{\d+\}\}/g) || []).length;
    if (!n) err('text needs at least one {{0}} blank');
    if (!Array.isArray(v.blanks) || v.blanks.length !== n) err(`text has ${n} blanks but blanks[] has ${(v.blanks || []).length}`);
    (v.blanks || []).forEach((b, i) => {
      if (b.num === undefined && !(Array.isArray(b.accept) && b.accept.length)) err(`blank ${i}: needs num (with tol) or accept: [...]`);
      if (b.num !== undefined && typeof b.num !== 'number') err(`blank ${i}: num must be a number`);
      if (b.num !== undefined && b.tol === undefined) warn(`blank ${i}: no tol (exact match only)`);
    });
  } else if (t === 'order') {
    if (!Array.isArray(v.items) || v.items.length < 3) err('needs 3+ items, listed in the CORRECT order');
  } else if (t === 'bins') {
    if (!Array.isArray(v.bins) || v.bins.length < 2) err('needs 2+ bins');
    if (!Array.isArray(v.items) || v.items.length < 4) err('needs 4+ items');
    else v.items.forEach((it, i) => { if (!it.t || !inRange(it.b, v.bins || [])) err(`item ${i}: needs t and a bin index b`); });
    if (v.items && v.bins && v.bins.some((b, k) => !v.items.some(it => it.b === k))) warn('a bin has no items');
  } else if (t === 'match') {
    if (!Array.isArray(v.pairs) || v.pairs.length < 3) err('needs 3+ pairs [left, right]');
    else { if (v.pairs.some(p => !p[0] || !p[1])) err('every pair needs two sides'); if (new Set(v.pairs.map(p => p[1])).size !== v.pairs.length) err('right-hand sides must be distinct'); }
  } else if (t === 'slider') {
    if (!ctx.WG.VIZ[v.viz]) err(`viz "${v.viz}" is not in WG.VIZ (${Object.keys(ctx.WG.VIZ).join(', ')})`);
    for (const k of ['min', 'max', 'step', 'start', 'answer', 'tol']) if (typeof v[k] !== 'number') err(`needs numeric ${k}`);
    if (v.answer < v.min || v.answer > v.max) err('answer is outside min…max');
    if (Math.abs(v.start - v.answer) <= v.tol) err('start is already within tol of the answer');
    if (v.step && Math.abs(Math.round((v.answer - v.min) / v.step) * v.step + v.min - v.answer) > 1e-9 && v.tol < v.step) err('answer is not reachable on the step grid');
  } else if (t === 'pick') {
    if (!ctx.CH || typeof ctx.CH[v.chart] !== 'function') err(`chart "${v.chart}" is not a chart in charts.js`);
    else if (typeof v.accept !== 'function' || typeof v.correct !== 'function') err('needs accept(t) and correct() functions');
    else {
      try {
        const c = ctx.CH[v.chart](v.chartOpts || {});
        if (typeof c.hit !== 'function') err(`chart "${v.chart}" has no hit() so it cannot be clicked`);
        const ans = v.correct();
        if (!ans || ans.label === undefined) err('correct() must return {x, y, label}');
        else if (!v.accept(ans)) err(`accept() rejects correct() (${ans.label})`);
        // the hit test must also find the correct point when it is clicked
        else if (c.hit && c.mark) { const m = c.mark(ans); const h = c.hit(m.x, m.y); if (!v.accept(h)) err(`clicking the correct point (${ans.label}) is not accepted; hit() returned ${h && h.label}`); }
      } catch (e) { err('pick check threw: ' + e.message); }
    }
  } else if (t === 'slice') {
    try { const c = ctx.CH.donut({}); if (!inRange(v.answer, c.segs)) err('answer must be a slice index'); } catch (e) { err('slice check threw: ' + e.message); }
  } else if (t === 'bars') {
    for (const k of ['max', 'step', 'grid', 'tol', 'startAt']) if (typeof v[k] !== 'number') err(`needs numeric ${k}`);
    if (!Array.isArray(v.bars) || v.bars.length < 2) err('needs 2+ bars');
    else v.bars.forEach((b, i) => { if (!b.label || typeof b.ans !== 'number' || b.ans < 0 || b.ans > v.max) err(`bar ${i}: needs label and ans within 0…max`); });
    if (v.bars && v.bars.every(b => Math.abs(b.ans - v.startAt) <= v.tol)) err('every bar already starts within tol of its answer');
  } else if (t === 'figmc') {
    if (!Array.isArray(v.figs) || v.figs.length < 2 || v.figs.some(f => !f.svg)) err('needs 2+ figs, each with svg');
    else if (!inRange(v.answer, v.figs)) err('answer must be a fig index');
  } else if (t === 'loop') {
    const P = v.pieces || {}, ids = Object.keys(P);
    if (ids.length < 3 || ids.some(k => typeof P[k] !== 'string' || !P[k])) err('pieces must be {id: "Name"} with 3+ entries');
    if (!Array.isArray(v.links) || v.links.length < 2) err('needs links: [[from, to, "+" or "-"], …] (2+)');
    else v.links.forEach((l, i) => { if (!P[l[0]] || !P[l[1]] || l[0] === l[1] || !['+', '-'].includes(l[2])) err(`link ${i} ${JSON.stringify(l)}: needs two different piece ids and "+" or "-"`); });
    const g = v.goal || {};
    if (!['R', 'B'].includes(g.kind)) err('goal.kind must be "R" or "B"');
    if (!Array.isArray(g.must) || !g.must.length || g.must.some(m => !P[m])) err('goal.must must list 1+ piece ids the loop has to pass through');
    (v.start || []).forEach(id => { if (!P[id]) err(`start: "${id}" is not a piece`); });
    if (!Array.isArray(v.sol) || v.sol.length < 2 || v.sol.some(id => !P[id])) err('sol must list the correct loop’s piece ids in order (2+)');
    else if (!errorsIn(() => {
      const T = ctx.WG.loopTruth(v), L = v.sol.map((a, i) => { const b = v.sol[(i + 1) % v.sol.length]; return { a, b, s: T[a + '>' + b] }; });
      L.forEach(l => { if (!l.s) err(`sol step ${P[l.a]} → ${P[l.b]} is not a link (or its sign is ambiguous)`); });
      if (L.some(l => !l.s)) return;
      const neg = L.filter(l => l.s < 0).length;
      if ((neg % 2 ? 'B' : 'R') !== g.kind) err(`sol has ${neg} minus sign(s), which makes it ${neg % 2 ? 'balancing' : 'reinforcing'}, but goal.kind is ${g.kind}`);
      if ((g.must || []).some(m => !v.sol.includes(m))) err('sol must include every goal.must piece');
      const r = ctx.WG.loopGrade(v, L, g.kind);
      if (!r.ok) err('the grader rejects sol: ' + r.fb.join(' / '));
      const flipped = L.map((l, i) => i ? l : Object.assign({}, l, { s: -l.s }));
      if (ctx.WG.loopGrade(v, flipped, g.kind).ok) err('the grader accepts sol with a flipped sign');
      if (ctx.WG.loopGrade(v, L, g.kind === 'R' ? 'B' : 'R').ok) err('the grader accepts the wrong loop kind');
    })) {}
    const linked = new Set((v.links || []).flatMap(l => [l[0], l[1]]));
    if (!ids.some(id => !linked.has(id))) warn('no distractor piece (one with no links) to test what belongs in the system');
  } else if (t === 'diagram') {
    if (!v.scene || !/^<svg/.test(v.scene.trim())) err('scene must be an inline <svg>');
    if (!Array.isArray(v.labels) || !Array.isArray(v.slots) || v.labels.length < 2) err('needs labels[] and slots[]');
    else {
      if (v.slots.length !== v.labels.length) warn('slots and labels differ in number (extra labels act as distractors)');
      const used = new Set();
      v.slots.forEach((s, i) => { if (!inRange(s.ans, v.labels)) err(`slot ${i}: ans must be a label index`); if (used.has(s.ans)) err(`slot ${i}: label ${s.ans} is used twice`); used.add(s.ans);
        if (!(s.x >= 0 && s.x <= 100 && s.y >= 0 && s.y <= 100)) err(`slot ${i}: x and y are percentages 0…100`); });
    }
  }
}

const banks = fs.readdirSync(JS).filter(f => /^bank-[a-z0-9]+\.js$/.test(f)).map(f => f.slice(5, -3)).filter(id => !only || id === only);
if (!banks.length) { console.log(only ? `No js/bank-${only}.js` : 'No banks found'); process.exit(1); }
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
banks.forEach(id => {
  try { checkChapter(id); } catch (e) { errors++; console.log(`  ✗ ${id}: could not load (${e.message})`); }
  if (!html.includes(`js/bank-${id}.js`)) { errors++; console.log(`  ✗ ${id}: index.html has no <script src="js/bank-${id}.js…">`); }
});
console.log(`\n${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
