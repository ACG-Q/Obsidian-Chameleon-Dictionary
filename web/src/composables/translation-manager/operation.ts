/**
 * 翻译操作模块
 * 处理翻译的添加、更新、删除等操作
 */
import { ElMessage } from 'element-plus'
import type { Translation } from '../../stores/translationStore'
import type { useTranslationStore } from '../../stores'

/**
 * 翻译操作模块
 * @param translationStore - 翻译数据存储
 * @param filterTranslations - 过滤翻译的方法
 */
export function useOperationModule(
  translationStore: ReturnType<typeof useTranslationStore>,
  filterTranslations: () => void
) {
  /**
   * 处理操作结果并显示消息
   * @param result - 操作结果
   * @param successMessage - 成功消息
   * @returns 操作结果
   */
  const handleOperationResult = (result: boolean, successMessage: string): boolean => {
    if (result) {
      ElMessage.success(successMessage)
      filterTranslations()
    }
    return result
  }
  
  /**
   * 添加新翻译
   * @param item - 翻译项 {key, value}
   * @returns 是否添加成功
   */
  const addTranslation = (item: Translation): boolean => {
    return handleOperationResult(
      translationStore.addTranslation(item),
      '添加成功'
    )
  }
  
  /**
   * 更新翻译
   * @param item - 翻译项 {key, value}
   * @returns 是否更新成功
   */
  const updateTranslation = (item: Translation): boolean => {
    return handleOperationResult(
      translationStore.updateTranslation(item),
      '更新成功'
    )
  }
  
  /**
   * 删除翻译
   * @param item - 翻译项 {key, value}
   * @returns 是否删除成功
   */
  const deleteTranslation = (item: Translation): boolean => {
    return handleOperationResult(
      translationStore.deleteTranslation(item),
      '删除成功'
    )
  }
  
  /**
   * 清空所有翻译
   */
  const clearTranslations = (): void => {
    translationStore.clearTranslations()
    ElMessage.success('已清空所有翻译')
    filterTranslations()
  }
  
  return {
    addTranslation,
    updateTranslation,
    deleteTranslation,
    clearTranslations
  }
}