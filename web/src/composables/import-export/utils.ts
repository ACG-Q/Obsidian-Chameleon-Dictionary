/**
 * 导入导出功能的通用工具函数
 */
import { ElMessage } from 'element-plus'
import type { Translation } from '../../stores/translationStore'
import type { ImportResult, DictionaryFormat } from './types'
import { useTranslationStore } from '../../stores'

/**
 * 处理导入错误
 * @param error 错误对象
 * @param customMessage 自定义错误消息
 * @returns 导入结果对象
 */
export const handleImportError = (error: any, customMessage?: string): ImportResult => {
  const errorMessage = customMessage || error.message || '未知错误'
  console.error('导入失败:', error)
  ElMessage.error(`导入失败: ${errorMessage}`)
  return { 
    importedCount: 0, 
    newCount: 0, 
    updatedCount: 0,
    errors: [{ key: 'error', message: errorMessage }] 
  }
}

/**
 * 解析JSON数据为翻译条目
 * @param jsonData JSON数据
 * @returns 翻译条目数组和格式类型
 */
export const parseJsonData = (jsonData: any): { items: Translation[], format: DictionaryFormat } => {
  const translationStore = useTranslationStore()
  
  // 检测是否为多语言格式
  const isMultiLangFormat = Object.keys(jsonData).some(key => 
    translationStore.availableLanguages.some(lang => lang.code === key)
  )
  
  let items: Translation[] = []
  let format: DictionaryFormat = 'singleLanguage'
  
  if (isMultiLangFormat) {
    // 处理多语言合集格式
    format = 'multiLanguage'
    ElMessage.info('检测到多语言字典格式')
    
    // 获取当前语言的数据
    const currentLang = translationStore.currentLanguage
    const langDict = jsonData[currentLang]
    
    if (langDict && typeof langDict === 'object') {
      // 处理嵌套结构的多语言字典
      items = Object.entries(langDict).map(([key, value]) => ({
        key,
        value: typeof value === 'string' ? value : (value && typeof value === 'object' && 'value' in value) ? String(value.value) : '',
        sourceText: (value && typeof value === 'object' && 'sourceText' in value) ? String(value.sourceText) : key
      }))
    } else {
      // 尝试从其他语言中获取数据作为源文本
      const availableLangs = Object.keys(jsonData).filter(lang => 
        translationStore.availableLanguages.some(l => l.code === lang) && 
        typeof jsonData[lang] === 'object'
      )
      
      if (availableLangs.length > 0) {
        // 使用第一个可用语言作为源文本
        const sourceLang = availableLangs[0]
        const sourceDict = jsonData[sourceLang]
        
        items = Object.entries(sourceDict).map(([key, value]) => ({
          key,
          value: '', // 当前语言没有翻译，设为空
          sourceText: typeof value === 'string' ? value : (value && typeof value === 'object' && 'sourceText' in value) ? String(value.sourceText) : key
        }))
        
        ElMessage.warning(`未找到当前语言(${currentLang})的数据，使用${sourceLang}作为源文本`)
      } else {
        ElMessage.warning(`未找到当前语言(${currentLang})的数据`)
      }
    }
  } else {
    // 处理单语言字典格式
    format = 'singleLanguage'
    items = Object.entries(jsonData).map(([key, value]) => {
      // 处理可能的复杂对象格式
      if (value && typeof value === 'object') {
        return {
          key,
          value: 'value' in value ? String(value.value) : '',
          sourceText: 'sourceText' in value ? String(value.sourceText) : key
        }
      } else {
        return {
          key,
          value: typeof value === 'string' ? value : '',
          sourceText: key // 添加sourceText属性，默认使用key作为源文本
        }
      }
    })
  }
  
  return { items, format }
}

/**
 * 完成导入过程
 * @param items 要导入的翻译条目
 * @param updateProgress 更新进度的回调函数
 * @returns 导入结果
 */
export const finishImport = (items: Translation[], updateProgress: (progress: number) => void): ImportResult => {
  const translationStore = useTranslationStore()
  
  if (items.length === 0) {
    ElMessage.warning('没有找到可导入的条目')
    return { importedCount: 0, newCount: 0, updatedCount: 0 }
  }
  
  updateProgress(90)
  
  // 在导入前检查哪些是新增的，哪些是更新的
  const existingKeys = new Set(translationStore.translations.map(t => t.key))
  const newItems = items.filter(item => !existingKeys.has(item.key))
  const updatedItems = items.filter(item => existingKeys.has(item.key))

  // 导入到翻译管理器，传入当前语言代码
  const importedCount = translationStore.importTranslations(items, translationStore.currentLanguage)

  updateProgress(100)
  ElMessage.success(`成功导入：${importedCount}个条目（新增：${newItems.length}，更新：${updatedItems.length}）`)
  
  return { 
    importedCount, 
    newCount: newItems.length,
    updatedCount: updatedItems.length,
    errors: [] // 添加空错误数组，表示没有错误
  }
}