<script setup lang="ts">
import * as md from './index.md'
import '@kricsleo/markdown-themes/dist/prose.css'

</script>

<template>
  <main class="prose px-50">
    <pre>
      {{ md.meta }}
    </pre>
    <div v-html="md.html" />
  </main>
</template>
