import { ref } from 'vue';
import { fetchModelById } from '../lib/hfApi.js';

const IDS_KEY = 'hf:searched:v2';
const SOURCE = 'user-search';
const BADGE = 'USER';

const searched = ref([]);     // preset objects, most recent first
const searching = ref(false);
const lastError = ref(null);

function persistIds() {
  try {
    const ids = searched.value.map(p => p.hfId).filter(Boolean);
    localStorage.setItem(IDS_KEY, JSON.stringify(ids));
  } catch {
    // Quota exceeded, private mode, etc. — silent.
  }
}

async function restore() {
  try {
    const raw = localStorage.getItem(IDS_KEY);
    if (!raw) return;
    const ids = JSON.parse(raw);
    if (!Array.isArray(ids) || !ids.length) return;
    const results = await Promise.allSettled(ids.map(id => fetchModelById(id, { badge: BADGE, source: SOURCE })));
    const presets = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value);
    // Preserve stored order (most recent first).
    searched.value = presets;
  } catch (e) {
    console.warn('Restore searched models failed:', e);
  }
}

let restored = false;

export function useModelSearch() {
  if (!restored) {
    restored = true;
    restore();
  }

  async function search(modelId) {
    const id = modelId.trim().replace(/^https?:\/\/huggingface\.co\//, '').replace(/\/$/, '');
    if (!id) return { ok: false, reason: 'Empty id' };
    if (searched.value.some(p => p.hfId === id)) return { ok: true, preset: searched.value.find(p => p.hfId === id) };

    searching.value = true;
    lastError.value = null;
    try {
      const preset = await fetchModelById(id, { badge: BADGE, source: SOURCE });
      if (!preset) {
        lastError.value = `Could not resolve ${id} (gated, missing config, or unsupported arch)`;
        return { ok: false, reason: lastError.value };
      }
      searched.value = [preset, ...searched.value];
      persistIds();
      return { ok: true, preset };
    } finally {
      searching.value = false;
    }
  }

  function remove(hfId) {
    searched.value = searched.value.filter(p => p.hfId !== hfId);
    persistIds();
  }

  function clear() {
    searched.value = [];
    persistIds();
  }

  return { searched, searching, lastError, search, remove, clear };
}
