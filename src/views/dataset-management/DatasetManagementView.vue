<template>
  <div class="dataset-management">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <div>
        <h1 class="page-title">数据集管理</h1>
        <p class="page-subtitle">上传、预处理和管理数据集</p>
      </div>
      <v-btn
        @click="openCreateDatasetDialog"
        color="primary"
        prepend-icon="mdi-plus"
        variant="elevated"
      >
        创建数据集
      </v-btn>
    </div>

    <!-- 加载状态 -->
    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <!-- 数据集表格 -->
    <v-card v-if="datasets.length > 0" class="dataset-table-card mt-6" elevation="2">
      <v-data-table
        :headers="tableHeaders"
        :items="datasets"
        :loading="loading"
        :items-per-page="10"
        class="dataset-table"
        hover
      >
        <!-- 名称列 -->
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-database</v-icon>
            {{ item.name }}
          </div>
        </template>

        <!-- 大小列 -->
        <template v-slot:item.size="{ item }">
          {{ formatFileSize(item.size) }}
        </template>

        <!-- 上传人列 -->
        <template v-slot:item.uploadedBy="{ item }">
          <v-chip size="small" variant="outlined">{{ item.uploadedBy.slice(0, 8) }}</v-chip>
        </template>

        <!-- 创建时间列 -->
        <template v-slot:item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <!-- 操作列 -->
        <template v-slot:item.actions="{ item }">
          <div class="action-buttons">
            <v-btn
              @click="downloadDataset(item)"
              icon="mdi-download"
              variant="text"
              size="small"
              color="primary"
            >
              <v-icon size="18" />
              <v-tooltip activator="parent" location="top">下载</v-tooltip>
            </v-btn>
            <v-btn
              @click="previewDataset(item)"
              icon="mdi-eye"
              variant="text"
              size="small"
              color="info"
            >
              <v-icon size="18" />
              <v-tooltip activator="parent" location="top">预览</v-tooltip>
            </v-btn>
            <v-btn
              @click="deleteDataset(item)"
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
      headline="暂无数据集"
      title="没有可用的数据集"
      text="请先创建或上传数据集以开始训练"
    >
      <template v-slot:media>
        <v-icon color="primary" size="100">mdi-database-outline</v-icon>
      </template>
      <v-btn
        @click="openCreateDatasetDialog"
        color="primary"
        variant="elevated"
      >
        创建第一个数据集
      </v-btn>
    </v-empty-state>

    <!-- 创建数据集对话框 -->
    <v-dialog v-model="datasetDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <span>创建数据集</span>
          <v-spacer />
          <v-btn @click="closeDatasetDialog" icon variant="text" size="small">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pb-0">
          <v-form ref="datasetForm" v-model="formValid" @submit.prevent="saveDataset">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="datasetFormData.name"
                  label="数据集名称"
                  :rules="nameRules"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="datasetFormData.description"
                  label="描述"
                  :rules="descriptionRules"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                />
              </v-col>
              <v-col cols="12">
                <v-file-input
                  v-model="selectedFile"
                  label="选择文件"
                  hint="支持.json、.jsonl、.txt、.csv 格式"
                  persistent-hint
                  variant="outlined"
                  density="comfortable"
                  accept=".json,.jsonl,.txt,.csv"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeDatasetDialog" variant="text">取消</v-btn>
          <v-btn @click="saveDataset" color="primary" variant="elevated" :loading="saving">
            创建
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 预览对话框 -->
    <v-dialog v-model="previewDialog" max-width="700px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <span>数据集预览: {{ selectedDataset?.name }}</span>
          <v-spacer />
          <v-btn @click="previewDialog = false" icon variant="text" size="small">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="preview-content">
          <v-progress-linear v-if="loadingPreview" indeterminate color="primary" />
          <div v-else class="preview-data">
            <p v-if="previewContent" class="text-body2">{{ previewContent }}</p>
            <p v-else class="text-grey-600">暂无预览内容</p>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { datasetApi } from '@/api'
import type { Dataset } from '@/api/types'

// 响应式数据
const datasets = ref<Dataset[]>([])
const datasetDialog = ref(false)
const previewDialog = ref(false)
const datasetForm = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const formValid = ref(false)
const loading = ref(false)
const saving = ref(false)
const loadingPreview = ref(false)
const selectedFile = ref<File[]>([])
const selectedDataset = ref<Dataset | null>(null)
const previewContent = ref('')

const tableHeaders = [
  { title: '名称', value: 'name', sortable: true },
  { title: '描述', value: 'description' },
  { title: '大小', value: 'size', sortable: true },
  { title: '创建时间', value: 'createdAt', sortable: true },
  { title: '操作', value: 'actions', sortable: false },
]

const datasetFormData = ref({
  name: '',
  description: '',
})

// 验证规则
const nameRules = [
  (v: string) => !!v || '数据集名称为必填项',
  (v: string) => v.length <= 100 || '数据集名称长度不超过100个字符',
]

const descriptionRules = [(v: string) => !v || v.length <= 500 || '描述长度不超过500个字符']

// 方法
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
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

const openCreateDatasetDialog = () => {
  datasetFormData.value = {
    name: '',
    description: '',
  }
  selectedFile.value = []
  datasetDialog.value = true
}

const closeDatasetDialog = () => {
  datasetDialog.value = false
  datasetFormData.value = {
    name: '',
    description: '',
  }
  selectedFile.value = []
}

const saveDataset = async () => {
  const validationResult = await datasetForm.value?.validate()
  if (!validationResult?.valid) return

  saving.value = true
  try {
    const dataset = await datasetApi.createDataset({
      name: datasetFormData.value.name,
      description: datasetFormData.value.description,
    })

    // 如果选择了文件，则上传
    if (selectedFile.value.length > 0) {
      const file = selectedFile.value[0]
      // 获取上传URL
      const urlResponse = await datasetApi.getUploadUrl(dataset.data.id)
      // 使用上传URL上传文件
      await fetch(urlResponse.data.url, {
        method: urlResponse.data.method,
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })
    }

    closeDatasetDialog()
    loadDatasets()
  } catch (error) {
    console.error('创建数据集失败:', error)
  } finally {
    saving.value = false
  }
}

const downloadDataset = async (dataset: Dataset) => {
  try {
    const urlResponse = await datasetApi.getDownloadUrl(dataset.id)
    window.open(urlResponse.data.url, '_blank')
  } catch (error) {
    console.error('获取下载链接失败:', error)
  }
}

const previewDataset = async (dataset: Dataset) => {
  selectedDataset.value = dataset
  loadingPreview.value = true
  try {
    const urlResponse = await datasetApi.getDownloadUrl(dataset.id)
    const response = await fetch(urlResponse.data.url)
    const content = await response.text()
    previewContent.value = content.slice(0, 1000) + (content.length > 1000 ? '...' : '')
  } catch (error) {
    console.error('获取预览内容失败:', error)
    previewContent.value = '无法加载预览内容'
  } finally {
    loadingPreview.value = false
    previewDialog.value = true
  }
}

const deleteDataset = async (dataset: Dataset) => {
  if (!confirm(`确定要删除数据集 "${dataset.name}" 吗?`)) return

  try {
    await datasetApi.deleteDataset(dataset.id)
    loadDatasets()
  } catch (error) {
    console.error('删除数据集失败:', error)
  }
}

const loadDatasets = async () => {
  loading.value = true
  try {
    const response = await datasetApi.getDatasets()
    datasets.value = response.data
  } catch (error) {
    console.error('加载数据集失败:', error)
  } finally {
    loading.value = false
  }
}

// 生命周期钩子
onMounted(() => {
  loadDatasets()
})
</script>

<style scoped>
.dataset-management {
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

.dataset-table-card {
  border-radius: 8px;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.preview-content {
  max-height: 400px;
  overflow-y: auto;
}

.preview-data {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
