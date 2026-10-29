// Auckland flight deal monitor.
// Run: node check.mjs            (daily check: fetch fares, find deals, email new ones, rebuild dashboard)
//      node check.mjs --test-email  (email the current deals now, even if already sent)
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderDashboard, renderEmail } from "./render.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const DATA = join(ROOT, "data");
const API = "https://api.travelpayouts.com";
const NZ_DOMESTIC = new Set(["WLG", "CHC", "ZQN", "DUD", "NSN", "NPE", "NPL", "PMR", "ROT", "TRG", "HLZ", "IVC", "KKE", "WRE", "GIS", "TUO", "BHE", "WAG", "TIU", "WSZ"]);

const readJson = async (file, fallback) => {
  try { return JSON.parse(await readFile(file, "utf8")); } catch { return fallback; }
};
const writeJson = (file, value) => writeFile(file, JSON.stringify(value, null, 2));
const today = () => new Date().toISOString().slice(0, 10);
const median = (nums) => {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

async function main() {
  const testEmail = process.argv.includes("--test-email");
  // Keys live outside the public settings: settings.local.json on this Mac, environment variables on GitHub
  const settings = { ...(await readJson(join(ROOT, "settings.json"), {})), ...(await readJson(join(ROOT, "settings.local.json"), {})) };
  if (process.env.TRAVELPAYOUTS_TOKEN) settings.travelpayoutsToken = process.env.TRAVELPAYOUTS_TOKEN;
  if (process.env.RESEND_API_KEY) settings.resendApiKey = process.env.RESEND_API_KEY;
  if (process.env.EMAIL_TO) settings.emailTo = process.env.EMAIL_TO;
  if (process.env.SERPAPI_KEY) settings.serpApiKey = process.env.SERPAPI_KEY;
  const noEmail = process.argv.includes("--no-email");
  const typical = await readJson(join(ROOT, "typical-prices.json"), {});
  await mkdir(DATA, { recursive: true });

  const demo = !settings.travelpayoutsToken;
  const names = await loadPlaceNames();
  const fares = demo ? demoFares(typical) : await fetchFares(settings);
  const filtered = fares.filter((f) => settings.includeDomestic || !NZ_DOMESTIC.has(f.destination));

  // Price history: one cheapest observation per destination per day
  const historyFile = join(DATA, "history.json");
  const history = demo ? {} : await readJson(historyFile, {});
  const date = today();

  const threshold = (settings.dealThresholdPercent ?? 35) / 100;
  const routes = filtered.map((f) => {
    const past = (history[f.destination] || []).filter((h) => h.date !== date).map((h) => h.price);
    const learned = past.length >= 5;
    const normal = learned ? median(past) : typical[f.destination] ?? null;
    const percentOff = normal ? Math.round((1 - f.price / normal) * 100) : null;
    return {
      ...f,
      city: names.cities[f.destination]?.name || f.destination,
      country: names.countries[names.cities[f.destination]?.country] || "",
      normal,
      normalSource: learned ? "history" : normal ? "estimate" : "none",
      percentOff,
      isDeal: normal != null && f.price <= normal * (1 - threshold),
    };
  }).sort((a, b) => (b.percentOff ?? -999) - (a.percentOff ?? -999));

  if (!demo) {
    for (const r of routes) {
      const list = (history[r.destination] ||= []).filter((h) => h.date !== date);
      list.push({ date, price: r.price });
      history[r.destination] = list.slice(-120);
    }
    await writeJson(historyFile, history);
  }

  // Cached prices only nominate candidates; a live Google Flights check decides what counts as a deal
  let liveStatus = "";
  if (!demo && settings.serpApiKey) {
    liveStatus = await liveCheck(routes, settings, threshold);
    routes.sort((a, b) => (b.live ? 1 : 0) - (a.live ? 1 : 0) || (b.percentOff ?? -999) - (a.percentOff ?? -999));
  }

  // Work out which deals haven't been emailed yet (or have dropped another 5%+)
  const sentFile = join(DATA, "sent.json");
  const sent = await readJson(sentFile, {});
  const deals = routes.filter((r) => r.isDeal);
  const fresh = deals.filter((d) => {
    const prev = sent[dealKey(d)];
    if (!prev) return true;
    const ageDays = (Date.parse(date) - Date.parse(prev.date)) / 86400000;
    return d.price < prev.price * 0.95 || ageDays > 14;
  });
  const toEmail = testEmail ? deals : fresh;

  await writeFile(join(ROOT, "dashboard.html"), renderDashboard({ routes, settings, demo, checkedAt: new Date() }));
  if (toEmail.length) await writeFile(join(DATA, "last-email.html"), renderEmail(toEmail, settings));

  let emailStatus = "no new deals to email";
  if (toEmail.length) {
    if (noEmail) emailStatus = "--no-email, not sent (preview saved to data/last-email.html)";
    else if (demo && !testEmail) emailStatus = "demo mode, email not sent (preview saved to data/last-email.html)";
    else if (!settings.resendApiKey || !settings.emailTo) emailStatus = "email not set up yet (preview saved to data/last-email.html)";
    else {
      await sendEmail(toEmail, settings, demo);
      emailStatus = `emailed ${toEmail.length} deal(s)`;
      if (!demo) {
        for (const d of toEmail) sent[dealKey(d)] = { date, price: d.price };
        await writeJson(sentFile, sent);
      }
    }
  }

  console.log(`[${new Date().toLocaleString("en-NZ")}] ${demo ? "DEMO DATA. " : ""}${routes.length} destinations checked, ${liveStatus}${deals.length} deal(s), ${emailStatus}.`);
}

const dealKey = (d) => `${d.destination}|${d.departDate}|${d.returnDate}`;

// Google Flights wants airports, not the metro codes the cached feed uses
const METRO_AIRPORTS = {
  LON: "LHR,LGW", NYC: "JFK,EWR", TYO: "NRT,HND", PAR: "CDG,ORY", SEL: "ICN", OSA: "KIX", BJS: "PEK,PKX",
  SHA: "PVG", ROM: "FCO", MIL: "MXP,LIN", YTO: "YYZ", MOW: "SVO,DME", RIO: "GIG", BUE: "EZE", CHI: "ORD",
  WAS: "IAD,DCA", STO: "ARN", BER: "BER", JKT: "CGK", BKK: "BKK,DMK", SAO: "GRU", REK: "KEF", DPS: "DPS",
};

async function liveCheck(routes, settings, threshold) {
  const want = settings.liveChecksPerDay ?? 5;
  const account = await fetch(`https://serpapi.com/account.json?api_key=${encodeURIComponent(settings.serpApiKey)}`).then((r) => r.json()).catch(() => null);
  const left = account?.total_searches_left ?? account?.plan_searches_left ?? want;
  const n = Math.min(want, left);
  if (n <= 0) return "live checks skipped (SerpApi searches used up this month), ";

  // Every route stops being a deal until a live price confirms it
  for (const r of routes) r.isDeal = false;
  const candidates = routes.filter((r) => r.percentOff != null && r.departDate && r.returnDate).slice(0, n);

  let done = 0;
  for (const r of candidates) {
    const url = new URL("https://serpapi.com/search.json");
    url.search = new URLSearchParams({
      engine: "google_flights", departure_id: settings.origin || "AKL", arrival_id: METRO_AIRPORTS[r.destination] || r.destination,
      outbound_date: r.departDate, return_date: r.returnDate, type: "1", currency: "NZD", hl: "en", gl: "nz",
      api_key: settings.serpApiKey,
    });
    const body = await fetch(url).then((res) => res.json()).catch(() => ({}));
    if (body.error) { r.liveError = body.error; continue; }
    const flights = [...(body.best_flights || []), ...(body.other_flights || [])].filter((f) => f.price);
    const cheapest = flights.sort((a, b) => a.price - b.price)[0];
    const lowest = body.price_insights?.lowest_price ?? cheapest?.price;
    if (!lowest) { r.liveError = "no fares found"; continue; }

    const range = body.price_insights?.typical_price_range;
    r.cachedPrice = r.price;
    r.price = Math.round(lowest);
    if (range?.length === 2) { r.normal = Math.round((range[0] + range[1]) / 2); r.typicalRange = range; r.normalSource = "google"; }
    r.priceLevel = body.price_insights?.price_level || null;
    if (cheapest?.flights?.[0]?.airline) r.airline = cheapest.flights[0].airline;
    if (cheapest?.flights) r.stops = Math.max(0, cheapest.flights.length - 1);
    r.percentOff = r.normal ? Math.round((1 - r.price / r.normal) * 100) : null;
    r.isDeal = r.normal != null && r.price <= r.normal * (1 - threshold);
    r.live = true;
    done++;
  }
  return `${done} live-checked, `;
}

async function fetchFares(settings) {
  const origin = settings.origin || "AKL";
  const currency = settings.currency || "nzd";
  const months = settings.monthsAhead || 6;
  const best = new Map();
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const url = new URL(`${API}/aviasales/v3/prices_for_dates`);
    url.search = new URLSearchParams({
      origin, departure_at: month, unique: "true", sorting: "price", one_way: "false",
      direct: "false", currency, limit: "1000", token: settings.travelpayoutsToken,
    });
    const res = await fetch(url);
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.success === false) {
      throw new Error(`Travelpayouts request failed (${res.status}): ${body.error || res.statusText}`);
    }
    for (const t of body.data || []) {
      const fare = {
        destination: t.destination,
        price: Math.round(t.price),
        airline: t.airline,
        stops: Math.max(t.transfers ?? 0, t.return_transfers ?? 0),
        departDate: t.departure_at?.slice(0, 10),
        returnDate: t.return_at?.slice(0, 10),

      };
      if (!best.has(fare.destination) || fare.price < best.get(fare.destination).price) best.set(fare.destination, fare);
    }
  }
  return [...best.values()];
}

// City and country names, downloaded once and cached
async function loadPlaceNames() {
  const cacheFile = join(DATA, "places-cache.json");
  if (existsSync(cacheFile)) return readJson(cacheFile, { cities: {}, countries: {} });
  try {
    const [cities, countries] = await Promise.all([
      fetch(`${API}/data/en/cities.json`).then((r) => r.json()),
      fetch(`${API}/data/en/countries.json`).then((r) => r.json()),
    ]);
    const out = {
      cities: Object.fromEntries(cities.map((c) => [c.code, { name: c.name, country: c.country_code }])),
      countries: Object.fromEntries(countries.map((c) => [c.code, c.name])),
    };
    await writeJson(cacheFile, out);
    return out;
  } catch {
    return { cities: {}, countries: {} };
  }
}

// Sample fares so the dashboard can be seen before a token is added
function demoFares(typical) {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const airlines = ["NZ", "QF", "JQ", "SQ", "EK", "QR", "CX", "FJ", "VA", "LA"];
  return Object.entries(typical).filter(([k]) => !k.startsWith("_")).map(([dest, normal]) => {
    const factor = rand() < 0.25 ? 0.4 + rand() * 0.2 : 0.75 + rand() * 0.4;
    const depart = new Date(Date.now() + (20 + rand() * 150) * 86400000);
    const ret = new Date(depart.getTime() + (5 + Math.floor(rand() * 16)) * 86400000);
    return {
      destination: dest,
      price: Math.round((normal * factor) / 10) * 10 - 1,
      airline: airlines[Math.floor(rand() * airlines.length)],
      stops: normal > 1400 ? 1 : 0,
      departDate: depart.toISOString().slice(0, 10),
      returnDate: ret.toISOString().slice(0, 10),
      link: null,
    };
  });
}

async function sendEmail(deals, settings, demo) {
  const top = deals[0];
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${settings.resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Auckland Flight Deals <onboarding@resend.dev>",
      to: [settings.emailTo],
      subject: `${demo ? "[DEMO] " : ""}${deals.length} flight deal${deals.length > 1 ? "s" : ""} from Auckland: ${top.city} NZ$${top.price} (${top.percentOff}% off)`,
      html: renderEmail(deals, settings),
    }),
  });
  if (!res.ok) throw new Error(`Email failed (${res.status}): ${await res.text()}`);
}

main().catch((err) => {
  console.error(`[${new Date().toLocaleString("en-NZ")}] Check failed: ${err.message}`);
  process.exit(1);
});
