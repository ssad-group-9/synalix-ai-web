<template>
  <v-menu :close-on-content-click="false" location="bottom end" width="400">
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" class="mr-2">
        <v-icon icon="mdi-bell" />
        <v-tooltip activator="parent" location="bottom">
          消息通知
        </v-tooltip>
      </v-btn>
    </template>

    <v-card>
      <v-card-title class="d-flex align-center py-3">
        <span class="text-h6">消息通知</span>
        <v-spacer />
        <v-btn v-if="isAdmin" @click="openCreateDialog" variant="text" size="small" color="primary">
          <v-icon start>mdi-plus</v-icon>
          创建消息
        </v-btn>
      </v-card-title>

      <v-divider />

      <div 
        v-if="messageStore.messages.length > 0" 
        class="message-list-container"
        @wheel.stop="handleWheel"
      >
        <v-list class="pa-0 message-list">
          <v-list-item v-for="message in messageStore.messages" :key="message.id"
            @click="openMessageDetail(message)">
            <template v-slot:prepend>
              <v-icon :color="getMessageColor(message.messageType)" :icon="getMessageIcon(message.messageType)" />
            </template>

            <v-list-item-title>
              {{ getMessageTypeText(message.messageType) }}
            </v-list-item-title>

            <v-list-item-subtitle class="text-caption">
              {{ formatDate(message.createdAt) }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-btn v-if="isAdmin" @click.stop="deleteMessage(message.id)" icon variant="text" size="x-small">
                <v-icon size="small">mdi-close</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <v-card-text v-else class="text-center text-grey py-8">
        <v-icon size="64" color="grey-lighten-1">mdi-bell-outline</v-icon>
        <p class="mt-2">暂无消息</p>
      </v-card-text>
    </v-card>
  </v-menu>

  <!-- 消息详情对话框 -->
  <v-dialog v-model="detailDialog" max-width="600">
    <v-card v-if="selectedMessage">
      <v-card-title class="d-flex align-center">
        <v-icon :color="getMessageColor(selectedMessage.messageType)"
          :icon="getMessageIcon(selectedMessage.messageType)" class="mr-2" />
        <span>{{ getMessageTypeText(selectedMessage.messageType) }}</span>
        <v-spacer />
        <v-btn @click="detailDialog = false" icon variant="text" size="small">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <div class="text-caption text-grey mb-3">
          {{ formatDate(selectedMessage.createdAt) }}
        </div>
        <div class="text-body-1" style="white-space: pre-wrap;">
          {{ selectedMessage.messageContent }}
        </div>
        <v-chip v-if="selectedMessage.visibility === 'PRIVATE'" color="primary" size="small" class="mt-3">
          <v-icon start size="small">mdi-lock</v-icon>
          私密消息
        </v-chip>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn v-if="isAdmin" @click="deleteMessageAndClose" color="error" variant="text">
          删除
        </v-btn>
        <v-btn @click="detailDialog = false" color="primary" variant="elevated">
          关闭
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 创建消息对话框 -->
  <v-dialog v-model="createDialog" max-width="600">
    <v-card>
      <v-card-title>创建消息</v-card-title>
      <v-divider />
      
      <v-card-text class="pt-4">
        <v-form ref="createFormRef" v-model="formValid">
          <v-select
            v-model="newMessage.messageType"
            :items="messageTypes"
            label="消息类型 *"
            :rules="[v => !!v || '请选择消息类型']"
            required
          />

          <v-textarea
            v-model="newMessage.messageContent"
            label="消息内容 *"
            rows="4"
            :rules="[
              v => !!v || '请输入消息内容',
              v => (v && v.length <= 2000) || '消息内容不能超过2000字符'
            ]"
            counter="2000"
            required
          />

          <v-select
            v-model="newMessage.visibility"
            :items="visibilityOptions"
            label="可见性 *"
            :rules="[v => !!v || '请选择可见性']"
            required
          />

          <v-text-field
            v-if="newMessage.visibility === 'PRIVATE'"
            v-model="newMessage.targetUserId"
            label="目标用户ID（仅私密消息需要）"
            placeholder="输入用户UUID"
            :rules="newMessage.visibility === 'PRIVATE' ? [v => !!v || '私密消息需要指定目标用户'] : []"
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeCreateDialog" variant="text">
          取消
        </v-btn>
        <v-btn @click="createMessage" color="primary" variant="elevated" :disabled="!formValid || creating">
          {{ creating ? '创建中...' : '创建' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 提示消息 -->
  <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
    {{ snackbar.message }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useMessageStore } from '@/stores/message'
import { useAuthStore } from '@/stores/auth'
import { messageApi, type Message, type MessageType, MessageVisibility, type CreateMessageRequest } from '@/api/message'

const messageStore = useMessageStore()
const authStore = useAuthStore()
const detailDialog = ref(false)
const selectedMessage = ref<Message | null>(null)
const createDialog = ref(false)
const createFormRef = ref()
const formValid = ref(false)
const creating = ref(false)

// 新消息表单
const newMessage = reactive<CreateMessageRequest>({
  messageType: '',
  messageContent: '',
  visibility: MessageVisibility.PUBLIC,
  targetUserId: null
})

// 消息类型选项
const messageTypes = [
  { title: '信息', value: 'INFO' },
  { title: '警告', value: 'WARNING' },
  { title: '错误', value: 'ERROR' },
  { title: '成功', value: 'SUCCESS' },
  { title: '公告', value: 'ANNOUNCEMENT' },
  { title: '系统消息', value: 'SYSTEM' },
]

// 可见性选项
const visibilityOptions = [
  { title: '公开（所有用户可见）', value: MessageVisibility.PUBLIC },
  { title: '私密（仅目标用户可见）', value: MessageVisibility.PRIVATE },
]

// 提示消息
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success' as 'success' | 'error' | 'warning'
})

// 判断是否为管理员
const isAdmin = computed(() => authStore.isAdmin())

// 加载消息列表
const loadMessages = async () => {
  try {
    const { data } = await messageApi.getMessages(false)
    messageStore.setMessages(data)
  } catch (error) {
    console.error('加载消息失败:', error)
  }
}

// 打开消息详情
const openMessageDetail = async (message: Message) => {
  selectedMessage.value = message
  detailDialog.value = true
}

// 删除消息（仅管理员）
const deleteMessage = async (messageId: string) => {
  if (!isAdmin.value) {
    console.error('只有管理员可以删除消息')
    return
  }
  
  try {
    await messageApi.deleteMessage(messageId)
    messageStore.deleteMessage(messageId)
  } catch (error) {
    console.error('删除消息失败:', error)
  }
}

// 删除消息并关闭对话框
const deleteMessageAndClose = async () => {
  if (selectedMessage.value) {
    await deleteMessage(selectedMessage.value.id)
    detailDialog.value = false
  }
}

// 打开创建消息对话框
const openCreateDialog = () => {
  createDialog.value = true
}

// 关闭创建消息对话框
const closeCreateDialog = () => {
  createDialog.value = false
  // 重置表单
  newMessage.messageType = ''
  newMessage.messageContent = ''
  newMessage.visibility = MessageVisibility.PUBLIC
  newMessage.targetUserId = null
  if (createFormRef.value) {
    createFormRef.value.reset()
  }
}

// 创建消息
const createMessage = async () => {
  if (!formValid.value || creating.value) return
  
  creating.value = true
  try {
    const { data } = await messageApi.createMessage({
      messageType: newMessage.messageType,
      messageContent: newMessage.messageContent,
      visibility: newMessage.visibility,
      targetUserId: newMessage.visibility === MessageVisibility.PRIVATE ? newMessage.targetUserId : null
    })
    
    // 添加到消息列表
    messageStore.addMessage(data)
    
    // 显示成功提示
    snackbar.message = '消息创建成功'
    snackbar.color = 'success'
    snackbar.show = true
    
    // 关闭对话框
    closeCreateDialog()
    
    // 刷新消息列表
    await loadMessages()
  } catch (error: any) {
    console.error('创建消息失败:', error)
    snackbar.message = error.response?.data?.message || '创建消息失败'
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    creating.value = false
  }
}

// 获取消息类型文本
const getMessageTypeText = (type: MessageType): string => {
  const typeTexts: Record<MessageType, string> = {
    INFO: '信息',
    WARNING: '警告',
    ERROR: '错误',
    SUCCESS: '成功',
    ANNOUNCEMENT: '公告',
    SYSTEM: '系统消息',
  }
  return typeTexts[type] || '消息'
}

// 获取消息图标
const getMessageIcon = (type: MessageType): string => {
  const icons: Record<MessageType, string> = {
    INFO: 'mdi-information',
    WARNING: 'mdi-alert',
    ERROR: 'mdi-alert-circle',
    SUCCESS: 'mdi-check-circle',
    ANNOUNCEMENT: 'mdi-bullhorn',
    SYSTEM: 'mdi-cog',
  }
  return icons[type] || 'mdi-bell'
}

// 获取消息颜色
const getMessageColor = (type: MessageType): string => {
  const colors: Record<MessageType, string> = {
    INFO: 'blue',
    WARNING: 'orange',
    ERROR: 'red',
    SUCCESS: 'green',
    ANNOUNCEMENT: 'purple',
    SYSTEM: 'grey',
  }
  return colors[type] || 'grey'
}

// 格式化日期
const formatDate = (dateString: string): string => {
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

// 处理滚轮事件，防止冒泡到页面
const handleWheel = (event: WheelEvent) => {
  const container = event.currentTarget as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = container
  
  // 如果向下滚且已经到底部，或向上滚且已经到顶部，则阻止默认行为
  const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1
  const isAtTop = scrollTop <= 1
  
  if ((event.deltaY > 0 && isAtBottom) || (event.deltaY < 0 && isAtTop)) {
    // 已经到边界，不阻止，让页面滚动
    return
  }
  
  // 在消息列表内部滚动，阻止事件冒泡
  event.stopPropagation()
}

// 组件挂载时加载消息
onMounted(() => {
  loadMessages()

  // 设置定期刷新消息（每30秒）
  const intervalId = setInterval(loadMessages, 30000)

  // 组件卸载时清除定时器
  return () => clearInterval(intervalId)
})
</script>

<style scoped>
.message-unread {
  background-color: rgba(25, 118, 210, 0.08);
}

.message-list-container {
  /* 每条消息大约72px，5条共360px */
  max-height: 360px;
  overflow-y: auto;
  overflow-x: hidden;
}

.message-list {
  background-color: transparent;
}

/* 自定义滚动条样式 */
.message-list-container::-webkit-scrollbar {
  width: 6px;
}

.message-list-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.message-list-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.message-list-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
