<template>
  <div class="editable-cell" :class="{ 'editable-cell--editing': isEditing }">
    <!-- 显示模式 -->
    <div 
      v-if="!isEditing" 
      class="editable-cell__display"
      :class="{ 'editable-cell__display--empty': isEmpty }"
      @click="startEdit"
    >
      <slot name="display">
        {{ isEmpty ? placeholder : modelValue }}
      </slot>
      <el-icon class="editable-cell__edit-icon" v-if="!disabled">
        <edit />
      </el-icon>
    </div>
    
    <!-- 编辑模式 -->
    <div v-else class="editable-cell__edit">
      <el-input
        v-model="inputValue"
        :type="type"
        :rows="rows"
        :placeholder="placeholder"
        @blur="saveEdit"
        @keyup.enter="saveEdit"
        @keyup.esc="cancelEdit"
        ref="inputRef"
        v-bind="$attrs"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { Edit } from '@element-plus/icons-vue';


interface EditableCellProps {
  /** 绑定的值 */
  modelValue: string | number;
  /** 占位符文本 */
  placeholder?: string;
  /** 输入框类型 */
  type?: 'text' | 'textarea';
  /** 文本域行数 */
  rows?: number;
  /** 禁用状态 */
  disabled?: boolean;
  /** 保存事件 */
  onSave?: (value: string | number) => void;
  /** 取消事件 */
  onCancel?: () => void;
  /** 更新事件 */
  'onUpdate:modelValue'?: (value: string | number) => void;
}

const props = withDefaults(defineProps<EditableCellProps>(), {
  placeholder: '',
  type: 'text',
  rows: 1,
  disabled: false
});

// 状态
const isEditing = ref(false);
const inputValue = ref<string|number>('');
const inputRef = ref<HTMLDivElement|null>(null);

// 计算属性
const isEmpty = computed(() => {
  return props.modelValue === '' || props.modelValue === null || props.modelValue === undefined;
});

// 开始编辑
const startEdit = () => {
  if (props.disabled) return;
  
  inputValue.value = props.modelValue;
  isEditing.value = true;
  
  // 自动聚焦输入框
  nextTick(() => {
    inputRef.value?.focus();
  });
};

// 保存编辑
const saveEdit = () => {
  isEditing.value = false;
  if (props['onUpdate:modelValue']) {
    props['onUpdate:modelValue'](inputValue.value);
  }
  if (props.onSave) {
    props.onSave(inputValue.value);
  }
};

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false;
  inputValue.value = props.modelValue;
  if (props.onCancel) {
    props.onCancel();
  }
};

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  if (!isEditing.value) {
    inputValue.value = newVal;
  }
});
</script>

<style lang="scss" scoped>
.editable-cell {
  position: relative;
  width: 100%;
  transition: var(--app-transition);
  
  &__display {
    padding: 8px;
    min-height: 24px;
    border-radius: var(--app-border-radius);
    cursor: pointer;
    position: relative;
    transition: var(--app-transition);
    word-break: break-word;
    
    &:hover {
      background-color: rgba(64, 158, 255, 0.1);
      
      .editable-cell__edit-icon {
        opacity: 1;
      }
    }
    
    &--empty {
      color: var(--el-text-color-placeholder);
      font-style: italic;
    }
  }
  
  &__edit-icon {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0;
    transition: var(--app-transition);
    color: var(--el-color-primary);
    font-size: 14px;
  }
  
  &__edit {
    padding: 0;
  }
  
  &--editing {
    z-index: 2;
  }
}
</style>