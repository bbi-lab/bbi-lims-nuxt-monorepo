import Aura from '@primeuix/themes/aura'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  $meta: {
    name: 'my-layer',
  },
  devtools: { enabled: false },
  modules: [
    '@nuxt/eslint',
    '@primevue/nuxt-module'
  ],
  css: ['@/assets/tailwind.css', '@/assets/styles.scss'],
  primevue: {
      options: {
          theme: {
              preset: Aura,
              options: {
                  darkModeSelector: '.app-dark'
              }
          }
      }
  },
})
