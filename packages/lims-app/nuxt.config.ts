// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  extends: ['../lims-layer'],
  // vite-specific configurations need to be defined in each layer's configuration file, not just in extended layers
  vite: {
    optimizeDeps: {
      include: [
        'uuid',
        'lodash', // CJS
        'moment',
        'papaparse', // CJS
        '@vueuse/core',
        'xlsx',
        'd3',
        '@primevue/forms',
        '@primevue/forms/resolvers/zod',
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
