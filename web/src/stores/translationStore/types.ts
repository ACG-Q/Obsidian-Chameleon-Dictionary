/**
 * 翻译数据管理的类型定义
 */

/**
 * 翻译项
 */
export interface Translation {
  /** 唯一标识键 */
  key: string
  /** 原文 */
  sourceText: string
  /** 译文 */
  value: string
}

/**
 * 语言定义
 */
export interface Language {
  /** 语言代码 */
  code: string
  /** 语言名称 */
  name: string
}

/**
 * 语言统计信息
 */
export interface LanguageStats {
  /** 语言代码 */
  code: string
  /** 语言名称 */
  name: string
  /** 总条目数 */
  total: number
  /** 已翻译条目数 */
  translated: number
  /** 未翻译条目数 */
  untranslated: number
  /** 翻译进度百分比 */
  progress: number
}