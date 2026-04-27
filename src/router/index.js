import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../views/Dashboard.vue";
import ManagePlayers from '../views/ManagePlayers.vue'; // เช็ค Path ให้ตรงนะครับ

const routes = [
  {
    path: "/",
    component: Dashboard,
  },
  {
    path: '/manage-players',
    name: 'manage.players',
    component: ManagePlayers
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
