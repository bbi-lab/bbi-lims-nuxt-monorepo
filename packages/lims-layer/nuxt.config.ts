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
        '@primevue/core/api',
        '@primevue/forms',
        '@primevue/forms/resolvers/zod',
        '@vueuse/core',
        'd3',
        'drizzle-orm/pg-core',
        'drizzle-orm',
        'drizzle-orm/sql',
        'drizzle-orm/zod',
        'lodash', // CJS
        'papaparse', // CJS
        'uuid',
        'xlsx',
        'zod',
      ]
    }
  }
})
