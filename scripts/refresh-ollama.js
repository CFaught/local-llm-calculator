#!/usr/bin/env node
// Helper for refreshing src/data/ollamaPopular.json. Prints a candidate list
// of popular Ollama models so a human can review/edit and commit via PR.
//
// Rationale (see plan §2d): ollama.com/library is HTML with no CORS header,
// so we don't fetch popularity from the client. This script prints a list
// fetched in Node (CORS doesn't apply) with a realistic UA, for editorial
// review. It does NOT write ollamaPopular.json itself — the mapping from
// Ollama tag → HF id is an editorial decision.
//
// Usage:  npm run refresh-ollama

import { parse } from 'node-html-parser';

const USER_AGENT = 'Mozilla/5.0 (compatible; vramcalc-refresh/1.0; +https://example.local/)';
const LIBRARY_URL = 'https://ollama.com/library';

async function main() {
  console.error(`Fetching ${LIBRARY_URL}…`);
  const res = await fetch(LIBRARY_URL, { headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html' } });
  if (!res.ok) {
    console.error(`HTTP ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const html = await res.text();
  const root = parse(html);

  // The library page groups models. Exact markup drifts — re-tune selectors if
  // this prints nothing. At time of writing, each model is inside an <a> with
  // href starting with /library/.
  const links = root.querySelectorAll('a[href^="/library/"]');
  const seen = new Set();
  for (const a of links) {
    const href = a.getAttribute('href') || '';
    const slug = href.replace(/^\/library\//, '').replace(/\/$/, '');
    if (!slug || slug.includes('/')) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);
  }

  console.error(`Found ${seen.size} model slugs. Top 40:`);
  for (const slug of Array.from(seen).slice(0, 40)) {
    console.log(`  { "ollamaName": "${slug}:TAG", "hfId": "ORG/REPO" },`);
  }
  console.error('');
  console.error('Now: edit src/data/ollamaPopular.json, fill in TAG and hfId for each,');
  console.error('bump lastUpdated, and open a PR.');
}

main().catch(e => { console.error(e); process.exit(1); });
