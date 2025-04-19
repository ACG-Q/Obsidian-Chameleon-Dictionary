import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from "node:path"
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    process.env.NODE_ENV === 'production' ?  undefined :  vueDevTools()
  ],
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src'),
    },
  },
  // 为GitHub Pages部署添加基础路径配置
  base: process.env.NODE_ENV === 'production' ? '/Obsidian-Chameleon-Dictionary/' : '/',
})
