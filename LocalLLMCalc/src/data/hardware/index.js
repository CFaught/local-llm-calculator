import { apple }            from './apple.js';
import { amdUnified }       from './amd-unified.js';
import { nvidiaConsumer }   from './nvidia-consumer.js';
import { nvidiaDatacenter } from './nvidia-datacenter.js';
import { amdRadeon }        from './amd-radeon.js';
import { intelArc }         from './intel-arc.js';
import { multiGpu }         from './multi-gpu.js';

// Grouped registry. Order defines dropdown optgroup order.
export const HARDWARE_GROUPS = [
  { id: 'apple-silicon',     label: 'Apple Silicon',      items: apple },
  { id: 'amd-unified',       label: 'AMD Strix Halo',     items: amdUnified },
  { id: 'nvidia-consumer',   label: 'NVIDIA GeForce',     items: nvidiaConsumer },
  { id: 'nvidia-datacenter', label: 'NVIDIA Datacenter',  items: nvidiaDatacenter },
  { id: 'amd-radeon',        label: 'AMD Radeon',         items: amdRadeon },
  { id: 'intel-arc',         label: 'Intel Arc',          items: intelArc },
  { id: 'multi-gpu',         label: 'Multi-GPU',          items: multiGpu },
];

// Flat list. Back-compat export for callsites that just iterate.
export const HARDWARE = HARDWARE_GROUPS.flatMap(g => g.items);

// Back-compat alias — old code imports GPUS. New code should prefer HARDWARE.
export { HARDWARE as GPUS };
