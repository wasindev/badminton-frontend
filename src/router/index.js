import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../views/Dashboard.vue";
import ManagePlayers from '../views/ManagePlayers.vue';

const routes = [
  {
    // ตั้งค่าหน้า ManagePlayers ให้เป็นหน้าแรก
    path: "/",
    name: "manage-players",
    component: ManagePlayers,
  },
  {
    // ย้าย Dashboard ไปที่ path /dashboard
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;