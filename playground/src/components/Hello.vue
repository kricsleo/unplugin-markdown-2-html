<script setup lang="ts">
import { toggleDark } from '~/composables/dark'
</script>

<template>
  <div text-center>
    <button
      i-carbon-sun dark:i-carbon-moon
      text-40 hover:op-80 transition-opacity
      @click="toggleDark()" />
    <p text-20>
      You are here.
    </p>
  </div>
</template>
