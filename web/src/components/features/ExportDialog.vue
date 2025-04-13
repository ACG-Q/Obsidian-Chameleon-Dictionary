<template>
  <el-dialog
    :title="t('export.title')"
    v-model="dialogVisible"
    width="50%"
    class="export-dialog"
  >
    <div class="export-dialog__content">
      <el-tabs v-model="activeTab" class="export-dialog__tabs">
        <!-- 单个翻译导出 -->
        <el-tab-pane :label="t('export.singleExport')" name="single">
          <div class="export-dialog__form">
            <el-form label-position="top">
              <el-form-item :label="t('export.filename')">
                <el-input 
                  v-model="filename" 
                  :placeholder="t('export.filenamePlaceholder')"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <!-- 多个翻译导出 -->
        <el-tab-pane :label="t('export.multiExport')" name="multi">
          <div class="export-dialog__form">
            <el-form label-position="top">
              <el-form-item :label="t('export.filename')">
                <el-input 
                  v-model="filename" 
                  :placeholder="t('export.filenamePlaceholder')"
                />
              </el-form-item>
              <el-form-item>
                <el-checkbox v-model="includeReadme">{{ t('export.includeReadme') }}</el-checkbox>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <!-- 字典导出 -->
        <el-tab-pane :label="t('export.dictionaryExport')" name="dictionary">
          <div class="export-dialog__form">
            <el-form label-position="top">
              <el-form-item :label="t('export.filename')">
                <el-input 
                  v-model="filename" 
                  :placeholder="t('export.filenamePlaceholder')"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <!-- 导出预览 -->
      <div class="export-dialog__preview">
        <div class="export-dialog__preview-header">
          <h4 class="export-dialog__preview-title">{{ t('export.preview') }}</h4>
          <div class="export-dialog__preview-stats">
            <el-tag type="info" size="small">{{ t('export.totalItems') }}: {{ props.translations.length }}</el-tag>
            <el-tag type="success" size="small">{{ t('export.translatedItems') }}: {{ props.translations.length - untranslatedCount }}</el-tag>
            <el-tag type="warning" size="small" v-if="untranslatedCount > 0">{{ t('export.untranslatedItems') }}: {{ untranslatedCount }}</el-tag>
            <el-progress :percentage="translationProgress" :format="progressFormat" style="margin-top: 8px" />
          </div>
        </div>
        <div class="export-dialog__preview-content">
          <pre class="export-dialog__preview-code">{{ previewContent }}</pre>
        </div>
        <div class="export-dialog__preview-missing" v-if="untranslatedCount > 0">
          <h5>{{ t('export.missingTranslations') }}</h5>
          <el-table :data="missingTranslationsPreview" size="small" style="width: 100%">
            <el-table-column prop="key" :label="t('translation.key')" width="180" />
            <el-table-column prop="sourceText" :label="t('translation.sourceText')" />
          </el-table>
          <div class="export-dialog__preview-missing-more" v-if="untranslatedCount > 5">
            {{ t('export.andMoreItems', { count: untranslatedCount - 5 }) }}
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="export-dialog__footer">
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button 
          type="primary" 
          @click="handleExport" 
          :loading="isExporting"
        >
          {{ t('export.export') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Translation } from '../../stores/translationStore';

// 使用i18n
const { t } = useI18n();



interface IProps {
  visible: boolean;
  isExporting: boolean;
  translations: Translation[];
  currentLanguage: string;
  onExportJson?: (filename: string) => void;
  onExportZip?: (filename: string, includeReadme: boolean) => void;
  onExportDictionary?: (filename: string) => void;
  'onUpdate:visible'?: (val: boolean) => void;
}

const props = defineProps<IProps>();

// 对话框状态
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => {
    if (props['onUpdate:visible']) {
      props['onUpdate:visible'](val);
    }
  }
});

// 导出选项
const activeTab = ref<'single' | 'multi' | 'dictionary'>('single');
const filename = ref('');
const includeReadme = ref(true);

// 设置默认文件名
watch(() => props.currentLanguage, (newLang) => {
  if (activeTab.value === 'single') {
    filename.value = `${newLang}.json`;
  } else if (activeTab.value === 'multi') {
    filename.value = 'translations.zip';
  } else if (activeTab.value === 'dictionary') {
    filename.value = 'dictionary.json';
  }
}, { immediate: true });

// 当导出类型改变时更新文件名
watch(() => activeTab.value, (newTab) => {
  if (newTab === 'single') {
    filename.value = `${props.currentLanguage}.json`;
  } else if (newTab === 'multi') {
    filename.value = 'translations.zip';
  } else if (newTab === 'dictionary') {
    filename.value = 'dictionary.json';
  }
});

// 计算未翻译的条目数量
const untranslatedCount = computed(() => {
  return props.translations.filter(item => !item.value).length;
});

// 翻译完成率
const translationProgress = computed(() => {
  if (props.translations.length === 0) return 0;
  return Math.round(((props.translations.length - untranslatedCount.value) / props.translations.length) * 100);
});

// 格式化进度显示
const progressFormat = (percentage: number): string => {
  return `${percentage}% (${props.translations.length - untranslatedCount.value}/${props.translations.length})`;
};

// 缺少翻译的预览条目
const missingTranslationsPreview = computed(() => {
  return props.translations
    .filter(item => !item.value)
    .slice(0, 5)
    .map(item => ({
      key: item.key,
      sourceText: item.sourceText || item.key
    }));
});

// 预览内容
const previewContent = computed(() => {
  if (props.translations.length === 0) {
    return '{}';
  }
  
  // 创建预览对象
  if (activeTab.value === 'single') {
    // 单个翻译导出预览
    const previewObj:Record<string, string> = {};
    const previewItems = props.translations.slice(0, 3);
    
    previewItems.forEach(item => {
      if (item.key) {
        previewObj[item.key] = item.value || '';
      }
    });
    
    if (props.translations.length > 3) {
      previewObj['...'] = '...';
    }
    
    // 添加未翻译条目提示
    if (untranslatedCount.value > 0) {
      previewObj['// 注意'] = `有 ${untranslatedCount.value} 个未翻译条目 (${translationProgress.value}% 已完成)`;
      
      // 添加缺少翻译的示例条目
      if (untranslatedCount.value > 0) {
        previewObj['// 缺少翻译的条目示例'] = '';
        const missingExamples = props.translations.filter(item => !item.value).slice(0, 3);
        missingExamples.forEach((item, index) => {
          previewObj[`// 示例${index + 1}: ${item.key}`] = '未翻译';
        });
      }
    }
    
    return JSON.stringify(previewObj, null, 2);
  } else if (activeTab.value === 'multi') {
    // 多个翻译导出预览 (ZIP格式)
    let preview = `// ${t('export.zipPreview')}\n`;
    preview += `${props.currentLanguage}.json\n`;
    
    // 添加其他可能的语言文件
    const otherLanguages = ['en', 'zh', 'ja', 'fr'].filter(lang => lang !== props.currentLanguage).slice(0, 2);
    otherLanguages.forEach(lang => {
      preview += `${lang}.json\n`;
    });
    
    preview += '...\n';
    
    // 添加未翻译条目提示
    if (untranslatedCount.value > 0) {
      preview += `\n// 注意: 有 ${untranslatedCount.value} 个未翻译条目 (${translationProgress.value}% 已完成)`;
      preview += '\n// 缺少翻译的条目示例:';
      
      // 添加缺少翻译的示例条目
      const missingExamples = props.translations.filter(item => !item.value).slice(0, 3);
      missingExamples.forEach((item, index) => {
        preview += `\n// 示例${index + 1}: ${item.key}`;
      });
    }
    
    if (includeReadme.value) {
      preview += '\nREADME.md';
    }
    
    return preview;
  } else {
    // 字典导出预览
    const dictPreview:Record<string, Record<string, string>> = {};
    dictPreview[props.currentLanguage] = {};
    
    // 添加当前语言的翻译
    const previewItems = props.translations.slice(0, 2);
    previewItems.forEach(item => {
      if (item.key) {
        dictPreview[props.currentLanguage][item.key] = item.value || '';
      }
    });
    
    if (props.translations.length > 2) {
      dictPreview[props.currentLanguage]['...'] = '...';
    }
    
    // 添加其他语言示例
    const otherLang = props.currentLanguage === 'en' ? 'zh' : 'en';
    dictPreview[otherLang] = {};
    if (previewItems.length > 0 && previewItems[0].key) {
      dictPreview[otherLang][previewItems[0].key] = `${otherLang} translation`;
    }
    if (previewItems.length > 1 && previewItems[1].key) {
      dictPreview[otherLang][previewItems[1].key] = `${otherLang} translation`;
    }
    if (props.translations.length > 2) {
      dictPreview[otherLang]['...'] = '...';
    }
    
    // 添加未翻译条目提示作为注释
    let result = JSON.stringify(dictPreview, null, 2);
    if (untranslatedCount.value > 0) {
      let missingInfo = `// 注意: 有 ${untranslatedCount.value} 个未翻译条目 (${translationProgress.value}% 已完成)\n`;
      
      // 添加缺少翻译的示例条目
      missingInfo += '// 缺少翻译的条目示例:\n';
      const missingExamples = props.translations.filter(item => !item.value).slice(0, 3);
      missingExamples.forEach((item, index) => {
        missingInfo += `// 示例${index + 1}: ${item.key}\n`;
      });
      
      result = `${missingInfo}${result}`;
    }
    
    return result;
  }
});

// 处理导出
const handleExport = () => {
  if (props.isExporting) return;
  
  // 验证文件名
  if (!filename.value) {
    if (activeTab.value === 'single') {
      filename.value = `${props.currentLanguage}.json`;
    } else if (activeTab.value === 'multi') {
      filename.value = 'translations.zip';
    } else {
      filename.value = 'dictionary.json';
    }
  }
  
  // 确保文件名有正确的扩展名
  if (activeTab.value === 'single' || activeTab.value === 'dictionary') {
    if (!filename.value.endsWith('.json')) {
      filename.value = `${filename.value}.json`;
    }
  } else if (activeTab.value === 'multi' && !filename.value.endsWith('.zip')) {
    filename.value = `${filename.value}.zip`;
  }
  
  if (activeTab.value === 'single') {
    // 单个翻译导出 - 当前语言的JSON文件
    if (props.onExportJson) {
      props.onExportJson(filename.value);
    }
  } else if (activeTab.value === 'multi') {
    // 多个翻译导出 - 所有语言打包成ZIP
    if (props.onExportZip) {
      props.onExportZip(filename.value, includeReadme.value);
    }
  } else if (activeTab.value === 'dictionary') {
    // 字典导出 - 以{[语言标识]: {翻译内容}}格式导出JSON
    // 这里需要父组件提供新的导出方法
    if (props.onExportDictionary) {
      props.onExportDictionary(filename.value);
    }
  }
};
</script>

<style lang="scss" scoped>
.export-dialog {
  &__content {
    padding: 0 16px;
  }
  
  &__tabs {
    margin-bottom: 16px;
  }
  
  &__form {
    padding: 16px 0;
  }
  
  &__preview {
    margin-top: 24px;
    border: 1px solid var(--el-border-color);
    border-radius: var(--app-border-radius);
    overflow: hidden;
    
    &-header {
      padding: 12px 16px;
      background-color: var(--el-fill-color-light);
      border-bottom: 1px solid var(--el-border-color);
    }
    
    &-title {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
    
    &-content {
      padding: 16px;
      max-height: 200px;
      overflow: auto;
      background-color: var(--el-bg-color);
    }
    
    &-code {
      margin: 0;
      font-family: monospace;
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
  
  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .export-dialog {
    &__content {
      padding: 0 8px;
    }
    
    &__preview {
      &-content {
        max-height: 150px;
      }
    }
  }
}
</style>