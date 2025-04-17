<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { LanguageStats } from '../../stores/translationStore';

// 使用i18n
const { t } = useI18n();

interface IProps {
  totalItems: number;
  translatedCount: number;
  allLanguagesStats: LanguageStats[];
  currentLanguages: string;
}

const props = defineProps<IProps>()

// 计算属性
const untranslatedCount = computed(() => {
  return props.totalItems - props.translatedCount;
});

const progressPercentage = computed(() => {
  if (props.totalItems === 0) return 0;
  return Math.round((props.translatedCount / props.totalItems) * 100);
});

// 格式化进度显示
const progressFormat = (percentage: number) => {
  return `${percentage}% (${props.translatedCount}/${props.totalItems})`;
};
</script>

<template>
  <div class="translation-stats function-card enhanced-card">
    <div class="function-card__header">
      <h3 class="function-card__title">{{ t('stats.title') }} -- {{ props.currentLanguages  }}</h3>
    </div>
    
    <div class="function-card__content">
      <div class="translation-stats__grid">
        <div class="translation-stats__item">
          <div class="translation-stats__label">{{ t('stats.total') }}</div>
          <div class="translation-stats__value">{{ totalItems }}</div>
        </div>
        
        <div class="translation-stats__item">
          <div class="translation-stats__label">{{ t('stats.translated') }}</div>
          <div class="translation-stats__value translation-stats__value--success">{{ translatedCount }}</div>
        </div>
        
        <div class="translation-stats__item">
          <div class="translation-stats__label">{{ t('stats.untranslated') }}</div>
          <div class="translation-stats__value translation-stats__value--warning">{{ untranslatedCount }}</div>
        </div>
      </div>
      
      <div class="translation-stats__progress-container">
        <div class="translation-stats__progress-label">
          {{ t('stats.progress') }}: {{ progressPercentage }}%
        </div>
        <el-progress 
          :percentage="progressPercentage" 
          :format="progressFormat"
          :stroke-width="20"
          class="translation-stats__progress-bar"
        />
      </div>
    </div>

    <hr />

    <h3 class="translation-stats__subtitle">{{ t('stats.byLanguage') }}</h3>
    <el-table :data="props.allLanguagesStats" stripe style="width: 100%">
      <el-table-column prop="name" :label="t('language.select')" width="180" />
      <el-table-column prop="total" :label="t('stats.total')" width="100" />
      <el-table-column prop="translated" :label="t('stats.translated')" width="100" />
      <el-table-column prop="untranslated" :label="t('stats.untranslated')" width="100" />
      <el-table-column :label="t('stats.progress')" width="180">
        <template #default="scope">
          <el-progress 
            :percentage="scope.row.progress" 
            :status="scope.row.progress === 100 ? 'success' : ''"
          />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style lang="scss" scoped>
.translation-stats {
  padding: 20px;
  
  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }
  
  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    border-radius: var(--app-border-radius);
    background-color: var(--el-fill-color-light);
    transition: var(--app-transition);
    
    &:hover {
      transform: translateY(-3px);
      box-shadow: var(--app-box-shadow);
    }
  }
  
  &__label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
  }
  
  &__value {
    font-size: 24px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    
    &--success {
      color: var(--el-color-success);
    }
    
    &--warning {
      color: var(--el-color-warning);
    }
  }
  
  &__progress-container {
    margin-top: 16px;
  }
  
  &__progress-label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
  }
  
  &__progress-bar {
    margin-top: 8px;
  }
  
  &__subtitle {
    margin-top: 20px;
    margin-bottom: 16px;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  
  hr {
    margin: 20px 0;
    border: 0;
    border-top: 1px solid var(--el-border-color-lighter);
  }
  
  .el-table {
    margin-top: 16px;
    border-radius: var(--app-border-radius);
    overflow: hidden;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .translation-stats {
    padding: 16px;
    
    &__grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    
    .el-table {
      width: 100%;
      overflow-x: auto;
    }
  }
}
</style>