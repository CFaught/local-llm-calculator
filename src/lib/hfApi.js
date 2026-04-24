import { buildPresetFromConfig } from './hfConfig.js';

// Fetch a single model's config from HuggingFace and build a preset.
// Returns null for gated, unparseable, or errored models (with console warns).
export async function fetchModelById(modelId, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const infoRes = await fetch(`https://huggingface.co/api/models/${modelId}`, { signal: controller.signal });
    if (!infoRes.ok) { clearTimeout(timeout); console.warn(`[${modelId}] info fetch status ${infoRes.status}`); return null; }
    const info = await infoRes.json();

    if (info.gated) { clearTimeout(timeout); console.warn(`[${modelId}] skipped: gated=${info.gated}`); return null; }

    const configRes = await fetch(`https://huggingface.co/${modelId}/resolve/main/config.json`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!configRes.ok) { console.warn(`[${modelId}] config.json status ${configRes.status}`); return null; }
    const config = await configRes.json();
    const preset = buildPresetFromConfig(modelId, config, info, opts);
    if (!preset) console.warn(`[${modelId}] buildPresetFromConfig returned null — config keys:`, Object.keys(config).join(','));
    return preset;
  } catch (e) {
    clearTimeout(timeout);
    console.warn(`[${modelId}] threw:`, e.message);
    return null;
  }
}

// Fetch trending repo IDs from HuggingFace. Returns model-repo IDs only, capped.
export async function fetchTrendingIds(limit = 25) {
  const res = await fetch('https://huggingface.co/api/trending');
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  const data = await res.json();

  let repos = [];
  if (Array.isArray(data)) repos = data;
  else if (data.recentlyTrending) repos = data.recentlyTrending.map(r => r.repoData || r);
  else if (data.models) repos = data.models;
  else if (data.repos) repos = data.repos;

  const candidates = repos
    .filter(r => (r.repoType || r.type || 'model') === 'model')
    .slice(0, limit);

  return candidates
    .map(r => r.id || r.modelId || r.name || (r.repoData && r.repoData.id))
    .filter(Boolean);
}

// Resolve a list of HF model IDs to presets, skipping failures. Batched via allSettled.
// Used by every HF-backed model source (trending, downloads, likes, ollama).
export async function resolveIdsToPresets(ids, opts = {}, { batchSize = 5 } = {}) {
  const results = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map(id => fetchModelById(id, opts)));
    for (const s of settled) {
      if (s.status === 'fulfilled' && s.value) results.push(s.value);
    }
  }
  return results;
}
