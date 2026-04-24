import { DEFAULT_PRESETS } from '../../data/presets.js';

// Static built-in presets. Always available, no cache, no network.
// Each preset gets source stamped so UI dedup / badge logic can tell where
// it came from; no badge — these are the canonical curated set.
export const defaults = {
  id: 'defaults',
  label: 'Defaults',
  badge: null,
  kind: 'static',
  cache: null,
  async fetch() {
    return DEFAULT_PRESETS.map(p => ({ ...p, source: 'defaults' }));
  },
};
