// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: [
    '../base-layer',
  ],
  modules: ['nuxt-auth-utils', '@nuxt/icon'],
  // vite-specific configurations need to be defined in each layer's configuration file, not just in extended layers
  vite: {
    optimizeDeps: {
      include: [
        'uuid',
        'lodash',
        'moment',
        'papaparse',
        '@vueuse/core',
        'xlsx',
        'd3',
      ]
    }
  }
})
