/**
 * 翻译数据管理的导入导出模块
 * 处理翻译数据的导入和导出
 */
import type { Translation } from './types'

/**
 * 导入导出模块：处理翻译数据的导入和导出
 * @param coreModule - 核心模块
 */
export function useImportExportModule(coreModule: ReturnType<typeof import('./coreModule').useCoreModule>) {
  const {
    sourceTexts,
    translations,
    languageData,
    currentLanguage
  } = coreModule
  
  /**
   * 批量导入翻译
   * @param items - 翻译项数组
   * @returns 导入成功的数量
   */
  const importTranslations = (items: Translation[], importLangCode: string): number => {
    if (!items || !items.length) return 0

    let importedCount = 0

    // 1. 更新 sourceTexts (确保所有原文都被记录)
    items.forEach(item => {
      if (item.key && item.sourceText) {
        // 如果原文不存在或与导入的不同，则更新
        if (!sourceTexts.value[item.key] || sourceTexts.value[item.key] !== item.sourceText) {
           sourceTexts.value[item.key] = item.sourceText
        }
      }
    })

    // 2. 创建导入语言的翻译映射 (key -> value)
    const importedLangValues: Record<string, string> = {}
    items.forEach(item => {
      if (item.key) {
        importedLangValues[item.key] = item.value || ''
        importedCount++ // 计数实际处理的条目
      }
    })

    // 3. 更新 languageData
    // 确保所有可用语言在 languageData 中都有条目
    coreModule.availableLanguages.forEach(lang => {
      if (!languageData[lang.code]) {
        languageData[lang.code] = []
      }

      const existingLangDataMap = new Map(languageData[lang.code].map(t => [t.key, t]));
      const updatedLangData: Translation[] = []; // Build the updated list here

      // Iterate over all known keys (from sourceTexts)
      Object.keys(sourceTexts.value).forEach(key => {
        const sourceText = sourceTexts.value[key];
        let value = '';
        const existingEntry = existingLangDataMap.get(key);

        if (lang.code === importLangCode) {
          // For the imported language, use the imported value if available,
          // otherwise keep existing (if any), otherwise empty.
          value = importedLangValues[key] ?? existingEntry?.value ?? '';
        } else {
          // For other languages, keep the existing value if the key exists,
          // otherwise it's a new key, so set value to empty.
          value = existingEntry?.value ?? '';
        }

        updatedLangData.push({
          key,
          sourceText,
          value
        });
      });
      languageData[lang.code] = updatedLangData; // Assign the updated array
    })

    // 4. 更新当前显示的 translations
    // 确保 translations 反映当前 currentLanguage 的最新数据
    if (languageData[currentLanguage.value]) {
        translations.value = [...languageData[currentLanguage.value]]
    } else {
        // 如果当前语言数据意外丢失，尝试基于 sourceTexts 重建空翻译
        translations.value = Object.keys(sourceTexts.value).map(key => ({
            key,
            sourceText: sourceTexts.value[key],
            value: ''
        }))
        languageData[currentLanguage.value] = [...translations.value] // 并存回 languageData
    }

    return importedCount
  }
  
  /**
   * 导出翻译为JSON对象
   * @param format 导出格式，默认为单语言格式
   * @returns JSON对象
   */
  const exportToJson = (format: 'singleLanguage' | 'multiLanguage' = 'singleLanguage'): Record<string, any> => {
    if (format === 'multiLanguage') {
      // 多语言格式: {[语言代码]: {[key]: value}}
      const result: Record<string, Record<string, any>> = {}
      
      // 添加当前语言的翻译
      result[currentLanguage.value] = {}
      
      translations.value.forEach(item => {
        if (item.key) {
          // 保存完整的翻译对象，包含原文和译文
          result[currentLanguage.value][item.key] = {
            value: item.value || '',
            sourceText: item.sourceText || item.key
          }
        }
      })
      
      return result
    } else {
      // 单语言格式: {[key]: value}
      const result: Record<string, string> = {}
      
      translations.value.forEach(item => {
        if (item.key) {
          result[item.key] = item.value || ''
        }
      })
      
      return result
    }
  }
  
  return {
    // 方法
    importTranslations,
    exportToJson
  }
}