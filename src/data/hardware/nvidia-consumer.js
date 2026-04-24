// NVIDIA GeForce (consumer). ≥8GB VRAM, 2020+ releases.
// Bandwidth values from TechPowerUp GPU DB (see _techpowerup-snapshot.json).

const V = 'nvidia';
const G = 'nvidia-consumer';
const GL = 'NVIDIA GeForce';

function entry(name, vram, bandwidth, chipFamily, year) {
  return {
    id:          `nvidia-${name.toLowerCase().replace(/\s+/g, '-')}`,
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

export const nvidiaConsumer = [
  // RTX 20 series (Turing, ≥8GB only)
  entry('RTX 2070 Super',  8,  448,  'Turing',        2019),
  entry('RTX 2080',        8,  448,  'Turing',        2018),
  entry('RTX 2080 Super',  8,  496,  'Turing',        2019),
  entry('RTX 2080 Ti',     11, 616,  'Turing',        2018),

  // RTX 30 series (Ampere)
  entry('RTX 3060',        12, 360,  'Ampere',        2021),
  entry('RTX 3060 Ti',     8,  448,  'Ampere',        2020),
  entry('RTX 3070',        8,  448,  'Ampere',        2020),
  entry('RTX 3070 Ti',     8,  608,  'Ampere',        2021),
  entry('RTX 3080 10GB',   10, 760,  'Ampere',        2020),
  entry('RTX 3080 12GB',   12, 912,  'Ampere',        2022),
  entry('RTX 3080 Ti',     12, 912,  'Ampere',        2021),
  entry('RTX 3090',        24, 936,  'Ampere',        2020),
  entry('RTX 3090 Ti',     24, 1008, 'Ampere',        2022),

  // RTX 40 series (Ada Lovelace)
  entry('RTX 4060',        8,  272,  'Ada Lovelace',  2023),
  entry('RTX 4060 Ti 8GB', 8,  288,  'Ada Lovelace',  2023),
  entry('RTX 4060 Ti 16GB',16, 288,  'Ada Lovelace',  2023),
  entry('RTX 4070',        12, 504,  'Ada Lovelace',  2023),
  entry('RTX 4070 Super',  12, 504,  'Ada Lovelace',  2024),
  entry('RTX 4070 Ti',     12, 504,  'Ada Lovelace',  2023),
  entry('RTX 4070 Ti S',   16, 672,  'Ada Lovelace',  2024),
  entry('RTX 4080',        16, 716,  'Ada Lovelace',  2022),
  entry('RTX 4080 Super',  16, 736,  'Ada Lovelace',  2024),
  entry('RTX 4090',        24, 1008, 'Ada Lovelace',  2022),

  // RTX 50 series (Blackwell)
  entry('RTX 5070',        12, 672,  'Blackwell',     2025),
  entry('RTX 5070 Ti',     16, 896,  'Blackwell',     2025),
  entry('RTX 5080',        16, 960,  'Blackwell',     2025),
  entry('RTX 5090',        32, 1792, 'Blackwell',     2025),
];
