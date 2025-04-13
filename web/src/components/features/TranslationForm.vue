<template>
  <div class="translation-form function-card enhanced-card">
    <div class="function-card__header">
      <h3 class="function-card__title">{{ t('translation.addNew') }}</h3>
    </div>
    
    <div class="function-card__content">
      <el-form :model="newTranslation" label-width="80px">
        <el-form-item :label="t('translation.original')">
          <el-input 
            v-model="newTranslation.key" 
            type="textarea" 
            :rows="3"
            :placeholder="t('translation.originalPlaceholder')"
          />
        </el-form-item>
        
        <el-form-item :label="t('translation.translated')">
          <el-input 
            v-model="newTranslation.value" 
            type="textarea" 
            :rows="3"
            :placeholder="t('translation.translatedPlaceholder')"
          />
        </el-form-item>
        
        <el-form-item>
          <div class="translation-form__actions">
            <el-button type="primary" @click="addTranslation" :icon="Plus">
              {{ t('common.add') }}
            </el-button>
            <el-button @click="resetForm" :icon="Refresh">
              {{ t('common.reset') }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import type { Translation } from '../../stores/translationStore';

// 使用i18n
const { t } = useI18n();

const props = defineProps<{
  onAddTranslation: (translation: Translation) => void
}>();

// 新翻译表单
const newTranslation = ref<Translation>({
  key: '',
  value: ''
});

// 添加翻译
function addTranslation(): void {
  // 验证输入
  if (!newTranslation.value.key.trim()) {
    ElMessage.warning(t('translation.keyRequired'));
    return;
  }
  
  // 调用父组件传递的方法
  props.onAddTranslation({ ...newTranslation.value });
  
  // 重置表单
  resetForm();
  
  // 显示成功消息
  ElMessage.success(t('translation.addSuccess'));
}

// 重置表单
function resetForm(): void {
  newTranslation.value = {
    key: '',
    value: ''
  };
}
</script>

<style lang="scss" scoped>
.translation-form {
  padding: 20px;
  margin-bottom: 20px;
  
  &__actions {
    display: flex;
    gap: 12px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .translation-form {
    padding: 16px;
    
    &__actions {
      flex-direction: column;
      gap: 8px;
      
      .el-button {
        width: 100%;
      }
    }
  }
}
</style>