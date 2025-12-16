export default defineAppConfig({
  limsLayer: {
    name: 'Hello from Nuxt layer'
  }
})

declare module '@nuxt/schema' {
  interface AppConfigInput {
    limsLayer?: {
      /** Project name */
      name?: string
    }
  }
}
