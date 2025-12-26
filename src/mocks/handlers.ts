import { http, HttpResponse } from 'msw'

// 获取基础URL，用于生成完整的API路由
const getBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
}

// 模拟用户数据
const mockUsers = [
  {
    id: 'user-1',
    username: 'admin',
    nickname: '管理员',
    email: 'admin@example.com',
    role: 'ADMIN',
    enabled: true,
    createdAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'user-2',
    username: 'user1',
    nickname: '张三',
    email: 'zhangsan@example.com',
    role: 'USER',
    enabled: true,
    createdAt: '2024-01-05T10:00:00Z',
  },
  {
    id: 'user-3',
    username: 'user2',
    nickname: '李四',
    email: 'lisi@example.com',
    role: 'USER',
    enabled: true,
    createdAt: '2024-01-10T10:00:00Z',
  },
]

// 当前登录的用户（用于模拟不同角色登录）
let currentUser = mockUsers[0] // 默认为管理员

// 模拟通知数据 - 按用户分组
const mockNotificationsByUser: Record<string, any[]> = {
  'user-1': [ // 管理员的通知
    {
      id: 'notif-admin-1',
      userId: 'user-1',
      title: '新用户注册通知',
      content: '用户"李四"已成功注册，请及时审核用户权限。',
      type: 'INFO',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15分钟前
    },
    {
      id: 'notif-admin-2',
      userId: 'user-1',
      title: 'GPU资源告警',
      content: 'GPU-6已离线，请检查硬件状态。',
      type: 'ERROR',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45分钟前
    },
    {
      id: 'notif-admin-3',
      userId: 'user-1',
      title: '系统维护通知',
      content: '系统将于今晚22:00-24:00进行维护升级，期间可能影响部分功能使用。',
      type: 'WARNING',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2小时前
    },
    {
      id: 'notif-admin-4',
      userId: 'user-1',
      title: '新功能上线',
      content: '平台新增聊天交互功能，现在可以直接与训练好的模型进行对话测试。',
      type: 'INFO',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1天前
    },
  ],
  'user-2': [ // 张三的通知
    {
      id: 'notif-user1-1',
      userId: 'user-2',
      title: '任务完成通知',
      content: '您的训练任务"Llama微调任务"已成功完成，模型已保存到模型库。',
      type: 'SUCCESS',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30分钟前
    },
    {
      id: 'notif-user1-2',
      userId: 'user-2',
      title: 'GPU权限更新',
      content: '您的GPU使用权限已更新，现在可以使用GPU-0, GPU-2, GPU-4。',
      type: 'INFO',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1小时前
    },
    {
      id: 'notif-user1-3',
      userId: 'user-2',
      title: '数据集上传成功',
      content: '您上传的数据集"中文NLP数据集"已成功处理，现在可以用于训练任务。',
      type: 'SUCCESS',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5小时前
    },
  ],
  'user-3': [ // 李四的通知
    {
      id: 'notif-user2-1',
      userId: 'user-3',
      title: '任务失败通知',
      content: '训练任务"ResNet-50微调"执行失败，错误原因：GPU内存不足。请检查配置后重试。',
      type: 'ERROR',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20分钟前
    },
    {
      id: 'notif-user2-2',
      userId: 'user-3',
      title: 'GPU权限更新',
      content: '您的GPU使用权限已更新，现在可以使用GPU-1, GPU-3。',
      type: 'INFO',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3小时前
    },
    {
      id: 'notif-user2-3',
      userId: 'user-3',
      title: '欢迎使用平台',
      content: '欢迎使用Synalix AI训练平台，如有问题请联系管理员。',
      type: 'SUCCESS',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2天前
    },
  ],
}

// 模拟GPU资源数据
const mockGpuResources = [
  { id: 0, name: 'GPU-0', status: 'AVAILABLE', memoryTotal: 24576, memoryUsed: 2048, memoryFree: 22528 },
  { id: 1, name: 'GPU-1', status: 'BUSY', memoryTotal: 24576, memoryUsed: 20480, memoryFree: 4096 },
  { id: 2, name: 'GPU-2', status: 'AVAILABLE', memoryTotal: 24576, memoryUsed: 4096, memoryFree: 20480 },
  { id: 3, name: 'GPU-3', status: 'BUSY', memoryTotal: 24576, memoryUsed: 18432, memoryFree: 6144 },
  { id: 4, name: 'GPU-4', status: 'AVAILABLE', memoryTotal: 24576, memoryUsed: 0, memoryFree: 24576 },
  { id: 5, name: 'GPU-5', status: 'AVAILABLE', memoryTotal: 24576, memoryUsed: 0, memoryFree: 24576 },
  { id: 6, name: 'GPU-6', status: 'OFFLINE', memoryTotal: 24576, memoryUsed: 0, memoryFree: 0 },
  { id: 7, name: 'GPU-7', status: 'AVAILABLE', memoryTotal: 24576, memoryUsed: 1024, memoryFree: 23552 },
]

// 模拟用户GPU权限数据
let mockUserGpuPermissions = [
  {
    userId: 'user-1',
    username: 'admin',
    nickname: '管理员',
    allowedGpuIds: [0, 1, 2, 3, 4, 5, 6, 7], // 管理员可以使用所有GPU
  },
  {
    userId: 'user-2',
    username: 'user1',
    nickname: '张三',
    allowedGpuIds: [0, 2, 4], // 普通用户只能使用部分GPU
  },
  {
    userId: 'user-3',
    username: 'user2',
    nickname: '李四',
    allowedGpuIds: [1, 3], // 普通用户只能使用部分GPU
  },
]

// 模拟模型数据
const mockModels = [
  {
    id: 'model-1',
    name: 'Llama 2 7B',
    type: 'LLM',
    version: '1.0.0',
    description: '一个7B参数的开源LLM模型',
    createdAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'model-2',
    name: 'Llama 2 13B',
    type: 'LLM',
    version: '1.0.0',
    description: '一个13B参数的开源LLM模型',
    createdAt: '2024-01-02T10:00:00Z',
  },
  {
    id: 'model-3',
    name: 'Qwen 7B',
    type: 'LLM',
    version: '2.0.0',
    description: '阿里云通义千问7B模型',
    createdAt: '2024-01-03T10:00:00Z',
  },
  {
    id: 'model-4',
    name: 'ResNet-50',
    type: 'CV',
    version: '1.0.0',
    description: '深度学习图像分类模型',
    createdAt: '2024-01-04T10:00:00Z',
  },
  {
    id: 'model-5',
    name: 'YOLO v8',
    type: 'CV',
    version: '8.0.0',
    description: '实时物体检测模型',
    createdAt: '2024-01-05T10:00:00Z',
  },
]

// 模拟数据集数据
const mockDatasets = [
  {
    id: 'dataset-1',
    name: 'WikiText-103',
    description: '维基百科文本数据集，用于语言模型训练',
    fileSize: 181884520,
    fileType: 'jsonl',
    createdAt: '2024-01-06T10:00:00Z',
  },
  {
    id: 'dataset-2',
    name: 'CIFAR-10',
    description: '图像分类数据集，包含10个类别',
    fileSize: 163212288,
    fileType: 'json',
    createdAt: '2024-01-07T10:00:00Z',
  },
  {
    id: 'dataset-3',
    name: 'ImageNet Subset',
    description: 'ImageNet的子集，用于图像识别',
    fileSize: 524288000,
    fileType: 'json',
    createdAt: '2024-01-08T10:00:00Z',
  },
  {
    id: 'dataset-4',
    name: '中文NLP数据集',
    description: '用于中文自然语言处理任务的数据集',
    fileSize: 268435456,
    fileType: 'jsonl',
    createdAt: '2024-01-09T10:00:00Z',
  },
]

// 模拟任务数据
let mockTasks = [
  {
    id: 'task-1',
    name: 'Llama微调任务',
    type: 'TRAINING',
    modelId: 'model-1',
    datasetId: 'dataset-1',
    status: 'COMPLETED',
    progress: 100,
    createdAt: '2024-01-10T10:00:00Z',
    startedAt: '2024-01-10T10:05:00Z',
    completedAt: '2024-01-10T15:30:00Z',
  },
  {
    id: 'task-2',
    name: 'CIFAR-10训练任务',
    type: 'TRAINING',
    modelId: 'model-4',
    datasetId: 'dataset-2',
    status: 'RUNNING',
    progress: 65,
    createdAt: '2024-01-11T08:00:00Z',
    startedAt: '2024-01-11T08:15:00Z',
    completedAt: null,
  },
  {
    id: 'task-3',
    name: 'Qwen推理测试',
    type: 'INFERENCE',
    modelId: 'model-3',
    datasetId: null,
    status: 'PENDING',
    progress: 0,
    createdAt: '2024-01-12T14:00:00Z',
    startedAt: null,
    completedAt: null,
  },
  {
    id: 'task-4',
    name: 'ResNet-50微调',
    type: 'TRAINING',
    modelId: 'model-4',
    datasetId: 'dataset-3',
    status: 'FAILED',
    progress: 45,
    createdAt: '2024-01-13T09:00:00Z',
    startedAt: '2024-01-13T09:20:00Z',
    completedAt: '2024-01-13T11:00:00Z',
  },
  {
    id: 'task-5',
    name: 'YOLO检测任务',
    type: 'TRAINING',
    modelId: 'model-5',
    datasetId: 'dataset-2',
    status: 'RUNNING',
    progress: 30,
    createdAt: '2024-01-13T14:00:00Z',
    startedAt: '2024-01-13T14:30:00Z',
    completedAt: null,
  },
]

// 模拟GPU资源数据
const mockResources = {
  gpuCount: 8,
  totalMemory: 65536,
  availableMemory: 24576,
  gpus: [
    { id: 'gpu-0', name: 'GPU-0', memory: 8192, available: 4096 },
    { id: 'gpu-1', name: 'GPU-1', memory: 8192, available: 0 },
    { id: 'gpu-2', name: 'GPU-2', memory: 8192, available: 2048 },
    { id: 'gpu-3', name: 'GPU-3', memory: 8192, available: 3072 },
    { id: 'gpu-4', name: 'GPU-4', memory: 8192, available: 4096 },
    { id: 'gpu-5', name: 'GPU-5', memory: 8192, available: 4096 },
    { id: 'gpu-6', name: 'GPU-6', memory: 8192, available: 3168 },
    { id: 'gpu-7', name: 'GPU-7', memory: 8192, available: 4000 },
  ],
}

export const handlers = [
  // ==================== 认证相关 ====================
  http.post(`${getBaseUrl()}/api/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string }

    // 根据用户名查找用户
    const user = mockUsers.find(u => u.username === body.username)

    if (!user) {
      return HttpResponse.json(
        { error: { code: 404, message: '用户不存在' } },
        { status: 404 }
      )
    }

    // 设置当前登录用户（用于其他API返回对应用户的数据）
    currentUser = user

    return HttpResponse.json({
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        role: user.role,
        enabled: user.enabled,
      },
    })
  }),

  http.post(`${getBaseUrl()}/api/auth/refresh`, async ({ request }) => {
    return HttpResponse.json({
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
    })
  }),

  http.post(`${getBaseUrl()}/api/auth/logout`, () => {
    return HttpResponse.json(
      null,
    )
  }),

  // ==================== 用户相关 ====================
  http.get(`${getBaseUrl()}/api/users/me`, () => {
    return HttpResponse.json(currentUser)
  }),

  http.get(`${getBaseUrl()}/api/users/current`, () => {
    return HttpResponse.json(currentUser)
  }),

  http.get(`${getBaseUrl()}/api/users`, () => {
    return HttpResponse.json(
      mockUsers,
    )
  }),

  http.post(`${getBaseUrl()}/api/users`, async ({ request }) => {
    const newUser = (await request.json()) as any
    const user = {
      id: `user-${Date.now()}`,
      ...newUser,
      createdAt: new Date().toISOString(),
    }
    mockUsers.push(user)
    return HttpResponse.json(user, { status: 201 })
  }),

  http.get(`${getBaseUrl()}/api/users/:id`, ({ params }) => {
    const user = mockUsers.find((u) => u.id === params.id)
    if (!user) {
      return HttpResponse.json(
        { error: { code: 404, message: '用户不存在' } },
        { status: 404 }
      )
    }
    return HttpResponse.json(user)
  }),

  http.patch(`${getBaseUrl()}/api/users/:id`, async ({ params, request }) => {
    const userIndex = mockUsers.findIndex((u) => u.id === params.id)
    if (userIndex === -1) {
      return HttpResponse.json(
        { error: { code: 404, message: '用户不存在' } },
        { status: 404 }
      )
    }
    const updateData = (await request.json()) as any
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...updateData }
    return HttpResponse.json(mockUsers[userIndex])
  }),

  http.delete(`${getBaseUrl()}/api/users/:id`, ({ params }) => {
    const userIndex = mockUsers.findIndex((u) => u.id === params.id)
    if (userIndex === -1) {
      return HttpResponse.json(
        { error: { code: 404, message: '用户不存在' } },
        { status: 404 }
      )
    }
    const deletedUser = mockUsers.splice(userIndex, 1)[0]
    return HttpResponse.json(deletedUser)
  }),

  http.post(`${getBaseUrl()}/api/users/:id/change-password`, async ({ params, request }) => {
    const user = mockUsers.find((u) => u.id === params.id)
    if (!user) {
      return HttpResponse.json(
        { error: { code: 404, message: '用户不存在' } },
        { status: 404 }
      )
    }
    return HttpResponse.json({ message: '密码修改成功' })
  }),

  http.post(`${getBaseUrl()}/api/users/:id/reset-password`, async ({ params }) => {
    const user = mockUsers.find((u) => u.id === params.id)
    if (!user) {
      return HttpResponse.json(
        { error: { code: 404, message: '用户不存在' } },
        { status: 404 }
      )
    }
    const newPassword = 'TempPass' + Math.random().toString(36).substring(2, 10)
    return HttpResponse.json({ newPassword })
  }),

  // ==================== 模型相关 ====================
  http.get(`${getBaseUrl()}/api/models`, () => {
    return HttpResponse.json(mockModels)
  }),

  http.post(`${getBaseUrl()}/api/models`, async ({ request }) => {
    const newModel = (await request.json()) as any
    const model = {
      id: `model-${Date.now()}`,
      ...newModel,
      createdAt: new Date().toISOString(),
    }
    mockModels.push(model)
    return HttpResponse.json(model, { status: 201 })
  }),

  http.get(`${getBaseUrl()}/api/models/:id`, ({ params }) => {
    const model = mockModels.find((m) => m.id === params.id)
    if (!model) {
      return HttpResponse.json(
        { error: { code: 404, message: '模型不存在' } },
        { status: 404 }
      )
    }
    return HttpResponse.json(model)
  }),

  http.patch(`${getBaseUrl()}/api/models/:id`, async ({ params, request }) => {
    const modelIndex = mockModels.findIndex((m) => m.id === params.id)
    if (modelIndex === -1) {
      return HttpResponse.json(
        { error: { code: 404, message: '模型不存在' } },
        { status: 404 }
      )
    }
    const updateData = (await request.json()) as any
    mockModels[modelIndex] = { ...mockModels[modelIndex], ...updateData }
    return HttpResponse.json(mockModels[modelIndex])
  }),

  http.delete(`${getBaseUrl()}/api/models/:id`, ({ params }) => {
    const modelIndex = mockModels.findIndex((m) => m.id === params.id)
    if (modelIndex === -1) {
      return HttpResponse.json(
        { error: { code: 404, message: '模型不存在' } },
        { status: 404 }
      )
    }
    const deletedModel = mockModels.splice(modelIndex, 1)[0]
    return HttpResponse.json(deletedModel)
  }),

  // ==================== 数据集相关 ====================
  http.get(`${getBaseUrl()}/api/datasets`, () => {
    return HttpResponse.json(
      mockDatasets,
    )
  }),

  http.post(`${getBaseUrl()}/api/datasets`, async ({ request }) => {
    const newDataset = (await request.json()) as any
    const dataset = {
      id: `dataset-${Date.now()}`,
      ...newDataset,
      createdAt: new Date().toISOString(),
    }
    mockDatasets.push(dataset)
    return HttpResponse.json(dataset, { status: 201 })
  }),

  http.get(`${getBaseUrl()}/api/datasets/:id`, ({ params }) => {
    const dataset = mockDatasets.find((d) => d.id === params.id)
    if (!dataset) {
      return HttpResponse.json(
        { error: { code: 404, message: '数据集不存在' } },
        { status: 404 }
      )
    }
    return HttpResponse.json(dataset)
  }),

  http.patch(`${getBaseUrl()}/api/datasets/:id`, async ({ params, request }) => {
    const datasetIndex = mockDatasets.findIndex((d) => d.id === params.id)
    if (datasetIndex === -1) {
      return HttpResponse.json(
        { error: { code: 404, message: '数据集不存在' } },
        { status: 404 }
      )
    }
    const updateData = (await request.json()) as any
    mockDatasets[datasetIndex] = { ...mockDatasets[datasetIndex], ...updateData }
    return HttpResponse.json(mockDatasets[datasetIndex])
  }),

  http.delete(`${getBaseUrl()}/api/datasets/:id`, ({ params }) => {
    const datasetIndex = mockDatasets.findIndex((d) => d.id === params.id)
    if (datasetIndex === -1) {
      return HttpResponse.json(
        { error: { code: 404, message: '数据集不存在' } },
        { status: 404 }
      )
    }
    const deletedDataset = mockDatasets.splice(datasetIndex, 1)[0]
    return HttpResponse.json(deletedDataset)
  }),

  http.get(`${getBaseUrl()}/api/datasets/:id/download-url`, ({ params }) => {
    const dataset = mockDatasets.find((d) => d.id === params.id)
    if (!dataset) {
      return HttpResponse.json(
        { error: { code: 404, message: '数据集不存在' } },
        { status: 404 }
      )
    }
    return HttpResponse.json({
      url: `https://example.com/datasets/${params.id}/download`,
    })
  }),

  http.get(`${getBaseUrl()}/datasets/:id/upload-url`, ({ params }) => {
    return HttpResponse.json({
      url: `https://example.com/datasets/${params.id}/upload`,
    })
  }),

  http.get(`${getBaseUrl()}/api/datasets/:id/preview`, ({ params }) => {
    const dataset = mockDatasets.find((d) => d.id === params.id)
    if (!dataset) {
      return HttpResponse.json(
        { error: { code: 404, message: '数据集不存在' } },
        { status: 404 }
      )
    }
    return HttpResponse.json({
      content: JSON.stringify(
        [
          { text: '示例数据1', label: '标签1' },
          { text: '示例数据2', label: '标签2' },
          { text: '示例数据3', label: '标签3' },
        ],
        null,
        2
      ),
    })
  }),

  // ==================== 任务相关 ====================
  http.get(`${getBaseUrl()}/api/tasks`, () => {
    return HttpResponse.json(
      mockTasks,
    )
  }),

  http.post(`${getBaseUrl()}/api/tasks`, async ({ request }) => {
    const newTask = (await request.json()) as any
    const task = {
      id: `task-${Date.now()}`,
      ...newTask,
      status: 'PENDING',
      progress: 0,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
    }
    mockTasks.push(task)
    return HttpResponse.json(task, { status: 201 })
  }),

  http.get(`${getBaseUrl()}/api/tasks/:id`, ({ params }) => {
    const task = mockTasks.find((t) => t.id === params.id)
    if (!task) {
      return HttpResponse.json(
        { error: { code: 404, message: '任务不存在' } },
        { status: 404 }
      )
    }
    return HttpResponse.json(task)
  }),

  http.patch(`${getBaseUrl()}/api/tasks/:id`, async ({ params, request }) => {
    const taskIndex = mockTasks.findIndex((t) => t.id === params.id)
    if (taskIndex === -1) {
      return HttpResponse.json(
        { error: { code: 404, message: '任务不存在' } },
        { status: 404 }
      )
    }
    const updateData = (await request.json()) as any
    mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...updateData }
    return HttpResponse.json(mockTasks[taskIndex])
  }),

  http.delete(`${getBaseUrl()}/api/tasks/:id`, ({ params }) => {
    const taskIndex = mockTasks.findIndex((t) => t.id === params.id)
    if (taskIndex === -1) {
      return HttpResponse.json(
        { error: { code: 404, message: '任务不存在' } },
        { status: 404 }
      )
    }
    const deletedTask = mockTasks.splice(taskIndex, 1)[0]
    return HttpResponse.json(deletedTask)
  }),

  http.post(`${getBaseUrl()}/api/tasks/:id/stop`, ({ params }) => {
    const task = mockTasks.find((t) => t.id === params.id)
    if (!task) {
      return HttpResponse.json(
        { error: { code: 404, message: '任务不存在' } },
        { status: 404 }
      )
    }
    task.status = 'STOPPED'
    return HttpResponse.json(task)
  }),

  http.get(`${getBaseUrl()}/api/tasks/:id/logs`, ({ params }) => {
    return HttpResponse.json({
      logs: [
        '[2024-01-10 10:05:00] 任务已启动',
        '[2024-01-10 10:06:00] 加载模型: Llama 2 7B',
        '[2024-01-10 10:07:00] 加载数据集: WikiText-103',
        '[2024-01-10 10:08:00] 开始训练...',
        '[2024-01-10 10:15:00] Epoch 1/10 - Loss: 4.2345',
        '[2024-01-10 10:25:00] Epoch 2/10 - Loss: 3.9876',
        '[2024-01-10 10:35:00] Epoch 3/10 - Loss: 3.7654',
        '[2024-01-10 10:45:00] Epoch 4/10 - Loss: 3.5432',
        '[2024-01-10 10:55:00] Epoch 5/10 - Loss: 3.3210',
        '[2024-01-10 11:05:00] 保存检查点: checkpoint-500',
        '[2024-01-10 15:30:00] 训练完成！',
        '[2024-01-10 15:31:00] 模型已保存到: models/llama-2-7b-finetuned',
      ],
    })
  }),

  http.get(`${getBaseUrl()}/api/tasks/:id/metrics`, ({ params }) => {
    return HttpResponse.json({
      metrics: {
        trainingLoss: 3.2345,
        validationLoss: 3.5678,
        accuracy: 0.8765,
        f1Score: 0.8543,
        precision: 0.8890,
        recall: 0.8320,
        throughput: 125.43,
        gpuMemory: 6.5,
      },
    })
  }),

  // ==================== 资源相关 ====================
  http.get(`${getBaseUrl()}/api/resources`, () => {
    return HttpResponse.json(
      mockResources,
    )
  }),

  // ==================== 通知相关 ====================
  http.get(`${getBaseUrl()}/api/notifications`, () => {
    // 获取当前用户的通知
    const userNotifications = mockNotificationsByUser[currentUser.id] || []
    const unreadCount = userNotifications.filter(n => !n.read).length
    return HttpResponse.json({
      notifications: userNotifications,
      unreadCount: unreadCount,
    })
  }),

  http.patch(`${getBaseUrl()}/api/notifications/:id/read`, ({ params }) => {
    // 在当前用户的通知中查找
    const userNotifications = mockNotificationsByUser[currentUser.id] || []
    const notification = userNotifications.find(n => n.id === params.id)
    if (notification) {
      notification.read = true
      return HttpResponse.json(null, { status: 200 })
    }
    return HttpResponse.json(
      { error: { code: 404, message: '通知不存在' } },
      { status: 404 }
    )
  }),

  http.patch(`${getBaseUrl()}/api/notifications/read-all`, () => {
    // 标记当前用户的所有通知为已读
    const userNotifications = mockNotificationsByUser[currentUser.id] || []
    userNotifications.forEach(n => n.read = true)
    return HttpResponse.json(null, { status: 200 })
  }),

  http.delete(`${getBaseUrl()}/api/notifications/:id`, ({ params }) => {
    // 删除当前用户的特定通知
    const userNotifications = mockNotificationsByUser[currentUser.id] || []
    const index = userNotifications.findIndex(n => n.id === params.id)
    if (index !== -1) {
      userNotifications.splice(index, 1)
      return HttpResponse.json(null, { status: 200 })
    }
    return HttpResponse.json(
      { error: { code: 404, message: '通知不存在' } },
      { status: 404 }
    )
  }),

  http.delete(`${getBaseUrl()}/api/notifications/read`, () => {
    // 删除当前用户的所有已读通知
    const userNotifications = mockNotificationsByUser[currentUser.id] || []
    const unreadNotifications = userNotifications.filter(n => !n.read)
    mockNotificationsByUser[currentUser.id] = unreadNotifications
    return HttpResponse.json(null, { status: 200 })
  }),

  // ==================== GPU管理相关 ====================
  http.get(`${getBaseUrl()}/api/gpu/resources`, () => {
    return HttpResponse.json(mockGpuResources)
  }),

  http.get(`${getBaseUrl()}/api/gpu/permissions`, () => {
    return HttpResponse.json(mockUserGpuPermissions)
  }),

  http.get(`${getBaseUrl()}/api/gpu/permissions/:userId`, ({ params }) => {
    const permission = mockUserGpuPermissions.find(p => p.userId === params.userId)
    if (permission) {
      return HttpResponse.json(permission)
    }
    return HttpResponse.json(
      { error: { code: 404, message: '用户权限不存在' } },
      { status: 404 }
    )
  }),

  http.put(`${getBaseUrl()}/api/gpu/permissions/:userId`, async ({ params, request }) => {
    const body = (await request.json()) as { gpuIds: number[] }
    const index = mockUserGpuPermissions.findIndex(p => p.userId === params.userId)

    if (index !== -1) {
      mockUserGpuPermissions[index].allowedGpuIds = body.gpuIds
      return HttpResponse.json(mockUserGpuPermissions[index])
    }

    return HttpResponse.json(
      { error: { code: 404, message: '用户权限不存在' } },
      { status: 404 }
    )
  }),
]
