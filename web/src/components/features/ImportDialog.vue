<template>
  <el-dialog
    :title="t('import.title')"
    v-model="dialogVisible"
    width="50%"
    class="import-dialog"
  >
    <div class="import-dialog__content">
      <el-tabs v-model="activeTab" class="import-dialog__tabs">
        <!-- 文本导入 -->
        <el-tab-pane :label="t('import.textImport')" name="text">
          <div class="import-dialog__form">
            <el-form label-position="top">
              <el-form-item :label="t('import.format')">
                <el-radio-group v-model="importFormat">
                  <el-radio label="json">JSON</el-radio>
                  <el-radio label="plainText">{{ t('import.plainText') }}</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item :label="t('import.content')">
                <el-input
                  v-model="importText"
                  type="textarea"
                  :rows="10"
                  :placeholder="getFormatPlaceholder()"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <!-- 文件导入 -->
        <el-tab-pane :label="t('import.fileImport')" name="file">
          <div class="import-dialog__upload">
            <el-upload
              class="import-dialog__upload-area"
              drag
              action=""
              :auto-upload="false"
              :on-change="handleFileChange"
              :limit="1"
            >
              <el-icon class="import-dialog__upload-icon"><upload-filled /></el-icon>
              <div class="import-dialog__upload-text">
                {{ t('import.dragFile') }}
              </div>
              <div class="import-dialog__upload-hint">
                {{ t('import.supportFormats') }}
              </div>
            </el-upload>
          </div>
        </el-tab-pane>
        
        <!-- 在线导入 -->
        <el-tab-pane :label="t('import.onlineImport')" name="online">
          <div class="import-dialog__form">
            <el-form label-position="top">
              <el-form-item :label="t('import.url')">
                <el-input 
                  v-model="importUrl" 
                  :placeholder="t('import.urlPlaceholder')"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <!-- 导入进度 -->
      <div v-if="isImporting" class="import-dialog__progress">
        <el-progress 
          :percentage="importProgress" 
          :format="progressFormat"
          :stroke-width="10"
        />
      </div>
    </div>
    
    <template #footer>
      <div class="import-dialog__footer">
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button 
          type="primary" 
          @click="handleImport" 
          :loading="isImporting"
          :disabled="!canImport"
        >
          {{ t('import.import') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {ElMessage, type UploadFile} from 'element-plus';
import {UploadFilled} from '@element-plus/icons-vue';
import {useI18n} from 'vue-i18n';

// 使用i18n
const { t } = useI18n();

interface IProps {
  visible: boolean;
  isImporting: boolean;
  importProgress: number;
  handleImportFile: (file: File) => void;
  onImportText: (text: string, format: "json" | "plainText") => void;
  onImportUrl: (url: string) => void;
  'onUpdate:visible': (val: boolean) => void;
}

const props = withDefaults(defineProps<IProps>(), {
  visible: false,
  isImporting: false,
  importProgress: 0
});

// 对话框显示状态
const dialogVisible = computed<boolean>({
  get: () => props.visible,
  set: (val: boolean) => {
    if (props['onUpdate:visible']) {
      props['onUpdate:visible'](val);
    }
  }
});

// 导入方式选项
const activeTab= ref<'text' | 'file' | 'online'>('text');
const importFormat = ref<'json' | 'plainText'>('json');
const importText = ref<string>('');
const importUrl = ref<string>('');
const selectedFile = ref<File | null>(null);

// 是否可导入
const canImport = computed<boolean>(() => {
  if (activeTab.value === 'text') {
    return importText.value.trim() !== '';
  } else if (activeTab.value === 'file') {
    return selectedFile.value !== null;
  } else if (activeTab.value === 'online') {
    return importUrl.value.trim() !== '';
  }
  return false;
});

// 获取格式提示占位符
const getFormatPlaceholder = (): string => {
  return importFormat.value === 'json'
    ? JSON.stringify({"hello": "你好","world": "世界"})
    : 'hello\nworld';
};


// 处理文件变化
const handleFileChange = (file: UploadFile): void => {
  if (file) {
    selectedFile.value = file.raw as File;
  } else {
    selectedFile.value = null;
  }
};

// 处理导入逻辑
const handleImport = (): void => {
  if (props.isImporting) return;

  if (activeTab.value === 'text') {
    props.onImportText(importText.value, importFormat.value);
  } else if (activeTab.value === 'file' && selectedFile.value) {
    ElMessage.info(`正在导入文件: ${selectedFile.value.name}`);
    props.handleImportFile(selectedFile.value);
  } else if (activeTab.value === 'online') {
    props.onImportUrl(importUrl.value);
  } else {
    ElMessage.warning(t('import.noContent'));
  }
};

// 格式化进度显示
const progressFormat = (percentage: number) => {
  return `${percentage}%`;
};
</script>

<style lang="scss" scoped>
.import-dialog {
  &__content {
    padding: 0 16px;
  }
  
  &__tabs {
    margin-bottom: 16px;
  }
  
  &__form {
    padding: 16px 0;
  }
  
  &__upload {
    padding: 16px 0;
    
    &-area {
      width: 100%;
    }
    
    &-icon {
      font-size: 48px;
      color: var(--el-color-primary);
      margin-bottom: 16px;
    }
    
    &-text {
      font-size: 16px;
      color: var(--el-text-color-primary);
      margin-bottom: 8px;
    }
    
    &-hint {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
  
  &__progress {
    margin-top: 24px;
  }
  
  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .import-dialog {
    &__content {
      padding: 0 8px;
    }
  }
}
</style>