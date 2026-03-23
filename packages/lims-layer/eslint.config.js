import withNuxt from './.playground/.nuxt/eslint.config.mjs'

export default withNuxt({
    rules: {
        // Turn off the attribute hyphenation rule globally for your project
        'vue/attribute-hyphenation': 'off'
        // Turn off the v-on event hyphenation rule globally for your project
        'vue/v-on-event-hyphenation': 'off'
    }
})
