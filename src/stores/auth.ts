import { defineStore } from 'pinia'
import { ref, onBeforeUnmount } from 'vue'
import router from '@/router';
import apiClient from '../api/client'

export interface User {
  id: string
  username: string
  nickname: string
  email: string | null
  role: 'USER' | 'ADMIN'
  enabled: boolean
  createdAt: string
}

export const useAuthStore = defineStore(
  'auth',
  () => {
    const accessToken = ref<string | null>(null)
    const refreshToken = ref<string | null>(null)
    const user = ref<User | null>(null)
    const refreshTimer = ref<number | null>(null)

    const setTokens = (access: string, refresh: string) => {
      if (!access) {
        throw new Error('Access token is required');
      }
      accessToken.value = access;
      refreshToken.value = refresh;

      const tokenParts = access.split('.');
      if (tokenParts.length < 2) {
        throw new Error('Invalid access token format');
      }

      scheduleTokenRefresh(300000)
    }

    const setUser = (userData: User) => {
      user.value = userData
    }

    const clearAuth = () => {
      accessToken.value = null;
      refreshToken.value = null;
      user.value = null;
      if (refreshTimer.value) {
        clearTimeout(refreshTimer.value);
        refreshTimer.value = null;
      }
    }

    const isAuthenticated = () => {
      return !!accessToken.value
    }

    const isAdmin = () => {
      return user.value?.role === 'ADMIN'
    }

    const scheduleTokenRefresh = (expiresIn: number) => {
      if (refreshTimer.value) {
        clearTimeout(refreshTimer.value)
      }
      refreshTimer.value = window.setTimeout(async () => {
        try {
          await refreshAccessToken()
        } catch (error) {
          clearAuth()
          router.push({ name: 'login' })
        }
      }, expiresIn - 60000) // 提前1分钟刷新
    }

    const refreshAccessToken = async () => {
      if (!refreshToken.value) {
        throw new Error('No refresh token available')
      }
      const response = await apiClient.post('/api/auth/refresh', {
        refreshToken: refreshToken.value!, // 添加非空断言
      })
      setTokens(response.data.accessToken, refreshToken.value!)
      scheduleTokenRefresh(300000)
    }

    onBeforeUnmount(() => {
      if (refreshTimer.value) {
        clearTimeout(refreshTimer.value)
      }
    })

    return {
      accessToken,
      refreshToken,
      user,
      setTokens,
      setUser,
      clearAuth,
      isAuthenticated,
      isAdmin,
      scheduleTokenRefresh,
      refreshAccessToken,
    }
  },
  {
    persist: true,
  },
)
