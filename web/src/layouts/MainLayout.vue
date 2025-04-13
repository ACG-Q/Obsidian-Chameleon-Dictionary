<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

// 可用语言
const availableLocales = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' }
]

// 切换界面语言
const changeLocale = (lang: string) => {
  locale.value = lang
}
</script>

<template>
  <div class="app-layout">
    <el-container>
      <el-header class="app-header">
        <div class="header-content">
          <h1 class="app-title">{{ t('app.title') }}</h1>
          <div class="locale-switcher">
            <el-dropdown @command="changeLocale">
              <span class="locale-dropdown-link">
                {{ availableLocales.find(l => l.code === locale)?.name }}
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item 
                    v-for="lang in availableLocales" 
                    :key="lang.code"
                    :command="lang.code"
                    :disabled="lang.code === locale"
                  >
                    {{ lang.name }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      
      <el-main class="app-main">
        <slot></slot>
      </el-main>
      
      <el-footer class="app-footer">
        <p>Obsidian Chameleon Dictionary © {{ new Date().getFullYear() }}</p>
      </el-footer>
    </el-container>
  </div>
</template>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: var(--el-color-primary);
  color: white;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  
  .header-content {
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .app-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .locale-switcher {
    .locale-dropdown-link {
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
    }
  }
}

.app-main {
  flex: 1;
  padding: 20px;
  background-color: var(--el-bg-color-page);
}

.app-footer {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  text-align: center;
  padding: 15px 0;
  font-size: 0.9rem;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>