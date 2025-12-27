// 消息通知API类型定义和接口
import apiClient from './client'

// 消息可见性枚举
export enum MessageVisibility {
    PUBLIC = 'PUBLIC',
    PRIVATE = 'PRIVATE'
}

// 消息类型
export type MessageType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'ANNOUNCEMENT' | 'SYSTEM'

export interface Message {
    id: string
    messageType: MessageType
    messageContent: string
    visibility: MessageVisibility
    targetUserId: string | null
    createdAt: string
}

export interface CreateMessageRequest {
    messageType: string
    messageContent: string
    visibility: MessageVisibility
    targetUserId?: string | null
}

export const messageApi = {
    // 创建消息（仅管理员）
    createMessage: (data: CreateMessageRequest) =>
        apiClient.post<Message>('/api/messages', data),

    // 获取消息列表
    getMessages: (all: boolean = false) =>
        apiClient.get<Message[]>('/api/messages', { params: { all } }),

    // 获取单个消息详情
    getMessage: (messageId: string) =>
        apiClient.get<Message>(`/api/messages/${messageId}`),

    // 删除消息（仅管理员）
    deleteMessage: (messageId: string) =>
        apiClient.delete<void>(`/api/messages/${messageId}`),
}
