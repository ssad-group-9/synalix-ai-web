import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Notification } from '@/api/notification'

export const useNotificationStore = defineStore('notification', () => {
    const notifications = ref<Notification[]>([])
    const unreadCount = ref(0)

    const setNotifications = (newNotifications: Notification[]) => {
        notifications.value = newNotifications
        updateUnreadCount()
    }

    const addNotification = (notification: Notification) => {
        notifications.value.unshift(notification)
        updateUnreadCount()
    }

    const markAsRead = (notificationId: string) => {
        const notification = notifications.value.find((n) => n.id === notificationId)
        if (notification) {
            notification.read = true
            updateUnreadCount()
        }
    }

    const markAllAsRead = () => {
        notifications.value.forEach((n) => (n.read = true))
        updateUnreadCount()
    }

    const deleteNotification = (notificationId: string) => {
        const index = notifications.value.findIndex((n) => n.id === notificationId)
        if (index !== -1) {
            notifications.value.splice(index, 1)
            updateUnreadCount()
        }
    }

    const deleteAllRead = () => {
        notifications.value = notifications.value.filter((n) => !n.read)
        updateUnreadCount()
    }

    const updateUnreadCount = () => {
        unreadCount.value = notifications.value.filter((n) => !n.read).length
    }

    const unreadNotifications = computed(() => {
        return notifications.value.filter((n) => !n.read)
    })

    return {
        notifications,
        unreadCount,
        unreadNotifications,
        setNotifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllRead,
    }
})
