/**
 * 翻译数据管理的组合式函数
 * 整合过滤、操作和统计模块
 */
import { useTranslationStore } from '../../stores'
import { useFilterModule } from './filter'
import { useOperationModule } from './operation'
import { useStatsModule } from './stats'

/**
 * 翻译数据管理的组合式函数
 * 提供翻译数据的过滤、添加、编辑、删除等功能
 * 模块化设计，将功能分为过滤模块、操作模块和统计模块
 */
export function useTranslationManager() {
  // 获取翻译store
  const translationStore = useTranslationStore()
  
  // 初始化各个功能模块
  const filterModule = useFilterModule(translationStore)
  const operationModule = useOperationModule(translationStore, filterModule.filterTranslations)
  const statsModule = useStatsModule(translationStore)
  
  return {
    // 从过滤模块导出
    ...filterModule,
    
    // 从操作模块导出
    ...operationModule,
    
    // 从统计模块导出
    ...statsModule
  }
}

// 导出子模块，方便按需引入
export { useFilterModule } from './filter'
export { useOperationModule } from './operation'
export { useStatsModule } from './stats'