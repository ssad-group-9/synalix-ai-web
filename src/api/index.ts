import apiClient from './client'
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  CreateUserRequest,
  CreateUserResponse,
  User,
  Model,
  CreateModelRequest,
  Dataset,
  CreateDatasetRequest,
  PresignedUrlResponse,
  Task,
  CreateTaskRequest,
  TaskMetrics,
  TaskChart,
  Resource,
  Checkpoints,
  ChatCompletionsRequest,
  ChatCompletionsResponse,
  CheckpointDownloadUrlResponse,
  CreateFileRequest,
  FileResponse,
} from './types'

export const authApi = {
  // 登录
  login: (data: LoginRequest) => apiClient.post<LoginResponse>('/api/auth/login', data),

  // 刷新token
  refresh: (data: RefreshTokenRequest) =>
    apiClient.post<RefreshTokenResponse>('/api/auth/refresh', data),

  // 退出登录
  logout: (data: LogoutRequest) => apiClient.post<void>('/api/auth/logout', data),
}

export const userApi = {
  // 获取当前用户信息
  getCurrentUser: () => apiClient.get<User>('/api/users/me'),

  // 更新当前用户信息
  updateCurrentUser: (data: UpdateUserRequest) => apiClient.patch<User>('/api/users/me', data),

  // 修改当前用户密码
  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post<void>('/api/users/me/password', data),

  // 创建用户（管理员）
  createUser: (data: CreateUserRequest) => apiClient.post<CreateUserResponse>('/api/users', data),

  // 获取全部用户（管理员）
  getAllUsers: () => apiClient.get<User[]>('/api/users'),

  // 获取用户信息（管理员）
  getUser: (userId: string) => apiClient.get<User>(`/api/users/${userId}`),

  // 更新用户信息（管理员）
  updateUser: (userId: string, data: UpdateUserRequest) => apiClient.patch<User>(`/api/users/${userId}`, data),

  // 删除用户（管理员）
  deleteUser: (userId: string) => apiClient.delete<void>(`/api/users/${userId}`),

  // 重置用户密码（管理员）
  resetUserPassword: (userId: string) => apiClient.post<string>(`/api/users/${userId}/password`),
}

// ========== Model API ==========
export const modelApi = {
  // 获取所有模型列表
  getModels: () => apiClient.get<Model[]>('/api/models'),

  // 注册新模型
  createModel: (data: CreateModelRequest) => apiClient.post<Model>('/api/models', data),

  // 获取模型详情
  getModel: (id: string) => apiClient.get<Model>(`/api/models/${id}`),

  // 删除模型
  deleteModel: (id: string) => apiClient.delete<void>(`/api/models/${id}`),
}

export const checkpointsApi = {
  getCheckpoints: (id: string) => apiClient.get<Checkpoints[]>(`/api/checkpoints/${id}`),
  getDownloadUrl: (checkpointId: string) =>
    apiClient.get<CheckpointDownloadUrlResponse>(`/api/checkpoints/${checkpointId}/download-url`),
}

// ========== Dataset API ==========
export const datasetApi = {
  // 获取数据集列表
  getDatasets: () => apiClient.get<Dataset[]>('/api/datasets'),

  // 注册数据集
  createDataset: (data: CreateDatasetRequest) => apiClient.post<Dataset>('/api/datasets', data),

  // 获取数据集详情
  getDataset: (id: string) => apiClient.get<Dataset>(`/api/datasets/${id}`),

  // 删除数据集
  deleteDataset: (id: string) => apiClient.delete<void>(`/api/datasets/${id}`),

  // 获取上传URL
  getUploadUrl: (id: string) => apiClient.get<PresignedUrlResponse>(`/api/datasets/${id}/upload-url`),

  // 获取下载URL
  getDownloadUrl: (id: string) => apiClient.get<PresignedUrlResponse>(`/api/datasets/${id}/download-url`),

  updateDataset: (id: string) => apiClient.post<Boolean>(`/api/datasets/${id}/update-dataset`),
}

// ========== Task API ==========
export const taskApi = {
  // 获取任务列表
  getTasks: (params?: { status?: string; type?: string }) =>
    apiClient.get<Task[]>('/api/tasks', { params }),

  // 创建并启动任务
  createTask: (data: CreateTaskRequest) => apiClient.post<Task>('/api/tasks', data),

  // 获取任务详情
  getTask: (id: string) => apiClient.get<Task>(`/api/tasks/${id}`),

  // 停止任务
  stopTask: (id: string) => apiClient.post<Task>(`/api/tasks/${id}/stop`),

  // 获取任务日志
  getTaskLogs: (id: string) => apiClient.get<string>(`/api/tasks/${id}/logs`),

  // 获取任务指标
  getTaskMetrics: (id: string) => apiClient.get<TaskMetrics[]>(`/api/tasks/${id}/metrics`),


  getTaskChart: (id: string) => apiClient.get<TaskChart>(`/api/tasks/${id}/chart`),
}

// ========== Chat API ==========
export const chatApi = {
  /**
   * 发送聊天补全请求到后端 /api/chat/{id}/completions
   * @param taskId 后端任务 id（路径中的 {id}）
   * @param payload 已在前端组装好的 completions 请求体
   */
  async sendCompletions(taskId: string, payload: ChatCompletionsRequest) {
    const { data } = await apiClient.post<ChatCompletionsResponse>(
      `/api/chat/${taskId}/completions`,
      payload,
    )
    return data
  }
}


export const filesApi = {
  async createFile(payload: CreateFileRequest) {
    const { data } = await apiClient.post<FileResponse>('/api/files', payload)
    return data
  },

  async getUploadUrl(id: string) {
    const { data } = await apiClient.get<PresignedUrlResponse>(`/api/files/${id}/upload-url`)
    return data
  },

  async getDownloadUrl(id: string) {
    const { data } = await apiClient.get<PresignedUrlResponse>(`/api/files/${id}/download-url`)
    return data
  },
}

// ========== Resource API ==========
export const resourceApi = {
  // 获取GPU资源列表及状态
  getResources: () => apiClient.get<Resource[]>('/api/resources'),
}

export const htmlApi = {
  // 获取GPU资源列表及状态
  getHtml: (url: string) => apiClient.get<string>(url),
}

// 导出通知API
export { notificationApi } from './notification'

// 导出GPU管理API
export { gpuApi } from './gpu'
