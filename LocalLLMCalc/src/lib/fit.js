// Classification thresholds mirror the original index.html gpuList computed (10% headroom for 'fit').
export function classifyFit(totalGB, usableVRAM) {
  if (usableVRAM >= totalGB * 1.1) return 'fit';
  if (usableVRAM >= totalGB) return 'tight';
  return 'nofit';
}

// Human-readable reason for tight/no-fit rows. Uses the computeVram breakdown.
export function fitReason(result, usableVRAM) {
  const delta = result.totalGB - usableVRAM;
  if (delta <= 0) return null;
  // Pick the dominant contributor to suggest a lever to pull.
  const parts = [
    { name: 'weights', gb: result.weightsGB, lever: 'try a smaller quant' },
    { name: 'KV cache', gb: result.kvGB, lever: 'reduce context length' },
  ];
  parts.sort((a, b) => b.gb - a.gb);
  const top = parts[0];
  if (top.gb > result.totalGB * 0.5) {
    return `${top.name} is ${top.gb.toFixed(1)} GB — ${top.lever}`;
  }
  return `needs +${delta.toFixed(1)} GB`;
}
