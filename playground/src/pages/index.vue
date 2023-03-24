<script setup lang="ts">
import { html, toc } from './index.md'
import '@kricsleo/markdown-themes/dist/prose.css'
</script>

<template>
  <main class="prose">
    <pre class="!whitespace-normal" border-2 rounded p-10>
      {{ toc }}
    </pre>
    <pre class="!whitespace-normal" border-2 rounded p-10>
      {{ html }}
    </pre>
    <div v-html="html" />
  </main>
</template>
