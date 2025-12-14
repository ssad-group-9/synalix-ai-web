<template>
  <div class="overview">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">概览</h1>
      <p class="page-subtitle">{{ greeting }}</p>
    </div>

    <!-- 统计卡片 -->
    <v-row class="mt-6 stats-row">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="2">
          <v-card-text>
            <div class="stat-content">
              <div class="stat-icon" style="color: #1f77b4">
                <v-icon size="40">mdi-cube-outline</v-icon>
              </div>
              <div class="stat-info">
                <p class="stat-label">模型总数</p>
                <p class="stat-value">{{ stats.modelCount }}</p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="2">
          <v-card-text>
            <div class="stat-content">
              <div class="stat-icon" style="color: #ff7f0e">
                <v-icon size="40">mdi-database-outline</v-icon>
              </div>
              <div class="stat-info">
                <p class="stat-label">数据集总数</p>
                <p class="stat-value">{{ stats.datasetCount }}</p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="2">
          <v-card-text>
            <div class="stat-content">
              <div class="stat-icon" style="color: #2ca02c">
                <v-icon size="40">mdi-clipboard-list-outline</v-icon>
              </div>
              <div class="stat-info">
                <p class="stat-label">任务总数</p>
                <p class="stat-value">{{ stats.taskCount }}</p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="2">
          <v-card-text>
            <div class="stat-content">
              <div class="stat-icon" style="color: #d62728">
                <v-icon size="40">mdi-server</v-icon>
              </div>
              <div class="stat-info">
                <p class="stat-label">GPU 资源</p>
                <p class="stat-value">{{ stats.gpuCount }}</p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 最近活动 -->
    <v-row class="mt-8">
      <v-col cols="12">
        <v-card class="activity-card" elevation="2">
          <v-card-title class="text-h6">最近任务</v-card-title>
          <v-data-table
            v-if="recentTasks.length > 0"
            :headers="taskHeaders"
            :items="recentTasks"
            :items-per-page="5"
            hide-default-footer
          >
            <template v-slot:item.type="{ item }">
              <v-chip :color="item.type === 'TRAINING' ? 'primary' : 'info'" variant="tonal" size="small">
                {{ item.type === 'TRAINING' ? '训练' : '推理' }}
              </v-chip>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip :color="getStatusColor(item.status)" variant="tonal" size="small">
                {{ getStatusLabel(item.status) }}
              </v-chip>
            </template>
            <template v-slot:item.createdAt="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>
          </v-data-table>
          <v-empty-state
            v-else
            :image-height="150"
            headline="暂无任务"
            text="还没有创建任何任务"
          >
            <template v-slot:media>
              <v-icon color="primary" size="80">mdi-clipboard-list-outline</v-icon>
            </template>
          </v-empty-state>
        </v-card>
      </v-col>
    </v-row>

    <!-- 快速开始 -->
    <v-row class="mt-8">
      <v-col cols="12">
        <v-card class="quickstart-card" elevation="2">
          <v-card-title class="text-h6">快速开始</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-list class="quickstart-list">
                  <v-list-item
                    @click="$router.push('/model-center')"
                    prepend-icon="mdi-cube-outline"
                    title="查看模型"
                    subtitle="浏览可用的模型"
                  />
                  <v-list-item
                    @click="$router.push('/dataset-management')"
                    prepend-icon="mdi-database-outline"
                    title="管理数据集"
                    subtitle="上传和预处理数据集"
                  />
                </v-list>
              </v-col>
              <v-col cols="12" md="6">
                <v-list class="quickstart-list">
                  <v-list-item
                    @click="$router.push('/task-management')"
                    prepend-icon="mdi-clipboard-list-outline"
                    title="创建任务"
                    subtitle="开始训练或推理"
                  />
                  <v-list-item
                    v-if="isAdmin"
                    @click="$router.push('/admin/users')"
                    prepend-icon="mdi-account-multiple-outline"
                    title="用户管理"
                    subtitle="管理系统用户"
                  />
                </v-list>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { taskApi, modelApi, datasetApi, resourceApi } from '@/api'
import type { Task } from '@/api/types'

const authStore = useAuthStore()

// 响应式数据
const stats = ref({
  modelCount: 0,
  datasetCount: 0,
  taskCount: 0,
  gpuCount: 0,
})

const recentTasks = ref<Task[]>([])

const taskHeaders = [
  { title: '任务名称', value: 'name', sortable: false },
  { title: '类型', value: 'type', sortable: false },
  { title: '状态', value: 'status', sortable: false },
  { title: '创建时间', value: 'createdAt', sortable: false },
]

// 计算属性
const isAdmin = computed(() => authStore.isAdmin())

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好！'
  if (hour < 18) return '下午好！'
  return '晚上好！'
})

// 方法
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: 'warning',
    RUNNING: 'info',
    COMPLETED: 'success',
    FAILED: 'error',
    STOPPED: 'grey',
  }
  return colors[status] || 'default'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: '待处理',
    RUNNING: '运行中',
    COMPLETED: '已完成',
    FAILED: '失败',
    STOPPED: '已停止',
  }
  return labels[status] || status
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const loadStats = async () => {
  try {
    const [models, datasets, tasks, resources] = await Promise.all([
      modelApi.getModels(),
      datasetApi.getDatasets(),
      taskApi.getTasks(),
      resourceApi.getResources(),
    ])

    stats.value = {
      modelCount: models.data.length,
      datasetCount: datasets.data.length,
      taskCount: tasks.data.length,
      gpuCount: resources.data.filter((r) => r.status !== 'OFFLINE').length,
    }

    // 获取最近的任务
    recentTasks.value = tasks.data.slice(0, 5)
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

// 生命周期钩子
onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.overview {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: #666;
  margin: 8px 0 0 0;
}

.stats-row {
  gap: 16px;
}

.stat-card {
  border-radius: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background-color: rgba(0, 0, 0, 0.05);
}

.stat-info {
  flex: 1;
}

.stat-label {
  margin: 0;
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
}

.stat-value {
  margin: 4px 0 0 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.activity-card {
  border-radius: 8px;
}

.quickstart-card {
  border-radius: 8px;
}

.quickstart-list {
  background-color: transparent;
}

.quickstart-list :deep(.v-list-item) {
  cursor: pointer;
  transition: background-color 0.2s;
}

.quickstart-list :deep(.v-list-item:hover) {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>
