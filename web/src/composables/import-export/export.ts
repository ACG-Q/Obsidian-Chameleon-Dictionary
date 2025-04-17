/**
 * 导出功能模块
 * 提供各种导出方法，如JSON导出、ZIP导出、字典导出等
 */
import { ElMessage } from 'element-plus'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useTranslationStore } from '../../stores'

/**
 * 导出为JSON文件
 * @param filename 文件名
 * @param format 导出格式，默认为单语言格式
 */
export const exportToJsonFile = (filename: string = 'translations.json', format: 'singleLanguage' | 'multiLanguage' = 'singleLanguage'): void => {
  try {
    const translationStore = useTranslationStore()
    
    // 获取导出数据，支持多语言格式
    const exportData = translationStore.exportToJson(format)
    
    // 创建Blob对象
    const jsonStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' })
    
    // 保存文件
    saveAs(blob, filename)
    
    ElMessage.success(`导出成功 (${format === 'multiLanguage' ? '多语言格式' : '单语言格式'})`)
  } catch (error: any) {
    console.error('导出失败:', error)
    ElMessage.error(`导出失败: ${error.message}`)
  }
}

/**
 * 导出为ZIP文件
 * @param filename 文件名
 * @param includeReadme 是否包含README文件
 * @param format 导出格式，默认为单语言格式
 */
export const exportToZipFile = async (filename: string = 'translations.zip', includeReadme: boolean = false, format: 'singleLanguage' | 'multiLanguage' = 'singleLanguage'): Promise<void> => {
  try {
    const translationStore = useTranslationStore()
    const zip = new JSZip()
    const allLanguages = translationStore.availableLanguages
    const originalLanguage = translationStore.currentLanguage // 保存原始语言
    let totalEntries = 0
    const languageDetailsForReadme: string[] = []

    // 循环处理每种语言
    for (const lang of allLanguages) {
      await translationStore.loadTranslations(lang.code)
      const langData = translationStore.exportToJson('singleLanguage')
      
      // 过滤掉没有翻译的条目
      const filteredExportData = Object.entries(langData)
        .filter(([_, value]) => value !== null && value !== '')
        .reduce((obj, [key, value]) => {
          obj[key] = value
          return obj
        }, {} as Record<string, string>)

      const entryCount = Object.keys(filteredExportData).length

      // 添加 JSON 文件到 ZIP
      const jsonStr = JSON.stringify(filteredExportData, null, 2)
      zip.file(`${lang.code}.json`, jsonStr)

      // 记录 README 的语言详情
      if (includeReadme) {
        languageDetailsForReadme.push(`- ${lang.name} (${lang.code}): ${entryCount} 条目`)
      }

      // 累加总条目数（以第一个语言为准）
      if (totalEntries === 0) {
        totalEntries = entryCount
      }
    }

    // 恢复到原始语言状态
    await translationStore.loadTranslations(originalLanguage)

    // 添加 README 文件
    if (includeReadme) {
      const readmeContent = `# Obsidian Chameleon Dictionary 翻译文件包

这是由 [Obsidian Chameleon Dictionary](https://github.com/ACG-Q/Obsidian-Chameleon-Dictionary) 导出的翻译文件包。

## 文件内容

此 ZIP 文件包含以下语言的翻译数据：

${languageDetailsForReadme.join('\n')}

总计 ${allLanguages.length} 种语言，总条目数（基于首个语言统计）约为 ${totalEntries}。

## 使用方法

1.  解压此 ZIP 文件。
2.  找到您需要的语言文件（例如 \`en.json\`）。
3.  将该文件放入 Obsidian 插件（如 Obsidian Periodic Notes）的语言目录（通常是插件目录下的 \`locals\` 或 \`lang\` 文件夹）。
4.  重启 Obsidian 或重新加载插件以应用新的翻译。

## 导出信息

- **导出时间**: ${new Date().toLocaleString()}
- **导出格式**: ${format === 'multiLanguage' ? '多语言 (Multi-language)' : '单语言 (Single-language)'}

## 注意

- 某些语言文件可能包含未翻译的条目。
- 此导出功能主要用于备份、分享或更新插件的本地化文件。

> 目前主要用途：自用，用于更新仓库里面的数据`
      zip.file('README.md', readmeContent)
    }

    // 生成ZIP文件
    const content = await zip.generateAsync({ type: 'blob' })

    // 保存文件
    saveAs(content, filename)

    ElMessage.success('导出成功')
  } catch (error: any) {
    console.error('导出失败:', error)
    ElMessage.error(`导出失败: ${error.message}`)
  }
}

/**
 * 导出为字典格式的JSON文件（多语言格式）
 * @param filename 文件名
 * @param format 导出格式，默认为多语言格式
 */
export const exportToDictionaryFile = async (filename: string, format: 'singleLanguage' | 'multiLanguage' = 'multiLanguage'): Promise<void> => {
  try {
    const translationStore = useTranslationStore()
    
    if (format === 'singleLanguage') {
      // 单语言格式导出
      const exportData = translationStore.exportToJson('singleLanguage')
      const jsonContent = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      saveAs(blob, filename)
      
      ElMessage.success('字典导出成功 (单语言格式)')
      return
    }
    
    // 多语言格式: 创建字典数据结构 {[语言代码]: {[key]: value}}
    const dictionaryData: Record<string, Record<string, string>> = {}
    
    // 获取所有语言的翻译
    const allLanguages = translationStore.availableLanguages
    
    // 添加每种语言的翻译
    for (const lang of allLanguages) {
      // 加载语言数据
      await translationStore.loadTranslations(lang.code)
      
      // 创建语言数据对象
      dictionaryData[lang.code] = {}
      
      // 添加翻译
      translationStore.translations.forEach(item => {
        if (item.key && item.value) { // 增加 item.value 的判断
          dictionaryData[lang.code][item.key] = item.value
        }
      })
    }
    
    // 转换为JSON并下载
    const jsonContent = JSON.stringify(dictionaryData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    saveAs(blob, filename)
    
    ElMessage.success('字典导出成功 (多语言格式)')
  } catch (error: any) {
    console.error('字典导出失败:', error)
    ElMessage.error(`导出失败: ${error.message}`)
  }
}

/**
 * 导出字典
 * @param translations 翻译数据
 * @param format 导出格式
 * @param dictFormat 字典格式，默认为单语言格式
 * @returns 是否导出成功
 */
export const exportDictionary = async (translations: Record<string, string>, format: 'json' | 'plainText' | 'zip', dictFormat: 'singleLanguage' | 'multiLanguage' = 'singleLanguage'): Promise<boolean> => {
  try {
    let content = ''
    
    // 检测未翻译的条目
    const untranslatedEntries = Object.entries(translations).filter(([_, value]) => !value)
    const untranslatedCount = untranslatedEntries.length
    const translationProgress = Math.round(((Object.keys(translations).length - untranslatedCount) / Object.keys(translations).length) * 100)
    
    if (format === 'json') {
      // 添加未翻译条目信息作为注释
      let jsonContent = ''
      
      if (dictFormat === 'multiLanguage') {
        // 多语言格式: 将translations包装在当前语言代码下
        const translationStore = useTranslationStore()
        const multiLangData = {
          [translationStore.currentLanguage]: translations
        }
        jsonContent = JSON.stringify(multiLangData, null, 2)
      } else {
        // 单语言格式
        jsonContent = JSON.stringify(translations, null, 2)
      }
      
      if (untranslatedCount > 0) {
        const missingInfo = `// 注意: 有 ${untranslatedCount} 个未翻译条目 (${translationProgress}% 已完成)\n`
        // 添加缺少翻译的示例条目
        const missingExamples = untranslatedEntries.slice(0, 3)
        let examplesInfo = '// 缺少翻译的条目示例:\n'
        missingExamples.forEach(([key], index) => {
          examplesInfo += `// 示例${index + 1}: ${key}\n`
        })
        content = `${missingInfo}${examplesInfo}${jsonContent}`
      } else {
        content = jsonContent
      }
    } else if (format === 'plainText') {
      // 添加未翻译条目信息
      if (untranslatedCount > 0) {
        content = `# 注意: 有 ${untranslatedCount} 个未翻译条目 (${translationProgress}% 已完成)\n\n`
        // 添加缺少翻译的示例条目
        content += '# 缺少翻译的条目示例:\n'
        const missingExamples = untranslatedEntries.slice(0, 3)
        missingExamples.forEach(([key], index) => {
          content += `# 示例${index + 1}: ${key}\n`
        })
        content += '\n'
      }
      content += Object.entries(translations).map(([key, value]) => `${key}: ${value || '[未翻译]'}`).join('\n')
    } else if (format === 'zip') {
      // 使用ZIP格式导出，传递dictFormat参数
      return exportToZipFile('translations.zip', true, dictFormat).then(() => true)
    }
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    saveAs(blob, `translations.${format === 'plainText' ? 'txt' : format}`)
    ElMessage.success(`导出成功 (${dictFormat === 'multiLanguage' ? '多语言格式' : '单语言格式'})`)
    return true
  } catch (error:unknown) {
    const _error = error as Error
    console.error('导出失败:', _error)
    ElMessage.error(`导出失败: ${_error.message}`)
    return false
  }
}