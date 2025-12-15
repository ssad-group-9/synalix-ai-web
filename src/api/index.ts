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
  UploadUrlResponse,
  Task,
  CreateTaskRequest,
  TaskMetrics,
  Resource,
} from './types'

export const authApi = {
  // 登录
  login: (data: LoginRequest) => apiClient.post<LoginResponse>('/auth/login', data),

  // 刷新token
  refresh: (data: RefreshTokenRequest) =>
    apiClient.post<RefreshTokenResponse>('/auth/refresh', data),

  // 退出登录
  logout: (data: LogoutRequest) => apiClient.post<void>('/auth/logout', data),
}

export const userApi = {
  // 获取当前用户信息
  getCurrentUser: () => apiClient.get<User>('/users/me'),

  // 更新当前用户信息
  updateCurrentUser: (data: UpdateUserRequest) => apiClient.patch<User>('/users/me', data),

  // 修改当前用户密码
  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post<void>('/users/me/password', data),

  // 创建用户（管理员）
  createUser: (data: CreateUserRequest) => apiClient.post<CreateUserResponse>('/users', data),

  // 获取全部用户（管理员）
  getAllUsers: () => apiClient.get<User[]>('/users'),

  // 获取用户信息（管理员）
  getUser: (userId: string) => apiClient.get<User>(`/users/${userId}`),

  // 更新用户信息（管理员）
  updateUser: (userId: string, data: UpdateUserRequest) => apiClient.patch<User>(`/users/${userId}`, data),

  // 删除用户（管理员）
  deleteUser: (userId: string) => apiClient.delete<void>(`/users/${userId}`),

  // 重置用户密码（管理员）
  resetUserPassword: (userId: string) => apiClient.post<string>(`/users/${userId}/password`),
}

// ========== Model API ==========
export const modelApi = {
  // 获取所有模型列表
  getModels: () => apiClient.get<Model[]>('/models'),

  // 注册新模型
  createModel: (data: CreateModelRequest) => apiClient.post<Model>('/models', data),

  // 获取模型详情
  getModel: (id: string) => apiClient.get<Model>(`/models/${id}`),

  // 删除模型
  deleteModel: (id: string) => apiClient.delete<void>(`/models/${id}`),
}

// ========== Dataset API ==========
export const datasetApi = {
  // 获取数据集列表
  getDatasets: () => apiClient.get<Dataset[]>('/datasets'),

  // 注册数据集
  createDataset: (data: CreateDatasetRequest) => apiClient.post<Dataset>('/datasets', data),

  // 获取数据集详情
  getDataset: (id: string) => apiClient.get<Dataset>(`/datasets/${id}`),

  // 删除数据集
  deleteDataset: (id: string) => apiClient.delete<void>(`/datasets/${id}`),

  // 获取上传URL
  getUploadUrl: (id: string) => apiClient.get<UploadUrlResponse>(`/datasets/${id}/upload-url`),

  // 获取下载URL
  getDownloadUrl: (id: string) => apiClient.get<UploadUrlResponse>(`/datasets/${id}/download-url`),
}

// ========== Task API ==========
export const taskApi = {
  // 获取任务列表
  getTasks: (params?: { status?: string; type?: string }) =>
    apiClient.get<Task[]>('/tasks', { params }),

  // 创建并启动任务
  createTask: (data: CreateTaskRequest) => apiClient.post<Task>('/tasks', data),

  // 获取任务详情
  getTask: (id: string) => apiClient.get<Task>(`/tasks/${id}`),

  // 停止任务
  stopTask: (id: string) => apiClient.post<Task>(`/tasks/${id}/stop`),

  // 获取任务日志
  getTaskLogs: (id: string) => apiClient.get<string>(`/tasks/${id}/logs`),

  // 获取任务指标
  getTaskMetrics: (id: string) => apiClient.get<TaskMetrics[]>(`/tasks/${id}/metrics`),
}

// ========== Resource API ==========
export const resourceApi = {
  // 获取GPU资源列表及状态
  getResources: () => apiClient.get<Resource[]>('/resources'),
}
