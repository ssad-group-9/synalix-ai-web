import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

import App from './App.vue'
import router from './router'

// 初始化 MSW（受 VITE_USE_MOCK 控制）
// 默认在开发环境启用。要禁用，请在对应的 .env 文件中设置 VITE_USE_MOCK=false
const shouldUseMock = import.meta.env.DEV && (import.meta.env.VITE_USE_MOCK !== 'false')
if (shouldUseMock) {
  const { worker } = await import('./mocks/worker')
  await worker.start({
    onUnhandledRequest: 'bypass',
  })
}

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
  },
})

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(vuetify)

app.mount('#app')

// 应用启动后，如果已登录则启动token自动刷新
import { useAuthStore } from '@/stores/auth'
import { tokenRefreshService } from '@/services/tokenRefreshService'

const authStore = useAuthStore()
if (authStore.isAuthenticated() && authStore.refreshToken) {
  tokenRefreshService.startAutoRefresh()
}
