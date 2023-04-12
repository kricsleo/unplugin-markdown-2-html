<h1 align="center">
  unplugin-markdown-2-html
</h1>

<h2 align="center">
 ✨ Render markdown into HTML at build time.
</h2>

[![NPM version](https://img.shields.io/npm/v/unplugin-markdown-2-html?color=a1b858&label=)](https://www.npmjs.com/package/unplugin-markdown-2-html)

## Features

- 🪜 Support Vite, Rollup, Webpack, esbuild, and more - powered by [`unplugin`](https://github.com/unjs/unplugin)
- 🚀 0-runtime
- 🎃 Rich and customizable built-in rules for rendering markdown
  - Built-in code highlight 
    - [Shiki](https://github.com/shikijs/shiki) - **The most beautiful**
    - [PrismJS](https://github.com/PrismJS/prism)
    - [highlightjs](https://github.com/highlightjs/highlight.js/)
  - Built-in support for table-of-contents: `[TOC]`
  - Built-in support for YAML front matter: `---`
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
import { html, toc, meta, markdown } from './hello.md'

console.log(html, toc, meta, markdown)

// html content 👇
// <h1 id="h1" tabindex="-1"><a class="header-anchor" href="#h1">#</a> h1</h1>
// <pre class="shiki Gentle Clean Monokai" style="background-color: #303841" tabindex="0"><code><span class="line"><span style="color: #E7D38F">export</span><span style="color: #66B395"> </span><span style="color: #E7D38F">interface</span><span style="color: #66B395"> </span><span style="color: #FFAFCCE3">Person</span><span style="color: #66B395"> </span><span style="color: #BFC5D0DD">{</span></span>
// <span class="line"><span style="color: #66B395">  </span><span style="color: #62C4C4">name</span><span style="color: #A6ACB9B8">:</span><span style="color: #66B395"> </span><span style="color: #62C4C4">string</span></span>
// <span class="line"><span style="color: #BFC5D0DD">}</span></span>
// <span class="line"></span></code></pre>
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

### Options

| Prop     | Type   | Required | Default | Description                                                                                                                       |
|----------|--------|----------|---------|-----------------------------------------------------------------------------------------------------------------------------------|
| markdown | object | ❌        | `{ html: true }`      | How markdown is rendered. See [MarkdownItOptions](https://github.com/markdown-it/markdown-it#init-with-presets-and-options) |
| toc      | object | ❌        | `{ listType: 'ul' }`       | How table-of-contents is rendered. See [TocOptions](https://github.com/nagaozen/markdown-it-toc-done-right#options)                 |
| anchor   | object | ❌        | -       | How anchors of heading is rendered. See [AnchorOptions](https://github.com/valeriangalliat/markdown-it-anchor#usage)                |
| highlight   | object | ❌        | `{ shiki: { theme: 'vitesse-dark' } }`       |  How code block is highlighted. See [Highlight Code](#highlight-code)             |


### Typescript Support

💪🏻 Want ts-hint when importing markdown files? Add `unplugin-markdown-2-html/markdown` to `tsconfig.json` would make world peace :)

```json
{
 "compilerOptions": {
    "types": [ "unplugin-markdown-2-html/markdown" ],
  },
}
```

### Highlight Code

#### Shiki vs PrismJS vs highlightjs

| Highlighter     |  Beauty   | Styling | 
|----------|--------|----------|
| Shiki | ⭐⭐⭐⭐⭐ | Inlined style, no more code theme style file. |
| PrismJS | ⭐⭐⭐ | Import the code theme style file yourself. |
| highlightjs | ⭐⭐ | Import the code theme style file yourself. |

As the most visually appealing recommendation, Shiki can make your code block styles look exactly the same as what you see in VS Code. It uses the same lexical parsing tool as VS Code and can generate the finest-grained colors. In comparison, the lexical granularity of PrismJS and highlightjs is much coarser, so the color effects are also relatively rough.

#### Shiki Theme

Use the built-in themes of Shiki, or any theme you like in the VS Code theme market.

- [Built-in themes](https://github.com/shikijs/shiki/blob/main/docs/themes.md): `'css-variables' | 'dark-plus' | 'dracula-soft' | 'dracula' | 'github-dark-dimmed' | 'github-dark' | 'github-light' | 'hc_light' | 'light-plus' | 'material-theme-darker' | 'material-theme-lighter' | 'material-theme-ocean' | 'material-theme-palenight' | 'material-theme' | 'min-dark' | 'min-light' | 'monokai' | 'nord' | 'one-dark-pro' | 'poimandres' | 'rose-pine-dawn' | 'rose-pine-moon' | 'rose-pine' | 'slack-dark' | 'slack-ochin' | 'solarized-dark' | 'solarized-light' | 'vitesse-dark' | 'vitesse-light'`

- Themes from VS Code Market: `<publisher>.<extId>.<themeName>`.

For example: The [Gentle Clean](https://marketplace.visualstudio.com/items?itemName=kricsleo.gentle-clean) theme provides two sets of theme options: `Gentle Clean Vitesse` and `Gentle Clean Monokai`.

So for option `Gentle Clean Vitesse`, the theme configuration would be `kricsleo.gentle-clean.Gentle Clean Vitesse`. For option `Gentle Clean Monokai`, the theme configuration would be `kricsleo.gentle-clean.Gentle Clean Monokai`. Remote themes are downloaded automaticly.

<img alt="The '<publisher>.<extId>'" src="./screenshots/marketplace.png" width="400px" />

## License

[MIT](./LICENSE) License © 2023 [Kricsleo](https://github.com/kricsleo)