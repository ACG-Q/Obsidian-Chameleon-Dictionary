<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import config from '../config/config'

// Github 仓库地址
const githubRepo = `https://${config.repository.host}/${config.repository.owner}/${config.repository.repo}`
// 问题反馈地址
const issueUrl = `${githubRepo}/issues`


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
        <div class="footer-content">
          <p>Obsidian Chameleon Dictionary © {{ new Date().getFullYear() }}</p>
          <div class="footer-links">
            <el-link :href="githubRepo" target="_blank" type="primary" class="footer-link-item">
              <el-icon class="footer-link-icon">
                <Document />
              </el-icon>
              <span>GitHub仓库</span>
            </el-link>
            <span class="divider">|</span>
            <el-link :href="issueUrl" target="_blank" type="primary" class="footer-link-item">
              <el-icon class="footer-link-icon">
                <Warning />
              </el-icon>
              <span>问题反馈</span>
            </el-link>
            <span class="divider">|</span>
            <span class="footer-link-item version-info">
              <el-icon class="footer-link-icon">
                <InfoFilled />
              </el-icon>
              <span>版本: {{ config.version }}</span>
            </span>
          </div>
        </div>
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
  height: auto;
  
  .footer-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .footer-links {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;

    .footer-link-item {
      display: inline-flex;
      align-items: center;
      font-size: 1em;
      line-height: 1;
      padding: 0 4px;

      &.version-info {
        color: var(--el-text-color-secondary);
        cursor: default;
      }
    }

    .footer-link-icon {
      font-size: 1.1em;
      margin-right: 4px;
      display: flex;
      align-items: center;
    }

    .divider {
      color: var(--el-text-color-placeholder);
      font-size: 1.1em;
      padding: 0 2px;
      user-select: none;
      line-height: 1;
      display: flex;
      align-items: center;
      height: 1.2em;
    }
  }
}
</style>