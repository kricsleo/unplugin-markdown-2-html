import MakrdownIt from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import markdownItAttrs from 'markdown-it-attrs'
import markdownItToc, { TocOptions } from 'markdown-it-toc-done-right'
import markdownItMetaYaml, { Options as MarkdownItMetaYamlOptions} from 'markdown-it-meta-yaml'
import { Options, StyleToken, ThemeToken } from './types'
import { createHighlighter } from './highlighter'
import { FontStyle, IThemedToken } from 'shiki'
import { SpanToken } from './types'
import crypto from 'crypto'
import { escapeHtml } from 'markdown-it/lib/common/utils'

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
  const highlightStyleMap: Map<string, string> = new Map()
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
    highlightStyleMap.clear()
    const html = markdownIt.render(markdown)
    const css = [...highlightStyleMap.entries()]
      .map(([classText, style]) => `${classText}{${style}}`)
      .join('')
    return { markdown, html, toc, meta, css }
  }

  function highlight (code: string, lang: string) {
    const themeTokens = highlighter(code, lang)
    mergeThemeTokens(themeTokens)
    const { html, styleMap } = generateHTMLAndCSS(themeTokens)
    Object.entries(styleMap).forEach(([k, v]) => highlightStyleMap.set(k, v))
    return html
  }
}

function mergeThemeTokens(themeTokens: ThemeToken[]) {
  for(let themeIdx = 0; themeIdx < themeTokens.length; themeIdx++) {
    const lineCount = themeTokens[themeIdx].lineTokens.length
    for(let lineIdx = 0; lineIdx < lineCount; lineIdx++) {
      const lineToken = themeTokens[themeIdx].lineTokens[lineIdx]
      const tokenCount = lineToken.length
      for(let tokenIdx = 0; tokenIdx < tokenCount; tokenIdx++) {
        const themeAlignTokens = themeTokens.map(themeToken => themeToken.lineTokens[lineIdx][tokenIdx])
        const hasColor = themeAlignTokens.some(token => token.color)
        const hasBold = themeAlignTokens.some(isBold)
        const hasItalic = themeAlignTokens.some(isItalic)
        const hasUnderline = themeAlignTokens.some(isUnderline)
        themeAlignTokens.forEach(token => {
          token.style = [
            ['color', token.color || (hasColor ? 'inherit' : '')], 
            ['font-weight', isBold(token) ? 'bold' : hasBold ? 'inherit' : '' ], 
            ['font-style', isItalic(token) ? 'italic' : hasItalic ? 'inherit' : '' ], 
            ['text-decoration', isUnderline(token) ? 'bold' : hasUnderline ? 'inherit' : '' ],
          ]
            .filter(kv => kv[1])
            .map(kv => kv.join(':') + ';')
            .join('')
        })

        const canMergeWithPrevToken = themeAlignTokens.every((token, idx) => {
          const prevAlignToken = themeTokens[idx].lineTokens[lineIdx][tokenIdx - 1]
          return prevAlignToken && prevAlignToken.style === token.style
        })
        if(canMergeWithPrevToken) {
          const prevToken = themeTokens[themeIdx].lineTokens[lineIdx][tokenIdx - 1]
          const curToken = themeTokens[themeIdx].lineTokens[lineIdx][tokenIdx]
          const mergedToken = { 
            ...prevToken,
            content: prevToken.content + curToken.content
          }
          lineToken.splice(tokenIdx, 1, mergedToken)
        }
      }
      // const mergedLineTokens = lineToken.reduce((mergedLineToken, token) => {
      //   const lastToken = mergedLineToken[mergedLineToken.length - 1]
      //   const canMerge = lastToken?.style === token.style
      //   if(canMerge) {
      //     const mergedToken = { 
      //       ...lastToken, 
      //       content: lastToken.content + token.content 
      //     }
      //     mergedLineToken.splice(mergedLineToken.length - 1, 1, mergedToken)
      //   } else {
      //     mergedLineToken.push(token)
      //   }
      //   return mergedLineToken
      // }, [] as SpanToken[])
      // themeTokens[themeIdx].lineTokens[lineIdx] = mergedLineTokens
    }
  }
}

function generateHTMLAndCSS(themeTokens: ThemeToken[]) {
  const defaultThemeToken = themeTokens.find(themeToken => themeToken.themeAlias === 'default')!
  const styleMap: Record<string, string> = {}
  const html = themeTokens.map(themeToken =>
    themeToken.lineTokens.map((lineToken, lineIdx) => 
      '<span class="line">' +
      lineToken.map((token, tokenIdx) => {
        const tokenInDefaultTheme = defaultThemeToken.lineTokens[lineIdx][tokenIdx]
        const canOmitThemePrefix = themeToken.themeAlias === 'default' || token.style === tokenInDefaultTheme.style
        const className = 'sk-' + digest(token.style!)
        const classText = canOmitThemePrefix
          ? `.${className}`
          : `.${themeToken.themeAlias} .${className}`
        styleMap[classText] = token.style!
        return `<span class="${className}">${escapeHtml(token.content)}</span>`
      }).join('')
      + '</span>'
    ).join('\r')
  )[0]
  // const css = Object.entries(styleMap).map(([classText, style]) => `${classText}{${style}}`)
  return { html, styleMap }
}

// function mergeThemeTokens(themeTokens: ThemeToken[][]) {
//   const merged = themeTokens.flat().reduce((all, cur) => {
//     if(!all[cur.themeAlias]) {
//       all[cur.themeAlias] = cur
//     } else {
//       const tokenSet = new Set(all[cur.themeAlias].styleTokens.concat(cur.styleTokens))
//       all[cur.themeAlias].styleTokens = Array.from(tokenSet)
//     }
//     return all
//   }, {} as Record<string, ThemeToken>)
//   return merged
// }

const digestMap: Record<string, string> = {}
function digest(text: string) {
  if(digestMap[text]) {
    return digestMap[text]
  }
  digestMap[text] = crypto.createHash('shake256', { outputLength: 3}).update(text).digest('hex')
  return digestMap[text]
}

function isBold(token: IThemedToken) {
  return token.fontStyle === FontStyle.Bold
}

function isItalic(token: IThemedToken) {
  return token.fontStyle === FontStyle.Italic
}

function isUnderline(token: IThemedToken) {
  return token.fontStyle === FontStyle.Underline
}

// function generateCSS(themeTokenMap: Record<string, ThemeToken>) {
//   const themeTokens = Object.values(themeTokenMap)
//   for(let i = 0; i < themeTokens[0].styleTokens.length; i++) {
//     const matchedStyleTokens = themeTokens.map(themeToken => themeToken.styleTokens[i]);
//     const attrs: (keyof Required<StyleToken>['style'])[] = [
//       'color', 
//       'font-weight', 
//       'font-style', 
//       'text-decoration'
//     ]
//     attrs.forEach(attr => {
//       const hasAttr = matchedStyleTokens.some(styleToken => styleToken.style?.[attr])
//       matchedStyleTokens.forEach(styleToken => {
//         if(hasAttr) {
//           styleToken.style = { [attr]: 'inherit', ...styleToken.style }
//         }
//       })
//     })
//   }
//   return themeTokens.map(themeToken => {
//     return themeToken.styleTokens
//       .filter(styleToken => styleToken.style)
//       .map(styleToken => {
//         const style = Object.entries(styleToken.style!)
//           .map(([attr, value]) => attr + ':' + value)
//           .join(';')
//         return themeToken.themeAlias === 'default'
//         ? `.${styleToken.className}{${style}}`
//         : `.${themeToken.themeAlias} .${styleToken.className}{${style}}`
//       })
//       .join('')
//   }).join('')
// }