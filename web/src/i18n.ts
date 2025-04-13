import { createI18n } from 'vue-i18n'
import zhMessages from './locales/zh.json'
import enMessages from './locales/en.json'

// 创建i18n实例
const i18n = createI18n({
  legacy: false, // 使用组合式API
  locale: 'zh', // 默认语言
  fallbackLocale: 'en', // 回退语言
  messages: {
    zh: zhMessages,
    en: enMessages
  },
  silentTranslationWarn: true,
  silentFallbackWarn: true
})

export default i18n