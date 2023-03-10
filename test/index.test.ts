import { test, expect, it } from 'vitest'
import markdownRaw from '../playground/index.md?raw'
import { transformMarkdown } from '../src/helper'

test('markdown', async () => {
  const transform = async () => transformMarkdown(markdownRaw)
  await expect(transform()).resolves.toMatchInlineSnapshot()
})

/** maybe a bug from vitest */
test('hack markdown', async() => {
  const getText = async() => 'hack'
  await expect(getText()).resolves.toMatchInlineSnapshot(`
  "export const markdown = \\"[TOC]\\\\n\\\\n# h1\\\\n\\\\n# h2\\\\n\\\\n# h3\\\\n\\\\n> 🎉 blockquote\\\\n\\\\n\`\`\`ts\\\\ninterface Foo {\\\\n  bar: string\\\\n}\\\\n\`\`\`\\\\n\\\\n\`\`\`json\\\\n{\\\\n  \\\\\\"foo\\\\\\": \\\\\\"bar\\\\\\"\\\\n}\\\\n\`\`\`\\\\n\\"

  export const html = \\"<p><div class=\\\\\\"toc\\\\\\"><ul><li><a href=\\\\\\"#h1\\\\\\">h1</a></li><li><a href=\\\\\\"#h2\\\\\\">h2</a></li><li><a href=\\\\\\"#h3\\\\\\">h3</a></li></ul></div></p>\\\\n<h1 id=\\\\\\"h1\\\\\\" tabindex=\\\\\\"-1\\\\\\">h1</h1>\\\\n<h1 id=\\\\\\"h2\\\\\\" tabindex=\\\\\\"-1\\\\\\">h2</h1>\\\\n<h1 id=\\\\\\"h3\\\\\\" tabindex=\\\\\\"-1\\\\\\">h3</h1>\\\\n<blockquote>\\\\n<p>🎉 blockquote</p>\\\\n</blockquote>\\\\n<pre class=\\\\\\"shiki vitesse-dark\\\\\\" style=\\\\\\"background-color: #121212\\\\\\" tabindex=\\\\\\"0\\\\\\"><code><span class=\\\\\\"line\\\\\\"><span style=\\\\\\"color: #CB7676\\\\\\">interface</span><span style=\\\\\\"color: #DBD7CAEE\\\\\\"> </span><span style=\\\\\\"color: #5DA9A7\\\\\\">Foo</span><span style=\\\\\\"color: #DBD7CAEE\\\\\\"> </span><span style=\\\\\\"color: #666666\\\\\\">{</span></span>\\\\n<span class=\\\\\\"line\\\\\\"><span style=\\\\\\"color: #DBD7CAEE\\\\\\">  </span><span style=\\\\\\"color: #BD976A\\\\\\">bar</span><span style=\\\\\\"color: #666666\\\\\\">: </span><span style=\\\\\\"color: #5DA9A7\\\\\\">string</span></span>\\\\n<span class=\\\\\\"line\\\\\\"><span style=\\\\\\"color: #666666\\\\\\">}</span></span>\\\\n<span class=\\\\\\"line\\\\\\"></span></code></pre>\\\\n<pre class=\\\\\\"shiki vitesse-dark\\\\\\" style=\\\\\\"background-color: #121212\\\\\\" tabindex=\\\\\\"0\\\\\\"><code><span class=\\\\\\"line\\\\\\"><span style=\\\\\\"color: #666666\\\\\\">{</span></span>\\\\n<span class=\\\\\\"line\\\\\\"><span style=\\\\\\"color: #DBD7CAEE\\\\\\">  </span><span style=\\\\\\"color: #C98A7D99\\\\\\">&quot;</span><span style=\\\\\\"color: #B8A965\\\\\\">foo</span><span style=\\\\\\"color: #C98A7D99\\\\\\">&quot;</span><span style=\\\\\\"color: #666666\\\\\\">:</span><span style=\\\\\\"color: #DBD7CAEE\\\\\\"> </span><span style=\\\\\\"color: #C98A7D99\\\\\\">&quot;</span><span style=\\\\\\"color: #C98A7D\\\\\\">bar</span><span style=\\\\\\"color: #C98A7D99\\\\\\">&quot;</span></span>\\\\n<span class=\\\\\\"line\\\\\\"><span style=\\\\\\"color: #666666\\\\\\">}</span></span>\\\\n<span class=\\\\\\"line\\\\\\"></span></code></pre>\\\\n\\"
  "
`)
})
