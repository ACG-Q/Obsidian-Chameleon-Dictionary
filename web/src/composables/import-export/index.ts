/**
 * 导入导出功能的组合式函数入口文件
 * 整合导入、导出等功能，提供统一的接口
 */
import { ref } from 'vue'
import type { ImportResult } from './types'
import { importTextContent, importFromUrl, handleFileUpload } from './import.ts'
import { exportToJsonFile, exportToZipFile, exportToDictionaryFile, exportDictionary } from './export.ts'

/**
 * 导入导出功能的组合式函数
 */
export function useImportExport() {
  // 导入导出状态
  const isImporting = ref<boolean>(false)
  const isExporting = ref<boolean>(false)
  const importProgress = ref<number>(0)
  
  /**
   * 更新导入进度
   * @param progress 进度值(0-100)
   */
  const updateProgress = (progress: number) => {
    importProgress.value = progress
    if (progress >= 100) {
      // 延迟重置状态
      setTimeout(() => {
        importProgress.value = 0
        isImporting.value = false
      }, 1500)
    }
  }

  // 导入文本内容的包装函数
  const importText = async (text: string, format: 'json' | 'plainText'): Promise<ImportResult> => {
    isImporting.value = true
    try {
      return await importTextContent(text, format, updateProgress)
    } finally {
      if (importProgress.value < 100) {
        updateProgress(0)
        isImporting.value = false
      }
    }
  }

  // 从URL导入的包装函数
  const importUrl = async (url: string): Promise<ImportResult> => {
    isImporting.value = true
    try {
      return await importFromUrl(url, updateProgress)
    } finally {
      if (importProgress.value < 100) {
        updateProgress(0)
        isImporting.value = false
      }
    }
  }

  // 处理文件上传的包装函数
  const importFile = async (file: File): Promise<ImportResult> => {
    isImporting.value = true
    try {
      return await handleFileUpload(file, updateProgress)
    } finally {
      if (importProgress.value < 100) {
        updateProgress(0)
        isImporting.value = false
      }
    }
  }

  // 导出为JSON文件的包装函数
  const exportJson = (filename: string = 'translations.json', format: 'singleLanguage' | 'multiLanguage' = 'singleLanguage'): void => {
    isExporting.value = true
    try {
      exportToJsonFile(filename, format)
    } finally {
      isExporting.value = false
    }
  }

  // 导出为ZIP文件的包装函数
  const exportZip = async (filename: string = 'translations.zip', includeReadme: boolean = false, format: 'singleLanguage' | 'multiLanguage' = 'singleLanguage'): Promise<void> => {
    isExporting.value = true
    try {
      await exportToZipFile(filename, includeReadme, format)
    } finally {
      isExporting.value = false
    }
  }

  // 导出为字典格式的包装函数
  const exportDict = async (filename: string, format: 'singleLanguage' | 'multiLanguage' = 'multiLanguage'): Promise<void> => {
    isExporting.value = true
    try {
      await exportToDictionaryFile(filename, format)
    } finally {
      isExporting.value = false
    }
  }

  return {
    // 状态
    isImporting,
    isExporting,
    importProgress,
    
    // 导入方法
    importTextContent: importText,
    importFromUrl: importUrl,
    handleFileUpload: importFile,
    
    // 导出方法
    exportToJsonFile: exportJson,
    exportToZipFile: exportZip,
    exportDictionary,
    exportToDictionaryFile: exportDict
  }
}