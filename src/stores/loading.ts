import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
  const isLoading = ref(false)
  const progress = ref(0)
  let animationId: number | null = null
  let startTime = 0

  const startLoading = () => {
    isLoading.value = true
    progress.value = 0
    startTime = Date.now()
    
    // 停止之前的动画
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    
    // 开始进度动画
    const animate = () => {
      const elapsed = Date.now() - startTime
      
      // 使用指数衰减函数，进度逐渐变慢并趋近于90%
      // progress = 90 * (1 - e^(-elapsed/2000))
      const newProgress = 90 * (1 - Math.exp(-elapsed / 2000))
      progress.value = Math.min(newProgress, 90)
      
      if (progress.value < 89.9 && isLoading.value) {
        animationId = requestAnimationFrame(animate)
      }
    }
    
    animate()
  }

  const stopLoading = () => {
    // 停止当前的加载动画
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
    
    // 记录完成动画的开始时间和起始进度
    const finishStartTime = Date.now()
    const startProgress = progress.value
    
    // 开始完成动画，将进度从当前值增加到100%
    const finishAnimate = () => {
      const elapsed = Date.now() - finishStartTime
      const duration = 200 // 完成动画持续时间
      
      if (elapsed < duration) {
        // 线性插值从当前进度到100%
        const t = elapsed / duration
        progress.value = startProgress + (100 - startProgress) * t
        animationId = requestAnimationFrame(finishAnimate)
      } else {
        // 动画完成
        progress.value = 100
        
        // 保持100%状态一小段时间后隐藏
        setTimeout(() => {
          isLoading.value = false
          progress.value = 0
        }, 300) // 保持300ms
      }
    }
    
    finishAnimate()
  }

  return {
    isLoading,
    progress,
    startLoading,
    stopLoading,
  }
})