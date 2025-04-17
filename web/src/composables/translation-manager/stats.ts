/**
 * 翻译统计模块
 * 处理翻译统计和进度显示
 */
import { computed } from 'vue'
import type { Translation } from '../../stores/translationStore'
import type { useTranslationStore } from '../../stores'

/**
 * 翻译统计模块
 * @param translationStore - 翻译数据存储
 */
export function useStatsModule(translationStore: ReturnType<typeof useTranslationStore>) {
  /**
   * 格式化进度显示
   * @param percentage - 百分比
   * @returns 格式化后的进度
   */
  const progressFormat = (percentage: number): string => {
    return `${percentage}% (${translationStore.translatedCount}/${translationStore.translations.length})`
  }
  
  /**
   * 查找缺少翻译的条目
   * @param limit - 限制返回的条目数量，默认为10
   * @returns 缺少翻译的条目列表
   */
  const findMissingTranslations = (limit: number = 10): Translation[] => {
    // 获取所有未翻译的条目
    const missing = translationStore.translations.filter(item => !item.value)
    
    // 按照key排序，确保结果稳定
    const sorted = [...missing].sort((a, b) => a.key.localeCompare(b.key))
    
    // 返回指定数量的条目
    return sorted.slice(0, limit)
  }
  
  /**
   * 获取翻译统计信息
   * @returns 包含翻译统计信息的对象
   */
  const getTranslationStats = () => {
    return {
      total: translationStore.translations.length,
      translated: translationStore.translatedCount,
      untranslated: translationStore.untranslatedCount,
      progress: translationStore.translationProgress
    }
  }
  
  return {
    progressFormat,
    findMissingTranslations,
    getTranslationStats,
    hasTranslations: computed(() => translationStore.hasTranslations),
    translatedCount: computed(() => translationStore.translatedCount),
    untranslatedCount: computed(() => translationStore.untranslatedCount),
    translationProgress: computed(() => translationStore.translationProgress)
  }
}