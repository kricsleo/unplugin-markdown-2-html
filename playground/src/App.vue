<script setup lang="ts">
import { toggleDark } from './composables/dark';
import { html, css } from './index.md'
import { html as html2, css as css2 } from './index2.md'
import '@kricsleo/markdown-themes/dist/prose.css'
// import 'unplugin-markdown-2-html.css'

</script>

<template>
  <main class="prose px-50">
    <div text-center>
      <button text-30px cursor-pointer i-carbon:sun dark:i-carbon:moon @click="toggleDark()" />
    </div>
    <div v-html="html" />
    <component is="style" v-html="css" />
    <!-- <div v-html="html2" />
    <component is="style" v-html="css2" /> -->
  </main>
</template>