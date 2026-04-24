<script setup>
import { ref, computed, onMounted } from 'vue';
import { USECASES } from '../data/usecases.js';
import { HARDWARE, HARDWARE_GROUPS } from '../data/hardware/index.js';
import { fmtGB, fmtCtx, kvDesc } from '../lib/format.js';
import { computeVram } from '../lib/vram.js';
import { useModelSources } from '../composables/useModelSources.js';
import HelpModal from '../components/HelpModal.vue';

// Form state
const params    = ref(8);
const active    = ref(13);
const layers    = ref(32);
const hidden    = ref(4096);
const heads     = ref(32);
const kvheads   = ref(8);
const headdim   = ref(128);
const attnfrac  = ref(100);
const slidefrac = ref(0);
const slidewin  = ref(1024);
const wquant    = ref('0.60');
const kvquant   = ref('2');
const ctx       = ref(8192);
const batch     = ref(1);

// App state
const currentPreset  = ref(null);
const currentUsecase = ref('chat');
const currentArch    = ref('dense');
const activeSourceId = ref('defaults');
const modelSearch    = ref('');
const helpKey        = ref(null);

const { sources, reload } = useModelSources();

const activeSource = computed(() => sources.find(s => s.id === activeSourceId.value) || sources[0]);
const activePresets = computed(() => {
  const list = activeSource.value ? activeSource.value.presets.value : [];
  return [...list].sort((a, b) => {
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    return (a.params || 0) - (b.params || 0);
  });
});
const activeStatus = computed(() => activeSource.value?.loading.value ? activeSource.value.status.value : null);
const activeError  = computed(() => activeSource.value?.error.value && !activeSource.value.presets.value.length ? activeSource.value.error.value : null);

// Calculation
const result = computed(() => computeVram({
  params: params.value,
  active: active.value,
  arch: currentArch.value,
  layers: layers.value,
  kvheads: kvheads.value,
  headDim: headdim.value,
  attnFrac: attnfrac.value / 100,
  slideFrac: slidefrac.value / 100,
  slideWin: slidewin.value,
  wBytes: parseFloat(wquant.value),
  kvBytes: parseFloat(kvquant.value),
  ctx: ctx.value,
  batch: batch.value,
}));

const totalDisplay = computed(() => {
  const t = result.value.totalGB;
  return t < 10 ? t.toFixed(2) : t.toFixed(1);
});

// Pick the smallest-VRAM GPU that meets the capacity threshold. Since HARDWARE
// is grouped (Apple first), sort by VRAM ascending so the summary surfaces a
// meaningful recommendation.
function pickSmallestThatFits(t, factor = 1.1, { exclude } = {}) {
  const pool = HARDWARE.filter(g => (!exclude || !exclude(g)) && g.vram >= t * factor);
  pool.sort((a, b) => a.vram - b.vram);
  return pool[0];
}

const fitSummary = computed(() => {
  const t = result.value.totalGB;
  const fitting = pickSmallestThatFits(t, 1.1);
  if (fitting) return { text: `Fits on ${fitting.name} (${fitting.vram} GB)`, cls: 'ok' };
  const tight = pickSmallestThatFits(t, 1.0);
  if (tight) return { text: `Tight fit on ${tight.name}`, cls: 'warn' };
  return { text: "Doesn't fit on any listed hardware", cls: 'bad' };
});

const filteredGroups = computed(() => {
  const q = modelSearch.value.toLowerCase().trim();
  const groupMap = {};
  for (const p of activePresets.value) {
    if (!q || p.name.toLowerCase().includes(q) || (p.id || '').toLowerCase().includes(q)) {
      const key = p.group || 'Other';
      if (!groupMap[key]) groupMap[key] = { name: key, items: [] };
      groupMap[key].items.push(p);
    }
  }
  return Object.values(groupMap);
});

function classifyGpu(g, totalGB) {
  if (g.vram >= totalGB * 1.1) return 'fit';
  if (g.vram >= totalGB)       return 'tight';
  return 'nofit';
}

const gpuGroups = computed(() => {
  const t = result.value.totalGB;
  return HARDWARE_GROUPS.map(group => ({
    id:    group.id,
    label: group.label,
    items: group.items.map(g => ({ ...g, cls: classifyGpu(g, t) })),
  }));
});

const breakdownItems = computed(() => {
  const r = result.value;
  const items = [
    { name: 'Model weights',      desc: `${r.params}B params × ${r.wBytes} B/p${r.arch === 'moe' ? ' (all experts resident)' : ''}`, gb: r.weightsGB },
    { name: 'KV cache',           desc: kvDesc(r), gb: r.kvGB },
    { name: 'Activations',        desc: 'forward pass working memory', gb: r.actGB },
    { name: 'Framework overhead', desc: 'CUDA context, kernels, allocator', gb: r.overheadGB },
  ];
  const max = Math.max(...items.map(i => i.gb));
  return items.map(item => ({
    ...item,
    pct: Math.max(3, (item.gb / max) * 100),
    warn: item.gb / r.totalGB > 0.5,
  }));
});

const liveFormulaHtml = computed(() => {
  const r = result.value;
  const hybrid = r.slidingLayers > 0 || r.linearLayers > 0;
  const kvLine = hybrid
    ? `<b>kv</b> = [${r.fullAttnLayers}×${r.ctx} + ${r.slidingLayers}×${Math.min(r.ctx, r.slideWin)}] × ${r.perTokPerLayer} = <b>${fmtGB(r.kvGB)}</b>`
    : `<b>kv</b> = ${r.layers} × ${r.ctx} × ${r.perTokPerLayer} = <b>${fmtGB(r.kvGB)}</b>`;
  return `<b>weights</b> = ${r.params} × ${r.wBytes} = <b>${fmtGB(r.weightsGB)}</b><br>${kvLine}<br><b>activations</b> ≈ <b>${fmtGB(r.actGB)}</b> &nbsp; <b>overhead</b> ≈ <b>${fmtGB(r.overheadGB)}</b><br><b>total</b> = <b>${fmtGB(r.totalGB)}</b>`;
});

const resultHint = computed(() => {
  const t = result.value.totalGB;
  const notMulti = g => g.group !== 'multi-gpu';
  const fitting = pickSmallestThatFits(t, 1.1, { exclude: g => !notMulti(g) });
  const tight   = pickSmallestThatFits(t, 1.0, { exclude: g => !notMulti(g) });
  if (fitting) return { html: `<strong>✓ Fits comfortably</strong> on a <strong>${fitting.name}</strong> (${fitting.vram} GB) with headroom.`, cls: '' };
  if (tight)   return { html: `<strong>⚠ Tight fit</strong> on ${tight.name} (${tight.vram} GB). You may hit OOM under load. Try a smaller quantization or less context.`, cls: 'warn' };
  return { html: `<strong>✗ Won't fit on single consumer GPU.</strong> Options: use a smaller quant (Q3 or Q2), reduce context, or use multiple GPUs.`, cls: 'bad' };
});

// Methods
const openHelp  = key => { helpKey.value = key; };
const closeHelp = () => { helpKey.value = null; };
const clearPreset  = () => { currentPreset.value = null; };
const clearUsecase = () => { currentUsecase.value = null; };

const applyUsecase = id => {
  const u = USECASES.find(x => x.id === id);
  if (!u) return;
  currentUsecase.value = id;
  ctx.value = u.ctx;
};

const applyPreset = id => {
  if (!id) return;
  const p = activePresets.value.find(x => x.id === id);
  if (!p) return;
  currentPreset.value = p;
  currentArch.value = p.arch;
  params.value = p.params;
  if (p.arch === 'moe' && p.active) active.value = p.active;
  layers.value = p.layers;
  hidden.value = p.hidden;
  heads.value = p.heads;
  kvheads.value = p.kvheads;
  headdim.value = p.headdim || Math.round(p.hidden / p.heads);
  attnfrac.value = p.attnFrac != null ? p.attnFrac : 100;
  slidefrac.value = p.slideFrac != null ? p.slideFrac : 0;
  slidewin.value = p.slideWin || 1024;
  if (p.nativeWBytes != null) wquant.value = String(p.nativeWBytes);
};

const switchSource = id => {
  activeSourceId.value = id;
  modelSearch.value = '';
  // Pick the first preset from the newly-active source once it's populated.
  const first = activePresets.value[0];
  if (first) applyPreset(first.id);
};

const refreshActive = () => reload(activeSourceId.value);

onMounted(() => {
  applyUsecase('chat');
  // Initial preset will come from the defaults source (loads synchronously).
  const first = activePresets.value[0];
  if (first) applyPreset(first.id);
});
</script>

<template>
  <header>
    <div>
      <h1 class="title">VRAM<br><em>calculator</em></h1>
      <p class="subtitle">How much GPU memory do you need to run a local model? Pick a model, pick what you'll use it for.</p>
    </div>
    <div class="meta">
      <div class="big">{{ fmtGB(result.totalGB) }}</div>
      <div>total estimate</div>
    </div>
  </header>

  <div class="grid">

    <!-- LEFT: INPUTS -->
    <div>
      <div class="panel">
        <div class="panel-label">
          <span><span class="idx">01</span> &nbsp; Pick a model</span>
          <span><button class="help" @click.stop="openHelp('model')">?</button></span>
        </div>

        <div class="source-bar">
          <span class="source-label">
            <span v-if="activeError">
              <span style="color:var(--accent-2)">{{ activeSource?.label }} unavailable</span>
            </span>
            <span v-else-if="activeSource?.kind === 'static'">Source: Built-in presets</span>
            <span v-else>Source: {{ activeSource?.label }}</span>
          </span>
          <button
            v-for="s in sources"
            :key="s.id"
            class="source-toggle-btn"
            :class="{ active: activeSourceId === s.id }"
            :title="s.error.value ? s.error.value : s.label"
            @click="switchSource(s.id)"
          >
            {{ s.label }}<span v-if="s.loading.value" class="spinner spinner-sm" style="margin-left:6px"></span>
          </button>
          <button
            v-if="activeSource?.kind === 'remote'"
            class="source-toggle-btn"
            @click="refreshActive"
            :title="`Refresh ${activeSource.label}`"
          >&#x21BB;</button>
        </div>

        <input type="text" class="model-search" v-model="modelSearch" placeholder="Search models...">

        <div v-if="activeStatus" class="trending-status">
          <div class="spinner"></div>
          {{ activeStatus }}
        </div>

        <div v-else-if="!activePresets.length && activeError" class="trending-status" style="color:var(--accent-2)">
          {{ activeSource?.label }} is unavailable. Try another source.
        </div>

        <div v-else>
          <div v-for="group in filteredGroups" :key="group.name" class="preset-group">
            <div class="preset-group-label">{{ group.name }}</div>
            <div class="preset-group-btns">
              <button
                v-for="p in group.items"
                :key="p.id"
                class="preset-btn"
                :class="{ active: currentPreset && currentPreset.id === p.id }"
                :title="(p.hfId || p.name) + (p.params ? ' (' + p.params + 'B)' : '')"
                @click="applyPreset(p.id)"
              >{{ p.name }}<span v-if="p.badge" class="badge">{{ p.badge }}</span></button>
            </div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-label">
          <span><span class="idx">02</span> &nbsp; Quantization</span>
          <span><button class="help" @click.stop="openHelp('quant')">?</button></span>
        </div>
        <div class="row">
          <label>Weight quant <button class="help" @click.stop="openHelp('wquant')">?</button></label>
          <select v-model="wquant">
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
      </div>

      <div class="panel">
        <div class="panel-label">
          <span><span class="idx">03</span> &nbsp; What will you use it for?</span>
          <span><button class="help" @click.stop="openHelp('usecase')">?</button></span>
        </div>
        <div class="usecase-grid">
          <button
            v-for="u in USECASES"
            :key="u.id"
            class="usecase"
            :class="{ active: currentUsecase === u.id }"
            @click="applyUsecase(u.id)"
          >
            <div class="uc-name">{{ u.name }}</div>
            <div class="uc-ctx">{{ u.desc.split(' — ')[0] }}</div>
          </button>
        </div>
      </div>

      <details>
        <summary>Advanced — custom architecture &amp; workload</summary>
        <div>
          <div class="panel-label panel-label-in-details">
            <span>Architecture</span>
            <span><button class="help" @click.stop="openHelp('advanced')">?</button></span>
          </div>

          <div class="row">
            <label>Total params <button class="help" @click.stop="openHelp('params')">?</button></label>
            <div class="slider-row">
              <input type="range" v-model.number="params" @input="clearPreset" min="0.5" max="700" step="0.5">
              <span class="slider-val">{{ params }}B</span>
            </div>
          </div>

          <div class="row" :style="{ display: currentArch === 'moe' ? 'grid' : 'none' }">
            <label>Active params <button class="help" @click.stop="openHelp('active')">?</button></label>
            <div class="slider-row">
              <input type="range" v-model.number="active" @input="clearPreset" min="0.5" max="200" step="0.5">
              <span class="slider-val">{{ active }}B</span>
            </div>
          </div>

          <div class="row">
            <label>Layers</label>
            <div class="slider-row">
              <input type="range" v-model.number="layers" @input="clearPreset" min="12" max="128" step="1">
              <span class="slider-val">{{ layers }}</span>
            </div>
          </div>

          <div class="row">
            <label>Hidden size</label>
            <input type="number" v-model.number="hidden" @input="clearPreset" step="64">
          </div>

          <div class="row">
            <label>Attn heads</label>
            <input type="number" v-model.number="heads" @input="clearPreset" step="1">
          </div>

          <div class="row">
            <label>KV heads (GQA) <button class="help" @click.stop="openHelp('gqa')">?</button></label>
            <input type="number" v-model.number="kvheads" @input="clearPreset" step="1">
          </div>

          <div class="row">
            <label>Head dim</label>
            <input type="number" v-model.number="headdim" @input="clearPreset" step="16">
          </div>

          <div class="row">
            <label>Attn layers % <button class="help" @click.stop="openHelp('hybrid')">?</button></label>
            <div class="slider-row">
              <input type="range" v-model.number="attnfrac" @input="clearPreset" min="0" max="100" step="1">
              <span class="slider-val">{{ attnfrac }}%</span>
            </div>
          </div>

          <div class="row">
            <label>Sliding layers % <button class="help" @click.stop="openHelp('sliding')">?</button></label>
            <div class="slider-row">
              <input type="range" v-model.number="slidefrac" @input="clearPreset" min="0" max="100" step="1">
              <span class="slider-val">{{ slidefrac }}%</span>
            </div>
          </div>

          <div class="row">
            <label>Slide window</label>
            <input type="number" v-model.number="slidewin" @input="clearPreset" step="128">
          </div>

          <div class="panel-label panel-label-in-details" style="margin-top: 24px">
            <span>Workload</span>
          </div>

          <div class="row">
            <label>Custom context <button class="help" @click.stop="openHelp('ctx')">?</button></label>
            <div class="slider-row">
              <input type="range" v-model.number="ctx" @input="clearUsecase" min="1024" max="1048576" step="1024">
              <span class="slider-val">{{ fmtCtx(ctx) }}</span>
            </div>
          </div>

          <div class="row">
            <label>Batch size <button class="help" @click.stop="openHelp('batch')">?</button></label>
            <div class="slider-row">
              <input type="range" v-model.number="batch" min="1" max="64" step="1">
              <span class="slider-val">{{ batch }}</span>
            </div>
          </div>

          <div class="row">
            <label>KV cache quant <button class="help" @click.stop="openHelp('kvquant')">?</button></label>
            <select v-model="kvquant">
              <option value="2">FP16 — default (2 B/elem)</option>
              <option value="1">Q8 — half size, near-zero quality loss (1 B/elem)</option>
              <option value="0.5">Q4 — quarter size, small quality cost (0.5 B/elem)</option>
            </select>
          </div>
        </div>
      </details>
    </div>

    <!-- RIGHT: OUTPUT -->
    <div>
      <div class="total-card">
        <div class="total-label">Estimated VRAM needed</div>
        <div class="total-value">
          <span>{{ totalDisplay }}</span><span class="unit">GB</span>
        </div>
        <div class="total-sub" :class="fitSummary.cls">{{ fitSummary.text }}</div>
      </div>

      <div v-if="currentPreset && currentPreset.note" class="arch-banner">
        <b>Note:</b> {{ currentPreset.note }}
      </div>

      <div class="result-hint" :class="resultHint.cls" v-html="resultHint.html"></div>

      <div class="panel">
        <div class="panel-label">
          <span>GPU compatibility</span>
          <span><button class="help" @click.stop="openHelp('gpus')">?</button></span>
        </div>
        <div v-for="g in gpuGroups" :key="g.id" class="gpu-group">
          <div class="preset-group-label" style="margin-top: 8px">{{ g.label }}</div>
          <div class="gpu-grid">
            <div v-for="h in g.items" :key="h.id" class="gpu" :class="h.cls">
              <div class="status"></div>
              <div class="name">{{ h.name }}</div>
              <div class="cap">{{ h.vram }} GB</div>
            </div>
          </div>
        </div>
      </div>

      <details>
        <summary>Memory breakdown — see exactly what uses the VRAM</summary>
        <div>
          <div v-for="item in breakdownItems" :key="item.name" class="breakdown-row">
            <div class="breakdown-name">
              <div class="breakdown-name-wrap">
                {{ item.name }}
                <span class="desc">{{ item.desc }}</span>
              </div>
            </div>
            <div class="breakdown-bar" :class="{ warn: item.warn }">
              <div class="fill" :style="{ width: item.pct + '%' }"></div>
            </div>
            <div class="breakdown-value">{{ fmtGB(item.gb) }}</div>
          </div>
        </div>
      </details>

      <details>
        <summary>The math — how this is calculated</summary>
        <div>
          <div class="formula">
            <b>weights</b> = params &times; bytes_per_param<br>
            <b>per_tok_per_layer</b> = 2 &times; kv_heads &times; head_dim &times; kv_bytes &times; batch<br>
            <b>kv_cache</b> = (full_layers &times; ctx + slide_layers &times; min(ctx, window)) &times; per_tok_per_layer<br>
            <b>total</b> = weights + kv_cache + activations + overhead
          </div>
          <div class="formula" style="border-left-color: var(--accent-2); margin-top: 8px" v-html="liveFormulaHtml"></div>
        </div>
      </details>
    </div>
  </div>

  <HelpModal :help-key="helpKey" @close="closeHelp" />
</template>
