// NVIDIA datacenter / workstation cards.
// Bandwidth values from TechPowerUp GPU DB.

const V = 'nvidia';
const G = 'nvidia-datacenter';
const GL = 'NVIDIA Datacenter';

function entry(name, vram, bandwidth, chipFamily, year) {
  return {
    id:          `nvidia-dc-${name.toLowerCase().replace(/\s+/g, '-')}`,
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

export const nvidiaDatacenter = [
  entry('T4',         16,  320,  'Turing',       2018),
  entry('A10',        24,  600,  'Ampere',       2021),
  entry('A40',        48,  696,  'Ampere',       2020),
  entry('L4',         24,  300,  'Ada Lovelace', 2023),
  entry('L40',        48,  864,  'Ada Lovelace', 2022),
  entry('L40S',       48,  864,  'Ada Lovelace', 2023),
  entry('A100 40GB',  40,  1555, 'Ampere',       2020),
  entry('A100 80GB',  80,  2039, 'Ampere',       2021),
  entry('H100 80GB',  80,  3350, 'Hopper',       2022),
  entry('H200',       141, 4800, 'Hopper',       2024),
  entry('B100',       192, 8000, 'Blackwell',    2025),
  entry('B200',       192, 8000, 'Blackwell',    2025),
  entry('GB200',      384, 8000, 'Blackwell',    2025),
];
