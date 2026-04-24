import { fetchHfModelIds, resolveToPresets } from './_hfShared.js';

const ID = 'hf-downloads';
const BADGE = 'DL';

// HF /api/models?sort=downloads is dominated by embeddings and tiny fine-tunes.
// Filter to presets with at least 0.5B params so the list is useful for a VRAM
// calculator. The filter lives here, not in buildPresetFromConfig, because
// other sources may legitimately want the smaller models.
const MIN_PARAMS_B = 0.5;

export const hfDownloads = {
  id: ID,
  label: 'HF Downloads',
  badge: BADGE,
  kind: 'remote',
  cache: { key: 'hf:downloads:v1', ttlMs: 6 * 60 * 60 * 1000 },
  async fetch({ limit = 25 } = {}) {
    const ids = await fetchHfModelIds({ sort: 'downloads', pipeline: 'text-generation', limit });
    const presets = await resolveToPresets(ids, { badge: BADGE, source: ID });
    return presets.filter(p => p.params >= MIN_PARAMS_B);
  },
};
