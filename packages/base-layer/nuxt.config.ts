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
  components: [
    {
      path: join(currentDir, './components'),
      pathPrefix: false,
    },
  ],
  css: [
    join(currentDir, './assets/tailwind.css'),
    join(currentDir, './assets/styles.scss'),
    // loaded last so its @media print rules win over the layout styles, which are not screen-only
    join(currentDir, './assets/print.css')
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
