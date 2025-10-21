import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "single",
    component: () => import("@/views/Main.vue"),
    meta: {
      title: "Card extractor",
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, _from, next) => {
  // Update document title
  if (to.meta.title) {
    document.title = `${to.meta.title} - Card Extractor`;
  }
  next();
});

export default router;
