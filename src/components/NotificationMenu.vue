<template>
  <v-menu :close-on-content-click="false" location="bottom end" width="400">
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" class="mr-2">
        <v-badge :content="notificationStore.unreadCount" :model-value="notificationStore.unreadCount > 0" color="error"
          offset-x="-2" offset-y="-2">
          <v-icon icon="mdi-bell" />
        </v-badge>
        <v-tooltip activator="parent" location="bottom">
          消息通知
        </v-tooltip>
      </v-btn>
    </template>

    <v-card>
      <v-card-title class="d-flex align-center py-3">
        <span class="text-h6">消息通知</span>
        <v-spacer />
        <v-btn v-if="notificationStore.unreadCount > 0" @click="markAllAsRead" variant="text" size="small"
          color="primary">
          全部已读
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-list v-if="notificationStore.notifications.length > 0" max-height="400" class="pa-0" style="overflow-y: auto">
        <v-list-item v-for="notification in notificationStore.notifications" :key="notification.id"
          @click="openNotificationDetail(notification)" :class="{ 'notification-unread': !notification.read }">
          <template v-slot:prepend>
            <v-icon :color="getNotificationColor(notification.type)" :icon="getNotificationIcon(notification.type)" />
          </template>

          <v-list-item-title>
            {{ notification.title }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption">
            {{ formatDate(notification.createdAt) }}
          </v-list-item-subtitle>

          <template v-slot:append>
            <v-btn @click.stop="deleteNotification(notification.id)" icon variant="text" size="x-small">
              <v-icon size="small">mdi-close</v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </v-list>

      <v-card-text v-else class="text-center text-grey py-8">
        <v-icon size="64" color="grey-lighten-1">mdi-bell-outline</v-icon>
        <p class="mt-2">暂无消息</p>
      </v-card-text>
    </v-card>
  </v-menu>

  <!-- 消息详情对话框 -->
  <v-dialog v-model="detailDialog" max-width="600">
    <v-card v-if="selectedNotification">
      <v-card-title class="d-flex align-center">
        <v-icon :color="getNotificationColor(selectedNotification.type)"
          :icon="getNotificationIcon(selectedNotification.type)" class="mr-2" />
        <span>{{ selectedNotification.title }}</span>
        <v-spacer />
        <v-btn @click="detailDialog = false" icon variant="text" size="small">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <div class="text-caption text-grey mb-3">
          {{ formatDate(selectedNotification.createdAt) }}
        </div>
        <div class="text-body-1">
          {{ selectedNotification.content }}
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="deleteNotificationAndClose" color="error" variant="text">
          删除
        </v-btn>
        <v-btn v-if="!selectedNotification.read" @click="markAsReadAndClose" color="primary" variant="text">
          标记为已读
        </v-btn>
        <v-btn @click="detailDialog = false" color="primary" variant="elevated">
          关闭
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { notificationApi, type Notification } from '@/api/notification'

const notificationStore = useNotificationStore()
const detailDialog = ref(false)
const selectedNotification = ref<Notification | null>(null)

// 加载通知列表
const loadNotifications = async () => {
  try {
    const { data } = await notificationApi.getNotifications()
    notificationStore.setNotifications(data.notifications)
  } catch (error) {
    console.error('加载通知失败:', error)
  }
}

// 打开通知详情
const openNotificationDetail = async (notification: Notification) => {
  selectedNotification.value = notification
  detailDialog.value = true

  // 如果是未读通知，标记为已读
  if (!notification.read) {
    try {
      await notificationApi.markAsRead(notification.id)
      notificationStore.markAsRead(notification.id)
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }
}

// 标记所有为已读
const markAllAsRead = async () => {
  try {
    await notificationApi.markAllAsRead()
    notificationStore.markAllAsRead()
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

// 删除通知
const deleteNotification = async (notificationId: string) => {
  try {
    await notificationApi.deleteNotification(notificationId)
    notificationStore.deleteNotification(notificationId)
  } catch (error) {
    console.error('删除通知失败:', error)
  }
}

// 标记为已读并关闭
const markAsReadAndClose = async () => {
  if (selectedNotification.value) {
    try {
      await notificationApi.markAsRead(selectedNotification.value.id)
      notificationStore.markAsRead(selectedNotification.value.id)
      detailDialog.value = false
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }
}

// 删除通知并关闭
const deleteNotificationAndClose = async () => {
  if (selectedNotification.value) {
    await deleteNotification(selectedNotification.value.id)
    detailDialog.value = false
  }
}

// 获取通知图标
const getNotificationIcon = (type: string) => {
  const icons = {
    INFO: 'mdi-information',
    WARNING: 'mdi-alert',
    ERROR: 'mdi-alert-circle',
    SUCCESS: 'mdi-check-circle',
  }
  return icons[type as keyof typeof icons] || 'mdi-bell'
}

// 获取通知颜色
const getNotificationColor = (type: string) => {
  const colors = {
    INFO: 'blue',
    WARNING: 'orange',
    ERROR: 'red',
    SUCCESS: 'green',
  }
  return colors[type as keyof typeof colors] || 'grey'
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }

  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }

  // 小于24小时
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  }

  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  }

  // 超过7天显示完整日期
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 组件挂载时加载通知
onMounted(() => {
  loadNotifications()

  // 设置定期刷新通知（每30秒）
  const intervalId = setInterval(loadNotifications, 30000)

  // 组件卸载时清除定时器
  return () => clearInterval(intervalId)
})
</script>

<style scoped>
.notification-unread {
  background-color: rgba(25, 118, 210, 0.08);
}
</style>
