<template>
  <div class="chat-container">
    <v-row class="h-100" no-gutters>
      <!-- 左侧：模型和对话历史 -->
      <v-col cols="12" md="3" class="left-sidebar">
        <v-card class="h-100" elevation="2">
          <!-- 模型选择部分 -->
          <v-card-title class="text-subtitle-1">选择模型</v-card-title>
          <v-card-text class="pb-0">
            <v-select
              v-model="selectedModelId"
              :items="models"
              item-title="name"
              item-value="id"
              label="可用模型"
              variant="outlined"
              density="comfortable"
              @update:model-value="onModelChange"
              class="mb-4"
            />
          </v-card-text>

          <!-- 对话历史 -->
          <v-divider class="my-4" />
          <v-card-title class="text-subtitle-1">对话历史</v-card-title>
          <v-card-text class="pb-0">
            <v-list density="compact" v-if="conversations.length > 0">
              <v-list-item
                v-for="conv in conversations"
                :key="conv.id"
                @click="selectConversation(conv)"
                :active="activeConversationId === conv.id"
                class="conversation-item"
              >
                <template v-slot:default>
                  <div class="conversation-title">
                    {{ conv.title }}
                  </div>
                  <div class="conversation-date">
                    {{ formatDate(conv.createdAt) }}
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <v-empty-state
              v-else
              :image-height="150"
              headline="暂无对话"
              text="开始新的对话"
            >
              <template v-slot:media>
                <v-icon color="primary" size="60">mdi-chat-outline</v-icon>
              </template>
            </v-empty-state>
          </v-card-text>

          <!-- 新建对话按钮 -->
          <v-card-actions class="mt-4">
            <v-btn
              @click="startNewConversation"
              color="primary"
              variant="elevated"
              block
              prepend-icon="mdi-plus"
            >
              新建对话
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- 右侧：主聊天区域 -->
      <v-col cols="12" md="9" class="right-content">
        <v-card class="h-100" elevation="0" style="display: flex; flex-direction: column">
          <!-- 聊天消息区域 -->
          <div class="messages-area">
            <v-progress-linear v-if="loading" indeterminate color="primary" />

            <v-empty-state
              v-if="messages.length === 0 && !selectedModelId"
              :image-height="200"
              headline="选择模型开始聊天"
              text="请先从左侧选择一个模型"
            >
              <template v-slot:media>
                <v-icon color="primary" size="100">mdi-robot-outline</v-icon>
              </template>
            </v-empty-state>

            <div v-else-if="messages.length === 0" class="welcome-section">
              <div class="welcome-content">
                <v-icon color="primary" size="64">mdi-chat-outline</v-icon>
                <h2>与 {{ selectedModelName }} 开始聊天</h2>
                <p>输入您的问题或请求，让AI助手帮您解答</p>
              </div>
            </div>

            <div v-else class="messages-list">
              <div
                v-for="message in messages"
                :key="message.id"
                class="message-item"
                :class="{ 'message-user': message.role === 'user', 'message-assistant': message.role === 'assistant' }"
              >
                <div class="message-avatar">
                  <v-avatar size="32" v-if="message.role === 'assistant'">
                    <v-icon>mdi-robot-outline</v-icon>
                  </v-avatar>
                  <v-avatar size="32" v-else>
                    <v-icon>mdi-account-circle</v-icon>
                  </v-avatar>
                </div>
                <div class="message-content">
                  <div class="message-bubble">{{ message.content }}</div>
                  <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                </div>
              </div>

              <!-- 加载指示器 -->
              <div v-if="isWaitingForResponse" class="message-item message-assistant">
                <div class="message-avatar">
                  <v-avatar size="32">
                    <v-icon>mdi-robot-outline</v-icon>
                  </v-avatar>
                </div>
                <div class="message-content">
                  <div class="message-bubble typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 输入区域 -->
          <v-divider />
          <div class="input-area">
            <v-row no-gutters class="px-4 py-3" align="center">
              <v-col cols="10">
                <v-text-field
                  v-model="inputMessage"
                  placeholder="输入您的问题或请求..."
                  variant="outlined"
                  density="comfortable"
                  :disabled="!selectedModelId || isWaitingForResponse"
                  @keyup.enter="sendMessage"
                  prepend-inner-icon="mdi-message-outline"
                  clearable
                />
              </v-col>
              <v-col cols="2" class="pl-3">
                <v-btn
                  @click="sendMessage"
                  icon="mdi-send"
                  color="primary"
                  :disabled="!selectedModelId || !inputMessage.trim() || isWaitingForResponse"
                  variant="elevated"
                  block
                />
              </v-col>
            </v-row>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { modelApi } from '@/api'
import type { Model } from '@/api/types'

// 响应式数据
const models = ref<Model[]>([])
const selectedModelId = ref<string>('')
const inputMessage = ref('')
const loading = ref(false)
const isWaitingForResponse = ref(false)
const activeConversationId = ref<string | null>(null)

// 消息和对话数据
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  createdAt: Date
  messages: Message[]
}

const messages = ref<Message[]>([])
const conversations = ref<Conversation[]>([])
let messageIdCounter = 0
let conversationIdCounter = 0

// 计算属性
const selectedModelName = computed(() => {
  const model = models.value.find((m) => m.id === selectedModelId.value)
  return model?.name || ''
})

// 方法
const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatTime = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const loadModels = async () => {
  loading.value = true
  try {
    const response = await modelApi.getModels()
    models.value = response.data
    if (models.value.length > 0) {
      selectedModelId.value = models.value[0].id
    }
  } catch (error) {
    console.error('加载模型失败:', error)
  } finally {
    loading.value = false
  }
}

const onModelChange = (modelId: string) => {
  selectedModelId.value = modelId
  messages.value = []
  activeConversationId.value = null
}

const startNewConversation = () => {
  messages.value = []
  activeConversationId.value = null
  inputMessage.value = ''
}

const selectConversation = (conversation: Conversation) => {
  activeConversationId.value = conversation.id
  messages.value = [...conversation.messages]
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || !selectedModelId.value) return

  const userMessage: Message = {
    id: `msg-${messageIdCounter++}`,
    role: 'user',
    content: inputMessage.value,
    timestamp: new Date(),
  }

  messages.value.push(userMessage)
  inputMessage.value = ''

  // 如果这是对话的第一条消息，创建新对话
  if (activeConversationId.value === null) {
    const newConvId = `conv-${conversationIdCounter++}`
    activeConversationId.value = newConvId
  }

  // 更新或创建对话
  const convIndex = conversations.value.findIndex((c) => c.id === activeConversationId.value)
  if (convIndex >= 0) {
    conversations.value[convIndex].messages.push(userMessage)
  } else {
    conversations.value.push({
      id: activeConversationId.value!,
      title: userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : ''),
      createdAt: new Date(),
      messages: [userMessage],
    })
  }

  // 模拟AI回复
  isWaitingForResponse.value = true

  // 延迟模拟回复
  setTimeout(() => {
    const assistantMessage: Message = {
      id: `msg-${messageIdCounter++}`,
      role: 'assistant',
      content: `感谢您的问题："${userMessage.content.slice(0, 50)}${userMessage.content.length > 50 ? '...' : ''}"。这是来自 ${selectedModelName.value} 的模拟回复。在实际应用中，这里会显示AI模型的真实回复。`,
      timestamp: new Date(),
    }

    messages.value.push(assistantMessage)

    // 更新对话中的消息
    const convIndex = conversations.value.findIndex((c) => c.id === activeConversationId.value)
    if (convIndex >= 0) {
      conversations.value[convIndex].messages.push(assistantMessage)
    }

    isWaitingForResponse.value = false
    nextTick(() => {
      const messagesArea = document.querySelector('.messages-list')
      if (messagesArea) {
        messagesArea.scrollTop = messagesArea.scrollHeight
      }
    })
  }, 1500)
}

// 生命周期钩子
onMounted(() => {
  loadModels()
})
</script>

<style scoped>
.chat-container {
  height: calc(100vh - 64px);
  padding: 16px;
}

.left-sidebar {
  padding-right: 8px;
  overflow-y: auto;
  max-height: calc(100vh - 96px);
}

.right-content {
  padding-left: 8px;
  display: flex;
  flex-direction: column;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f9f9f9;
  display: flex;
  flex-direction: column;
}

.welcome-section {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.welcome-content {
  text-align: center;
  color: #999;
}

.welcome-content h2 {
  margin: 16px 0;
  font-size: 20px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
  animation: slideIn 0.3s ease-out;
}

.message-user {
  justify-content: flex-end;
}

.message-assistant {
  justify-content: flex-start;
}

.message-avatar {
  flex-shrink: 0;
}

.message-user .message-avatar {
  order: 2;
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.message-user .message-content {
  align-items: flex-end;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  word-wrap: break-word;
  word-break: break-word;
  line-height: 1.5;
}

.message-user .message-bubble {
  background-color: #e3f2fd;
  color: #333;
  border-bottom-right-radius: 4px;
}

.message-assistant .message-bubble {
  background-color: white;
  color: #333;
  border-bottom-left-radius: 4px;
  border: 1px solid #e0e0e0;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.message-user .message-time {
  margin-right: 12px;
}

.message-assistant .message-time {
  margin-left: 12px;
}

/* 打字动画 */
.typing {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing span {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #999;
  animation: bounce 1.4s infinite;
}

.typing span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-8px);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.input-area {
  background-color: white;
}

.conversation-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.conversation-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.conversation-title {
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-date {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

@media (max-width: 960px) {
  .left-sidebar {
    padding-right: 0;
    max-height: none;
  }

  .right-content {
    padding-left: 0;
  }

  .message-content {
    max-width: 90%;
  }
}
</style>
