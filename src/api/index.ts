import apiClient from './client'
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  User,
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
}
