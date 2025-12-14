<template>
  <div class="task-management">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <div>
        <h1 class="page-title">任务管理</h1>
        <p class="page-subtitle">创建、监控和管理训练/推理任务</p>
      </div>
      <v-btn
        @click="openCreateTaskDialog"
        color="primary"
        prepend-icon="mdi-plus"
        variant="elevated"
      >
        创建任务
      </v-btn>
    </div>

    <!-- 加载状态 -->
    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <!-- 任务表格 -->
    <v-card v-if="tasks.length > 0" class="task-table-card mt-6" elevation="2">
      <v-data-table
        :headers="tableHeaders"
        :items="tasks"
        :loading="loading"
        :items-per-page="10"
        class="task-table"
        hover
      >
        <!-- 任务名称列 -->
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center">
            <v-icon class="mr-2">{{ getTaskIcon(item.type) }}</v-icon>
            {{ item.name }}
          </div>
        </template>

        <!-- 任务类型列 -->
        <template v-slot:item.type="{ item }">
          <v-chip :color="item.type === 'TRAINING' ? 'primary' : 'info'" variant="tonal" size="small">
            {{ item.type === 'TRAINING' ? '训练' : '推理' }}
          </v-chip>
        </template>

        <!-- 状态列 -->
        <template v-slot:item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" variant="tonal" size="small">
            {{ getStatusLabel(item.status) }}
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
              @click="viewTaskDetails(item)"
              icon="mdi-eye"
              variant="text"
              size="small"
              color="primary"
            >
              <v-icon size="18" />
              <v-tooltip activator="parent" location="top">查看详情</v-tooltip>
            </v-btn>
            <v-btn
              v-if="item.status === 'RUNNING'"
              @click="stopTask(item)"
              icon="mdi-stop-circle"
              variant="text"
              size="small"
              color="warning"
            >
              <v-icon size="18" />
              <v-tooltip activator="parent" location="top">停止</v-tooltip>
            </v-btn>
            <v-btn
              @click="deleteTask(item)"
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

    <!-- 空状态 -->
    <v-empty-state
      v-else
      :image-height="200"
      headline="暂无任务"
      title="没有任务记录"
      text="请创建第一个任务以开始训练或推理"
    >
      <template v-slot:media>
        <v-icon color="primary" size="100">mdi-clipboard-list-outline</v-icon>
      </template>
      <v-btn
        @click="openCreateTaskDialog"
        color="primary"
        variant="elevated"
      >
        创建第一个任务
      </v-btn>
    </v-empty-state>

    <!-- 创建任务对话框 -->
    <v-dialog v-model="taskDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <span>创建新任务</span>
          <v-spacer />
          <v-btn @click="closeTaskDialog" icon variant="text" size="small">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pb-0">
          <v-form ref="taskForm" v-model="formValid" @submit.prevent="saveTask">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="taskFormData.name"
                  label="任务名称"
                  :rules="nameRules"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="taskFormData.type"
                  label="任务类型"
                  :items="taskTypes"
                  item-title="label"
                  item-value="value"
                  :rules="typeRules"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="taskFormData.modelId"
                  label="选择模型"
                  :items="models"
                  item-title="name"
                  item-value="id"
                  :rules="modelRules"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="taskFormData.datasetId"
                  label="选择数据集"
                  :items="datasets"
                  item-title="name"
                  item-value="id"
                  :rules="datasetRules"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="taskConfigJson"
                  label="任务配置 (JSON)"
                  hint="输入 JSON 格式的配置参数"
                  persistent-hint
                  variant="outlined"
                  density="comfortable"
                  rows="4"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeTaskDialog" variant="text">取消</v-btn>
          <v-btn @click="saveTask" color="primary" variant="elevated" :loading="saving">
            创建
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 任务详情对话框 -->
    <v-dialog v-model="detailsDialog" max-width="700px">
      <v-card v-if="selectedTask">
        <v-card-title class="d-flex align-center">
          <span>任务详情: {{ selectedTask.name }}</span>
          <v-spacer />
          <v-btn @click="detailsDialog = false" icon variant="text" size="small">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="details-content">
          <v-row>
            <v-col cols="12" md="6">
              <div class="detail-item">
                <strong>任务ID:</strong>
                <p>{{ selectedTask.id.slice(0, 8) }}</p>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-item">
                <strong>状态:</strong>
                <v-chip :color="getStatusColor(selectedTask.status)" variant="tonal" size="small">
                  {{ getStatusLabel(selectedTask.status) }}
                </v-chip>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-item">
                <strong>任务类型:</strong>
                <p>{{ selectedTask.type === 'TRAINING' ? '训练' : '推理' }}</p>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-item">
                <strong>创建时间:</strong>
                <p>{{ formatDate(selectedTask.createdAt) }}</p>
              </div>
            </v-col>
            <v-col cols="12">
              <div class="detail-item">
                <strong>配置信息:</strong>
                <pre class="config-display">{{ JSON.stringify(selectedTask.config, null, 2) }}</pre>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            v-if="selectedTask.status === 'RUNNING'"
            @click="stopTask(selectedTask)"
            color="warning"
            variant="elevated"
          >
            停止任务
          </v-btn>
          <v-btn
            @click="detailsDialog = false"
            color="primary"
            variant="text"
          >
            关闭
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { taskApi, modelApi, datasetApi } from '@/api'
import type { Task, Model, Dataset } from '@/api/types'

// 响应式数据
const tasks = ref<Task[]>([])
const models = ref<Model[]>([])
const datasets = ref<Dataset[]>([])
const taskDialog = ref(false)
const detailsDialog = ref(false)
const taskForm = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const formValid = ref(false)
const loading = ref(false)
const saving = ref(false)
const selectedTask = ref<Task | null>(null)
const taskConfigJson = ref('{}')

const tableHeaders = [
  { title: '任务名称', value: 'name', sortable: true },
  { title: '类型', value: 'type', sortable: true },
  { title: '状态', value: 'status', sortable: true },
  { title: '创建时间', value: 'createdAt', sortable: true },
  { title: '操作', value: 'actions', sortable: false },
]

const taskTypes = [
  { label: '训练', value: 'TRAINING' },
  { label: '推理', value: 'INFERENCE' },
]

const taskFormData = ref({
  name: '',
  type: 'TRAINING',
  modelId: '',
  datasetId: '',
})

// 验证规则
const nameRules = [
  (v: string) => !!v || '任务名称为必填项',
  (v: string) => v.length <= 100 || '任务名称长度不超过100个字符',
]

const typeRules = [(v: string) => !!v || '任务类型为必填项']
const modelRules = [(v: string) => !!v || '模型为必填项']
const datasetRules = [(v: string) => !!v || '数据集为必填项']

// 方法
const getTaskIcon = (type: string) => {
  return type === 'TRAINING' ? 'mdi-dumbbell' : 'mdi-brain'
}

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

const openCreateTaskDialog = () => {
  taskFormData.value = {
    name: '',
    type: 'TRAINING',
    modelId: '',
    datasetId: '',
  }
  taskConfigJson.value = '{}'
  taskDialog.value = true
}

const closeTaskDialog = () => {
  taskDialog.value = false
}

const saveTask = async () => {
  const validationResult = await taskForm.value?.validate()
  if (!validationResult?.valid) return

  saving.value = true
  try {
    let config = {}
    try {
      config = JSON.parse(taskConfigJson.value)
    } catch {
      config = {}
    }

    await taskApi.createTask({
      name: taskFormData.value.name,
      type: taskFormData.value.type as 'TRAINING' | 'INFERENCE',
      modelId: taskFormData.value.modelId,
      datasetId: taskFormData.value.datasetId,
      config,
    })

    closeTaskDialog()
    loadTasks()
  } catch (error) {
    console.error('创建任务失败:', error)
  } finally {
    saving.value = false
  }
}

const viewTaskDetails = (task: Task) => {
  selectedTask.value = task
  detailsDialog.value = true
}

const stopTask = async (task: Task) => {
  if (!confirm(`确定要停止任务 "${task.name}" 吗?`)) return

  try {
    await taskApi.stopTask(task.id)
    loadTasks()
    if (detailsDialog.value) {
      detailsDialog.value = false
    }
  } catch (error) {
    console.error('停止任务失败:', error)
  }
}

const deleteTask = async (task: Task) => {
  if (!confirm(`确定要删除任务 "${task.name}" 吗?`)) return

  try {
    // 注意: API 中可能没有删除任务的端点，这里仅作示例
    console.log('删除任务:', task.id)
    loadTasks()
  } catch (error) {
    console.error('删除任务失败:', error)
  }
}

const loadTasks = async () => {
  loading.value = true
  try {
    const response = await taskApi.getTasks()
    tasks.value = response.data
  } catch (error) {
    console.error('加载任务失败:', error)
  } finally {
    loading.value = false
  }
}

const loadModels = async () => {
  try {
    const response = await modelApi.getModels()
    models.value = response.data
  } catch (error) {
    console.error('加载模型失败:', error)
  }
}

const loadDatasets = async () => {
  try {
    const response = await datasetApi.getDatasets()
    datasets.value = response.data
  } catch (error) {
    console.error('加载数据集失败:', error)
  }
}

// 生命周期钩子
onMounted(() => {
  loadTasks()
  loadModels()
  loadDatasets()
})
</script>

<style scoped>
.task-management {
  padding: 24px;
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
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: #666;
  margin: 8px 0 0 0;
}

.task-table-card {
  border-radius: 8px;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.details-content {
  max-height: 500px;
  overflow-y: auto;
}

.detail-item {
  margin-bottom: 16px;
}

.detail-item strong {
  display: block;
  margin-bottom: 4px;
  color: #333;
}

.detail-item p {
  margin: 0;
  color: #666;
}

.config-display {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  margin: 8px 0 0 0;
}
</style>
