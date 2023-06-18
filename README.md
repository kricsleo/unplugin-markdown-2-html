<h1 align="center">
  unplugin-markdown-2-html
</h1>

<p align="center">
<a href="https://www.npmjs.com/package/unplugin-markdown-2-html">
  <img src="https://img.shields.io/npm/v/unplugin-markdown-2-html?style=flat&colorA=18181B&colorB=F0DB4F" />
</a>

<a href="https://www.npmjs.com/package/unplugin-markdown-2-html">
  <img src="https://img.shields.io/npm/types/unplugin-markdown-2-html?style=flat&colorA=18181B&colorB=F0DB4F" />
</a>

<a href="https://github.com/kricsleo/unplugin-markdown-2-html/blob/master/LICENSE">
  <img src="https://img.shields.io/github/license/kricsleo/unplugin-markdown-2-html.svg?style=flat&colorA=18181B&colorB=F0DB4F" />
</a>
</p>

<h3 align="center">
 ✨ Render markdown into HTML at build time.
</h3>

<p align="center">
  <a href="https://stackblitz.com/edit/vitejs-vite-rce25h">
    <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" />
  </a>
</p>

<br >

## Features

- 🪜 Support Vite, Rollup, Webpack, esbuild, and more - powered by [`unplugin`](https://github.com/unjs/unplugin)
- 🚀 0-runtime
- 🎃 Rich and customizable built-in rules for rendering markdown
  - Built-in code highlight - powered by [Shiki](https://github.com/shikijs/shiki)
  - Built-in support for table-of-contents - tagged with `[TOC]`
  - Built-in support for YAML front matter - tagged with `---`
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

/* `html` 👇 */

// <h1 id="h1" tabindex="-1"><a class="header-anchor" href="#h1">#</a> h1</h1>
// <pre class="shiki Gentle Clean Monokai" style="background-color: #303841" tabindex="0"><code><span class="line"><span style="color: #E7D38F">export</span><span style="color: #66B395"> </span><span style="color: #E7D38F">interface</span><span style="color: #66B395"> </span><span style="color: #FFAFCCE3">Person</span><span style="color: #66B395"> </span><span style="color: #BFC5D0DD">{</span></span>
// <span class="line"><span style="color: #66B395">  </span><span style="color: #62C4C4">name</span><span style="color: #A6ACB9B8">:</span><span style="color: #66B395"> </span><span style="color: #62C4C4">string</span></span>
// <span class="line"><span style="color: #BFC5D0DD">}</span></span>
// <span class="line"></span></code></pre>
// <h1 id="h2" tabindex="-1"><a class="header-anchor" href="#h2">#</a> h2</h1>
// <p>Paragraph goes here.</p>


/* `toc` 👇 */

// <nav class="table-of-contents"><ul><li><a href="#h1">h1</a></li><li><a href="#h2">h2</a></li></ul></nav>


/* `meta` 👇 */

// {
//  "title": "Hello Makrdown",
//  "likes": 100
// }


/* `markdown`(same with raw file content) 👇 */

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
| markdown | object | ❎        | `{ html: true }`      | How markdown is rendered. See [MarkdownItOptions](https://github.com/markdown-it/markdown-it#init-with-presets-and-options) |
| toc      | object | ❎        | `{ listType: 'ul' }`       | How table-of-contents is rendered. See [TocOptions](https://github.com/nagaozen/markdown-it-toc-done-right#options)                 |
| anchor   | object | ❎        | -       | How anchors of heading is rendered. See [AnchorOptions](https://github.com/valeriangalliat/markdown-it-anchor#usage)                |
| highlight   | object | ❎        | `{ theme: 'vitesse-dark' }`       |  How code block is highlighted. See [Highlight Code](#highlight-code)             |


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

#### Themes for Code Highlighting(Shiki)

Use the built-in themes of Shiki, or **any theme** you like in the VS Code theme market.

- [Built-in themes](https://github.com/shikijs/shiki/blob/main/docs/themes.md): `'css-variables' | 'dark-plus' | 'dracula-soft' | 'dracula' | 'github-dark-dimmed' | 'github-dark' | 'github-light' | 'hc_light' | 'light-plus' | 'material-theme-darker' | 'material-theme-lighter' | 'material-theme-ocean' | 'material-theme-palenight' | 'material-theme' | 'min-dark' | 'min-light' | 'monokai' | 'nord' | 'one-dark-pro' | 'poimandres' | 'rose-pine-dawn' | 'rose-pine-moon' | 'rose-pine' | 'slack-dark' | 'slack-ochin' | 'solarized-dark' | 'solarized-light' | 'vitesse-dark' | 'vitesse-light'`

- Themes from VS Code Market: `<publisher>.<extId>.<themeName>`.

For example: The [Gentle Clean](https://marketplace.visualstudio.com/items?itemName=kricsleo.gentle-clean) theme provides two sets of theme options: `Gentle Clean Vitesse` and `Gentle Clean Monokai`.

So for option `Gentle Clean Vitesse`, the theme configuration would be `kricsleo.gentle-clean.Gentle Clean Vitesse`. For option `Gentle Clean Monokai`, the theme configuration would be `kricsleo.gentle-clean.Gentle Clean Monokai`. Remote themes are downloaded automaticly.

<img alt="The '<publisher>.<extId>'" src="./screenshots/marketplace.png" width="400px" />

## License

[MIT](./LICENSE) License © 2023 [Kricsleo](https://github.com/kricsleo)