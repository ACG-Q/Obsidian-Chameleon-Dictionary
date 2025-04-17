# 翻译数据管理模块使用文档

## 概述

`translationStore` 是一个基于 Pinia 的翻译数据管理模块，采用模块化设计，将功能分为多个子模块，提高代码的可维护性和可读性。该模块提供了翻译数据的加载、过滤、添加、编辑、删除等功能。

## 模块结构

整个翻译数据管理模块分为以下几个子模块：

1. **核心模块 (coreModule)**：定义基本状态和计算属性
2. **语言管理模块 (languageModule)**：处理语言切换和加载
3. **翻译操作模块 (operationModule)**：处理翻译的添加、更新、删除等操作
4. **导入导出模块 (importExportModule)**：处理翻译数据的导入和导出

## 使用方法

### 基本使用

```typescript
import { useTranslationStore } from '@/stores'

// 在组件中使用
const translationStore = useTranslationStore()

// 加载翻译数据
await translationStore.loadTranslations('zh')

// 获取翻译统计信息
const translatedCount = translationStore.translatedCount
const untranslatedCount = translationStore.untranslatedCount
const progress = translationStore.translationProgress
```

### 翻译操作

```typescript
// 添加新翻译
const newTranslation = {
  key: 'greeting',
  sourceText: 'Hello',
  value: '你好'
}
translationStore.addTranslation(newTranslation)

// 更新翻译
const updatedTranslation = {
  key: 'greeting',
  sourceText: 'Hello',
  value: '您好'
}
translationStore.updateTranslation(updatedTranslation)

// 删除翻译
translationStore.deleteTranslation({
  key: 'greeting',
  sourceText: 'Hello',
  value: '您好'
})

// 重置译文为原文
translationStore.resetTranslation('greeting')

// 重置所有译文为原文
translationStore.resetAllTranslations()

// 清空当前语言的翻译
translationStore.clearTranslations()
```

### 导入导出

```typescript
// 批量导入翻译
const translations = [
  { key: 'greeting', sourceText: 'Hello', value: '你好' },
  { key: 'farewell', sourceText: 'Goodbye', value: '再见' }
]
const importedCount = translationStore.importTranslations(translations)

// 导出为单语言格式
const singleLanguageJson = translationStore.exportToJson()

// 导出为多语言格式
const multiLanguageJson = translationStore.exportToJson('multiLanguage')
```

### 语言管理

```typescript
// 切换语言
await translationStore.loadTranslations('en')

// 获取当前语言
const currentLang = translationStore.currentLanguage

// 获取所有语言的统计数据
const languageStats = await translationStore.getAllLanguagesStats()
```

## 可用状态和计算属性

### 状态

- `translations`: 当前语言的翻译数据
- `currentLanguage`: 当前语言代码
- `loading`: 加载状态
- `availableLanguages`: 可用语言列表
- `sourceTexts`: 原文数据

### 计算属性

- `hasTranslations`: 是否有翻译数据
- `translatedCount`: 已翻译条目数
- `untranslatedCount`: 未翻译条目数
- `translationProgress`: 翻译进度百分比

## 方法列表

### 核心模块

- `getSourceText(key)`: 获取原文文本

### 语言管理模块

- `loadTranslations(langCode)`: 加载指定语言的翻译数据
- `getAllLanguagesStats()`: 获取所有语言的翻译统计数据

### 翻译操作模块

- `resetTranslation(key)`: 重置指定译文为原文
- `resetAllTranslations()`: 重置所有译文为原文
- `autoTranslate(key)`: 自动翻译（待实现）
- `addTranslation(item)`: 添加新翻译
- `updateTranslation(item)`: 更新翻译
- `deleteTranslation(item)`: 删除翻译
- `clearTranslations()`: 清空当前语言的翻译

### 导入导出模块

- `importTranslations(items)`: 批量导入翻译
- `exportToJson(format)`: 导出翻译为JSON对象