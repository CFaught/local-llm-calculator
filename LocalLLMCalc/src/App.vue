<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <div class="wrap">
    <nav class="nav-tabs">
      <RouterLink to="/calc">Model → GPU</RouterLink>
      <RouterLink to="/fit">Hardware → Models</RouterLink>
    </nav>
    <RouterView />
    <footer>
      <div>Estimates only · hybrid architectures approximated · actual usage varies by runtime (llama.cpp, vLLM, Ollama)</div>
      <div>v5.0</div>
    </footer>
  </div>
</template>
