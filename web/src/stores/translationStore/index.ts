/**
 * 翻译数据管理的Pinia Store
 * 提供翻译数据的加载、过滤、添加、编辑、删除等功能
 * 
 * 模块化设计，将功能分为以下几个模块：
 * - 核心状态管理：定义基本状态和计算属性
 * - 语言管理：处理语言切换和加载
 * - 翻译操作：处理翻译的添加、更新、删除等操作
 * - 导入导出：处理翻译数据的导入和导出
 */
import { defineStore } from 'pinia'
import { useLanguageModule } from './languagemodule'
import { useTranslationOperationModule } from './operationModule'
import { useImportExportModule } from './importexportmodule'
import { useCoreModule } from './coreModule'

/**
 * 翻译数据管理的Pinia Store
 * 使用组合式API，将功能分为多个模块
 */
export const useTranslationStore = defineStore('translation', () => {
  // 核心模块：定义基本状态和计算属性
  const coreModule = useCoreModule()
  
  // 语言管理模块：处理语言切换和加载
  const languageModule = useLanguageModule(coreModule)
  
  // 翻译操作模块：处理翻译的添加、更新、删除等操作
  const operationModule = useTranslationOperationModule(coreModule)
  
  // 导入导出模块：处理翻译数据的导入和导出
  const importExportModule = useImportExportModule(coreModule)

  /**
   * 刷新当前显示的翻译列表
   * 通常在导入或语言切换后调用
   */
  const refreshTranslations = () => {
    const langData = coreModule.languageData[coreModule.currentLanguage.value]
    if (langData) {
      coreModule.translations.value = [...langData] // 使用扩展运算符创建新数组以触发响应式更新
    } else {
      // 如果当前语言数据不存在（可能在导入后发生），则基于原文创建空翻译
      coreModule.translations.value = Object.keys(coreModule.sourceTexts.value).map(key => ({
        key,
        sourceText: coreModule.sourceTexts.value[key],
        value: ''
      }))
      // 同时在 languageData 中创建该语言的条目
      coreModule.languageData[coreModule.currentLanguage.value] = [...coreModule.translations.value]
    }
    console.log(`Translations refreshed for language: ${coreModule.currentLanguage.value}`)
  }

  return {
    // 从核心模块导出
    ...coreModule,
    
    // 从语言管理模块导出
    ...languageModule,
    
    // 从翻译操作模块导出
    ...operationModule,
    
    // 从导入导出模块导出
    ...importExportModule,
    // 新增方法
    refreshTranslations
  }
})

// 导出类型定义
export type { Translation, Language, LanguageStats } from './types'