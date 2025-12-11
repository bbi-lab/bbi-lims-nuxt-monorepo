import Aura from '@primeuix/themes/aura'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  $meta: {
    name: 'base-layer',
  },
  devtools: { enabled: false },
  modules: [
    '@nuxt/eslint',
    '@primevue/nuxt-module'
  ],
  css: [
    join(currentDir, './assets/tailwind.css'),
    join(currentDir, './assets/styles.scss')
  ],
  primevue: {
      options: {
          theme: {
              preset: Aura,
              options: {
                  darkModeSelector: '.app-dark'
              }
          }
      },
  },
  postcss: {
    plugins: {
        '@tailwindcss/postcss': {},
      }
  },
})
