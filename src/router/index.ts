import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import OverviewView from '../views/OverviewView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/overview',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: {
        title: '登录',
        hideToolbar: true,
        requiresGuest: true, // 只允许未登录用户访问
      },
    },
    {
      path: '/overview',
      name: 'overview',
      component: OverviewView,
      meta: {
        title: '概览',
        requiresAuth: true,
      },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminConsoleView.vue'),
      meta: {
        title: '管理控制台',
        requiresAuth: true,
        requiresAdmin: true,
        hideToolbar: true,
      },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/UserProfileView.vue'),
      meta: {
        title: '用户信息',
        requiresAuth: true,
      },
    },
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated()

  // 如果访问需要游客身份的页面（如登录页），但用户已登录
  if (to.meta.requiresGuest && isAuthenticated) {
    next('/overview')
    return
  }

  // 检查是否需要认证
  if (to.meta.requiresAuth && !isAuthenticated) {
    // 重定向到登录页面，并保存目标路由
    next({
      name: 'login',
      query: { redirect: to.fullPath },
    })
    return
  }

  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin && !authStore.isAdmin()) {
    // 重定向到概览页面
    next('/overview')
    return
  }

  next()
})

export default router
