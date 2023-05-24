<script setup lang="ts">
import { toggleDark } from './composables/dark';
import { html, css, markdown } from './index.md'
import { html as html2, css as css2 } from './index2.md'
import '@kricsleo/markdown-themes/dist/prose.css'
// import 'unplugin-markdown-2-html.css'
import { createMarkdownRender } from '../../src/renderer'
import { onMounted, ref } from 'vue';

const htmlLocal = ref('')
const cssLocal = ref('')

onMounted(async () => {
  const render = await createMarkdownRender({
    highlight: {
      // theme: {
      //   default: 'ddiu8081.moegi-theme.Moegi Black',
      //   dark: 'kricsleo.gentle-clean.Gentle Clean Vitesse',
      // },
      // langs: ['ts', 'diff', 'html']
    }
  })
  const result = render(markdown)
  htmlLocal.value = result.html
  cssLocal.value = result.css
})
</script>

<template>
  <main class="prose px-50">
    <div text-center>
      <button text-30px cursor-pointer i-carbon:sun dark:i-carbon:moon @click="toggleDark()" />
    </div>
    <div v-html="html" />
    <component is="style" v-html="css" />

    <h2>Local</h2>

    <div v-html="htmlLocal" />
    <component is="style" v-html="cssLocal" />

    <!-- <div v-html="html2" />
    <component is="style" v-html="css2" /> -->
  </main>
</template>