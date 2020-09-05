import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import Signer from '@/views/Sign.vue';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  { path: '/', name: 'home', component: Signer },
  { path: '/*', name: 'error-404', beforeEnter: (to, from, next) => next('/') }
];

const router = new VueRouter({
  mode: 'hash',
  routes
});

export default router;
