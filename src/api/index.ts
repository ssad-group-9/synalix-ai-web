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
