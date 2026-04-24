#!/usr/bin/env node
// Offline scraper: refreshes src/data/hardware/_techpowerup-snapshot.json
// from TechPowerUp's public GPU database.
//
// Runtime scraping from the browser is blocked by CORS and Cloudflare bot
// detection, so this runs in Node, throttled at ~1 req/s. Output is a JSON
// snapshot committed to the repo. Per-vendor files (src/data/hardware/*.js)
// are maintained by hand and reference this snapshot for spec values when
// human reviewers refresh their entries.
//
// Usage:  npm run refresh-hardware
//
// This script intentionally keeps its scope narrow:
//   - NVIDIA/AMD/Intel discrete consumer GPUs 2020+ with ≥8 GB VRAM
//   - NVIDIA datacenter cards (T4 onwards)
//   - No laptop GPUs, no sub-8GB

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'src', 'data', 'hardware', '_techpowerup-snapshot.json');

const USER_AGENT = 'Mozilla/5.0 (compatible; vramcalc-refresh/1.0; +https://example.local/)';
const THROTTLE_MS = 1200;

// Manufacturer listing pages. These are the public, robots.txt-permitted roots.
const LISTINGS = [
  { vendor: 'nvidia', url: 'https://www.techpowerup.com/gpu-specs/?mfgr=NVIDIA&sort=released' },
  { vendor: 'amd',    url: 'https://www.techpowerup.com/gpu-specs/?mfgr=AMD&sort=released' },
  { vendor: 'intel',  url: 'https://www.techpowerup.com/gpu-specs/?mfgr=Intel&sort=released' },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} at ${url}`);
  return res.text();
}

function parseGpuRow(row) {
  // TechPowerUp listing rows expose: name, release date, bus, memory, bandwidth,
  // generation. The exact selectors will depend on current markup — re-tune if
  // the parser returns empty values.
  const a = row.querySelector('a');
  if (!a) return null;
  const name = a.text.trim();
  const href = a.getAttribute('href');
  const cells = row.querySelectorAll('td').map(c => c.text.trim());
  return { name, href, cells };
}

function parseNumericGB(s) {
  if (!s) return null;
  const m = s.match(/(\d+(?:\.\d+)?)\s*GB/i);
  return m ? parseFloat(m[1]) : null;
}

function parseBandwidth(s) {
  if (!s) return null;
  const m = s.match(/(\d+(?:\.\d+)?)\s*GB\/s/i);
  return m ? parseFloat(m[1]) : null;
}

async function scrapeListing({ vendor, url }) {
  console.error(`[${vendor}] ${url}`);
  const html = await fetchHtml(url);
  const root = parse(html);
  const rows = root.querySelectorAll('table tbody tr');
  const out = [];
  for (const row of rows) {
    const r = parseGpuRow(row);
    if (!r) continue;
    const memGB = r.cells.map(parseNumericGB).find(x => x != null);
    const bw    = r.cells.map(parseBandwidth).find(x => x != null);
    if (!memGB || memGB < 8) continue;
    out.push({
      vendor,
      name: r.name,
      vram: memGB,
      bandwidth: bw || null,
      href: r.href,
    });
  }
  return out;
}

async function main() {
  const all = [];
  for (const listing of LISTINGS) {
    try {
      const entries = await scrapeListing(listing);
      console.error(`[${listing.vendor}] ${entries.length} entries`);
      all.push(...entries);
    } catch (e) {
      console.error(`[${listing.vendor}] scrape failed: ${e.message}`);
    }
    await sleep(THROTTLE_MS);
  }

  const snapshot = {
    lastUpdated: new Date().toISOString().slice(0, 10),
    source: 'techpowerup.com/gpu-specs',
    gpus: all,
  };
  writeFileSync(OUT_PATH, JSON.stringify(snapshot, null, 2) + '\n');
  console.error(`Wrote ${all.length} GPUs to ${OUT_PATH}`);
  console.error('Next step: review and update src/data/hardware/{nvidia-*,amd-*,intel-*}.js accordingly.');
}

main().catch(e => { console.error(e); process.exit(1); });
