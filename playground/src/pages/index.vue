<script setup lang="ts">
import * as md from './index.md'
import '@kricsleo/markdown-themes/dist/prose.css'
import { createMarkdownRender } from '../../../src/helper';

onMounted(async () => {
  const renderer = await createMarkdownRender()
  const rawMD = await import('./index.md?raw')
  const result = renderer(rawMD.default)
  console.log('result', result)
})
</script>

<template>
  <main class="prose px-50">
    <pre>
      {{ md.meta }}
    </pre>
    <div v-html="md.html" />
  </main>
</template>
