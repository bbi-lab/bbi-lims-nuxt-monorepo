// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  extends: ['../lims-layer'],
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
        'lodash', // CJS
        'moment',
        'papaparse', // CJS
        'uuid',
        'xlsx',
        'zod',
      ]
    }
  },
  runtimeConfig: {
    dbHost: 'localhost',
    dbPort: 5432,
    dbDatabaseName: '',
    dbUsername: '',
    dbPassword: '',
    dbSsl: false,
    authJwtAccessTokenExpiresIn: '5m',
    authJwtRefreshTokenExpiresIn: '60m',
    authJwtAccessTokenSecret: 'access-token-secret-base64',
    authJwtRefreshTokenSecret: 'refresh-token-secret-base64',
    public: {
      appName: 'LIMS app',
      apiBase: '/api',
    }
  },
})
