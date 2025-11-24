<template>
    <v-app>
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

const route = useRoute()

// 计算是否显示工具栏
const showToolbar = computed(() => {
    // 如果路由meta中设置了hideToolbar为true，则不显示工具栏
    return !route.meta.hideToolbar
})
</script>
