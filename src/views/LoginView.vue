<template>
    <v-app>
        <v-main class="login-main">
            <v-container class="login-container">
                <v-row justify="center" align="center" class="fill-height">
                    <v-col cols="12" sm="8" md="6" lg="4" xl="3">
                        <!-- 登录卡片 -->
                        <v-card class="login-card" elevation="8">
                            <!-- 头部 -->
                            <v-card-title class="text-center py-6">
                                <div class="login-header">
                                    <v-icon icon="mdi-brain" size="48" color="primary" class="mb-3" />
                                    <h2 class="text-h4 font-weight-bold text-primary">Synalix AI</h2>
                                    <p class="text-subtitle-1 text-grey-600 mt-2">大模型训练管理平台</p>
                                </div>
                            </v-card-title>

                            <!-- 登录表单 -->
                            <v-card-text class="px-8 pb-8">
                                <v-form ref="loginForm" @submit.prevent="handleLogin">
                                    <v-text-field v-model="loginData.username" label="用户名"
                                        prepend-inner-icon="mdi-account" variant="outlined"
                                        :rules="[requiredRule, usernameLengthRule]"
                                        :error-messages="fieldErrors.username" autocomplete="username" class="mb-3" />

                                    <v-text-field v-model="loginData.password" label="密码" type="password"
                                        prepend-inner-icon="mdi-lock" variant="outlined"
                                        :rules="[requiredRule, passwordLengthRule]"
                                        :error-messages="fieldErrors.password" autocomplete="current-password"
                                        class="mb-4" />

                                    <!-- 错误信息显示 -->
                                    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4"
                                        :text="errorMessage" />

                                    <!-- 登录按钮 -->
                                    <v-btn type="submit" color="primary" size="large" block :loading="loading"
                                        :disabled="!isFormValid" class="mb-3">
                                        登录
                                    </v-btn>
                                </v-form>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authApi, userApi } from '@/api'
import type { AxiosError } from 'axios'
import type { ApiErrorResponse } from '@/api/types'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 响应式数据
const loginForm = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const loading = ref(false)
const errorMessage = ref('')
const loginData = ref({
    username: '',
    password: ''
})

const fieldErrors = ref({
    username: [] as string[],
    password: [] as string[]
})

// 表单验证规则
const requiredRule = (v: string) => !!v || '此字段为必填项'
const usernameLengthRule = (v: string) => (v && v.length >= 3 && v.length <= 50) || '用户名长度应在3-50个字符之间'
const passwordLengthRule = (v: string) => (v && v.length >= 6) || '密码长度至少6个字符'

// 计算属性
const isFormValid = computed(() => {
    return loginData.value.username.length >= 3 &&
        loginData.value.username.length <= 50 &&
        loginData.value.password.length >= 6
})

// 清除错误信息
const clearErrors = () => {
    errorMessage.value = ''
    fieldErrors.value = {
        username: [],
        password: []
    }
}

// 处理登录
const handleLogin = async () => {
    // 验证表单
    const validationResult = await loginForm.value?.validate()
    if (!validationResult?.valid) return

    loading.value = true
    clearErrors()

    try {
        // 调用登录API
        const loginResponse = await authApi.login({
            username: loginData.value.username,
            password: loginData.value.password
        })

        // 保存tokens
        authStore.setTokens(loginResponse.data.accessToken, loginResponse.data.refreshToken)

        // 获取用户信息
        try {
            const userResponse = await userApi.getCurrentUser()
            authStore.setUser(userResponse.data)
        } catch (userError) {
            console.warn('获取用户信息失败，但登录成功:', userError)
        }

        // 重定向到目标页面或默认页面
        const redirect = (route.query.redirect as string) || '/overview'
        router.push(redirect)

    } catch (error) {
        console.error('登录失败:', error)

        const axiosError = error as AxiosError<ApiErrorResponse>

        if (axiosError.response?.status === 400) {
            // 处理字段验证错误
            const errorData = axiosError.response.data
            if (errorData.code === 'VALIDATION_ERROR' && errorData.details) {
                // 如果后端返回具体字段错误，处理字段错误
                // 这里假设后端会返回字段级别的错误信息
                errorMessage.value = errorData.message || '请检查输入的用户名和密码'
            } else {
                errorMessage.value = errorData.message || '请检查输入的用户名和密码'
            }
        } else if (axiosError.response?.status === 401) {
            errorMessage.value = '用户名或密码错误'
        } else if (axiosError.response?.status === 403) {
            errorMessage.value = '账户已被禁用，请联系管理员'
        } else {
            errorMessage.value = '登录失败，请稍后重试'
        }
    } finally {
        loading.value = false
    }
}

// 组件挂载时检查是否已经登录
onMounted(() => {
    // 如果已经登录，直接跳转
    if (authStore.isAuthenticated()) {
        const redirect = (route.query.redirect as string) || '/overview'
        router.push(redirect)
    }
})
</script>

<style scoped>
.login-main {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

.login-container {
    height: 100vh;
}

.login-card {
    border-radius: 16px;
    overflow: hidden;
}

.login-header {
    text-align: center;
}

.fill-height {
    min-height: 100vh;
}

/* 添加一些动画效果 */
.login-card {
    animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
    from {
        transform: translateY(50px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

/* 聚焦效果 */
.v-text-field:focus-within {
    transform: scale(1.02);
    transition: transform 0.2s ease;
}

/* 按钮悬停效果 */
.v-btn:hover {
    transform: translateY(-2px);
    transition: transform 0.2s ease;
}
</style>
