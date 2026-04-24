import { fetchHfModelIds, resolveToPresets } from './_hfShared.js';

const ID = 'hf-likes';
const BADGE = 'LIKE';
const MIN_PARAMS_B = 0.5;

export const hfLikes = {
  id: ID,
  label: 'HF Likes',
  badge: BADGE,
  kind: 'remote',
  cache: { key: 'hf:likes:v1', ttlMs: 6 * 60 * 60 * 1000 },
  async fetch({ limit = 25 } = {}) {
    const ids = await fetchHfModelIds({ sort: 'likes', pipeline: 'text-generation', limit });
    const presets = await resolveToPresets(ids, { badge: BADGE, source: ID });
    return presets.filter(p => p.params >= MIN_PARAMS_B);
  },
};
