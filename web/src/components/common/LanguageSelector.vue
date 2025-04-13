<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Language {
  code: string;
  name: string;
}

interface Stats {
  total: number;
  translated: number;
  untranslated: number;
  progress: number;
}

const props = defineProps<{
  modelValue: string;
  languages: Language[];
  showStats?: boolean;
  stats?: Stats;
  onChange?: (value: string) => void;
  onAddLanguage?: () => void;
  'onUpdate:modelValue'?: (value: string) => void;
}>();


// 处理语言变更
const handleLanguageChange = (value: string) => {
  if (props['onUpdate:modelValue']) {
    props['onUpdate:modelValue'](value)
  }
  if (props.onChange) {
    props.onChange(value)
  }
}

// 添加新语言
const addLanguage = () => {
  if (props.onAddLanguage) {
    props.onAddLanguage()
  }
}
</script>

<template>
  <div class="language-selector">
    <div class="language-selector__container">
      <div class="language-selector__select-container">
        <span class="language-selector__label">{{ t('language.select') }}:</span>
        <el-select
          v-model="modelValue"
          @change="handleLanguageChange"
          class="language-selector__select"
        >
          <el-option
            v-for="lang in languages"
            :key="lang.code"
            :label="lang.name"
            :value="lang.code"
          />
        </el-select>
        <el-button
          type="primary"
          size="small"
          circle
          @click="addLanguage"
          class="language-selector__add-button"
        >
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
      
      <div v-if="showStats && stats" class="language-selector__stats">
        <el-progress
          :percentage="stats.progress"
          :format="(percent: number) => `${percent}%`"
          :status="stats.progress === 100 ? 'success' : ''"
          class="language-selector__progress"
        >
          <template #default>
            <span class="language-selector__progress-text">
              {{ stats.translated }}/{{ stats.total }}
              ({{ stats.untranslated }} {{ t('translation.untranslated') }})
            </span>
          </template>
        </el-progress>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.language-selector {
  margin-bottom: 20px;
  
  &__container {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  &__select-container {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  &__label {
    font-weight: 500;
    white-space: nowrap;
  }
  
  &__select {
    width: 200px;
  }
  
  &__add-button {
    flex-shrink: 0;
  }
  
  &__stats {
    margin-top: 5px;
  }
  
  &__progress {
    width: 100%;
  }
  
  &__progress-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>