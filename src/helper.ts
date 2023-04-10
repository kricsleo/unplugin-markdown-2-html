import MakrdownIt from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import markdownItAttrs from 'markdown-it-attrs'
import markdownItToc, { TocOptions } from 'markdown-it-toc-done-right'
import markdownItMetaYaml, { Options as MarkdownItMetaYamlOptions} from 'markdown-it-meta-yaml'
import { Markdown, Options } from './types'
import MarkdownItHljs from 'markdown-it-highlightjs'
import { HighlightOptions } from 'markdown-it-highlightjs/types/core'

import prismjs from 'prismjs'
// import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
// import 'prismjs/components/prism-html'
// import 'prismjs/components/prism-css'

import { getHighlighter, BUNDLED_LANGUAGES, BUNDLED_THEMES, Lang } from 'shiki'
import { createShikiHighlighter } from './shiki'

export const pkgName = 'unplugin-markdown-2-html'

export async function createMarkdownTransformer(options?: Options) {
  const render = await createMarkdownRender(options)
  return (markdown: string) => {
    const { html, toc, meta } = render(markdown)
    const content = 
    `
export const markdown = ${JSON.stringify(markdown)}
export const html = ${JSON.stringify(html)}
export const toc = ${JSON.stringify(toc)}
export const meta = ${JSON.stringify(meta)}
    `.trim()
    return content
  }
}

export async function createMarkdownRender(options?: Options) {
  let toc: string
  let meta: Record<string, unknown>
  const markdownIt = new MakrdownIt({ 
    html: true,
    ...options?.markdown
  })
  // todo: support shiki
  if(!options?.highlight || options.highlight.highlightjs) {
    markdownIt.use(MarkdownItHljs, options?.highlight?.highlightjs)
  } else if (options?.highlight?.prismjs) {
    markdownIt.set({ highlight: prismjsHighlight })
  } else if (options?.highlight?.shiki) {
    const shikiHighlight = await createShikiHighlighter()
    // @ts-expect-error
    markdownIt.set({ highlight: shikiHighlight })
  }
  markdownIt
  .use(markdownItAttrs)
  .use(markdownItToc, {
    listType: 'ul',
    callback: tocStr => toc = tocStr,
    ...options?.toc
  } as Partial<TocOptions>)
  .use(markdownItAnchor, {
    // if support headings from html,
    // https://github.com/valeriangalliat/markdown-it-anchor#parsing-headings-from-html-blocks
    permalink: markdownItAnchor.permalink.linkInsideHeader({
      placement: 'before'
    }),
    ...options?.anchor
  } as markdownItAnchor.AnchorOptions)
  .use(markdownItMetaYaml, {
    cb: metaJSON => meta = metaJSON
  } as MarkdownItMetaYamlOptions)
  const markdownRender = (markdown: string) => {
    const html = markdownIt.render(markdown)
    return { markdown, html, toc, meta }
  }
  return markdownRender
}

/**
 * prismjs
 * todo auto load minimum languages
 */
function prismjsHighlight(code: string, language?: string) {
  if(!language) {
    return code
  }
  // if(!prismjs.languages[language]) {
  //   loadLanguages(language)
  // }
  const html = prismjs.highlight(code, prismjs.languages[language], language)
  return html
}
