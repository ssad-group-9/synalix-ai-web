// 消息通知API类型定义和接口
import apiClient from './client'

export interface Notification {
    id: string
    title: string
    content: string
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
    read: boolean
    createdAt: string
}

export interface NotificationListResponse {
    notifications: Notification[]
    unreadCount: number
}

export const notificationApi = {
    // 获取通知列表
    getNotifications: () => apiClient.get<NotificationListResponse>('/api/notifications'),

    // 标记通知为已读
    markAsRead: (notificationId: string) =>
        apiClient.patch<void>(`/api/notifications/${notificationId}/read`),

    // 标记所有通知为已读
    markAllAsRead: () => apiClient.patch<void>('/api/notifications/read-all'),

    // 删除通知
    deleteNotification: (notificationId: string) =>
        apiClient.delete<void>(`/api/notifications/${notificationId}`),

    // 删除所有已读通知
    deleteAllRead: () => apiClient.delete<void>('/api/notifications/read'),
}
