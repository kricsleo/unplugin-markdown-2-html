import { test, expect, it, describe } from 'vitest'
import { customRender, multiThemeRender } from '../src/highlighter/highlighter'
// import markdownRaw from '../playground/index.md?raw'
// import { transformMarkdown } from '../src/helper'

// test('markdown', async () => {
//   const transform = async () => transformMarkdown(markdownRaw)
//   await expect(transform()).resolves.toMatchInlineSnapshot()
// })

// /** maybe a bug from vitest */
// test('hack markdown', async() => {
//   const getText = async() => 'hack'
//   await expect(getText()).resolves.toMatchInlineSnapshot(`
//   "export const markdown = \\"[TOC]\\\\n\\\\n# h1\\\\n\\\\n# h2\\\\n\\\\n# h3\\\\n\\\\n> 🎉 blockquote\\\\n\\\\n\`\`\`ts\\\\ninterface Foo {\\\\n  bar: string\\\\n}\\\\n\`\`\`\\\\n\\\\n\`\`\`json\\\\n{\\\\n  \\\\\\"foo\\\\\\": \\\\\\"bar\\\\\\"\\\\n}\\\\n\`\`\`\\\\n\\"

//   export const html = \\"<p><div class=\\\\\\"toc\\\\\\"><ul><li><a href=\\\\\\"#h1\\\\\\">h1</a></li><li><a href=\\\\\\"#h2\\\\\\">h2</a></li><li><a href=\\\\\\"#h3\\\\\\">h3</a></li></ul></div></p>\\\\n<h1 id=\\\\\\"h1\\\\\\" tabindex=\\\\\\"-1\\\\\\">h1</h1>\\\\n<h1 id=\\\\\\"h2\\\\\\" tabindex=\\\\\\"-1\\\\\\">h2</h1>\\\\n<h1 id=\\\\\\"h3\\\\\\" tabindex=\\\\\\"-1\\\\\\">h3</h1>\\\\n<blockquote>\\\\n<p>🎉 blockquote</p>\\\\n</blockquote>\\\\n<pre class=\\\\\\"shiki vitesse-dark\\\\\\" style=\\\\\\"background-color: #121212\\\\\\" tabindex=\\\\\\"0\\\\\\"><code><span class=\\\\\\"line\\\\\\"><span style=\\\\\\"color: #CB7676\\\\\\">interface</span><span style=\\\\\\"color: #DBD7CAEE\\\\\\"> </span><span style=\\\\\\"color: #5DA9A7\\\\\\">Foo</span><span style=\\\\\\"color: #DBD7CAEE\\\\\\"> </span><span style=\\\\\\"color: #666666\\\\\\">{</span></span>\\\\n<span class=\\\\\\"line\\\\\\"><span style=\\\\\\"color: #DBD7CAEE\\\\\\">  </span><span style=\\\\\\"color: #BD976A\\\\\\">bar</span><span style=\\\\\\"color: #666666\\\\\\">: </span><span style=\\\\\\"color: #5DA9A7\\\\\\">string</span></span>\\\\n<span class=\\\\\\"line\\\\\\"><span style=\\\\\\"color: #666666\\\\\\">}</span></span>\\\\n<span class=\\\\\\"line\\\\\\"></span></code></pre>\\\\n<pre class=\\\\\\"shiki vitesse-dark\\\\\\" style=\\\\\\"background-color: #121212\\\\\\" tabindex=\\\\\\"0\\\\\\"><code><span class=\\\\\\"line\\\\\\"><span style=\\\\\\"color: #666666\\\\\\">{</span></span>\\\\n<span class=\\\\\\"line\\\\\\"><span style=\\\\\\"color: #DBD7CAEE\\\\\\">  </span><span style=\\\\\\"color: #C98A7D99\\\\\\">&quot;</span><span style=\\\\\\"color: #B8A965\\\\\\">foo</span><span style=\\\\\\"color: #C98A7D99\\\\\\">&quot;</span><span style=\\\\\\"color: #666666\\\\\\">:</span><span style=\\\\\\"color: #DBD7CAEE\\\\\\"> </span><span style=\\\\\\"color: #C98A7D99\\\\\\">&quot;</span><span style=\\\\\\"color: #C98A7D\\\\\\">bar</span><span style=\\\\\\"color: #C98A7D99\\\\\\">&quot;</span></span>\\\\n<span class=\\\\\\"line\\\\\\"><span style=\\\\\\"color: #666666\\\\\\">}</span></span>\\\\n<span class=\\\\\\"line\\\\\\"></span></code></pre>\\\\n\\"
//   "
// `)
// })

const ts = 
`
interface Foo {
  bar: string
}
interface Baz {
  qux: string
}
`
const html = 
`<div>hell0</div>`
const step = 
`
1. generate id
2. map id => color
3. generate css

theme1
:{
  --k-1: pink;
}
<span style="color:var(--k-1)">interface</span>


theme2
:{
  --k-1: yellow;
}
<span style="color:var(--k-1)">interface</span>
`
describe('shiki', () => {
  it('custom render', async () => {
    // const result = await customRender(ts, 'ts')
    // expect(result).toMatchInlineSnapshot(`
    //   "<pre class=\\"shiki \\" style=\\"background-color: #fff\\" tabindex=\\"0\\"><code><span class=\\"line\\"></span>
    //   <span class=\\"line\\">hellohellohellohellohello</span>
    //   <span class=\\"line\\">hellohellohellohello</span>
    //   <span class=\\"line\\">hello</span>
    //   <span class=\\"line\\">hellohellohellohellohello</span>
    //   <span class=\\"line\\">hellohellohellohello</span>
    //   <span class=\\"line\\">hello</span>
    //   <span class=\\"line\\"></span></code></pre>"
    // `)

    const result2 = await customRender(html, 'svelte', 'light-plus')
    expect(result2).toMatchInlineSnapshot(`
      {
        "css": ".sk-7d591c{color:#800000}.sk-78e1a5{color:#800000}.sk-002d30{color:#800000}.sk-639f50{color:#000000}.sk-df3d35{color:#800000}.sk-495900{color:#800000}.sk-ca5dda{color:#800000}",
        "html": "<span class=\\"line\\"><span class=\\"sk-7d591c\\"><</span><span class=\\"sk-78e1a5\\">div</span><span class=\\"sk-002d30\\">></span><span class=\\"sk-639f50\\">hell0</span><span class=\\"sk-df3d35\\"></</span><span class=\\"sk-495900\\">div</span><span class=\\"sk-ca5dda\\">></span></span>
      ",
      }
    `)
  })

  it('multi theme render', async () => {
    const result = await multiThemeRender(html, 'svelte', { 
      default: 'dark-plus', 
      dark: 'github-dark'
    })
    expect(result).toMatchInlineSnapshot(`
      {
        "css": ".sk-7d591c{color:#808080}.sk-78e1a5{color:#569CD6}.sk-002d30{color:#808080}.sk-639f50{color:#D4D4D4}.sk-df3d35{color:#808080}.sk-495900{color:#569CD6}.sk-ca5dda{color:#808080}.dark .sk-7d591c{color:#E1E4E8}.dark .sk-78e1a5{color:#85E89D}.dark .sk-002d30{color:#E1E4E8}.dark .sk-639f50{color:#E1E4E8}.dark .sk-df3d35{color:#E1E4E8}.dark .sk-495900{color:#85E89D}.dark .sk-ca5dda{color:#E1E4E8}",
        "html": "<span class=\\"line\\"><span class=\\"sk-7d591c\\"><</span><span class=\\"sk-78e1a5\\">div</span><span class=\\"sk-002d30\\">></span><span class=\\"sk-639f50\\">hell0</span><span class=\\"sk-df3d35\\"></</span><span class=\\"sk-495900\\">div</span><span class=\\"sk-ca5dda\\">></span></span>
      ",
      }
    `)
  })
})
