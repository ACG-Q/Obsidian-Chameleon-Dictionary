<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTranslationStore } from '../stores'

const { t } = useI18n()
const translationsStore = useTranslationStore()

// 统计数据
interface LanguageStats {
  code: string
  name: string
  total: number
  translated: number
  untranslated: number
  progress: number
}

const allLanguagesStats = ref<LanguageStats[]>([])

// 计算总体进度
const overallProgress = computed(() => {
  if (allLanguagesStats.value.length === 0) return 0
  
  const totalItems = allLanguagesStats.value.reduce((sum, lang) => sum + lang.total, 0)
  const translatedItems = allLanguagesStats.value.reduce((sum, lang) => sum + lang.translated, 0)
  
  return totalItems > 0 ? Math.round((translatedItems / totalItems) * 100) : 0
})

// 加载所有语言的统计数据
const loadAllLanguagesStats = async () => {
  const stats = []
  
  // 保存当前语言
  const currentLang = translationsStore.currentLanguage
  
  // 遍历所有语言
  for (const lang of translationsStore.availableLanguages) {
    // 加载该语言的翻译数据
    await translationsStore.loadTranslations(lang.code)
    
    // 添加统计信息
    stats.push({
      code: lang.code,
      name: lang.name,
      total: translationsStore.translations.length,
      translated: translationsStore.translatedCount,
      untranslated: translationsStore.untranslatedCount,
      progress: translationsStore.translationProgress
    })
  }
  
  // 恢复当前语言
  await translationsStore.loadTranslations(currentLang)
  
  allLanguagesStats.value = stats
}

// 初始化
onMounted(async () => {
  await loadAllLanguagesStats()
})
</script>

<template>
  <div class="stats-container">
    <el-card class="stats-card glass-effect" shadow="hover">
      <template #header>
        <div class="card-header">
          <h2>{{ t('stats.title') }}</h2>
        </div>
      </template>
      
      <!-- 总体进度 -->
      <div class="overall-stats">
        <h3>{{ t('stats.overallProgress') }}</h3>
        <el-progress 
          :percentage="overallProgress" 
          :format="(percent: number) => `${percent}%`"
          :status="overallProgress === 100 ? 'success' : ''"
          :stroke-width="20"
        />
      </div>
      
      <!-- 各语言统计 -->
      <div class="languages-stats">
        <h3>{{ t('stats.byLanguage') }}</h3>
        <el-table :data="allLanguagesStats" stripe style="width: 100%">
          <el-table-column prop="name" :label="t('language.name')" width="180" />
          <el-table-column prop="total" :label="t('stats.total')" width="100" />
          <el-table-column prop="translated" :label="t('stats.translated')" width="100" />
          <el-table-column prop="untranslated" :label="t('stats.untranslated')" width="100" />
          <el-table-column :label="t('stats.progress')" width="200">
            <template #default="scope">
              <el-progress 
                :percentage="scope.row.progress" 
                :status="scope.row.progress === 100 ? 'success' : ''"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 刷新按钮 -->
      <div class="refresh-button">
        <el-button type="primary" @click="loadAllLanguagesStats">
          {{ t('stats.refresh') }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.stats-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.stats-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.overall-stats {
  margin-bottom: 30px;
}

.languages-stats {
  margin-bottom: 30px;
}

.refresh-button {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>