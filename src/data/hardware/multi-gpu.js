// Composite multi-GPU configurations. Bandwidth is per-card; total effective
// bandwidth depends on interconnect (PCIe vs NVLink) and isn't modeled here.

const G = 'multi-gpu';
const GL = 'Multi-GPU';

export const multiGpu = [
  {
    id:               'multi-2x-rtx-4090',
    name:             '2× RTX 4090',
    vendor:           'multi',
    group:            G,
    groupLabel:       GL,
    vram:             48,
    bandwidth:        1008,
    chipFamily:       'Ada Lovelace ×2',
    releaseYear:      2022,
  },
  {
    id:               'multi-2x-rtx-5090',
    name:             '2× RTX 5090',
    vendor:           'multi',
    group:            G,
    groupLabel:       GL,
    vram:             64,
    bandwidth:        1792,
    chipFamily:       'Blackwell ×2',
    releaseYear:      2025,
  },
  {
    id:               'multi-2x-a100-80gb',
    name:             '2× A100 80GB',
    vendor:           'multi',
    group:            G,
    groupLabel:       GL,
    vram:             160,
    bandwidth:        2039,
    chipFamily:       'Ampere ×2',
    releaseYear:      2021,
  },
  {
    id:               'multi-2x-h100-80gb',
    name:             '2× H100 80GB',
    vendor:           'multi',
    group:            G,
    groupLabel:       GL,
    vram:             160,
    bandwidth:        3350,
    chipFamily:       'Hopper ×2',
    releaseYear:      2022,
  },
];
