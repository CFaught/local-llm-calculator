import { ref, computed, onMounted } from 'vue';
import { MODEL_SOURCES } from '../lib/modelSources/index.js';
import { loadCache, loadStale, saveCache } from '../lib/modelCache.js';

// One reactive record per source, shared across component instances.
function createRecord(source) {
  return {
    id:      source.id,
    label:   source.label,
    badge:   source.badge,
    kind:    source.kind,
    presets: ref([]),
    loading: ref(false),
    error:   ref(null),
    status:  ref(null),
    stale:   ref(false),
  };
}

const records = MODEL_SOURCES.map(createRecord);
const recordsById = Object.fromEntries(records.map(r => [r.id, r]));
// Track which sources we've already kicked off a first load for (module-scoped).
const startedIds = new Set();

async function loadSource(source, { force = false } = {}) {
  const rec = recordsById[source.id];
  if (!rec) return;

  if (rec.loading.value) return;

  // Static sources — no cache, resolve synchronously and return.
  if (source.kind === 'static') {
    rec.loading.value = true;
    try {
      rec.presets.value = await source.fetch();
      rec.status.value = null;
    } finally {
      rec.loading.value = false;
    }
    return;
  }

  // Remote — try cache first unless force=true.
  if (!force && source.cache) {
    const cached = loadCache(source.cache.key, source.cache.ttlMs);
    if (cached && cached.length) {
      rec.presets.value = cached;
      rec.stale.value = false;
      return;
    }
  }

  rec.loading.value = true;
  rec.error.value = null;
  rec.status.value = `Fetching ${source.label}…`;
  try {
    const presets = await source.fetch();
    rec.presets.value = presets;
    rec.stale.value = false;
    if (source.cache) saveCache(source.cache.key, presets);
    rec.status.value = presets.length ? `Loaded ${presets.length} from ${source.label}` : `${source.label} returned no models`;
  } catch (e) {
    rec.error.value = e.message;
    rec.status.value = `${source.label} failed: ${e.message}`;
    console.warn(`[${source.id}] fetch failed:`, e);
    // Fall back to stale cache if present so the UI isn't empty.
    if (source.cache) {
      const s = loadStale(source.cache.key);
      if (s && s.data && s.data.length) {
        rec.presets.value = s.data;
        rec.stale.value = true;
      }
    }
  } finally {
    rec.loading.value = false;
  }
}

export function useModelSources() {
  onMounted(() => {
    for (const s of MODEL_SOURCES) {
      if (startedIds.has(s.id)) continue;
      startedIds.add(s.id);
      loadSource(s, { force: false });
    }
  });

  const allPresets = computed(() => {
    const seen = new Set();
    const out = [];
    for (const rec of records) {
      for (const p of rec.presets.value) {
        const key = p.hfId || p.id;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(p);
      }
    }
    return out;
  });

  const unavailable = computed(() =>
    records.filter(r => r.error.value && !r.presets.value.length).map(r => r.label)
  );

  function reload(sourceId) {
    const src = MODEL_SOURCES.find(s => s.id === sourceId);
    if (!src) return;
    return loadSource(src, { force: true });
  }

  function getById(id) { return recordsById[id]; }

  return {
    sources: records,
    allPresets,
    unavailable,
    reload,
    getById,
  };
}
