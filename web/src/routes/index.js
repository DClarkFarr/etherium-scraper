import { createRouter, createWebHistory } from "vue-router";

import Home from "../pages/Home.vue";
import Address from "../pages/Address.vue";

const routes = [
    { path: "/", component: Home },
    { path: "/address", component: Address },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
