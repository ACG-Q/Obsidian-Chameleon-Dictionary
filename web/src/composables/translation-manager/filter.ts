/**
 * 翻译过滤模块
 * 处理搜索、筛选和分页功能
 */
import { ref, computed, watch } from 'vue'
import type { Translation } from '../../stores/translationStore'
import type { useTranslationStore } from '../../stores'

/**
 * 翻译过滤模块
 * @param translationStore - 翻译数据存储
 */
export function useFilterModule(translationStore: ReturnType<typeof useTranslationStore>) {
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
  
  // 监听翻译数据变化，自动更新过滤结果
  watch(
    () => [translationStore.translations, searchQuery.value, filterStatus.value],
    filterTranslations,
    { immediate: true }
  )
  
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
    
    // 方法
    filterTranslations
  }
}