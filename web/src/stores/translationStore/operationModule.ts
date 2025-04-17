/**
 * 翻译数据管理的操作模块
 * 处理翻译的添加、更新、删除等操作
 */
import { ElMessage } from 'element-plus'
import type { Translation } from './types'

/**
 * 翻译操作模块：处理翻译的添加、更新、删除等操作
 * @param coreModule - 核心模块
 */
export function useTranslationOperationModule(coreModule: ReturnType<typeof import('./coreModule').useCoreModule>) {
  const {
    sourceTexts,
    translations,
    languageData,
    currentLanguage
  } = coreModule
  
  /**
   * 重置译文
   * @param key - 原文的键
   */
  const resetTranslation = (key: string): void => {
    const item = translations.value.find(t => t.key === key)
    if (item) {
      // 重置为原文
      item.value = sourceTexts.value[key] || item.sourceText
    }
  }
  
  /**
   * 自动翻译
   * @param key - 原文的键
   * @returns 翻译结果
   */
  const autoTranslate = async (key: string): Promise<string> => {
    // TODO: 集成实际翻译API（如Google Cloud Translate/DeepL）
    // 示例：const response = await fetch(`/api/translate?text=${encodeURIComponent(sourceText)}&target=${targetLang}`)
    
    // 消息框提示，还未实现
    ElMessage.warning('自动翻译功能暂未实现')

    const item = translations.value.find(t => t.key === key)
    if (!item) return ''

    const sourceText = item.sourceText
    return sourceText
  }
  
  /**
   * 添加新翻译
   * @param item - 翻译项 {key, value}
   * @returns 是否添加成功
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
   * @param item - 翻译项 {key, value}
   * @returns 是否更新成功
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
   * @param item - 翻译项 {key, value}
   * @returns 是否删除成功
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
        item.value = sourceTexts.value[item.key] || item.sourceText
      }
    })
    
    // 更新语言数据
    if (currentLanguage.value) {
      languageData[currentLanguage.value] = [...translations.value]
    }
    
    ElMessage.success('已重置所有翻译')
  }
  
  return {
    // 方法
    resetTranslation,
    resetAllTranslations,
    autoTranslate,
    addTranslation,
    updateTranslation,
    deleteTranslation,
    clearTranslations
  }
}