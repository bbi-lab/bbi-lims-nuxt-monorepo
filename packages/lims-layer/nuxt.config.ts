// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: [
    '../base-layer',
  ],
  modules: ['nuxt-auth-utils'],
  runtimeConfig: {
    public: {
      appName: 'LIMS layer', // can be overridden by NUXT_PUBLIC_APP_NAME environment variable
    },
  },
})
