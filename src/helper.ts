import MakrdownIt from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import markdownItAttrs from 'markdown-it-attrs'
import markdownItToc, { TocOptions } from 'markdown-it-toc-done-right'
import markdownItMetaYaml, { Options as MarkdownItMetaYamlOptions} from 'markdown-it-meta-yaml'
import { Options } from './types'
import { createHighlighter } from './highlighter'

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
  const highlighter = await createHighlighter(options?.highlight)
  const markdownIt = new MakrdownIt({ 
    html: true,
    highlight: highlighter,
    ...options?.markdown
  })
  let toc: string
  let meta: Record<string, unknown>
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
    const html = markdownIt.render(markdown)
    return { markdown, html, toc, meta }
  }
}

