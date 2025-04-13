/**
 * 导入导出功能的组合式函数
 * 提供字典导入、导出等功能
 */
import { ref } from 'vue'
import { ElMessage, type UploadFile } from 'element-plus'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useTranslationStore } from '../stores'
import type { Translation } from '../stores/translationStore'

/**
 * 导入结果接口
 */
export interface ImportResult {
  /** 成功导入的总条目数 */
  importedCount: number
  /** 新增的条目数量 */
  newCount: number
  /** 更新的条目数量 */
  updatedCount: number
  /** 导入过程中遇到的错误列表 */
  errors?: Array<{ key: string; message: string }>
}

/**
 * 导入导出功能的组合式函数
 */
export function useImportExport() {
  // 获取翻译store
  const translationStore = useTranslationStore()
  
  // 导入导出状态
  const isImporting = ref<boolean>(false)
  const isExporting = ref<boolean>(false)
  const importProgress = ref<number>(0)
  
  /**
   * 导入文本内容
   * @param text 要导入的文本内容
   * @param format 导入格式 (json, plainText)
   * @returns 导入结果
   */
  const importTextContent = async (
    text: string,
    format: 'json' | 'plainText'
  ): Promise<ImportResult> => {
    if (!text.trim()) {
      ElMessage.warning('请输入要导入的内容')
      return { importedCount: 0, newCount: 0, updatedCount: 0 }
    }
    
    try {
      isImporting.value = true
      importProgress.value = 10
      
      let importedItems: Translation[] = []
      
      // 解析导入内容
      if (format === 'json') {
        try {
          const jsonData = JSON.parse(text)
          importProgress.value = 50
          
          importedItems = Object.entries(jsonData).map(([key, value]) => ({
            key,
            value: typeof value === 'string' ? value : '',
            sourceText: key // 添加sourceText属性，默认使用key作为源文本
          }))
        } catch (e) {
          ElMessage.error('JSON格式不正确')
          return { importedCount: 0, newCount: 0, updatedCount: 0 }
        }
      } else {
        // 纯文本格式，每行一个条目
        importedItems = text.split('\n')
          .filter(line => line.trim())
          .map(line => ({
            key: line.trim(),
            value: '',
            sourceText: line.trim(),
          }))
      }
      
      importProgress.value = 80
      
      // 导入到翻译管理器
      const importedCount = translationStore.importTranslations(importedItems)
      
      importProgress.value = 100
      ElMessage.success(`成功导入：${importedCount}个条目`)
      
      return { 
        importedCount, 
        newCount: Math.floor(importedCount / 2), // 简化处理，实际应该由store返回
        updatedCount: Math.ceil(importedCount / 2) 
      }
    } catch (error: any) {
      console.error('导入失败:', error)
      ElMessage.error(`导入失败: ${error.message}`)
      return { importedCount: 0, newCount: 0, updatedCount: 0 }
    } finally {
      setTimeout(() => {
        importProgress.value = 0
        isImporting.value = false
      }, 1500)
    }
  }
  
  /**
   * 从URL导入字典
   * @param url 导入的URL地址
   * @returns 导入结果
   */
  const importFromUrl = async (url: string): Promise<ImportResult> => {
    if (!url) {
      ElMessage.warning('请输入URL地址')
      return { importedCount: 0, newCount: 0, updatedCount: 0 }
    }
    
    try {
      isImporting.value = true
      importProgress.value = 10
      
      // 发起网络请求获取资源
      const response = await fetch(url)
      importProgress.value = 50
      
      if (!response.ok) {
        throw new Error(`网络请求失败: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json() as Record<string, unknown>
      importProgress.value = 80
      
      // 检测文件格式类型
      const isMultiLangFormat = Object.keys(data).some(key => 
        translationStore.availableLanguages.some(lang => lang.code === key)
      )
      
      let importedItems: Translation[] = []
      
      if (isMultiLangFormat) {
        // 处理多语言合集格式
        ElMessage.info('检测到多语言字典格式')
        
        // 获取当前语言的数据
        const langDict = data[translationStore.currentLanguage]
        if (langDict && typeof langDict === 'object') {
          importedItems = Object.entries(langDict).map(([key, value]) => ({
            key,
            value: typeof value === 'string' ? value : '',
            sourceText: key // 添加sourceText属性，默认使用key作为源文本
          }))
        }
      } else {
        // 处理单语言字典格式
        importedItems = Object.entries(data).map(([key, value]) => ({
          key,
          value: typeof value === 'string' ? value : '',
          sourceText: key // 添加sourceText属性，默认使用key作为源文本
        }))
      }
      
      // 导入到翻译管理器
      const importedCount = translationStore.importTranslations(importedItems)
      
      importProgress.value = 100
      ElMessage.success(`成功导入：${importedCount}个条目`)
      
      return { 
        importedCount, 
        newCount: Math.floor(importedCount / 2), 
        updatedCount: Math.ceil(importedCount / 2) 
      }
    } catch (error: any) {
      console.error('导入失败:', error)
      ElMessage.error(`导入失败: ${error.message}`)
      return { importedCount: 0, newCount: 0, updatedCount: 0 }
    } finally {
      setTimeout(() => {
        importProgress.value = 0
        isImporting.value = false
      }, 1500)
    }
  }
  
  /**
   * 处理文件上传
   * @param file 上传的文件
   * @returns 导入结果
   */
  const handleFileUpload = async (file: File): Promise<ImportResult> => {
    console.log('useImportExport收到文件:', file)
    if (!file) {
      console.error('文件对象为空')
      ElMessage.error('文件对象为空')
      return { importedCount: 0, newCount: 0, updatedCount: 0 }
    }
    
    try {
      console.log(`开始处理文件: ${file.name}, 大小: ${file.size} 字节, 类型: ${file.type}`)
      isImporting.value = true
      importProgress.value = 10
      
      // 检查文件大小
      if (file.size > 10 * 1024 * 1024) { // 10MB限制
        console.warn('文件过大，可能需要较长处理时间')
        ElMessage.warning('文件较大，处理可能需要一些时间')
      }
      
      const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
      console.log(`文件扩展名: ${fileExt}`)
      let importedItems: Translation[] = []
      
      if (fileExt === 'json') {
        // 处理JSON文件
        console.log('开始读取JSON文件内容')
        importProgress.value = 20
        
        let text: string
        try {
          text = await file.text()
          console.log(`成功读取文件内容，长度: ${text.length} 字符`)
          importProgress.value = 40
        } catch (readError: any) {
          console.error('读取文件内容失败:', readError)
          ElMessage.error(`读取文件内容失败: ${readError.message || '未知错误'}`)
          return { importedCount: 0, newCount: 0, updatedCount: 0 }
        }
        
        try {
          console.log('开始解析JSON数据')
          const jsonData = JSON.parse(text)
          console.log('JSON解析成功，开始处理数据')
          importProgress.value = 60
          
          // 检测是否为多语言格式
          const isMultiLangFormat = Object.keys(jsonData).some(key => 
            translationStore.availableLanguages.some(lang => lang.code === key)
          )
          
          console.log(`检测到${isMultiLangFormat ? '多语言' : '单语言'}字典格式`)
          
          if (isMultiLangFormat) {
            // 处理多语言合集格式
            ElMessage.info('检测到多语言字典格式')
            
            // 获取当前语言的数据
            const currentLang = translationStore.currentLanguage
            console.log(`当前语言: ${currentLang}`)
            const langDict = jsonData[currentLang]
            
            if (langDict && typeof langDict === 'object') {
              console.log(`找到当前语言(${currentLang})的数据，条目数: ${Object.keys(langDict).length}`)
              importedItems = Object.entries(langDict).map(([key, value]) => ({
                key,
                value: typeof value === 'string' ? value : '',
                sourceText: key // 添加sourceText属性，默认使用key作为源文本
              }))
            } else {
              console.warn(`未找到当前语言(${currentLang})的数据`)
              ElMessage.warning(`未找到当前语言(${currentLang})的数据`)
            }
          } else {
            // 处理单语言字典格式
            console.log(`处理单语言字典格式，条目数: ${Object.keys(jsonData).length}`)
            importedItems = Object.entries(jsonData).map(([key, value]) => ({
              key,
              value: typeof value === 'string' ? value : '',
              sourceText: key // 添加sourceText属性，默认使用key作为源文本
            }))
          }
          
          importProgress.value = 80
        } catch (parseError: any) {
          console.error('JSON解析失败:', parseError)
          ElMessage.error(`JSON格式不正确: ${parseError.message || '未知错误'}`)
          return { importedCount: 0, newCount: 0, updatedCount: 0 }
        }
      } else if (fileExt === 'zip') {
        // 处理ZIP文件
        console.log('开始处理ZIP文件')
        importProgress.value = 20
        
        let arrayBuffer: ArrayBuffer
        try {
          arrayBuffer = await file.arrayBuffer()
          console.log(`成功读取ZIP文件内容，大小: ${arrayBuffer.byteLength} 字节`)
          importProgress.value = 30
        } catch (bufferError: any) {
          console.error('读取ZIP文件内容失败:', bufferError)
          ElMessage.error(`读取ZIP文件内容失败: ${bufferError.message || '未知错误'}`)
          return { importedCount: 0, newCount: 0, updatedCount: 0 }
        }
        
        let zip: JSZip
        try {
          zip = await JSZip.loadAsync(arrayBuffer)
          console.log('ZIP文件解析成功')
          importProgress.value = 50
        } catch (zipError: any) {
          console.error('ZIP文件解析失败:', zipError)
          ElMessage.error(`ZIP文件解析失败: ${zipError.message || '未知错误'}`)
          return { importedCount: 0, newCount: 0, updatedCount: 0 }
        }
        
        // 查找JSON文件
        let jsonFile = null
        let jsonContent = null
        
        // 遍历ZIP文件内容
        console.log('开始查找ZIP中的JSON文件')
        const fileList = Object.keys(zip.files)
        console.log(`ZIP中包含 ${fileList.length} 个文件:`, fileList.join(', '))
        
        for (const filename in zip.files) {
          if (filename.endsWith('.json')) {
            console.log(`找到JSON文件: ${filename}`)
            jsonFile = zip.files[filename]
            break
          }
        }
        
        if (jsonFile) {
          try {
            console.log('开始读取JSON文件内容')
            jsonContent = await jsonFile.async('text')
            console.log(`成功读取JSON文件内容，长度: ${jsonContent.length} 字符`)
            importProgress.value = 70
          } catch (textError: any) {
            console.error('读取ZIP中的JSON文件内容失败:', textError)
            ElMessage.error(`读取ZIP中的JSON文件内容失败: ${textError.message || '未知错误'}`)
            return { importedCount: 0, newCount: 0, updatedCount: 0 }
          }
          
          try {
            console.log('开始解析JSON数据')
            const jsonData = JSON.parse(jsonContent)
            console.log('JSON解析成功，开始处理数据')
            importProgress.value = 80
            
            // 检测是否为多语言格式
            const isMultiLangFormat = Object.keys(jsonData).some(key => 
              translationStore.availableLanguages.some(lang => lang.code === key)
            )
            
            console.log(`检测到${isMultiLangFormat ? '多语言' : '单语言'}字典格式`)
            
            if (isMultiLangFormat) {
              // 处理多语言合集格式
              ElMessage.info('检测到多语言字典格式')
              
              // 获取当前语言的数据
              const currentLang = translationStore.currentLanguage
              console.log(`当前语言: ${currentLang}`)
              const langDict = jsonData[currentLang]
              
              if (langDict && typeof langDict === 'object') {
                console.log(`找到当前语言(${currentLang})的数据，条目数: ${Object.keys(langDict).length}`)
                importedItems = Object.entries(langDict).map(([key, value]) => ({
                  key,
                  value: typeof value === 'string' ? value : '',
                  sourceText: key // 添加sourceText属性，默认使用key作为源文本
                }))
              } else {
                console.warn(`未找到当前语言(${currentLang})的数据`)
                ElMessage.warning(`未找到当前语言(${currentLang})的数据`)
              }
            } else {
              // 处理单语言字典格式
              console.log(`处理单语言字典格式，条目数: ${Object.keys(jsonData).length}`)
              importedItems = Object.entries(jsonData).map(([key, value]) => ({
                key,
                value: typeof value === 'string' ? value : '',
                sourceText: key // 添加sourceText属性，默认使用key作为源文本
              }))
            }
          } catch (parseError: any) {
            console.error('JSON解析失败:', parseError)
            ElMessage.error(`JSON格式不正确: ${parseError.message || '未知错误'}`)
            return { importedCount: 0, newCount: 0, updatedCount: 0 }
          }
        } else {
          console.error('ZIP文件中未找到JSON文件')
          ElMessage.error('ZIP文件中未找到JSON文件')
          return { importedCount: 0, newCount: 0, updatedCount: 0 }
        }
      } else {
        console.error(`不支持的文件格式: ${fileExt}`)
        ElMessage.error(`不支持的文件格式: ${fileExt}，仅支持JSON和ZIP文件`)
        return { importedCount: 0, newCount: 0, updatedCount: 0 }
      }
      
      // 检查是否有导入项
      if (importedItems.length === 0) {
        console.warn('没有找到可导入的条目')
        ElMessage.warning('没有找到可导入的条目')
        return { importedCount: 0, newCount: 0, updatedCount: 0 }
      }
      
      console.log(`准备导入 ${importedItems.length} 个条目`)
      importProgress.value = 90
      
      // 导入到翻译管理器
      console.log('开始导入到翻译管理器')
      const importedCount = translationStore.importTranslations(importedItems)
      console.log(`导入完成，成功导入 ${importedCount} 个条目`)
      
      importProgress.value = 100
      ElMessage.success(`成功导入：${importedCount}个条目`)
      
      return { 
        importedCount, 
        newCount: Math.floor(importedCount / 2), 
        updatedCount: Math.ceil(importedCount / 2) 
      }
    } catch (error: any) {
      console.error('导入失败:', error)
      ElMessage.error(`导入失败: ${error.message || '未知错误'}`)
      return { importedCount: 0, newCount: 0, updatedCount: 0 }
    } finally {
      console.log('导入过程结束，重置状态')
      setTimeout(() => {
        importProgress.value = 0
        isImporting.value = false
      }, 1500)
    }
  }
  
  /**
   * 导出为JSON文件
   * @param filename 文件名
   */
  const exportToJsonFile = (filename: string = 'translations.json'): void => {
    try {
      isExporting.value = true
      
      // 获取导出数据
      const exportData = translationStore.exportToJson()
      
      // 创建Blob对象
      const jsonStr = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' })
      
      // 保存文件
      saveAs(blob, filename)
      
      ElMessage.success('导出成功')
    } catch (error: any) {
      console.error('导出失败:', error)
      ElMessage.error(`导出失败: ${error.message}`)
    } finally {
      isExporting.value = false
    }
  }
  
  /**
   * 导出为ZIP文件
   * @param filename 文件名
   * @param includeReadme 是否包含README文件
   */
  const exportToZipFile = async (filename: string = 'translations.zip', includeReadme: boolean = false): Promise<void> => {
    try {
      isExporting.value = true
      
      // 创建ZIP实例
      const zip = new JSZip()
      
      // 获取导出数据
      const exportData = translationStore.exportToJson()
      
      // 添加JSON文件
      const jsonStr = JSON.stringify(exportData, null, 2)
      zip.file(`${translationStore.currentLanguage}.json`, jsonStr)
      
      // 添加README文件
      if (includeReadme) {
        const readmeContent = `# Obsidian Chameleon Dictionary\n\n这是由Obsidian变色龙字典导出的翻译文件，包含${Object.keys(exportData).length}个翻译条目。\n\n## 使用方法\n\n将此文件放入Obsidian插件的语言目录中即可使用。\n\n## 导出时间\n\n${new Date().toLocaleString()}`
        
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
    } finally {
      isExporting.value = false
    }
  }

  /**
   * 导出为字典格式的JSON文件
   * @param filename 文件名
   */
  const exportToDictionaryFile = async (filename: string): Promise<void> => {
    try {
      isExporting.value = true
      
      // 创建字典数据结构 {[语言代码]: {[key]: value}}
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
          if (item.key) {
            dictionaryData[lang.code][item.key] = item.value || ''
          }
        })
      }
      
      // 转换为JSON并下载
      const jsonContent = JSON.stringify(dictionaryData, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      saveAs(blob, filename)
      
      ElMessage.success('字典导出成功')
    } catch (error: any) {
      console.error('字典导出失败:', error)
      ElMessage.error(`导出失败: ${error.message}`)
    } finally {
      isExporting.value = false
    }
  }
  
  /**
   * 导出字典
   * @param translations 翻译数据
   * @param format 导出格式
   * @returns 是否导出成功
   */
  function exportDictionary(translations: Record<string, string>, format: 'json' | 'plainText' | 'zip'): Promise<boolean> {
    try {
      isExporting.value = true;
      let content = '';
      
      // 检测未翻译的条目
      const untranslatedEntries = Object.entries(translations).filter(([_, value]) => !value);
      const untranslatedCount = untranslatedEntries.length;
      const translationProgress = Math.round(((Object.keys(translations).length - untranslatedCount) / Object.keys(translations).length) * 100);
      
      if (format === 'json') {
        // 添加未翻译条目信息作为注释
        let jsonContent = JSON.stringify(translations, null, 2);
        if (untranslatedCount > 0) {
          const missingInfo = `// 注意: 有 ${untranslatedCount} 个未翻译条目 (${translationProgress}% 已完成)\n`;
          // 添加缺少翻译的示例条目
          const missingExamples = untranslatedEntries.slice(0, 3);
          let examplesInfo = '// 缺少翻译的条目示例:\n';
          missingExamples.forEach(([key], index) => {
            examplesInfo += `// 示例${index + 1}: ${key}\n`;
          });
          content = `${missingInfo}${examplesInfo}${jsonContent}`;
        } else {
          content = jsonContent;
        }
      } else if (format === 'plainText') {
        // 添加未翻译条目信息
        if (untranslatedCount > 0) {
          content = `# 注意: 有 ${untranslatedCount} 个未翻译条目 (${translationProgress}% 已完成)\n\n`;
          // 添加缺少翻译的示例条目
          content += '# 缺少翻译的条目示例:\n';
          const missingExamples = untranslatedEntries.slice(0, 3);
          missingExamples.forEach(([key], index) => {
            content += `# 示例${index + 1}: ${key}\n`;
          });
          content += '\n';
        }
        content += Object.entries(translations).map(([key, value]) => `${key}: ${value || '[未翻译]'}`).join('\n');
      }
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `translations.${format}`);
      ElMessage.success('导出成功');
      return Promise.resolve(true);
    } catch (error:unknown) {
      const _error = error as Error;
      console.error('导出失败:', _error);
      ElMessage.error(`导出失败: ${_error.message}`);
      return Promise.resolve(false);
    } finally {
      isExporting.value = false;
    }
  }

return {
    // 状态
    isImporting,
    isExporting,
    importProgress,
    
    // 导入方法
    importTextContent,
    importFromUrl,
    handleFileUpload,
    
    // 导出方法
    exportToJsonFile,
    exportToZipFile,
    exportDictionary,
    exportToDictionaryFile
  }
}