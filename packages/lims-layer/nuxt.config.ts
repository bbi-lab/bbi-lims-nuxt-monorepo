// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: [
    'base-layer',
  ],
  modules: ['nuxt-auth-utils'],
  // Environment variables to read. These are available on the server side only, except for those in public, which are
  // also available on the application (client) side. Each is read from a capitalized snake-case variable with the
  // prefix NUXT_, so, for instance, `authSecret` is read from `NUXT_AUTH_SECRET`. If the environment variable is not
  // set, the default value below is used.
  runtimeConfig: {
      dbHost: 'localhost',
      dbPort: 5432,
      dbDatabaseName: 'monorepo_test2',
      dbUsername: 'postgres',
      dbPassword: 'postgres',
      dbSsl: false,
      authJwtAccessTokenExpiresIn: '5m',
      authJwtRefreshTokenExpiresIn: '60m',
      authJwtAccessTokenSecret: 'access-token-secret-base64',
      authJwtRefreshTokenSecret: 'refresh-token-secret-base64',
      public: {
          appName: 'LIMS layer',
          apiBase: '/api',
      }
  },
})
