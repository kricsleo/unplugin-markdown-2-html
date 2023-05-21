/// <reference types="vitest" />

import path from 'node:path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'
import unpluginMarkdown2Html from '../src/vite'

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
    },
  },
  plugins: [
    Vue(),
    // https://github.com/antfu/unocss => unocss.config.ts
    Unocss(),
    unpluginMarkdown2Html({ 
      highlight: { theme: {
        default: 'light-plus',
        news: 'kricsleo.gentle-clean.Gentle Clean Monokai',
        dark: 'hc_light',
      }}
    })
  ],

  // https://github.com/vitest-dev/vitest
  test: {
    environment: 'jsdom',
  },
})
