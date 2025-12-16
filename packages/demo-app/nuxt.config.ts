// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: [
    'base-layer',
  ],
  devtools: { enabled: false },
  components: [
    {
      path: '@/components',
      pathPrefix: false,
    },
  ],
})
