/**
 * 翻译数据管理的组合式函数
 * 提供翻译数据的过滤、添加、编辑、删除等功能
 */
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useTranslationStore } from '../stores'
import type { Translation } from '../stores/translationStore'

/**
 * 翻译数据管理的组合式函数
 */
export function useTranslationManager() {
  // 获取翻译store
  const translationStore = useTranslationStore()
  
  // 搜索和筛选
  const searchQuery = ref('')
  const filterStatus = ref<'all' | 'translated' | 'untranslated'>('all')
  const filteredTranslations = ref<Translation[]>([])
  
  // 分页
  const currentPage = ref(1)
  const pageSize = ref(20)
  
  // 计算属性
  const totalItems = computed(() => filteredTranslations.value.length)
  const paginatedTranslations = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredTranslations.value.slice(start, end)
  })
  
  // 监听翻译数据变化，自动更新过滤结果
  watch(
    () => [translationStore.translations, searchQuery.value, filterStatus.value],
    () => {
      filterTranslations()
    },
    { immediate: true }
  )
  
  /**
   * 根据搜索条件和筛选状态过滤翻译
   */
  const filterTranslations = () => {
    let filtered = [...translationStore.translations]
    
    // 应用搜索条件
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(item => 
        item.key.toLowerCase().includes(query) || 
        item.value.toLowerCase().includes(query) ||
        item.sourceText.toLowerCase().includes(query)
      )
    }
    
    // 应用筛选状态
    if (filterStatus.value === 'translated') {
      filtered = filtered.filter(item => item.value)
    } else if (filterStatus.value === 'untranslated') {
      filtered = filtered.filter(item => !item.value)
    }
    
    filteredTranslations.value = filtered
    
    // 重置分页到第一页
    if (currentPage.value !== 1) {
      currentPage.value = 1
    }
  }
  
  /**
   * 添加新翻译
   * @param {Translation} item - 翻译项 {key, value}
   * @returns {boolean} - 是否添加成功
   */
  const addTranslation = (item: Translation): boolean => {
    const result = translationStore.addTranslation(item)
    if (result) {
      ElMessage.success('添加成功')
      filterTranslations()
    }
    return result
  }
  
  /**
   * 更新翻译
   * @param {Translation} item - 翻译项 {key, value}
   * @returns {boolean} - 是否更新成功
   */
  const updateTranslation = (item: Translation): boolean => {
    const result = translationStore.updateTranslation(item)
    if (result) {
      ElMessage.success('更新成功')
      filterTranslations()
    }
    return result
  }
  
  /**
   * 删除翻译
   * @param {Translation} item - 翻译项 {key, value}
   * @returns {boolean} - 是否删除成功
   */
  const deleteTranslation = (item: Translation): boolean => {
    const result = translationStore.deleteTranslation(item)
    if (result) {
      ElMessage.success('删除成功')
      filterTranslations()
    }
    return result
  }
  
  /**
   * 清空所有翻译
   */
  const clearTranslations = (): void => {
    translationStore.clearTranslations()
    ElMessage.success('已清空所有翻译')
    filterTranslations()
  }
  
  /**
   * 格式化进度显示
   * @param {number} percentage - 百分比
   * @returns {string} - 格式化后的进度
   */
  const progressFormat = (percentage: number): string => {
    return `${percentage}% (${translationStore.translatedCount}/${translationStore.translations.length})`
  }
  
  /**
   * 查找缺少翻译的条目
   * @param {number} limit - 限制返回的条目数量，默认为10
   * @returns {Translation[]} - 缺少翻译的条目列表
   */
  const findMissingTranslations = (limit: number = 10): Translation[] => {
    // 获取所有未翻译的条目
    const missing = translationStore.translations.filter(item => !item.value)
    
    // 按照key排序，确保结果稳定
    const sorted = [...missing].sort((a, b) => a.key.localeCompare(b.key))
    
    // 返回指定数量的条目
    return sorted.slice(0, limit)
  }
  
  /**
   * 获取翻译统计信息
   * @returns {object} - 包含翻译统计信息的对象
   */
  const getTranslationStats = () => {
    return {
      total: translationStore.translations.length,
      translated: translationStore.translatedCount,
      untranslated: translationStore.untranslatedCount,
      progress: translationStore.translationProgress
    }
  }

  return {
    // 状态
    searchQuery,
    filterStatus,
    filteredTranslations,
    currentPage,
    pageSize,
    
    // 计算属性
    totalItems,
    paginatedTranslations,
    hasTranslations: computed(() => translationStore.hasTranslations),
    translatedCount: computed(() => translationStore.translatedCount),
    untranslatedCount: computed(() => translationStore.untranslatedCount),
    translationProgress: computed(() => translationStore.translationProgress),
    
    // 方法
    filterTranslations,
    addTranslation,
    updateTranslation,
    deleteTranslation,
    clearTranslations,
    progressFormat,
    findMissingTranslations,
    getTranslationStats
  }
}