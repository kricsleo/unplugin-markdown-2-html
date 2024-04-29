export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: [
    '@unocss/nuxt',
    ['unplugin-markdown-2-html/nuxt', {
      highlight: {
        theme: 'kricsleo.gentle-clean.Gentle Clean Dark'
      },
    }]
  ],
})
