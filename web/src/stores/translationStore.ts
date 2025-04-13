/**
 * 翻译数据管理的Pinia Store
 * 提供翻译数据的加载、过滤、添加、编辑、删除等功能
 */
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'

export interface Translation {
  key: string
  sourceText: string // 原文
  value: string // 译文
}

export interface Language {
  code: string
  name: string
}

export interface LanguageStats {
  code: string;
  name: string;
  total: number;
  translated: number;
  untranslated: number;
  progress: number;
}

export const useTranslationStore = defineStore('translation', () => {
  // 翻译数据
  const sourceTexts = ref<Record<string, string>>({}) // 独立存储原文
  const translations = ref<Translation[]>([]) // 当前语言译文
  const languageData = reactive<Record<string, Translation[]>>({})
  const currentLanguage = ref('zh')
  const loading = ref(false)
  
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

  // 获取所有语言的翻译统计数据
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
  
  // 获取原文文本
  const getSourceText = (key: string): string => {
    return sourceTexts.value[key] || ''
  }
  
  /**
   * 重置译文
   * @param key - 原文的键
   */
  const resetTranslation = (key: string) => {
    const item = translations.value.find(t => t.key === key);
    if (item) {
      // 重置为原文
      item.value = sourceTexts.value[key] || item.sourceText;
    }
  };

  const autoTranslate = async (key: string): Promise<string> => {
    // TODO: 集成实际翻译API（如Google Cloud Translate/DeepL）
    // 示例：const response = await fetch(`/api/translate?text=${encodeURIComponent(sourceText)}&target=${targetLang}`)
    
    // 消息框提示，还未实现
    ElMessage.warning('自动翻译功能暂未实现')

    const item = translations.value.find(t => t.key === key);
    if (!item) return '';

    const sourceText = item.sourceText;
    return sourceText; 
  }


  /**
   * 加载翻译数据
   * @param langCode - 语言代码
   * @returns
   */
  const loadTranslations = async (langCode: string): Promise<void> => {
    if (!langCode) return
    
    try {
      loading.value = true
      
      // 保存当前语言数据时合并最新原文
      if (currentLanguage.value) {
        // 保存当前语言的译文数据，但确保原文引用是最新的
        const updatedTranslations = translations.value.map(t => ({
          ...t,
          sourceText: sourceTexts.value[t.key] || t.sourceText
        }));
        languageData[currentLanguage.value] = updatedTranslations;
      }
      
      // 切换到新语言
      currentLanguage.value = langCode
      
      // 如果已经有该语言的数据，直接使用，但确保原文是最新的
      if (languageData[langCode]) {
        // 加载已有数据，但确保原文引用是最新的
        translations.value = languageData[langCode].map(t => ({
          ...t,
          sourceText: sourceTexts.value[t.key] || t.sourceText
        }));
        return
      }
      
      // 否则尝试从服务器加载
      try {
        const response = await fetch(`/locals/${langCode}.json`)
        if (response.ok) {
          const data = await response.json()
          
          // 首先，确保所有原文都被保存到sourceTexts中
          // 这样即使切换语言，原文也不会丢失
          Object.entries(data).forEach(([key, value]) => {
            if (!sourceTexts.value[key]) {
              sourceTexts.value[key] = value as string
            }
          })

          // 合并策略优化：
          // 1. 确保所有语言都包含全部原文key
          // 2. 保留已存在的译文，新增原文补全
          const allKeys = new Set([...Object.keys(sourceTexts.value), ...Object.keys(data)]);
          const entries = Array.from(allKeys).map(key => ({
            key,
            sourceText: sourceTexts.value[key] || data[key] || '', // 优先使用独立存储的原文
            value: languageData[langCode]?.find(t => t.key === key)?.value // 优先保留已有译文
              || (typeof data[key] === 'object' ? data[key].value : '') // 如果是对象格式，获取value属性
              || '' // 最后使用空字符串
          }));
          translations.value = entries
          languageData[langCode] = [...entries]
          
          console.log(`已加载 ${entries.length} 条翻译数据，原文库包含 ${Object.keys(sourceTexts.value).length} 条记录`)
        } else {
          // 如果没有找到该语言的文件，创建空数组但保留原文
          const allKeys = Object.keys(sourceTexts.value);
          const entries = allKeys.map(key => ({
            key,
            sourceText: sourceTexts.value[key] || '',
            value: ''
          }));
          translations.value = entries
          languageData[langCode] = [...entries]
          console.log(`未找到语言文件，使用原文库创建了 ${entries.length} 条空翻译记录`)
        }
      } catch (e) {
        console.warn(`加载${langCode}.json失败，将使用原文库创建空翻译:`, e)
        // 即使加载失败，也使用原文库创建空翻译记录
        const allKeys = Object.keys(sourceTexts.value);
        const entries = allKeys.map(key => ({
          key,
          sourceText: sourceTexts.value[key] || '',
          value: ''
        }));
        translations.value = entries
        languageData[langCode] = [...entries]
      }
    } catch (error: any) {
      console.error('加载翻译数据失败:', error)
      ElMessage.error(`加载翻译数据失败: ${error.message}`)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 添加新翻译
   * @param {Translation} item - 翻译项 {key, value}
   * @returns {boolean} - 是否添加成功
   */
  const addTranslation = (item: Translation): boolean => {
    if (!item.key) return false
    
    // 检查是否已存在
    const exists = translations.value.some(t => t.key === item.key)
    if (exists) {
      ElMessage.warning('该原文已存在')
      return false
    }
    
    // 添加到翻译列表
    // 同时保存原文
          sourceTexts.value[item.key] = item.sourceText
          translations.value.push({ ...item })
    
    // 更新语言数据
    if (currentLanguage.value) {
      languageData[currentLanguage.value] = [...translations.value]
    }
    
    return true
  }
  
  /**
   * 更新翻译
   * @param {Translation} item - 翻译项 {key, value}
   * @returns {boolean} - 是否更新成功
   */
  const updateTranslation = (item: Translation): boolean => {
    if (!item.key) return false
    
    // 查找并更新
    const index = translations.value.findIndex(t => t.key === item.key)
    if (index === -1) return false
    
    // 更新时保留原文
          sourceTexts.value[item.key] = item.sourceText
          translations.value[index] = { ...item }
    
    // 更新语言数据
    if (currentLanguage.value) {
      languageData[currentLanguage.value] = [...translations.value]
    }
    
    return true
  }
  
  /**
   * 删除翻译
   * @param {Translation} item - 翻译项 {key, value}
   * @returns {boolean} - 是否删除成功
   */
  const deleteTranslation = (item: Translation): boolean => {
    if (!item.key) return false
    
    // 查找并删除
    const index = translations.value.findIndex(t => t.key === item.key)
    if (index === -1) return false
    
    translations.value.splice(index, 1)
    
    // 更新语言数据
    if (currentLanguage.value) {
      languageData[currentLanguage.value] = [...translations.value]
    }
    
    return true
  }
  
  /**
   * 批量导入翻译
   * @param {Translation[]} items - 翻译项数组
   * @returns {number} - 导入成功的数量
   */
  const importTranslations = (items: Translation[]): number => {
    if (!items || !items.length) return 0
    
    let importedCount = 0
    
    // 遍历导入
    items.forEach(item => {
      if (!item.key) return
      
      // 始终保存原文到sourceTexts，确保原文不会丢失
      if (item.sourceText) {
        sourceTexts.value[item.key] = item.sourceText
      }
      
      // 检查是否已存在
      const index = translations.value.findIndex(t => t.key === item.key)
      
      if (index === -1) {
        // 不存在则添加
        translations.value.push({ 
          ...item,
          // 确保使用sourceTexts中的原文，如果没有则使用item中的原文
          sourceText: sourceTexts.value[item.key] || item.sourceText 
        })
        importedCount++
      } else {
        // 存在则更新
        translations.value[index] = { 
          ...item,
          // 确保使用sourceTexts中的原文，如果没有则使用item中的原文
          sourceText: sourceTexts.value[item.key] || item.sourceText 
        }
        importedCount++
      }
    })
    
    // 更新语言数据
    if (currentLanguage.value) {
      languageData[currentLanguage.value] = [...translations.value]
    }
    
    return importedCount
  }
  
  /**
   * 导出翻译为JSON对象
   * @returns {Record<string, string>} - JSON对象
   */
  const exportToJson = (): Record<string, string> => {
    const result: Record<string, string> = {}
    
    translations.value.forEach(item => {
      if (item.key) {
        result[item.key] = item.value || ''
      }
    })
    
    return result
  }
  
  /**
   * 清空当前语言的翻译
   */
  const clearTranslations = (): void => {
    translations.value = []
    
    // 更新语言数据
    if (currentLanguage.value) {
      languageData[currentLanguage.value] = []
    }
  }
  
  /**
   * 重置所有翻译为原文
   */
  const resetAllTranslations = (): void => {
    translations.value.forEach(item => {
      if (item.key) {
        item.value = sourceTexts.value[item.key] || item.sourceText;
      }
    });
    
    // 更新语言数据
    if (currentLanguage.value) {
      languageData[currentLanguage.value] = [...translations.value];
    }
    
    ElMessage.success('已重置所有翻译');
  };

  return {
    // 状态
    translations,
    currentLanguage,
    loading,
    availableLanguages,
    sourceTexts,
    
    // 计算属性
    hasTranslations,
    translatedCount,
    untranslatedCount,
    translationProgress,
    
    // 方法
    autoTranslate,
    resetTranslation,
    resetAllTranslations,
    loadTranslations,
    addTranslation,
    updateTranslation,
    deleteTranslation,
    importTranslations,
    exportToJson,
    clearTranslations,
    getSourceText,
    getAllLanguagesStats
  }
})