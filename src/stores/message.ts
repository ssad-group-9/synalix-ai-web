import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message } from '@/api/message'

export const useMessageStore = defineStore('message', () => {
    const messages = ref<Message[]>([])

    const setMessages = (newMessages: Message[]) => {
        messages.value = newMessages
    }

    const addMessage = (message: Message) => {
        messages.value.unshift(message)
    }

    const deleteMessage = (messageId: string) => {
        const index = messages.value.findIndex((m) => m.id === messageId)
        if (index !== -1) {
            messages.value.splice(index, 1)
        }
    }

    const publicMessages = computed(() => {
        return messages.value.filter((m) => m.visibility === 'PUBLIC')
    })

    const privateMessages = computed(() => {
        return messages.value.filter((m) => m.visibility === 'PRIVATE')
    })

    return {
        messages,
        publicMessages,
        privateMessages,
        setMessages,
        addMessage,
        deleteMessage,
    }
})
