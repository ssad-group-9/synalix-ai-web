<template>
    <v-container class="user-profile-page">
        <v-row justify="center">
            <v-col cols="12" md="8">
                <div class="page-header">
                    <v-avatar size="80" class="mr-4">
                        <v-img :src="userAvatarUrl" :alt="user?.nickname || '用户'" />
                    </v-avatar>
                    <div>
                        <h1 class="text-h4 mb-2">{{ user?.nickname }}</h1>
                        <p class="text-subtitle-1 text-grey-600">@{{ user?.username }}</p>
                    </div>
                </div>
            </v-col>
        </v-row>

        <!-- 个人信息卡片 -->
        <v-row justify="center">
            <v-col cols="12" md="8">
                <v-card class="mb-6">
                    <v-card-title class="d-flex justify-space-between align-center">
                        个人资料
                        <v-chip :color="user?.enabled ? 'success' : 'error'" size="small">
                            {{ user?.enabled ? '已启用' : '已禁用' }}
                        </v-chip>
                    </v-card-title>
                    <v-card-text>
                        <v-row>
                            <v-col cols="12">
                                <EditableField label="昵称" :value="user?.nickname || ''"
                                    :rules="[requiredRule, nicknameLengthRule]"
                                    @update:value="updateUserField('nickname', $event)" />
                            </v-col>
                            <v-col cols="12">
                                <EditableField label="邮箱" :value="user?.email ?? null" type="email" :rules="[emailRule]"
                                    :nullable="true" @update:value="updateUserField('email', $event)" />
                            </v-col>
                            <v-col cols="12">
                                <div class="field-display">
                                    <span class="field-label">用户名:</span>
                                    <span class="field-value">{{ user?.username }}</span>
                                    <v-chip size="small" class="ml-2">不可修改</v-chip>
                                </div>
                            </v-col>
                            <v-col cols="12">
                                <div class="field-display">
                                    <span class="field-label">角色:</span>
                                    <span class="field-value">
                                        <v-chip :color="user?.role === 'ADMIN' ? 'primary' : 'default'" size="small">
                                            {{ user?.role === 'ADMIN' ? '管理员' : '普通用户' }}
                                        </v-chip>
                                    </span>
                                </div>
                            </v-col>
                            <v-col cols="12">
                                <div class="field-display">
                                    <span class="field-label">注册时间:</span>
                                    <span class="field-value">{{ formatDate(user?.createdAt) }}</span>
                                </div>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>

                <!-- 密码修改卡片 -->
                <v-card class="mb-6">
                    <v-card-title>修改密码</v-card-title>
                    <v-card-text>
                        <v-form ref="passwordFormRef" @submit.prevent="changePassword">
                            <v-row>
                                <v-col cols="12">
                                    <v-text-field 
                                        v-model="passwordForm.oldPassword" 
                                        label="当前密码" 
                                        type="password"
                                        variant="outlined" 
                                        :rules="[requiredRule]" 
                                        autocomplete="current-password"
                                        clearable />
                                </v-col>
                                <v-col cols="12">
                                    <v-text-field 
                                        v-model="passwordForm.newPassword" 
                                        label="新密码" 
                                        type="password"
                                        variant="outlined" 
                                        :rules="[requiredRule, passwordLengthRule]"
                                        autocomplete="new-password"
                                        clearable />
                                </v-col>
                                <v-col cols="12">
                                    <v-text-field 
                                        v-model="passwordForm.confirmPassword" 
                                        label="确认新密码" 
                                        type="password"
                                        variant="outlined" 
                                        :rules="[requiredRule, passwordMatchRule]"
                                        autocomplete="new-password"
                                        clearable />
                                </v-col>
                                <v-col cols="12">
                                    <v-btn type="submit" color="primary" :loading="passwordLoading"
                                        :disabled="!isPasswordFormValid">
                                        修改密码
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </v-form>
                    </v-card-text>
                </v-card>

                <v-btn class="w-100" color="error" variant="outlined" @click="showLogoutDialog = true">
                    退出登录
                </v-btn>
            </v-col>
        </v-row>

        <!-- 退出登录确认对话框 -->
        <v-dialog v-model="showLogoutDialog" max-width="400">
            <v-card>
                <v-card-title>确认退出</v-card-title>
                <v-card-text>
                    您确定要退出登录吗？
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showLogoutDialog = false">取消</v-btn>
                    <v-btn color="error" @click="logout" :loading="logoutLoading">
                        退出
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 全局消息提示 -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
            {{ snackbar.text }}
        </v-snackbar>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { userApi, authApi } from '@/api'
import { getGravatarUrl } from '@/utils/gravatar'
import EditableField from '@/components/EditableField.vue'
import type { User, UpdateUserRequest } from '@/api/types'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const user = ref<User | null>(null)
const passwordFormRef = ref()
const passwordForm = ref({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
})
const passwordLoading = ref(false)
const logoutLoading = ref(false)
const showLogoutDialog = ref(false)
const snackbar = ref({
    show: false,
    text: '',
    color: 'success'
})

// 计算属性
const userAvatarUrl = computed(() => {
    return getGravatarUrl(user.value?.email ?? null, 80)
})

const isPasswordFormValid = computed(() => {
    return passwordForm.value.oldPassword &&
        passwordForm.value.newPassword &&
        passwordForm.value.confirmPassword &&
        passwordForm.value.newPassword === passwordForm.value.confirmPassword &&
        passwordForm.value.newPassword.length >= 6
})

// 表单验证规则
const requiredRule = (v: string) => !!v || '此字段为必填项'
const nicknameLengthRule = (v: string) => (v && v.length >= 1 && v.length <= 100) || '昵称长度应在1-100个字符之间'
const emailRule = (v: string) => {
    if (!v) return true // 邮箱可为空
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(v) || '请输入有效的邮箱地址'
}
const passwordLengthRule = (v: string) => (v && v.length >= 6) || '密码长度至少6个字符'
const passwordMatchRule = (v: string) => {
    if (!v) return '此字段为必填项'
    const newPassword = passwordForm.value?.newPassword || ''
    return v === newPassword || '两次密码输入不一致'
}

// 格式化日期
const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleString('zh-CN')
}

// 显示消息
const showMessage = (text: string, color: 'success' | 'error' | 'info' = 'success') => {
    snackbar.value.text = text
    snackbar.value.color = color
    snackbar.value.show = true
}

// 重置密码表单
const resetPasswordForm = () => {
    passwordForm.value.oldPassword = ''
    passwordForm.value.newPassword = ''
    passwordForm.value.confirmPassword = ''
    if (passwordFormRef.value) {
        passwordFormRef.value.resetValidation()
    }
}

// 获取用户信息
const fetchUserInfo = async () => {
    try {
        const response = await userApi.getCurrentUser()
        user.value = response.data
        authStore.setUser(response.data)
    } catch (error) {
        console.error('获取用户信息失败:', error)
        showMessage('获取用户信息失败', 'error')
    }
}

// 更新用户字段
const updateUserField = async (field: keyof UpdateUserRequest, value: string | null) => {
    try {
        const updateData: UpdateUserRequest = { [field]: value }
        const response = await userApi.updateCurrentUser(updateData)
        user.value = response.data
        authStore.setUser(response.data)
        showMessage('更新成功')
    } catch (error) {
        console.error('更新用户信息失败:', error)
        showMessage('更新失败', 'error')
    }
}

// 修改密码
const changePassword = async () => {
    // 先验证表单
    if (passwordFormRef.value) {
        const { valid } = await passwordFormRef.value.validate()
        if (!valid) return
    }

    if (!isPasswordFormValid.value) return

    passwordLoading.value = true
    try {
        await userApi.changePassword({
            oldPassword: passwordForm.value.oldPassword,
            newPassword: passwordForm.value.newPassword
        })

        // 清空表单
        passwordForm.value.oldPassword = ''
        passwordForm.value.newPassword = ''
        passwordForm.value.confirmPassword = ''

        // 重置表单验证状态
        if (passwordFormRef.value) {
            passwordFormRef.value.reset()
        }

        showMessage('密码修改成功')
    } catch (error) {
        console.error('修改密码失败:', error)
        showMessage('修改密码失败', 'error')
    } finally {
        passwordLoading.value = false
    }
}

// 退出登录
const logout = async () => {
    logoutLoading.value = true
    try {
        if (authStore.refreshToken) {
            await authApi.logout({ refreshToken: authStore.refreshToken })
        }
        // 停止token自动刷新服务
        const { tokenRefreshService } = await import('@/services/tokenRefreshService')
        tokenRefreshService.stopAutoRefresh()
        
        authStore.clearAuth()
        router.push('/overview')
        showMessage('已退出登录')
    } catch (error) {
        console.error('退出登录失败:', error)
        // 即使API调用失败，也清除本地认证状态和停止刷新服务
        const { tokenRefreshService } = await import('@/services/tokenRefreshService')
        tokenRefreshService.stopAutoRefresh()
        
        authStore.clearAuth()
        router.push('/overview')
        showMessage('已退出登录')
    } finally {
        logoutLoading.value = false
        showLogoutDialog.value = false
    }
}

// 组件挂载时获取用户信息
onMounted(() => {
    user.value = authStore.user
    if (authStore.isAuthenticated()) {
        fetchUserInfo()
    }
})
</script>

<style scoped>
.user-profile-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.page-header {
    display: flex;
    align-items: center;
    margin-bottom: 24px;
}

.field-display {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    min-height: 56px;
    margin-bottom: 16px;
}

.field-label {
    font-weight: 500;
    margin-right: 8px;
    min-width: 80px;
}

.field-value {
    flex: 1;
    color: #666;
}
</style>
