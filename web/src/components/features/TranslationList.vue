<template>
  <div class="translation-list">
    <div class="translation-list__search-bar">
      <el-input
        v-model="searchQuery"
        :placeholder="t('translation.searchPlaceholder')"
        clearable
        :prefix-icon="Search"
        @input="filterTranslations"
        class="translation-list__search-input"
      />
      <el-select 
        v-model="filterStatus" 
        @change="filterTranslations" 
        :placeholder="t('translation.filterStatus')"
        class="translation-list__filter-select"
      >
        <el-option :label="t('translation.filterAll')" value="all" />
        <el-option :label="t('translation.filterTranslated')" value="translated" />
        <el-option :label="t('translation.filterUntranslated')" value="untranslated" />
      </el-select>
      <el-button 
        type="danger" 
        @click="confirmResetAll"
        class="translation-list__action-btn"
      >{{ t('common.resetAll') }}</el-button>
    </div>
    
    <el-table
      :data="paginatedData"
      style="width: 100%"
      border
      max-height="390"
      v-loading="loading"
      stripe
      highlight-current-row
      class="translation-list__table enhanced-card"
    >
      <el-table-column :label="t('translation.original')" min-width="200">
        <template #default="{row}">
          <div class="translation-list__cell">
            <div>{{ row.key }}</div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column :label="t('translation.translated')" min-width="200">
        <template #default="{row}">
          <editable-cell
            v-model="row.value"
            :placeholder="t('translation.untranslated')"
            type="textarea"
            :rows="2"
            @save="handleTranslationUpdate(row)"
            class="translation-list__editable-cell"
            :class="{'translation-list__missing-translation': !row.value}"
          />
        </template>
      </el-table-column>
      
      <el-table-column :label="t('translation.actions')" width="280" fixed="right">
        <template #default="{row}">
          <div class="translation-list__actions">
            <el-button 
              size="small" 
              type="warning" 
              @click="handleReset(row)"
              class="translation-list__action-btn"
            >{{ t('common.reset') }}</el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="handleAutoTranslate(row)"
              class="translation-list__action-btn"
            >{{ t('common.autoTranslate') }}</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="confirmDelete(row)"
              :icon="Delete"
              circle
              class="translation-list__action-btn"
            />
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="translation-list__pagination">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="totalItems"
        :page-size="pageSize"
        @current-change="handlePageChange"
        class="fade-in"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { Search, Delete } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import EditableCell from '../common/EditableCell.vue';
import { useTranslationStore, type Translation } from '../../stores/translationStore';

// 使用i18n
const { t } = useI18n();


interface ITranslationListProps {
  translations: Translation[];
  loading: boolean;
  onUpdateTranslation: (translation: Translation) => void;
  onDeleteTranslation: (translation: Translation) => void;
}

const props = defineProps<ITranslationListProps>()

const translationStore = useTranslationStore();


// 搜索和筛选状态
const searchQuery = ref<string>('');
const filterStatus = ref<'all' | 'translated' | 'untranslated'>('all');


// 分页状态
const currentPage = ref<number>(1);
const pageSize = ref<number>(20);
const filteredTranslations = ref<Translation[]>([]);

// 计算属性
const totalItems = computed<number>(() => filteredTranslations.value.length);

const paginatedData = computed<Translation[]>(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredTranslations.value.slice(start, end);
});

// 过滤翻译
const filterTranslations = () => {
  let filtered = [...props.translations];
  
  // 应用搜索条件
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(item => 
      item.key.toLowerCase().includes(query) || 
      (item.value && item.value.toLowerCase().includes(query))
    );
  }
  
  // 应用筛选状态
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(item => 
      filterStatus.value === 'translated' ? item.value : !item.value
    );
  }
  
  filteredTranslations.value = filtered;
  currentPage.value = 1; // 重置到第一页
};

// 处理翻译更新
const handleTranslationUpdate = (row: Translation) => {
  props.onUpdateTranslation({...row});
};

// 确认删除
const handleReset = (item: Translation) => {
  translationStore.resetTranslation(item.key);
  ElMessage.success(t('common.resetSuccess'));
};

// 确认全局重置
const confirmResetAll = () => {
  ElMessageBox.confirm(
    t('translation.resetAllConfirm'),
    t('common.warning'),
    {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    }
  ).then(() => {
    translationStore.resetAllTranslations();
  }).catch(() => {});
};

const handleAutoTranslate = async (item: Translation) => {
  try {
    await translationStore.autoTranslate(item.key);
    ElMessage.success(t('common.translateSuccess'));
  } catch (error) {
    ElMessage.error(t('common.translateError'));
  }
};

const confirmDelete = (row: Translation) => {
  ElMessageBox.confirm(
    t('translation.deleteConfirm'),
    t('common.warning'),
    {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    }
  ).then(() => {
    props.onDeleteTranslation(row);
    ElMessage.success(t('common.deleteSuccess'));
  }).catch(() => {});
};

// 处理页码变化
const handlePageChange = (page: number) => {
  currentPage.value = page;
};

// 监听翻译数据变化，重新过滤
watch(() => props.translations, () => {
  filterTranslations();
}, { deep: true, immediate: true });
</script>

<style lang="scss" scoped>
.translation-list {
  width: 100%;
  
  &__search-bar {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }
  
  &__search-input {
    flex: 1;
  }
  
  &__filter-select {
    width: 160px;
  }
  
  &__table {
    margin-bottom: 16px;
  }
  
  &__cell {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  &__source-text {
    color: var(--el-text-color-secondary);
    font-size: 0.9em;
  }
  
  &__editable-cell {
    width: 100%;
  }
  
  &__actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  
  
  &__pagination {
    display: flex;
    justify-content: center;
    margin-top: 16px;
  }
  
  &__missing-translation {
    border: 1px dashed var(--el-color-danger);
    background-color: rgba(var(--el-color-danger-rgb), 0.05);
    border-radius: var(--el-border-radius-base);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .translation-list {
    &__search-bar {
      flex-direction: column;
      gap: 8px;
    }
    
    &__filter-select {
      width: 100%;
    }
  }
}
</style>