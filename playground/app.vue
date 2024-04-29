<script setup lang="ts">
import { css, html } from './code.md'
</script>

<template>
  <main>
    <article v-html="html" />
    <component is="style">{{ css }}</component>
  </main>
</template>

<style>
* {
  margin: 0;
  padding: 0;
}

html {
  color-scheme: dark;
}

.shiki {
  min-height: 100vh;
  width: 100vw;
}
</style>
