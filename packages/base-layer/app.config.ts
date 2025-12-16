export default defineAppConfig({
  baseLayer: {
    name: 'Hello from Nuxt layer'
  }
})

declare module '@nuxt/schema' {
  interface AppConfigInput {
    baseLayer?: {
      /** Project name */
      name?: string
    }
  }
}
