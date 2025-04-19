<template>
  <div class="translation-header enhanced-card">
    <div class="translation-header__content">
      <div class="translation-header__title-section">
        <h2 class="translation-header__title">{{ t('app.title') }}</h2>
        <p class="translation-header__subtitle">{{ t('app.subtitle') }}</p>
      </div>
      
      <div class="translation-header__actions">
        <el-select
          v-model="selectedLanguage"
          @change="handleLanguageChange"
          :placeholder="t('language.select')"
          class="translation-header__language-select"
        >
          <el-option
            v-for="lang in availableLanguages"
            :key="lang.code"
            :label="lang.name"
            :value="lang.code"
          />
        </el-select>
        
        <div class="translation-header__buttons">
          <el-button 
            type="primary" 
            @click="showImportDialog"
            :icon="Upload"
            class="translation-header__button"
          >
            {{ t('import.title') }}
          </el-button>
          
          <el-button 
            type="success" 
            @click="showExportDialog"
            :icon="Download"
            :disabled="!hasTranslations"
            class="translation-header__button"
          >
            {{ t('export.title') }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Language } from '../../stores/translationStore';
import { Upload, Download } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

// 使用i18n
const { t } = useI18n();

const props = defineProps<{
  currentLanguage: string;
  availableLanguages: Language[];
  hasTranslations: boolean;
  onChangeLanguage: (langCode: string) => void;
  onShowImport: () => void;
  onShowExport: () => void;
}>();

// 选中的语言
const selectedLanguage = ref<string>(props.currentLanguage);

// 处理语言变更
function handleLanguageChange(): void {
  props.onChangeLanguage(selectedLanguage.value);
}

// 显示导入对话框
function showImportDialog(): void {
  props.onShowImport();
}

// 显示导出对话框
function showExportDialog(): void {
  if (!props.hasTranslations) return;
  props.onShowExport();
}
</script>

<style lang="scss" scoped>
.translation-header {
  margin-bottom: 20px;
  
  &__content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
  }
  
  &__title-section {
    flex: 1;
    text-align: left;
  }
  
  &__title {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  
  &__subtitle {
    margin: 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
  
  &__actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  &__language-select {
    width: 140px;
  }
  
  &__buttons {
    display: flex;
    gap: 8px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .translation-header {
    &__content {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
      padding: 16px;
    }
    
    &__actions {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }
    
    &__language-select {
      width: 100%;
    }
    
    &__buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  }
}
</style>