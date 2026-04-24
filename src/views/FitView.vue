<script setup>
import { ref, computed } from 'vue';
import { HARDWARE, HARDWARE_GROUPS } from '../data/hardware/index.js';
import { fmtGB, fmtCtx, fmtParams } from '../lib/format.js';
import { computeForPreset } from '../lib/vram.js';
import { classifyFit, fitReason } from '../lib/fit.js';
import { useModelSources } from '../composables/useModelSources.js';
import { useModelSearch } from '../composables/useModelSearch.js';
import HelpModal from '../components/HelpModal.vue';

// Find a default GPU by name.
const defaultGpuName = 'RTX 4090';
const findGpu = name => HARDWARE.find(g => g.name === name) || HARDWARE[0];

// Hardware state — multi-GPU builder
const selectedGpus = ref([{ ...findGpu(defaultGpuName) }]);
const usablePct = ref(75);

// Workload
const quant = ref('0.60');
const kvquant = ref('2');
const ctx = ref(8192);

// UI
const searchInput = ref('');
const searchMessage = ref(null);
const helpKey = ref(null);
const filterText = ref('');
const groupBy = ref('fit'); // 'fit' | 'org'

// Data sources — defaults + HF trending/downloads/likes + Ollama popular (all merged).
const { sources, allPresets, unavailable, reload } = useModelSources();
const { searched, searching, search, remove: removeSearched } = useModelSearch();

// Combined loading state: true when anything is still fetching on first load.
const anySourceLoading = computed(() => sources.some(s => s.loading.value));
const anyPresetsReady  = computed(() => allPresets.value.length > 0);
const loadingMsg = computed(() => {
  const busy = sources.filter(s => s.loading.value);
  if (!busy.length) return null;
  return busy.length === 1 ? busy[0].status.value : `Loading ${busy.length} sources…`;
});

// Derived hardware
const anyUnified = computed(() => selectedGpus.value.some(g => g.unified));
const rawVRAM = computed(() => selectedGpus.value.reduce((sum, g) => sum + (g.vram || 0), 0));
const usableVRAM = computed(() => anyUnified.value ? rawVRAM.value * (usablePct.value / 100) : rawVRAM.value);

// Reset usable% when unified flips on, pick the highest default among selected unified GPUs.
const unifiedDefault = computed(() => {
  const defaults = selectedGpus.value.filter(g => g.unified).map(g => g.usablePctDefault ?? 75);
  return defaults.length ? Math.max(...defaults) : 75;
});

// Model pool — user searches first, then all source presets. Dedupe by hfId || id.
const modelPool = computed(() => {
  const seen = new Set();
  const out = [];
  for (const m of [...searched.value, ...allPresets.value]) {
    const key = m.hfId || m.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
});

const rows = computed(() => {
  const wBytes = parseFloat(quant.value);
  const kvBytes = parseFloat(kvquant.value);
  const c = ctx.value;
  return modelPool.value.map(m => {
    const r = computeForPreset(m, { wBytes, kvBytes, ctx: c, batch: 1 });
    const cls = classifyFit(r.totalGB, usableVRAM.value);
    return {
      model: m,
      result: r,
      totalGB: r.totalGB,
      headroomGB: usableVRAM.value - r.totalGB,
      cls,
      reason: cls === 'fit' ? null : fitReason(r, usableVRAM.value),
    };
  });
});

const filteredRows = computed(() => {
  const q = filterText.value.trim().toLowerCase();
  if (!q) return rows.value;
  return rows.value.filter(r => {
    const name = r.model.name?.toLowerCase() || '';
    const hfId = r.model.hfId?.toLowerCase() || '';
    return name.includes(q) || hfId.includes(q);
  });
});

const orgOf = m => {
  if (m.hfId && m.hfId.includes('/')) return m.hfId.split('/')[0];
  return 'Built-in';
};

const fitRank = { fit: 0, tight: 1, nofit: 2 };

const groupedByFit = computed(() => {
  const byClass = { fit: [], tight: [], nofit: [] };
  for (const r of filteredRows.value) byClass[r.cls].push(r);
  for (const k of Object.keys(byClass)) {
    byClass[k].sort((a, b) => b.model.params - a.model.params);
  }
  return ['fit', 'tight', 'nofit']
    .filter(cls => byClass[cls].length)
    .map(cls => ({
      key: cls,
      title: cls === 'fit' ? '✓ Fits' : cls === 'tight' ? '⚠ Tight' : '✗ No-fit',
      titleClass: cls,
      rows: byClass[cls],
    }));
});

const groupedByOrg = computed(() => {
  const byOrg = new Map();
  for (const r of filteredRows.value) {
    const org = orgOf(r.model);
    if (!byOrg.has(org)) byOrg.set(org, []);
    byOrg.get(org).push(r);
  }
  const groups = [...byOrg.entries()].map(([org, rs]) => {
    rs.sort((a, b) => (fitRank[a.cls] - fitRank[b.cls]) || (b.model.params - a.model.params));
    const fitCount = rs.filter(r => r.cls === 'fit').length;
    return { key: org, title: org, titleClass: null, rows: rs, fitCount };
  });
  groups.sort((a, b) => (b.fitCount - a.fitCount) || (b.rows.length - a.rows.length) || a.title.localeCompare(b.title));
  return groups;
});

const groups = computed(() => groupBy.value === 'org' ? groupedByOrg.value : groupedByFit.value);

const quantName = computed(() => {
  const bytes = parseFloat(quant.value);
  if (bytes >= 2) return 'FP16';
  if (bytes >= 1) return 'Q8';
  if (bytes >= 0.82) return 'Q6_K';
  if (bytes >= 0.69) return 'Q5_K_M';
  if (bytes >= 0.60) return 'Q4_K_M';
  if (bytes >= 0.50) return '4-bit';
  if (bytes >= 0.49) return 'Q3_K_M';
  return 'Q2_K';
});

const fitRows = computed(() => rows.value.filter(r => r.cls === 'fit'));
const tightRows = computed(() => rows.value.filter(r => r.cls === 'tight'));
const nofitRows = computed(() => rows.value.filter(r => r.cls === 'nofit'));

const capabilitySummary = computed(() => {
  const largestFit = [...fitRows.value].sort((a, b) => b.model.params - a.model.params)[0] || null;
  const total = rows.value.length || 1;
  const fitPct = Math.round((fitRows.value.length / total) * 100);
  return {
    largestFit,
    fitPct,
    fitCount: fitRows.value.length,
    tightCount: tightRows.value.length,
    nofitCount: nofitRows.value.length,
  };
});

const recommendationRows = computed(() => {
  const seen = new Set();
  const candidates = fitRows.value
    .filter(r => r.model.params >= 3)
    .sort((a, b) => {
      const aHeadroomPct = a.headroomGB / usableVRAM.value;
      const bHeadroomPct = b.headroomGB / usableVRAM.value;
      const aScore = a.model.params - Math.max(aHeadroomPct - 0.45, 0) * 12;
      const bScore = b.model.params - Math.max(bHeadroomPct - 0.45, 0) * 12;
      return bScore - aScore;
    });
  return candidates.filter(r => {
    const key = `${orgOf(r.model)}-${Math.round(r.model.params)}-${r.model.arch}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
});

const hardwareVerdict = computed(() => {
  const summary = capabilitySummary.value;
  const profile = `${quantName.value}, ${fmtCtx(ctx.value)} context`;
  if (summary.largestFit) {
    return {
      cls: 'ok',
      eyebrow: 'Your hardware can run',
      title: `${summary.largestFit.model.name} comfortably`,
      body: `At ${profile}, this setup has ${formatHeadroom(summary.largestFit.headroomGB)} headroom on the largest fitting model in the current catalog. Start there, then move down if speed matters more than quality.`,
    };
  }
  if (tightRows.value.length) {
    const tight = [...tightRows.value].sort((a, b) => b.model.params - a.model.params)[0];
    return {
      cls: 'warn',
      eyebrow: 'Borderline setup',
      title: `${tight.model.name} may run, but it is tight`,
      body: `At ${profile}, there is not enough safety margin for a smooth beginner experience. Try Q3 weights, Q8/Q4 KV cache, or shorter context.`,
    };
  }
  return {
    cls: 'bad',
    eyebrow: 'No comfortable matches',
    title: 'This configuration is below the loaded model catalog',
    body: `At ${profile}, reduce context, use heavier quantization, or select hardware with more usable VRAM.`,
  };
});

// Methods
const openHelp = key => { helpKey.value = key; };
const closeHelp = () => { helpKey.value = null; };

const addGpu = () => {
  const last = selectedGpus.value[selectedGpus.value.length - 1] || findGpu(defaultGpuName);
  selectedGpus.value.push({ ...last });
};

const removeGpu = idx => {
  selectedGpus.value.splice(idx, 1);
  if (!selectedGpus.value.length) selectedGpus.value.push({ ...findGpu(defaultGpuName) });
};

const changeGpu = (idx, gpuName) => {
  const gpu = findGpu(gpuName);
  selectedGpus.value[idx] = { ...gpu };
  // If this is the first unified GPU added, reset usablePct to that GPU's default.
  if (gpu.unified) usablePct.value = gpu.usablePctDefault ?? 75;
};

const doSearch = async () => {
  const raw = searchInput.value.trim();
  if (!raw) return;
  searchMessage.value = { cls: '', text: `Resolving ${raw}…` };
  const res = await search(raw);
  if (res.ok) {
    searchMessage.value = { cls: 'ok', text: `Added ${res.preset.name}` };
    searchInput.value = '';
  } else {
    searchMessage.value = { cls: 'bad', text: res.reason || 'Failed' };
  }
  setTimeout(() => { searchMessage.value = null; }, 4000);
};

const refreshAllRemote = () => {
  for (const s of sources) {
    if (s.kind === 'remote') reload(s.id);
  }
};

const formatHeadroom = gb => {
  const abs = Math.abs(gb);
  const sign = gb >= 0 ? '+' : '−';
  return `${sign}${fmtGB(abs)}`;
};
</script>

<template>
  <header>
    <div>
      <h1 class="title">Hardware<br><em>fit check</em></h1>
      <p class="subtitle">Pick your GPU(s), pick a quant and context, and see which HuggingFace models fit.</p>
    </div>
    <div class="meta">
      <div class="big">{{ fmtGB(usableVRAM) }}</div>
      <div>usable vram</div>
    </div>
  </header>

  <div class="grid">

    <!-- LEFT: HARDWARE + SETTINGS -->
    <div>
      <div class="panel">
        <div class="panel-label">
          <span><span class="idx">01</span> &nbsp; Your hardware</span>
          <span><button class="help" @click.stop="openHelp('multigpu')">?</button></span>
        </div>

        <div v-for="(gpu, i) in selectedGpus" :key="i" class="gpu-row-builder">
          <select :value="gpu.name" @change="changeGpu(i, $event.target.value)">
            <optgroup v-for="group in HARDWARE_GROUPS" :key="group.id" :label="group.label">
              <option v-for="g in group.items" :key="g.id" :value="g.name">
                {{ g.name }} — {{ g.vram }} GB{{ g.unified ? ' (unified)' : '' }}
              </option>
            </optgroup>
          </select>
          <button class="remove-btn" @click="removeGpu(i)" :disabled="selectedGpus.length === 1">×</button>
        </div>
        <button class="add-gpu-btn" @click="addGpu">+ Add GPU</button>

        <div class="vram-total">
          <div class="label">Raw VRAM (sum)</div>
          <div class="value">{{ rawVRAM }}<span class="unit">GB</span></div>
        </div>

        <div v-if="anyUnified" class="unified-note">
          <b>Unified memory detected.</b> The OS reserves part of system memory for non-GPU use.
          <div class="row" style="margin-top: 8px; padding: 6px 0; border-bottom: none">
            <label>Usable % <button class="help" @click.stop="openHelp('unified')">?</button></label>
            <div class="slider-row">
              <input type="range" v-model.number="usablePct" min="50" max="100" step="5">
              <span class="slider-val">{{ usablePct }}%</span>
            </div>
          </div>
          <div style="font-size: 11px; margin-top: 4px; color: var(--ink-dim)">
            Defaults: macOS ≈ 75%, Strix Halo ≈ 90%. Configurable in BIOS/sysctl.
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-label">
          <span><span class="idx">02</span> &nbsp; Quant &amp; context</span>
        </div>

        <div class="row">
          <label>Weight quant <button class="help" @click.stop="openHelp('wquant')">?</button></label>
          <select v-model="quant">
            <option value="2">FP16 / BF16 — full quality (2.0 B/p)</option>
            <option value="1">Q8 — near full quality (1.0 B/p)</option>
            <option value="0.82">Q6_K — very close to full (0.82 B/p)</option>
            <option value="0.69">Q5_K_M — small quality drop (0.69 B/p)</option>
            <option value="0.60">Q4_K_M — sweet spot ★ (0.60 B/p)</option>
            <option value="0.50">Q4_0 / AWQ-4 / GPTQ-4 (0.50 B/p)</option>
            <option value="0.49">Q3_K_M — noticeable drop (0.49 B/p)</option>
            <option value="0.43">Q2_K — heavy quality loss (0.43 B/p)</option>
          </select>
        </div>

        <div class="row">
          <label>KV cache quant <button class="help" @click.stop="openHelp('kvquant')">?</button></label>
          <select v-model="kvquant">
            <option value="2">FP16 (2 B/elem)</option>
            <option value="1">Q8 (1 B/elem)</option>
            <option value="0.5">Q4 (0.5 B/elem)</option>
          </select>
        </div>

        <div class="row">
          <label>Context <button class="help" @click.stop="openHelp('ctx')">?</button></label>
          <select v-model.number="ctx">
            <option :value="2048">2K</option>
            <option :value="4096">4K</option>
            <option :value="8192">8K</option>
            <option :value="16384">16K</option>
            <option :value="32768">32K</option>
            <option :value="65536">64K</option>
            <option :value="131072">128K</option>
            <option :value="262144">256K</option>
          </select>
        </div>
      </div>

      <div class="panel">
        <div class="panel-label">
          <span><span class="idx">03</span> &nbsp; Add a specific model</span>
        </div>
        <input
          type="text"
          class="model-search"
          v-model="searchInput"
          placeholder="e.g. meta-llama/Llama-3.3-70B-Instruct"
          @keydown.enter="doSearch"
        >
        <button class="add-gpu-btn" @click="doSearch" :disabled="searching || !searchInput.trim()">
          {{ searching ? 'Resolving…' : 'Resolve &amp; add' }}
        </button>
        <div v-if="searchMessage" class="result-hint" :class="searchMessage.cls" style="margin-top: 12px">
          {{ searchMessage.text }}
        </div>

        <div v-if="searched.length" style="margin-top: 16px">
          <div class="preset-group-label">Saved searches</div>
          <div class="preset-group-btns">
            <button
              v-for="p in searched"
              :key="p.hfId"
              class="preset-btn"
              @click="removeSearched(p.hfId)"
              title="Click to remove"
            >
              {{ p.name }} <span class="badge">×</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT: RESULTS -->
    <div>
      <div v-if="anySourceLoading && !anyPresetsReady" class="trending-status">
        <div class="spinner"></div>
        {{ loadingMsg || 'Loading models…' }}
      </div>

      <div v-else>
        <div class="decision-card" :class="hardwareVerdict.cls">
          <div class="decision-eyebrow">{{ hardwareVerdict.eyebrow }}</div>
          <h2>{{ hardwareVerdict.title }}</h2>
          <p>{{ hardwareVerdict.body }}</p>
          <div class="decision-strip">
            <div>
              <span class="mini-label">Usable VRAM</span>
              <strong>{{ fmtGB(usableVRAM) }}</strong>
            </div>
            <div>
              <span class="mini-label">Profile</span>
              <strong>{{ quantName }} / {{ fmtCtx(ctx) }}</strong>
            </div>
            <div>
              <span class="mini-label">Catalog coverage</span>
              <strong>{{ capabilitySummary.fitPct }}% fit</strong>
            </div>
          </div>
        </div>

        <div class="capability-grid">
          <div class="capability-card">
            <span class="mini-label">Comfortable</span>
            <strong>{{ capabilitySummary.fitCount }}</strong>
            <span>models with 10%+ headroom</span>
          </div>
          <div class="capability-card warn">
            <span class="mini-label">Tight</span>
            <strong>{{ capabilitySummary.tightCount }}</strong>
            <span>models likely to need tuning</span>
          </div>
          <div class="capability-card bad">
            <span class="mini-label">Too large</span>
            <strong>{{ capabilitySummary.nofitCount }}</strong>
            <span>models over your VRAM budget</span>
          </div>
        </div>

        <div v-if="recommendationRows.length" class="panel recommendation-panel">
          <div class="panel-label">
            <span>Start here</span>
          </div>
          <div class="recommendation-list">
            <div
              v-for="row in recommendationRows"
              :key="row.model.hfId || row.model.id"
              class="recommendation-row"
            >
              <div>
                <strong>{{ row.model.name }}</strong>
                <span>{{ fmtParams(row.model.params) }} · {{ fmtGB(row.totalGB) }} estimated</span>
              </div>
              <div class="headroom-pill">{{ formatHeadroom(row.headroomGB) }}</div>
            </div>
          </div>
        </div>

        <div class="panel-label" style="margin-bottom: 16px">
          <span>Model fit results</span>
          <button class="source-toggle-btn" @click="refreshAllRemote" title="Refresh all remote sources">↻ Refresh</button>
        </div>

        <div v-if="unavailable.length" class="result-hint warn" style="margin-bottom: 12px">
          {{ unavailable.length }} source{{ unavailable.length === 1 ? '' : 's' }} unavailable: {{ unavailable.join(', ') }}
        </div>

        <div class="fit-controls">
          <input
            type="text"
            class="model-search"
            v-model="filterText"
            placeholder="Filter models by name or HF id…"
          >
          <div class="group-toggle">
            <button
              class="source-toggle-btn"
              :class="{ active: groupBy === 'fit' }"
              @click="groupBy = 'fit'"
            >By fit</button>
            <button
              class="source-toggle-btn"
              :class="{ active: groupBy === 'org' }"
              @click="groupBy = 'org'"
            >By org</button>
          </div>
        </div>

        <div v-if="!rows.length" class="result-hint">
          No models loaded yet. Add one via search, or wait for sources to load.
        </div>
        <div v-else-if="!filteredRows.length" class="result-hint">
          No models match "{{ filterText }}".
        </div>

        <div v-for="group in groups" :key="group.key" class="fit-group">
          <div class="fit-group-header">
            <span class="fit-group-title" :class="group.titleClass">{{ group.title }}</span>
            <span class="fit-group-count">{{ group.rows.length }} model{{ group.rows.length === 1 ? '' : 's' }}</span>
          </div>

          <div v-for="row in group.rows" :key="row.model.hfId || row.model.id" class="fit-row" :class="row.cls">
            <div>
              <div class="model-name">
                <a v-if="row.model.hfId" :href="`https://huggingface.co/${row.model.hfId}`" target="_blank" rel="noopener">{{ row.model.name }}</a>
                <span v-else>{{ row.model.name }}</span>
                <span class="arch-badge">{{ row.model.arch === 'moe' ? 'MoE' : 'DENSE' }}</span>
              </div>
              <div class="model-meta">
                {{ fmtParams(row.model.params) }}{{ row.model.active ? ' · ' + fmtParams(row.model.active) + ' active' : '' }}
                · {{ row.model.layers }}L · {{ row.reason || row.model.note || '' }}
              </div>
            </div>
            <div class="gb">{{ fmtGB(row.totalGB) }}</div>
            <div class="headroom">{{ formatHeadroom(row.headroomGB) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <HelpModal :help-key="helpKey" @close="closeHelp" />
</template>
