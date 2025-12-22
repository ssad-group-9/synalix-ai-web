// API类型定义
export interface User {
  id: string
  username: string
  nickname: string
  email: string | null
  role: 'USER' | 'ADMIN'
  enabled: boolean
  createdAt: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
}

export interface LogoutRequest {
  refreshToken: string
}

export interface UpdateUserRequest {
  nickname?: string
  email?: string | null
  enabled?: boolean
  role?: 'USER' | 'ADMIN'
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface CreateUserRequest {
  username: string
  nickname: string
  email?: string | null
  role: 'USER' | 'ADMIN'
}

export interface CreateUserResponse {
  user: User
  generatedPassword: string
}

export interface ResetPasswordResponse {
  newPassword: string
}

export interface ApiErrorResponse {
  status: number
  error: string
  code: string
  message: string
  path: string
  details?: unknown
}

// ========== Model Types ==========
export interface Model {
  id: string
  name: string
  type: 'LLM' | 'CV' | 'OTHER'
  description: string
  version: string
  createdAt: string
}

export interface CreateModelRequest {
  name: string
  type: 'LLM' | 'CV' | 'OTHER'
  description: string
  version: string
}

// ========== Dataset Types ==========
export interface Dataset {
  id: string
  name: string
  description: string
  size: number
  path: string
  uploadedBy: string
  createdAt: string
}

export interface CreateDatasetRequest {
  name: string
  description: string
}

export interface UploadUrlResponse {
  url: string
  method: string
  expiresAt: string
}

// ========== Task Types ==========
export interface Task {
  id: string
  name: string
  type: 'TRAINING' | 'INFERENCE'
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED'
  modelId: string
  datasetId: string
  config: Record<string, unknown>
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CreateTaskRequest {
  name: string
  type: 'TRAINING' | 'INFERENCE'
  modelId: string
  datasetId: string
  config: Record<string, unknown>
}

export interface TaskMetrics {
  taskId: string
  epoch: number
  loss: number
  accuracy: number
  timestamp: string
}

export interface TaskChart {
  taskId: string
  chartUrl: string
}

// ========== Resource Types ==========
export interface Resource {
  id: number
  name: string
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE'
  memoryTotal: number
  memoryUsed: number
}
