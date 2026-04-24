import { defaults }       from './defaults.js';
import { hfTrending }     from './hfTrending.js';
import { hfDownloads }    from './hfDownloads.js';
import { hfLikes }        from './hfLikes.js';
import { ollamaPopular }  from './ollamaPopular.js';

// Array order = UI display order in source toggle bars.
// user-search is NOT in this list — it's managed by useModelSearch.js with
// different semantics (imperative add, persisted ID list).
export const MODEL_SOURCES = [
  defaults,
  hfTrending,
  hfDownloads,
  hfLikes,
  ollamaPopular,
];

export function getSourceById(id) {
  return MODEL_SOURCES.find(s => s.id === id);
}

// Cache keys retired in this rework. Cleanup pass removes them from
// localStorage once per user.
export const LEGACY_CACHE_KEYS = [
  'hf:trending:v1',
  'hf:searched:v1',
];
