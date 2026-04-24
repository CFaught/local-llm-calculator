import { createRouter, createWebHashHistory } from 'vue-router';
import CalcView from './views/CalcView.vue';
import FitView from './views/FitView.vue';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/calc' },
    { path: '/calc', name: 'calc', component: CalcView, meta: { title: 'Model → GPU' } },
    { path: '/fit',  name: 'fit',  component: FitView,  meta: { title: 'Hardware → Models' } },
  ],
});
