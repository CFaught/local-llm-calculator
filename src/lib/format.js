export function fmtCtx(n) {
  if (n >= 1048576) return (n / 1048576).toFixed(n % 1048576 === 0 ? 0 : 1) + 'M';
  if (n >= 1024)    return (n / 1024).toFixed(n % 1024 === 0 ? 0 : 1) + 'K';
  return String(n);
}

export function fmtGB(n) {
  if (n < 1)   return (n * 1024).toFixed(0) + ' MB';
  if (n < 10)  return n.toFixed(2) + ' GB';
  if (n < 100) return n.toFixed(1) + ' GB';
  return n.toFixed(0) + ' GB';
}

export function kvDesc(r) {
  const parts = [];
  if (r.fullAttnLayers > 0) parts.push(`${r.fullAttnLayers} full × ${fmtCtx(r.ctx)}`);
  if (r.slidingLayers > 0)  parts.push(`${r.slidingLayers} slide × ${fmtCtx(Math.min(r.ctx, r.slideWin))}`);
  if (r.linearLayers > 0)   parts.push(`${r.linearLayers} linear (no KV)`);
  return `${parts.join(' + ')} · ${r.kvheads}kv × ${r.headDim}d · ${r.kvBytes}B × batch ${r.batch}`;
}

export function fmtParams(p) {
  if (p == null) return '—';
  if (p >= 100) return p.toFixed(0) + 'B';
  if (p >= 10) return p.toFixed(0) + 'B';
  return p.toFixed(1) + 'B';
}
