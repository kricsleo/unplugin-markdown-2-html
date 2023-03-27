<h1 align="center">
  unplugin-markdown-2-html
</h1>

<h2 align="center">
 ✨ Transform markdown into html at build time.
</h2>

[![NPM version](https://img.shields.io/npm/v/unplugin-markdown-2-html?color=a1b858&label=)](https://www.npmjs.com/package/unplugin-markdown-2-html)

## Features

- 🪜 Support Vite, Rollup, Webpack, esbuild, and more - powered by [`unplugin`](https://github.com/unjs/unplugin)
- 🚀 0-runtime when used as a plugin, transform markdown at build time - powered by [markdown-it](https://github.com/markdown-it/markdown-it)
- 🍺 Support compile markdown content at runtime when used as a runtime for browser and nodejs
- 🎃 Rich and customizable built-in rules of transforming markdown files
  - Built-in code highlight - powered by [`highlight.js`](https://github.com/highlightjs/highlight.js/)
  - Built-in support for table-of-contents
  - Built-in support for YAML front matter
  - Built-in support for anchors of heading

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


## Usage

### Use It as a Plugin

`hello.md` for example
<pre>
---
title: Hello Makrdown
likes: 100
---

# h1 

```ts
export interface Person {
  name: string
}
```

# h2

Paragraph goes here.
</pre>

✨ Directly import from the markdown file
```ts
import { html, toc, meta, markdown } from 'hello.md'

console.log(html, toc, meta, markdown)

// html content 👇
// <h1 id="h1" tabindex="-1"><a class="header-anchor" href="#h1">#</a> h1</h1>
// <pre><code class="language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">interface</span> <span class="hljs-title class_">Person</span> {
//   <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>
// }
// </code></pre>
// <h1 id="h2" tabindex="-1"><a class="header-anchor" href="#h2">#</a> h2</h1>
// <p>Paragraph goes here.</p>

// toc contet 👇
// <nav class="table-of-contents"><ul><li><a href="#h1">h1</a></li><li><a href="#h2">h2</a></li></ul></nav>

// meta content 👇
// {
//  "title": "Hello Makrdown",
//  "likes": 100
// }

// markdown content 👇
// ---
// title: Hello Makrdown
// likes: 100
// ---
// 
// # h1 
// 
// ```ts
// export interface Person {
//   name: string
// }
// ```
// 
// # h2
// 
// Paragraph goes here.
```

### Use It as Runtime

```ts
import { createMarkdownRender } from 'unplugin-markdown-2-html'

// or `createMarkdownRender(options: Options)`
const render = createMarkdownRender()
const { html, toc, meta, markdown } = render(`# Markdown content`)
console.log(html, toc, meta, markdown)
```

### Options

| Prop     | Type   | Required | Default | Description                                                                                                                       |
|----------|--------|----------|---------|-----------------------------------------------------------------------------------------------------------------------------------|
| markdown | object | ❎        | -       | How markdown content is parsed. See [MarkdownItOptions](https://github.com/markdown-it/markdown-it#init-with-presets-and-options) |
| toc      | object | ❎        | -       | How table-of-contents is parsed. See [TocOptions](https://github.com/nagaozen/markdown-it-toc-done-right#options)                 |
| anchor   | object | ❎        | -       | How anchors of heading is parsed. See [AnchorOptions](https://github.com/valeriangalliat/markdown-it-anchor#usage)                |

### Typescript Support

💪🏻 Want ts-hint when importing markdown files? Just add `unplugin-markdown-2-html/markdown` to `tsconfig.json`

```json
{
 "compilerOptions": {
    "types": [ "unplugin-markdown-2-html/markdown" ],
  },
}
```

## License

[MIT](./LICENSE) License © 2023 [Kricsleo](https://github.com/kricsleo)