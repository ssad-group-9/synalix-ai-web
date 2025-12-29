import axios from 'axios'
import type { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import type { RefreshTokenResponse, ApiErrorResponse } from './types'

// 创建axios实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 50000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 自动注入token
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const token = authStore.accessToken

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器 - 处理token刷新和错误处理
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const authStore = useAuthStore()
    const originalRequest = error.config

    // 如果是401错误且不是登录或刷新token的请求
    if (error.response?.status === 401 && originalRequest) {
      const isLoginRequest = originalRequest.url?.includes('/api/auth/login')
      const isRefreshRequest = originalRequest.url?.includes('/api/auth/refresh')

      if (!isLoginRequest && !isRefreshRequest) {
        originalRequest._retry = true
        try {
          // 尝试刷新token
          await authStore.refreshAccessToken()

          // 更新access token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`
          }

          // 重试原始请求
          return apiClient(originalRequest)
        } catch (refreshError) {
          // 刷新token失败，清除认证信息并重定向到登录页
          authStore.clearAuth()
          router.push({
            name: 'login',
            query: { redirect: router.currentRoute.value.fullPath },
          })
          return Promise.reject(refreshError)
        }
      } else if (!isLoginRequest) {
        // 没有refresh token或刷新失败，重定向到登录页
        authStore.clearAuth()
        router.push({
          name: 'login',
          query: { redirect: router.currentRoute.value.fullPath },
        })
      }
    }

    return Promise.reject(error)
  },
)

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}

export default apiClient
