// Apple Silicon — unified memory (CPU + GPU + ANE share one pool).
// `usablePctDefault: 75` reflects typical macOS cap; configurable via sysctl.
// Memory tiers listed are ones Apple shipped in a retail product. Review
// against the Apple "Compare Mac" page when refreshing.

const V = 'apple';
const G = 'apple-silicon';
const GL = 'Apple Silicon';

function entry(chip, mem, bandwidth, year, productExample) {
  return {
    id:               `apple-${chip.toLowerCase().replace(/\s+/g, '-')}-${mem}gb`,
    name:             `Apple ${chip} ${mem}GB`,
    vendor:           V,
    group:            G,
    groupLabel:       GL,
    vram:             mem,
    bandwidth,
    unified:          true,
    usablePctDefault: 75,
    chipFamily:       chip,
    releaseYear:      year,
    productExample,
  };
}

export const apple = [
  // M1 (2020)
  entry('M1',       8,   68,   2020, 'MacBook Air / Mac mini'),
  entry('M1',       16,  68,   2020, 'MacBook Air / Mac mini / iMac'),
  entry('M1 Pro',   16,  200,  2021, 'MacBook Pro 14"/16"'),
  entry('M1 Pro',   32,  200,  2021, 'MacBook Pro 14"/16"'),
  entry('M1 Max',   32,  400,  2021, 'MacBook Pro 16" / Mac Studio'),
  entry('M1 Max',   64,  400,  2021, 'MacBook Pro 16" / Mac Studio'),
  entry('M1 Ultra', 64,  800,  2022, 'Mac Studio'),
  entry('M1 Ultra', 128, 800,  2022, 'Mac Studio'),

  // M2 (2022)
  entry('M2',       8,   100,  2022, 'MacBook Air / Mac mini'),
  entry('M2',       16,  100,  2022, 'MacBook Air / Mac mini'),
  entry('M2',       24,  100,  2022, 'MacBook Air / Mac mini'),
  entry('M2 Pro',   16,  200,  2023, 'MacBook Pro / Mac mini'),
  entry('M2 Pro',   32,  200,  2023, 'MacBook Pro / Mac mini'),
  entry('M2 Max',   32,  400,  2023, 'MacBook Pro 16" / Mac Studio'),
  entry('M2 Max',   64,  400,  2023, 'MacBook Pro 16" / Mac Studio'),
  entry('M2 Max',   96,  400,  2023, 'MacBook Pro 16" / Mac Studio'),
  entry('M2 Ultra', 64,  800,  2023, 'Mac Studio / Mac Pro'),
  entry('M2 Ultra', 128, 800,  2023, 'Mac Studio / Mac Pro'),
  entry('M2 Ultra', 192, 800,  2023, 'Mac Studio / Mac Pro'),

  // M3 (2023)
  entry('M3',       8,   100,  2023, 'iMac / MacBook Pro 14"'),
  entry('M3',       16,  100,  2023, 'iMac / MacBook Pro 14"'),
  entry('M3',       24,  100,  2023, 'iMac / MacBook Pro 14"'),
  entry('M3 Pro',   18,  150,  2023, 'MacBook Pro 14"/16"'),
  entry('M3 Pro',   36,  150,  2023, 'MacBook Pro 14"/16"'),
  entry('M3 Max',   36,  300,  2023, 'MacBook Pro 14"/16" (14-core GPU)'),
  entry('M3 Max',   48,  400,  2023, 'MacBook Pro 14"/16"'),
  entry('M3 Max',   64,  400,  2023, 'MacBook Pro 14"/16"'),
  entry('M3 Max',   96,  400,  2023, 'MacBook Pro 16"'),
  entry('M3 Max',   128, 400,  2023, 'MacBook Pro 16"'),
  entry('M3 Ultra', 96,  800,  2025, 'Mac Studio'),
  entry('M3 Ultra', 192, 800,  2025, 'Mac Studio'),
  entry('M3 Ultra', 256, 800,  2025, 'Mac Studio'),
  entry('M3 Ultra', 512, 800,  2025, 'Mac Studio'),

  // M4 (2024)
  entry('M4',       16,  120,  2024, 'iMac / Mac mini / MacBook Pro 14"'),
  entry('M4',       24,  120,  2024, 'iMac / Mac mini / MacBook Pro 14"'),
  entry('M4',       32,  120,  2024, 'iMac / Mac mini / MacBook Pro 14"'),
  entry('M4 Pro',   24,  273,  2024, 'Mac mini / MacBook Pro'),
  entry('M4 Pro',   48,  273,  2024, 'Mac mini / MacBook Pro'),
  entry('M4 Pro',   64,  273,  2024, 'Mac mini / MacBook Pro'),
  entry('M4 Max',   36,  410,  2024, 'MacBook Pro 14"/16"'),
  entry('M4 Max',   48,  546,  2024, 'MacBook Pro 14"/16"'),
  entry('M4 Max',   64,  546,  2024, 'MacBook Pro 14"/16"'),
  entry('M4 Max',   128, 546,  2024, 'MacBook Pro 16" / Mac Studio'),

  // M5 (2025 — base + Pro shipping as of 2026-04-24; Max/Ultra not yet)
  entry('M5',       16,  153,  2025, 'MacBook Pro 14" / iMac'),
  entry('M5',       24,  153,  2025, 'MacBook Pro 14" / iMac'),
  entry('M5',       32,  153,  2025, 'MacBook Pro 14" / iMac'),
  entry('M5 Pro',   24,  290,  2025, 'MacBook Pro 14"/16"'),
  entry('M5 Pro',   48,  290,  2025, 'MacBook Pro 14"/16"'),
  entry('M5 Pro',   64,  290,  2025, 'MacBook Pro 14"/16"'),
];
