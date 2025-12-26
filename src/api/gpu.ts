// GPU资源管理相关类型和API
import apiClient from './client'

export interface GpuResource {
    id: number
    name: string
    status: 'AVAILABLE' | 'BUSY' | 'OFFLINE'
    memoryTotal: number
    memoryUsed: number
    memoryFree: number
}

export interface UserGpuPermission {
    userId: string
    username: string
    nickname: string
    allowedGpuIds: number[]
}

export const gpuApi = {
    // 获取所有GPU资源
    getGpuResources: () => apiClient.get<GpuResource[]>('/api/gpu/resources'),

    // 获取用户GPU权限列表
    getUserGpuPermissions: () => apiClient.get<UserGpuPermission[]>('/api/gpu/permissions'),

    // 更新用户GPU权限
    updateUserGpuPermission: (userId: string, gpuIds: number[]) =>
        apiClient.put<UserGpuPermission>(`/api/gpu/permissions/${userId}`, { gpuIds }),

    // 获取特定用户的GPU权限
    getUserGpuPermission: (userId: string) =>
        apiClient.get<UserGpuPermission>(`/api/gpu/permissions/${userId}`),
}
