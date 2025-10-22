import { useState, useEffect, useRef } from 'react'

const useAudioPreloader = (audioUrls = [], maxConcurrent = 3) => {
  const [loadedAudios, setLoadedAudios] = useState(new Map())
  const [loadingAudios, setLoadingAudios] = useState(new Set())
  const [loadingProgress, setLoadingProgress] = useState(0)
  const audioCache = useRef(new Map())
  const loadQueue = useRef([])
  const activeLoads = useRef(0)

  // 预加载音频文件
  const preloadAudio = (url) => {
    return new Promise((resolve, reject) => {
      if (audioCache.current.has(url)) {
        resolve(audioCache.current.get(url))
        return
      }

      const audio = new Audio()
      audio.preload = 'metadata'
      
      const handleCanPlayThrough = () => {
        audioCache.current.set(url, audio)
        setLoadedAudios(prev => new Map(prev).set(url, audio))
        setLoadingAudios(prev => {
          const newSet = new Set(prev)
          newSet.delete(url)
          return newSet
        })
        cleanup()
        resolve(audio)
      }

      const handleError = () => {
        setLoadingAudios(prev => {
          const newSet = new Set(prev)
          newSet.delete(url)
          return newSet
        })
        cleanup()
        reject(new Error(`Failed to load audio: ${url}`))
      }

      const cleanup = () => {
        audio.removeEventListener('canplaythrough', handleCanPlayThrough)
        audio.removeEventListener('error', handleError)
        activeLoads.current--
        processQueue()
      }

      audio.addEventListener('canplaythrough', handleCanPlayThrough)
      audio.addEventListener('error', handleError)
      audio.src = url
    })
  }

  // 处理加载队列
  const processQueue = () => {
    while (loadQueue.current.length > 0 && activeLoads.current < maxConcurrent) {
      const url = loadQueue.current.shift()
      if (!audioCache.current.has(url) && !loadingAudios.has(url)) {
        activeLoads.current++
        setLoadingAudios(prev => new Set(prev).add(url))
        preloadAudio(url).catch(console.error)
      }
    }
  }

  // 批量预加载音频
  const preloadAudios = (urls) => {
    const validUrls = urls.filter(url => url && typeof url === 'string')
    loadQueue.current = [...loadQueue.current, ...validUrls]
    processQueue()
  }

  // 获取预加载的音频
  const getPreloadedAudio = (url) => {
    return audioCache.current.get(url)
  }

  // 清理缓存
  const clearCache = () => {
    audioCache.current.forEach(audio => {
      audio.src = ''
    })
    audioCache.current.clear()
    setLoadedAudios(new Map())
    setLoadingAudios(new Set())
    loadQueue.current = []
    activeLoads.current = 0
  }

  // 计算加载进度
  useEffect(() => {
    const totalUrls = audioUrls.length
    const loadedCount = loadedAudios.size
    const progress = totalUrls > 0 ? (loadedCount / totalUrls) * 100 : 0
    setLoadingProgress(progress)
  }, [audioUrls.length, loadedAudios.size])

  // 自动预加载提供的URL列表
  useEffect(() => {
    if (audioUrls.length > 0) {
      preloadAudios(audioUrls)
    }
  }, [audioUrls])

  // 清理资源
  useEffect(() => {
    return () => {
      clearCache()
    }
  }, [])

  return {
    preloadAudios,
    getPreloadedAudio,
    clearCache,
    loadedAudios,
    loadingAudios,
    loadingProgress,
    isLoading: loadingAudios.size > 0
  }
}

export default useAudioPreloader