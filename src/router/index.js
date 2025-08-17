import { createRouter, createWebHistory } from 'vue-router';
import Login from '../pages/login.vue';
import Cadastro from '../pages/cadastro.vue';
import ClienteDashboard from '../pages/cliente/dashboard.vue';
import BarbeiroDashboard from '../pages/barbeiro/dashboard.vue';
import ClienteAgendamento from '../pages/cliente/agendamento.vue';
import ClienteHistorico from '../pages/cliente/historico.vue';
import ModoBarbeiro from '../pages/barbeiro/modobarbeiro.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/cadastro', component: Cadastro },
  { path: '/cliente/dashboard', component: ClienteDashboard },
  { path: '/barbeiro/dashboard', component: BarbeiroDashboard },
  { path: '/barbeiro/modobarbeiro', component: ModoBarbeiro },
  { path: '/cliente/agendamento', component: ClienteAgendamento },
  { path: '/cliente/historico', component: ClienteHistorico },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
