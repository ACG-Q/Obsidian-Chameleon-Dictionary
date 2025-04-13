import { createRouter, createWebHashHistory } from 'vue-router'
import TranslationView from '../views/TranslationView.vue'
import StatsView from '../views/StatsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'translation',
      component: TranslationView
    },
    {
      path: '/stats',
      name: 'stats',
      component: StatsView
    }
  ]
})

export default router