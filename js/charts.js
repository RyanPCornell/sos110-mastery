/* SOS 110 Mastery: hand-drawn SVG charts (ink line, watercolor wash, a little pen wobble), built from the
   same data as the Chapter 11 deck. Every chart returns {svg, f, hit} so the "pick" questions can turn a click
   into a data point. */
const CH = (function () {
  const D = window.CH11_DATA;
  const INK = '#3b3222', RED = '#a8483f', NAVY = '#2c3c50', SEA = '#4f7488', GOLD = '#8a6a2f', GRN = '#2f7a40';
  const STRIPES = ['#2f4a66', '#3f5d7b', '#587793', '#7f97ad', '#b3c0c8', '#dcd5cb', '#d6b29a', '#c58b72', '#aa6553', '#86433d'];
  let uid = 0;
  const id = p => p + (++uid);
  const r1 = v => Math.round(v * 10) / 10;

  function mix(a, b, t) {
    const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((x, i) => Math.round(x + (pb[i] - x) * t).toString(16).padStart(2, '0')).join('');
  }
  function stripe(t) { t = Math.max(0, Math.min(1, t)) * (STRIPES.length - 1); const i = Math.min(Math.floor(t), STRIPES.length - 2); return mix(STRIPES[i], STRIPES[i + 1], t - i); }

  // a frame maps data to SVG coordinates
  function frame(o) {
    const f = { W: o.W, H: o.H, l: o.l, r: o.W - o.r, t: o.t, b: o.H - o.b, x0: o.x[0], x1: o.x[1], y0: o.y[0], y1: o.y[1] };
    f.X = v => f.l + (f.r - f.l) * (v - f.x0) / (f.x1 - f.x0);
    f.Y = v => f.b - (f.b - f.t) * (v - f.y0) / (f.y1 - f.y0);
    f.ix = x => f.x0 + (x - f.l) / (f.r - f.l) * (f.x1 - f.x0);
    f.iy = y => f.y0 + (f.b - y) / (f.b - f.t) * (f.y1 - f.y0);
    return f;
  }
  function defs(p) {
    return `<defs><filter id="${p}N" filterUnits="userSpaceOnUse" x="-20" y="-20" width="1200" height="700"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="2"/></filter>`
      + `<filter id="${p}W" x="-4%" y="-6%" width="108%" height="112%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="9"/><feDisplacementMap in="SourceGraphic" scale="2.4"/></filter>`
      + `<pattern id="${p}H" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><path d="M0 0V6" stroke="#fff" stroke-width="1" opacity=".28"/></pattern></defs>`;
  }
  const T = (x, y, s, cls, a) => `<text class="${cls}" x="${r1(x)}" y="${r1(y)}" text-anchor="${a || 'start'}">${s}</text>`;
  const path = (pts, f) => pts.map((p, i) => (i ? 'L' : 'M') + r1(f.X(p[0])) + ',' + r1(f.Y(p[1]))).join('');
  function grid(f, ys, fmt, unit) {
    let s = '';
    ys.forEach(v => { s += `<path class="ch-grid" d="M${f.l} ${r1(f.Y(v))}H${f.r}"/>` + T(f.l - 8, f.Y(v) + 4, fmt ? fmt(v) : v, 'ch-tick', 'end'); });
    if (unit) s += T(f.l - 8, f.t - 10, unit, 'ch-tick', 'end');
    return s;
  }
  function xaxis(f, xs, fmt) {
    let s = `<path class="ch-axis" d="M${f.l} ${f.b}H${f.r}"/>`;
    xs.forEach(v => { s += `<path d="M${r1(f.X(v))} ${f.b}v5" stroke="${INK}" stroke-width="1.1"/>` + T(f.X(v), f.b + 19, fmt ? fmt(v) : v, 'ch-tick', 'middle'); });
    return s;
  }
  const wrap = (f, p, body, label) => `<svg viewBox="0 0 ${f.W} ${f.H}" role="img" aria-label="${label}">${defs(p)}${body}</svg>`;
  // nearest item by x
  function nearest(arr, x, key) { let best = null, bd = Infinity; arr.forEach(p => { const d = Math.abs((key ? key(p) : p[0]) - x); if (d < bd) { bd = d; best = p; } }); return best; }

  /* ── CO2 over 800,000 years ── */
  function co2(o) {
    o = o || {};
    const p = id('co'), f = frame({ W: 640, H: 360, l: 54, r: 22, t: 34, b: 46, x: [D.co2[0][0], 2025], y: [150, 450] });
    const ice = D.co2.filter(q => q[0] < 1750), mod = D.co2.filter(q => q[0] >= 1750);
    const hi = ice.reduce((a, q) => q[1] > a[1] ? q : a), now = D.co2[D.co2.length - 1];
    let s = grid(f, [200, 300, 400], null, 'ppm');
    const ln = path(ice, f);
    s += `<path d="${ln}L${r1(f.X(ice[ice.length - 1][0]))},${f.b}L${r1(f.X(ice[0][0]))},${f.b}Z" fill="#b3c0c8" opacity=".5"/>`;
    s += `<path d="${ln}" fill="none" stroke="#3f5d7b" stroke-width="1.6" stroke-linejoin="round" filter="url(#${p}N)"/>`;
    if (!o.hideModern) {
      s += `<path d="M${r1(f.X(mod[0][0]))} ${r1(f.Y(mod[0][1]))}V${r1(f.Y(now[1]))}" stroke="${RED}" stroke-width="4" stroke-linecap="round" filter="url(#${p}N)"/>`;
      s += `<circle cx="${r1(f.X(now[0]))}" cy="${r1(f.Y(now[1]))}" r="5" fill="${RED}" stroke="#fffdf6" stroke-width="2"/>` + T(f.X(now[0]) - 12, f.Y(now[1]) + 5, `${now[0]}: ${Math.round(now[1])} ppm`, 'ch-big', 'end');
    } else {
      s += `<path d="M${r1(f.X(2025))} ${f.t + 4}V${f.b}" stroke="${RED}" stroke-width="1.4" stroke-dasharray="4 4"/>` + T(f.X(2025) - 6, f.t + 14, 'today: ?', 'ch-big', 'end');
    }
    if (!o.hideCeiling) {
      s += `<path d="M${f.l} ${r1(f.Y(hi[1]))}H${f.r}" stroke="#86433d" stroke-width="1.4" stroke-dasharray="6 5"/>` + T(f.l + 6, f.Y(hi[1]) - 8, `Highest level in the ice-core record: ${Math.round(hi[1])} ppm`, 'ch-ann');
    }
    s += xaxis(f, [-800000, -600000, -400000, -200000, 2025], v => v > 0 ? 'today' : (-v).toLocaleString());
    s += T((f.l + f.r) / 2, f.H - 6, 'years ago', 'ch-lab', 'middle');
    return {
      svg: wrap(f, p, s, 'Atmospheric carbon dioxide over the last 800,000 years'), f,
      hit: (x) => { const yr = f.ix(x); const q = nearest(D.co2, yr); return { x: q[0], y: q[1], label: (q[0] < 0 ? Math.round(-q[0] / 1000).toLocaleString() + ',000 years ago' : q[0]) + ': ' + Math.round(q[1]) + ' ppm' }; },
      mark: (t) => ({ x: f.X(t.x), y: f.Y(t.y) }),
    };
  }

  /* ── yearly fossil CO2 emissions ── */
  function emis() {
    const p = id('em'), f = frame({ W: 640, H: 340, l: 50, r: 22, t: 30, b: 42, x: [1750, 2024], y: [0, 42] });
    let s = grid(f, [10, 20, 30, 40], null, 'billion t');
    const ln = path(D.emis, f);
    s += `<path d="${ln}L${f.r},${f.b}L${f.l},${f.b}Z" fill="#c58b72" opacity=".42"/>`;
    s += `<path d="${ln}" fill="none" stroke="#86433d" stroke-width="2.3" stroke-linejoin="round" filter="url(#${p}N)"/>`;
    s += xaxis(f, [1750, 1800, 1850, 1900, 1950, 2000]);
    return { svg: wrap(f, p, s, 'Yearly carbon dioxide emissions from fossil fuels and industry, 1750 to 2024'), f,
      hit: x => { const q = nearest(D.emis, f.ix(x)); return { x: q[0], y: q[1], label: q[0] + ': ' + q[1].toFixed(1) + ' billion t' }; },
      mark: t => ({ x: f.X(t.x), y: f.Y(t.y) }) };
  }

  /* ── temperature anomaly bars ── */
  function temp(o) {
    o = o || {};
    const p = id('tp'), d = D.temp, f = frame({ W: 700, H: 340, l: 58, r: 20, t: 26, b: 40, x: [d[0][0] - .5, d[d.length - 1][0] + .5], y: [-0.5, 1.75] });
    const vmin = Math.min(...d.map(q => q[1])), vmax = Math.max(...d.map(q => q[1])), bw = (f.r - f.l) / d.length;
    let s = grid(f, [-0.5, 0.5, 1, 1.5], v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '°');
    d.forEach(q => { const y = f.Y(Math.max(q[1], 0)), h = Math.abs(f.Y(q[1]) - f.Y(0)); s += `<rect x="${r1(f.X(q[0]) - bw * .38)}" y="${r1(y)}" width="${r1(bw * .76)}" height="${r1(Math.max(h, .6))}" fill="${stripe((q[1] - vmin) / (vmax - vmin))}"/>`; });
    s += `<path d="M${f.l} ${r1(f.Y(0))}H${f.r}" stroke="${INK}" stroke-width="1.4"/>` + T(f.l + 4, f.Y(0) + 15, '1861–1890 average', 'ch-ann');
    if (!o.noParis) s += `<path d="M${f.l} ${r1(f.Y(1.5))}H${f.r}" stroke="#86433d" stroke-width="1.3" stroke-dasharray="7 5"/>` + T(f.l + 4, f.Y(1.5) - 6, '1.5 °C', 'ch-ann');
    s += xaxis(f, [1850, 1875, 1900, 1925, 1950, 1975, 2000, 2025]);
    return { svg: wrap(f, p, s, 'Global average temperature each year, 1850 to 2025, compared with 1861 to 1890'), f,
      hit: x => { const q = nearest(d, f.ix(x)); return { x: q[0], y: q[1], label: q[0] + ': ' + (q[1] >= 0 ? '+' : '−') + Math.abs(q[1]).toFixed(2) + ' °C' }; },
      mark: t => ({ x: f.X(t.x), y: f.Y(Math.max(t.y, 0)) - 2 }) };
  }

  /* ── Maricopa County heat deaths ── */
  function phx() {
    const p = id('px'), d = D.phx, f = frame({ W: 640, H: 330, l: 50, r: 16, t: 26, b: 38, x: [d[0][0] - .5, d[d.length - 1][0] + .5], y: [0, 700] });
    const bw = (f.r - f.l) / d.length;
    let s = grid(f, [200, 400, 600], null, 'deaths');
    d.forEach(q => { s += `<rect x="${r1(f.X(q[0]) - bw * .33)}" y="${r1(f.Y(q[1]))}" width="${r1(bw * .66)}" height="${r1(f.b - f.Y(q[1]))}" rx="2" fill="#b3c0c8" filter="url(#${p}W)"/>`; });
    s += `<path class="ch-axis" d="M${f.l} ${f.b}H${f.r}"/>`;
    d.forEach(q => { s += T(f.X(q[0]), f.b + 18, q[0] === d[0][0] || q[0] === d[d.length - 1][0] ? q[0] : "'" + String(q[0]).slice(2), 'ch-tick', 'middle'); });
    return { svg: wrap(f, p, s, 'Heat-related deaths in Maricopa County each year, 2014 to 2025'), f,
      hit: x => { const q = nearest(d, f.ix(x)); return { x: q[0], y: q[1], label: q[0] + ': ' + q[1] + ' deaths' }; },
      mark: t => ({ x: f.X(t.x), y: f.Y(t.y) }) };
  }

  /* ── 485 million years of global temperature (PhanDA) ── */
  function phanda() {
    const p = id('pd'), d = D.phanda.slice().sort((a, b) => b[0] - a[0]), f = frame({ W: 660, H: 340, l: 50, r: 20, t: 26, b: 44, x: [-485, 0], y: [8, 42] });
    const pts = d.map(q => [-q[0], q[2]]), band = d.map(q => [-q[0], q[3]]).concat(d.slice().reverse().map(q => [-q[0], q[1]]));
    let s = grid(f, [10, 20, 30, 40], v => v + '°', '°C');
    s += `<path d="${path(band, f)}Z" fill="#c58b72" opacity=".28"/>`;
    s += `<path d="${path(pts, f)}" fill="none" stroke="#86433d" stroke-width="2.2" stroke-linejoin="round" filter="url(#${p}N)"/>`;
    s += xaxis(f, [-400, -300, -200, -100, 0], v => v ? (-v) + ' Myr' : 'today');
    s += T((f.l + f.r) / 2, f.H - 6, 'millions of years ago', 'ch-lab', 'middle');
    return { svg: wrap(f, p, s, 'Global average surface temperature over the last 485 million years'), f,
      hit: x => { const q = nearest(d, -f.ix(x)); return { x: -q[0], y: q[2], age: q[0], label: (q[0] < 1 ? Math.round(q[0] * 1000) + ' thousand years ago' : Math.round(q[0]) + ' million years ago') + ': about ' + Math.round(q[2]) + ' °C' }; },
      mark: t => ({ x: f.X(t.x), y: f.Y(t.y) }) };
  }

  /* ── seawater pH at Station ALOHA ── */
  function ph() {
    const p = id('ph'), f = frame({ W: 660, H: 320, l: 54, r: 18, t: 22, b: 40, x: [1988.5, 2025.5], y: [8.0, 8.16] });
    let s = grid(f, [8.04, 8.08, 8.12, 8.16], v => v.toFixed(2), 'pH');
    D.phPts.forEach(q => { s += `<circle cx="${r1(f.X(q[0]))}" cy="${r1(f.Y(q[1]))}" r="2.4" fill="#7f97ad" opacity=".55"/>`; });
    s += `<path d="${path(D.phAvg, f)}" fill="none" stroke="${RED}" stroke-width="3" stroke-linejoin="round" filter="url(#${p}N)"/>`;
    s += xaxis(f, [1990, 2000, 2010, 2020]);
    return { svg: wrap(f, p, s, 'Surface seawater pH at Station ALOHA, 1989 to 2024'), f };
  }

  /* ── donut: share of the extra heat by gas ── */
  const GASES = [['Carbon dioxide (CO₂)', 66, '#86433d'], ['Methane (CH₄)', 16, '#c58b72'], ['Halocarbons', 12, '#7f97ad'], ['Nitrous oxide (N₂O)', 6, '#d6b29a']];
  function donut(o) {
    o = o || {};
    const p = id('dn'), W = 600, H = 300, cx = 160, cy = 150, R = 120, r = 70;
    let a0 = -Math.PI / 2, s = '';
    const segs = GASES.map(g => { const a1 = a0 + g[1] / 100 * Math.PI * 2, seg = { name: g[0], v: g[1], c: g[2], a0, a1 }; a0 = a1; return seg; });
    const arc = (sg) => { const L = sg.a1 - sg.a0 > Math.PI ? 1 : 0, P = (a, rr) => [cx + rr * Math.cos(a), cy + rr * Math.sin(a)].map(r1).join(',');
      return `M${P(sg.a0, R)}A${R},${R} 0 ${L} 1 ${P(sg.a1, R)}L${P(sg.a1, r)}A${r},${r} 0 ${L} 0 ${P(sg.a0, r)}Z`; };
    segs.forEach((sg, i) => { s += `<path d="${arc(sg)}" fill="${sg.c}" stroke="#fffdf6" stroke-width="2" data-seg="${i}"/>`; });
    s += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" style="font:900 22px Merriweather,serif;fill:${INK}">3.54</text><text x="${cx}" y="${cy + 16}" text-anchor="middle" class="ch-tick">W/m² of extra heat</text>`;
    segs.forEach((sg, i) => { const y = 70 + i * 48; s += `<rect x="320" y="${y - 12}" width="16" height="16" rx="3" fill="${sg.c}"/>` + T(346, y + 1, sg.name, 'ch-lab') + (o.hideValues ? '' : T(346, y + 19, sg.v + '% of the extra heat', 'ch-tick')); });
    return { svg: `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Donut chart of the extra heat trapped by each greenhouse gas">${defs(p)}${s}</svg>`, f: null, segs,
      hitXY: (x, y) => { const dx = x - cx, dy = y - cy, rr = Math.hypot(dx, dy); if (rr < r - 4 || rr > R + 6) return null; let a = Math.atan2(dy, dx); if (a < -Math.PI / 2) a += Math.PI * 2;
        const i = segs.findIndex(sg => a >= sg.a0 && a < sg.a1); return i < 0 ? null : { i, label: segs[i].name + (o.hideValues ? '' : ': ' + segs[i].v + '%') }; } };
  }

  /* ── small multiples for the resources panel ── */
  function mini(kind) {
    if (kind === 'co2') return co2().svg;
    if (kind === 'temp') return temp().svg;
    if (kind === 'emis') return emis().svg;
    if (kind === 'phx') return phx().svg;
    if (kind === 'phanda') return phanda().svg;
    if (kind === 'ph') return ph().svg;
    if (kind === 'donut') return donut().svg;
    return '';
  }

  return { D, STRIPES, stripe, mix, frame, defs, T, path, grid, xaxis, co2, emis, temp, phx, phanda, ph, donut, GASES, mini, id, r1 };
})();
