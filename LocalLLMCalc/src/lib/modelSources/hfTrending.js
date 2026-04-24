import { fetchTrendingIds } from '../hfApi.js';
import { resolveToPresets } from './_hfShared.js';

const ID = 'hf-trending';
const BADGE = 'TREND';

export const hfTrending = {
  id: ID,
  label: 'HF Trending',
  badge: BADGE,
  kind: 'remote',
  cache: { key: 'hf:trending:v2', ttlMs: 6 * 60 * 60 * 1000 },
  async fetch({ limit = 25 } = {}) {
    const ids = await fetchTrendingIds(limit);
    return resolveToPresets(ids, { badge: BADGE, source: ID });
  },
};
