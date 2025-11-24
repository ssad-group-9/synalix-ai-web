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
  email?: string
  enabled?: boolean
  role?: 'USER' | 'ADMIN'
}

export interface ChangePasswordRequest {
  oldPassword: string
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
