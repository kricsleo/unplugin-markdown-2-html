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
    const { html, toc, meta, codeStyle } = render(markdown)
    const content = 
    `
export const markdown = ${JSON.stringify(markdown)}
export const html = ${JSON.stringify(html)}
export const toc = ${JSON.stringify(toc)}
export const meta = ${JSON.stringify(meta)}
    `.trim()
    return { content, codeStyle }
  }
}

export async function createMarkdownRender(options?: Options) {
  const highlighter = await createHighlighter(options?.highlight)
  let codeStyle: string
  const highlight = (code: string, lang: string,) => {
    const highlighted =  highlighter(code, lang)
    const { css, extractedCode } = extractStyle(highlighted)
    codeStyle = css
    return extractedCode
  }
  const markdownIt = new MakrdownIt({ 
    html: true,
    highlight,
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
    return { markdown, html, toc, meta, codeStyle }
  }
}

function extractStyle(code: string) {
  // TODO: should be more accurate
  const styleReg = /(?<=style=")([^"]*)(?=")/gmi
  const styles = code.match(styleReg)
  if(!styles) {
    return { css: '', extractedCode: code }
  }
  const vars: string[] = []
  const extractedCode = code.replace(styleReg, (style, p1, offset) => {
    const kvs = style.split(';').map(kv => kv.split(':'))
    const varStyle = kvs.map(([prop, value], idx) => {
      const id = `--s-${offset}-${idx}`
      vars.push(id + ':'  + value)
      return [prop, `var(${id})`].join(':')
    }).join(';')
    return varStyle
  })
  // const varStyles = styles.map((style, idx1) => {
  //   const kvs = style.split(';').map(kv => kv.split(':'))
  //   const varStyle = kvs.map(([prop, value], idx2) => {
  //     const id = `--s-${idx1}-${idx2}`
  //     vars.push(id + ':'  + value)
  //     return [prop, `var(${id})`].join(':')
  //   }).join(';')
  //   return varStyle
  // }).join('')
  const css = ':root{' + vars.join(';') + '}'
  console.log({ extractedCode, css })
  return { css, extractedCode }
}

