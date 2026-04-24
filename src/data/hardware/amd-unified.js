// AMD Strix Halo (Ryzen AI Max+ 395) products — unified memory devices.
// All use LPDDR5X at ~256 GB/s theoretical bandwidth. usablePctDefault: 90
// reflects typical BIOS/driver split for dedicated GPU memory.

const V = 'amd';
const G = 'amd-unified';
const GL = 'AMD Strix Halo';
const CHIP = 'Strix Halo';
const BW = 256;

function entry(product, mem, year) {
  return {
    id:               `strix-halo-${product.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${mem}gb`,
    name:             `${product} — ${mem}GB`,
    vendor:           V,
    group:            G,
    groupLabel:       GL,
    vram:             mem,
    bandwidth:        BW,
    unified:          true,
    usablePctDefault: 90,
    chipFamily:       CHIP,
    releaseYear:      year,
    productExample:   product,
  };
}

export const amdUnified = [
  entry('Framework Desktop',   64,  2025),
  entry('Framework Desktop',   128, 2025),
  entry('HP Z2 Mini G1a',      32,  2025),
  entry('HP Z2 Mini G1a',      64,  2025),
  entry('HP Z2 Mini G1a',      96,  2025),
  entry('HP Z2 Mini G1a',      128, 2025),
  entry('GMKtec EVO-X2',       64,  2025),
  entry('GMKtec EVO-X2',       128, 2025),
  entry('Beelink GTR9 Pro',    64,  2025),
  entry('Beelink GTR9 Pro',    128, 2025),
  entry('Minisforum MS-A2',    64,  2025),
  entry('Minisforum MS-A2',    128, 2025),
  entry('Asus ROG Flow Z13',   32,  2025),
  entry('Asus ROG Flow Z13',   64,  2025),
  entry('Asus ROG Flow Z13',   128, 2025),
  entry('Sixunited AI Mini',   64,  2026),
  entry('Sixunited AI Mini',   128, 2026),
  // Generic fallback for users whose specific product isn't listed.
  entry('Ryzen AI Max+ 395 (generic)', 128, 2025),
];
