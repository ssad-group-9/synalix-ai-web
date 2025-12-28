import { authApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

/**
 * Token刷新服务
 * 负责在access token即将过期前自动刷新
 */
class TokenRefreshService {
    private refreshTimer: number | null = null
    private isRefreshing = false

    // Access token有效期 (5分钟 = 300000ms)
    private readonly ACCESS_TOKEN_EXPIRATION = 300000
    // 提前刷新时间 (提前1分钟刷新 = 60000ms)
    private readonly REFRESH_BEFORE_EXPIRY = 60000

    /**
     * 启动token自动刷新
     */
    startAutoRefresh() {
        this.stopAutoRefresh() // 先停止之前的定时器

        const authStore = useAuthStore()

        if (!authStore.refreshToken) {
            return
        }

        // 计算刷新时间：在token过期前1分钟刷新
        const refreshInterval = this.ACCESS_TOKEN_EXPIRATION - this.REFRESH_BEFORE_EXPIRY

        console.log(`Token自动刷新已启动，将在 ${refreshInterval / 1000} 秒后刷新`)

        this.refreshTimer = window.setInterval(() => {
            this.refreshAccessToken()
        }, refreshInterval)
    }

    /**
     * 停止token自动刷新
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer)
            this.refreshTimer = null
            console.log('Token自动刷新已停止')
        }
    }

    /**
     * 刷新access token
     */
    private async refreshAccessToken() {
        if (this.isRefreshing) {
            console.log('Token刷新进行中，跳过本次刷新')
            return
        }

        const authStore = useAuthStore()

        if (!authStore.refreshToken) {
            console.warn('没有refresh token，停止自动刷新')
            this.stopAutoRefresh()
            return
        }

        this.isRefreshing = true

        try {
            console.log('正在主动刷新access token...')

            const response = await authApi.refresh({
                refreshToken: authStore.refreshToken,
            })

            // 更新access token，保持refresh token不变
            authStore.setTokens(response.data.accessToken, authStore.refreshToken)

            console.log('Access token刷新成功')
        } catch (error) {
            console.error('Token刷新失败:', error)

            // 刷新失败，清除认证信息并重定向到登录页
            this.stopAutoRefresh()
            authStore.clearAuth()

            router.push({
                name: 'login',
                query: { redirect: router.currentRoute.value.fullPath },
            })
        } finally {
            this.isRefreshing = false
        }
    }

    /**
     * 手动触发一次token刷新
     */
    async manualRefresh() {
        await this.refreshAccessToken()
    }
}

// 导出单例实例
export const tokenRefreshService = new TokenRefreshService()
