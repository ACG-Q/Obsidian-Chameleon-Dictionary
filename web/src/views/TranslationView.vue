<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {ElMessage, type UploadFile} from 'element-plus'
import TranslationHeader from '../components/features/TranslationHeader.vue'
import TranslationList from '../components/features/TranslationList.vue'
import TranslationForm from '../components/features/TranslationForm.vue'
import TranslationStats from '../components/features/TranslationStats.vue'
import ImportDialog from '../components/features/ImportDialog.vue'
import ExportDialog from '../components/features/ExportDialog.vue'
import {useTranslationStore} from '../stores'
import {useImportExport} from '../composables'
import type {LanguageStats, Translation} from '../stores/translationStore'

const { t } = useI18n()
const translationStore = useTranslationStore()
const importExport = useImportExport()

// 组件状态
const activeTab = ref<string>('translationList')
const importDialogVisible = ref<boolean>(false)
const exportDialogVisible = ref<boolean>(false)
const searchQuery = ref<string>('')
const filterStatus = ref<'all' | 'translated' | 'untranslated'>('all')

// 分页
const currentPage = ref<number>(1)
const pageSize = ref<number>(20)

// 计算过滤后的翻译列表
const filteredTranslations = ref<Translation[]>([])
const paginatedData = ref<Translation[]>([])

// 
const allLanguagesStats = ref<LanguageStats[]>([])

// 初始化
onMounted(async () => {
  await loadDictionary()
  await loadAllLanguagesStats()
})

watch(activeTab, async (newTab) => {
  if(newTab === 'statistics') {
    // 切换到统计页面时，重新加载所有语言的翻译统计
    await loadAllLanguagesStats()
  }
})

// 加载字典
async function loadDictionary(): Promise<void> {
  try {
    translationStore.loading = true;
    // todo: 修改为导入当前仓库的字典
    await translationStore.loadTranslations(translationStore.currentLanguage);
    filterTranslations();
    ElMessage.success(t('dictionary.loadSuccess'));
  } catch (error: unknown) {
    const _err = error as Error;
    console.error('加载翻译资源失败:', _err);
    ElMessage.error(t('dictionary.loadError', { message: _err.message }));
  } finally {
    translationStore.loading = false;
  }
}

// 处理语言变更
async function handleLanguageChange(langCode: string): Promise<void> {
  try {
    translationStore.loading = true;
    await translationStore.loadTranslations(langCode);
    filterTranslations();
    ElMessage.success(t('dictionary.languageChanged', { language: translationStore.availableLanguages.find(lang => lang.code === langCode)?.name || langCode }));
  } catch (error: unknown) {
    const _err = error as Error;
    console.error('切换语言失败:', _err);
    ElMessage.error(t('dictionary.loadError', { message: _err.message }));
  } finally {
    translationStore.loading = false;
  }
}

// 过滤翻译
function filterTranslations(): void {
  let filtered = translationStore.translations
  
  // 应用搜索条件
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.key.toLowerCase().includes(query) || 
      (item.value && item.value.toLowerCase().includes(query)) ||
      (item.sourceText && item.sourceText.toLowerCase().includes(query))
    )
  }
  
  // 应用筛选状态
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(item => 
      filterStatus.value === 'translated' ? item.value : !item.value
    )
  }
  
  filteredTranslations.value = filtered
  updatePaginatedData()
  
  // 显示过滤结果统计
  console.log(`过滤结果: ${filteredTranslations.value.length}/${translationStore.translations.length} 条记录`)
}

// 更新分页数据
function updatePaginatedData(): void {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  paginatedData.value = filteredTranslations.value.slice(start, end)
}



// 添加翻译
function addTranslation(item: Translation): void {
  if (translationStore.addTranslation(item)) {
    filterTranslations()
  }
}

// 更新翻译
function updateTranslation(item: Translation): void {
  if (translationStore.updateTranslation(item)) {
    filterTranslations()
  }
}

// 删除翻译
function deleteTranslation(item: Translation): void {
  if (translationStore.deleteTranslation(item)) {
    filterTranslations()
    ElMessage.success(t('common.deleteSuccess'))
  }
}

// 处理文件导入
const handleImportFile = async (file: File): Promise<void> => {
  console.log('TranslationPlatform收到文件:', file);
  try {
    if (!file) {
      console.error('未接收到文件数据');
      ElMessage.error('未接收到文件数据');
      return;
    }

    console.log(`开始处理文件: ${file.name}, 大小: ${file.size} 字节, 类型: ${file.type}`);
    // 不再显示重复的消息，因为useImportExport中已经有相应的消息提示
    const result = await importExport.handleFileUpload(file);
    console.log('导入结果:', result);

    // 只在没有成功导入消息的情况下显示结果
    if (result.importedCount === 0) {
      ElMessage.warning('未导入任何条目');
    }

    // 导入成功后关闭对话框
    if (result.importedCount > 0) {
      importDialogVisible.value = false;
    }
  } catch (error: unknown) {
    const _err = error as Error;
    console.error('文件导入错误:', _err);
    ElMessage.error(`导入失败: ${_err.message || '未知错误'}`);
  }
  // 不在finally中关闭对话框，只有在成功导入后才关闭
};

// 处理URL导入
const handleImportUrl = async (url: string): Promise<void> => {
  await importExport.importFromUrl(url);
  importDialogVisible.value = false;
};

// 处理JSON导出
const handleExportJson = (filename: string) => {
  importExport.exportToJsonFile(filename);
  exportDialogVisible.value = false;
};

// 处理ZIP导出
const handleExportZip = (filename: string, includeReadme: boolean) => {
  importExport.exportToZipFile(filename, includeReadme);
  exportDialogVisible.value = false;
};

// 处理字典导出
const handleExportDictionary = (filename: string) => {
  importExport.exportToDictionaryFile(filename);
  exportDialogVisible.value = false;
};

// 加载所有语言的翻译统计
async function loadAllLanguagesStats(): Promise<void> {
  try {
    translationStore.loading = true;
    allLanguagesStats.value = await translationStore.getAllLanguagesStats();
  } catch (error: unknown) {
    const _err = error as Error;
    console.error('加载翻译统计失败:', _err);
    ElMessage.error('加载翻译统计失败: ' + _err.message);
  } finally {
    translationStore.loading = false;
  }
}

// 处理文本导入
const handleImportText = async (text: string, format: "json" | "plainText"): Promise<void> => {
  await importExport.importTextContent(text, format);
  importDialogVisible.value = false;
};
</script>

<template>
  <div class="translation-view">
    <TranslationHeader
      :current-language="translationStore.currentLanguage"
      :available-languages="translationStore.availableLanguages"
      :has-translations="translationStore.hasTranslations"
      :on-change-language="handleLanguageChange"
      :on-show-import="() => importDialogVisible = true"
      :on-show-export="() => exportDialogVisible = true"
    />
    
    <el-card class="translation-content glass-effect" shadow="hover">
      <el-tabs v-model="activeTab">
        <el-tab-pane :label="t('translation.list')" name="translationList">
          <TranslationList
            :on-delete-translation="deleteTranslation"
            :on-update-translation="updateTranslation"
            :translations="translationStore.translations"
            :loading="translationStore.loading"
          />
        </el-tab-pane>
        
        <el-tab-pane :label="t('translation.addNew')" name="addTranslation">
          <TranslationForm
            :on-add-translation="addTranslation"
          />
        </el-tab-pane>
        
        <el-tab-pane :label="t('stats.title')" name="statistics">
          <TranslationStats
              :total-items="translationStore.translations.length"
              :translated-count="translationStore.translatedCount"
              :all-languages-stats="allLanguagesStats"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 导入对话框 -->
    <ImportDialog
        :visible="importDialogVisible"
        :is-importing="importExport.isImporting.value"
        :import-progress="importExport.importProgress.value"
        :handleImportFile="handleImportFile"
        :on-import-text="handleImportText"
        :on-import-url="handleImportUrl"
        :onUpdate:visible="(val) => importDialogVisible = val"
    />

    <!-- 导出对话框 -->
    <ExportDialog
        :visible="exportDialogVisible"
        :is-exporting="importExport.isExporting.value"
        :translations="translationStore.translations"
        :current-language="translationStore.currentLanguage"
        :on-export-json="handleExportJson"
        :on-export-zip="handleExportZip"
        :on-export-dictionary="handleExportDictionary"
        :onUpdate:visible="(val) => exportDialogVisible = val"
    />
  </div>
</template>

<style scoped>
.translation-view {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.translation-content {
  margin-bottom: 20px;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
}
</style>