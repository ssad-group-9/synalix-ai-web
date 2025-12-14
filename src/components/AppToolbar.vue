<template>
    <v-app-bar app elevation="1" color="white" height="64">
        <!-- 左侧：APP标题图片 -->
        <div @click="goToOverview" class="title-container mx-6" style="cursor: pointer;">
            <img src="/title.svg" alt="Synalix AI" class="toolbar-title-logo" />
        </div>

        <!-- 中间：导航按钮 -->
        <div class="navigation-buttons">
            <v-btn v-for="item in navigationItems" :key="item.name" :to="item.to" variant="text"
                :color="isCurrentRoute(item.to) ? 'primary' : 'default'" class="mx-1">
                {{ item.title }}
            </v-btn>
        </div>

        <!-- 右侧：间隔器 -->
        <v-spacer />

        <!-- 右侧：用户信息和管理按钮 -->
        <div class="user-section">
            <div v-if="authStore.user">
                <!-- 管理控制台按钮（仅管理员可见） -->
                <v-btn v-if="authStore.isAdmin()" icon @click="goToAdmin" class="mr-2">
                    <v-icon icon="mdi-cog" />
                    <v-tooltip activator="parent" location="bottom">
                        管理控制台
                    </v-tooltip>
                </v-btn>

                <!-- 用户信息按钮 -->
                <v-btn variant="text" @click="goToProfile" class="user-button">
                    <v-avatar size="32" class="mr-2">
                        <v-img :src="userAvatarUrl" :alt="authStore.user.nickname" />
                    </v-avatar>
                    <span class="user-nickname">{{ authStore.user.nickname }}</span>
                </v-btn>
            </div>

            <!-- 未登录时显示登录按钮 -->
            <v-btn v-else color="primary" variant="outlined" @click="goToLogin">
                登录
            </v-btn>
        </div>
    </v-app-bar>
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
    { name: 'overview', title: '概览', to: '/overview' },
    { name: 'model-center', title: '模型中心', to: '/model-center' },
    { name: 'task-management', title: '任务管理', to: '/task-management' },
    { name: 'dataset-management', title: '数据集管理', to: '/dataset-management' }
    // 可以在这里扩展更多导航项目
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

// 导航方法
const goToOverview = () => {
    router.push('/overview')
}

const goToAdmin = () => {
    router.push('/admin')
}

const goToProfile = () => {
    router.push('/profile')
}

const goToLogin = () => {
    router.push('/login')
}
</script>

<style scoped>
.navigation-buttons {
    display: flex;
    align-items: center;
}

.user-section {
    display: flex;
    align-items: center;
}

.user-button {
    text-transform: none !important;
}

.user-nickname {
    font-weight: 500;
}

.v-toolbar-title {
    color: #1976d2;
}

.title-container {
    display: flex;
    align-items: center;
    height: 100%;
}

.toolbar-title-logo {
    height: 40px;
    max-width: 160px;
    object-fit: contain;
}
</style>
