<template>
  <div class="gpu-management">
    <div class="page-header mb-6">
      <div>
        <h2 class="text-h4 mb-2">GPU资源管理</h2>
        <p class="text-grey">管理用户的GPU使用权限</p>
      </div>
    </div>

    <!-- GPU资源概览 -->
    <v-card class="mb-6">
      <v-card-title>GPU资源概览</v-card-title>
      <v-card-text>
        <v-row v-if="gpuResources.length > 0">
          <v-col v-for="gpu in gpuResources" :key="gpu.id" cols="12" md="6" lg="4">
            <v-card variant="tonal" :color="getGpuStatusColor(gpu.status)">
              <v-card-text>
                <div class="d-flex align-center mb-2">
                  <v-icon :color="getGpuStatusColor(gpu.status)" class="mr-2">mdi-chip</v-icon>
                  <span class="text-h6">{{ gpu.name }}</span>
                  <v-spacer />
                  <v-chip size="small" :color="getGpuStatusColor(gpu.status)">
                    {{ getGpuStatusText(gpu.status) }}
                  </v-chip>
                </div>
                <div class="text-body-2">
                  <div class="mb-1">
                    <strong>总内存:</strong> {{ formatMemory(gpu.memoryTotal) }}
                  </div>
                  <div class="mb-1">
                    <strong>已用:</strong> {{ formatMemory(gpu.memoryUsed) }} ({{
                      Math.round((gpu.memoryUsed / gpu.memoryTotal) * 100)
                    }}%)
                  </div>
                  <div>
                    <strong>可用:</strong> {{ formatMemory(gpu.memoryFree) }}
                  </div>
                </div>
                <v-progress-linear :model-value="(gpu.memoryUsed / gpu.memoryTotal) * 100" class="mt-3"
                  :color="getGpuStatusColor(gpu.status)" height="8" rounded />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-alert v-else type="info" variant="tonal">
          暂无GPU资源信息
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- 用户GPU权限管理 -->
    <v-card>
      <v-card-title>用户GPU权限管理</v-card-title>
      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate color="primary" />

        <v-table v-else>
          <thead>
            <tr>
              <th>用户名</th>
              <th>昵称</th>
              <th>允许使用的GPU</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="permission in userPermissions" :key="permission.userId">
              <td>{{ permission.username }}</td>
              <td>{{ permission.nickname }}</td>
              <td>
                <v-chip-group v-if="permission.allowedGpuIds.length > 0">
                  <v-chip v-for="gpuId in permission.allowedGpuIds" :key="gpuId" size="small" color="primary">
                    GPU-{{ gpuId }}
                  </v-chip>
                </v-chip-group>
                <span v-else class="text-grey">无权限</span>
              </td>
              <td>
                <v-btn @click="openEditDialog(permission)" size="small" variant="text" color="primary">
                  编辑权限
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>

        <v-alert v-if="!loading && userPermissions.length === 0" type="info" variant="tonal" class="mt-4">
          暂无用户权限数据
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- 编辑GPU权限对话框 -->
    <v-dialog v-model="editDialog" max-width="500">
      <v-card v-if="editingPermission">
        <v-card-title>
          <span class="text-h6">编辑GPU权限</span>
        </v-card-title>

        <v-divider />

        <v-card-text class="pt-4">
          <div class="mb-4">
            <div class="text-subtitle-2 mb-1">用户信息</div>
            <div class="text-body-2">
              <strong>用户名:</strong> {{ editingPermission.username }}
            </div>
            <div class="text-body-2">
              <strong>昵称:</strong> {{ editingPermission.nickname }}
            </div>
          </div>

          <v-divider class="my-4" />

          <div class="text-subtitle-2 mb-3">选择允许使用的GPU</div>

          <v-row>
            <v-col v-for="gpu in gpuResources" :key="gpu.id" cols="6">
              <v-checkbox v-model="selectedGpuIds" :value="gpu.id" :label="`${gpu.name}`" hide-details
                density="compact">
                <template v-slot:label>
                  <div class="d-flex align-center">
                    <span class="mr-2">{{ gpu.name }}</span>
                    <v-chip size="x-small" :color="getGpuStatusColor(gpu.status)">
                      {{ getGpuStatusText(gpu.status) }}
                    </v-chip>
                  </div>
                </template>
              </v-checkbox>
            </v-col>
          </v-row>

          <v-alert v-if="gpuResources.length === 0" type="warning" variant="tonal" class="mt-3">
            暂无可用的GPU资源
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="editDialog = false" variant="text">取消</v-btn>
          <v-btn @click="savePermission" color="primary" variant="elevated" :loading="saving">
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { gpuApi, type GpuResource, type UserGpuPermission } from '@/api/gpu'

const loading = ref(false)
const saving = ref(false)
const gpuResources = ref<GpuResource[]>([])
const userPermissions = ref<UserGpuPermission[]>([])
const editDialog = ref(false)
const editingPermission = ref<UserGpuPermission | null>(null)
const selectedGpuIds = ref<number[]>([])

// 加载GPU资源
const loadGpuResources = async () => {
  try {
    const { data } = await gpuApi.getGpuResources()
    gpuResources.value = data
  } catch (error) {
    console.error('加载GPU资源失败:', error)
  }
}

// 加载用户权限
const loadUserPermissions = async () => {
  loading.value = true
  try {
    const { data } = await gpuApi.getUserGpuPermissions()
    userPermissions.value = data
  } catch (error) {
    console.error('加载用户权限失败:', error)
  } finally {
    loading.value = false
  }
}

// 打开编辑对话框
const openEditDialog = (permission: UserGpuPermission) => {
  editingPermission.value = { ...permission }
  selectedGpuIds.value = [...permission.allowedGpuIds]
  editDialog.value = true
}

// 保存权限
const savePermission = async () => {
  if (!editingPermission.value) return

  saving.value = true
  try {
    await gpuApi.updateUserGpuPermission(editingPermission.value.userId, selectedGpuIds.value)

    // 更新本地数据
    const index = userPermissions.value.findIndex((p) => p.userId === editingPermission.value!.userId)
    if (index !== -1) {
      userPermissions.value[index].allowedGpuIds = [...selectedGpuIds.value]
    }

    editDialog.value = false
  } catch (error) {
    console.error('保存权限失败:', error)
    alert('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// 获取GPU状态颜色
const getGpuStatusColor = (status: string) => {
  const colors = {
    AVAILABLE: 'success',
    BUSY: 'warning',
    OFFLINE: 'error',
  }
  return colors[status as keyof typeof colors] || 'grey'
}

// 获取GPU状态文本
const getGpuStatusText = (status: string) => {
  const texts = {
    AVAILABLE: '可用',
    BUSY: '使用中',
    OFFLINE: '离线',
  }
  return texts[status as keyof typeof texts] || '未知'
}

// 格式化内存大小
const formatMemory = (mb: number) => {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`
  }
  return `${mb} MB`
}

// 组件挂载时加载数据
onMounted(() => {
  loadGpuResources()
  loadUserPermissions()
})
</script>

<style scoped>
.gpu-management {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}
</style>
