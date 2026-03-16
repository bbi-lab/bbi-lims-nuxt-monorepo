// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: [
    '../base-layer',
  ],
  modules: ['nuxt-auth-utils', '@nuxt/icon'],
  vite: {
    optimizeDeps: {
      include: [
        'uuid',
        'lodash',
        'moment',
        'papaparse',
        '@vueuse/core',
        'xlsx',
      ]
    }
  }
})
