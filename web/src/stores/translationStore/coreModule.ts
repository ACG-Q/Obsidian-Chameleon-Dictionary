/**
 * 翻译数据管理的核心模块
 * 定义基本状态和计算属性
 */
import { ref, computed, reactive } from 'vue'
import type { Translation, Language } from './types'

/**
 * 核心模块：定义基本状态和计算属性
 */
export function useCoreModule() {
  // 基本状态
  const sourceTexts = ref<Record<string, string>>({}) // 独立存储原文
  const translations = ref<Translation[]>([]) // 当前语言译文
  const languageData = reactive<Record<string, Translation[]>>({}) // 所有语言的翻译数据
  const currentLanguage = ref('zh') // 当前语言
  const loading = ref(false) // 加载状态
  
  // 可用语言列表
  const availableLanguages: Language[] = [
    { code: 'zh', name: '简体中文' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' },
    { code: 'ru', name: 'Русский' },
  ]
  
  // 计算属性
  const hasTranslations = computed(() => translations.value.length > 0)
  const translatedCount = computed(() => translations.value.filter(item => item.value).length)
  const untranslatedCount = computed(() => translations.value.filter(item => !item.value).length)
  const translationProgress = computed(() => {
    if (translations.value.length === 0) return 0
    return Math.round((translatedCount.value / translations.value.length) * 100)
  })
  
  /**
   * 获取原文文本
   * @param key - 原文的键
   * @returns 原文文本
   */
  const getSourceText = (key: string): string => {
    return sourceTexts.value[key] || ''
  }
  
  return {
    // 状态
    sourceTexts,
    translations,
    languageData,
    currentLanguage,
    loading,
    availableLanguages,
    
    // 计算属性
    hasTranslations,
    translatedCount,
    untranslatedCount,
    translationProgress,
    
    // 方法
    getSourceText
  }
}