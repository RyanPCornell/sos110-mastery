/* SOS 110 Mastery, Chapter 11: Climate. Twenty concepts, each with several versions of its problem, so a
   student who misses one gets a fresh version (not the same question again). Every fact matches the
   Chapter 11 lecture deck and the sources it cites; slide numbers point at that deck. */
(function () {
  const D = window.CH11_DATA, DECK = 'https://ryanpcornell.github.io/sos110-chapter-11/';
  const byX = (arr, x) => arr.find(q => q[0] === x);

  /* ── drawings used by the problems ── */
  const GH_SCENE = `<svg viewBox="0 0 760 340" role="img" aria-label="Diagram of the greenhouse effect with four numbered arrows">
    <defs><linearGradient id="ghSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3c50"/><stop offset=".32" stop-color="#3d5168"/><stop offset=".34" stop-color="#cfdde6"/><stop offset="1" stop-color="#eef1ea"/></linearGradient>
    <marker id="ghA" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker>
    <filter id="ghN" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="2"/></filter></defs>
    <rect width="760" height="340" fill="url(#ghSky)" rx="8"/>
    ${Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 97) % 740 + 12}" cy="${(i * 53) % 90 + 8}" r="${i % 3 ? .9 : 1.4}" fill="#fff" opacity=".7"/>`).join('')}
    <circle cx="52" cy="46" r="26" fill="#f0d27a" stroke="#e0a64a" stroke-width="3"/>
    <path d="M0 112H760" stroke="#fffaf0" stroke-width="1.4" stroke-dasharray="6 6" opacity=".85"/><text x="128" y="104" style="font:700 11px Inter;fill:#fffaf0;letter-spacing:.12em">TOP OF THE ATMOSPHERE</text>
    ${[[220, 150], [380, 160], [560, 140], [150, 220], [620, 215], [430, 240], [260, 260], [700, 255]].map(([x, y]) => `<g transform="translate(${x} ${y})" opacity=".55"><circle r="4.5" fill="#3b3222"/><circle cx="-10" r="3.6" fill="#a8483f"/><circle cx="10" r="3.6" fill="#a8483f"/></g>`).join('')}
    <text x="326" y="132" style="font:italic 700 11.5px Merriweather;fill:#3b3222">greenhouse gases (small molecules)</text>
    <path d="M0 292 Q190 282 380 292 T760 290 V340 H0Z" fill="#9ab07e"/><path d="M0 292 Q190 282 380 292 T760 290" fill="none" stroke="#3b3222" stroke-width="1.6"/>
    <text x="14" y="326" style="font:italic 700 12px Merriweather;fill:#2c3020">Earth's surface</text>
    <g filter="url(#ghN)" fill="none" stroke-linecap="round">
      <path d="M72 70 L168 286" stroke="#e0a64a" stroke-width="7" marker-end="url(#ghA)"/>
      <path d="M300 286 q-10 -14 0 -28 t0 -28 t0 -28 t0 -28 t0 -22" stroke="#a8483f" stroke-width="5" marker-end="url(#ghA)"/>
      <path d="M470 140 q10 14 0 28 t0 28 t0 28 t0 28 t0 28 t0 20" stroke="#a8483f" stroke-width="5" marker-end="url(#ghA)"/>
      <path d="M640 170 q-12 -12 -2 -26 t2 -26 t2 -26 t2 -26 t4 -24" stroke="#a8483f" stroke-width="5" marker-end="url(#ghA)"/>
    </g>
    ${[[92, 98, 1], [318, 280, 2], [488, 150, 3], [656, 178, 4]].map(([x, y, n]) => `<g transform="translate(${x} ${y})"><circle r="11" fill="#fffaf0" stroke="#3b3222" stroke-width="1.6"/><text y="4" text-anchor="middle" style="font:900 12px Inter;fill:#3b3222">${n}</text></g>`).join('')}
  </svg>`;

  // the atmospheric fingerprint: two layers, each warming (▲ red) or cooling (▼ blue)
  function prof(up, low) {
    const lay = (y, h, name, sub, warm) => `<rect x="10" y="${y}" width="200" height="${h}" rx="6" fill="${warm ? '#f4e1dc' : '#e1ebf3'}" stroke="#d9c9a3"/>`
      + `<text x="22" y="${y + 22}" style="font:italic 800 12.5px Merriweather;fill:#3b3222">${name}</text><text x="22" y="${y + 38}" style="font:600 10.5px Inter;fill:#7a6d50">${sub}</text>`
      + `<g transform="translate(172 ${y + h / 2})"><path d="${warm ? 'M0 -14L12 6H-12Z' : 'M0 14L12 -6H-12Z'}" fill="${warm ? '#a8483f' : '#4f7488'}"/></g>`
      + `<text x="150" y="${y + h / 2 + 4}" text-anchor="end" style="font:800 11px Inter;fill:${warm ? '#a8483f' : '#4f7488'}">${warm ? 'warmer' : 'cooler'}</text>`;
    return `<svg viewBox="0 0 220 150" role="img" aria-label="Upper atmosphere ${up ? 'warming' : 'cooling'}, lower atmosphere ${low ? 'warming' : 'cooling'}">${lay(8, 62, 'Stratosphere', '12–50 km up', up)}${lay(78, 62, 'Troposphere', 'where we live', low)}</svg>`;
  }
  const PROFILES = [{ svg: prof(true, true) }, { svg: prof(false, true) }, { svg: prof(false, false) }, { svg: prof(true, false) }];

  /* ── chart "correct answer" helpers for the pick problems ── */
  const phandaAt = age => { const q = D.phanda.reduce((a, r) => Math.abs(r[0] - age) < Math.abs(a[0] - age) ? r : a); return { x: -q[0], y: q[2], age: q[0], label: Math.round(q[0]) + ' million years ago: about ' + Math.round(q[2]) + ' °C' }; };
  const co2At = yr => { const q = D.co2.reduce((a, r) => Math.abs(r[0] - yr) < Math.abs(a[0] - yr) ? r : a); return { x: q[0], y: q[1], label: Math.round(-q[0] / 1000) + ',000 years ago: ' + Math.round(q[1]) + ' ppm' }; };
  const yearT = (arr, yr, fmt) => { const q = byX(arr, yr); return { x: q[0], y: q[1], label: fmt(q) }; };

  const S = { '11.1': '#2f4a66', '11.2': '#4f7194', '11.4': '#5f7b94', '11.5': '#b0765c', '11.6': '#9a5a47', '11.7': '#86433d' };

  const concepts = [
  /* ═════════ 11.1 ═════════ */
  { id: 'c01', sec: '11.1', title: 'Weather vs. Climate', short: 'Short-term conditions, or the long-term pattern?', slides: [[7, 'Review: Climate vs. Weather'], [8, 'Weather vs. Climate Lab']],
    review: { html: `<p><b>Weather</b> is the short-term state of the atmosphere: temperature, moisture and wind over hours to days.</p><p><b>Climate</b> is the long-term pattern of a region's weather: its averages, its variability and its extremes, usually measured over a standard <b>30-year period</b>.</p><p>One cold week, or even one hot summer, is weather. Decades that are warmer on average are a change in climate.</p>`,
      terms: [['Weather', 'Conditions right now and over the next few days.'], ['Climate', 'The long-term pattern: the 30-year average, its swings and its extremes.']] },
    variants: [
      { type: 'bins', stem: 'Sort each statement: is it about <b>weather</b> or <b>climate</b>?', hint: 'Ask: is this about a particular day or week, or about what is typical over many years?',
        bins: [{ name: 'Weather', c: '#4f7194' }, { name: 'Climate', c: '#86433d' }],
        items: [{ t: 'Tomorrow’s high in Tempe will be 104 °F.', b: 0 }, { t: 'A dust storm is moving through Mesa this afternoon.', b: 0 }, { t: 'It snowed in Flagstaff last night.', b: 0 },
          { t: 'July is, on average, Phoenix’s hottest month.', b: 1 }, { t: 'Arizona’s monsoon season usually runs from mid-June through September.', b: 1 }, { t: 'Flagstaff gets snow most winters.', b: 1 }],
        explain: 'Statements about a particular day, afternoon or night are <b>weather</b>. Statements about what is typical across many years (averages, seasons, long-term trends) are <b>climate</b>.' },
      { type: 'mc', stem: 'Which statement describes <b>climate</b> rather than weather?', hint: 'Climate is about the long-term pattern, not a single event.',
        choices: ['Phoenix usually gets most of its summer rain during the monsoon.', 'A thunderstorm will hit Chandler around 5 p.m.', 'Yesterday was the windiest day of the month.', 'It will be cloudy and 68 °F on Thursday.'], answer: 0,
        explain: 'Only the first statement describes a pattern that holds across many years. The others describe particular days or hours, which is weather.' },
      { type: 'fill', stem: 'Complete the definition.', text: 'Climate is the long-term pattern of a region’s weather, usually measured as an average over a standard {{0}}-year period.', blanks: [{ num: 30, tol: 0, w: 5 }],
        hint: 'The lecture called it a “standard” period. Think in decades.', explain: 'Climate is usually measured over a <b>30-year</b> period, long enough that single unusual years average out.' },
      { type: 'mc', stem: 'January brings a record-cold week. What does that week, by itself, tell us about whether the climate is warming?', hint: 'Is one week weather or climate?',
        choices: ['Very little: one week is weather, and climate is the pattern over decades.', 'It proves the climate is cooling.', 'It proves the climate is warming, because extremes are increasing.', 'It means the 30-year average must now be colder.'], answer: 0,
        explain: 'A single week is <b>weather</b>. Climate change shows up in long-term averages and trends, so one cold week can neither prove nor disprove it.' },
    ] },

  { id: 'c02', sec: '11.1', title: 'Proxies for Past Climate', short: 'How tree rings, corals and ice record the past', slides: [[9, 'Indirect Indicators of Ancient Climate']],
    review: { html: `<p>A <b>proxy</b> is an observable phenomenon that serves as an indirect indicator of past climate. Proxies extend the record long before thermometers.</p><ul><li><b>Tree rings</b>: ring width records local growing conditions. A wide ring means a good year for that tree, whether warmth or water was the limit. Records span hundreds to thousands of years.</li><li><b>Coral skeletons</b>: growth rings and chemical signatures record past sea-surface temperature and ocean acidity over centuries.</li><li><b>Ice cores</b>: air bubbles preserve samples of the ancient atmosphere, and the ratio of oxygen isotopes (¹⁸O/¹⁶O) reveals past temperature.</li></ul>`,
      terms: [['Proxy', 'An indirect indicator of past climate.'], ['Paleoclimate', 'The climate of the distant past, reconstructed from proxies.']] },
    variants: [
      { type: 'match', stem: 'Match each proxy to what it records.', hint: 'Bubbles are trapped air; rings grow once a year.',
        pairs: [['Tree rings', 'Local growing conditions, year by year'], ['Coral skeletons', 'Past sea-surface temperature and ocean acidity'], ['Air bubbles in ice cores', 'Samples of the ancient atmosphere, such as its CO₂'], ['¹⁸O/¹⁶O ratio in ice cores', 'Past temperature']],
        explain: 'Each proxy is an indirect record: tree rings track growing conditions, corals track the ocean, ice-core bubbles are the old atmosphere itself, and oxygen isotopes track temperature.' },
      { type: 'mc', stem: 'A tree ring from a particular year is unusually <b>wide</b>. What does that most likely tell us?', hint: 'Ring width reflects how well the tree grew that year.',
        choices: ['It was a good growing year for that tree, whether warmth or water was the limit.', 'The tree was very old that year.', 'There was a volcanic eruption that year.', 'It was an unusually cold year everywhere on Earth.'], answer: 0,
        explain: 'A wide ring means the tree grew well that year. Depending on the site, the limiting factor could be warmth or water, which is why scientists combine many trees.' },
      { type: 'mc', stem: 'What is a climate <b>proxy</b>?', choices: ['An observable phenomenon that serves as an indirect indicator of past climate.', 'A direct thermometer reading from a weather station.', 'A computer model that predicts future warming.', 'A greenhouse gas that traps heat.'], answer: 0,
        hint: 'Proxy means “standing in for” something you cannot measure directly.', explain: 'Proxies stand in for direct measurements. Tree rings, coral skeletons and ice cores let us reconstruct climate long before instruments existed.' },
      { type: 'multi', stem: 'Which of these are climate <b>proxies</b>? Select all that apply.', hint: 'A proxy is indirect. A thermometer is direct.',
        choices: ['Tree rings', 'Ice cores', 'Coral skeletons', 'Today’s satellite temperature readings', 'A weather station’s daily thermometer record'], answers: [0, 1, 2],
        explain: 'Tree rings, ice cores and coral skeletons are indirect records. Satellite and thermometer readings are direct measurements, not proxies.' },
    ] },

  /* ═════════ 11.2 ═════════ */
  { id: 'c03', sec: '11.2', title: 'Natural Drivers of Past Change', short: 'Drift, orbits, life and eruptions', slides: [[10, 'What Caused Climate Change in the Past?']],
    review: { html: `<p>Earth's climate has always changed. Four natural drivers explain the past swings:</p><ul><li><b>Continental drift</b>: continent positions alter solar radiation and ocean circulation; mountain building draws CO₂ from the air through acidic rainfall.</li><li><b>Milankovitch cycles</b>: changes in orbital shape (about 100,000 years) and in axial tilt and direction (26,000 to 40,000 years) alter sunlight and pace the ice ages.</li><li><b>Biosphere changes</b>: the evolution of photosynthesizers, swamps and forests has altered atmospheric CO₂ and O₂.</li><li><b>Eruptions and asteroids</b>: Krakatoa (1883) cooled Earth by a few tenths of a degree for several years; Siberian volcanism drove the Permian–Triassic extinction 252 million years ago.</li></ul>` },
    variants: [
      { type: 'match', stem: 'Match each natural driver to an example of how it changes climate.', hint: 'Orbits work over tens of thousands of years; eruptions act within years.',
        pairs: [['Continental drift', 'Mountain building draws CO₂ out of the air through acidic rainfall'], ['Milankovitch cycles', 'Changes in Earth’s orbit and tilt pace the ice ages'], ['Biosphere changes', 'The spread of forests and photosynthesizers changes CO₂ and O₂'], ['Volcanic eruptions', 'Krakatoa (1883) cooled Earth for several years']],
        explain: 'Each driver works through sunlight or greenhouse gases: drift and life change CO₂ over millions of years, orbital cycles change sunlight over tens of thousands, and eruptions block sunlight for a few years.' },
      { type: 'mc', stem: 'Milankovitch cycles (changes in Earth’s orbit, tilt and wobble) pace the ice ages. Over what timescale do they act?', hint: 'The cycles are about 26,000, 40,000 and 100,000 years long.',
        choices: ['Tens of thousands of years', 'A few years', 'A few decades', 'Billions of years'], answer: 0, explain: 'Orbital shape changes over about <b>100,000 years</b> and tilt and direction over <b>26,000 to 40,000 years</b>, so these cycles act over tens of thousands of years.' },
      { type: 'mc', stem: 'Krakatoa erupted in 1883. What did it do to Earth’s climate?', hint: 'Eruptions put sun-blocking particles high in the air.',
        choices: ['Cooled Earth by a few tenths of a degree for several years.', 'Warmed Earth by several degrees for a century.', 'Started an ice age.', 'Had no measurable effect.'], answer: 0,
        explain: 'Large eruptions inject particles that reflect sunlight, cooling Earth briefly. Krakatoa cooled it by <b>a few tenths of a degree for several years</b>.' },
      { type: 'multi', stem: 'Which of these are <b>natural</b> drivers of climate change? Select all that apply.', hint: 'Natural drivers worked long before people existed.',
        choices: ['Continental drift', 'Milankovitch (orbital) cycles', 'Volcanic eruptions', 'The evolution of forests and photosynthesizers', 'Burning coal for electricity', 'Clearing forests for farmland'], answers: [0, 1, 2, 3],
        explain: 'Drift, orbital cycles, eruptions and changes in life are natural. Burning coal and clearing forests are <b>human</b> drivers, the subject of section 11.4.' },
    ] },

  { id: 'c04', sec: '11.2', title: '485 Million Years of Climate', short: 'Hothouses, ice ages, and why today is different', slides: [[10, 'Global average surface temperature, 485 million years']],
    review: { html: `<p>Reconstructions of global temperature (Judd et al., 2024) show Earth swinging from a <b>hothouse peak of about 36 °C</b> in the Cretaceous (about 92 million years ago) to <b>ice-age lows of about 11–12 °C</b> in the Late Paleozoic and the recent ice ages.</p><p>Estimates of Earth's pre-industrial average range from about 14 to 15 °C, and 2024 was about 15.5 °C. Change itself is not new; what is new is the <b>speed</b>: about 0.2 °C per decade in recent decades, driven by human emissions, while natural swings usually took thousands to millions of years.</p>`, fig: 'phanda', figcap: 'Judd et al. (2024), Science 385 (PhanDA reconstruction): line = median, band = 68% range.' },
    variants: [
      { type: 'pick', chart: 'phanda', cap: 'Global average surface temperature, 485 million years ago to today', stem: 'Click the <b>hottest</b> point in the last 485 million years.', hint: 'Look for the highest peak of the line.',
        accept: t => t.age > 80 && t.age < 100, correct: () => phandaAt(91.6), explain: 'The hothouse peak came in the <b>Cretaceous, about 92 million years ago</b>, at roughly 36 °C, more than 20 °C warmer than today.', src: 'Judd et al. (2024), Science.' },
      { type: 'pick', chart: 'phanda', cap: 'Global average surface temperature, 485 million years ago to today', stem: 'Click a point during one of Earth’s <b>ice ages</b>, one of the coldest stretches of the record.', hint: 'There are two cold stretches: one long ago, and one at the very right edge (the recent ice ages).',
        accept: t => t.y <= 14.6, correct: () => phandaAt(326.9), explain: 'The coldest stretches are the <b>Late Paleozoic ice age</b> (roughly 260 to 340 million years ago) and the <b>recent ice ages</b> of the last few million years, about 11–12 °C at their lows.' },
      { type: 'mc', stem: 'Earth’s climate has always changed. What makes today’s change unusual?', hint: 'Compare how fast the change is happening.',
        choices: ['Its speed: about 0.2 °C per decade, driven by human emissions, when natural swings took thousands to millions of years.', 'Earth has never been this warm before.', 'Earth has never had an ice age before.', 'Today’s change is driven by the Milankovitch cycles.'], answer: 0,
        explain: 'Earth has been much warmer before (about 36 °C in the Cretaceous). The difference today is the <b>rate</b>, about 0.2 °C per decade, and the cause: human emissions.' },
    ] },

  { id: 'c05', sec: '11.2', title: 'How the Greenhouse Effect Works', short: 'Sunlight in, infrared out, some sent back', slides: [[12, 'The Greenhouse Effect'], [13, 'Watch Earth Trap Heat']],
    review: { html: `<ol style="padding-left:18px"><li>Sunlight passes through the air and warms the surface.</li><li>The warm surface gives off <b>infrared heat</b>.</li><li><b>Greenhouse gases</b> absorb some of that infrared and send some back down.</li><li>The rest escapes to space.</li></ol><p>Without any greenhouse gases, Earth's average surface would be about <b>−18 °C</b>, roughly 33 °C colder than its pre-industrial average of about 15 °C.</p>` },
    variants: [
      { type: 'order', stem: 'Put the steps of the greenhouse effect in order.', hint: 'Start with energy arriving from the Sun; end with energy leaving to space.',
        items: ['Sunlight passes through the air and warms the surface.', 'The warm surface gives off infrared heat.', 'Greenhouse gases absorb some of that heat and send some back down.', 'The rest of the heat escapes to space.'],
        explain: 'Energy arrives as sunlight, leaves the surface as <b>infrared</b>, is partly sent back down by greenhouse gases, and the remainder escapes to space.' },
      { type: 'diagram', stem: 'Label the diagram: drag each label onto the arrow it describes.', hint: 'The yellow arrow comes from the Sun; red arrows are infrared heat.',
        scene: GH_SCENE, labels: ['Sunlight passes through the air', 'The warm surface gives off infrared heat', 'Greenhouse gases send some heat back down', 'The rest escapes to space'],
        slots: [{ x: 15, y: 54, ans: 0, hint: 'Arrow 1' }, { x: 39.5, y: 68, ans: 1, hint: 'Arrow 2' }, { x: 64.5, y: 59, ans: 2, hint: 'Arrow 3' }, { x: 86.5, y: 21, ans: 3, hint: 'Arrow 4' }],
        explain: 'Arrow 1 is incoming sunlight. Arrow 2 is infrared heat from the warm surface. Arrow 3 is heat that greenhouse gases send back down. Arrow 4 is the heat that escapes to space.' },
      { type: 'fill', stem: 'Complete the sentence.', text: 'Without any greenhouse gases, Earth’s average surface temperature would be about {{0}} °C.', blanks: [{ num: -18, tol: 2, show: '−18', w: 6 }],
        hint: 'It would be about 33 °C colder than the pre-industrial average of about 15 °C.', explain: 'About <b>−18 °C</b>: roughly 33 °C colder than the pre-industrial average of about 15 °C. The natural greenhouse effect is what makes Earth livable.' },
      { type: 'mc', stem: 'What do greenhouse gases mainly absorb?', hint: 'Most sunlight passes straight through the air (step 1).',
        choices: ['Infrared heat given off by Earth’s warm surface', 'Most of the incoming visible sunlight', 'Sound waves', 'Ultraviolet light only'], answer: 0,
        explain: 'Sunlight mostly passes through the air. Greenhouse gases absorb the <b>infrared heat</b> the warm surface gives off, and send some of it back down.' },
    ] },

  { id: 'c06', sec: '11.2', title: 'CO₂ and Temperature', short: 'Each doubling of CO₂ adds about 3 °C', slides: [[13, 'Watch Earth Trap Heat']],
    review: { html: `<p>The lecture's greenhouse model uses the standard climate-sensitivity relationship:</p><p style="text-align:center;font:900 17px Merriweather">ΔT ≈ 3 °C × log₂(CO₂ ÷ 280 ppm)</p><p>So each <b>doubling</b> of CO₂ adds about <b>3 °C</b> (the IPCC's likely range is 2.5–4 °C). Reference points: <b>180 ppm</b> in the ice ages, <b>280 ppm</b> before the 1800s, about <b>420 ppm</b> today, and <b>560 ppm</b> at double the pre-industrial level.</p><p class="small">This is an illustrative equilibrium model, not a measurement of today's temperature.</p>` },
    variants: [
      { type: 'slider', viz: 'co2temp', label: 'Carbon dioxide (ppm)', stem: 'Drag the slider to the CO₂ level that would <b>double</b> the pre-industrial amount (280 ppm).', min: 150, max: 1150, step: 5, start: 300, answer: 560, tol: 10, unit: 'ppm', hide: [560, 1120],
        hint: 'Double means two times.', explain: 'Doubling 280 ppm gives <b>560 ppm</b>. In the model, that adds 3 °C × log₂(2) = <b>3 °C</b> of warming.' },
      { type: 'slider', viz: 'co2temp', label: 'Carbon dioxide (ppm)', stem: 'Drag the slider to the CO₂ level of the <b>last ice age</b>.', min: 150, max: 1150, step: 5, start: 400, answer: 180, tol: 10, unit: 'ppm', hide: [180],
        hint: 'It is marked on the scale, and it is lower than the pre-1800s level.', explain: 'Ice-age air held about <b>180 ppm</b> of CO₂, and the model puts that world about 2 °C cooler than pre-industrial.' },
      { type: 'fill', stem: 'Use the model ΔT ≈ 3 °C × log₂(CO₂ ÷ 280).', text: 'Raising CO₂ from 280 to 560 ppm warms Earth by about {{0}} °C in this model.', blanks: [{ num: 3, tol: .3, w: 5 }],
        hint: '560 ÷ 280 = 2, and log₂(2) = 1.', explain: '560 ÷ 280 = 2, and log₂(2) = 1, so ΔT ≈ 3 × 1 = <b>3 °C</b>. The IPCC’s likely range for a doubling is 2.5–4 °C.' },
      { type: 'mc', stem: 'Going from 280 to 560 ppm warms Earth by about 3 °C in the model. About how much <b>more</b> warming would going from 560 to 1,120 ppm add?', hint: 'Notice that 1,120 is double 560.',
        choices: ['About another 3 °C, because each doubling adds about the same amount', 'About 6 °C more, because the CO₂ increase is twice as big', 'Almost none, because the air is already full of CO₂', 'About 12 °C more'], answer: 0,
        explain: 'Warming grows with the <b>logarithm</b> of CO₂, so every doubling adds about the same amount: about another <b>3 °C</b>.' },
    ] },

  { id: 'c07', sec: '11.2', title: 'Which Gases Trap Heat?', short: 'Greenhouse gases and the infrared spectrum', slides: [[14, 'Greenhouse Gases & the Electromagnetic Spectrum'], [18, 'Chain of Evidence, step 1']],
    review: { html: `<p>Carbon dioxide (CO₂), water vapor (H₂O), methane (CH₄), nitrous oxide (N₂O) and halocarbons each <b>absorb infrared</b> at particular wavelengths. That is something we can test in a lab: John Tyndall first measured the infrared absorption of CO₂ and water vapor in <b>1859</b>.</p><p>Nitrogen (N₂) and oxygen (O₂) make up about 99% of dry air but barely absorb infrared, so they are not greenhouse gases.</p>` },
    variants: [
      { type: 'multi', stem: 'Which of these are <b>greenhouse gases</b>? Select all that apply.', hint: 'Two of the gases make up almost all of the air but do not trap heat.',
        choices: ['Carbon dioxide (CO₂)', 'Methane (CH₄)', 'Water vapor (H₂O)', 'Nitrous oxide (N₂O)', 'Nitrogen (N₂)', 'Oxygen (O₂)', 'Argon (Ar)'], answers: [0, 1, 2, 3],
        explain: 'CO₂, CH₄, water vapor and N₂O absorb infrared. Nitrogen, oxygen and argon, nearly all of the air, barely absorb it.' },
      { type: 'mc', stem: 'Nitrogen and oxygen make up about 99% of dry air. Why aren’t they greenhouse gases?', hint: 'What makes a gas a greenhouse gas?',
        choices: ['They barely absorb infrared heat.', 'There is too little of them.', 'They only exist high in the atmosphere.', 'They absorb all of the incoming sunlight instead.'], answer: 0,
        explain: 'What matters is whether a gas <b>absorbs infrared</b>. Nitrogen and oxygen barely do, so even at 99% of the air they trap almost no heat.' },
      { type: 'bins', stem: 'Sort the gases: does each one <b>absorb infrared heat</b>?', hint: 'Greenhouse gases are the heat absorbers.',
        bins: [{ name: 'Absorbs infrared (greenhouse gas)', c: '#a8483f' }, { name: 'Barely absorbs infrared', c: '#4f7194' }],
        items: [{ t: 'Carbon dioxide (CO₂)', b: 0 }, { t: 'Methane (CH₄)', b: 0 }, { t: 'Water vapor (H₂O)', b: 0 }, { t: 'Halocarbons (CFCs, HFCs)', b: 0 }, { t: 'Nitrogen (N₂)', b: 1 }, { t: 'Oxygen (O₂)', b: 1 }],
        explain: 'CO₂, methane, water vapor and halocarbons absorb infrared. Nitrogen and oxygen barely do.' },
      { type: 'mc', stem: 'The first link in the chain of evidence is that CO₂ absorbs infrared. How do we know?', hint: 'The lecture called it something “we can test.”',
        choices: ['It can be measured in a laboratory, as John Tyndall first did in 1859.', 'It was first predicted by climate models in the 1990s.', 'It is inferred only from ice cores.', 'Satellites discovered it in 2001.'], answer: 0,
        explain: 'This is lab physics: John Tyndall measured the infrared absorption of CO₂ and water vapor in <b>1859</b>, and it can be repeated in any lab.' },
    ] },

  /* ═════════ 11.4 ═════════ */
  { id: 'c08', sec: '11.4', title: 'CO₂ and Beyond', short: 'Methane, nitrous oxide and halocarbons', slides: [[17, 'CO₂ and Beyond']],
    review: { html: `<ul><li><b>Methane (CH₄)</b>: about 27–30× the warming of CO₂, tonne for tonne, over 100 years; 166% above pre-industrial levels (2024). Sources: coal mines, livestock, rice farming, landfills, gas leaks.</li><li><b>Nitrous oxide (N₂O)</b>: 273× the warming of CO₂ per tonne over 100 years; lasts about 109 years. Sources: agricultural soils, fertilizer and manure, industry, fossil fuel combustion.</li><li><b>Halocarbons</b> (CFCs, HFCs): up to thousands of times more potent; no natural source. Sources: refrigerants, aerosols, solvents.</li></ul><p>Even so, CO₂ causes about <b>66%</b> of the extra heat from long-lived greenhouse gases, because humans emit so much of it and it lasts so long.</p>`, fig: 'donut', figcap: 'NOAA Annual Greenhouse Gas Index (2024): share of the extra heat by gas.' },
    variants: [
      { type: 'match', stem: 'Match each greenhouse gas to its main human sources.', hint: 'Refrigerants are human-made chemicals.',
        pairs: [['Methane (CH₄)', 'Livestock, rice farming, landfills and gas leaks'], ['Nitrous oxide (N₂O)', 'Fertilizer, manure and agricultural soils'], ['Halocarbons (CFCs, HFCs)', 'Refrigerants, aerosols and solvents'], ['Carbon dioxide (CO₂)', 'Burning coal, oil and gas; cement; deforestation']],
        explain: 'Methane comes largely from livestock, rice, landfills and leaks; nitrous oxide from fertilizer and manure; halocarbons from refrigerants; CO₂ from burning fossil fuels, cement and deforestation.' },
      { type: 'fill', stem: 'Complete the sentence.', text: 'Tonne for tonne over 100 years, methane traps about {{0}} times as much heat as CO₂.', blanks: [{ num: 28.5, tol: 1.6, show: '27–30', w: 5 }],
        hint: 'The lecture gave a range in the high 20s.', explain: 'Methane traps about <b>27–30×</b> as much heat as CO₂ per tonne over 100 years (IPCC AR6).' },
      { type: 'mc', stem: 'Methane is far more potent per tonne. Why does CO₂ still cause most (about 66%) of the extra warming?', hint: 'Think about how much is emitted, and how long it stays.',
        choices: ['Humans emit far more CO₂, and it lasts much longer in the air.', 'CO₂ absorbs more infrared per molecule than methane.', 'Methane does not absorb infrared.', 'There is no methane in the atmosphere.'], answer: 0,
        explain: 'Potency per tonne is not the whole story: humans emit vastly more CO₂, and it stays in the air for centuries, so it causes about <b>66%</b> of the extra heat.' },
      { type: 'slice', stem: 'The ring shows each gas’s share of the extra heat trapped by human-caused increases since 1750. Click the slice for <b>methane</b>.', hideValues: true, answer: 1,
        cap: 'Share of the extra heat, by gas (2024)', hint: 'Methane is second to CO₂.', explain: 'Methane causes about <b>16%</b> of the extra heat, second only to CO₂ (66%). Halocarbons add about 12% and nitrous oxide about 6%.' },
    ] },

  { id: 'c09', sec: '11.4', title: 'Where Emissions Come From', short: 'Five sectors, 59 billion tonnes', slides: [[17, 'CO₂ and Beyond: Where emissions come from']],
    review: { html: `<p>Human-caused greenhouse gas emissions were about <b>59 billion tonnes CO₂-equivalent</b> in 2019 (IPCC AR6). By economic sector:</p><ul><li><b>Energy supply 34%</b>: power plants, refineries, fuel production</li><li><b>Industry 24%</b>: steel, cement, chemicals</li><li><b>Agriculture, forestry and land use 22%</b>: livestock, fertilizer, deforestation</li><li><b>Transport 15%</b>: cars, trucks, ships, planes</li><li><b>Buildings 6%</b>: heating and cooking on site</li></ul>` },
    variants: [
      { type: 'order', stem: 'Rank the sectors from the <b>largest</b> share of emissions (top) to the <b>smallest</b> (bottom).', hint: 'Electricity and fuel production lead; on-site heating in buildings is last.',
        items: ['Energy supply', 'Industry', 'Agriculture, forestry and land use', 'Transport', 'Buildings'], explain: 'Energy supply 34%, industry 24%, agriculture/forestry/land use 22%, transport 15%, buildings 6%.' },
      { type: 'bars', stem: 'Drag each bar to that sector’s share of global emissions (2019).', cap: 'Share of human-caused greenhouse gas emissions, 2019', max: 40, step: 1, grid: 10, unit: '%', tol: 5, startAt: 20,
        bars: [{ label: 'Energy supply', ans: 34 }, { label: 'Industry', ans: 24 }, { label: 'Agriculture & land', ans: 22 }, { label: 'Transport', ans: 15 }, { label: 'Buildings', ans: 6 }],
        hint: 'One sector is about a third of the total.', explain: 'Energy supply 34%, industry 24%, agriculture/forestry/land use 22%, transport 15%, buildings 6% (IPCC AR6 WGIII).' },
      { type: 'fill', stem: 'Complete the sentence.', text: 'In 2019, human-caused greenhouse gas emissions totaled about {{0}} billion tonnes of CO₂-equivalent.', blanks: [{ num: 59, tol: 3, w: 5 }],
        hint: 'The number sat in the middle of the donut chart.', explain: 'About <b>59 billion tonnes</b> of CO₂-equivalent in 2019 (IPCC AR6 WGIII).' },
      { type: 'mc', stem: 'Which sector produces the <b>largest</b> share of human-caused greenhouse gas emissions?', hint: 'Think power plants and refineries.',
        choices: ['Energy supply', 'Transport', 'Buildings', 'Agriculture, forestry and land use'], answer: 0, explain: '<b>Energy supply</b> (power plants, refineries, fuel production) is the largest at about 34%.' },
    ] },

  { id: 'c10', sec: '11.4', title: 'The 800,000-Year CO₂ Record', short: 'Far outside the natural range', slides: [[15, 'Human-Driven Global Warming']],
    review: { html: `<p>Air bubbles in Antarctic ice show that through eight ice ages and warm periods, CO₂ stayed between about <b>170 and 300 ppm</b>. The highest level in the ice-core record is about <b>299 ppm</b>.</p><p>In <b>2025</b> CO₂ reached <b>426 ppm</b>, about 43% above that natural high, and nearly all of the rise came in the last 150 years. The IPCC (2021): “It is unequivocal that human influence has warmed the atmosphere, ocean and land.”</p>`, fig: 'co2', figcap: 'EPA ice-core compilation (2022) and NOAA Global Monitoring Laboratory (2026), via Our World in Data.' },
    variants: [
      { type: 'slider', viz: 'ppm', label: 'CO₂ (ppm)', stem: 'The modern spike is hidden. Drag the red line to the CO₂ level the air reached in <b>2025</b>.', min: 150, max: 450, step: 1, start: 250, answer: 426, tol: 8, unit: 'ppm',
        hint: 'It is far above the dashed line, the highest natural level.', explain: 'CO₂ reached about <b>426 ppm</b> in 2025, far above anything in 800,000 years of ice-core records.' },
      { type: 'pick', chart: 'co2', cap: 'Carbon dioxide in the atmosphere, last 800,000 years', chartOpts: { hideCeiling: true }, stem: 'Click the <b>highest</b> CO₂ level in the ice-core record, <b>before</b> the Industrial Revolution.', hint: 'Ignore the red modern spike at the right edge; look for the tallest natural peak.',
        accept: t => t.x < 1750 && t.y >= 295, correct: () => co2At(-333152), explain: 'The natural high was about <b>299 ppm, about 333,000 years ago</b>. Today’s 426 ppm is far above it.' },
      { type: 'fill', stem: 'Calculate.', text: 'Today’s CO₂ (426 ppm) is about {{0}}% above the highest natural level in 800,000 years (299 ppm).', blanks: [{ num: 42.5, tol: 2.6, show: '43', w: 5 }],
        note: 'Percent above = (426 − 299) ÷ 299 × 100.', hint: 'Find the difference, divide by 299, then multiply by 100.', explain: '(426 − 299) ÷ 299 = 0.425, so about <b>43%</b> above the natural high.' },
      { type: 'mc', stem: 'Over the last 800,000 years, before industrialization, atmospheric CO₂ stayed between about…', hint: 'The ice-age lows were under 200 ppm.',
        choices: ['170 and 300 ppm', '300 and 400 ppm', '50 and 150 ppm', '400 and 600 ppm'], answer: 0, explain: 'Through eight ice ages and warm periods CO₂ ranged between about <b>170 and 300 ppm</b>.' },
    ] },

  { id: 'c11', sec: '11.4', title: 'Human Emissions Over Time', short: 'From 6 to 38.6 billion tonnes a year', slides: [[15, 'Humans are emitting CO₂ (tab)'], [18, 'Chain of Evidence, step 2']],
    review: { html: `<p>Yearly CO₂ from burning fossil fuels and making cement grew from about <b>6 billion tonnes in 1950</b> to <b>22.7 billion in 1990</b> and <b>38.6 billion in 2024</b> (Global Carbon Budget). Emissions dipped in <b>2020</b> during the pandemic, then rebounded.</p><p>About <b>58%</b> of all the fossil CO₂ released since 1750 was emitted in 1990 or later. Counting all greenhouse gases, emissions in 2019 were <b>54% higher than in 1990</b> (IPCC AR6).</p>`, fig: 'emis', figcap: 'Global Carbon Budget (2025), via Our World in Data. Land-use change not included.' },
    variants: [
      { type: 'pick', chart: 'emis', cap: 'CO₂ emitted by humans each year, 1750–2024', stem: 'Click the year when emissions <b>dipped because of the pandemic</b>.', hint: 'Look near the right edge for a short drop.',
        accept: t => t.x === 2020, correct: () => yearT(D.emis, 2020, q => q[0] + ': ' + q[1].toFixed(1) + ' billion t'), explain: 'Emissions fell to about 35.2 billion tonnes in <b>2020</b> as travel and industry slowed, then rebounded.' },
      { type: 'fill', stem: 'Complete the sentence.', text: 'In 2024, humans emitted about {{0}} billion tonnes of CO₂ from fossil fuels and cement.', blanks: [{ num: 38.6, tol: 1.5, w: 6 }],
        hint: 'It is a little under 40.', explain: 'About <b>38.6 billion tonnes</b> in 2024 (Global Carbon Budget).' },
      { type: 'mc', stem: 'About what share of all the fossil CO₂ emitted since 1750 was released in 1990 or later?', hint: 'Look at how steep the curve is after 1990.',
        choices: ['More than half (about 58%)', 'About a tenth', 'About a quarter', 'Almost none'], answer: 0, explain: 'About <b>58%</b>: more fossil CO₂ has been emitted since 1990 than in all the years before it.' },
      { type: 'fill', stem: 'Calculate.', text: 'Yearly fossil CO₂ grew from 5.9 billion tonnes in 1950 to 38.6 billion in 2024: about {{0}} times as much.', blanks: [{ num: 6.5, tol: .5, w: 5 }],
        note: 'Times as much = 38.6 ÷ 5.9.', hint: 'Divide the newer number by the older one.', explain: '38.6 ÷ 5.9 ≈ <b>6.5</b> times as much in 2024 as in 1950.' },
    ] },

  { id: 'c12', sec: '11.4', title: 'Rising Temperatures', short: 'The warmest years, and what “1.5 °C” means', slides: [[16, 'Global Temperature Anomaly']],
    review: { html: `<p>Compared with the 1861–1890 average (HadCRUT5), <b>2024 was +1.53 °C</b>, the warmest year on record, and 2025 was +1.41 °C. Every year since 1930 has been warmer than that average, and the <b>10 warmest years on record have all come since 2015</b>.</p><p>One year above 1.5 °C does <b>not</b> break the Paris Agreement limit, which refers to warming averaged over about 20 years.</p>`, fig: 'temp', figcap: 'Met Office Hadley Centre, HadCRUT5 (2026), via Our World in Data.' },
    variants: [
      { type: 'pick', chart: 'temp', cap: 'Global average temperature each year, compared with 1861–1890', stem: 'Click the <b>warmest year</b> on record.', hint: 'Find the tallest bar.',
        accept: t => t.x === 2024, correct: () => yearT(D.temp, 2024, q => q[0] + ': +' + q[1].toFixed(2) + ' °C'), explain: '<b>2024</b> was the warmest year on record, +1.53 °C compared with 1861–1890.' },
      { type: 'mc', stem: '2024 was 1.53 °C warmer than the 1861–1890 average. Did the world break the Paris Agreement’s 1.5 °C limit?', hint: 'How is the Paris limit measured?',
        choices: ['Not yet: the limit refers to warming averaged over about 20 years, not a single year.', 'Yes: any year above 1.5 °C breaks the limit.', 'No: the Paris limit is 3 °C.', 'Yes, and warming has now stopped.'], answer: 0,
        explain: 'The Paris limit is about <b>long-term</b> warming, averaged over about 20 years. Single years swing up and down around that trend.' },
      { type: 'multi', stem: 'Which statements about the temperature record are true? Select all that apply.', hint: 'Look closely at the right side of the chart.',
        choices: ['Every year since 1930 has been warmer than the 1861–1890 average.', 'The 10 warmest years on record have all come since 2015.', 'Each year has been warmer than the year before it.', '2025 was the warmest year on record.'], answers: [0, 1],
        explain: 'Every year since 1930 has been above the 1861–1890 average, and the 10 warmest have all come since 2015. But warming is not steady year to year, and 2024, not 2025, holds the record.' },
      { type: 'pick', chart: 'temp', cap: 'Global average temperature each year, compared with 1861–1890', chartOpts: { noParis: true }, stem: 'Click the <b>last year</b> that was cooler than the 1861–1890 average.', hint: 'Find the last bar that points down, below the average line.',
        accept: t => t.x === 1929, correct: () => yearT(D.temp, 1929, q => q[0] + ': −' + Math.abs(q[1]).toFixed(2) + ' °C'), explain: '<b>1929</b> was the last year below the 1861–1890 average; every year since 1930 has been warmer.' },
    ] },

  { id: 'c13', sec: '11.4', title: 'The Chain of Evidence', short: 'How we know humans are warming the planet', slides: [[18, 'How Do We Know? A Chain of Evidence']],
    review: { html: `<ol style="padding-left:18px"><li>CO₂ and other greenhouse gases absorb infrared. We can test this in a lab.</li><li>Humans are burning fossil fuels and emitting CO₂ into the atmosphere.</li><li>The concentration of CO₂ in the atmosphere is going up.</li><li>Thus, less heat escapes to space, and this will lead to more warming.</li><li>The extra heat comes from greenhouse gases, not the Sun: the lower atmosphere is warming while the upper atmosphere cools.</li></ol><p>Each step follows from the one before it.</p>` },
    variants: [
      { type: 'order', stem: 'Put the chain of evidence in order, so each step follows from the one before it.', hint: 'Start with lab physics; end with the consequence.',
        items: ['CO₂ absorbs infrared heat; this can be tested in a lab.', 'Humans are burning fossil fuels and emitting CO₂.', 'The concentration of CO₂ in the atmosphere is rising.', 'Thus, less heat escapes to space, which leads to more warming.'],
        explain: 'Physics (CO₂ absorbs infrared) → cause (we emit CO₂) → observation (CO₂ is rising) → consequence (less heat escapes, so Earth warms).' },
      { type: 'mc', stem: 'Steps 1, 2 and 4 of the chain are: (1) CO₂ absorbs infrared; (2) humans are emitting CO₂; (4) thus, less heat escapes to space. What is step 3?', hint: 'What do we measure in the air?',
        choices: ['The concentration of CO₂ in the atmosphere is going up.', 'The Sun is getting brighter.', 'Volcanoes emit more CO₂ than humans do.', 'Earth’s orbit is changing.'], answer: 0,
        explain: 'Step 3 is the observation that links our emissions to the physics: <b>CO₂ in the air is going up</b> (the Keeling curve and ice cores).' },
      { type: 'mc', stem: 'Which link in the chain can be tested directly in a laboratory?', hint: 'One link is pure physics.',
        choices: ['CO₂ absorbs infrared heat.', 'Humans are emitting CO₂.', 'The upper atmosphere is cooling.', 'Global temperatures are rising.'], answer: 0,
        explain: 'Infrared absorption by CO₂ is lab physics, first measured by John Tyndall in 1859. The other links come from records of fuel use and from measurements of the atmosphere.' },
    ] },

  { id: 'c14', sec: '11.4', title: 'The Fingerprint: Gases, Not the Sun', short: 'Lower air warming, upper air cooling', slides: [[18, 'Chain of Evidence, step 5']],
    review: { html: `<p>Two suspects could heat Earth's surface, and each leaves a different <b>fingerprint</b> on the layers of the atmosphere:</p><ul><li>A <b>brighter Sun</b> would heat every layer, top to bottom.</li><li><b>More greenhouse gases</b> trap heat down low, while CO₂ high up sends more heat out to space, so the <b>upper air (stratosphere) cools</b> while the lower air (troposphere) warms.</li></ul><p>Satellites measure the lower atmosphere warming and the stratosphere cooling: the greenhouse-gas fingerprint.</p>` },
    variants: [
      { type: 'figmc', stem: 'Which pattern did satellites actually measure, pointing to <b>greenhouse gases</b> as the cause?', figs: PROFILES, answer: 1, hint: 'Greenhouse gases warm the air where we live but let the upper air cool.',
        explain: 'Satellites show the <b>troposphere warming and the stratosphere cooling</b>. A brighter Sun would warm both layers.' },
      { type: 'figmc', stem: 'Which pattern would a <b>brighter Sun</b> produce?', figs: PROFILES, answer: 0, hint: 'More sunlight adds heat everywhere.',
        explain: 'A brighter Sun would heat <b>every layer</b>, so both the stratosphere and the troposphere would warm. That is not what we see.' },
      { type: 'mc', stem: 'The stratosphere is cooling while the troposphere warms. What does that point to?', hint: 'Which suspect cools the upper air?',
        choices: ['Greenhouse gases are causing the warming.', 'The Sun is causing the warming.', 'Volcanic eruptions are causing the warming.', 'The warming is not real.'], answer: 0,
        explain: 'Only greenhouse gases warm the lower air while cooling the upper air. A brighter Sun would warm both.' },
    ] },

  /* ═════════ 11.5 ═════════ */
  { id: 'c15', sec: '11.5', title: 'Sea-Level Rise', short: 'Warmer water expands, and land ice melts', slides: [[20, 'Sea-Level Rise']],
    review: { html: `<ul><li>Global mean sea level has risen about <b>8–9 inches since 1880</b> (NOAA), in part from <b>thermal expansion</b>: water expands as it warms. Melting glaciers and ice sheets on land add more water.</li><li>The IPCC's likely rise by 2100 under an intermediate scenario is <b>1.4–2.5 ft</b> (0.44–0.76 m), relative to 1995–2014.</li><li>About <b>11%</b> of the world's people (896 million) lived on low-lying coasts below 10 m elevation in 2020.</li><li>Local sea level can rise faster or slower than the global average where the land sinks or rises.</li></ul>` },
    variants: [
      { type: 'fill', stem: 'Complete the sentence.', text: 'Global mean sea level has risen about {{0}} inches since 1880.', blanks: [{ num: 8.5, tol: .6, show: '8–9', w: 5 }],
        hint: 'A bit under a foot.', explain: 'About <b>8–9 inches</b> since 1880 (NOAA), partly from water expanding as it warms.' },
      { type: 'multi', stem: 'Which of these raise global sea level? Select all that apply.', hint: 'Floating ice already displaces its own weight in water.',
        choices: ['Ocean water expanding as it warms', 'Glaciers on land melting', 'The Greenland and Antarctic ice sheets losing ice', 'Floating sea ice melting', 'More rain falling over the ocean'], answers: [0, 1, 2],
        explain: 'Thermal expansion and melting <b>land</b> ice (glaciers and ice sheets) raise sea level. Floating sea ice already displaces its weight in water, so its melting adds almost nothing, and rain over the ocean is water that evaporated from it.' },
      { type: 'mc', stem: 'Why can local sea level rise faster than the global average in some places?', hint: 'Sea level is measured against the land.',
        choices: ['The land there is sinking.', 'The ocean is deeper there.', 'There are more storms there.', 'Global averages are always lower than local values.'], answer: 0,
        explain: 'Where the land <b>sinks</b> (for example from groundwater pumping or settling sediments), the sea rises faster relative to the coast; where land rises, slower.' },
      { type: 'fill', stem: 'Complete the sentence.', text: 'About {{0}}% of the world’s people lived on low-lying coasts, below 10 m elevation, in 2020.', blanks: [{ num: 11, tol: 1.5, w: 4 }],
        hint: 'That was about 896 million people.', explain: 'About <b>11%</b> of the world, roughly 896 million people (IPCC AR6).' },
    ] },

  { id: 'c16', sec: '11.5', title: 'Heat Waves and Storms', short: 'Phoenix heat deaths and stronger hurricanes', slides: [[21, 'More Rain, More Drought, More Extremes'], [23, 'Warmer oceans → more powerful storms']],
    review: { html: `<p><b>Heat</b>: In Maricopa County (Phoenix and its suburbs), heat-related deaths rose from <b>61 in 2014</b> to a record <b>645 in 2023</b>, then 608 in 2024 and 430 in 2025 (county public-health reports). These are counts, and the county's population also grew. Worldwide, 37% of warm-season heat deaths in 732 locations (1991–2018) were due to human-caused warming.</p><p><b>Storms</b>: The National Climate Assessment projects stronger hurricanes, especially in the Atlantic: even if total storm counts don't rise, the share of <b>major (Category 3–5)</b> hurricanes is growing. Nine of the ten costliest U.S. hurricanes (through 2020) struck in 2004 or later, partly because more people and property sit on the coast.</p>`, fig: 'phx', figcap: 'Maricopa County Department of Public Health, Heat-Related Deaths Reports (2024, 2025).' },
    variants: [
      { type: 'pick', chart: 'phx', cap: 'Heat-related deaths in Maricopa County, each year', stem: 'Click the year with the <b>most</b> heat-related deaths in Maricopa County.', hint: 'Find the tallest bar.',
        accept: t => t.x === 2023, correct: () => yearT(D.phx, 2023, q => q[0] + ': ' + q[1] + ' deaths'), explain: '<b>2023</b> set the record with 645 heat-related deaths, during Phoenix’s hottest summer on record.' },
      { type: 'fill', stem: 'Calculate.', text: 'Maricopa County recorded about {{0}} times as many heat deaths in 2023 (645) as in 2014 (61).', blanks: [{ num: 10.6, tol: .7, w: 5 }],
        note: 'Times as many = 645 ÷ 61.', hint: 'Divide 645 by 61.', explain: '645 ÷ 61 ≈ <b>10.6</b>, roughly 11 times as many.' },
      { type: 'mc', stem: 'What does the National Climate Assessment project for hurricanes as oceans warm?', hint: 'Warmer oceans give storms more energy.',
        choices: ['Stronger storms: a growing share of major (Category 3–5) hurricanes, even if total counts don’t rise.', 'Far fewer hurricanes of every kind.', 'No change at all.', 'Hurricanes will only form in winter.'], answer: 0,
        explain: 'Warmer oceans mean more energy, so the <b>share of major hurricanes</b> is growing even when the total number of storms is not.' },
      { type: 'mc', stem: 'Nine of the ten costliest U.S. hurricanes (through 2020) struck in 2004 or later. What explanation did the lecture give?', hint: 'There are two parts.',
        choices: ['More people and property on the coast, and warmer oceans making the strongest storms stronger.', 'Only inflation.', 'Hurricanes are now counted differently.', 'Only better insurance records.'], answer: 0,
        explain: 'Both: more <b>exposure</b> (people and property on the coast) and <b>stronger storms</b> from warmer oceans.' },
    ] },

  { id: 'c17', sec: '11.5', title: 'Ocean Acidification', short: 'pH, hydrogen ions and the logarithmic scale', slides: [[24, 'Ocean Acidification and Ecosystem Shifts'], [25, 'Ocean Acidification: Seawater pH']],
    review: { html: `<p>The ocean absorbs CO₂, which forms carbonic acid and lowers its pH. At Station ALOHA north of Oʻahu, surface pH fell from <b>8.11 to 8.04</b> between 1989 and 2024.</p><p>pH is <b>logarithmic</b>: each drop of 1.0 means 10× as many hydrogen ions, and a drop of 0.07 means about <b>17% more</b>. Since industrialization the ocean has become about 30% more acidic. Seawater is still basic (above pH 7); it is becoming <b>less basic</b>, which threatens corals and shellfish at the base of marine food webs.</p>`, fig: 'ph', figcap: 'Hawaii Ocean Time-series, Station ALOHA (University of Hawaiʻi), via Our World in Data. The axis starts at pH 8.00.' },
    variants: [
      { type: 'slider', viz: 'ph', ref: 8.1, label: 'pH', stem: 'Starting from seawater at pH 8.10, drag the slider to the pH that would <b>double</b> the hydrogen ions.', min: 7.5, max: 8.3, step: .01, start: 8.1, answer: 7.8, tol: .02, unit: '',
        fmt: v => v.toFixed(2), hint: 'Each pH unit is 10×. Doubling takes about 0.3 of a unit (10⁰·³ ≈ 2).', explain: '10<sup>0.3</sup> ≈ 2, so a drop of about 0.3, from 8.10 to <b>7.80</b>, doubles the hydrogen ions.' },
      { type: 'fill', stem: 'Calculate.', text: 'Surface pH at Station ALOHA fell from 8.11 to 8.04. That means about {{0}}% more hydrogen ions.', blanks: [{ num: 17, tol: 3, w: 4 }],
        note: 'Hydrogen ions multiply by 10^(8.11 − 8.04) = 10^0.07.', hint: '10^0.07 ≈ 1.17.', explain: '10<sup>0.07</sup> ≈ 1.17, so about <b>17% more</b> hydrogen ions.' },
      { type: 'mc', stem: 'Seawater’s pH is about 8.0. Is the ocean acidic?', hint: 'Neutral is pH 7.',
        choices: ['No: it is still basic, but becoming less basic as it absorbs CO₂.', 'Yes: any water below pH 8.5 is acidic.', 'Yes: it is as acidic as lemon juice.', 'No, and its pH is rising.'], answer: 0,
        explain: 'Seawater is still <b>basic</b> (above 7). “Acidification” means its pH is falling, moving toward acidic.' },
      { type: 'mc', stem: 'A pH drop of 1.0 means hydrogen ions increase by…', hint: 'The pH scale is logarithmic.', choices: ['10 times', '1%', '2 times', '100 times'], answer: 0,
        explain: 'pH is logarithmic: each 1.0 drop means <b>10×</b> as many hydrogen ions.' },
    ] },

  /* ═════════ 11.6 ═════════ */
  { id: 'c18', sec: '11.6', title: 'Feedbacks and Tipping Points', short: 'What amplifies warming, and what can’t be undone', slides: [[26, 'Climate Models, Scenarios & Tipping Points']],
    review: { html: `<p><b>Positive (reinforcing) feedbacks</b> amplify change. <b>Albedo</b> is an example: light surfaces like snow and ice reflect sunlight, dark surfaces absorb it, so melting ice exposes dark ocean that absorbs more heat and melts more ice.</p><p><b>Tipping points</b> are thresholds where changes become self-reinforcing, such as permafrost releasing methane or ice sheets collapsing, and may be irreversible. That is why early, deep action matters.</p><p><b>Climate models</b> run simulations for different emission <b>scenarios</b>; each scenario makes assumptions about future emissions, energy use and population to project outcomes to 2100.</p>` },
    variants: [
      { type: 'bins', stem: 'Sort each process: does it <b>amplify</b> warming or <b>dampen</b> it?', hint: 'Amplifying (reinforcing) feedbacks make the change bigger.',
        bins: [{ name: 'Amplifies warming (reinforcing)', c: '#a8483f' }, { name: 'Dampens warming (balancing)', c: '#4f7194' }],
        items: [{ t: 'Melting sea ice exposes dark ocean, which absorbs more sunlight.', b: 0 }, { t: 'Thawing permafrost releases methane.', b: 0 }, { t: 'Warmer air holds more water vapor, a greenhouse gas.', b: 0 },
          { t: 'A warmer Earth gives off more heat to space.', b: 1 }, { t: 'More CO₂ speeds plant growth, which pulls some CO₂ back out of the air.', b: 1 }],
        explain: 'Ice-albedo, permafrost methane and water vapor <b>amplify</b> warming. A warmer Earth radiating more heat, and faster plant growth taking up CO₂, push back and <b>dampen</b> it.' },
      { type: 'mc', stem: 'Why does melting Arctic sea ice speed up warming?', hint: 'Think about albedo: what reflects sunlight, and what absorbs it?',
        choices: ['It exposes dark ocean, which absorbs much more sunlight than bright ice.', 'Melting ice releases stored heat.', 'Sea ice is a greenhouse gas.', 'It raises sea level, which traps heat.'], answer: 0,
        explain: 'Bright ice reflects sunlight (high <b>albedo</b>); dark ocean absorbs it. Less ice means more absorbed heat, which melts more ice: a reinforcing feedback.' },
      { type: 'mc', stem: 'What is a climate <b>tipping point</b>?', hint: 'Once crossed, it keeps going on its own.',
        choices: ['A threshold where changes become self-reinforcing and may be irreversible', 'The year when emissions peak', 'The point where warming stops', 'A record-hot day'], answer: 0,
        explain: 'A tipping point is a <b>threshold</b> past which change becomes self-reinforcing (like permafrost methane release or ice-sheet collapse) and may not be reversible.' },
      { type: 'mc', stem: 'Climate models project warming under different <b>scenarios</b>. What is a scenario?', hint: 'It describes a possible future, not a prediction of the weather.',
        choices: ['A set of assumptions about future emissions, energy use and population used to project outcomes', 'A forecast of next week’s weather', 'A record of past temperatures', 'A measurement taken by satellite'], answer: 0,
        explain: 'Each scenario makes <b>assumptions</b> about emissions, energy use and population; models then project what each path would mean for the climate.' },
    ] },

  /* ═════════ 11.7 ═════════ */
  { id: 'c19', sec: '11.7', title: 'Climate Inequities', short: 'Who emits, who is harmed, and what people think', slides: [[29, 'Climate Inequities'], [6, 'Willingness to Act']],
    review: { html: `<ul><li><b>Who emits</b>: high-income countries are about 15% of the world's people but emit 34% of its CO₂; low-income countries are 9% of people and emit less than 1%.</li><li><b>Who dies</b>: from 2010 to 2020, death rates from floods, droughts and storms were <b>15 times higher</b> in highly vulnerable regions than in the least vulnerable (IPCC AR6).</li><li><b>Who loses income</b>: warming has cut income per person by an estimated 17–31% in the countries home to the poorest 40% of people (Diffenbaugh & Burke, 2019).</li><li><b>What people think</b>: worldwide, about 69% of people said they would give 1% of their income to fight climate change, but they guessed only about 43% of others would (Andre et al., 2024).</li></ul>` },
    variants: [
      { type: 'bars', stem: 'The grey bars show each income group’s share of the world’s <b>population</b>. Drag the red bars to each group’s share of the world’s <b>CO₂ emissions</b>.', cap: 'Share of world population (grey) and of CO₂ emissions (red), by country income group',
        max: 50, step: 1, grid: 10, unit: '%', tol: 6, startAt: 25, legend: ['Share of population', 'Share of CO₂ (you set)'],
        bars: [{ label: 'High income', ans: 34, ref: 15 }, { label: 'Upper-middle', ans: 46, ref: 32 }, { label: 'Lower-middle', ans: 17, ref: 43 }, { label: 'Low income', ans: 1, ref: 9 }],
        hint: 'Low-income countries emit almost nothing; high-income countries emit about twice their share of people.', explain: 'High income 34% of CO₂ (15% of people); upper-middle 46% (32%); lower-middle 17% (43%); low income under 1% (9%). Our World in Data, from the Global Carbon Budget.' },
      { type: 'mc', stem: 'From 2010 to 2020, how did death rates from floods, droughts and storms compare in highly vulnerable regions versus the least vulnerable?', hint: 'The lecture drew it as 1 figure versus a row of figures.',
        choices: ['About 15 times higher', 'About the same', 'About twice as high', 'Lower, because vulnerable regions have fewer storms'], answer: 0,
        explain: 'About <b>15 times higher</b> (IPCC AR6 WGII). Vulnerability is highest where poverty, weak public services and climate-dependent livelihoods overlap.' },
      { type: 'fill', stem: 'Complete the sentence with the survey results.', text: 'Worldwide, about {{0}}% of people said they would give 1% of their income to fight climate change, but they guessed only about {{1}}% of others would.',
        blanks: [{ num: Math.round(D.willing.actual), tol: 4, w: 4 }, { num: Math.round(D.willing.predicted), tol: 4, w: 4 }], hint: 'The first number is about two-thirds; the guess was well under half.',
        explain: 'About <b>69%</b> said yes, but people guessed only about <b>43%</b> of others would: most people underestimate how willing everyone else is (Andre et al., 2024).' },
      { type: 'mc', stem: 'Low-income countries are home to about 9% of the world’s people. About what share of the world’s CO₂ do they emit?', hint: 'It is tiny.',
        choices: ['Less than 1%', 'About 9%', 'About 20%', 'About 34%'], answer: 0, explain: 'Less than <b>1%</b>, even though they are home to 9% of people and face some of the worst harm.' },
    ] },

  { id: 'c20', sec: '11.7', title: 'Can We Afford It?', short: 'The cost of acting vs. the cost of not acting', slides: [[31, 'So, Can We Afford It?'], [28, 'Carbon Footprint Calculator']],
    review: { html: `<ul><li><b>The cost of acting</b>: the IPCC assessed enough cuts to halve global emissions from their 2019 level by 2030. More than half of that potential costs <b>under $20 a tonne</b> (solar, wind, efficiency, stopping methane leaks), and all of it costs $100 a tonne or less.</li><li><b>The cost of not acting</b>: the <b>social cost of carbon</b>, the damage from emitting one tonne of CO₂ over its lifetime (lost lives from heat, lower crop yields, energy costs, sea-level rise), is about <b>$185</b> (2020 dollars; range $44 to $413; Rennert et al., 2022).</li><li>Already on the bill: 27 U.S. billion-dollar disasters in 2024 alone ($182.7 billion).</li></ul><p>The IPCC: “The global cost of limiting warming to 2 °C over the 21st century is lower than the global economic benefits of reducing warming.”</p>` },
    variants: [
      { type: 'slider', viz: 'usd', label: 'Dollars per tonne', stem: 'Drag the red marker to the <b>social cost of carbon</b>: the damage from emitting one tonne of CO₂.', min: 0, max: 400, step: 5, start: 50, answer: 185, tol: 15, unit: '$ / tonne',
        fmt: v => '$' + Math.round(v), hint: 'It is several times the cost of the cheapest cuts, but well under $400.', explain: 'About <b>$185 per tonne</b> (Rennert et al., 2022), many times the under-$20 cost of over half of the cuts needed.' },
      { type: 'fill', stem: 'Calculate.', text: 'A car emits about 4 tonnes of CO₂ a year. At $185 per tonne, that causes about ${{0}} of damage a year.', blanks: [{ num: 740, tol: 10, w: 7 }],
        note: 'Damage = tonnes × social cost per tonne.', hint: 'Multiply 4 by 185.', explain: '4 × $185 = <b>$740</b> of damage a year, a cost the driver does not pay directly.' },
      { type: 'mc', stem: 'What does the <b>social cost of carbon</b> measure?', hint: 'It is about damage, not prices at the pump.',
        choices: ['The damage from emitting one tonne of CO₂, added up over its lifetime', 'The price of a tonne of coal', 'The cost of building a solar farm', 'A tax that every country charges on CO₂'], answer: 0,
        explain: 'It adds up the <b>damage</b> one tonne of CO₂ causes over its lifetime: heat deaths, lower crop yields, energy costs and sea-level rise.' },
      { type: 'mc', stem: 'According to the IPCC, more than half of the emission cuts needed to halve 2019 emissions by 2030 cost…', hint: 'Solar, wind, efficiency and fixing methane leaks are cheap.',
        choices: ['Under $20 a tonne', 'Over $400 a tonne', 'About $1,000 a tonne', 'Nothing, because they are free'], answer: 0,
        explain: 'More than half cost <b>under $20 a tonne</b>, and all of it costs $100 a tonne or less, far below the roughly $185 of damage each tonne causes.' },
    ] },
  ];

  window.MB_CHAPTERS = window.MB_CHAPTERS || {};
  window.MB_CHAPTERS.ch11 = {
    id: 'ch11', num: 11, roman: 'XI', title: 'Climate', subtitle: 'How Does Global Climate Change?', deck: DECK,
    sections: [
      { id: '11.1', title: 'How Do We Measure Global Climate?', c: S['11.1'] },
      { id: '11.2', title: 'What Caused Climate Change in the Past?', c: S['11.2'] },
      { id: '11.4', title: 'What’s Happening with Our Climate Now?', c: S['11.4'] },
      { id: '11.5', title: 'What Are Some Effects of Climate Change?', c: S['11.5'] },
      { id: '11.6', title: 'What About the Future?', c: S['11.6'] },
      { id: '11.7', title: 'What Can I Do?', c: S['11.7'] },
    ],
    concepts,
  };
})();
