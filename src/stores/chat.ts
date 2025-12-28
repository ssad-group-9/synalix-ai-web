import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ChatMessage, ChatContentPart } from '@/api/types'

export type ChatRole = 'user' | 'assistant'

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string | ChatContentPart[]
    timestamp: Date
}

export interface Conversation {
    id: string
    title: string
    taskId: string
    modelId: string | null
    messages: Message[]
    createdAt: Date
    updatedAt: Date
}

export const useChatStore = defineStore(
    'chat',
    () => {
        const conversations = ref<Conversation[]>([])
        const activeConversationId = ref<string | null>(null)

        // 会话 -> 消息列表
        const messagesByConversation = ref<Record<string, Message[]>>({})

        const messages = computed<Message[]>(() => {
            const id = activeConversationId.value
            if (!id) return []
            return messagesByConversation.value[id] ?? []
        })

        function ensureConversation(id: string, title = '新对话') {
            const now = new Date()
            const existing = conversations.value.find(c => c.id === id)
            if (!existing) {
                conversations.value.unshift({ id, title, createdAt: now, updatedAt: now, messages: [], taskId: '', modelId: null })
            }
            if (!messagesByConversation.value[id]) {
                messagesByConversation.value[id] = []
            }
            if (!activeConversationId.value) activeConversationId.value = id
        }

        function setActiveConversation(id: string | null) {
            activeConversationId.value = id
            if (id && !messagesByConversation.value[id]) messagesByConversation.value[id] = []
        }

        function setConversations(next: Conversation[]) {
            conversations.value = next
            // 确保 messagesByConversation 至少有键，避免 computed 空指针
            for (const c of next) {
                if (!messagesByConversation.value[c.id]) messagesByConversation.value[c.id] = []
            }
            if (!activeConversationId.value && next.length > 0 && next[0]) {
                activeConversationId.value = next[0].id
            }
        }

        function setMessages(conversationId: string, next: Message[]) {
            messagesByConversation.value[conversationId] = next
            const c = conversations.value.find(x => x.id === conversationId)
            if (c) c.updatedAt = new Date()
        }

        function addMessage(conversationId: string, msg: Message) {
            if (!messagesByConversation.value[conversationId]) messagesByConversation.value[conversationId] = []
            messagesByConversation.value[conversationId].push(msg)

            const c = conversations.value.find(x => x.id === conversationId)
            if (c) c.updatedAt = new Date()
        }

        function clearConversation(conversationId: string) {
            messagesByConversation.value[conversationId] = []
            const c = conversations.value.find(x => x.id === conversationId)
            if (c) c.updatedAt = new Date()
        }

        function removeConversation(conversationId: string) {
            conversations.value = conversations.value.filter(c => c.id !== conversationId)
            delete messagesByConversation.value[conversationId]
            if (activeConversationId.value === conversationId) {
                activeConversationId.value = conversations.value[0]?.id ?? null
            }
        }

        return {
            conversations,
            activeConversationId,
            messagesByConversation,
            messages,

            ensureConversation,
            setActiveConversation,
            setConversations,
            setMessages,
            addMessage,
            clearConversation,
            removeConversation,
        }
    },
    { persist: true },
)