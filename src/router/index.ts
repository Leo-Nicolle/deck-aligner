import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'single',
    component: () => import('@/views/SingleMode.vue'),
    meta: {
      title: 'Single Image Mode'
    }
  },
  {
    path: '/batch',
    name: 'batch',
    component: () => import('@/views/BatchMode.vue'),
    meta: {
      title: 'Batch Mode'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  // Update document title
  if (to.meta.title) {
    document.title = `${to.meta.title} - Card Extractor`
  }
  next()
})

export default router
