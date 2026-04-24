# VRAMCalc App

A Vue 3 and Vite app for estimating local LLM memory needs and matching models to available hardware.

The app has two main workflows:

- **Model to GPU**: choose or enter a model, quantization, context length, and architecture details to estimate VRAM usage and identify hardware that can run it.
- **Hardware to Models**: choose one or more GPUs or unified-memory devices and see which loaded model presets fit at the selected quantization and context length.

The estimates are practical planning numbers, not exact runtime guarantees. Real memory usage varies by inference engine, kernels, batching, CUDA or Metal overhead, KV cache settings, and model implementation details.

## Requirements

- Node.js 18 or newer
- npm

## Setup

```bash
npm install
```

## Development

Start the Vite development server:

```bash
npm run dev
```

Build the production bundle:

```bash
npm run build
```

Preview a production build locally:

```bash
npm run preview
```

## Data Refresh Scripts

The repository includes scripts for refreshing generated data used by the app:

```bash
npm run refresh-hardware
npm run refresh-ollama
```

`refresh-hardware` updates hardware snapshot data from TechPowerUp-derived sources. `refresh-ollama` updates the bundled Ollama popular model list. These scripts may require network access and should be reviewed before committing regenerated data.

## Project Structure

```text
src/
  components/        Shared Vue components
  composables/       Model source and search composables
  data/              Bundled model, use-case, and hardware data
  lib/               Estimation, formatting, API, and cache helpers
  styles/            Global styles and design tokens
  views/             Main application screens
scripts/             Data refresh utilities
```

## Repository Notes

`node_modules/` and `dist/` are generated artifacts and are intentionally ignored. Install dependencies with `npm install` and rebuild the production output with `npm run build` when needed.
