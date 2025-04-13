/**
 * 工具函数和自定义指令集合
 * 此文件用于集中导出所有工具函数和自定义指令
 */

import type { App } from 'vue'
import { useClipboard } from '@vueuse/core'

// 复制到剪贴板指令
const vCopy = {
  mounted(el: HTMLElement, binding: any) {
    el.dataset.copyValue = binding.value
    el.addEventListener('click', handleCopy)
  },
  updated(el: HTMLElement, binding: any) {
    el.dataset.copyValue = binding.value
  },
  unmounted(el: HTMLElement) {
    el.removeEventListener('click', handleCopy)
  }
}

// 复制处理函数
function handleCopy(event: Event) {
  const target = event.currentTarget as HTMLElement
  const value = target.dataset.copyValue
  
  if (value) {
    const { copy } = useClipboard()
    copy(value)
  }
}

/**
 * 格式化日期
 * @param date 日期对象或时间戳
 * @param format 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | number | string, format = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = new Date(date)
  
  const formatMap: Record<string, number | string> = {
    'YYYY': d.getFullYear(),
    'MM': String(d.getMonth() + 1).padStart(2, '0'),
    'DD': String(d.getDate()).padStart(2, '0'),
    'HH': String(d.getHours()).padStart(2, '0'),
    'mm': String(d.getMinutes()).padStart(2, '0'),
    'ss': String(d.getSeconds()).padStart(2, '0')
  }
  
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => formatMap[match] as string)
}

/**
 * 防抖函数
 * @param fn 需要防抖的函数
 * @param delay 延迟时间，默认300ms
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay = 300): (...args: Parameters<T>) => void {
  let timer: number | null = null
  
  return function(this: any, ...args: Parameters<T>): void {
    if (timer) clearTimeout(timer)
    
    timer = window.setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/**
 * 注册全局工具和指令
 * @param app Vue应用实例
 */
export function registerGlobalUtils(app: App): void {
  // 注册自定义指令
  app.directive('copy', vCopy)
  
  // 可以在这里注册更多全局工具和指令
}

export default {
  install(app: App) {
    registerGlobalUtils(app)
  }
}