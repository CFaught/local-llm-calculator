// Pure VRAM calculation. Extracted from the original index.html `result` computed.
// Inputs are raw numbers (fractions in 0..1 — NOT 0..100).
export function computeVram({
  params,
  active,
  arch,
  layers,
  kvheads,
  headDim,
  attnFrac,
  slideFrac,
  slideWin,
  wBytes,
  kvBytes,
  ctx,
  batch,
}) {
  const effAttnFrac    = Math.min(attnFrac, 1.0);
  const effSlideFrac   = Math.min(slideFrac, 1.0 - effAttnFrac);
  const fullAttnLayers = Math.round(layers * effAttnFrac);
  const slidingLayers  = Math.round(layers * effSlideFrac);
  const linearLayers   = layers - fullAttnLayers - slidingLayers;

  const weightsGB      = (params * 1e9 * wBytes) / 1e9;
  const perTokPerLayer = 2 * kvheads * headDim * kvBytes * batch;
  const fullKvBytes    = fullAttnLayers * ctx * perTokPerLayer;
  const slideKvBytes   = slidingLayers * Math.min(ctx, slideWin) * perTokPerLayer;
  const kvGB           = (fullKvBytes + slideKvBytes) / 1e9;

  const sizingParam = arch === 'moe' ? (active ?? params) : params;
  const base        = 0.3 + Math.log10(Math.max(sizingParam, 1)) * 0.35;
  const actGB       = Math.max(0.2, base * batch * (1 + Math.log2(Math.max(ctx / 4096, 1)) * 0.15));
  const overheadGB  = 1.5;
  const totalGB     = weightsGB + kvGB + actGB + overheadGB;

  return {
    weightsGB,
    kvGB,
    actGB,
    overheadGB,
    totalGB,
    fullAttnLayers,
    slidingLayers,
    linearLayers,
    slideWin,
    headDim,
    kvheads,
    layers,
    ctx,
    batch,
    params,
    active,
    wBytes,
    kvBytes,
    arch,
    perTokPerLayer,
  };
}

// Convenience wrapper: take a preset-shaped model object (attnFrac/slideFrac in 0..100)
// and the user's quant/ctx/batch settings, return a full computeVram result.
export function computeForPreset(preset, { wBytes, kvBytes, ctx, batch = 1 }) {
  return computeVram({
    params: preset.params,
    active: preset.active,
    arch: preset.arch,
    layers: preset.layers,
    kvheads: preset.kvheads,
    headDim: preset.headdim ?? Math.round((preset.hidden ?? 4096) / (preset.heads ?? 32)),
    attnFrac: (preset.attnFrac ?? 100) / 100,
    slideFrac: (preset.slideFrac ?? 0) / 100,
    slideWin: preset.slideWin ?? 1024,
    wBytes,
    kvBytes,
    ctx,
    batch,
  });
}
