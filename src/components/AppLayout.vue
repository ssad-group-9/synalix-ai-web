<template>
    <v-app>
        <!-- 全局加载条 -->
        <v-progress-linear
            v-if="loadingStore.isLoading"
            :model-value="loadingStore.progress"
            color="primary"
            height="3"
            class="position-fixed"
            style="top: 0; left: 0; right: 0; z-index: 9999; transition: opacity 0.2s ease;"
        />
        
        <!-- 工具栏 - 根据路由meta决定是否显示 -->
        <AppToolbar v-if="showToolbar" />

        <!-- 主内容区域 -->
        <v-main>
            <router-view />
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppToolbar from './AppToolbar.vue'
import { useLoadingStore } from '@/stores/loading'

const route = useRoute()
const loadingStore = useLoadingStore()

// 计算是否显示工具栏
const showToolbar = computed(() => {
    // 如果路由meta中设置了hideToolbar为true，则不显示工具栏
    return !route.meta.hideToolbar
})
</script>
