// Shared HuggingFace helpers for remote model sources. Each source provides
// an ID-fetching function and funnels into resolveIdsToPresets for the per-
// model config.json pipeline.

import { resolveIdsToPresets } from '../hfApi.js';

// Pull a list of model IDs from an HF /api/models query.
//   sort:      'downloads' | 'likes' | 'trendingScore'
//   pipeline:  usually 'text-generation'
//   limit:     cap on returned IDs
export async function fetchHfModelIds({ sort, pipeline = 'text-generation', limit = 25 } = {}) {
  const url = `https://huggingface.co/api/models?sort=${sort}&direction=-1&pipeline_tag=${pipeline}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HF API returned ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .map(r => r.id || r.modelId)
    .filter(Boolean)
    .slice(0, limit);
}

// Resolve a list of HF IDs to presets, stamping each with the source's badge + id.
export async function resolveToPresets(ids, { badge, source }) {
  return resolveIdsToPresets(ids, { badge, source });
}
