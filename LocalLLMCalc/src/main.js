import { createApp } from 'vue';
import './styles/tokens.css';
import './styles/global.css';
import App from './App.vue';
import { router } from './router.js';
import { cleanupLegacyKeys } from './lib/modelCache.js';
import { LEGACY_CACHE_KEYS } from './lib/modelSources/index.js';

// One-shot removal of pre-rework cache keys so they don't linger in users'
// localStorage. Safe to run every load — it's a no-op after the first.
cleanupLegacyKeys(LEGACY_CACHE_KEYS);

createApp(App).use(router).mount('#app');
