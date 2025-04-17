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
 * 字典数据格式类型
 */
export type DictionaryFormat = 'singleLanguage' | 'multiLanguage' | 'plainText'