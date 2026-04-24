import mapping from '../../data/ollamaPopular.json';
import { resolveIdsToPresets } from '../hfApi.js';

const ID = 'ollama-popular';
const BADGE = 'OLLAMA';

// Ollama-popular uses a curated in-repo JSON that maps Ollama model names
// (e.g. "llama3.3:70b") to HuggingFace repo IDs. Rationale: ollama.com/library
// is HTML with no CORS header — a browser-side scrape is blocked — and ":latest"
// tags have no canonical HF target, making the mapping editorial.
//
// Each resolved preset is stamped with `ollamaName` and a name prefix so the UI
// can show which Ollama tag this came from.
export const ollamaPopular = {
  id: ID,
  label: 'Ollama Popular',
  badge: BADGE,
  kind: 'remote',
  cache: { key: 'ollama:popular:v1', ttlMs: 24 * 60 * 60 * 1000 },
  async fetch() {
    const entries = (mapping.models || []).filter(e => e.hfId);
    const ids = entries.map(e => e.hfId);
    const presets = await resolveIdsToPresets(ids, { badge: BADGE, source: ID });
    // Splice ollamaName back on by HF id, and prepend the tag to the display name.
    const byHf = new Map(entries.map(e => [e.hfId, e.ollamaName]));
    for (const p of presets) {
      const oName = byHf.get(p.hfId);
      if (oName) {
        p.ollamaName = oName;
        p.name = `${oName} (${p.name})`;
      }
    }
    return presets;
  },
};

export const ollamaMappingMeta = {
  lastUpdated: mapping.lastUpdated,
  sourceNote: mapping.sourceNote,
};
