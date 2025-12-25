<template>
  <div class="task-management">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <div>
        <h1 class="page-title">任务管理</h1>
        <p class="page-subtitle">创建、监控和管理训练/推理任务</p>
      </div>
      <v-btn @click="openCreateTaskDialog" color="primary" prepend-icon="mdi-plus" variant="elevated">
        创建任务
      </v-btn>
    </div>

    <!-- 加载状态 -->
    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <!-- 任务表格 -->
    <v-card v-if="tasks.length > 0" class="task-table-card mt-6" elevation="2">
      <v-data-table :headers="tableHeaders" :items="tasks" :loading="loading" :items-per-page="10" class="task-table"
        hover>
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
            <v-btn @click="viewTaskDetails(item)" icon="mdi-eye" variant="text" size="small" color="primary">
              <v-icon size="18" />
              <v-tooltip activator="parent" location="top">查看详情</v-tooltip>
            </v-btn>
            <v-btn v-if="item.status === 'RUNNING'" @click="stopTask(item)" icon="mdi-stop-circle" variant="text"
              size="small" color="warning">
              <v-icon size="18" />
              <v-tooltip activator="parent" location="top">停止</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- 空状态 -->
    <v-empty-state v-else :image-height="200" headline="暂无任务" title="没有任务记录" text="请创建第一个任务以开始训练或推理">
      <template v-slot:media>
        <v-icon color="primary" size="100">mdi-clipboard-list-outline</v-icon>
      </template>
      <v-btn @click="openCreateTaskDialog" color="primary" variant="elevated">
        创建第一个任务
      </v-btn>
    </v-empty-state>

    <!-- 创建任务对话框 -->
    <v-dialog v-model="taskDialog" max-width="700px" persistent scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <span>创建新任务</span>
          <v-spacer />
          <v-btn @click="closeTaskDialog" icon variant="text" size="small">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text class="pb-0">
          <v-form ref="taskForm" v-model="formValid" @submit.prevent="saveTask">
            <!-- 基础信息区 -->
            <v-row class="mb-4">
              <v-col cols="12">
                <div class="section-title">基础信息</div>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="taskFormData.name" label="任务名称" :rules="nameRules" variant="outlined"
                  density="comfortable" prepend-icon="mdi-text" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="taskFormData.type" label="任务类型" :items="taskTypes" item-title="label"
                  item-value="value" :rules="typeRules" variant="outlined" density="comfortable"
                  prepend-icon="mdi-folder-network" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="taskFormData.gpuIds" label="GPU配置" :items="availableGpus" item-title="label"
                  item-value="id" multiple chips variant="outlined" density="comfortable" prepend-icon="mdi-gpu" />
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <!-- 模型和数据区 -->
            <v-row v-if="isTrainingTask" class="mb-4">
              <v-row class="mb-4">
                <v-col cols="12">
                  <div class="section-title">模型与数据</div>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select v-model="taskFormData.modelId" label="选择模型" :items="models" item-title="name"
                    item-value="id" :rules="modelRules" variant="outlined" density="comfortable"
                    prepend-icon="mdi-brain" required />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select v-model="taskFormData.datasetId" label="选择数据集" :items="datasets" item-title="name"
                    item-value="id" :rules="isInferenceTask ? [] : datasetRules" variant="outlined"
                    density="comfortable" prepend-icon="mdi-database" :required="!isInferenceTask" />
                </v-col>
              </v-row>

              <!-- 训练参数区 -->
              <v-col cols="12">
                <div class="section-title">训练参数</div>
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="trainingParams.finetuning_type" label="微调类型" :items="finetuningTypes"
                  variant="outlined" density="comfortable" prepend-icon="mdi-tune" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.number="trainingParams.num_train_epochs" label="训练轮数" type="number"
                  :rules="epochRules" variant="outlined" density="comfortable" prepend-icon="mdi-counter" min="1"
                  max="10000" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.number="trainingParams.learning_rate" label="学习率" type="number"
                  :rules="learningRateRules" variant="outlined" density="comfortable" prepend-icon="mdi-trending-up"
                  step="0.00001" min="0.00001" max="0.1" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.number="trainingParams.max_steps" label="最大步数" type="number" :rules="stepsRules"
                  variant="outlined" density="comfortable" prepend-icon="mdi-step-forward" min="1" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.number="trainingParams.per_device_train_batch_size" label="批次大小" type="number"
                  :rules="batchSizeRules" variant="outlined" density="comfortable" prepend-icon="mdi-shape" min="1"
                  max="512" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.number="trainingParams.gradient_accumulation_steps" label="梯度累积步数" type="number"
                  :rules="gradientRules" variant="outlined" density="comfortable" prepend-icon="mdi-layers-plus" min="1"
                  max="1024" />
              </v-col>
            </v-row>

            <v-row v-if="!isTrainingTask" class="mb-4">
              <v-row class="mb-4">
                <v-col cols="12">
                  <div class="section-title">模型与Lora</div>
                </v-col>
                <v-col cols="12" md="12">
                  <v-select v-model="taskFormData.modelId" label="选择模型" :items="models" item-title="name"
                    item-value="id" :rules="modelRules" variant="outlined" density="comfortable"
                    prepend-icon="mdi-brain" required />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select v-model="taskFormData.modelCheckpointId" label="选择模型检查点" :items="modelChceckpoints"
                    item-title="name" item-value="id" :rules="modelRules" variant="outlined" density="comfortable"
                    prepend-icon="mdi-brain" required />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select v-model="taskFormData.adapterCheckpointId" label="选择Lora检查点" :items="adapterCheckpoints"
                    item-title="name" item-value="id" :rules="isInferenceTask ? [] : datasetRules" variant="outlined"
                    density="comfortable" prepend-icon="mdi-database" :required="!isInferenceTask" />
                </v-col>
              </v-row>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-expansion-panels>
                  <v-expansion-panel>
                    <template v-slot:title>
                      <div class="d-flex align-center">
                        <v-icon class="mr-2">mdi-cog</v-icon>
                        <span>高级配置（可选）</span>
                      </div>
                    </template>
                    <v-expansion-panel-text>
                      <v-textarea v-model="advancedConfigJson" label="自定义配置 (JSON)" hint="输入额外的 JSON 格式的配置参数"
                        persistent-hint variant="outlined" density="comfortable" rows="4" class="mt-4" />
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeTaskDialog" variant="text">取消</v-btn>
          <v-btn @click="saveTask" color="primary" variant="elevated" :loading="saving">
            创建任务
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 任务详情对话框 -->
    <v-dialog v-model="detailsDialog" max-width="1500px" max-height="1000px">
      <v-card v-if="selectedTask">
        <v-card-title class=" d-flex align-center">
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

            <v-col cols="12">
              <div class="detail-item" style="height: 800px;">
                <strong>任务图表:</strong>
                <div class="chart-frame">
                  <iframe v-if="chartHtml" :srcdoc="chartHtml"
                    style="width: 100%; height: 1000px; border: none;"></iframe>
                  <v-skeleton-loader v-else type="image"></v-skeleton-loader>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn v-if="selectedTask.status === 'RUNNING'" @click="stopTask(selectedTask)" color="warning"
            variant="elevated">停止</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { taskApi, modelApi, datasetApi, htmlApi, checkpointsApi, resourceApi } from '@/api'
import type { Task, Model, Dataset, Checkpoints, Resource } from '@/api/types'

// 响应式数据
const tasks = ref<Task[]>([])
const models = ref<Model[]>([])
const datasets = ref<Dataset[]>([])
const checkpoints = ref<Checkpoints[]>([])
const modelChceckpoints = ref<Checkpoints[]>([])
const adapterCheckpoints = ref<Checkpoints[]>([])
const resources = ref<Resource[]>([])
const taskDialog = ref(false)
const detailsDialog = ref(false)
const taskForm = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const formValid = ref(false)
const loading = ref(false)
const saving = ref(false)
const selectedTask = ref<Task | null>(null)
const taskConfigJson = ref('{}')
const chartHtml = ref<string>('')
const advancedConfigJson = ref('{}')

// 表单数据
const taskFormData = ref({
  name: '',
  type: 'TRAINING',
  modelId: '',
  datasetId: '',
  checkpointId: '',
  modelCheckpointId: '',
  adapterCheckpointId: '',
  gpuIds: [] as string[],
})

// 训练参数
const trainingParams = ref({
  finetuning_type: 'full',
  num_train_epochs: 3,
  learning_rate: 0.0002,
  max_steps: 50,
  per_device_train_batch_size: 1,
  gradient_accumulation_steps: 1,
})

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

const finetuningTypes = [
  { title: 'Full', value: 'full' },
  { title: 'LoRA', value: 'lora' },
  { title: 'QLoRA', value: 'qlora' },
]

// 计算属性
const isTrainingTask = computed(() => taskFormData.value.type === 'TRAINING')
const isInferenceTask = computed(() => taskFormData.value.type === 'INFERENCE')

const availableGpus = computed(() => {
  return resources.value.map((gpu) => ({
    id: String(gpu.id),
    label: `GPU ${gpu.id} (${gpu.memoryUsed}/${gpu.memoryTotal} MB)`,
  }))
})

// 验证规则
const nameRules = [
  (v: string) => !!v || '任务名称为必填项',
  (v: string) => v.length <= 100 || '任务名称长度不超过100个字符',
]

const typeRules = [(v: string) => !!v || '任务类型为必填项']
const modelRules = [(v: string) => !!v || '模型为必填项']
const datasetRules = [(v: string) => !!v || '数据集为必填项']
const gpuRules = [
  (v: string[]) => !isTrainingTask.value || (v && v.length > 0) || '训练任务需要选择至少一个GPU',
]

const epochRules = [
  (v: number) => v != null || '训练轮数为必填项',
  (v: number) => v >= 1 || '训练轮数至少为1',
  (v: number) => v <= 10000 || '训练轮数不超过10000',
]

const learningRateRules = [
  (v: number) => v != null || '学习率为必填项',
  (v: number) => v > 0 || '学习率必须大于0',
  (v: number) => v <= 0.1 || '学习率通常不超过0.1',
]

const stepsRules = [
  (v: number) => v != null || '最大步数为必填项',
  (v: number) => v >= 1 || '最大步数至少为1',
]

const batchSizeRules = [
  (v: number) => v != null || '批次大小为必填项',
  (v: number) => v >= 1 || '批次大小至少为1',
  (v: number) => v <= 512 || '批次大小通常不超过512',
]

const gradientRules = [
  (v: number) => v != null || '梯度累积步数为必填项',
  (v: number) => v >= 1 || '梯度累积步数至少为1',
  (v: number) => v <= 1024 || '梯度累积步数通常不超过1024',
]

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
    checkpointId: '',
    modelCheckpointId: '',
    adapterCheckpointId: '',
    gpuIds: [],
  }
  trainingParams.value = {
    finetuning_type: 'full',
    num_train_epochs: 3,
    learning_rate: 0.0002,
    max_steps: 50,
    per_device_train_batch_size: 1,
    gradient_accumulation_steps: 1,
  }
  advancedConfigJson.value = '{}'
  taskDialog.value = true
}

const closeTaskDialog = () => {
  taskDialog.value = false
}

const buildConfig = () => {
  const config: Record<string, unknown> = {
    gpu_count: taskFormData.value.gpuIds.length,
    gpu_ids: taskFormData.value.gpuIds.map((id) => parseInt(id)),
  }

  // 只有训练任务才需要training_config
  if (isTrainingTask.value) {
    const selectedModel = models.value.find((m) => m.id === taskFormData.value.modelId)
    const selectedDataset = datasets.value.find((d) => d.id === taskFormData.value.datasetId)

    const trainingConfig: Record<string, unknown> = {
      model_name_or_path: selectedModel?.name || taskFormData.value.modelId,
      dataset: selectedDataset?.name || taskFormData.value.datasetId,
      ...trainingParams.value,
    }

    // 合并高级配置
    try {
      const advancedConfig = JSON.parse(advancedConfigJson.value) as Record<string, unknown>
      if (Object.keys(advancedConfig).length > 0) {
        Object.assign(trainingConfig, advancedConfig)
      }
    } catch {
      // 忽略无效的JSON
    }

    config.training_config = trainingConfig
  }
  else {
    // 推理任务配置
    const selectedCheckpoint = checkpoints.value.find((c) => c.id === taskFormData.value.modelCheckpointId)
    const selectedadapter = checkpoints.value.find((c) => c.id === taskFormData.value.adapterCheckpointId)

    const inferenceConfig: Record<string, unknown> = {
      model_name_or_path: selectedCheckpoint?.path,
      adapter_name_or_path: selectedadapter?.path,
    }

    // 合并高级配置
    try {
      const advancedConfig = JSON.parse(advancedConfigJson.value) as Record<string, unknown>
      if (Object.keys(advancedConfig).length > 0) {
        Object.assign(inferenceConfig, advancedConfig)
      }
    } catch {
      // 忽略无效的JSON
    }

    config.infer_config = inferenceConfig
  }

  return config
}

const saveTask = async () => {
  const validationResult = await taskForm.value?.validate()
  if (!validationResult?.valid) return

  saving.value = true
  try {
    const config = buildConfig()

    await taskApi.createTask({
      name: taskFormData.value.name,
      type: taskFormData.value.type as 'TRAINING' | 'INFERENCE',
      modelId: taskFormData.value.modelId,
      datasetId: taskFormData.value.datasetId,
      gpuIds: taskFormData.value.gpuIds.map((id) => parseInt(id)),
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

function splitCheckpointsByType(list: Checkpoints[]) {
  const model: Checkpoints[] = []
  const adapter: Checkpoints[] = []
  for (const cp of list) {
    if (cp.type === 'MODEL') model.push(cp)
    else if (cp.type === 'ADAPTER') adapter.push(cp)
  }
  modelChceckpoints.value = model
  adapterCheckpoints.value = adapter
}

const loadCheckpoints = async (modelId: string) => {
  try {
    const response = await checkpointsApi.getCheckpoints(modelId)
    checkpoints.value = response.data
    splitCheckpointsByType(checkpoints.value)
  } catch (error) {
    checkpoints.value = []
    modelChceckpoints.value = []
    adapterCheckpoints.value = []
    console.error('加载检查点失败:', error)
  }
}

async function loadTaskChartHtml(taskId: string) {
  try {
    const resp = await taskApi.getTaskChart(taskId)
    const urlOrHtml = resp.data.chartUrl as string
    const html: string = (await htmlApi.getHtml(urlOrHtml)).data
    chartHtml.value = html
  } catch (e) {
    chartHtml.value = '<div style="padding:16px;color:#888;">无法加载图表</div>'
  }
}

watch([detailsDialog, selectedTask], async ([open, task]) => {
  if (open && task?.id) {
    loadTasks();
    chartHtml.value = ''
    await loadTaskChartHtml(task.id)
  }
})

watch(() => taskFormData.value.modelId, async (modelId) => {
  if (taskFormData.value.type === 'INFERENCE' && modelId) {
    await loadCheckpoints(modelId)
  }
})

const loadResources = async () => {
  try {
    const response = await resourceApi.getResources()
    resources.value = response.data
  } catch (error) {
    console.error('加载GPU资源失败:', error)
  }
}

// 生命周期钩子
onMounted(() => {
  loadTasks()
  loadModels()
  loadDatasets()
  loadResources()
})
</script>

<style scoped>
.chart-frame {
  width: 100%;
  min-height: 500px;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

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

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 16px;
  background-color: #1976d2;
  border-radius: 2px;
  margin-right: 8px;
}

.task-table-card {
  border-radius: 8px;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.details-content {
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
