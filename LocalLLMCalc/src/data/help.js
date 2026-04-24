export const HELP = {
  model: {
    title: 'Picking a model',
    subtitle: 'Which one should I run?',
    body: `
      <p>Bigger models are generally smarter but need more VRAM. Here's a rough guide:</p>
      <ul>
        <li><strong>7B–9B models</strong> — Run on almost any modern GPU (8+ GB VRAM). Good for chat, basic tasks, fast responses.</li>
        <li><strong>13B–32B models</strong> — Need 12–24 GB VRAM. Solid quality for most tasks. Sweet spot for enthusiasts.</li>
        <li><strong>70B+ models</strong> — Need 24+ GB VRAM (or multiple GPUs). Near-frontier quality.</li>
        <li><strong>MoE models</strong> (e.g., Mixtral, Qwen 3.5 35B-A3B) — "Mixture of Experts." Only a subset of parameters fire per token, so they're fast, but <strong>all</strong> parameters still need to be loaded in VRAM.</li>
      </ul>
      <p>The <strong>Trending</strong> tab shows models currently popular on HuggingFace, with architecture details fetched automatically.</p>
    `,
  },
  quant: {
    title: 'Quantization',
    subtitle: 'Making models smaller',
    body: `
      <p>Quantization compresses model weights by using fewer bits per number. A 16-bit model can be squeezed to 4 bits with surprisingly little quality loss.</p>
      <p><strong>Think of it like image compression:</strong> a PNG is lossless (FP16), a JPEG is smaller but looks nearly identical (Q8), and a heavily compressed JPEG still works but has artifacts (Q2).</p>
      <p><strong>Common choices:</strong></p>
      <ul>
        <li><code>Q4_K_M</code> — The default. ~60% smaller than FP16, almost indistinguishable quality. Use this unless you have a reason not to.</li>
        <li><code>Q5_K_M</code> / <code>Q6_K</code> — Slightly larger, even closer to original quality.</li>
        <li><code>Q8</code> — Nearly lossless, but twice the size of Q4. Only useful if you have VRAM to spare.</li>
        <li><code>Q3_K_M</code> and below — Noticeable quality drop. Last resort.</li>
      </ul>
    `,
  },
  wquant: {
    title: 'Weight quantization',
    subtitle: 'Bits per parameter',
    body: `
      <p>This controls how compressed the model's weights are. Lower = smaller file = less VRAM, but also worse quality.</p>
      <p>A <strong>7B model at FP16</strong> is 14 GB. The <strong>same model at Q4_K_M</strong> is about 4.2 GB — three times smaller, barely noticeable quality loss.</p>
      <p><strong>Which should I use?</strong></p>
      <ul>
        <li>Starting out? Pick <strong>Q4_K_M</strong> — it's the default for good reason.</li>
        <li>Got VRAM to spare? Try <strong>Q6_K</strong> or <strong>Q8</strong>.</li>
        <li>Tight on memory? <strong>Q3_K_M</strong> works but you'll notice degradation.</li>
      </ul>
      <p>"B/p" = bytes per parameter. Q4_K_M uses about 0.6 bytes per weight on average.</p>
    `,
  },
  usecase: {
    title: 'Context length',
    subtitle: 'How much text the model holds in memory',
    body: `
      <p>Context length is how many tokens (roughly, how much text) the model can "see" at once. Longer context = more VRAM needed for the KV cache.</p>
      <p><strong>Rule of thumb:</strong> 1 token ≈ 0.75 English words. So 8K tokens ≈ 6,000 words ≈ a long article.</p>
      <p><strong>What do I actually need?</strong></p>
      <ul>
        <li><strong>Chat (8K)</strong> — Normal back-and-forth conversation. The default for most uses.</li>
        <li><strong>Long docs (32K)</strong> — Summarizing a book chapter, analyzing a long PDF, RAG with several sources.</li>
        <li><strong>Codebase (128K)</strong> — Feeding the model an entire codebase or multiple long documents.</li>
        <li><strong>Max</strong> — The model's maximum supported context (usually only useful for specific agent workflows).</li>
      </ul>
      <p><strong>Important:</strong> Allocating 128K context when you only use 8K wastes VRAM. Set it to what you actually need.</p>
    `,
  },
  gpus: {
    title: 'GPU compatibility',
    subtitle: 'Will it fit?',
    body: `
      <p><strong>Green</strong> — fits comfortably (10%+ headroom).</p>
      <p><strong>Orange</strong> — tight fit, may OOM under load. Risky.</p>
      <p><strong>Red</strong> — won't fit. You'd need to use more quantization, less context, or split across multiple GPUs.</p>
      <p>The listed GPUs assume you're using all VRAM for the model. In practice, keep 1–2 GB free for the OS, display, and other processes — especially on your primary GPU.</p>
    `,
  },
  advanced: {
    title: 'Advanced settings',
    subtitle: 'For custom models',
    body: `
      <p>You probably don't need these if your model is in the preset list. These let you calculate VRAM for any model by entering its architecture manually.</p>
      <p><strong>Where to find these values:</strong> Look up the model on HuggingFace, click "Files and versions," and open <code>config.json</code>. It contains all the architecture fields.</p>
      <p>Key fields to copy:</p>
      <ul>
        <li><code>num_hidden_layers</code> → Layers</li>
        <li><code>hidden_size</code> → Hidden size</li>
        <li><code>num_attention_heads</code> → Attn heads</li>
        <li><code>num_key_value_heads</code> → KV heads</li>
        <li><code>head_dim</code> → Head dim (or calculate: hidden_size ÷ num_attention_heads)</li>
      </ul>
    `,
  },
  params: {
    title: 'Total parameters',
    subtitle: "The 'size' of the model",
    body: `
      <p>Measured in billions (B). A "7B model" has 7 billion parameters — individual numbers that get multiplied and added during inference.</p>
      <p><strong>For MoE models:</strong> this is the <strong>total</strong> parameter count — all experts combined. All of these must fit in VRAM, even though only a few are used per token.</p>
    `,
  },
  active: {
    title: 'Active parameters',
    subtitle: 'MoE only',
    body: `
      <p>In a Mixture-of-Experts (MoE) model, only some of the parameters are "active" for each token — the rest sit idle.</p>
      <p>For example, <strong>Mixtral 8×7B</strong> has 47B total params but only ~13B active per token. That means:</p>
      <ul>
        <li>It <strong>feels</strong> as fast as a 13B model (only 13B worth of math per token).</li>
        <li>But it <strong>needs</strong> as much VRAM as a 47B model (all experts must be loaded).</li>
      </ul>
      <p>MoE = speed of a small model, memory needs of a big one.</p>
    `,
  },
  gqa: {
    title: 'Grouped Query Attention (GQA)',
    subtitle: 'Why modern models need less memory',
    body: `
      <p>Older models like Llama 2 had the same number of "key-value heads" as query heads — lots of KV cache.</p>
      <p>GQA lets multiple query heads share a single KV head, which dramatically shrinks the KV cache. Llama 3 has 64 query heads but only 8 KV heads — <strong>8× smaller KV cache</strong> than if they matched.</p>
      <p>This is why Llama 3 can handle 128K context on hardware that struggled with 4K on Llama 2.</p>
      <p>Check <code>num_key_value_heads</code> in <code>config.json</code>. If it equals <code>num_attention_heads</code>, the model doesn't use GQA.</p>
    `,
  },
  hybrid: {
    title: 'Hybrid attention',
    subtitle: 'Qwen 3.5 / Qwen 3.6',
    body: `
      <p>Standard transformers run attention on every layer — and every layer maintains a KV cache that grows with context length.</p>
      <p>Newer models like <strong>Qwen 3.5/3.6</strong> only use traditional attention on 25% of layers (1 in 4). The other layers use <strong>Gated DeltaNet</strong>, a linear alternative that keeps a fixed-size state regardless of context length.</p>
      <p><strong>Practical result:</strong> Qwen 3.5 27B uses <strong>~4× less KV cache memory</strong> than a standard model its size at long context. This lets it handle massive context windows on modest hardware.</p>
      <p>"Attn layers %" controls what fraction of layers maintain a full KV cache.</p>
    `,
  },
  sliding: {
    title: 'Sliding window attention',
    subtitle: 'Gemma 4',
    body: `
      <p>Sliding window attention limits each layer to only "see" the last N tokens instead of the entire context.</p>
      <p>A layer with a 1024-token window caches only 1024 tokens of KV data regardless of whether your context is 8K or 256K. This is a <strong>huge</strong> memory savings.</p>
      <p><strong>Gemma 4</strong> uses this aggressively: about 83% of its layers use sliding windows (1024 tokens for the larger models), and only 17% use global full-context attention. This is why Gemma 4 31B fits in much less VRAM than a comparable standard model.</p>
    `,
  },
  ctx: {
    title: 'Context length',
    subtitle: 'Custom override',
    body: `
      <p>Number of tokens the model can hold in memory at once. Longer context = larger KV cache = more VRAM.</p>
      <p>1 token ≈ 0.75 English words. So 8K tokens ≈ 6,000 words.</p>
      <p><strong>This overrides the "What will you use it for?" picker.</strong> Set it only if you have a specific length in mind.</p>
    `,
  },
  batch: {
    title: 'Batch size',
    subtitle: 'Concurrent users/requests',
    body: `
      <p>How many sequences the model processes simultaneously.</p>
      <p><strong>Batch 1</strong> — Single user (you). Default for local use.</p>
      <p><strong>Batch 8–16</strong> — Small-team server, multi-agent workloads.</p>
      <p><strong>Batch 32–64</strong> — Production server serving many users.</p>
      <p>Each concurrent sequence needs its own KV cache, so VRAM grows roughly linearly with batch size.</p>
    `,
  },
  kvquant: {
    title: 'KV cache quantization',
    subtitle: 'Compressing the running memory',
    body: `
      <p>The KV cache stores intermediate attention data for every token in context. It can be quantized just like model weights.</p>
      <p><strong>FP16</strong> — Default. Full quality.</p>
      <p><strong>Q8</strong> — Halves the KV cache memory with essentially no quality impact. Great free win.</p>
      <p><strong>Q4</strong> — Quarters the KV cache. Small quality cost on long contexts, but often worth it to fit bigger models.</p>
      <p>In <strong>llama.cpp</strong>, enable with: <code>--cache-type-k q8_0 --cache-type-v q8_0</code></p>
    `,
  },
  unified: {
    title: 'Unified memory',
    subtitle: 'Mac, Strix Halo',
    body: `
      <p>On Apple Silicon and AMD Strix Halo, the "VRAM" is actually system memory shared between the CPU and GPU. The OS decides how much of it the GPU can use.</p>
      <p><strong>macOS default:</strong> roughly 75% of installed memory is usable by the GPU. A 192 GB Mac Studio gets about 144 GB of usable model capacity.</p>
      <p><strong>Strix Halo:</strong> BIOS can be configured to allocate most memory to the GPU — assume ~90% usable as a rule of thumb.</p>
      <p>The slider lets you override this if your configuration is different.</p>
    `,
  },
  multigpu: {
    title: 'Multi-GPU',
    subtitle: 'Adding GPUs together',
    body: `
      <p>When a model is split across multiple GPUs (tensor or pipeline parallel), the usable memory is roughly the sum of each GPU's VRAM.</p>
      <p><strong>This calculator uses a naive sum with no penalty.</strong> In practice, tensor-parallel communication introduces some overhead and partial replication; real-world usable VRAM is typically 90–95% of the sum.</p>
      <p>Build your hardware setup by adding GPU rows — remove rows to simulate a single-card setup.</p>
    `,
  },
};
