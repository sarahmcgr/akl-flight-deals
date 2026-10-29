// HTML for the dashboard and the deal email. Visual style: "Slush" sticker-book
// (pastel paper bands, black 1px outlines, pill controls, six-colour sticker palette, no shadows or gradients).

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nzd = (n) => `NZ$${Number(n).toLocaleString("en-NZ")}`;
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-NZ", { day: "numeric", month: "short" }) : "";
const stopsText = (n) => (n === 0 ? "Direct" : `${n} stop${n > 1 ? "s" : ""}`);
// Google Flights search with route and dates filled in; it lists airline-direct booking options
const searchLink = (r) => `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from Auckland to ${r.city} on ${r.departDate} through ${r.returnDate}`)}&curr=NZD&hl=en-NZ`;

// Airlines that commonly show up on Auckland routes (IATA code → booking site)
const AIRLINES = {
  NZ: ["Air New Zealand", "https://www.airnewzealand.co.nz"], JQ: ["Jetstar", "https://www.jetstar.com/nz/en"],
  QF: ["Qantas", "https://www.qantas.com/nz/en"], VA: ["Virgin Australia", "https://www.virginaustralia.com/nz/en"],
  FJ: ["Fiji Airways", "https://www.fijiairways.com"], SB: ["Aircalin", "https://www.aircalin.com"],
  TN: ["Air Tahiti Nui", "https://www.airtahitinui.com"], NF: ["Air Vanuatu", "https://www.airvanuatu.com"],
  SQ: ["Singapore Airlines", "https://www.singaporeair.com/en_UK/nz"], CX: ["Cathay Pacific", "https://www.cathaypacific.com/cx/en_NZ.html"],
  EK: ["Emirates", "https://www.emirates.com/nz/english"], QR: ["Qatar Airways", "https://www.qatarairways.com/en-nz"],
  CZ: ["China Southern", "https://www.csair.com/nz/en"], MU: ["China Eastern", "https://us.ceair.com/en"],
  CA: ["Air China", "https://www.airchina.com"], HU: ["Hainan Airlines", "https://www.hainanairlines.com"],
  MH: ["Malaysia Airlines", "https://www.malaysiaairlines.com/nz/en.html"], TG: ["Thai Airways", "https://www.thaiairways.com"],
  KE: ["Korean Air", "https://www.koreanair.com"], OZ: ["Asiana", "https://flyasiana.com"],
  NH: ["ANA", "https://www.ana.co.jp/en/nz"], JL: ["Japan Airlines", "https://www.jal.co.jp/en"],
  PR: ["Philippine Airlines", "https://www.philippineairlines.com"], VN: ["Vietnam Airlines", "https://www.vietnamairlines.com"],
  GA: ["Garuda Indonesia", "https://www.garuda-indonesia.com"], CI: ["China Airlines", "https://www.china-airlines.com"],
  BR: ["EVA Air", "https://www.evaair.com"], AI: ["Air India", "https://www.airindia.com"],
  AC: ["Air Canada", "https://www.aircanada.com/nz/en"], UA: ["United", "https://www.united.com"],
  AA: ["American Airlines", "https://www.aa.com"], DL: ["Delta", "https://www.delta.com"],
  HA: ["Hawaiian Airlines", "https://www.hawaiianairlines.com"], LA: ["LATAM", "https://www.latamairlines.com/nz/en"],
  EY: ["Etihad", "https://www.etihad.com/en-nz"], TK: ["Turkish Airlines", "https://www.turkishairlines.com"],
};
const airline = (code) => AIRLINES[code] || null;
const airlineName = (code) => airline(code)?.[0] || code;

// Sticker palette, cycled across deal badges: [fill, text]
const STICKERS = [["#fb4903", "#fff"], ["#ffd731", "#000"], ["#55db9c", "#000"], ["#e9ccff", "#000"], ["#5c4ade", "#fff"], ["#4da2ff", "#000"]];
const TILTS = [-6, 4, -3, 7, -5, 3];

export function renderEmail(deals, settings) {
  const font = "font-family:Inter,Helvetica,Arial,sans-serif";
  const rows = deals.map((d, i) => {
    const [fill, ink] = STICKERS[i % STICKERS.length];
    return `
    <tr><td style="padding:0 0 12px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #000;border-radius:20px">
        <tr><td style="padding:20px 24px">
          <span style="display:inline-block;background:${fill};color:${ink};border:1px solid #000;border-radius:999px;padding:3px 10px;${font};font-weight:700;font-size:12px;letter-spacing:.03em">−${d.percentOff}%</span>
          <div style="${font};font-weight:800;font-size:22px;line-height:1.1;color:#000;margin-top:10px;text-transform:uppercase">Auckland ⇄ ${esc(d.city)}</div>
          <div style="${font};font-size:13px;color:#000;opacity:.6;margin-top:2px">${esc(d.country)}</div>
          <div style="${font};margin-top:12px"><b style="font-size:26px;color:#000">${nzd(d.price)}</b>
            <span style="text-decoration:line-through;color:#000;opacity:.45;margin-left:6px;font-size:15px">${nzd(d.normal)}</span></div>
          <div style="${font};font-size:13px;color:#000;opacity:.7;margin-top:4px">${fmtDate(d.departDate)} – ${fmtDate(d.returnDate)} · ${esc(airlineName(d.airline))} · ${stopsText(d.stops)}</div>
          <a href="${esc(searchLink(d))}" style="display:inline-block;margin-top:14px;background:#000;color:#fff;border-radius:999px;padding:10px 16px;${font};font-weight:700;font-size:13px;letter-spacing:.03em;text-decoration:none">COMPARE &amp; BOOK →</a>${airline(d.airline) ? ` <a href="${esc(airline(d.airline)[1])}" style="display:inline-block;margin:14px 0 0 6px;background:#fff;color:#000;border:1px solid #000;border-radius:999px;padding:9px 15px;${font};font-weight:700;font-size:13px;letter-spacing:.03em;text-decoration:none">${esc(airlineName(d.airline).toUpperCase())} SITE</a>` : ""}
        </td></tr>
      </table>
    </td></tr>`;
  }).join("");
  return `<div style="background:#dceeff;padding:24px 12px">
  <div style="max-width:560px;margin:0 auto">
    <div style="background:#000;color:#fff;${font};font-weight:700;font-size:12px;letter-spacing:.032em;text-align:center;padding:8px;border-radius:999px">NEW DEALS FROM AUCKLAND · ${settings.dealThresholdPercent ?? 35}%+ BELOW USUAL</div>
    <h1 style="${font};font-weight:900;font-size:44px;line-height:.85;color:#000;margin:24px 0 8px;text-transform:uppercase">Cheap skies<br>out of AKL</h1>
    <p style="${font};font-size:14px;color:#000;opacity:.7;margin:0 0 20px">Cached return fares. Confirm on the booking site before you pay.</p>
    <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
  </div></div>`;
}

const STICKER_SVGS = {
  plane: `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="2" y="2" width="96" height="96" rx="22" fill="#fb4903" stroke="#000" stroke-width="2"/><path d="M50 16c4 0 6 4 6 9v14l26 15v8l-26-7v15l8 6v6l-14-4-14 4v-6l8-6V55l-26 7v-8l26-15V25c0-5 2-9 6-9z" fill="#fff" stroke="#000" stroke-width="2" stroke-linejoin="round"/></svg>`,
  coin: `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="47" fill="#ffd731" stroke="#000" stroke-width="2"/><circle cx="50" cy="50" r="35" fill="none" stroke="#000" stroke-width="2"/><text x="50" y="66" text-anchor="middle" font-family="Bowlby One, sans-serif" font-size="44" fill="#000">$</text></svg>`,
  check: `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="2" y="2" width="96" height="96" rx="22" fill="#55db9c" stroke="#000" stroke-width="2"/><path d="M26 52l16 16 32-34" fill="none" stroke="#000" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  bag: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M36 26V18a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v8" fill="none" stroke="#000" stroke-width="6"/><rect x="8" y="26" width="84" height="66" rx="16" fill="#5c4ade" stroke="#000" stroke-width="2"/><rect x="8" y="48" width="84" height="10" fill="#e9ccff" stroke="#000" stroke-width="2"/></svg>`,
  star: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4l12 30 32 2-25 20 9 32-28-18-28 18 9-32L6 36l32-2z" fill="#e9ccff" stroke="#000" stroke-width="2" stroke-linejoin="round"/></svg>`,
};

// Flat "inflated" ribbon: black outline stroke, blue body, soft highlight, grain filter
const ribbon = (d, id) => `
  <svg class="ribbon" viewBox="0 0 1440 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" result="n"/><feColorMatrix in="n" type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .18"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/><feBlend in="SourceGraphic" mode="multiply"/></filter></defs>
    <path d="${d}" fill="none" stroke="#000" stroke-width="128" stroke-linecap="round"/>
    <g filter="url(#${id})"><path d="${d}" fill="none" stroke="#4da2ff" stroke-width="124" stroke-linecap="round"/></g>
    <path d="${d}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="18" stroke-linecap="round" transform="translate(-10 -26)"/>
  </svg>`;

export function renderDashboard({ routes, settings, demo, checkedAt }) {
  const deals = routes.filter((r) => r.isDeal);
  const threshold = settings.dealThresholdPercent ?? 35;
  const checked = checkedAt.toLocaleString("en-NZ", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const top = deals[0];
  const marqueeText = [
    `${deals.length} deals live`,
    top ? `Top deal: ${top.city} ${nzd(top.price)} (−${top.percentOff}%)` : "No deals today",
    `${routes.length} routes out of AKL`,
    `Checked ${checked}`,
    `${threshold}%+ below usual`,
  ].map(esc).join(" ✦ ");

  const card = (r, i) => {
    const [fill, ink] = STICKERS[i % STICKERS.length];
    return `
    <article class="card">
      <span class="sticker-badge" style="background:${fill};color:${ink};transform:rotate(${TILTS[i % TILTS.length]}deg)">−${r.percentOff}%</span>
      <p class="label">${esc(r.country) || "&nbsp;"}</p>
      <h3 class="${r.city.length > 11 ? "xlong" : r.city.length > 8 ? "long" : ""}">${esc(r.city)}</h3>
      <p class="price">${nzd(r.price)}</p>
      <p class="was">Usually <s>${nzd(r.normal)}</s></p>
      <div class="chips">
        <span class="chip">${fmtDate(r.departDate)} – ${fmtDate(r.returnDate)}</span>
        <span class="chip">${esc(airlineName(r.airline))}</span>
        <span class="chip">${stopsText(r.stops)}</span>
      </div>
      <div class="actions">
        <a class="btn btn-fill" href="${esc(searchLink(r))}" target="_blank" rel="noopener">Compare &amp; book →</a>
        ${airline(r.airline) ? `<a class="btn btn-ghost" href="${esc(airline(r.airline)[1])}" target="_blank" rel="noopener">Airline site</a>` : ""}
      </div>
    </article>`;
  };

  const row = (r) => `
    <tr class="${r.isDeal ? "deal" : ""}">
      <td><b>${esc(r.city)}</b><span class="code">${esc(r.destination)}</span></td>
      <td class="num"><b>${nzd(r.price)}</b></td>
      <td class="num muted">${r.normal ? nzd(r.normal) : "Learning…"}</td>
      <td class="num">${r.percentOff == null ? "–" : r.isDeal ? `<span class="tag">−${r.percentOff}%</span>` : `${r.percentOff > 0 ? "−" : "+"}${Math.abs(r.percentOff)}%`}</td>
      <td>${fmtDate(r.departDate)} – ${fmtDate(r.returnDate)}</td>
      <td>${esc(airlineName(r.airline))} · ${stopsText(r.stops)}</td>
      <td><a class="btn btn-ghost btn-sm" href="${esc(searchLink(r))}" target="_blank" rel="noopener">Compare</a></td>
    </tr>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Auckland Flight Deals</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=Inter:wght@500;700&display=swap" rel="stylesheet">
<style>
  :root {
    --carbon:#000; --paper:#fff; --sky:#dceeff; --concrete:#ccc; --mist:#e9e9e9;
    --blue:#4da2ff; --mint:#55db9c; --lavender:#e9ccff; --ember:#fb4903; --sun:#ffd731; --violet:#5c4ade;
    --display:'Bowlby One', 'Arial Black', sans-serif;
    --ui:'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  }
  * { box-sizing:border-box; }
  html { scroll-behavior:smooth; }
  body { margin:0; background:var(--paper); color:var(--carbon); font:500 15px/1.39 var(--ui); letter-spacing:-.01em; font-feature-settings:"tnum"; }
  a { color:inherit; }
  .wrap { max-width:1440px; margin:0 auto; padding:0 40px; }

  /* Marquee */
  .marquee { background:var(--carbon); color:var(--paper); overflow:hidden; white-space:nowrap; font:700 12px/1 var(--ui); letter-spacing:.032em; text-transform:uppercase; }
  .marquee-track { display:inline-flex; animation:scroll 40s linear infinite; }
  .marquee-track span { padding:10px 24px; }
  @keyframes scroll { to { transform:translateX(-50%); } }
  @media (prefers-reduced-motion: reduce) { .marquee-track { animation:none; } }

  /* Nav */
  nav { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px 0; }
  .logo { width:48px; height:48px; border:1px solid var(--carbon); border-radius:1600px; background:var(--paper); display:grid; place-items:center; font:24px/1 var(--display); text-decoration:none; }
  .nav-links { display:flex; gap:4px; }
  .btn { display:inline-flex; align-items:center; gap:6px; border:1px solid var(--carbon); border-radius:1600px; padding:10px 14px; font:700 13px/1 var(--ui); letter-spacing:.032em; text-transform:uppercase; text-decoration:none; white-space:nowrap; transition:transform .15s ease; }
  .btn:hover { transform:translateY(-2px) rotate(-1deg); }
  .btn-fill { background:var(--carbon); color:var(--paper); }
  .btn-ghost { background:var(--paper); color:var(--carbon); }
  .btn-nav { padding:15px 14px; }
  .btn-sm { padding:7px 12px; font-size:12px; }

  /* Sections */
  section { position:relative; overflow:hidden; }
  .band-sky { background:var(--sky); }
  .band-white { background:var(--paper); }
  .band-gray { background:var(--concrete); }
  .ribbon { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
  .headline { position:relative; isolation:isolate; }
  .headline .ribbon { inset:8% auto auto -40px; width:calc(100% + 80px); height:84%; z-index:-1; }
  #routes > .ribbon { height:260px; }

  /* Hero */
  .hero { padding-bottom:80px; }
  .hero-inner { position:relative; z-index:1; padding-top:40px; }
  .display { font:400 clamp(72px, 17vw, 260px)/.78 var(--display); text-transform:uppercase; margin:0; letter-spacing:0; }
  .tagline { font:500 clamp(18px, 2.2vw, 24px)/1.2 var(--ui); max-width:620px; margin:28px 0 0; }
  .stats { display:flex; flex-wrap:wrap; gap:8px; margin-top:24px; }
  .stat { background:var(--paper); border:1px solid var(--carbon); border-radius:1600px; padding:10px 16px; font:700 13px/1 var(--ui); letter-spacing:.032em; text-transform:uppercase; }
  .stat b { font-family:var(--display); font-weight:400; font-size:18px; margin-right:6px; letter-spacing:0; }
  .sticker { position:absolute; z-index:2; width:clamp(56px, 8vw, 110px); }
  .sticker svg { display:block; width:100%; height:auto; }
  .demo { position:relative; z-index:1; display:inline-block; margin-top:20px; background:var(--lavender); border:1px solid var(--carbon); border-radius:20px; padding:12px 18px; max-width:620px; }
  .demo code { font:700 13px var(--ui); }

  /* Section headers */
  .section-head { display:flex; align-items:end; justify-content:space-between; gap:16px; flex-wrap:wrap; padding:80px 0 32px; position:relative; z-index:1; }
  .section-head h2 { font:400 clamp(56px, 9vw, 140px)/.78 var(--display); text-transform:uppercase; margin:0; }
  .section-head p { font:500 16px/1.4 var(--ui); max-width:360px; margin:0; }

  /* Deal cards */
  .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(270px, 1fr)); gap:16px; padding-bottom:80px; position:relative; z-index:1; }
  .card { position:relative; background:var(--paper); border:1px solid var(--carbon); border-radius:20px; padding:24px; display:flex; flex-direction:column; }
  .card:nth-child(6n+2) { background:var(--lavender); }
  .card:nth-child(6n+4) { background:var(--sky); }
  .sticker-badge { position:absolute; top:-12px; right:18px; border:1px solid var(--carbon); border-radius:1600px; padding:8px 14px; font:400 20px/1 var(--display); }
  .label { font:700 12px/1.56 var(--ui); letter-spacing:.032em; text-transform:uppercase; margin:0; }
  .card h3 { font:400 clamp(30px, 3vw, 40px)/.82 var(--display); text-transform:uppercase; margin:6px 0 0; overflow-wrap:break-word; }
  .card h3.long { font-size:clamp(24px, 2.3vw, 30px); }
  .card h3.xlong { font-size:clamp(20px, 1.8vw, 24px); }
  .price { font:400 48px/.9 var(--display); margin:20px 0 4px; }
  .was { margin:0; font-size:14px; } .was s { opacity:.55; }
  .chips { display:flex; flex-wrap:wrap; gap:4px; margin:16px 0 20px; }
  .chip { border:1px solid var(--carbon); border-radius:1600px; padding:5px 10px; font:700 12px/1 var(--ui); letter-spacing:.02em; background:var(--paper); }
  .actions { margin-top:auto; display:flex; flex-wrap:wrap; gap:6px; }
  .empty { position:relative; z-index:1; background:var(--paper); border:1px solid var(--carbon); border-radius:40px; padding:40px; font:500 20px/1.3 var(--ui); margin-bottom:80px; max-width:720px; }

  /* Table */
  .tablewrap { position:relative; z-index:1; background:var(--paper); border:1px solid var(--carbon); border-radius:30px; overflow-x:auto; margin-bottom:48px; }
  table { width:100%; border-collapse:collapse; min-width:820px; }
  th, td { text-align:left; padding:14px 20px; border-bottom:1px solid var(--carbon); white-space:nowrap; }
  th { font:700 12px/1 var(--ui); letter-spacing:.032em; text-transform:uppercase; padding-top:18px; }
  tr:last-child td { border-bottom:0; }
  tr.deal td { background:var(--lavender); }
  .num { text-align:right; } .muted { opacity:.6; }
  .code { font:700 11px var(--ui); letter-spacing:.032em; border:1px solid var(--carbon); border-radius:1600px; padding:2px 7px; margin-left:8px; vertical-align:2px; }
  .tag { display:inline-block; background:var(--ember); color:var(--paper); border:1px solid var(--carbon); border-radius:1600px; padding:4px 10px; font:700 12px/1 var(--ui); letter-spacing:.032em; }
  footer { position:relative; z-index:1; padding:0 0 48px; font-size:13px; max-width:760px; }

  @media (max-width: 720px) {
    .wrap { padding:0 16px; }
    .nav-links .btn-ghost { display:none; }
    .hero { padding-bottom:56px; }
    .section-head { padding:56px 0 28px; }
    .sticker.s3, .sticker.s4 { display:none; }
  }
</style></head>
<body>
  <div class="marquee" role="marquee"><div class="marquee-track"><span>${marqueeText}</span><span>${marqueeText}</span><span aria-hidden="true">${marqueeText}</span><span aria-hidden="true">${marqueeText}</span></div></div>

  <section class="band-sky hero">
    <div class="wrap">
      <nav>
        <a class="logo" href="#top" aria-label="Auckland Flight Deals">✈</a>
        <div class="nav-links">
          <a class="btn btn-ghost btn-nav" href="#deals">Deals</a>
          <a class="btn btn-ghost btn-nav" href="#routes">All routes</a>
          ${top ? `<a class="btn btn-fill btn-nav" href="${esc(searchLink(top))}" target="_blank" rel="noopener">Top deal →</a>` : ""}
        </div>
      </nav>
      <div class="hero-inner" id="top">
        <div class="headline">
          ${ribbon("M-120 420 C 200 120, 520 520, 820 300 S 1260 40, 1560 200", "grain1")}
          <h1 class="display">Cheap<br>skies<br>from AKL</h1>
        </div>
        <p class="tagline">Every route out of Auckland, checked every morning. These are the return fares sitting ${threshold}%+ below their usual price.</p>
        <div class="stats">
          <span class="stat"><b>${deals.length}</b>deals</span>
          <span class="stat"><b>${routes.length}</b>destinations</span>
          <span class="stat">Checked ${esc(checked)}</span>
        </div>
        ${demo ? `<p class="demo"><b>Demo data.</b> These prices are made up so you can see the layout. Add your Travelpayouts token to <code>settings.json</code> for real fares.</p>` : ""}
      </div>
    </div>
    <div class="sticker s1" style="top:120px;right:8%;transform:rotate(12deg)">${STICKER_SVGS.plane}</div>
    <div class="sticker s2" style="top:46%;right:22%;transform:rotate(-14deg)">${STICKER_SVGS.coin}</div>
    <div class="sticker s3" style="bottom:60px;right:6%;transform:rotate(8deg)">${STICKER_SVGS.bag}</div>
    <div class="sticker s4" style="bottom:200px;right:30%;transform:rotate(-8deg);width:clamp(40px,5vw,70px)">${STICKER_SVGS.star}</div>
  </section>

  <section class="band-white" id="deals">
    <div class="wrap">
      <div class="section-head">
        <h2>The<br>deals</h2>
        <p>Cheapest return fare per destination over the next ${settings.monthsAhead || 6} months, ranked by how far below usual it is.</p>
      </div>
      ${deals.length ? `<div class="grid">${deals.map(card).join("")}</div>` : `<div class="empty">Nothing ${threshold}%+ below usual today. The monitor checks again tomorrow morning and emails you the moment one shows up.</div>`}
    </div>
  </section>

  <section class="band-gray" id="routes">
    ${ribbon("M1560 120 C 1200 260, 1100 20, 820 120 S 380 260, -120 90", "grain2")}
    <div class="sticker" style="top:60px;right:5%;transform:rotate(10deg);width:clamp(52px,6vw,90px)">${STICKER_SVGS.check}</div>
    <div class="wrap">
      <div class="section-head">
        <h2>All<br>routes</h2>
        <p>Deals are highlighted. "Usual" starts as a rough estimate and switches to this monitor's own price history after 5 days of checks.</p>
      </div>
      <div class="tablewrap"><table>
        <thead><tr><th>Destination</th><th class="num">Fare</th><th class="num">Usual</th><th class="num">vs usual</th><th>Dates</th><th>Airline</th><th></th></tr></thead>
        <tbody>${routes.map(row).join("")}</tbody>
      </table></div>
      <footer>Fares are cached prices seen in the last 48 hours and can change. Buttons open Google Flights or the airline's own site, so you book directly. Confirm the price there before paying.</footer>
    </div>
  </section>
</body></html>`;
}
