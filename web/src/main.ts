import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './style.css'
import './assets/styles/main.scss'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

// 导入自定义指令和工具函数
import utils from './utils/index'
import { createPinia } from 'pinia'

// 创建应用实例
const app = createApp(App)

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(ElementPlus)
app.use(utils)

// 挂载应用
app.mount('#app')
