// Intel Arc (consumer discrete). ≥8GB VRAM.

const V = 'intel';
const G = 'intel-arc';
const GL = 'Intel Arc';

function entry(name, vram, bandwidth, chipFamily, year) {
  return {
    id:          `intel-${name.toLowerCase().replace(/\s+/g, '-')}`,
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

export const intelArc = [
  // Alchemist
  entry('Arc A750',    8,  512, 'Alchemist',  2022),
  entry('Arc A770',    16, 560, 'Alchemist',  2022),
  // Battlemage
  entry('Arc B570',    10, 380, 'Battlemage', 2025),
  entry('Arc B580',    12, 456, 'Battlemage', 2024),
  entry('Arc B770',    16, 576, 'Battlemage', 2025),
];
