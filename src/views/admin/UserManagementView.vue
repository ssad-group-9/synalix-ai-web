<template>
    <div class="user-management">
        <!-- 页面标题和操作按钮 -->
        <div class="page-header">
            <div>
                <h1 class="page-title">用户管理</h1>
                <p class="page-subtitle">管理系统中的所有用户账户</p>
            </div>
            <v-btn
                @click="openCreateUserDialog"
                color="primary"
                prepend-icon="mdi-plus"
                variant="elevated"
                class="create-user-btn"
            >
                创建用户
            </v-btn>
        </div>

        <!-- 用户数据表格 -->
        <v-card class="user-table-card" elevation="2">
            <v-data-table
                :headers="tableHeaders"
                :items="users"
                :loading="loading"
                :items-per-page="10"
                class="user-table"
                hover
            >
                <!-- 头像列 -->
                <template v-slot:item.avatar="{ item }">
                    <v-avatar size="40">
                        <v-img :src="getGravatarUrl(item.email)" :alt="item.nickname" />
                    </v-avatar>
                </template>

                <!-- 用户ID列 -->
                <template v-slot:item.id="{ item }">
                    <span class="text-caption text-medium-emphasis font-mono">{{ item.id.slice(0, 8) }}...</span>
                    <v-tooltip activator="parent" location="top">{{ item.id }}</v-tooltip>
                </template>

                <!-- 角色列 -->
                <template v-slot:item.role="{ item }">
                    <v-chip
                        :color="item.role === 'ADMIN' ? 'primary' : 'default'"
                        variant="tonal"
                        size="small"
                    >
                        {{ item.role === 'ADMIN' ? '管理员' : '用户' }}
                    </v-chip>
                </template>

                <!-- 状态列 -->
                <template v-slot:item.enabled="{ item }">
                    <v-chip
                        :color="item.enabled ? 'success' : 'error'"
                        variant="tonal"
                        size="small"
                    >
                        {{ item.enabled ? '启用' : '禁用' }}
                    </v-chip>
                </template>

                <!-- 创建时间列 -->
                <template v-slot:item.createdAt="{ item }">
                    {{ formatDate(item.createdAt) }}
                </template>

                <!-- 操作列 -->
                <template v-slot:item.actions="{ item }">
                    <div class="action-buttons">
                        <v-btn
                            @click="openEditUserDialog(item)"
                            icon="mdi-pencil"
                            variant="text"
                            size="small"
                            color="primary"
                        >
                            <v-icon size="18" />
                            <v-tooltip activator="parent" location="top">编辑</v-tooltip>
                        </v-btn>
                        <v-btn
                            @click="resetUserPassword(item)"
                            icon="mdi-key-variant"
                            variant="text"
                            size="small"
                            color="orange"
                        >
                            <v-icon size="18" />
                            <v-tooltip activator="parent" location="top">重置密码</v-tooltip>
                        </v-btn>
                        <v-btn
                            @click="confirmDeleteUser(item)"
                            icon="mdi-delete"
                            variant="text"
                            size="small"
                            color="error"
                        >
                            <v-icon size="18" />
                            <v-tooltip activator="parent" location="top">删除</v-tooltip>
                        </v-btn>
                    </div>
                </template>
            </v-data-table>
        </v-card>

        <!-- 创建/编辑用户对话框 -->
        <v-dialog v-model="userDialog" max-width="500px" persistent>
            <v-card>
                <v-card-title class="dialog-title d-flex align-center">
                    <span>{{ isEditing ? '编辑用户' : '创建用户' }}</span>
                    <v-spacer />
                    <v-btn @click="closeUserDialog" icon variant="text" size="small">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>

                <v-card-text class="pb-0">
                    <v-form ref="userForm" v-model="formValid" @submit.prevent="saveUser">
                        <v-row>
                            <v-col cols="12">
                                <v-text-field
                                    v-model="userFormData.username"
                                    label="用户名"
                                    :rules="usernameRules"
                                    :disabled="isEditing"
                                    variant="outlined"
                                    density="comfortable"
                                    :hint="!isEditing ? '用户名一经创建则无法更改' : undefined"
                                    persistent-hint
                                    required
                                />
                            </v-col>
                            <v-col cols="12">
                                <v-text-field
                                    v-model="userFormData.nickname"
                                    label="昵称"
                                    :rules="nicknameRules"
                                    variant="outlined"
                                    density="comfortable"
                                    required
                                />
                            </v-col>
                            <v-col cols="12">
                                <v-text-field
                                    v-model="userFormData.email"
                                    label="邮箱"
                                    :rules="emailRules"
                                    variant="outlined"
                                    density="comfortable"
                                    type="email"
                                />
                            </v-col>
                            <v-col cols="12">
                                <v-select
                                    v-model="userFormData.role"
                                    label="角色"
                                    :items="roleOptions"
                                    :rules="roleRules"
                                    :disabled="isEditingSelf"
                                    variant="outlined"
                                    density="comfortable"
                                    :hint="isEditingSelf ? '您不能修改自己的角色' : undefined"
                                    persistent-hint
                                    required
                                />
                            </v-col>
                            <v-col cols="12" v-if="isEditing">
                                <v-switch
                                    v-model="userFormData.enabled"
                                    :disabled="isEditingSelf"
                                    label="启用用户"
                                    color="primary"
                                    :hide-details="!isEditingSelf"
                                />
                                <p v-if="isEditingSelf" class="text-caption text-medium-emphasis mt-1">
                                    您不能修改自己的启用状态
                                </p>
                            </v-col>
                        </v-row>
                    </v-form>
                </v-card-text>

                <v-card-actions class="px-6 pb-4">
                    <v-spacer />
                    <v-btn @click="closeUserDialog" variant="text">
                        取消
                    </v-btn>
                    <v-btn
                        @click="saveUser"
                        :loading="saving"
                        :disabled="!formValid"
                        color="primary"
                        variant="elevated"
                    >
                        {{ isEditing ? '保存' : '创建' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 删除确认对话框 -->
        <v-dialog v-model="deleteDialog" max-width="400px">
            <v-card>
                <v-card-title class="d-flex align-center">
                    <span>确认删除</span>
                </v-card-title>
                <v-card-text>
                    确定要删除用户 <strong>{{ userToDelete?.nickname }}</strong> 吗？此操作不可撤销。
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="deleteDialog = false" variant="text">
                        取消
                    </v-btn>
                    <v-btn
                        @click="deleteUserConfirmed"
                        :loading="deleting"
                        color="error"
                        variant="elevated"
                    >
                        删除
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 密码显示对话框 -->
        <v-dialog v-model="passwordDialog" max-width="400px">
            <v-card>
                <v-card-title class="d-flex align-center">
                    <span>密码重置成功</span>
                </v-card-title>
                <v-card-text>
                    <p class="mb-4">用户 <strong>{{ resetPasswordUser?.nickname }}</strong> 的新密码是：</p>
                    <v-text-field
                        :model-value="newPassword"
                        label="新密码"
                        variant="outlined"
                        readonly
                        class="password-field"
                        append-inner-icon="mdi-content-copy"
                        @click:append-inner="copyPassword"
                    />
                    <p class="text-caption text-error mt-2">
                        请将此密码告知用户，并建议用户登录后立即修改密码。
                    </p>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="passwordDialog = false" color="primary" variant="elevated">
                        确定
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 重置密码确认对话框 -->
        <v-dialog v-model="resetPasswordConfirmDialog" max-width="400px">
            <v-card>
                <v-card-title class="d-flex align-center">
                    <span>确认重置密码</span>
                </v-card-title>
                <v-card-text>
                    确定要重置用户 <strong>{{ userToResetPassword?.nickname }}</strong> 的密码吗？
                    <br>
                    系统将生成一个新的随机密码。
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="resetPasswordConfirmDialog = false" variant="text">
                        取消
                    </v-btn>
                    <v-btn
                        @click="confirmResetPassword"
                        color="warning"
                        variant="elevated"
                    >
                        确认重置
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 创建用户成功对话框 -->
        <v-dialog v-model="createUserSuccessDialog" max-width="500px" persistent>
            <v-card>
                <v-card-title class="d-flex align-center">
                    <v-icon icon="mdi-check-circle" color="success" class="mr-2" />
                    用户创建成功
                </v-card-title>
                <v-card-text>
                    <div class="mb-4">
                        <p class="mb-2">新用户 <strong>{{ createdUserInfo?.user.nickname }}</strong> 已成功创建！</p>
                        <p class="text-caption text-medium-emphasis mb-3">
                            请将以下信息告知用户，并建议用户登录后立即修改密码。
                        </p>
                    </div>
                    
                    <v-card variant="outlined" class="mb-4">
                        <v-card-text class="pb-2">
                            <v-row>
                                <v-col cols="4" class="text-caption text-medium-emphasis">用户名:</v-col>
                                <v-col cols="8" class="font-weight-medium">{{ createdUserInfo?.user.username }}</v-col>
                            </v-row>
                            <v-row>
                                <v-col cols="4" class="text-caption text-medium-emphasis">初始密码:</v-col>
                                <v-col cols="8">
                                    <div class="d-flex align-center">
                                        <span class="font-mono font-weight-bold text-primary">{{ createdUserInfo?.password }}</span>
                                        <v-btn
                                            @click="copyCreatedUserPassword"
                                            icon
                                            variant="text"
                                            size="small"
                                            class="ml-2"
                                        >
                                            <v-icon>mdi-content-copy</v-icon>
                                            <v-tooltip activator="parent" location="top">复制密码</v-tooltip>
                                        </v-btn>
                                    </div>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                    
                    <v-alert type="warning" variant="tonal" class="text-caption">
                        此密码只会显示一次，请务必记录并妥善保管。
                    </v-alert>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="closeCreateUserSuccessDialog" color="primary" variant="elevated">
                        确定
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 消息提示 -->
        <v-snackbar
            v-model="snackbar.show"
            :color="snackbar.color"
            :timeout="3000"
            location="top"
        >
            {{ snackbar.message }}
        </v-snackbar>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { userApi } from '@/api'
import { getGravatarUrl } from '@/utils/gravatar'
import { useAuthStore } from '@/stores/auth'
import type { User, CreateUserRequest, UpdateUserRequest } from '@/api/types'
import type { AxiosError } from 'axios'
import type { ApiErrorResponse } from '@/api/types'

// 响应式数据
const users = ref<User[]>([])
const loading = ref(false)
const userDialog = ref(false)
const deleteDialog = ref(false)
const passwordDialog = ref(false)
const resetPasswordConfirmDialog = ref(false)
const createUserSuccessDialog = ref(false)
const userToResetPassword = ref<User | null>(null)
const createdUserInfo = ref<{ user: User; password: string } | null>(null)
const saving = ref(false)
const deleting = ref(false)
const formValid = ref(false)
const isEditing = ref(false)
const userToDelete = ref<User | null>(null)
const resetPasswordUser = ref<User | null>(null)
const newPassword = ref('')

// 表单数据
const userFormData = reactive<CreateUserRequest & { enabled?: boolean; id?: string }>({
    username: '',
    nickname: '',
    email: '',
    role: 'USER',
    enabled: true
})

// 消息提示
const snackbar = reactive({
    show: false,
    message: '',
    color: 'success'
})

// 获取authStore
const authStore = useAuthStore()

// 计算当前用户是否正在编辑自己
const isEditingSelf = computed(() => {
    return isEditing.value && userFormData.id === authStore.user?.id
})

// 表格列定义
const tableHeaders = [
    { title: '', key: 'avatar', sortable: false, width: 60 },
    { title: '用户ID', key: 'id', sortable: true, width: 100 },
    { title: '用户名', key: 'username', sortable: true },
    { title: '昵称', key: 'nickname', sortable: true },
    { title: '邮箱', key: 'email', sortable: true },
    { title: '角色', key: 'role', sortable: true },
    { title: '状态', key: 'enabled', sortable: true },
    { title: '创建时间', key: 'createdAt', sortable: true },
    { title: '操作', key: 'actions', sortable: false, width: 140 }
]

// 角色选项
const roleOptions = [
    { title: '用户', value: 'USER' },
    { title: '管理员', value: 'ADMIN' }
]

// 表单验证规则
const usernameRules = [
    (v: string) => !!v || '用户名不能为空',
    (v: string) => (v && v.length >= 3 && v.length <= 50) || '用户名长度应在3-50字符之间'
]

const nicknameRules = [
    (v: string) => !!v || '昵称不能为空',
    (v: string) => (v && v.length >= 1 && v.length <= 100) || '昵称长度应在1-100字符之间'
]

const emailRules = [
    (v: string) => !v || /.+@.+\..+/.test(v) || '请输入有效的邮箱地址'
]

const roleRules = [
    (v: string) => !!v || '请选择角色'
]

// 格式化日期
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// 显示消息
const showMessage = (message: string, color: 'success' | 'error' | 'warning' = 'success') => {
    snackbar.message = message
    snackbar.color = color
    snackbar.show = true
}

// 加载用户列表
const loadUsers = async () => {
    try {
        loading.value = true
        const response = await userApi.getAllUsers()
        users.value = response.data
    } catch (error) {
        console.error('加载用户列表失败:', error)
        const axiosError = error as AxiosError<ApiErrorResponse>
        showMessage(axiosError.response?.data?.message || '加载用户列表失败', 'error')
    } finally {
        loading.value = false
    }
}

// 重置表单数据
const resetFormData = () => {
    userFormData.username = ''
    userFormData.nickname = ''
    userFormData.email = ''
    userFormData.role = 'USER'
    userFormData.enabled = true
}

// 打开创建用户对话框
const openCreateUserDialog = () => {
    isEditing.value = false
    resetFormData()
    userDialog.value = true
}

// 打开编辑用户对话框
const openEditUserDialog = (user: User) => {
    isEditing.value = true
    userFormData.username = user.username
    userFormData.nickname = user.nickname
    userFormData.email = user.email || ''
    userFormData.role = user.role
    userFormData.enabled = user.enabled
    userFormData.id = user.id
    userDialog.value = true
}

// 关闭用户对话框
const closeUserDialog = () => {
    userDialog.value = false
    resetFormData()
}

// 保存用户
const saveUser = async () => {
    try {
        saving.value = true
        
        if (isEditing.value) {
            // 编辑用户
            const updateData: UpdateUserRequest = {
                nickname: userFormData.nickname,
                email: userFormData.email || null,
                role: userFormData.role,
                enabled: userFormData.enabled
            }
            await userApi.updateUser(userFormData.id!, updateData)
            showMessage('用户更新成功')
        } else {
            // 创建用户
            const createData: CreateUserRequest = {
                username: userFormData.username,
                nickname: userFormData.nickname,
                email: userFormData.email || null,
                role: userFormData.role
            }
            const response = await userApi.createUser(createData)
            // 显示创建成功对话框
            createdUserInfo.value = {
                user: response.data.user,
                password: response.data.generatedPassword
            }
            createUserSuccessDialog.value = true
        }
        
        if (isEditing.value) {
            closeUserDialog()
            await loadUsers()
        }
    } catch (error) {
        console.error('保存用户失败:', error)
        const axiosError = error as AxiosError<ApiErrorResponse>
        showMessage(axiosError.response?.data?.message || '保存用户失败', 'error')
    } finally {
        saving.value = false
    }
}

// 确认删除用户
const confirmDeleteUser = (user: User) => {
    userToDelete.value = user
    deleteDialog.value = true
}

// 删除用户确认
const deleteUserConfirmed = async () => {
    if (!userToDelete.value) return
    
    try {
        deleting.value = true
        await userApi.deleteUser(userToDelete.value.id)
        showMessage('用户删除成功')
        deleteDialog.value = false
        userToDelete.value = null
        await loadUsers()
    } catch (error) {
        console.error('删除用户失败:', error)
        const axiosError = error as AxiosError<ApiErrorResponse>
        showMessage(axiosError.response?.data?.message || '删除用户失败', 'error')
    } finally {
        deleting.value = false
    }
}

// 确认重置用户密码
const resetUserPassword = (user: User) => {
    userToResetPassword.value = user
    resetPasswordConfirmDialog.value = true
}

// 重置用户密码确认
const confirmResetPassword = async () => {
    if (!userToResetPassword.value) return
    
    try {
        resetPasswordConfirmDialog.value = false
        const response = await userApi.resetUserPassword(userToResetPassword.value.id)
        resetPasswordUser.value = userToResetPassword.value
        newPassword.value = response.data
        passwordDialog.value = true
        userToResetPassword.value = null
    } catch (error) {
        console.error('重置密码失败:', error)
        const axiosError = error as AxiosError<ApiErrorResponse>
        showMessage(axiosError.response?.data?.message || '重置密码失败', 'error')
        userToResetPassword.value = null
    }
}

// 关闭创建用户成功对话框
const closeCreateUserSuccessDialog = async () => {
    createUserSuccessDialog.value = false
    createdUserInfo.value = null
    closeUserDialog()
    await loadUsers()
}

// 复制密码到剪贴板
const copyPassword = async () => {
    try {
        await navigator.clipboard.writeText(newPassword.value)
        showMessage('密码已复制到剪贴板')
    } catch (error) {
        console.error('复制失败:', error)
        showMessage('复制失败', 'error')
    }
}

// 复制创建用户的密码到剪贴板
const copyCreatedUserPassword = async () => {
    if (!createdUserInfo.value) return
    
    try {
        await navigator.clipboard.writeText(createdUserInfo.value.password)
        showMessage('密码已复制到剪贴板')
    } catch (error) {
        console.error('复制失败:', error)
        showMessage('复制失败', 'error')
    }
}

// 组件挂载时加载数据
onMounted(() => {
    loadUsers()
})
</script>

<style scoped>
.user-management {
    max-width: 1200px;
    margin: 0 auto;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
}

.page-title {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 4px;
    color: #333;
}

.page-subtitle {
    color: #666;
    font-size: 16px;
    margin: 0;
}

.create-user-btn {
    text-transform: none !important;
    font-weight: 500;
}

.user-table-card {
    border-radius: 12px;
}

.user-table :deep(.v-data-table__wrapper) {
    border-radius: 12px;
}

.action-buttons {
    display: flex;
    gap: 4px;
}

.dialog-title {
    font-size: 20px;
    font-weight: 600;
    padding: 20px 24px 8px 24px;
    border-bottom: 1px solid #e0e0e0;
}

.password-field :deep(.v-field__input) {
    font-family: monospace;
    font-size: 16px;
    font-weight: 600;
}

.font-mono {
    font-family: 'Roboto Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}
</style>