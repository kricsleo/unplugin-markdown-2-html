import MakrdownIt from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import markdownItAttrs from 'markdown-it-attrs'
import markdownItToc, { TocOptions } from 'markdown-it-toc-done-right'
import markdownItMetaYaml, { Options as MarkdownItMetaYamlOptions} from 'markdown-it-meta-yaml'
import { Markdown, Options } from './types'
import MarkdownItHljs from 'markdown-it-highlightjs'
import { HighlightOptions } from 'markdown-it-highlightjs/types/core'

export const pkgName = 'unplugin-markdown-2-html'

export function createMarkdownTransformer(options?: Options) {
  const render = createMarkdownRender(options)
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

export function createMarkdownRender(options?: Options): (markdown: string) => Markdown {
  let toc: string
  let meta: Record<string, unknown>
  const markdownIt = new MakrdownIt({ 
    html: true,
    ...options?.markdown
  })
  // todo: support shiki
  .use(MarkdownItHljs, options?.highlight?.highlightjs)
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
  const markdownRender = (markdown: string) => ({
    markdown,
    html: markdownIt.render(markdown),
    toc,
    meta
  })
  return markdownRender
}
