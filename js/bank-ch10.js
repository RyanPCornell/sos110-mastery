/* SOS 110 Mastery: Chapter 10, Systems and Cycles.
   Every fact comes from the deployed Chapter 10 deck (ryanpcornell.github.io/sos110-chapter-10/) or the sources it cites.
   Build-your-own causal loops (type 'loop') use the deck's own systems: the Face-Off cards (slide 12), Reading Real
   Systems (slide 11), the Loop Lab (slide 14) and Systems at Work (slide 25). */
(function () {
  const S = { '10.1': '#2d6a4f', '10.2': '#8a6a2f', '10.3': '#3f6f8f', '10.4': '#6b5a8e', '10.5': '#a8483f', '10.6': '#4a5a3a' };
  const INK = '#3b3222';

  /* ── small drawing helpers for the figures and diagram scenes ── */
  const cloud = (x, y) => `<path d="M${x - 34},${y + 10} c-14,0 -16,-20 -2,-22 c2,-14 22,-18 30,-8 c8,-12 30,-8 30,6 c14,0 16,22 0,24 Z" fill="#f4efe3" stroke="${INK}" stroke-width="2"/>`;
  const valve = (x, y) => `<path d="M${x - 12},${y - 12} L${x + 12},${y + 12} L${x + 12},${y - 12} L${x - 12},${y + 12} Z" fill="#fbf6ea" stroke="${INK}" stroke-width="2"/>`;
  const pipe = (x1, y1, x2, y2, m) => `<path d="M${x1},${y1} L${x2},${y2}" stroke="#9fbfd4" stroke-width="12" stroke-linecap="round"/><path d="M${x1},${y1} L${x2},${y2}" stroke="${INK}" stroke-width="2" marker-end="url(#${m})"/>`;
  const arrowDef = (id, c) => `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c || INK}"/></marker>`;
  const fish = (x, y) => `<path d="M${x},${y} c6,-6 16,-6 22,0 c-6,6 -16,6 -22,0 Z M${x + 22},${y} l7,-5 l0,10 Z" fill="#7a95a8" stroke="${INK}" stroke-width="1"/>`;

  /* Northern cod: one stock, one inflow, two outflows (slide 11, case 1) */
  const COD_SCENE = `<svg viewBox="0 0 760 300" role="img" aria-label="A stock-and-flow diagram with a source cloud, an inflow valve, a stock box of fish, and two outflow valves, one beside a fishing boat">
    <defs>${arrowDef('cdA')}</defs><rect width="760" height="300" fill="#f6f1e4"/>
    ${cloud(80, 150)}${pipe(118, 150, 300, 150, 'cdA')}${valve(200, 150)}
    <rect x="300" y="95" width="170" height="110" rx="6" fill="#cfe2ec" stroke="${INK}" stroke-width="2.4"/>
    ${fish(325, 130)}${fish(380, 150)}${fish(335, 175)}${fish(410, 120)}${fish(420, 180)}
    ${pipe(470, 125, 660, 70, 'cdA')}${valve(570, 97)}${cloud(700, 64)}
    ${pipe(470, 180, 660, 235, 'cdA')}${valve(570, 207)}${cloud(700, 238)}
    <path d="M540,40 h56 l-10,16 h-36 Z" fill="#8a6446" stroke="${INK}" stroke-width="1.5"/><path d="M568,40 V18 M568,22 l16,10" stroke="${INK}" stroke-width="1.5"/>
    <path d="M560,58 q8,18 2,30 M576,58 q-4,18 4,30" stroke="#6f6a5e" stroke-width="1.2" fill="none" stroke-dasharray="3 3"/>
  </svg>`;

  /* A lake: source, inflow, stock, outflow, sink (slide 10) */
  const LAKE_SCENE = `<svg viewBox="0 0 760 260" role="img" aria-label="A stock-and-flow diagram: a cloud on the left, a valve, a lake drawn as a box, a second valve and a cloud on the right">
    <defs>${arrowDef('lkA')}</defs><rect width="760" height="260" fill="#f6f1e4"/>
    ${cloud(90, 130)}${pipe(128, 130, 300, 130, 'lkA')}${valve(210, 130)}
    <rect x="300" y="70" width="170" height="120" rx="6" fill="#fbf6ea" stroke="${INK}" stroke-width="2.4"/>
    <path d="M302,120 H468 V188 H302 Z" fill="#9fc3dc"/><path d="M306,120 q14,-6 28,0 t28,0 t28,0 t28,0 t28,0 t20,0" stroke="#2f5f84" stroke-width="1.6" fill="none"/>
    ${pipe(470, 130, 640, 130, 'lkA')}${valve(555, 130)}${cloud(676, 130)}
  </svg>`;

  /* Nitrogen cycle with four numbered steps (slides 21 and 22) */
  const N_SCENE = `<svg viewBox="0 0 760 360" role="img" aria-label="Nitrogen cycle: air at the top, soil below, a plant with root nodules, dead leaves, and four numbered arrows">
    <defs>${arrowDef('nA', '#3f6f3a')}${arrowDef('nB', '#a8483f')}</defs>
    <rect width="760" height="360" fill="#f6f1e4"/><rect width="760" height="150" fill="#dfe9ee"/>
    <text x="380" y="34" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="18" fill="${INK}">The air: about 78% N₂</text>
    <rect y="150" width="760" height="210" fill="#c9a77a"/><path d="M0,150 H760" stroke="${INK}" stroke-width="2"/>
    <path d="M300,150 V100 M300,118 q-24,-10 -30,-30 q24,4 30,24 M300,108 q22,-12 34,-30 q-26,2 -34,24" stroke="#3f6f3a" stroke-width="3" fill="#8fbe6e"/>
    <path d="M300,150 q-10,30 -24,44 M300,150 q8,34 20,48 M300,150 v52" stroke="#6b4f33" stroke-width="2" fill="none"/>
    <circle cx="282" cy="186" r="5" fill="#e8c9bd" stroke="${INK}"/><circle cx="314" cy="190" r="5" fill="#e8c9bd" stroke="${INK}"/><circle cx="300" cy="200" r="5" fill="#e8c9bd" stroke="${INK}"/>
    <path d="M470,160 q10,-8 22,0 q-10,8 -22,0 Z M500,166 q10,-8 22,0 q-10,8 -22,0 Z" fill="#a27a4e" stroke="${INK}"/>
    <rect x="460" y="240" width="62" height="30" rx="6" fill="#fbf6ea" stroke="${INK}"/><text x="491" y="261" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="${INK}">NH₄⁺</text>
    <rect x="600" y="240" width="62" height="30" rx="6" fill="#fbf6ea" stroke="${INK}"/><text x="631" y="261" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="${INK}">NO₃⁻</text>
    <path d="M120,60 C110,110 120,170 150,220" stroke="#3f6f3a" stroke-width="3" fill="none" marker-end="url(#nA)"/>
    <path d="M500,178 C500,200 496,218 492,236" stroke="#3f6f3a" stroke-width="3" fill="none" marker-end="url(#nA)"/>
    <path d="M524,255 H596" stroke="#3f6f3a" stroke-width="3" fill="none" marker-end="url(#nA)"/>
    <path d="M660,238 C690,180 690,110 650,60" stroke="#a8483f" stroke-width="3" fill="none" stroke-dasharray="8 6" marker-end="url(#nB)"/>
    ${[[96, 120, 1], [470, 210, 2], [560, 238, 3], [700, 150, 4]].map(([x, y, n]) => `<circle cx="${x}" cy="${y}" r="13" fill="#fbf6ea" stroke="${INK}" stroke-width="1.6"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="14" fill="${INK}">${n}</text>`).join('')}
  </svg>`;

  /* Natural carbon cycle with five numbered flows (slide 19) */
  const C_SCENE = `<svg viewBox="0 0 760 380" role="img" aria-label="Natural carbon cycle: a volcano, a tree on land, the ocean and the sea floor, with five numbered arrows">
    <defs>${arrowDef('cA')}${arrowDef('cG', '#3f6f3a')}${arrowDef('cR', '#a8483f')}${arrowDef('cB', '#2f5f84')}${arrowDef('cO', '#c0582a')}</defs>
    <rect width="760" height="380" fill="#dfe9ee"/>
    <path d="M0,200 L70,110 L100,96 L130,110 L200,200 L420,200 L460,300 L760,300 V380 H0 Z" fill="#c9b088"/>
    <path d="M420,200 L460,300 H760 V200 Z" fill="#9fc0d4"/><path d="M460,330 H760 V380 H460 Z" fill="#e6e1d4"/><path d="M460,330 H760" stroke="${INK}" stroke-width="1" opacity=".5"/>
    <path d="M0,200 L70,110 L100,96 L130,110 L200,200 L420,200 L460,300 H760" stroke="${INK}" stroke-width="2" fill="none"/>
    <path d="M290,200 V150" stroke="#8a6446" stroke-width="6"/><circle cx="290" cy="128" r="30" fill="#7fa75a" stroke="${INK}" stroke-width="1.5"/>
    <path d="M260,40 C258,70 262,90 272,110" stroke="#3f6f3a" stroke-width="3" fill="none" marker-end="url(#cG)"/>
    <path d="M318,106 C330,86 334,64 336,42" stroke="#a8483f" stroke-width="3" fill="none" marker-end="url(#cR)"/>
    <path d="M560,60 V190" stroke="#2f5f84" stroke-width="3" marker-end="url(#cB)"/><path d="M590,190 V60" stroke="#2f5f84" stroke-width="3" marker-end="url(#cB)"/>
    <path d="M650,240 V322" stroke="#8a6446" stroke-width="3" marker-end="url(#cA)"/>
    <path d="M100,92 C104,66 116,50 132,36" stroke="#c0582a" stroke-width="3" stroke-dasharray="8 6" fill="none" marker-end="url(#cO)"/>
    ${[[244, 76, 1], [352, 78, 2], [620, 124, 3], [676, 282, 4], [150, 60, 5]].map(([x, y, n]) => `<circle cx="${x}" cy="${y}" r="13" fill="#fbf6ea" stroke="${INK}" stroke-width="1.6"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="14" fill="${INK}">${n}</text>`).join('')}
  </svg>`;

  /* Two ways to draw a system, plus a decoy (slide 10) */
  const fig = (inner, label) => `<svg viewBox="0 0 300 170" role="img" aria-label="${label}"><rect width="300" height="170" fill="#f6f1e4"/>${inner}</svg>`;
  const DRAW_FIGS = [
    { svg: fig(`<defs>${arrowDef('f1A')}</defs>${cloud(52, 88)}<path d="M84,88 H118" stroke="#9fbfd4" stroke-width="10"/><path d="M84,88 H118" stroke="${INK}" stroke-width="2" marker-end="url(#f1A)"/>${valve(100, 88)}<rect x="120" y="58" width="70" height="60" rx="4" fill="#cfe2ec" stroke="${INK}" stroke-width="2"/><path d="M190,88 H232" stroke="#9fbfd4" stroke-width="10"/><path d="M190,88 H232" stroke="${INK}" stroke-width="2" marker-end="url(#f1A)"/>${valve(212, 88)}${cloud(268, 88)}`, 'A box with pipes and valves flowing in and out') },
    { svg: fig(`<defs>${arrowDef('f2A')}</defs><text x="150" y="34" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="${INK}">A</text><text x="236" y="128" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="${INK}">B</text><text x="64" y="128" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="${INK}">C</text><path d="M166,36 C210,46 232,80 234,108" stroke="${INK}" stroke-width="2" fill="none" marker-end="url(#f2A)"/><path d="M216,132 C180,150 120,150 84,132" stroke="${INK}" stroke-width="2" fill="none" marker-end="url(#f2A)"/><path d="M62,108 C66,74 96,44 134,36" stroke="${INK}" stroke-width="2" fill="none" marker-end="url(#f2A)"/><text x="214" y="64" font-family="Georgia,serif" font-weight="700" font-size="16" fill="${INK}">+</text><text x="146" y="160" font-family="Georgia,serif" font-weight="700" font-size="16" fill="${INK}">−</text><text x="72" y="68" font-family="Georgia,serif" font-weight="700" font-size="16" fill="${INK}">+</text><text x="150" y="98" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="22" fill="#2d6a4f">B</text>`, 'Three words joined in a circle by arrows marked plus and minus') },
    { svg: fig(`<path d="M40,140 H270 M40,140 V24" stroke="${INK}" stroke-width="2"/>${[60, 110, 160, 210].map((x, i) => `<rect x="${x}" y="${140 - [40, 80, 60, 100][i]}" width="34" height="${[40, 80, 60, 100][i]}" fill="#c9b088" stroke="${INK}"/>`).join('')}`, 'A bar chart with four bars') },
  ];

  /* Behavior over time (slides 8, 10, 11) */
  const graph = (path, label) => fig(`<path d="M40,140 H270 M40,140 V20" stroke="${INK}" stroke-width="2"/><text x="270" y="158" text-anchor="end" font-family="Inter,sans-serif" font-size="11" fill="#6b5f48">time</text><path d="${path}" stroke="#8a6a2f" stroke-width="3" fill="none"/>`, label);
  const BEHAVIOR_FIGS = [
    { svg: graph('M44,134 C120,132 170,122 210,96 C236,78 252,52 266,24', 'A curve that rises slowly, then faster and faster'), label: 'A' },
    { svg: graph('M44,130 C70,60 110,52 150,62 C190,72 230,64 266,64', 'A curve that moves quickly toward a level and then holds steady near it'), label: 'B' },
    { svg: graph('M44,40 L266,130', 'A straight line falling at a constant rate'), label: 'C' },
  ];

  const concepts = [
    /* ═════════ 10.1 ═════════ */
    { id: 'c01', sec: '10.1', title: 'What Is a System?', short: 'Parts that interact, and why one cause is rarely enough', slides: [[7, 'Open Systems, Closed Systems & Emergence'], [5, 'Two Ways to See Traffic']],
      review: { html: `<p>A <b>system</b> is a collection of components that interact to produce outcomes that no single component could achieve alone.</p><ul><li><b>Linear thinking</b> sees one cause and one effect: “more lanes lead to fewer traffic problems.”</li><li><b>Systems thinking</b> follows the connections. Add lanes and driving gets easier for a while, so more people drive, and the jams come back. Transit, zoning, housing, work-from-home policies and street design all feed in.</li><li>The same is true in business: across 56 studies with hundreds of estimates, 10% more advertising raised sales by only about 1% in the short run (Sethuraman, Tellis &amp; Briesch, 2011). Word of mouth, reviews, quality and price often matter more.</li></ul>`,
        terms: [['System', 'components that interact to produce outcomes no single component could achieve alone'], ['Linear thinking', 'one cause, one effect'], ['Systems thinking', 'tracing how the parts are connected']] },
      variants: [
        { type: 'mc', stem: 'Which definition of a <b>system</b> matches the chapter?', hint: 'The key idea is what the parts produce together.',
          choices: ['A collection of components that interact to produce outcomes no single component could achieve alone', 'Any large object made of many identical pieces', 'A list of steps that always happen in the same order', 'A single cause that produces a single effect'], answer: 0,
          explain: 'A system is defined by <b>interaction</b>: the parts together produce outcomes that none could produce alone.' },
        { type: 'mc', stem: 'A city adds two lanes to a jammed freeway. A few years later the jams are back. What does <b>systems thinking</b> say happened?', hint: 'What do drivers do when a trip gets faster?',
          choices: ['Faster trips drew more people to drive, and traffic rose until the jams returned', 'The new lanes were built too narrow', 'Traffic jams are random and cannot be explained', 'More lanes always end traffic problems, so something else must be wrong'], answer: 0,
          explain: 'Adding lanes makes driving easier for a while, so <b>more people drive</b> and the jams come back. “More lanes, fewer traffic problems” is linear thinking.' },
        { type: 'bins', stem: 'Sort each statement: <b>linear</b> thinking or <b>systems</b> thinking?', hint: 'Linear thinking stops at one cause and one effect.',
          bins: [{ name: 'Linear thinking', c: '#8a6a2f' }, { name: 'Systems thinking', c: '#2d6a4f' }],
          items: [{ t: 'More lanes will lead to fewer traffic problems.', b: 0 }, { t: 'More advertising will lead to more revenue.', b: 0 }, { t: 'New lanes make driving easier, so more people drive and the jams return.', b: 1 }, { t: 'Reviews, word of mouth, quality and price shape sales as much as ads do.', b: 1 }, { t: 'Zoning, transit and work-from-home policies all change how many people drive.', b: 1 }, { t: 'A bigger ad budget is the one lever that sets sales.', b: 0 }],
          explain: 'Linear statements name a single cause. Systems statements follow the connections, such as drivers responding to faster trips or customers responding to reviews.' },
        { type: 'mc', stem: 'Across 56 studies with hundreds of estimates, about how much did <b>10% more advertising</b> raise sales in the short run?', hint: 'It is much smaller than 10%.',
          choices: ['About 1%', 'About 10%', 'About 25%', 'It lowered sales'], answer: 0,
          explain: 'About <b>1%</b> (an average short-run elasticity of 0.12; Sethuraman, Tellis &amp; Briesch, 2011). Ads are one part of a larger system that includes word of mouth, reviews, quality and price.' },
      ] },

    { id: 'c02', sec: '10.1', title: 'Open and Closed Systems', short: 'What crosses Earth’s boundary, and what stays', slides: [[7, 'Open Systems, Closed Systems & Emergence']],
      review: { html: `<ul><li>Earth is <b>open for energy</b>: sunlight comes in, and Earth radiates heat back out to space.</li><li>Earth is <b>approximately closed for matter</b>: very little crosses its boundary (some meteor dust arrives, a trace of gas escapes to space), so matter is used and reused.</li><li><b>Biosphere 2</b> sealed miniature biomes (rainforest, ocean, desert) inside one building: a small model of a world that reuses its matter.</li></ul>` },
      variants: [
        { type: 'mc', stem: 'Which description of Earth matches the chapter?', hint: 'Think separately about energy and about matter.',
          choices: ['Open for energy, approximately closed for matter', 'Closed for energy, open for matter', 'Open for both energy and matter', 'Completely closed for both'], answer: 0,
          explain: 'Sunlight comes in and heat radiates out, so Earth is <b>open for energy</b>. Very little matter crosses the boundary, so it is <b>approximately closed for matter</b> and reuses its atoms.' },
        { type: 'bins', stem: 'Sort each item by how it behaves at Earth’s boundary.', hint: 'Energy streams through; matter mostly stays.',
          bins: [{ name: 'Streams in or out every day', c: '#c0582a' }, { name: 'Mostly stays and is reused', c: '#2d6a4f' }],
          items: [{ t: 'Sunlight', b: 0 }, { t: 'Heat radiated to space', b: 0 }, { t: 'Nitrogen atoms', b: 1 }, { t: 'Carbon atoms', b: 1 }, { t: 'Phosphorus atoms', b: 1 }, { t: 'Water', b: 1 }],
          explain: 'Energy flows through Earth: <b>sunlight in, heat out</b>. Atoms of nitrogen, carbon, phosphorus and water mostly stay and cycle, which is why the chapter studies biogeochemical cycles.' },
        { type: 'mc', stem: 'Why is Earth only <b>approximately</b> closed for matter, rather than perfectly closed?', hint: 'A little does cross the boundary.',
          choices: ['Some meteor dust arrives and a trace of gas escapes to space', 'Sunlight carries matter in', 'Plants create new atoms', 'Oceans send water to space every day'], answer: 0,
          explain: 'A small amount crosses: <b>meteor dust in, a trace of gas out</b>. It is tiny compared with what cycles, so matter is used and reused.' },
        { type: 'mc', stem: 'Biosphere 2 sealed miniature biomes inside one building. What kind of model of Earth was it?', hint: 'Sunlight still came in.',
          choices: ['A system that reuses its own matter while energy comes in', 'A system with no energy input at all', 'A system open to matter from outside', 'A model of a single ecosystem only'], answer: 0,
          explain: 'Biosphere 2 held a rainforest, an ocean and a desert under one roof: a small world that, like Earth, reuses its matter while sunlight supplies the energy.' },
      ] },

    { id: 'c03', sec: '10.1', title: 'Emergent Properties', short: 'What the whole can do that no part can', slides: [[7, 'Open Systems, Closed Systems & Emergence'], [27, 'Key Concepts: Systems']],
      review: { html: `<p><b>Emergent properties</b> arise from how the parts of a system interact, so you cannot predict them by studying the components alone. Example: the respiratory system delivering oxygen to the body. No single cell does it; the system does.</p>` },
      variants: [
        { type: 'mc', stem: 'What is an <b>emergent property</b>?', hint: 'It belongs to the whole, not to any one part.',
          choices: ['A behavior that arises from how the parts interact and cannot be predicted from the parts alone', 'A property shared by every part of a system', 'A sudden emergency in a system', 'The largest component of a system'], answer: 0,
          explain: 'Emergent properties come from <b>interactions</b>. Studying one part at a time will not reveal them.' },
        { type: 'multi', stem: 'Select <b>all</b> the emergent properties.', hint: 'Ask: could any single part produce this by itself?',
          choices: ['The respiratory system delivering oxygen to the body', 'A traffic jam that no single driver intended', 'Empty store shelves when every shopper buys a little extra at once', 'The mass of one brick', 'The color of one car'], answers: [0, 1, 2],
          explain: 'Oxygen delivery, a traffic jam and empty shelves all come from <b>many parts interacting</b>. A brick’s mass and a car’s color belong to single components.' },
        { type: 'mc', stem: 'A student studies every individual cell of the lungs in detail. Why might she still miss how the respiratory system works?', hint: 'Where does the behavior come from?',
          choices: ['Oxygen delivery is an emergent property of how the parts work together', 'Lungs do not contain cells', 'Each cell delivers oxygen by itself', 'Cells are too small to study'], answer: 0,
          explain: 'Delivering oxygen to the body is <b>emergent</b>: it comes from the parts interacting, so it cannot be predicted from components alone.' },
      ] },

    /* ═════════ 10.2 ═════════ */
    { id: 'c04', sec: '10.2', title: 'Stocks and Flows', short: 'What builds up, and the rates that change it', slides: [[8, 'Models, Stocks, Flows & Feedback'], [9, 'Stocks, Flows & Feedback: Interactive Lab']],
      review: { html: `<ul><li>A <b>stock</b> is a quantity that accumulates over time, like water stored in a lake.</li><li>A <b>flow</b> is the movement into or out of a stock, like deposits and withdrawals in a bank account. Inflows increase the stock; outflows decrease it (the faucet-and-drain analogy).</li><li>If inflow is larger than outflow, the stock rises; if smaller, it falls. In the lab, a tub with 80 L, a faucet at 12 L/s and a drain at 8 L/s gains 4 L every second.</li></ul>`,
        terms: [['Stock', 'a quantity that accumulates over time'], ['Flow', 'the movement into or out of a stock'], ['Inflow / outflow', 'flows that raise / lower a stock']] },
      variants: [
        { type: 'bins', stem: 'Sort each item: <b>stock</b> or <b>flow</b>?', hint: 'A stock can be measured at one moment; a flow is a rate per unit of time.',
          bins: [{ name: 'Stock', c: '#2f5f84' }, { name: 'Flow', c: '#8a6a2f' }],
          items: [{ t: 'Water stored in a lake', b: 0 }, { t: 'Rivers and rain entering the lake', b: 1 }, { t: 'Money in a bank account', b: 0 }, { t: 'Deposits each month', b: 1 }, { t: 'Cod in the sea', b: 0 }, { t: 'The fishing catch each year', b: 1 }, { t: 'CO₂ in the atmosphere', b: 0 }, { t: 'Evaporation from the lake', b: 1 }],
          explain: 'Stocks are amounts that <b>build up</b>: lake water, money, cod, CO₂. Flows are <b>rates</b> that change them: rivers in, deposits, the catch, evaporation out.' },
        { type: 'fill', stem: 'Use the faucet-and-drain lab.', text: 'A tub holds 80 L. The faucet adds 12 L/s and the drain removes 8 L/s. After 10 seconds the tub holds {{0}} L.',
          blanks: [{ num: 120, tol: 1, w: 5 }], note: 'net flow = inflow − outflow', hint: 'Find the net change each second, then multiply by 10.',
          explain: 'Net flow = 12 − 8 = <b>+4 L/s</b>. In 10 s the stock gains 40 L: 80 + 40 = <b>120 L</b>. The stock rises because inflow exceeds outflow.' },
        { type: 'mc', stem: 'A lake’s inflow (rivers and rain) is <b>smaller</b> than its outflow (evaporation and the outlet river). What happens to the stock of water?', hint: 'Compare what comes in with what goes out.',
          choices: ['It falls', 'It rises', 'It stays the same', 'It is impossible to tell'], answer: 0,
          explain: 'When outflow exceeds inflow the <b>stock falls</b>, whatever its current size. A stock changes only through its flows.' },
        { type: 'fill', stem: 'Use the faucet-and-drain lab.', text: 'A tub holds 80 L. The faucet adds 6 L/s and the drain removes 10 L/s. After 15 seconds the tub holds {{0}} L.',
          blanks: [{ num: 20, tol: 1, w: 5 }], note: 'net flow = inflow − outflow', hint: 'The net flow is negative this time.',
          explain: 'Net flow = 6 − 10 = <b>−4 L/s</b>. In 15 s the tub loses 60 L: 80 − 60 = <b>20 L</b>.' },
      ] },

    { id: 'c05', sec: '10.2', title: 'Stock-and-Flow Diagrams', short: 'Boxes, pipes, valves and clouds', slides: [[10, 'Two Ways to Draw a System'], [11, 'Reading Real Systems']],
      review: { html: `<p>A <b>stock-and-flow diagram</b> helps us understand how systems change over time.</p><ul><li><b>Boxes</b> are stocks.</li><li><b>Pipes with valves</b> are flows; the valve sets the rate.</li><li><b>Clouds</b> are sources or sinks outside the system.</li></ul><p>Example (slide 11): the northern cod off Newfoundland. The stock is the cod in the sea; young fish joining the population are the inflow; the fishing catch and natural deaths are the outflows. For years the catch alone was larger than the inflow, and in July 1992 Canada closed the fishery (Fisheries and Oceans Canada).</p>` },
      variants: [
        { type: 'diagram', stem: 'Label the stock-and-flow diagram of the <b>northern cod</b>: drag each label onto the part it describes.', hint: 'The box is what builds up. Find the pipe beside the boat.',
          scene: COD_SCENE, labels: ['Stock: cod in the sea', 'Inflow: young fish joining the population', 'Outflow: the fishing catch', 'Outflow: natural deaths'],
          slots: [{ x: 50.5, y: 50, ans: 0, hint: 'The box' }, { x: 26, y: 62, ans: 1, hint: 'Left valve' }, { x: 75, y: 45, ans: 2, hint: 'Upper valve' }, { x: 75, y: 82, ans: 3, hint: 'Lower valve' }],
          explain: 'The box is the <b>stock</b> of cod. The left pipe is the <b>inflow</b> of young fish; the upper pipe, beside the boat, is the <b>catch</b>; the lower pipe is <b>natural deaths</b>. When the catch outran the inflow, the stock fell until the fishery closed in 1992.' },
        { type: 'diagram', stem: 'Label the stock-and-flow diagram of a <b>lake</b>: drag each label onto the part it describes.', hint: 'Clouds sit outside the system. Valves set flow rates.',
          scene: LAKE_SCENE, labels: ['A source outside the system', 'Inflow: rivers and rain', 'Stock: water in the lake', 'Outflow: evaporation and the outlet river'],
          slots: [{ x: 11, y: 64, ans: 0, hint: 'Left cloud' }, { x: 27.5, y: 66, ans: 1, hint: 'Left valve' }, { x: 50.5, y: 52, ans: 2, hint: 'The box' }, { x: 73, y: 66, ans: 3, hint: 'Right valve' }],
          explain: 'The left <b>cloud</b> is a source outside the system, the left valve is the <b>inflow</b> (rivers and rain), the box is the <b>stock</b>, and the right valve is the <b>outflow</b> (evaporation and the outlet river).' },
        { type: 'mc', stem: 'In a stock-and-flow diagram, what does a <b>cloud</b> stand for?', hint: 'It is drawn at the ends of the pipes.',
          choices: ['A source or sink outside the system', 'A stock that is growing', 'Rain falling into the system', 'A feedback loop'], answer: 0,
          explain: 'Clouds mark where a flow comes from or goes to <b>outside</b> the boundary we chose to study.' },
        { type: 'mc', stem: 'What is the main purpose of a stock-and-flow diagram?', hint: 'Look at the slide’s “Purpose” line.',
          choices: ['To understand how systems change over time', 'To show which loop is reinforcing', 'To list every species in an ecosystem', 'To rank causes by importance'], answer: 0,
          explain: 'Stock-and-flow diagrams track <b>what builds up and how fast</b>, so they show how a system changes over time.' },
      ] },

    { id: 'c06', sec: '10.2', title: 'Causal Loop Diagrams', short: 'Arrows of cause and effect, marked + or −', slides: [[10, 'Two Ways to Draw a System'], [11, 'Reading Real Systems']],
      review: { html: `<p>A <b>causal loop diagram</b> shows cause-and-effect relationships in a system. Each arrow is a cause.</p><ul><li><b>+</b> means the two move the same way: more cause, more effect.</li><li><b>−</b> means they move opposite ways: more cause, less effect.</li></ul><p>Examples: city heat <b>+</b> air-conditioning use; travel time <b>−</b> people who choose to drive; room temperature <b>−</b> thermostat calls for heat.</p>` },
      variants: [
        { type: 'bins', stem: 'Sort each causal arrow by its sign.', hint: 'When the first thing goes up, does the second go up (+) or down (−)?',
          bins: [{ name: '+ (same direction)', c: '#2d6a4f' }, { name: '− (opposite direction)', c: '#a8483f' }],
          items: [{ t: 'City heat → Air-conditioning use', b: 0 }, { t: 'Cars on the freeway → Travel time', b: 0 }, { t: 'Travel time → People who choose to drive', b: 1 }, { t: 'Room temperature → Thermostat calls for heat', b: 1 }, { t: 'Furnace output → Room temperature', b: 0 }, { t: 'Sea ice → Sunlight absorbed by the ocean', b: 1 }],
          explain: 'More heat, more AC (+); more cars, slower trips (+); slower trips, fewer drivers (−); warmer room, less call for heat (−); more furnace, warmer room (+); more ice, less sunlight absorbed (−).' },
        { type: 'figmc', stem: 'Which drawing is a <b>causal loop diagram</b>?', figs: DRAW_FIGS, answer: 1, hint: 'Look for arrows marked + and −.',
          explain: 'The circle of words joined by <b>+</b> and <b>−</b> arrows is a causal loop diagram. The box with pipes and valves is a stock-and-flow diagram.' },
        { type: 'figmc', stem: 'Which drawing is a <b>stock-and-flow diagram</b>?', figs: DRAW_FIGS, answer: 0, hint: 'Look for a box with pipes and valves.',
          explain: 'The <b>box</b> (stock), <b>pipes with valves</b> (flows) and <b>clouds</b> (outside the system) make a stock-and-flow diagram.' },
        { type: 'mc', stem: 'An arrow from <b>Price</b> to <b>Sales</b> is marked <b>−</b>. What does that mean?', hint: 'A minus sign means opposite directions.',
          choices: ['When price goes up, sales go down', 'Price and sales always fall together', 'Price has no effect on sales', 'Sales cause the price to rise'], answer: 0,
          explain: 'A <b>−</b> arrow means the two move in <b>opposite</b> directions: a higher price, fewer sales (and a lower price, more sales).' },
      ] },

    { id: 'c07', sec: '10.2', title: 'Reinforcing or Balancing?', short: 'Count the minus signs', slides: [[8, 'Models, Stocks, Flows & Feedback'], [10, 'Two Ways to Draw a System'], [12, 'Reinforcing or Balancing?']],
      review: { html: `<ul><li>A <b>reinforcing (positive) loop</b> amplifies change: less sea ice exposes darker water, which absorbs more heat and melts more ice.</li><li>A <b>balancing (negative) loop</b> counteracts change and helps stabilize a system, like a thermostat regulating room temperature.</li><li><b>The rule:</b> count the minus signs around the loop. An <b>odd</b> number makes it balancing; an <b>even</b> number (or none) makes it reinforcing.</li></ul>`,
        terms: [['Reinforcing loop', 'positive feedback; amplifies change'], ['Balancing loop', 'negative feedback; helps stabilize a system']] },
      variants: [
        { type: 'bins', stem: 'Sort the loops from the Face-Off: <b>reinforcing</b> or <b>balancing</b>?', hint: 'Does following the chain push the first thing further the same way, or push back?',
          bins: [{ name: 'Reinforcing', c: '#a8483f' }, { name: 'Balancing', c: '#2d6a4f' }],
          items: [{ t: 'Melting ice and global warming', b: 0 }, { t: 'Thawing permafrost', b: 0 }, { t: 'Interest on savings', b: 0 }, { t: 'Erosion on a bare hillside', b: 0 }, { t: 'A thermostat regulating room temperature', b: 1 }, { t: 'Sweating on a run', b: 1 }, { t: 'Foxes and rabbits', b: 1 }, { t: 'Blood sugar after a snack', b: 1 }],
          explain: 'Ice, permafrost, interest and erosion each <b>feed themselves</b>. The thermostat, sweating, foxes and rabbits, and insulin each <b>push back</b> toward a level.' },
        { type: 'fill', stem: 'A loop has four arrows with the signs <b>+, −, −, +</b>.', text: 'It has {{0}} minus signs, so it is a {{1}} loop.',
          blanks: [{ num: 2, tol: 0, w: 3 }, { accept: ['reinforcing', 'positive', 'reinforcing (positive)', 'R'] }], hint: 'Odd number of minus signs: balancing. Even: reinforcing.',
          explain: 'Two minus signs is an <b>even</b> number, so the effects cancel and the loop is <b>reinforcing</b>.' },
        { type: 'figmc', stem: 'Which graph shows a <b>balancing</b> loop at work?', figs: BEHAVIOR_FIGS, answer: 1, hint: 'Balancing loops pull a system toward a level.',
          explain: 'Graph B moves toward a level and <b>holds near it</b>: a balancing loop. Graph A, which speeds up, is the shape of a reinforcing loop.' },
        { type: 'figmc', stem: 'Which graph shows a <b>reinforcing</b> loop at work?', figs: BEHAVIOR_FIGS, answer: 0, hint: 'Reinforcing loops feed themselves.',
          explain: 'Graph A grows <b>faster and faster</b>: each round of the loop adds more. That is the signature of a reinforcing loop.' },
      ] },

    { id: 'c08', sec: '10.2', title: 'Build a Balancing Loop', short: 'Draw the loop that holds a system steady', slides: [[10, 'Two Ways to Draw a System'], [12, 'Reinforcing or Balancing?'], [14, 'Loop Lab']], lead: 'loop',
      review: { html: `<p>A <b>balancing loop</b> pushes back against change. Around the loop there is an <b>odd</b> number of minus signs.</p><ul><li>Thermostat: room temperature <b>−</b> thermostat calls for heat <b>+</b> furnace output <b>+</b> room temperature.</li><li>Sweating: body temperature <b>+</b> sweating <b>+</b> evaporative cooling <b>−</b> body temperature.</li><li>Blood sugar: sugar <b>+</b> insulin <b>+</b> sugar taken up by cells <b>−</b> blood sugar.</li><li>Foxes and rabbits: more rabbits, more foxes, more rabbits eaten, fewer rabbits.</li></ul><p>To build one, start at the piece named in the question and ask at every arrow: when this goes up, does the next go up (+) or down (−)?</p>` },
      variants: [
        { type: 'loop', stem: 'A cold front is coming. <b>Build the feedback loop</b> that keeps the <b>room temperature</b> near 70°F by running the <b>furnace</b>, then decide whether the loop is reinforcing or balancing.',
          hint: 'The thermostat is the go-between. When the room cools, what does the thermostat do?',
          pieces: { temp: 'Room temperature', call: 'Thermostat calls for heat', furn: 'Furnace output', out: 'Outdoor temperature', bill: 'Gas bill', tv: 'TV volume' },
          links: [['temp', 'call', '-'], ['call', 'furn', '+'], ['furn', 'temp', '+'], ['out', 'temp', '+'], ['furn', 'bill', '+']],
          goal: { must: ['temp', 'furn'], kind: 'B' }, sol: ['temp', 'call', 'furn'],
          explain: 'Room temperature <b>−</b> Thermostat calls for heat <b>+</b> Furnace output <b>+</b> Room temperature. One minus sign makes the loop <b>balancing</b>: when the room cools, the furnace warms it back up.' },
        { type: 'loop', stem: 'On a hot run your body heats up. <b>Build the feedback loop</b> that connects <b>body temperature</b> and <b>sweating</b>, then decide whether the loop is reinforcing or balancing.',
          hint: 'Sweat cools you as it evaporates. For each arrow, ask: when the first goes up, does the second go up (+) or down (−)?',
          pieces: { body: 'Body temperature', sweat: 'Sweating', evap: 'Evaporative cooling', pace: 'Running pace', shoe: 'Shoe size' },
          links: [['body', 'sweat', '+'], ['sweat', 'evap', '+'], ['evap', 'body', '-'], ['pace', 'body', '+']],
          goal: { must: ['body', 'sweat'], kind: 'B' }, sol: ['body', 'sweat', 'evap'],
          explain: 'Body temperature <b>+</b> Sweating <b>+</b> Evaporative cooling <b>−</b> Body temperature. One minus sign makes it <b>balancing</b>: sweating counteracts the rise in body temperature.' },
        { type: 'loop', stem: 'After a snack, sugar enters the blood. <b>Build the feedback loop</b> that connects <b>blood sugar</b> and <b>insulin</b>, then decide whether the loop is reinforcing or balancing.',
          hint: 'Insulin helps cells take sugar out of the blood.',
          pieces: { sugar: 'Blood sugar', ins: 'Insulin released', up: 'Sugar taken up by cells', snack: 'Snack eaten', hair: 'Hair color' },
          links: [['sugar', 'ins', '+'], ['ins', 'up', '+'], ['up', 'sugar', '-'], ['snack', 'sugar', '+']],
          goal: { must: ['sugar', 'ins'], kind: 'B' }, sol: ['sugar', 'ins', 'up'],
          explain: 'Blood sugar <b>+</b> Insulin <b>+</b> Sugar taken up by cells <b>−</b> Blood sugar. One minus sign: a <b>balancing</b> loop that returns blood sugar toward its normal range.' },
        { type: 'loop', stem: 'In a meadow, foxes hunt rabbits. <b>Build the feedback loop</b> that connects <b>rabbits</b> and <b>foxes</b>, then decide whether the loop is reinforcing or balancing.',
          hint: 'More prey can feed more predators. What do more predators do to the prey?',
          pieces: { rab: 'Rabbits', fox: 'Foxes', eaten: 'Rabbits eaten', grass: 'Grass', trail: 'Hiking trails' },
          links: [['rab', 'fox', '+'], ['fox', 'eaten', '+'], ['rab', 'eaten', '+'], ['eaten', 'rab', '-'], ['grass', 'rab', '+']],
          goal: { must: ['rab', 'fox'], kind: 'B' }, sol: ['rab', 'fox', 'eaten'],
          explain: 'Rabbits <b>+</b> Foxes <b>+</b> Rabbits eaten <b>−</b> Rabbits. One minus sign makes it <b>balancing</b>: predators rise with their prey, then pull the prey population back down.' },
        { type: 'mc', stem: 'A loop has three arrows and exactly <b>one</b> minus sign. What kind of loop is it, and what does it do?', hint: 'One is an odd number.',
          choices: ['Balancing: it pushes back against change', 'Reinforcing: it amplifies change', 'Neither: a loop needs two minus signs to count', 'Reinforcing, because most of its arrows are +'], answer: 0,
          explain: 'One minus sign is <b>odd</b>, so the loop is <b>balancing</b> and stabilizes the system, like a thermostat.' },
      ] },

    { id: 'c09', sec: '10.2', title: 'Build a Reinforcing Loop', short: 'Draw the loop that feeds itself', slides: [[10, 'Two Ways to Draw a System'], [11, 'Reading Real Systems'], [12, 'Reinforcing or Balancing?']], lead: 'loop',
      review: { html: `<p>A <b>reinforcing loop</b> amplifies change: each trip around the loop pushes the same way again. Around the loop there is an <b>even</b> number of minus signs (zero counts as even).</p><ul><li>Interest on savings: bigger balance, more interest, bigger balance.</li><li>Erosion on a bare hillside: soil lost, fewer plants, faster runoff, more soil lost.</li><li>Phoenix’s heat island: city heat <b>+</b> AC use <b>+</b> waste heat <b>+</b> city heat.</li><li>Thawing permafrost: thaw releases methane, the Arctic warms, more thaw.</li></ul>` },
      variants: [
        { type: 'loop', stem: 'Money sits in a savings account that earns interest. <b>Build the feedback loop</b> that connects the <b>balance</b> and the <b>interest earned</b>, then decide whether the loop is reinforcing or balancing.',
          hint: 'Interest is added to the balance. What does a bigger balance do to next year’s interest?',
          pieces: { bal: 'Savings balance', int: 'Interest earned', rate: 'Interest rate', spend: 'Money spent from the account', logo: 'Bank logo color' },
          links: [['bal', 'int', '+'], ['int', 'bal', '+'], ['rate', 'int', '+'], ['spend', 'bal', '-']],
          goal: { must: ['bal', 'int'], kind: 'R' }, sol: ['bal', 'int'],
          explain: 'Savings balance <b>+</b> Interest earned <b>+</b> Savings balance. No minus signs, so the loop is <b>reinforcing</b>: compound interest makes the stock speed up its own inflow.' },
        { type: 'loop', stem: 'A hillside has lost its plant cover. <b>Build the feedback loop</b> that connects <b>soil lost</b> and <b>plant cover</b>, then decide whether the loop is reinforcing or balancing.',
          hint: 'Roots hold soil and slow the water. Watch for two minus signs.',
          pieces: { soil: 'Soil lost', plants: 'Plant cover', runoff: 'Speed of runoff', rain: 'Heavy rain', sun: 'Time of sunset' },
          links: [['soil', 'plants', '-'], ['plants', 'runoff', '-'], ['runoff', 'soil', '+'], ['rain', 'runoff', '+']],
          goal: { must: ['soil', 'plants'], kind: 'R' }, sol: ['soil', 'plants', 'runoff'],
          explain: 'Soil lost <b>−</b> Plant cover <b>−</b> Speed of runoff <b>+</b> Soil lost. Two minus signs cancel, so the loop is <b>reinforcing</b>: each storm removes more soil than the last.' },
        { type: 'loop', stem: 'In summer 2023, Phoenix hit 110°F or more for 31 days in a row (June 30 to July 30). <b>Build the feedback loop</b> that connects <b>city heat</b> and <b>air-conditioning use</b>, then decide whether the loop is reinforcing or balancing.',
          hint: 'Every AC unit pumps heat from inside to outside.',
          pieces: { heat: 'City heat', ac: 'Air-conditioning use', waste: 'Waste heat released outdoors', trees: 'Shade trees and cool roofs', seats: 'Stadium seating' },
          links: [['heat', 'ac', '+'], ['ac', 'waste', '+'], ['waste', 'heat', '+'], ['trees', 'heat', '-']],
          goal: { must: ['heat', 'ac'], kind: 'R' }, sol: ['heat', 'ac', 'waste'],
          explain: 'City heat <b>+</b> AC use <b>+</b> Waste heat <b>+</b> City heat. No minus signs (zero is even), so the loop is <b>reinforcing</b>. Shade trees and cool roofs act on the loop from outside to weaken it.' },
        { type: 'loop', stem: 'Frozen Arctic ground holds old plant material. <b>Build the feedback loop</b> that connects <b>Arctic temperature</b> and <b>methane released</b> by thawing permafrost, then decide whether the loop is reinforcing or balancing.',
          hint: 'Methane is a greenhouse gas.',
          pieces: { temp: 'Arctic temperature', thaw: 'Permafrost thawing', ch4: 'Methane released', heat: 'Heat trapped by the atmosphere', fossil: 'Fossil fuel burning', tide: 'Ocean tides' },
          links: [['temp', 'thaw', '+'], ['thaw', 'ch4', '+'], ['ch4', 'heat', '+'], ['heat', 'temp', '+'], ['fossil', 'heat', '+']],
          goal: { must: ['temp', 'ch4'], kind: 'R' }, sol: ['temp', 'thaw', 'ch4', 'heat'],
          explain: 'Arctic temperature <b>+</b> Thawing <b>+</b> Methane <b>+</b> Heat trapped <b>+</b> Arctic temperature. Every link is +, so the loop is <b>reinforcing</b>: thaw releases methane, which drives more thawing.' },
        { type: 'mc', stem: 'A loop has four arrows: <b>−, +, −, +</b>. What kind of loop is it?', hint: 'Count the minus signs.',
          choices: ['Reinforcing, because two minus signs is an even number', 'Balancing, because it has minus signs', 'Balancing, because two is less than four', 'It cannot be a loop'], answer: 0,
          explain: 'Two minus signs is <b>even</b>, so the loop is <b>reinforcing</b>. The two “opposite direction” steps cancel each other.' },
      ] },

    { id: 'c10', sec: '10.2', title: 'Reading Real Systems', short: 'Cod, rush hour, Phoenix and EV chargers', slides: [[11, 'Reading Real Systems'], [14, 'Loop Lab']], lead: 'loop',
      review: { html: `<ul><li><b>Northern cod</b> (stock and flow): the catch outran the inflow of young fish, and Canada closed the fishery in July 1992 (Fisheries and Oceans Canada).</li><li><b>Rush hour</b> (balancing): more cars, slower trips; slower trips talk some people out of driving. Add lanes and trips get faster for a while, so more people drive and travel time returns: <b>induced demand</b> (Duranton &amp; Turner, 2011).</li><li><b>Phoenix heat</b> (reinforcing): heat, AC use and waste heat feed one another.</li><li><b>EVs and chargers</b> (both tools): EV purchases fill the stock of EVs on the road; more EVs bring more chargers, and more chargers bring more buyers, a reinforcing loop that starts slow and then speeds up (Li, Tong, Xing &amp; Zhou, 2017).</li></ul>` },
      variants: [
        { type: 'loop', stem: 'Every weekday evening the freeway jams. <b>Build the feedback loop</b> that connects <b>cars on the freeway</b> and <b>travel time</b>, then decide whether the loop is reinforcing or balancing.',
          hint: 'When the trip gets slow enough, what do some drivers decide?',
          pieces: { cars: 'Cars on the freeway', time: 'Travel time', drivers: 'People who choose to drive', lanes: 'Freeway lanes', rail: 'Light-rail riders', sign: 'Billboard color' },
          links: [['cars', 'time', '+'], ['time', 'drivers', '-'], ['drivers', 'cars', '+'], ['lanes', 'time', '-'], ['time', 'rail', '+'], ['rail', 'cars', '-']],
          goal: { must: ['cars', 'time'], kind: 'B' }, sol: ['cars', 'time', 'drivers'],
          explain: 'Cars <b>+</b> Travel time <b>−</b> People who choose to drive <b>+</b> Cars. One minus sign makes it <b>balancing</b>: traffic settles at a level. Add lanes and trips speed up, so more people drive and the loop pulls travel time back (induced demand).' },
        { type: 'loop', stem: 'People hesitate to buy an electric vehicle until chargers are nearby, and companies hesitate to build chargers until there are EVs to use them. <b>Build the feedback loop</b> that connects <b>EVs on the road</b> and <b>charging stations</b>, then decide whether the loop is reinforcing or balancing.',
          hint: 'Follow the loop through purchases.',
          pieces: { evs: 'EVs on the road', stations: 'Charging stations', buy: 'EV purchases', gas: 'Gas prices', paint: 'Car paint color' },
          links: [['evs', 'stations', '+'], ['stations', 'buy', '+'], ['buy', 'evs', '+'], ['gas', 'buy', '+']],
          goal: { must: ['evs', 'stations'], kind: 'R' }, sol: ['evs', 'stations', 'buy'],
          explain: 'EVs on the road <b>+</b> Charging stations <b>+</b> EV purchases <b>+</b> EVs on the road. No minus signs: a <b>reinforcing</b> loop. Early on, few chargers mean few buyers; once stations spread, growth takes off.' },
        { type: 'mc', stem: 'Why did the northern cod stock off Newfoundland collapse?', hint: 'Compare the outflow with the inflow.',
          choices: ['For years the catch was larger than the inflow of young fish, so the stock kept falling', 'The water became too cold for cod', 'A single bad year of fishing in 1992', 'Cod moved to a different ocean'], answer: 0,
          explain: 'The <b>outflow</b> (the catch) exceeded the <b>inflow</b> (young fish joining) year after year. The stock fell until Canada closed the fishery in <b>July 1992</b>.' },
        { type: 'mc', stem: 'A city widens its freeways, and within a few years travel time is back where it started. What do economists call this?', hint: 'The new capacity brought new trips.',
          choices: ['Induced demand', 'A tipping point', 'Emergence', 'Calcination'], answer: 0,
          explain: '<b>Induced demand</b>: faster trips lead more people to drive, and the balancing loop pulls travel time back (Duranton &amp; Turner, 2011).' },
      ] },

    { id: 'c11', sec: '10.2', title: 'Thresholds and Tipping Points', short: 'Where small changes cause big shifts', slides: [[13, 'Thresholds, Tipping Points and Leverage Points']],
      review: { html: `<ul><li>A <b>threshold</b> is a point at which a system shifts significantly. Cool water one degree at a time and it just gets colder; then at 32°F it becomes solid ice.</li><li><b>Tipping points</b> are difficult to predict: complex interactions make exact thresholds uncertain. Scientists warn that if roughly 20–25% of the Amazon is cleared, much of it could dry out and turn to savanna; nobody knows the exact number (Lovejoy &amp; Nobre, 2018). The safe move is to stay well back from the edge.</li></ul>` },
      variants: [
        { type: 'mc', stem: 'What is a <b>threshold</b>?', hint: 'Think of water at 32°F.',
          choices: ['A point at which a system shifts significantly', 'The largest stock in a system', 'A flow that never changes', 'A place where a small change has no effect'], answer: 0,
          explain: 'A threshold is a point where the system <b>shifts significantly</b>: the same water, one small change, and it becomes ice.' },
        { type: 'fill', stem: 'Complete the sentence about the Amazon.', text: 'Scientists warn that if roughly {{0}}–{{1}}% of the Amazon is cleared, much of it could dry out and turn to savanna.',
          blanks: [{ num: 20, tol: 2, w: 4 }, { num: 25, tol: 2, w: 4 }], hint: 'About a fifth to a quarter.',
          explain: 'About <b>20–25%</b> (Lovejoy &amp; Nobre, 2018). Nobody knows the exact number, which is what makes it a tipping point.' },
        { type: 'mc', stem: 'Why are <b>tipping points</b> so hard to manage?', hint: 'What do we not know?',
          choices: ['Complex interactions make the exact threshold uncertain, so we may not know we are close until we pass it', 'They only happen in laboratories', 'They always happen at exactly 50% change', 'They can always be reversed overnight'], answer: 0,
          explain: 'The edge is real but <b>uncertain</b>. Because interactions are complex, the safe strategy is to stay well back from it.' },
        { type: 'match', stem: 'Match each idea to its real example from the chapter.', hint: 'One is about water, one about a forest, one about refrigerators.',
          pairs: [['Threshold', 'Water turning to ice at 32°F'], ['Tipping point', 'The Amazon turning to savanna after roughly 20–25% is cleared'], ['Leverage point', 'National energy-efficiency standards for refrigerators']],
          extra: ['Adding lanes to a freeway'],
          explain: 'Ice is a sharp, known <b>threshold</b>; the Amazon is an uncertain <b>tipping point</b>; efficiency standards are a <b>leverage point</b>.' },
      ] },

    { id: 'c12', sec: '10.2', title: 'Leverage Points', short: 'Small changes in the right place, large effects', slides: [[13, 'Thresholds, Tipping Points and Leverage Points'], [14, 'Loop Lab']],
      review: { html: `<p>A <b>leverage point</b> is a place in a system where a small change can produce large effects.</p><p>Example: national energy-efficiency standards. One rule sets how much electricity a new refrigerator may use. Today’s typical new refrigerator uses about <b>75% less energy</b> than a 1973 model while holding about <b>20% more</b> (U.S. Department of Energy). In the Loop Lab’s city, the standards act on the energy used by every appliance in every home, upstream of everything else on the map.</p>` },
      variants: [
        { type: 'mc', stem: 'What is a <b>leverage point</b>?', hint: 'Think of a long lever lifting a boulder.',
          choices: ['A place in a system where a small change can produce large effects', 'The point where a system collapses', 'The largest stock in a system', 'Any policy that costs a lot of money'], answer: 0,
          explain: 'A leverage point is where a <b>small change</b> produces <b>large effects</b>, like a small weight on the long end of a lever.' },
        { type: 'fill', stem: 'Complete the sentence about national refrigerator standards.', text: 'Today’s typical new refrigerator uses about {{0}}% less energy than a 1973 model, while holding about {{1}}% more.',
          blanks: [{ num: 75, tol: 5, w: 4 }, { num: 20, tol: 5, w: 4 }], hint: 'Three quarters less energy; one fifth more space.',
          explain: 'About <b>75% less energy</b> and about <b>20% more space</b> (U.S. Department of Energy). One rule changed every refrigerator sold, in every home, for decades.' },
        { type: 'mc', stem: 'In the Loop Lab’s city, why are national energy-efficiency standards the <b>leverage point</b>?', hint: 'Where on the map do they act?',
          choices: ['They act on the energy used by every appliance in every home, upstream of the rest of the system', 'They plant trees that absorb most of the city’s CO₂', 'They make air conditioners bigger', 'They raise the city’s population'], answer: 0,
          explain: 'Under the model’s assumptions, the standards cut <b>energy used per appliance</b> before the heat and air-conditioning loop amplifies demand, so one small rule moves the whole system.' },
      ] },

    /* ═════════ 10.3 ═════════ */
    { id: 'c13', sec: '10.3', title: 'Biogeochemical Cycles', short: 'Matter moving through living and nonliving Earth', slides: [[16, 'Biogeochemical Cycles'], [17, 'Explore Earth’s Biogeochemical Cycles']],
      review: { html: `<p><b>Biogeochemical cycles</b> describe the movement of matter through the living and nonliving parts of Earth: the same atoms, used again and again.</p><ul><li>Living: plants, animals, microbes. Nonliving: air, water, soil, rock.</li><li>Agriculture and fossil fuel combustion significantly impact biogeochemical cycles.</li></ul>` },
      variants: [
        { type: 'mc', stem: 'What do <b>biogeochemical cycles</b> describe?', hint: 'Bio (life), geo (Earth), chemical (matter).',
          choices: ['The movement of matter through the living and nonliving parts of Earth', 'The flow of sunlight through space', 'How weather changes from day to day', 'The life cycle of a single organism'], answer: 0,
          explain: 'They trace <b>matter</b> (carbon, nitrogen, phosphorus, water) as it moves between living things and air, water, soil and rock.' },
        { type: 'bins', stem: 'Sort each part of Earth: <b>living</b> or <b>nonliving</b>?', hint: 'The slide’s plate splits them into two layers.',
          bins: [{ name: 'Living', c: '#3f6f3a' }, { name: 'Nonliving', c: '#7a5a3a' }],
          items: [{ t: 'Plants', b: 0 }, { t: 'Animals', b: 0 }, { t: 'Microbes', b: 0 }, { t: 'Air', b: 1 }, { t: 'Water', b: 1 }, { t: 'Soil and rock', b: 1 }],
          explain: 'Cycles move atoms between the <b>living</b> layer (plants, animals, microbes) and the <b>nonliving</b> layer (air, water, soil, rock).' },
        { type: 'multi', stem: 'Which human activities does the chapter name as <b>significantly impacting</b> biogeochemical cycles? Select all that apply.', hint: 'One feeds us; one powers us.',
          choices: ['Agriculture', 'Fossil fuel combustion', 'Bird watching', 'Reading by lamplight'], answers: [0, 1],
          explain: '<b>Agriculture</b> (fertilizer, land clearing) and <b>fossil fuel combustion</b> both move large amounts of nitrogen, phosphorus and carbon faster than natural cycles do.' },
      ] },

    { id: 'c14', sec: '10.3', title: 'The Phosphorus Cycle', short: 'Slow, with no major gas phase', slides: [[18, 'Phosphorus: The Slow Cycle']],
      review: { html: `<ul><li>Phosphorus is a building block of life: it forms DNA, RNA, ATP/ADP (energy transport) and phospholipid cell membranes.</li><li>Unlike nitrogen, it has <b>no major gas phase</b>: it travels through the air only as dust.</li><li>Human uses: fertilizer, detergents and steel production. The flow of phosphorus to the oceans is roughly <b>three times</b> its pre-industrial level (Bennett, Carpenter &amp; Caraco, 2001).</li><li><b>Eutrophication</b>: excess phosphorus (and nitrogen) triggers algal blooms; the algae decompose; oxygen is depleted; dead zones harm fish.</li><li>Phosphate rock is a finite resource concentrated in a few countries, mostly Morocco and Western Sahara (USGS). Recovering phosphorus from runoff and wastewater can stretch it.</li></ul>` },
      variants: [
        { type: 'order', stem: 'Put the steps of <b>eutrophication</b> in order.', hint: 'Start with the nutrients washing in; end with the fish.',
          items: ['Excess phosphorus washes into a lake', 'Algae bloom', 'The algae die and decompose', 'Decomposers use up the oxygen', 'A dead zone harms fish'],
          explain: 'Nutrients feed an <b>algal bloom</b>; when the algae die, decomposers <b>use up the oxygen</b>, leaving a <b>dead zone</b>.' },
        { type: 'multi', stem: 'Which of these does phosphorus help build? Select all that apply.', hint: 'Genes, energy carriers and cell walls.',
          choices: ['DNA and RNA', 'ATP/ADP, which carry energy in cells', 'Phospholipid cell membranes', 'Most of the atmosphere', 'The ozone layer'], answers: [0, 1, 2],
          explain: 'Phosphorus is in <b>DNA, RNA, ATP/ADP and cell membranes</b>. It has no major gas phase, so it is not a large part of the air.' },
        { type: 'mc', stem: 'How does the phosphorus cycle differ from the nitrogen cycle?', hint: 'Look at the air.',
          choices: ['Phosphorus has no major gas phase; it travels through the air only as dust', 'Phosphorus makes up most of the atmosphere', 'Phosphorus cycles faster than any other element', 'Phosphorus is not needed by living things'], answer: 0,
          explain: 'Nitrogen gas is most of the air, but phosphorus has <b>no major gas phase</b>, so its cycle runs slowly through rock, soil, water and life.' },
        { type: 'fill', stem: 'Complete the sentence.', text: 'The flow of phosphorus to the oceans is roughly {{0}} times its pre-industrial level.',
          blanks: [{ num: 3, tol: 0.5, w: 3 }], hint: 'The slide shows it as a big number with a × sign.',
          explain: 'Roughly <b>3 times</b> (Bennett, Carpenter &amp; Caraco, 2001), mostly from fertilizer and detergents washing off the land.' },
      ] },

    /* ═════════ 10.4 ═════════ */
    { id: 'c15', sec: '10.4', title: 'The Nitrogen Cycle', short: 'Microbes move nitrogen in and out of the air', slides: [[21, 'The Nitrogen Cycle'], [22, 'Returning Nitrogen to the Air']],
      review: { html: `<p>Nitrogen is essential for DNA and proteins, but most of it is in the air as inert N₂ (about 78% of the atmosphere), which most organisms cannot use.</p><ol><li><b>Fixation</b>: bacteria (and lightning) convert N₂ into forms plants can absorb. <b>Rhizobium</b> bacteria in legume root nodules fix nitrogen and are fed plant sugar in return.</li><li><b>Ammonification</b>: bacteria and fungi break down nitrogen in waste and dead matter, releasing ammonium.</li><li><b>Nitrification</b>: soil bacteria convert ammonium into nitrite and then nitrate (NH₄⁺ → NO₂⁻ → NO₃⁻). Plants take up mostly nitrate and ammonium.</li><li><b>Denitrification</b>: microbes in waterlogged soil and underwater return nitrogen to the air as N₂.</li></ol>` },
      variants: [
        { type: 'diagram', stem: 'Label the nitrogen cycle: drag each process onto its numbered arrow.', hint: 'Arrow 1 brings nitrogen down from the air; arrow 4 returns it.',
          scene: N_SCENE, labels: ['Fixation', 'Ammonification', 'Nitrification', 'Denitrification'],
          slots: [{ x: 12.6, y: 42, ans: 0, hint: 'Arrow 1' }, { x: 61.8, y: 67, ans: 1, hint: 'Arrow 2' }, { x: 73.7, y: 75, ans: 2, hint: 'Arrow 3' }, { x: 92, y: 50, ans: 3, hint: 'Arrow 4' }],
          explain: '1 <b>Fixation</b> pulls N₂ from the air; 2 <b>Ammonification</b> releases ammonium from dead matter; 3 <b>Nitrification</b> turns ammonium into nitrate; 4 <b>Denitrification</b> returns N₂ to the air.' },
        { type: 'match', stem: 'Match each process to what it does.', hint: 'Fix, release, convert, return.',
          pairs: [['Nitrogen fixation', 'Converts N₂ from the air into forms plants can absorb'], ['Ammonification', 'Breaks down waste and dead matter, releasing ammonium'], ['Nitrification', 'Converts ammonium into nitrite and then nitrate'], ['Denitrification', 'Returns nitrogen to the air as N₂']],
          extra: ['Turns limestone into CO₂'],
          explain: 'Fixation brings nitrogen in, ammonification and nitrification move it through the soil, and denitrification returns it to the air.' },
        { type: 'order', stem: 'Follow one nitrogen atom through the cycle, starting in the air.', hint: 'Fix it, use it, release it, convert it, return it.',
          items: ['N₂ in the air is fixed by bacteria in a root nodule', 'The plant builds proteins with it', 'Decomposers release it as ammonium when the plant dies', 'Nitrifying bacteria turn the ammonium into nitrate', 'Denitrifying bacteria in waterlogged soil return it to the air as N₂'],
          explain: 'Fixation, use by life, <b>ammonification</b>, <b>nitrification</b>, then <b>denitrification</b> closes the cycle.' },
        { type: 'mc', stem: 'What do <b>Rhizobium</b> bacteria get from the legume plants they live in?', hint: 'It is a two-way trade.',
          choices: ['Sugar from the plant, in return for fixed nitrogen', 'Sunlight', 'Phosphorus from the plant’s leaves', 'Nothing; they are parasites'], answer: 0,
          explain: 'Rhizobium in legume <b>root nodules</b> fix nitrogen for the plant and are <b>fed plant sugar</b> in return.' },
      ] },

    { id: 'c16', sec: '10.4', title: 'Human Impacts on Nitrogen', short: 'Haber-Bosch, runoff and dead zones', slides: [[23, 'Too Much of a Good Thing'], [24, 'The Iceberg Model']],
      review: { html: `<ul><li>The <b>Haber-Bosch process</b> makes about 185 million metric tons of ammonia a year, roughly 500,000 tons a day; about 70% becomes fertilizer (IEA, 2021).</li><li>Crops take up only about <b>half</b> of the nitrogen applied; the rest is lost to water and air.</li><li>Nitrate from fertilizer and manure can seep into groundwater, especially in farming areas, and is a common well-water contaminant (EPA).</li><li>Excess nutrients (nitrogen and phosphorus) cause eutrophication and oxygen-depleted dead zones in rivers, bays and the Gulf of Mexico.</li></ul>` },
      variants: [
        { type: 'fill', stem: 'Complete the sentence about the Haber-Bosch process.', text: 'Haber-Bosch makes about {{0}} million metric tons of ammonia a year, and about {{1}}% of it becomes fertilizer.',
          blanks: [{ num: 185, tol: 15, w: 5 }, { num: 70, tol: 5, w: 4 }], hint: 'Roughly half a million tons a day.',
          explain: 'About <b>185 million metric tons</b> a year (roughly 500,000 tons a day), and about <b>70%</b> becomes fertilizer (IEA, 2021).' },
        { type: 'mc', stem: 'About what share of the nitrogen applied as fertilizer do crops actually take up?', hint: 'The rest is lost to water and air.',
          choices: ['About half', 'Nearly all of it', 'About a tenth', 'None; plants cannot use fertilizer nitrogen'], answer: 0,
          explain: 'Crops take up only about <b>half</b>. The rest washes into water or escapes to the air, which is how fertilizer feeds dead zones downstream.' },
        { type: 'mc', stem: 'Where is nitrate from fertilizer and manure most likely to contaminate drinking water?', hint: 'It seeps down through the soil.',
          choices: ['Groundwater wells, especially in farming areas', 'Rainwater in cities', 'Ocean water far from land', 'Bottled water'], answer: 0,
          explain: 'Nitrate can seep into <b>groundwater</b>, and it is a common <b>well-water</b> contaminant in farming areas (EPA).' },
        { type: 'mc', stem: 'Why does a dead zone appear in the Gulf of Mexico each summer?', hint: 'Follow the rivers downstream.',
          choices: ['Rivers carry excess fertilizer nutrients from the Mississippi basin, feeding algae that use up the oxygen as they decompose', 'The water is too salty for fish', 'Oil spills happen every summer', 'Hurricanes push fish out to sea'], answer: 0,
          explain: 'Fertilizer-heavy farming across the <b>Mississippi River basin</b> sends nitrogen and phosphorus to the Gulf, where <b>eutrophication</b> depletes the oxygen.' },
      ] },

    /* ═════════ 10.5 ═════════ */
    { id: 'c17', sec: '10.5', title: 'The Carbon Cycle', short: 'Fast and slow loops, and where carbon is stored', slides: [[19, 'The Carbon Cycle']],
      review: { html: `<ul><li>All life on Earth is carbon-based. Photosynthesis pulls CO₂ from the atmosphere; respiration and decomposition return it. The ocean takes in and gives off CO₂.</li><li>Carbon also moves slowly: shells sink and become limestone, and volcanoes return carbon to the air over millions of years.</li><li>Where it is stored (gigatonnes of carbon, rounded): rocks about 66,000,000; ocean about 38,000; fossil fuel deposits about 4,000; soils (top 1 m) about 1,500; atmosphere about 870; plants about 550 (IPCC AR6 WG1 Ch. 5; Global Carbon Project).</li></ul>` },
      variants: [
        { type: 'diagram', stem: 'Label the natural carbon cycle: drag each process onto its numbered arrow.', hint: 'Green goes into plants; red comes out. The blue pair is the sea surface.',
          scene: C_SCENE, labels: ['Photosynthesis', 'Respiration and decay', 'The ocean takes in and gives off CO₂', 'Shells sink and become limestone', 'Volcanoes return carbon to the air'],
          slots: [{ x: 32, y: 20, ans: 0, hint: 'Arrow 1' }, { x: 46.3, y: 20.5, ans: 1, hint: 'Arrow 2' }, { x: 81.6, y: 32.6, ans: 2, hint: 'Arrow 3' }, { x: 89, y: 74, ans: 3, hint: 'Arrow 4' }, { x: 19.7, y: 15.8, ans: 4, hint: 'Arrow 5' }],
          explain: '1 <b>Photosynthesis</b> and 2 <b>respiration and decay</b> are the fast loop on land; 3 is the <b>ocean exchange</b>; 4 <b>shells becoming limestone</b> and 5 <b>volcanoes</b> are the slow loop, over millions of years.' },
        { type: 'order', stem: 'Rank Earth’s carbon reservoirs from the <b>most</b> carbon to the <b>least</b>.', hint: 'Rock beats everything else by far; living plants hold the least.',
          items: ['Rocks (limestone and other carbonate rock)', 'Ocean', 'Fossil fuel deposits', 'Soils', 'Atmosphere', 'Plants'],
          explain: 'Rocks about <b>66,000,000</b> GtC, ocean <b>38,000</b>, fossil fuels <b>4,000</b>, soils <b>1,500</b>, atmosphere <b>870</b>, plants <b>550</b> (IPCC AR6; Global Carbon Project).' },
        { type: 'mc', stem: 'Which process returns carbon from living things to the air?', hint: 'It is the reverse of photosynthesis.',
          choices: ['Respiration and decomposition', 'Photosynthesis', 'Shells sinking to the sea floor', 'Limestone forming'], answer: 0,
          explain: 'Photosynthesis pulls CO₂ <b>out</b> of the air; <b>respiration and decomposition</b> return it.' },
        { type: 'mc', stem: 'Which pair moves carbon through the <b>slow</b> loop, over millions of years?', hint: 'Think of rock.',
          choices: ['Shells sinking to become limestone, and volcanoes returning carbon to the air', 'Photosynthesis and respiration', 'Leaves falling and decaying in autumn', 'Daily ocean tides'], answer: 0,
          explain: 'Shells sink and become <b>limestone</b>; <b>volcanoes</b> eventually return the carbon. That loop takes millions of years.' },
      ] },

    { id: 'c18', sec: '10.5', title: 'Carbon Disruption', short: 'Fossil fuels, cement, land use and the ocean', slides: [[19, 'The Carbon Cycle (pop-up: Carbon Disruption)'], [20, 'Atmospheric CO₂ Concentration Over the Long Term'], [28, 'Key Concepts: Cycles']],
      review: { html: `<ul><li><b>Fossil-fuel combustion</b> extracts carbon locked underground for millions of years and releases it into the atmosphere; it is the primary driver of climate change.</li><li><b>Calcination (cement)</b> turns limestone into calcium oxide and CO₂. The reaction alone releases about as much CO₂ as 4% of fossil-fuel emissions (Andrew, 2019); counting kiln fuel, cement is about 7% (IEA).</li><li><b>Land-use change</b>: deforestation removes trees that draw CO₂ from the atmosphere.</li><li><b>Ocean acidification</b>: CO₂ that dissolves in seawater forms carbonic acid, making the ocean more acidic and harder for shellfish and corals to build their shells.</li><li>Atmospheric CO₂ has spiked far above its natural range since industrialization (Our World in Data), reaching about 426 ppm in 2025.</li></ul>`, fig: 'co2', figcap: 'Atmospheric CO₂ over the last 800,000 years (ice cores and modern measurements, via Our World in Data)' },
      variants: [
        { type: 'match', stem: 'Match each human disruption of the carbon cycle to what it does.', hint: 'Burning, heating limestone, clearing land, dissolving.',
          pairs: [['Fossil-fuel combustion', 'Releases carbon locked underground for millions of years'], ['Calcination (cement)', 'Turns limestone into calcium oxide and CO₂'], ['Land-use change', 'Removes trees that draw CO₂ from the air'], ['Ocean acidification', 'Dissolved CO₂ forms carbonic acid in seawater']],
          extra: ['Returns nitrogen to the air as N₂'],
          explain: 'Each moves carbon faster than the natural cycle: <b>burning</b> old carbon, <b>heating limestone</b>, <b>clearing forests</b>, and CO₂ <b>dissolving</b> into the sea.' },
        { type: 'mc', stem: 'What makes the ocean more acidic as atmospheric CO₂ rises?', hint: 'Start with CO₂ entering seawater.',
          choices: ['CO₂ dissolves in seawater and forms carbonic acid', 'Limestone dissolves into carbonic acid', 'Fertilizer runoff adds acid to the open ocean', 'Warmer water releases acid from fish'], answer: 0,
          explain: 'Dissolved <b>CO₂ forms carbonic acid</b>. Dissolving carbonate rock actually <b>buffers</b> the change slowly; it is not the source of the acid.' },
        { type: 'mc', stem: 'Heating limestone to make cement releases CO₂. How large is the chemical reaction alone, compared with fossil-fuel emissions?', hint: 'A few percent.',
          choices: ['About 4% as much as fossil fuels', 'About half as much', 'More than fossil fuels', 'Less than 0.01%'], answer: 0,
          explain: 'The reaction alone releases about <b>4%</b> as much CO₂ as fossil fuels (Andrew, 2019). Counting the fuel burned in kilns, cement is about <b>7%</b> (IEA).' },
        { type: 'slider', viz: 'ppm', label: 'CO₂ (ppm)', stem: 'The modern spike is hidden. Drag the red line to the CO₂ level the air reached in <b>2025</b>.', min: 150, max: 450, step: 1, start: 250, answer: 426, tol: 8, unit: 'ppm',
          hint: 'Far above the dashed line, the highest natural level.', explain: 'About <b>426 ppm</b> in 2025, far above the natural range of the last 800,000 years. That is the spike the slide’s chart shows since industrialization.' },
      ] },

    /* ═════════ 10.6 ═════════ */
    { id: 'c19', sec: '10.6', title: 'The Iceberg Model', short: 'Events, patterns, structures, mental models', slides: [[24, 'The Iceberg Model']],
      review: { html: `<p>Think beyond events. The deeper the level, the more of the system it explains, and the more leverage a change there has.</p><ul><li><b>Events</b>: what happened? A dead zone appears in the Gulf of Mexico.</li><li><b>Patterns</b>: what keeps happening? It returns every summer, larger in years when more river water and nutrients arrive.</li><li><b>Structures</b>: what causes the pattern? Fertilizer-heavy farming across the Mississippi River basin; rivers carry the extra nitrogen to the Gulf.</li><li><b>Mental models</b>: what beliefs hold it in place? “Extra fertilizer is cheap insurance for a big harvest. What washes downstream is someone else’s problem.”</li></ul>` },
      variants: [
        { type: 'order', stem: 'Order the levels of the iceberg model from the <b>top</b> (most visible) to the <b>bottom</b> (deepest).', hint: 'What you see first sits above the water.',
          items: ['Events', 'Patterns', 'Structures', 'Mental models'],
          explain: '<b>Events</b> sit above the water; <b>patterns</b>, <b>structures</b> and <b>mental models</b> lie progressively deeper, and each explains more of the system.' },
        { type: 'bins', stem: 'Sort each statement about the Gulf of Mexico dead zone (and about rush hour) into its level of the iceberg.', hint: 'Event: one happening. Pattern: it repeats. Structure: what causes it. Mental model: a belief.',
          bins: [{ name: 'Event', c: '#2f5f84' }, { name: 'Pattern', c: '#3f6f8f' }, { name: 'Structure', c: '#8a6a2f' }, { name: 'Mental model', c: '#6b5a8e' }],
          items: [{ t: 'A dead zone appears in the Gulf this summer.', b: 0 }, { t: 'It returns every summer, larger in wet years.', b: 1 }, { t: 'Fertilizer-heavy farming across the Mississippi basin sends nitrogen downstream.', b: 2 }, { t: '“Extra fertilizer is cheap insurance; what washes downstream is someone else’s problem.”', b: 3 },
                  { t: 'The freeway jammed this evening.', b: 0 }, { t: 'It jams every weekday at 5 PM.', b: 1 }, { t: 'Homes are far from jobs, with few transit options.', b: 2 }, { t: '“Driving is the only real way to get around.”', b: 3 }],
          explain: 'Each example runs from a single <b>event</b>, to a repeating <b>pattern</b>, to the <b>structure</b> that produces it, to the <b>mental model</b> that keeps that structure in place.' },
        { type: 'mc', stem: 'According to the iceberg model, where does a change usually have the <b>most leverage</b>?', hint: 'Look at the arrow beside the iceberg.',
          choices: ['At the deeper levels: structures and mental models', 'At the level of single events', 'It makes no difference which level', 'Only at the level of patterns'], answer: 0,
          explain: 'The deeper the level, the more of the system it explains, and the <b>more leverage</b> a change there has. Reacting to events alone treats symptoms.' },
      ] },

    { id: 'c20', sec: '10.6', title: 'Systems at Work', short: 'Loops in business, engineering, medicine and nature', slides: [[25, 'Systems at Work'], [26, 'Everything Is Interconnected']], lead: 'loop',
      review: { html: `<ul><li><b>Business</b>: in March 2020 toilet paper vanished from U.S. stores. Home use jumped about 40% and office rolls could not go to stores; empty shelves sparked panic buying, which emptied shelves further (AP, April 2020).</li><li><b>Engineering</b>: on August 14, 2003, a power line in Ohio sagged into a tree and shut off; its load overloaded nearby lines, which shut off too, and about an hour later 50 million people lost power (U.S.–Canada Task Force, 2004).</li><li><b>Medicine</b>: most bedside alarm signals need no action, so staff start tuning them out and real emergencies get missed (The Joint Commission, 2013).</li><li><b>Nature</b>: wolves returned to Yellowstone in 1995; elk stopped lingering by streams and willows grew back, though how big the wolves’ role was is still debated (Ripple &amp; Beschta, 2012; National Park Service).</li></ul>` },
      variants: [
        { type: 'loop', stem: 'In March 2020, toilet paper vanished from U.S. stores. <b>Build the feedback loop</b> that connects <b>empty store shelves</b> and <b>panic buying</b>, then decide whether the loop is reinforcing or balancing.',
          hint: 'What do shoppers do when they see empty shelves?',
          pieces: { home: 'People working from home', use: 'Home toilet paper use', empty: 'Empty store shelves', panic: 'Panic buying', fact: 'Factory supply to stores', towel: 'Paper towel color' },
          links: [['home', 'use', '+'], ['use', 'empty', '+'], ['empty', 'panic', '+'], ['panic', 'empty', '+'], ['fact', 'empty', '-']],
          goal: { must: ['empty', 'panic'], kind: 'R' }, sol: ['empty', 'panic'],
          explain: 'Empty shelves <b>+</b> Panic buying <b>+</b> Empty shelves. No minus signs: a <b>reinforcing</b> loop. Working from home started the push; panic buying amplified it.' },
        { type: 'loop', stem: 'On August 14, 2003, one power line in Ohio sagged into a tree and shut off. <b>Build the feedback loop</b> that connects <b>lines shutting off</b> and the <b>load on the remaining lines</b>, then decide whether the loop is reinforcing or balancing.',
          hint: 'Where does the electricity go when one line shuts off?',
          pieces: { fail: 'Power lines shut off', load: 'Load on the remaining lines', tree: 'Trees touching lines', dark: 'People without power', speed: 'Highway speed limits' },
          links: [['fail', 'load', '+'], ['load', 'fail', '+'], ['tree', 'fail', '+'], ['fail', 'dark', '+']],
          goal: { must: ['fail', 'load'], kind: 'R' }, sol: ['fail', 'load'],
          explain: 'Lines shut off <b>+</b> Load on the remaining lines <b>+</b> Lines shut off. A <b>reinforcing</b> loop: each failure overloaded the next, until about 50 million people lost power.' },
        { type: 'loop', stem: 'Hospitals added more and more bedside alarms. <b>Build the feedback loop</b> that connects the <b>number of alarms</b> and <b>missed emergencies</b>, then decide whether the loop is reinforcing or balancing.',
          hint: 'Most alarm signals need no action. What do staff start to do, and how do hospitals respond to a missed emergency?',
          pieces: { alarms: 'Number of bedside alarms', tune: 'Staff tuning alarms out', missed: 'Missed emergencies', safe: 'Patient safety', menu: 'Cafeteria hours' },
          links: [['alarms', 'tune', '+'], ['tune', 'missed', '+'], ['missed', 'alarms', '+'], ['missed', 'safe', '-']],
          goal: { must: ['alarms', 'missed'], kind: 'R' }, sol: ['alarms', 'tune', 'missed'],
          explain: 'Alarms <b>+</b> Tuning out <b>+</b> Missed emergencies <b>+</b> Alarms. A <b>reinforcing</b> loop: more safety alarms made patients less safe (The Joint Commission, 2013).' },
        { type: 'loop', stem: 'Wolves returned to Yellowstone in 1995. <b>Build the feedback loop</b> that connects <b>wolves</b> and <b>elk</b>, then decide whether the loop is reinforcing or balancing.',
          hint: 'Wolves eat elk. What does a smaller elk herd mean for the wolves?',
          pieces: { wolves: 'Wolves', elk: 'Elk', willow: 'Willows along streams', beaver: 'Beavers', geyser: 'Geyser eruptions' },
          links: [['wolves', 'elk', '-'], ['elk', 'wolves', '+'], ['elk', 'willow', '-'], ['willow', 'beaver', '+']],
          goal: { must: ['wolves', 'elk'], kind: 'B' }, sol: ['wolves', 'elk'],
          explain: 'Wolves <b>−</b> Elk <b>+</b> Wolves. One minus sign makes it <b>balancing</b>: fewer elk to hunt keeps the number of wolves in check. The willows and beavers sit downstream of the loop.' },
        { type: 'mc', stem: 'Hospital alarms: what did the chapter say about most alarm signals?', hint: 'Not the same as “false.”',
          choices: ['Most do not require any clinical action', 'Most are caused by broken equipment', 'Most signal real emergencies', 'Most are turned off by patients'], answer: 0,
          explain: 'Most alarm signals <b>need no action</b>, so staff tune them out, and the real emergencies get missed (The Joint Commission, 2013).' },
      ] },
  ];

  window.MB_CHAPTERS = window.MB_CHAPTERS || {};
  window.MB_CHAPTERS.ch10 = {
    id: 'ch10', num: 10, roman: 'X',
    title: 'Systems and Cycles', subtitle: 'Are We Harming Earth’s Life-Support System?',
    deck: 'https://ryanpcornell.github.io/sos110-chapter-10/',
    sections: [
      { id: '10.1', title: 'What Are Systems?', c: S['10.1'] },
      { id: '10.2', title: 'How Can We Show How a System Works?', c: S['10.2'] },
      { id: '10.3', title: 'How Do Earth’s Life-Support Systems Work?', c: S['10.3'] },
      { id: '10.4', title: 'How Do Living Things Change the Nitrogen Cycle?', c: S['10.4'] },
      { id: '10.5', title: 'How Are We Changing Earth’s Carbon Cycle?', c: S['10.5'] },
      { id: '10.6', title: 'What Can I Do?', c: S['10.6'] },
    ],
    concepts,
  };
})();
