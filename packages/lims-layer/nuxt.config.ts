// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: [
    '../base-layer',
  ],
  modules: ['nuxt-auth-utils', '@nuxt/icon'],
  runtimeConfig: {
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    smtpFrom: 'noreply@bbi-lab.org',
    public: {
      appUrl: 'http://localhost:3000',
    },
  },
  // vite-specific configurations need to be defined in each layer's configuration file, not just in extended layers
  vite: {
    optimizeDeps: {
      include: [
        '@primevue/core/api',
        '@primevue/forms',
        '@primevue/forms/resolvers/zod',
        '@vueuse/core',
        'd3',
        'drizzle-zod',
        'drizzle-orm/pg-core',
        'drizzle-orm',
        'drizzle-orm/sql',
        'lodash', // CJS
        'moment',
        'papaparse', // CJS
        'uuid',
        'xlsx',
        'zod',
      ]
    }
  }
})
