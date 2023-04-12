<script setup lang="ts">
import { html } from './index.md'
import '@kricsleo/markdown-themes/dist/prose.css'

console.log(html)
</script>

<template>
  <main class="prose px-50">
    <div v-html="html" />
  </main>
</template>