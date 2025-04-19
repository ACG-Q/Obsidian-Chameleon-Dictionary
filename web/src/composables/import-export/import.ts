/**
 * 导入功能模块
 * 提供各种导入方法，如文本导入、URL导入、文件导入等
 */
import { ElMessage } from 'element-plus'
import JSZip from 'jszip'
import type { Translation } from '../../stores/translationStore'
import type { ImportResult } from './types'
import { handleImportError, parseJsonData, finishImport } from './utils'
import { useTranslationStore } from '../../stores'

/**
 * 导入文本内容
 * @param text 要导入的文本内容
 * @param format 导入格式 (json, plainText)
 * @param updateProgress 更新进度的回调函数
 * @returns 导入结果
 */
export const importTextContent = async (
  text: string,
  format: 'json' | 'plainText',
  updateProgress: (progress: number) => void
): Promise<ImportResult> => {
  if (!text.trim()) {
    ElMessage.warning('请输入要导入的内容')
    return { importedCount: 0, newCount: 0, updatedCount: 0 }
  }
  
  try {
    updateProgress(10)
    
    let parsedData: Record<string, Translation[]> = {}
    
    // 解析导入内容
    if (format === 'json') {
      try {
        const jsonData = JSON.parse(text)
        updateProgress(50)
        const { data, format: detectedFormat } = parseJsonData(jsonData)
        parsedData = data
        // 显示导入格式信息 (已在 parseJsonData 中处理)
        // if (detectedFormat === 'multiLanguage') {
        //   ElMessage.info('导入多语言字典格式')
        // }
      } catch (e) {
        ElMessage.error('JSON格式不正确')
        return { importedCount: 0, newCount: 0, updatedCount: 0, errors: [{ key: 'error', message: '无效的JSON格式' }] }
      }
    } else {
      // 纯文本格式，每行一个条目
      const translationStore = useTranslationStore() // 需要引入 useTranslationStore
      const currentLang = translationStore.currentLanguage
      const items = text.split('\n')
        .filter(line => line.trim())
        .map(line => ({
          key: line.trim(),
          value: '',
          sourceText: line.trim(),
        }))
      parsedData[currentLang] = items // 将纯文本视为当前语言的数据
    }
    
    return finishImport(parsedData, updateProgress)
  } catch (error: any) {
    return handleImportError(error)
  }
}

/**
 * 从URL导入字典
 * @param url 导入的URL地址
 * @param updateProgress 更新进度的回调函数
 * @returns 导入结果
 */
export const importFromUrl = async (
  url: string,
  updateProgress: (progress: number) => void
): Promise<ImportResult> => {
  if (!url) {
    ElMessage.warning('请输入URL地址')
    return { importedCount: 0, newCount: 0, updatedCount: 0 }
  }
  
  try {
    updateProgress(10)
    
    // 发起网络请求获取资源
    const response = await fetch(url)
    updateProgress(50)
    
    if (!response.ok) {
      throw new Error(`网络请求失败: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json() as Record<string, unknown>
    updateProgress(70)
    
    // 解析JSON数据
    const { data: parsedData, format } = parseJsonData(data)
    
    // 显示导入格式信息 (已在 parseJsonData 中处理)
    // if (format === 'multiLanguage') {
    //   ElMessage.info('导入多语言字典格式')
    // }
    
    return finishImport(parsedData, updateProgress)
  } catch (error: any) {
    return handleImportError(error)
  }
}

/**
 * 处理文件上传
 * @param file 上传的文件
 * @param updateProgress 更新进度的回调函数
 * @returns 导入结果
 */
export const handleFileUpload = async (
  file: File,
  updateProgress: (progress: number) => void
): Promise<ImportResult> => {
  if (!file) {
    return handleImportError(new Error('文件对象为空'))
  }
  
  try {
    updateProgress(10)
    
    // 检查文件大小
    if (file.size > 10 * 1024 * 1024) { // 10MB限制
      ElMessage.warning('文件较大，处理可能需要一些时间')
    }
    
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
    let importedItems: Translation[] = []
    
    if (fileExt === 'json') {
      // 处理JSON文件
      updateProgress(20)
      
      try {
        const text = await file.text()
        updateProgress(40)
        
        const jsonData = JSON.parse(text)
        updateProgress(60)
        
        const { data: parsedData } = parseJsonData(jsonData)
        // 将解析后的数据传递给 finishImport
        return finishImport(parsedData, updateProgress)
        // updateProgress(80) // finishImport 会处理最后的进度
      } catch (parseError: any) {
        return handleImportError(parseError, 'JSON格式不正确')
      }
    } else if (fileExt === 'zip') {
      // 处理ZIP文件
      updateProgress(20)
      
      try {
        const arrayBuffer = await file.arrayBuffer()
        updateProgress(30)
        
        const zip = await JSZip.loadAsync(arrayBuffer)
        updateProgress(50)
        
        // 查找JSON文件
        let jsonFile = null
        
        // 遍历ZIP文件内容查找第一个JSON文件
        for (const filename in zip.files) {
          if (filename.endsWith('.json')) {
            jsonFile = zip.files[filename]
            break
          }
        }
        
        if (jsonFile) {
          const jsonContent = await jsonFile.async('text')
          updateProgress(70)
          
          const jsonData = JSON.parse(jsonContent)
          updateProgress(80)
          
          const { data: parsedData, format } = parseJsonData(jsonData)
          
          // 显示导入格式信息 (已在 parseJsonData 中处理)
          // if (format === 'multiLanguage') {
          //   ElMessage.info('导入多语言字典格式')
          // }
          
          // 将解析后的数据传递给 finishImport
          return finishImport(parsedData, updateProgress)
        } else {
          throw new Error('ZIP文件中未找到JSON文件')
        }
      } catch (zipError: any) {
        return handleImportError(zipError)
      }
    } else {
      return handleImportError(
        new Error(`不支持的文件格式: ${fileExt}`), 
        `不支持的文件格式: ${fileExt}，仅支持JSON和ZIP文件`
      )
    }
    
    // 不再需要此处的 finishImport 调用，已在 JSON 和 ZIP 处理块内部调用
    // return finishImport(importedItems, updateProgress)
  } catch (error: any) {
    return handleImportError(error)
  }
}