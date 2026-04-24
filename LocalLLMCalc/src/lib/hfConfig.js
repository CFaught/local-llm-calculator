// Bytes-per-parameter for each safetensors dtype as reported by HuggingFace.
export const DTYPE_BYTES = {
  F64: 8, I64: 8,
  F32: 4, I32: 4, U32: 4,
  F16: 2, BF16: 2, I16: 2, U16: 2,
  F8_E4M3: 1, F8_E5M2: 1, I8: 1, U8: 1,
  F4: 0.5, I4: 0.5, U4: 0.5,
};

// Quant dropdown option values (bytes/param) in descending order.
export const QUANT_OPTS = [2, 1, 0.82, 0.69, 0.60, 0.50, 0.49, 0.43];

export function computeAvgBytes(parameters) {
  if (!parameters) return null;
  let totalBytes = 0;
  let totalCount = 0;
  for (const [dtype, count] of Object.entries(parameters)) {
    const bpp = DTYPE_BYTES[dtype];
    if (bpp == null || !count) continue;
    totalBytes += bpp * count;
    totalCount += count;
  }
  if (!totalCount) return null;
  return totalBytes / totalCount;
}

export function snapWQuant(avgBytes) {
  if (avgBytes == null) return null;
  let best = QUANT_OPTS[0];
  let bestDiff = Math.abs(best - avgBytes);
  for (const opt of QUANT_OPTS) {
    const d = Math.abs(opt - avgBytes);
    if (d < bestDiff) { best = opt; bestDiff = d; }
  }
  return best;
}

export function extractParamsFromName(name) {
  const moeMatch = name.match(/(\d+(?:\.\d+)?)\s*[Bb]\s*[-–]\s*[Aa](\d+(?:\.\d+)?)\s*[Bb]/);
  if (moeMatch) return { total: parseFloat(moeMatch[1]), active: parseFloat(moeMatch[2]) };
  const simpleMatch = name.match(/(\d+(?:\.\d+)?)\s*[Bb](?!\w)/);
  if (simpleMatch) return { total: parseFloat(simpleMatch[1]), active: null };
  return { total: 0, active: null };
}

export function buildPresetFromConfig(modelId, config, info, { badge = null, source = null } = {}) {
  // Multimodal models (Gemma 4, Llama 4 vision, etc.) nest the text-decoder architecture
  // under text_config; fall back to the root config for plain text-only models.
  const arch = config.text_config || config;

  const layers = arch.num_hidden_layers || arch.n_layer;
  const hidden = arch.hidden_size || arch.n_embd || arch.d_model;
  const heads  = arch.num_attention_heads || arch.n_head;
  if (!layers || !hidden || !heads) return null;

  const kvheads = arch.num_key_value_heads || arch.n_head_kv || heads;
  const headdim = arch.head_dim || Math.round(hidden / heads);

  const numExperts = arch.num_local_experts || arch.num_experts || 0;
  const numActiveExperts = arch.num_experts_per_tok || arch.num_selected_experts || 0;
  const isMoe = numExperts > 1 && numActiveExperts > 0;

  let params = 0;
  if (info && info.safetensors) {
    if (info.safetensors.total) {
      params = Math.round(info.safetensors.total / 1e8) / 10;
    } else if (info.safetensors.parameters) {
      const total = Object.values(info.safetensors.parameters).reduce((a, b) => a + b, 0);
      params = Math.round(total / 1e8) / 10;
    }
  }

  const nameParts = modelId.split('/');
  const modelName = nameParts[nameParts.length - 1];
  if (!params || params < 0.1) params = extractParamsFromName(modelName).total;
  if (!params) return null;

  let active;
  if (isMoe) {
    const nameParams = extractParamsFromName(modelName);
    if (nameParams.active) {
      active = nameParams.active;
    } else if (numExperts > 0 && numActiveExperts > 0) {
      const expertFrac = 0.65;
      active = Math.round((params * (1 - expertFrac) + params * expertFrac * (numActiveExperts / numExperts)) * 10) / 10;
    }
  }

  let attnFrac = 100;
  if (arch.attn_layer_indices && Array.isArray(arch.attn_layer_indices)) {
    attnFrac = Math.round((arch.attn_layer_indices.length / layers) * 100);
  } else if (arch.attention_layers && Array.isArray(arch.attention_layers)) {
    attnFrac = Math.round((arch.attention_layers.length / layers) * 100);
  }

  let slideFrac = 0;
  let slideWin = arch.sliding_window || 1024;
  if (arch.sliding_window_pattern && Array.isArray(arch.sliding_window_pattern)) {
    const slidingCount = arch.sliding_window_pattern.filter(x => x && x > 0).length;
    const patternLen = arch.sliding_window_pattern.length;
    const slidingLayers = Math.round(layers * (slidingCount / patternLen));
    const globalLayers = layers - slidingLayers;
    slideFrac = Math.round((slidingLayers / layers) * 100);
    attnFrac  = Math.round((globalLayers / layers) * 100);
    const windowVals = arch.sliding_window_pattern.filter(x => x && x > 0);
    if (windowVals.length > 0) slideWin = windowVals[0];
  }

  let note = '';
  if (isMoe && attnFrac < 100) {
    note = `Hybrid MoE: ${numExperts} experts (${numActiveExperts} active). ${Math.round(layers * attnFrac / 100)} of ${layers} layers cache KV.`;
  } else if (isMoe) {
    note = `MoE: ${numExperts} experts, ${numActiveExperts} active per token.`;
  } else if (attnFrac < 100 && slideFrac > 0) {
    note = `Hybrid: ${Math.round(layers * slideFrac / 100)} sliding (${slideWin} tok) + ${Math.round(layers * attnFrac / 100)} global full-attn.`;
  } else if (attnFrac < 100) {
    note = `Hybrid: only ${Math.round(layers * attnFrac / 100)} of ${layers} layers cache KV.`;
  }

  const org = nameParts.length > 1 ? nameParts[0] : 'Other';

  // Derive native bytes/param from HuggingFace safetensors dtype breakdown so we can
  // snap the quant dropdown to whatever HF actually hosts (BF16 → 2, F8 → 1, etc.).
  const avgBytes = info && info.safetensors ? computeAvgBytes(info.safetensors.parameters) : null;
  const nativeWBytes = snapWQuant(avgBytes);

  return {
    group: org,
    id: modelId.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase(),
    hfId: modelId,
    name: modelName,
    arch: isMoe ? 'moe' : 'dense',
    params, active, layers, hidden, heads, kvheads, headdim, attnFrac, slideFrac,
    slideWin: slideFrac > 0 ? slideWin : undefined,
    note: note || undefined,
    nativeWBytes,
    ...(badge ? { badge } : {}),
    ...(source ? { source } : {}),
  };
}
