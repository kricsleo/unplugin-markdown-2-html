<script setup lang="ts">
import { html } from './index.md'
import { html as html2 } from './index2.md'
import '@kricsleo/markdown-themes/dist/prose.css'
import 'unplugin-markdown-2-html.css'

console.log(html)
</script>

<template>
  <main class="prose px-50">
    <div v-html="html" />
    <div v-html="html2" />
  </main>
</template>