<script setup lang="ts">
import { html, toc } from './index.md'
// import '@kricsleo/markdown-themes/dist/prose.css'
import '/Users/shengfeng.xu/Documents/workspace/markdown-themes/prose.css'
</script>

<template>
  <main class="prose px-50">
    <div v-html="html" />
  </main>
</template>
