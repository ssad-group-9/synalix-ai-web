<template>
  <div class="model-center">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <div>
        <h1 class="page-title">模型中心</h1>
        <p class="page-subtitle">查看和管理系统中的所有模型</p>
      </div>
      <v-btn v-if="isAdmin" @click="openCreateModelDialog" color="primary" prepend-icon="mdi-plus" variant="elevated">
        注册新模型
      </v-btn>
    </div>

    <!-- 加载状态 -->
    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <!-- 模型网格视图 -->
    <v-row v-if="models.length > 0" class="mt-6">
      <v-col v-for="model in models" :key="model.id" cols="12" sm="6" md="4" lg="3">
        <v-card class="model-card h-100" elevation="2" hover>
          <v-card-title class="text-h6">
            {{ model.name }}
          </v-card-title>

          <v-card-text>
            <v-chip class="mb-3" :color="getModelTypeColor(model.type)" variant="tonal" size="small">
              {{ model.type }}
            </v-chip>
            <p class="text-body2 text-grey-700 mb-3">{{ model.description }}</p>
            <p class="text-caption text-grey-600">
              <strong>版本:</strong> {{ model.version }}
            </p>
            <p class="text-caption text-grey-600">
              <strong>创建时间:</strong> {{ formatDate(model.createdAt) }}
            </p>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn @click="openModelDetail(model)" color="primary" variant="text" size="small">
              查看详情
            </v-btn>
            <v-btn @click="selectModel(model)" color="primary" variant="text" size="small">
              选择
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-empty-state v-else :image-height="200" headline="暂无模型" title="没有可用的模型" text="请先注册模型以开始使用">
      <template v-slot:media>
        <v-icon color="primary" size="100">mdi-cube-outline</v-icon>
      </template>
      <v-btn v-if="isAdmin" @click="openCreateModelDialog" color="primary" variant="elevated">
        创建第一个模型
      </v-btn>
    </v-empty-state>

    <!-- 创建模型对话框 -->
    <v-dialog v-model="modelDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <span>注册新模型</span>
          <v-spacer />
          <v-btn @click="closeModelDialog" icon variant="text" size="small">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pb-0">
          <v-form ref="modelForm" v-model="formValid" @submit.prevent="saveModel">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="modelFormData.name" label="模型名称" :rules="nameRules" variant="outlined"
                  density="comfortable" required />
              </v-col>
              <v-col cols="12">
                <v-select v-model="modelFormData.type" label="模型类型" :items="modelTypes" item-title="label"
                  item-value="value" :rules="typeRules" variant="outlined" density="comfortable" required />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="modelFormData.version" label="版本" :rules="versionRules" variant="outlined"
                  density="comfortable" required />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="modelFormData.description" label="描述" :rules="descriptionRules" variant="outlined"
                  density="comfortable" rows="3" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeModelDialog" variant="text">取消</v-btn>
          <v-btn @click="saveModel" color="primary" variant="elevated" :loading="saving">
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 详情对话框 -->
    <v-dialog v-model="modelDetailDialog" max-width="900">
      <v-card v-if="selectedModelForDetail">
        <v-card-title class="d-flex align-center">
          <div class="flex-grow-1">
            <div class="text-h6">{{ selectedModelForDetail.name }}</div>
            <div class="text-caption text-grey-600">
              版本 {{ selectedModelForDetail.version }} · {{ selectedModelForDetail.type }}
            </div>
          </div>
          <v-btn icon variant="text" @click="modelDetailDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <v-row>
            <v-col cols="12" md="12">
              <v-card variant="tonal" class="pa-4">
                <div class="text-subtitle-2 mb-2">基本信息</div>

                <div class="text-body-2 mb-2">
                  <strong>ID:</strong> {{ selectedModelForDetail.id }}
                </div>
                <div class="text-body-2 mb-2">
                  <strong>描述:</strong> {{ selectedModelForDetail.description || '-' }}
                </div>
                <div class="text-body-2 mb-2">
                  <strong>创建时间:</strong> {{ formatDate(selectedModelForDetail.createdAt) }}
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" md="12">
              <v-card variant="tonal" class="pa-4">
                <div class="text-subtitle-2 mb-2">ModelCheckpoints</div>

                <template v-if="modelChceckpoints.length">
                  <v-list density="compact">
                    <v-list-item v-for="(ckpt, idx) in modelChceckpoints" :key="ckpt.id ?? idx">
                      <template #prepend>
                        <v-icon>mdi-database</v-icon>
                      </template>

                      <v-list-item-title class="d-flex align-center">
                        <span class="flex-grow-1">
                          {{ ckpt.name ?? `checkpoint-${idx + 1}` }}
                        </span>

                        <v-btn size="small" variant="text" color="primary"
                          :loading="downloadingCheckpointId === ckpt.id" :disabled="!ckpt.id"
                          @click="onDownloadCheckpoint(ckpt.id)">
                          下载
                        </v-btn>
                      </v-list-item-title>

                      <v-list-item-subtitle>
                        <span v-if="ckpt.createdAt">创建: {{ formatDate(ckpt.createdAt) }}</span>
                        <span v-if="(ckpt as any).step != null"> · step: {{ (ckpt as any).step }}</span>
                        <span v-if="(ckpt as any).epoch != null"> · epoch: {{ (ckpt as any).epoch }}</span>
                        <span v-if="(ckpt as any).size != null"> · size: {{ (ckpt as any).size }}</span>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </template>

                <template v-else>
                  <div class="text-body-2 text-grey-600">暂无 ModelCheckpoints 数据。</div>
                </template>

                <div class="text-subtitle-2 mb-2">AdapterCheckpoints</div>

                <template v-if="adapterCheckpoints.length">
                  <v-list density="compact">
                    <v-list-item v-for="(ckpt, idx) in adapterCheckpoints" :key="ckpt.id ?? idx">
                      <template #prepend>
                        <v-icon>mdi-database</v-icon>
                      </template>

                      <v-list-item-title class="d-flex align-center">
                        <span class="flex-grow-1">
                          {{ ckpt.name ?? `checkpoint-${idx + 1}` }}
                        </span>

                        <v-btn size="small" variant="text" color="primary"
                          :loading="downloadingCheckpointId === ckpt.id" :disabled="!ckpt.id"
                          @click="onDownloadCheckpoint(ckpt.id)">
                          下载
                        </v-btn>
                      </v-list-item-title>

                      <v-list-item-subtitle>
                        <span v-if="ckpt.createdAt">创建: {{ formatDate(ckpt.createdAt) }}</span>
                        <span v-if="(ckpt as any).step != null"> · step: {{ (ckpt as any).step }}</span>
                        <span v-if="(ckpt as any).epoch != null"> · epoch: {{ (ckpt as any).epoch }}</span>
                        <span v-if="(ckpt as any).size != null"> · size: {{ (ckpt as any).size }}</span>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </template>

                <template v-else>
                  <div class="text-body-2 text-grey-600">暂无 AdapterCheckpoints 数据。</div>
                </template>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="modelDetailDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { modelApi, checkpointsApi } from '@/api'
import type { Model, Checkpoints } from '@/api/types'
import type { AxiosError } from 'axios'

const modelDetailDialog = ref(false)
const selectedModelForDetail = ref<any | null>(null)
const authStore = useAuthStore()
const modelChceckpoints = ref<Checkpoints[]>([])
const adapterCheckpoints = ref<Checkpoints[]>([])
const downloadingCheckpointId = ref<string | null>(null)

// 响应式数据
const models = ref<Model[]>([])
const modelDialog = ref(false)
const modelForm = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const formValid = ref(false)
const loading = ref(false)
const saving = ref(false)
const checkpoints = ref<any[]>([])

const snackbar = ref<{ show: boolean; text: string; color: 'success' | 'error' | 'info' }>({
  show: false,
  text: '',
  color: 'info',
})

const modelTypes = [
  { label: 'LLM (大语言模型)', value: 'LLM' },
  { label: 'CV (计算机视觉)', value: 'CV' },
  { label: 'OTHER (其他)', value: 'OTHER' },
]

const modelFormData = ref({
  name: '',
  type: 'LLM',
  version: '1.0',
  description: '',
})
const showError = (text: string) => {
  snackbar.value = { show: true, text, color: 'error' }
}

const onDownloadCheckpoint = async (checkpointId: string) => {
  downloadingCheckpointId.value = checkpointId
  try {
    const res = await checkpointsApi.getDownloadUrl(checkpointId)
    const downloadUrl = res.data.downloadUrl
    if (!downloadUrl) {
      showError('获取下载链接失败：downloadUrl 为空')
      return
    }

    // 触发下载（新标签打开，交给浏览器处理）
    window.open(downloadUrl, '_blank', 'noopener,noreferrer')
  } catch (e) {
    const err = e as AxiosError
    showError(`获取下载链接失败：${err.message}`)
  } finally {
    downloadingCheckpointId.value = null
  }
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

const openModelDetail = (model: any) => {
  selectedModelForDetail.value = model
  modelDetailDialog.value = true

  loadCheckpoints(model.id)

  // 若 checkpoints 需要额外请求：
  // 1) 在这里调用 modelApi.getModelDetail(model.id)
  // 2) 把返回值合并进 selectedModelForDetail.value
}

// 验证规则
const nameRules = [
  (v: string) => !!v || '模型名称为必填项',
  (v: string) => v.length <= 100 || '模型名称长度不超过100个字符',
]

const typeRules = [(v: string) => !!v || '模型类型为必填项']

const versionRules = [
  (v: string) => !!v || '版本为必填项',
  (v: string) => /^[\d.]+$/.test(v) || '版本格式不正确',
]

const descriptionRules = [(v: string) => !v || v.length <= 500 || '描述长度不超过500个字符']

// 计算属性
const isAdmin = computed(() => authStore.isAdmin())

// 方法
const getModelTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    LLM: 'primary',
    CV: 'success',
    OTHER: 'warning',
  }
  return colors[type] || 'default'
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

const openCreateModelDialog = () => {
  modelFormData.value = {
    name: '',
    type: 'LLM',
    version: '1.0',
    description: '',
  }
  modelDialog.value = true
}

const closeModelDialog = () => {
  modelDialog.value = false
  modelFormData.value = {
    name: '',
    type: 'LLM',
    version: '1.0',
    description: '',
  }
}

const saveModel = async () => {
  const validationResult = await modelForm.value?.validate()
  if (!validationResult?.valid) return

  saving.value = true
  try {
    await modelApi.createModel({
      name: modelFormData.value.name,
      type: modelFormData.value.type as 'LLM' | 'CV' | 'OTHER',
      version: modelFormData.value.version,
      description: modelFormData.value.description,
    })
    closeModelDialog()
    loadModels()
  } catch (error) {
    console.error('创建模型失败:', error)
  } finally {
    saving.value = false
  }
}

const selectModel = (model: Model) => {
  // 这里可以导航到训练页面或其他使用模型的地方
  console.log('选择模型:', model)
}

const deleteModel = async (model: Model) => {
  if (!confirm(`确定要删除模型 "${model.name}" 吗?`)) return

  try {
    await modelApi.deleteModel(model.id)
    loadModels()
  } catch (error) {
    console.error('删除模型失败:', error)
  }
}

const loadModels = async () => {
  loading.value = true
  try {
    const response = await modelApi.getModels()
    models.value = response.data
  } catch (error) {
    console.error('加载模型失败:', error)
  } finally {
    loading.value = false
  }
}

// 生命周期钩子
onMounted(() => {
  loadModels()
})
</script>

<style scoped>
.model-center {
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

.model-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.model-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}
</style>
