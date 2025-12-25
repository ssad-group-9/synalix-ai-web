<template>
  <div class="chat-container">
    <v-row class="h-100" no-gutters>
      <!-- 左侧：模型和对话历史 -->
      <v-col cols="12" md="3" class="left-sidebar">
        <v-card class="h-100" elevation="2">
          <!-- 模型选择部分 -->
          <v-card-title class="text-subtitle-1">选择推理进程</v-card-title>
          <v-card-text class="pb-0">
            <v-select v-model="selectedTaskId" :items="tasks" item-title="name" item-value="id" label="可用推理"
              variant="outlined" density="comfortable" @update:model-value="onTaskChange" class="mb-4" />
          </v-card-text>

          <!-- 对话历史 -->
          <v-divider class="my-4" />
          <v-card-title class="text-subtitle-1">对话历史</v-card-title>
          <v-card-text class="pb-0">
            <v-list density="compact" v-if="conversations.length > 0">
              <v-list-item v-for="conv in conversations" :key="conv.id" @click="selectConversation(conv.id)"
                :active="activeConversationId === conv.id" class="conversation-item">
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
            <v-empty-state v-else :image-height="150" headline="暂无对话" text="开始新的对话">
              <template v-slot:media>
                <v-icon color="primary" size="60">mdi-chat-outline</v-icon>
              </template>
            </v-empty-state>
          </v-card-text>

          <!-- 新建对话按钮 -->
          <v-card-actions class="mt-4">
            <v-btn @click="startNewConversation" color="primary" variant="elevated" block prepend-icon="mdi-plus">
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

            <v-empty-state v-if="messages.length === 0 && !selectedModelName" :image-height="200" headline="选择模型开始聊天"
              text="请先从左侧选择一个模型">
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
              <div v-for="message in messages" :key="message.id" class="message-item"
                :class="{ 'message-user': message.role === 'user', 'message-assistant': message.role === 'assistant' }">
                <div class="message-avatar">
                  <v-avatar size="32" v-if="message.role === 'assistant'">
                    <v-icon>mdi-robot-outline</v-icon>
                  </v-avatar>
                  <v-avatar size="32" v-else>
                    <v-icon>mdi-account-circle</v-icon>
                  </v-avatar>
                </div>
                <div class="message-content">
                  <div class="message-bubble">
                    <template v-if="Array.isArray(message.content)">
                      <template v-for="(part, i) in message.content" :key="i">
                        <div v-if="part.type === 'text'">{{ part.text }}</div>
                        <v-img v-else-if="part.type === 'image_url'" :src="part.image_url.url" class="mt-2 chat-image"
                          max-height="320" />
                      </template>
                    </template>
                    <div v-else>
                      {{ message.content }}
                    </div>
                  </div>
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
            <div v-if="thumbSrc || selectedImageFile || uploadedImageUrl || localPreviewUrl"
              class="floating-image-bubble">
              <div class="image-bubble">
                <div v-if="thumbSrc" class="image-bubble__thumb">
                  <v-img :src="thumbSrc" width="200" height="200" cover class="rounded" />
                  <v-btn icon size="x-small" variant="flat" class="image-bubble__clear" :disabled="uploading"
                    @click="clearSelectedImage" aria-label="清除图片">
                    <v-icon size="16">mdi-close</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>
          </div>

          <!-- 输入区域 -->
          <v-divider />

          <div class="input-area">

            <!-- 原来的输入框 + 发送按钮 -->
            <v-row no-gutters align="center" class="message-input-container">
              <!-- 图片上传按钮 -->
              <v-col class="d-flex align-center" cols="auto" style="padding-right: 8px">
                <v-tooltip text="上传图片" location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" variant="outlined" color="grey-lighten-1" icon size="small"
                      class="image-upload-btn" :disabled="uploading" @click="triggerFileInput">
                      <v-icon>mdi-image-outline</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>

                <!-- 隐藏的文件输入 -->
                <v-file-input ref="fileInputRef" accept="image/*" hide-details variant="plain" :clearable="false"
                  :disabled="uploading" @update:model-value="onSelectImage" class="hidden-file-input">
                  <!-- 隐藏默认显示的文件名 -->
                  <template #selection></template>
                </v-file-input>
              </v-col>

              <!-- 输入框 -->
              <v-col class="flex-grow-1">
                <v-text-field v-model="newMessage" variant="outlined" density="comfortable" placeholder="输入您的问题..."
                  hide-details single-line clearable @keyup.enter="handleSend" class="message-input"
                  :disabled="isWaitingForResponse">
                </v-text-field>
              </v-col>
              <v-col cols="auto">
                <v-btn color="primary" variant="flat" icon size="small"
                  :disabled="!newMessage || !selectedModelId || isWaitingForResponse" @click="handleSend"
                  class="send-btn">
                  <v-icon size="20">mdi-send</v-icon>
                </v-btn>
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
import { modelApi, taskApi, chatApi, filesApi } from '@/api'
import type { Model, Task, ChatCompletionsResponse, ChatCompletionsRequest, ChatMessage, ChatContentPart } from '@/api/types'
import { AxiosError } from 'axios'
import type { ApiErrorResponse } from '@/api/types'


// 响应式数据
const newMessage = ref('')
const tasks = ref<Task[]>([])
const models = ref<Model[]>([])
const selectedModelId = ref<string>('')
const inputMessage = ref('')
const loading = ref(false)
const isWaitingForResponse = ref(false)
const activeConversationId = ref<string | null>(null)
const selectedTaskId = ref<string | null>(null)
const selectedImageFile = ref<File | null>(null)
const localPreviewUrl = ref<string | null>(null)
const uploadedImageUrl = ref<string | null>(null) // 服务端 download-url (给 image_url 用)

const canSendImage = computed(() => !!uploadedImageUrl.value)
const uploading = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')


// 消息和对话数据
type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string | ChatContentPart[]
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  taskId: string
  modelId: string | null
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

const messages = ref<Message[]>([])
const conversations = ref<Conversation[]>([])
let messageIdCounter = 0
let conversationIdCounter = 0
const fileInputRef = ref<HTMLInputElement | null>(null)

// 计算属性
const selectedModelName = computed(() => {
  if (selectedTaskId.value != null) {
    const model = models.value.find((m) => m.id === tasks.value.find((t) => t.id === selectedTaskId.value)?.modelId)
    return model?.name || ''
  }
  return ''
})

const thumbSrc = computed<string | undefined>(() => {
  return uploadedImageUrl.value ?? localPreviewUrl.value ?? undefined
})

function triggerFileInput() {
  fileInputRef.value?.click()
}

function clearSelectedImage() {
  selectedImageFile.value = null
  uploadedImageUrl.value = null

  const preview = localPreviewUrl.value
  if (preview) {
    globalThis.URL.revokeObjectURL(preview)
    localPreviewUrl.value = null
  }
}

function onSelectImage(files: File | File[] | null) {
  const file = Array.isArray(files) ? (files[0] ?? null) : files

  selectedImageFile.value = file
  uploadedImageUrl.value = null

  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
    localPreviewUrl.value = null
  }

  if (file) {
    localPreviewUrl.value = URL.createObjectURL(file)
  }
}

async function uploadSelectedImage() {
  if (!selectedImageFile.value) return

  uploading.value = true
  try {
    const file = selectedImageFile.value

    const created = await filesApi.createFile({
      originalFilename: file.name,
      contentType: file.type || 'application/octet-stream',
    })

    const uploadUrl = await filesApi.getUploadUrl(created.id)

    const putRes = await fetch(uploadUrl.url, {
      method: uploadUrl.method ?? 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    })
    if (!putRes.ok) {
      throw new Error(`Upload failed: ${putRes.status} ${putRes.statusText}`)
    }

    const downloadUrl = await filesApi.getDownloadUrl(created.id)
    console.log('File uploaded, download URL:', downloadUrl.url)
    uploadedImageUrl.value = downloadUrl.url
  } catch (e) {
    const err = e as AxiosError<ApiErrorResponse>
    snackbarText.value =
      err.response?.data?.message ||
      (e instanceof Error ? e.message : '上传失败')
    snackbar.value = true
  } finally {
    uploading.value = false
  }
}



// 发送消息
const createNewConversation = () => {
  const id = `conv-${Date.now()}`
  const now = new Date()
  const conv: Conversation = {
    id,
    title: '新对话',
    taskId: selectedTaskId.value || '',
    modelId: selectedModelId.value,
    messages: [],
    createdAt: now,
    updatedAt: now,
  }
  conversations.value.unshift(conv)
  activeConversationId.value = id
  messages.value = conv.messages
}

// 根据 activeConversationId 同步 messages 引用
const syncMessagesFromConversation = () => {
  const conv = conversations.value.find(c => c.id === activeConversationId.value)
  if (conv) {
    messages.value = conv.messages
  } else {
    messages.value = []
  }
}

const selectConversation = (conversationId: string) => {
  activeConversationId.value = conversationId
  syncMessagesFromConversation()
}

async function sendWithOptionalImage(userText: string) {
  const parts: ChatContentPart[] = [{ type: 'text', text: userText }]

  console.log('Sending messages:', uploadedImageUrl.value)
  if (uploadedImageUrl.value) {
    parts.push({ type: 'image_url', image_url: { url: uploadedImageUrl.value } })
  }
  clearSelectedImage()

  const messages: ChatMessage[] = [
    { role: 'system', content: [{ type: 'text', text: 'You are a helpful assistant' }] },
    { role: 'user', content: parts },
  ]
  const res = await chatApi.sendCompletions(
    selectedTaskId.value!,
    {
      completions: {
        model: 'glm-4.6v',
        messages,
        max_completion_tokens: 1024,
      },
    })
  return res;
}
// ========== 关键：仿照 sendMessage，把 handleSend 写入 conversations ==========
const handleSend = async () => {
  if (!newMessage.value.trim() || !selectedTaskId.value) return

  // 若当前没有会话，先创建一个
  if (!activeConversationId.value) {
    createNewConversation()
  }
  const conv = conversations.value.find((c) => c.id === activeConversationId.value)
  if (!conv) return

  const content = newMessage.value.trim()
  const now = new Date()

  // 1. 先在当前会话里追加 user 消息（本地展示）

  if (selectedImageFile.value) {
    await uploadSelectedImage()
  }

  const localUserMsg: Message = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: uploadedImageUrl.value
      ? ([
        { type: 'text', text: content },
        { type: 'image_url', image_url: { url: uploadedImageUrl.value } },
      ] satisfies ChatContentPart[])
      : content,
    timestamp: now,
  }

  conv.messages.push(localUserMsg)
  conv.updatedAt = now
  messages.value = conv.messages
  newMessage.value = ''

  // 2. 调用 chat 接口
  isWaitingForResponse.value = true
  loading.value = true
  try {
    // sendWithOptionalImage() 返回 Promise<ChatCompletionsResponse>
    const data = await sendWithOptionalImage(content)
    const assistantContent = data.response.choices[0]?.message.content ?? ''

    if (assistantContent) {
      const assistantMsg: Message = {
        id: data.response.id,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(data.response.created * 1000),
      }

      // 3. 把 assistant 消息也写入当前会话
      conv.messages.push(assistantMsg)
      conv.updatedAt = assistantMsg.timestamp
      messages.value = conv.messages
    }

    // 发送成功后清理图片状态，避免下一条继续携带
    selectedImageFile.value = null
    uploadedImageUrl.value = null
    if (localPreviewUrl.value) {
      URL.revokeObjectURL(localPreviewUrl.value)
      localPreviewUrl.value = null
    }
  } finally {
    isWaitingForResponse.value = false
    loading.value = false
  }
}

// 当切换模型 / 任务时，清空当前会话（你已有 onModelChange、onTaskChange，可在其中同步）
const onModelChange = (modelId: string) => {
  selectedModelId.value = modelId
  messages.value = []
  activeConversationId.value = null
}

const onTaskChange = (taskId: string) => {
  selectedTaskId.value = taskId
  messages.value = []
  activeConversationId.value = null
}

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

const loadTasks = async () => {
  loading.value = true
  try {
    const response = await taskApi.getTasks()
    tasks.value = response.data

    const infer: Task[] = []
    for (const t of tasks.value) {
      if (t.type === 'INFERENCE' && t.status === 'RUNNING') infer.push(t)
    }
    tasks.value = infer
  } catch (error) {
    console.error('加载任务失败:', error)
  } finally {
    loading.value = false
  }
}

const startNewConversation = () => {
  messages.value = []
  activeConversationId.value = null
  inputMessage.value = ''
}

// 生命周期钩子
onMounted(() => {
  loadModels()
  loadTasks()
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
  position: relative;
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

.image-bubble__thumb {
  position: relative;
  display: inline-block;
}

.image-bubble__clear {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  min-width: 24px;
  border-radius: 999px;

  background: rgba(0, 0, 0, 0.55);
  color: white;
}

/* 可选：hover 更明显 */
.image-bubble__clear:hover {
  background: rgba(0, 0, 0, 0.7);
}


.image-bubble-row {
  display: flex;
  justify-content: flex-start;
  /* 与输入框左侧对齐 */
}

.image-bubble {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;

  max-width: min(520px, 100%);
  padding: 10px 10px;
  border-radius: 14px;

  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);

  /* 让气泡看起来“贴着”输入框 */
  margin-bottom: 8px;
}

/* 小尾巴：朝下连接输入框 */
.image-bubble::after {
  content: "";
  position: absolute;
  left: 18px;
  bottom: -7px;
  width: 12px;
  height: 12px;
  transform: rotate(45deg);

  background: rgb(var(--v-theme-surface));
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.message-list {
  padding-bottom: 88px;
}

/* 悬浮在主聊天区域底部（v-divider 上方） */
.floating-image-bubble {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 12px;
  display: flex;
  justify-content: flex-start;
  pointer-events: none;
  /* 不阻挡消息区滚动 */
}

.floating-image-bubble .image-bubble {
  pointer-events: auto;
  /* 允许点击“清除” */
  display: inline-flex;
  align-items: center;
  gap: 10px;

  max-width: min(520px, 100%);
  padding: 10px;
  border-radius: 14px;

  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.floating-image-bubble .image-bubble::after {
  content: "";
  position: absolute;
  left: 18px;
  bottom: -7px;
  width: 12px;
  height: 12px;
  transform: rotate(45deg);
  background: rgb(var(--v-theme-surface));
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.image-picker :deep(.v-field) {
  width: 44px;
  height: 44px;
  /* 变成正方形 */
  border-radius: 8px;
  /* 需要完全直角就改成 0 */
}

.image-picker :deep(.v-field__field) {
  min-height: 44px;
  padding-left: 0;
  padding-right: 0;
}

.image-picker :deep(.v-field__input) {
  display: none;
  /* 继续隐藏文件名 */
}

.image-picker :deep(.v-field__prepend-inner) {
  margin-inline-start: 0;
}

/* 让图标在正方形里水平垂直居中 */
.image-picker :deep(.v-field__prepend-inner),
.image-picker :deep(.v-field__append-inner) {
  align-items: center;
}

.image-picker :deep(.v-field__outline) {
  border-radius: 8px;
  /* 与 v-field 保持一致 */
}

.message-input-container {
  background: white;
  border-radius: 24px;
  padding: 8px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0e0e0;
}

.image-upload-btn {
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  background: white;
  transition: all 0.2s ease;
}

.image-upload-btn:hover:not(:disabled) {
  border-color: var(--v-primary-base);
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.image-upload-btn:disabled {
  opacity: 0.5;
}

.hidden-file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.message-input {
  --v-field-border-radius: 20px;
  --v-input-control-height: 36px;
}

.message-input :deep(.v-field) {
  border-radius: 16px;
  background: #f8f9fa;
  border: none;
  box-shadow: none;
}

.message-input :deep(.v-field__input) {
  min-height: 36px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.send-btn {
  margin-left: 8px;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.send-btn:not(:disabled) {
  background: linear-gradient(135deg, var(--v-primary-base), #6c8eff);
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.3);
}

.send-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.4);
}

.send-btn:disabled {
  background: #e0e0e0;
  color: #9e9e9e;
}

/* 悬停效果 */
.message-input-container:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border-color: #d0d0d0;
}

/* 聚焦效果 */
.message-input :deep(.v-field--focused) {
  background: white;
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.1);
}

/* 响应式调整 */
@media (max-width: 600px) {
  .message-input-container {
    padding: 6px 12px;
    border-radius: 20px;
  }

  .image-upload-btn,
  .send-btn {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }
}

/* 图片本身决定气泡大小：块级、按比例缩放、不被裁剪 */
.chat-image {
  display: block;
  min-width: 300px;
  border-radius: 12px;
}

.chat-image :deep(img) {
  object-fit: contain;
  width: 100%;
  height: auto;
}
</style>