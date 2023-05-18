import MakrdownIt from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import markdownItAttrs from 'markdown-it-attrs'
import markdownItToc, { TocOptions } from 'markdown-it-toc-done-right'
import markdownItMetaYaml, { Options as MarkdownItMetaYamlOptions} from 'markdown-it-meta-yaml'
import { Options, ThemeToken } from './types'
import { createHighlighter } from './highlighter'

export const pkgName = 'unplugin-markdown-2-html'

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
  const themeTokens: ThemeToken[][] = []
  let toc: string
  let meta: Record<string, unknown>
  const markdownIt = new MakrdownIt({ 
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
    const html = markdownIt.render(markdown)
    const mergedThemeTokens = mergeThemeTokens(themeTokens)
    const css = generateCSS(mergedThemeTokens)
    return { markdown, html, toc, meta, themeTokens, css }
  }

  function highlight (code: string, lang: string) {
    const highlighted = highlighter(code, lang)
    themeTokens.push(highlighted.themeTokens)
    return highlighted.html
  }

  function mergeThemeTokens(themeTokens: ThemeToken[][]) {
    const merged = themeTokens.flat().reduce((all, cur) => {
      if(!all[cur.themeAlias]) {
        all[cur.themeAlias] = cur
      } else {
        const tokenSet = new Set(all[cur.themeAlias].styleTokens.concat(cur.styleTokens))
        all[cur.themeAlias].styleTokens = Array.from(tokenSet)
      }
      return all
    }, {} as Record<string, ThemeToken>)
    return merged
  }

  function generateCSS(themeTokenMap: Record<string, ThemeToken>) {
    return Object.values(themeTokenMap).map(themeToken => {
      return themeToken.styleTokens
        .map(styleToken => themeToken.themeAlias === 'default'
          ? `.${styleToken.className}{${styleToken.style}}`
          : `.${themeToken.themeAlias} .${styleToken.className}{${styleToken.style}}`)
        .join('')
    }).join('')
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

