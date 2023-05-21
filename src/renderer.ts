import MarkdownIt from 'markdown-it'
import markdownItAttrs from 'markdown-it-attrs'
import markdownItAnchor from 'markdown-it-anchor'
import markdownItToc, { TocOptions } from 'markdown-it-toc-done-right'
import markdownItMetaYaml, { Options as MarkdownItMetaYamlOptions} from 'markdown-it-meta-yaml'
import { Lang } from 'shiki-es'
import { HightlightSpan, Options } from './types'
import { createHighlighter, linesToCSS } from './highlighter/highlighter'

export async function createMarkdownTransformer(options?: Options) {
  const render = await createMarkdownRender(options)
  return (markdown: string) => {
    const { html, toc, meta, css } = render(markdown)
    const content = 
    `
export const markdown = ${JSON.stringify(markdown)}
export const html = ${JSON.stringify(html)}
export const toc = ${JSON.stringify(toc)}
export const meta = ${JSON.stringify(meta)}
export const css = ${JSON.stringify(css)}
    `.trim()
    return content
  }
}


export async function createMarkdownRender(options?: Options) {
  const highlighter = await createHighlighter(options?.highlight)
  const lines: HightlightSpan[][] = []
  let toc: string
  let meta: Record<string, unknown>
  const markdownIt = new MarkdownIt({ 
    html: true,
    highlight,
    ...options?.markdown
  })
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
    
  return (markdown: string) => {
    lines.length = 0
    const html = markdownIt.render(markdown)
    const css = linesToCSS(lines)
    return { markdown, html, toc, meta, css }
  }

  function highlight(code: string, lang: string) {
    // Trim the extra `/n` at the end
    const result = highlighter(code.replace(/\n$/, ''), lang as Lang)
    lines.push(...result.lines)
    return result.html
  }
}