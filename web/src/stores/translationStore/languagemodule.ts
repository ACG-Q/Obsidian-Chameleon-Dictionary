/**
 * 翻译数据管理的语言模块
 * 处理语言切换和加载
 */
import { ElMessage } from 'element-plus'
import type { LanguageStats } from './types'

/**
 * 语言管理模块：处理语言切换和加载
 * @param coreModule - 核心模块
 */
export function useLanguageModule(coreModule: ReturnType<typeof import('./coreModule').useCoreModule>) {
  const {
    sourceTexts,
    translations,
    languageData,
    currentLanguage,
    loading,
    availableLanguages,
    translatedCount,
    untranslatedCount,
    translationProgress
  } = coreModule
  
  /**
   * 获取所有语言的翻译统计数据
   * @returns 所有语言的统计数据
   */
  const getAllLanguagesStats = async (): Promise<LanguageStats[]> => {
    // 保存当前语言
    const currentLang = currentLanguage.value
    const stats = []
    
    // 遍历所有语言
    for (const lang of availableLanguages) {
      // 加载该语言的翻译数据
      await loadTranslations(lang.code)
      
      // 添加统计信息
      stats.push({
        code: lang.code,
        name: lang.name,
        total: translations.value.length,
        translated: translatedCount.value,
        untranslated: untranslatedCount.value,
        progress: translationProgress.value
      })
    }
    
    // 恢复原来的语言
    await loadTranslations(currentLang)
    
    return stats
  }
  
  /**
   * 加载翻译数据
   * @param langCode - 语言代码
   */
  const loadTranslations = async (langCode: string): Promise<void> => {
    if (!langCode) return
    
    try {
      loading.value = true
      
      // 保存当前语言数据（如果需要）
      // 注意：导入时 languageData 应该已经被正确更新，这里可能不需要重复保存
      // if (currentLanguage.value && languageData[currentLanguage.value]) {
      //   // 确保保存前原文是最新的
      //   const updatedTranslations = translations.value.map(t => ({
      //     ...t,
      //     sourceText: sourceTexts.value[t.key] || t.sourceText
      //   }))
      //   // 只有当 translations.value 与 languageData 不一致时才更新，避免不必要的写操作
      //   if (JSON.stringify(updatedTranslations) !== JSON.stringify(languageData[currentLanguage.value])) {
      //      languageData[currentLanguage.value] = updatedTranslations
      //   }
      // }
      
      // 切换到新语言
      currentLanguage.value = langCode
      
      // 如果 languageData 中已存在目标语言的数据
      if (languageData[langCode] && languageData[langCode].length > 0) {
        // 直接加载，并确保原文与 sourceTexts 同步
        translations.value = languageData[langCode].map(t => ({
          ...t,
          sourceText: sourceTexts.value[t.key] || t.sourceText // 优先使用 sourceTexts 的原文
        }))
        // 检查是否有 sourceTexts 中的 key 在 languageData[langCode] 中缺失
        const existingKeys = new Set(languageData[langCode].map(t => t.key));
        Object.keys(sourceTexts.value).forEach(key => {
          if (!existingKeys.has(key)) {
            // 如果缺失，补充空翻译条目
            translations.value.push({
              key,
              sourceText: sourceTexts.value[key],
              value: ''
            });
            // 同时更新 languageData
            languageData[langCode].push({
                key,
                sourceText: sourceTexts.value[key],
                value: ''
            });
          }
        });
        return; // 加载完成，直接返回
      }
      
      // 如果 languageData 中不存在该语言的数据，则基于 sourceTexts 创建空翻译
      const allKeys = Object.keys(sourceTexts.value)
      const entries = allKeys.map(key => ({
        key,
        sourceText: sourceTexts.value[key] || '', // 确保使用 sourceTexts 的原文
        value: '' // 值为空
      }))
      translations.value = entries
      languageData[langCode] = [...entries] // 保存到 languageData
      console.log(`语言 ${langCode} 不存在于 languageData，已基于 sourceTexts 创建了 ${entries.length} 条空翻译记录`)
    } catch (error: any) {
      console.error('加载翻译数据失败:', error)
      ElMessage.error(`加载翻译数据失败: ${error.message}`)
    } finally {
      loading.value = false
    }
  }
  
  return {
    // 方法
    loadTranslations,
    getAllLanguagesStats
  }
}