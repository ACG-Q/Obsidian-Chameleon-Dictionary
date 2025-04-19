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
 * @returns 包含所有语言翻译条目的记录和格式类型
 */
export const parseJsonData = (jsonData: any): { data: Record<string, Translation[]>, format: DictionaryFormat } => {
  const translationStore = useTranslationStore()
  const availableLangCodes = new Set(translationStore.availableLanguages.map(lang => lang.code))

  // 检测是否为多语言格式
  const isMultiLangFormat = Object.keys(jsonData).some(key => availableLangCodes.has(key))

  let data: Record<string, Translation[]> = {}
  let format: DictionaryFormat = 'singleLanguage'

  if (isMultiLangFormat) {
    // 处理多语言合集格式
    format = 'multiLanguage'
    ElMessage.info('检测到多语言字典格式')

    for (const langCode in jsonData) {
      if (availableLangCodes.has(langCode) && typeof jsonData[langCode] === 'object') {
        const langDict = jsonData[langCode]
        data[langCode] = Object.entries(langDict).map(([key, value]) => ({
          key,
          value: typeof value === 'string' ? value : (value && typeof value === 'object' && 'value' in value) ? String(value.value) : '',
          sourceText: (value && typeof value === 'object' && 'sourceText' in value) ? String(value.sourceText) : key
        }))
      } else if (!availableLangCodes.has(langCode)) {
        console.warn(`导入数据中包含未知语言代码: ${langCode}，已忽略。`)
      }
    }

    // 检查是否有任何语言被成功解析
    if (Object.keys(data).length === 0) {
       ElMessage.warning('多语言文件中未找到有效的、已配置的语言数据。')
       // 尝试将整个 JSON 作为单语言处理（作为后备）
       format = 'singleLanguage'
       const singleLangItems = Object.entries(jsonData).map(([key, value]) => {
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
             sourceText: key
           }
         }
       })
       // 假设导入到当前语言
       data[translationStore.currentLanguage] = singleLangItems
       ElMessage.info('尝试将文件作为单语言字典导入到当前语言。')
    }

  } else {
    // 处理单语言字典格式
    format = 'singleLanguage'
    const items = Object.entries(jsonData).map(([key, value]) => {
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
    // 将单语言数据放入以当前语言为键的结构中，以便后续统一处理
    data[translationStore.currentLanguage] = items
  }

  return { data, format }
}

/**
 * 完成导入过程
 * @param parsedData 解析后的数据，包含所有语言的翻译条目
 * @param updateProgress 更新进度的回调函数
 * @returns 导入结果
 */
export const finishImport = (parsedData: Record<string, Translation[]>, updateProgress: (progress: number) => void): ImportResult => {
  const translationStore = useTranslationStore()
  let totalImportedCount = 0
  let totalNewCount = 0
  let totalUpdatedCount = 0
  const errors: Array<{ key: string; message: string }> = [] // 用于收集可能的错误

  if (Object.keys(parsedData).length === 0) {
    ElMessage.warning('没有找到可导入的条目')
    return { importedCount: 0, newCount: 0, updatedCount: 0, errors }
  }

  updateProgress(90)

  // 遍历解析出的每种语言数据进行导入
  for (const langCode in parsedData) {
    if (parsedData.hasOwnProperty(langCode)) {
      const items = parsedData[langCode]
      if (items.length === 0) continue // 跳过空语言数据

      // 检查哪些是新增的，哪些是更新的 (针对当前处理的语言)
      const existingLangData = translationStore.languageData[langCode] || []
      const existingKeys = new Set(existingLangData.map(t => t.key))
      const newItems = items.filter(item => !existingKeys.has(item.key))
      const updatedItems = items.filter(item => existingKeys.has(item.key))

      // 调用 store 的导入方法，传入指定语言代码
      const importedCount = translationStore.importTranslations(items, langCode)

      totalImportedCount += importedCount
      totalNewCount += newItems.length
      totalUpdatedCount += updatedItems.length

      console.log(`语言 '${langCode}' 导入: ${importedCount} 条 (新增: ${newItems.length}, 更新: ${updatedItems.length})`)
    }
  }

  updateProgress(100)

  if (totalImportedCount > 0) {
    ElMessage.success(`导入完成。总计：${totalImportedCount}个条目（新增：${totalNewCount}，更新：${totalUpdatedCount}）`)
  } else {
    ElMessage.warning('导入完成，但未导入任何有效条目。')
  }

  // 确保在导入后刷新当前显示的翻译列表
  translationStore.refreshTranslations()

  return {
    importedCount: totalImportedCount,
    newCount: totalNewCount,
    updatedCount: totalUpdatedCount,
    errors // 返回收集到的错误
  }
}