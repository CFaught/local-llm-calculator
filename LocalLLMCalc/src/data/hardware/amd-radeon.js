// AMD Radeon (consumer discrete). ≥8GB VRAM.

const V = 'amd';
const G = 'amd-radeon';
const GL = 'AMD Radeon';

function entry(name, vram, bandwidth, chipFamily, year) {
  return {
    id:          `amd-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    vendor:      V,
    group:       G,
    groupLabel:  GL,
    vram,
    bandwidth,
    chipFamily,
    releaseYear: year,
  };
}

export const amdRadeon = [
  // RX 6000 series (RDNA 2)
  entry('RX 6600',      8,  224,  'RDNA 2', 2021),
  entry('RX 6650 XT',   8,  280,  'RDNA 2', 2022),
  entry('RX 6700 XT',   12, 384,  'RDNA 2', 2021),
  entry('RX 6750 XT',   12, 432,  'RDNA 2', 2022),
  entry('RX 6800',      16, 512,  'RDNA 2', 2020),
  entry('RX 6800 XT',   16, 512,  'RDNA 2', 2020),
  entry('RX 6900 XT',   16, 512,  'RDNA 2', 2020),
  entry('RX 6950 XT',   16, 576,  'RDNA 2', 2022),

  // RX 7000 series (RDNA 3)
  entry('RX 7600 XT',   16, 288,  'RDNA 3', 2024),
  entry('RX 7700 XT',   12, 432,  'RDNA 3', 2023),
  entry('RX 7800 XT',   16, 624,  'RDNA 3', 2023),
  entry('RX 7900 GRE',  16, 576,  'RDNA 3', 2023),
  entry('RX 7900 XT',   20, 800,  'RDNA 3', 2022),
  entry('RX 7900 XTX',  24, 960,  'RDNA 3', 2022),

  // RX 9000 series (RDNA 4)
  entry('RX 9060 XT',   16, 320,  'RDNA 4', 2025),
  entry('RX 9070',      16, 640,  'RDNA 4', 2025),
  entry('RX 9070 XT',   16, 640,  'RDNA 4', 2025),
];
