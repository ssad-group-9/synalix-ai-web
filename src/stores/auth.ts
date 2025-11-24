import { defineStore } from 'pinia'
import { ref } from 'vue'

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

    const setTokens = (access: string, refresh: string) => {
      accessToken.value = access
      refreshToken.value = refresh
    }

    const setUser = (userData: User) => {
      user.value = userData
    }

    const clearAuth = () => {
      accessToken.value = null
      refreshToken.value = null
      user.value = null
    }

    const isAuthenticated = () => {
      return !!accessToken.value
    }

    const isAdmin = () => {
      return user.value?.role === 'ADMIN'
    }

    return {
      accessToken,
      refreshToken,
      user,
      setTokens,
      setUser,
      clearAuth,
      isAuthenticated,
      isAdmin,
    }
  },
  {
    persist: true,
  },
)
