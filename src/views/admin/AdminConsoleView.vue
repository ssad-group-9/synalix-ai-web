<template>
    <div class="admin-console">
        <!-- 左侧导航抽屉 -->
        <v-navigation-drawer 
            permanent 
            width="280" 
            class="admin-nav-drawer"
            :rail="false"
        >
            <!-- 标题区域 -->
            <div class="admin-nav-header">
                <v-icon icon="mdi-cog" size="24" color="primary" class="mr-2" />
                <span class="admin-nav-title">管理控制台</span>
            </div>

            <v-divider />

            <!-- 导航列表 -->
            <v-list density="compact" nav>
                <v-list-item
                    v-for="item in navigationItems"
                    :key="item.name"
                    :to="item.to"
                    :prepend-icon="item.icon"
                    :title="item.title"
                    :active="isCurrentRoute(item.to)"
                    class="admin-nav-item"
                />
            </v-list>

            <!-- 底部用户信息和操作按钮 -->
            <template v-slot:append>
                <div class="admin-nav-footer">
                    <v-divider class="mb-2" />
                    
                    <!-- 用户信息 -->
                    <v-list-item 
                        @click="goToProfile"
                        class="user-info-item"
                        :prepend-avatar="userAvatarUrl"
                        :title="authStore.user?.nickname || '用户'"
                        :subtitle="authStore.user?.role === 'ADMIN' ? '管理员' : '用户'"
                    >
                        <template v-slot:append>
                            <v-icon icon="mdi-account" size="20" />
                        </template>
                    </v-list-item>

                    <!-- 退出管理控制台按钮 -->
                    <v-btn
                        @click="exitAdmin"
                        variant="text"
                        color="primary"
                        class="exit-admin-btn"
                        block
                        prepend-icon="mdi-exit-to-app"
                    >
                        退出管理控制台
                    </v-btn>
                </div>
            </template>
        </v-navigation-drawer>

        <!-- 右侧内容区域 -->
        <div class="admin-content">
            <router-view />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getGravatarUrl } from '@/utils/gravatar'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 导航项目
const navigationItems = [
    {
        name: 'admin-users',
        title: '用户管理',
        to: '/admin/users',
        icon: 'mdi-account-group'
    },
    {
        name: 'admin-gpu',
        title: 'GPU管理',
        to: '/admin/gpu',
        icon: 'mdi-chip'
    },
    // 可以在这里扩展更多管理功能
]

// 计算用户头像URL
const userAvatarUrl = computed(() => {
    if (!authStore.user) return ''
    return getGravatarUrl(authStore.user.email)
})

// 检查是否为当前路由
const isCurrentRoute = (path: string): boolean => {
    return route.path === path
}

// 跳转到用户资料页面
const goToProfile = () => {
    router.push('/profile')
}

// 退出管理控制台，返回到概览页面
const exitAdmin = () => {
    router.push('/overview')
}
</script>

<style scoped>
.admin-console {
    display: flex;
    height: 100vh;
    background-color: #f5f5f5;
}

.admin-nav-drawer {
    border-right: 1px solid #e0e0e0;
    background-color: white;
}

.admin-nav-header {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    background-color: #fafafa;
}

.admin-nav-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
}

.admin-nav-item {
    margin: 2px 8px;
    border-radius: 8px;
}

.admin-nav-footer {
    padding: 16px;
}

.user-info-item {
    margin-bottom: 8px;
    border-radius: 8px;
    background-color: #f8f9fa;
}

.exit-admin-btn {
    text-transform: none !important;
    font-weight: 500;
}

.admin-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
}
</style>
