<script setup lang="ts">
import { html, css } from './index.md'
import { html as html2, css as css2 } from './index2.md'
import '@kricsleo/markdown-themes/dist/prose.css'
// import 'unplugin-markdown-2-html.css'

console.log(html)
</script>

<template>
  <main class="prose px-50">
    <div v-html="html" />
    <div v-html="html2" />
    <component is="style" v-html="css" />
    <component is="style" v-html="css2" />
  </main>
</template>