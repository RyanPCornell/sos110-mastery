# SOS 110 Mastery: question-bank format

This is the contract between the **platform** (shared code) and the **chapter banks** (one file per chapter).
A chapter session writes a bank; the platform session owns everything else. `js/bank-ch11.js` is the reference bank.

Run the checker before every commit:

```
node tools/check_bank.js          # all chapters
node tools/check_bank.js ch12     # one chapter
```

It fails on errors (broken answer keys, missing fields, unknown types) and lists warnings (style, coverage).

---

## Who edits what

| File | Owner | Notes |
|---|---|---|
| `js/bank-chNN.js` | that chapter's session | the questions, explanations and resources |
| `js/data-chNN.js` + `tools/build_data_chNN.py` | that chapter's session | only if the chapter has data charts |
| `index.html` | chapter session may add **one line**: its `<script src="js/bank-chNN.js?v=N">` (and data file) | everything else: platform |
| `js/app.js`, `js/widgets.js`, `js/charts.js`, `css/mastery.css`, `tools/check_bank.js`, this doc | **platform session only** | |

Need a new problem type, chart, or slider picture? Ask the platform session; don't add it inside a bank.
(Exception: a `figmc` figure or a `diagram` scene is just an SVG string, so it belongs in the bank.)

**Git:** `git pull --rebase` before you start and again before you push. Commit only your own files.
Bump the `?v=` on any script tag you change so browsers fetch the new file.

---

## The chapter object

```js
(function () {
  const S = { '12.1': '#2f4a66', '12.2': '#4f7194' /* one colour per section */ };
  const concepts = [ /* 20 concepts, below */ ];
  window.MB_CHAPTERS = window.MB_CHAPTERS || {};
  window.MB_CHAPTERS.ch12 = {
    id: 'ch12',                      // must match the file name bank-ch12.js
    num: 12, roman: 'XII',
    title: 'Food', subtitle: 'How Can We Feed a Growing Population Sustainably?',
    deck: 'https://ryanpcornell.github.io/sos110-chapter-12/',   // deployed deck; slide links append #slide-N
    sections: [ { id: '12.1', title: 'How Did Our Modern Agriculture Develop?', c: S['12.1'] }, /* … */ ],
    concepts,
  };
})();
```

## A concept

```js
{ id: 'c01',                         // c01 … c20, unique, never renumbered once students have progress
  sec: '12.1',                       // one of the chapter's section ids
  title: 'The Green Revolution',     // short, title case
  short: 'Higher yields, and what they cost',   // one line under the title on the chapter page
  slides: [[8, 'The Green Revolution'], [9, 'Yields since 1961']],   // deck slide numbers + titles (links open the deck)
  review: {                          // the Resources panel: folded until the student asks, misses, or masters
    html: '<p>…</p><ul><li>…</li></ul>',   // the teaching text; every fact must appear in the deck or its cited sources
    terms: [['Term', 'definition'], …],    // optional
    fig: 'co2',                      // optional: a chart name from charts.js
    figcap: 'Source line for the figure', // optional
  },
  variants: [ /* 3–4 versions of the problem, below */ ],
}
```

**Versions.** A student masters the concept the first time they answer *any* version fully correctly. After a
miss they get the *next* version, so versions must test the same idea in genuinely different ways (different
example, different numbers, or a different problem type), not the same question reworded. Aim for 3–4 versions
and at least two different types per concept.

## Every version has

```js
{ type: 'mc',                        // one of the types below
  stem: 'Which statement describes <b>climate</b> rather than weather?',   // HTML allowed: <b>, <sub>, <sup>
  hint: 'Climate is about the long-term pattern, not a single event.',     // a nudge, never the answer
  explain: 'Only the first statement describes …',   // shown after EVERY answer, right or wrong: teach, don't just mark
  /* type-specific fields */ }
```

## Types

| type | fields | notes |
|---|---|---|
| `mc` | `choices: [..]`, `answer: index` | 3–5 choices; shuffled; plausible distractors drawn from real misconceptions |
| `multi` | `choices: [..]`, `answers: [indexes]` | "select all that apply"; must match exactly |
| `fill` | `text` with `{{0}}`, `{{1}}`…; `blanks: [{num, tol, show?, w?, unit?} or {accept: [..]}]`; `note?` | numeric blanks: `num` + `tol` (accept ±tol), `show` = how to display the answer (e.g. `'27–30'`); text blanks: `accept` list (case/punctuation ignored); `note` = a formula hint shown under the sentence |
| `order` | `items: [..]` **in the correct order** | shuffled for the student; 3–6 items |
| `bins` | `bins: [{name, c}]`, `items: [{t, b: binIndex}]` | drag-and-drop or click; 4–8 items |
| `match` | `pairs: [[left, right]]`, `extra?: [distractor rights]` | dropdown per row; rights must be distinct |
| `slider` | `viz`, `min`, `max`, `step`, `start`, `answer`, `tol`, `unit?`, `label`, `fmt?`, `hide?` | `viz` is a live picture in `WG.VIZ` (currently `co2temp`, `ppm`, `ph`, `usd`); `start` must not already be correct |
| `pick` | `chart`, `chartOpts?`, `cap`, `src?`, `accept(t)`, `correct()` | student clicks a real data chart; `t = {x, y, label}` from the chart's `hit()`; `correct()` returns the point to mark green; the checker verifies `accept(correct())` |
| `slice` | `answer: index`, `hideValues?`, `cap` | click a slice of the donut chart |
| `bars` | `bars: [{label, ans, ref?, c?, sub?}]`, `max`, `step`, `grid`, `unit`, `tol`, `startAt`, `cap`, `legend?` | student drags bars to height; `ref` draws a grey comparison bar beside it |
| `figmc` | `figs: [{svg, label?}]`, `answer: index` | choose the right figure; SVGs live in the bank |
| `diagram` | `scene: '<svg…>'`, `labels: [..]`, `slots: [{x%, y%, ans, hint}]` | drag labels onto the drawing; x/y are percentages of the scene |
| `loop` | `pieces: {id: 'Name'}`, `links: [[from, to, '+' or '-']]`, `goal: {must: [ids], kind: 'R' or 'B'}`, `sol: [ids in loop order]`, `start?: [ids]` | build a causal loop diagram (see below) |

### The `loop` type (build a causal loop diagram)

The student places pieces on a canvas, draws **+** and **−** arrows between them, and says whether the loop is
**reinforcing** (R) or **balancing** (B). It is fully correct when every arrow is a real cause-and-effect link with
the right sign, the arrows close a loop through every piece in `goal.must`, and the R/B choice matches `goal.kind`.
A miss lists what to fix (wrong sign, wrong direction, a piece that is not part of the system, a loop that is not
closed, how to count minus signs) and draws one correct loop.

```js
{ type: 'loop', stem: '… <b>Build the feedback loop</b> that connects <b>Arctic temperature</b> and <b>sea ice</b> …',
  hint: '…', explain: 'Arctic temperature <b>−</b> Sea ice <b>+</b> Reflectivity <b>−</b> Sunlight absorbed <b>+</b> Arctic temperature. …',
  pieces: { temp: 'Arctic temperature', ice: 'Sea ice cover', alb: 'Reflectivity (albedo)', abs: 'Sunlight absorbed',
            ghg: 'Greenhouse gases', oz: 'Ozone hole' },          // 5–7 pieces; include 1–2 that are real but outside the loop, and 1 distractor with no links
  links: [['temp', 'ice', '-'], ['ice', 'alb', '+'], ['alb', 'abs', '-'], ['abs', 'temp', '+'], ['ghg', 'temp', '+']],   // every DIRECT true link
  goal: { must: ['temp', 'ice'], kind: 'R' },                      // the loop must pass through these; R or B
  sol: ['temp', 'ice', 'alb', 'abs'],                              // one correct loop, in order (drawn after a miss)
  start: [] }                                                      // optional: pieces already on the canvas
```

- **Skipped steps are accepted**, as in the Chapter 10 Loop Lab: a link counts as real if `links` lists it or a chain
  of up to three listed links implies it (signs multiplied). So list only *direct* links; Sea ice − Sunlight absorbed
  follows from Sea ice + Reflectivity − Sunlight absorbed. Keep `goal.must` to the pieces the stem names, so a loop that
  skips a middle step still passes.
- List every true direct link among the pieces, including ones outside the loop (Greenhouse gases + Arctic temperature),
  or a correct arrow will be marked wrong.
- **Parallel versions:** give the concept several `loop` versions with different systems (a miss leads to a new one).
  Mix reinforcing and balancing loops.
- The checker runs `sol` through the grader, and confirms that flipping a sign or choosing the wrong R/B is rejected.

Charts available to `pick` and `review.fig` (from `charts.js`): `co2`, `emis`, `temp`, `phx`, `phanda`, `ph`, `donut`.
Ask the platform session for new charts; the chapter supplies the data via `js/data-chNN.js`.

## Content rules (from the course's standing preferences)

- **Every fact comes from the chapter's deck or the sources it cites.** If it isn't on a slide or in a cited source, verify it from a primary source or leave it out. Never cite retracted work (e.g. Kotz et al. 2024).
- **No em dashes between words** (" — "): rewrite with different grammar, not a hyphen. The checker warns.
- **Classy, not cute:** restrained academic tone; no gimmicks, emojis or jokes in problems.
- **Explain every answer** in one or two sentences that teach the idea, naming the number or source where it helps.
- Students use laptops: problems must work with a mouse and keyboard; don't design around phones, but don't break them.
- Aim per chapter: 20 concepts, ~75–80 versions, **10+ visual/interactive versions** (`slider`, `pick`, `slice`, `bars`, `figmc`, `diagram`, `loop`).

## Testing a bank

1. `node tools/check_bank.js chNN`, zero errors.
2. Serve the repo folder (any static server) and open `#/chNN`. Work through every concept; get one wrong on
   purpose to see the explanation, the resources opening and the next version.
3. In the browser console, `localStorage.removeItem('sos110-mastery:v1')` resets your own progress.
