import MakrdownIt from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import markdownItAttrs from 'markdown-it-attrs'
import markdownItToc, { TocOptions } from 'markdown-it-toc-done-right'
import markdownItMetaYaml, { Options as MarkdownItMetaYamlOptions} from 'markdown-it-meta-yaml'
import { Options, StyleToken, ThemeToken } from './types'
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
  const themeTokens = Object.values(themeTokenMap)
  for(let i = 0; i < themeTokens[0].styleTokens.length; i++) {
    const matchedStyleTokens = themeTokens.map(themeToken => themeToken.styleTokens[i]);
    const attrs: (keyof Required<StyleToken>['style'])[] = [
      'color', 
      'font-weight', 
      'font-style', 
      'text-decoration'
    ]
    attrs.forEach(attr => {
      const hasAttr = matchedStyleTokens.some(styleToken => styleToken.style?.[attr])
      matchedStyleTokens.forEach(styleToken => {
        if(hasAttr) {
          styleToken.style = { [attr]: 'inherit', ...styleToken.style }
        }
      })
    })
  }
  return themeTokens.map(themeToken => {
    return themeToken.styleTokens
      .filter(styleToken => styleToken.style)
      .map(styleToken => {
        const style = Object.entries(styleToken.style!)
          .map(([attr, value]) => attr + ':' + value)
          .join(';')
        return themeToken.themeAlias === 'default'
        ? `.${styleToken.className}{${style}}`
        : `.${themeToken.themeAlias} .${styleToken.className}{${style}}`
      })
      .join('')
  }).join('')
}