<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { computed, ref, watch } from 'vue';

const THEME_KEY = 'localllmcalc-theme';
const savedTheme = localStorage.getItem(THEME_KEY);
const theme = ref(savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark');
const isLight = computed(() => theme.value === 'light');

watch(theme, value => {
  document.documentElement.dataset.theme = value;
  localStorage.setItem(THEME_KEY, value);
}, { immediate: true });

const toggleTheme = () => {
  theme.value = isLight.value ? 'dark' : 'light';
};
</script>

<template>
  <div class="wrap">
    <div class="app-chrome">
      <nav class="nav-tabs">
        <RouterLink to="/calc">Model → GPU</RouterLink>
        <RouterLink to="/fit">Hardware → Models</RouterLink>
      </nav>
      <button
        class="theme-toggle"
        type="button"
        :aria-pressed="isLight"
        @click="toggleTheme"
      >
        <span class="theme-toggle-track">
          <span class="theme-toggle-knob"></span>
        </span>
        <span>{{ isLight ? 'Light' : 'Dark' }}</span>
      </button>
    </div>
    <RouterView />
    <footer>
      <div>Estimates only · hybrid architectures approximated · actual usage varies by runtime (llama.cpp, vLLM, Ollama)</div>
      <div>v5.0</div>
    </footer>
  </div>
</template>
