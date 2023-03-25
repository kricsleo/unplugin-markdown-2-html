<h2 align="center">
  unplugin-markdown-2-html
</h1>

<h2 align="center">
 ✨ Transform markdown into html at build time content.
</h2>

[![NPM version](https://img.shields.io/npm/v/unplugin-markdown-2-html?color=a1b858&label=)](https://www.npmjs.com/package/unplugin-markdown-2-html)

> ⚠️ WIP

## Install

```bash
npm i unplugin-markdown-2-html
```

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import UnpluginMarkdown2Html from 'unplugin-markdown-2-html/vite'

export default defineConfig({
  plugins: [
    UnpluginMarkdown2Html({ /* options */ }),
  ],
})
```

Example: [`playground/`](./playground/)

<br></details>

<details>
<summary>Rollup</summary><br>

```ts
// rollup.config.js
import UnpluginMarkdown2Html from 'unplugin-markdown-2-html/rollup'

export default {
  plugins: [
    UnpluginMarkdown2Html({ /* options */ }),
  ],
}
```

<br></details>


<details>
<summary>Webpack</summary><br>

```ts
// webpack.config.js
module.exports = {
  /* ... */
  plugins: [
    require('unplugin-markdown-2-html/webpack')({ /* options */ })
  ]
}
```

<br></details>

<details>
<summary>Nuxt</summary><br>

```ts
// nuxt.config.js
export default {
  buildModules: [
    ['unplugin-markdown-2-html/nuxt', { /* options */ }],
  ],
}
```

> This module works for both Nuxt 2 and [Nuxt Vite](https://github.com/nuxt/vite)

<br></details>

<details>
<summary>Vue CLI</summary><br>

```ts
// vue.config.js
module.exports = {
  configureWebpack: {
    plugins: [
      require('unplugin-markdown-2-html/webpack')({ /* options */ }),
    ],
  },
}
```

<br></details>

<details>
<summary>esbuild</summary><br>

```ts
// esbuild.config.js
import { build } from 'esbuild'
import UnpluginMarkdown2Html from 'unplugin-markdown-2-html/esbuild'

build({
  plugins: [UnpluginMarkdown2Html()],
})
```

<br></details>
