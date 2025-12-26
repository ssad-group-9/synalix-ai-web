import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLoadingStore } from '@/stores/loading'
import OverviewView from '../views/OverviewView.vue'

// 应用程序名称
const APP_NAME = 'Synalix AI'

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
      path: '/model-center',
      name: 'model-center',
      component: () => import('../views/model-center/ModelCenterView.vue'),
      meta: {
        title: '模型中心',
        requiresAuth: true,
      },
    },
    {
      path: '/task-management',
      name: 'task-management',
      component: () => import('../views/task-management/TaskManagementView.vue'),
      meta: {
        title: '任务管理',
        requiresAuth: true,
      },
    },
    {
      path: '/dataset-management',
      name: 'dataset-management',
      component: () => import('../views/dataset-management/DatasetManagementView.vue'),
      meta: {
        title: '数据集管理',
        requiresAuth: true,
      },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/admin/AdminConsoleView.vue'),
      meta: {
        title: '管理控制台',
        requiresAuth: true,
        requiresAdmin: true,
        hideToolbar: true,
      },
      children: [
        {
          path: '',
          redirect: '/admin/users',
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('../views/admin/UserManagementView.vue'),
          meta: {
            title: '用户管理',
            requiresAuth: true,
            requiresAdmin: true,
            hideToolbar: true,
          },
        },
        {
          path: 'gpu',
          name: 'admin-gpu',
          component: () => import('../views/admin/GpuManagementView.vue'),
          meta: {
            title: 'GPU管理',
            requiresAuth: true,
            requiresAdmin: true,
            hideToolbar: true,
          },
        },
      ],
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
    {
      path: '/chat',
      name: 'chat',
      component: () => import('../views/chat/ChatView.vue'),
      meta: {
        title: '聊天交互',
        requiresAuth: true,
      },
    },
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const loadingStore = useLoadingStore()
  const isAuthenticated = authStore.isAuthenticated()

  // 开始加载
  loadingStore.startLoading()

  // 如果访问需要游客身份的页面（如登录页），但用户已登录
  if (to.meta.requiresGuest && isAuthenticated) {
    loadingStore.stopLoading()
    next('/overview')
    return
  }

  // 检查是否需要认证
  if (to.meta.requiresAuth && !isAuthenticated) {
    // 清除可能残留的无效认证信息
    authStore.clearAuth()

    // 重定向到登录页面，并保存目标路由
    loadingStore.stopLoading()
    next({
      name: 'login',
      query: { redirect: to.fullPath },
    })
    return
  }

  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin && !authStore.isAdmin()) {
    // 重定向到概览页面
    loadingStore.stopLoading()
    next('/overview')
    return
  }

  next()
})

// 路由完成后停止加载并更新页面标题
router.afterEach((to) => {
  const loadingStore = useLoadingStore()
  // 等待页面内容渲染完成后开始完成动画
  setTimeout(() => {
    loadingStore.stopLoading()
  }, 50) // 短暂延迟确保页面开始渲染

  // 更新页面标题
  const pageTitle = to.meta.title as string
  if (pageTitle) {
    document.title = `${pageTitle} - ${APP_NAME}`
  } else {
    document.title = APP_NAME
  }
})

export default router
