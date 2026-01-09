export default defineAppConfig({
  limsLayer: {
    name: 'Hello from Nuxt layer'
  },
  enumLookups: {}
})

declare module '@nuxt/schema' {
  interface AppConfigInput {
    limsLayer?: {
      /** Project name */
      name?: string
    }
  }
}
