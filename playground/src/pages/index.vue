<script setup lang="ts">
import { html } from './index.md'
</script>

<template>
  <main>
    <pre overflow-auto border-2 rounded p-10>
      {{ html }}
    </pre>
    <div v-html="html" />
  </main>
</template>
