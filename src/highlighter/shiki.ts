import { HighlighTheme, HighlighThemes, HighlightThemeLine, HighlightThemeSpan, HighlightThemeSpanStyle, HighlightThemeToken, HighlightTokenStyle, RemoteVSCodeThemeId, ShikiTheme, ShikiThemeLine, ShikiThemeMap, StyleToken } from '../types';
import fetch from 'node-fetch'
import stream from 'stream'
import unzipper from 'unzipper'
import fs from 'fs-extra'
import { getHighlighter, Theme, BUNDLED_THEMES, BUNDLED_LANGUAGES } from 'shiki'
import * as shiki from 'shiki'
import path from 'path'
import json5 from 'json5'
import crypto from 'crypto'
import { escapeHtml } from 'markdown-it/lib/common/utils';

export async function createShikiHighlighter(options?: {
  langs?: (shiki.ILanguageRegistration | shiki.Lang)[]
  theme?: HighlighTheme
}) {
  const langs = options?.langs || BUNDLED_LANGUAGES
  const themes = resolveTheme(options?.theme)
  
  const builtinThemes = Object.values(themes).filter(theme => isBuiltinTheme(theme)) as Theme[]
  const remoteThemes = Object.entries(themes).filter(([_themeAlias, theme]) => !isBuiltinTheme(theme)) as [string, RemoteVSCodeThemeId][]
  const highlighter = await getHighlighter({ langs, themes: builtinThemes })
  if(remoteThemes.length) {
    await Promise.all(remoteThemes.map(async ([themeAlias, theme]) => {
      const themeJSON = await downloadVSCodeTheme(theme)
      themeJSON.name = themeAlias
      await highlighter.loadTheme(themeJSON)
    }))
  }

  function highlight(code: string, lang?: shiki.Lang) {
    const lines = toLines(code, lang)
    const css = toCSS(lines)
    const html = toHtml(lines)
    return { html, css, lines }
  }

  function toLines(code: string, lang?: shiki.Lang): HighlightThemeSpan[][] {
    if(!lang) {
      return codeToPlainTokens(code)
    }
    if(!highlighter.getLoadedLanguages().includes(lang as shiki.Lang)) {
      console.warn(`No language registration for \`lang\`, skipping highlight.`)
      return codeToPlainTokens(code)
    }
    const themeTokens = Object.entries(themes).map(([themeAlias, theme]) => {
      const lines: HighlightThemeSpan[][] = highlightToThemeTokens(
        highlighter, 
        code, 
        lang, 
        isBuiltinTheme(theme) ? theme : themeAlias
      ).map(line => line.map(span => ({
        content: span.content,
        style: {
          [themeAlias]: {
            color: span.color,
            fontStyle: span.fontStyle
          },
        }
      })))
      return { theme, themeAlias, lines }
    })

    const mergedLines: HighlightThemeSpan[][] = []
    for (const line in themeTokens[0].lines) {
      mergedLines[line] = themeTokens.reduce((acc, themeToken) => {
        return mergeLines({
          themeAlias: themeTokens[0].themeAlias,
          spans: acc
        }, {
          themeAlias: themeToken.themeAlias,
          spans: themeToken.lines[line]
        })
      }, themeTokens[0].lines[line])
    }
    return mergedLines
  }


  // function highlightWithTheme(code: string, lang?: string, theme?: Theme | string) {
  //   const styleTokens: StyleToken[] = []
  //   let html = ''
  //   const lineTokens = highlighter
  //     .codeToThemedTokens(code, lang, theme, { includeExplanation: true })
  //     .filter(lineToken => lineToken.length)
  //   lineTokens.forEach(lineToken => {
  //     html += '<span class="line">'
  //     lineToken.forEach(token => {
  //       token.explanation!
  //         .forEach(explanation => {
  //           const explanationId = getExplanationId(explanation)
  //           const className = 'sk-' + explanationId
  //           html += `<span class="${className}">${escapeHTML(explanation.content)}</span>`
  //           const style = getTokenStyle(token)
  //           styleTokens.push({className, style })
  //         })
  //     })
  //     html += '</span>\n'
  //   })
  //   return { html, styleTokens }
  // }


  return highlight
}

function toHtml(lines: HighlightThemeSpan[][]) {
  const html = lines.map(line => 
    '<span class="line">' +
    line.map(span => {
      const { className } = getSpanCSS(span)
      return `<span class="${className}">${escapeHtml(span.content)}</span>`
    }).join('') +
    '\n</span>'
  ).join('')
  return html
}

export function toCSS(lines: HighlightThemeSpan[][]) {
  return unique(lines.flat().map(span => getSpanCSS(span).css))
    .join('')
}

function getSpanCSS(span: HighlightThemeSpan) {
  if(!span.style) {
    return { className: '', css: ''}
  }
  const styleOptions = Object.values(span.style)
  const hasColor = styleOptions.some(token => token.color)
  const hasBold = styleOptions.some(isBold)
  const hasItalic = styleOptions.some(isItalic)
  const hasUnderline = styleOptions.some(isUnderline)
  const themeStyles = Object.entries(span.style).map(([themeAlias, styleOption]) => {
    const style = [
      ['color', styleOption.color || (hasColor ? 'inherit' : '')], 
      ['font-weight', isBold(styleOption) ? 'bold' : hasBold ? 'inherit' : '' ], 
      ['font-style', isItalic(styleOption) ? 'italic' : hasItalic ? 'inherit' : '' ], 
      ['text-decoration', isUnderline(styleOption) ? 'bold' : hasUnderline ? 'inherit' : '' ],
    ]
      .filter(kv => kv[1])
      .map(kv => kv.join(':') + ';')
      .join('')
    return { themeAlias, style }
  })
  const className = 'sk-' + digest(JSON.stringify(themeStyles))
  const css = themeStyles.map(themeStyle => themeStyle.themeAlias === 'default'
    ? `.${className}{${themeStyle.style}}`
    : `.${themeStyle.themeAlias} .${className}{${themeStyle.style}}`
  ).join('')
  return { className, css }
}



function highlightToThemeTokens(
  highlighter: shiki.Highlighter, 
  code: string, 
  lang?: string, 
  theme?: string
): shiki.IThemedToken[][] {
  if(!lang) {
    return codeToPlainTokens(code)
  }
  if(!highlighter.getLoadedLanguages().includes(lang as shiki.Lang)) {
    console.warn(`No language registration for \`lang\`, skipping highlight.`)
    return codeToPlainTokens(code)
  }
  // isBuiltinTheme(theme) ? theme : themeAlias,
  const lines = highlighter.codeToThemedTokens(
    code, 
    lang,
    theme,
    { includeExplanation: false }
  )
  return lines
}

function mergeLines(line1: HighlightThemeLine, line2: HighlightThemeLine) {
  const mergedSpans: HighlightThemeSpan[] = []
  const right = {
    themeAlias: line1.themeAlias,
    spans: line1.spans.slice()
  }
  const left = {
    themeAlias: line2.themeAlias,
    spans: line2.spans.slice()
  }
  let index = 0
  while (index < right.spans.length) {
    const rightToken = right.spans[index]
    const leftToken = left.spans[index]

    if (rightToken.content === leftToken.content) {
      mergedSpans.push({
        content: rightToken.content,
        style: {
          ...right.spans[index].style,
          ...left.spans[index].style,
        }
      })
      index += 1
      continue
    }

    if (rightToken.content.startsWith(leftToken.content)) {
      const nextRightToken = {
        ...rightToken,
        content: rightToken.content.slice(leftToken.content.length)
      }
      rightToken.content = leftToken.content
      right.spans.splice(index + 1, 0, nextRightToken)
      continue
    }

    if (leftToken.content.startsWith(rightToken.content)) {
      const nextLeftToken = {
        ...leftToken,
        content: leftToken.content.slice(rightToken.content.length)
      }
      leftToken.content = rightToken.content
      left.spans.splice(index + 1, 0, nextLeftToken)
      continue
    }
    throw new Error('Unexpected token')
  }
  return mergedSpans
}


// function getSpanStyle(token: shiki.IThemedToken) {
//   const style: Record<string, string | undefined> = {
//     color: token.color,
//     'font-weight': token.fontStyle === shiki.FontStyle.Bold ? 'bold' : undefined,
//     'font-style': token.fontStyle === shiki.FontStyle.Italic ? 'italic' : undefined,
//     'text-decoration': token.fontStyle === shiki.FontStyle.Underline ? 'underline' : undefined
//   }
//   Object.keys(style).forEach(attr => !style[attr] && (delete style[attr]))
//   return Object.keys(style).length ? style : undefined
// }

function codeToPlainTokens(code: string) {
  const lines = code.split(/\r\n|\r|\n/);
  return lines.map(line => [{ content: line }]);
}

function resolveTheme(theme?: HighlighTheme): HighlighThemes {
  const themes: HighlighThemes = theme
    ? typeof theme === 'string'
      ? {default: theme}
      : theme
    : { default: 'vitesse-dark' }
  return themes
}

const explanationIdMap = new Map<string, string>()
function getExplanationId(explanation: {scopes: Array<{scopeName: string}>}) {
  const scopesName = explanation.scopes.map(scope => scope.scopeName).join('|')
  if(explanationIdMap.has(scopesName)) {
    return explanationIdMap.get(scopesName)
  }
  const explanationId = digest(scopesName)
  explanationIdMap.set(scopesName, explanationId)
  return explanationId
}

function digest(text: string) {
  return crypto.createHash('shake256', { outputLength: 3}).update(text).digest('hex')
}

function escapeHTML(text: string) {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Download theme from VS Code market.
 * [publisher].[extension].[ThmeName]
 * .Eg. 'kricsleo.gentle-clen.Gentle Clean Vitesse'
 */
async function downloadVSCodeTheme(remoteVSCodeThemeId: RemoteVSCodeThemeId) {
  const [publisher, extId, theme] = remoteVSCodeThemeId.split('.')
  const extensionId = publisher + '.' + extId
  const tmpPath = `./node_modules/.tmp/${extensionId}`
  const isThemeExist = await fs.pathExists(tmpPath)

  if(!isThemeExist) {
    const themeLink = 
      `https://${publisher}.gallery.vsassets.io` +
      `/_apis/public/gallery/publisher/${publisher}` +
      `/extension/${extId}/latest` +
      `/assetbyname/Microsoft.VisualStudio.Services.VSIXPackage`
    const res = await fetch(themeLink)
    if(!res.ok) {
      throw new Error(`Download \`${extensionId}\` failed: ${res.statusText}`)
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const bufferStream = new stream.Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);
    await new Promise((rs, rj) => {
      bufferStream.pipe(unzipper.Extract({ path: tmpPath }))
      .on('close', rs)
      .on('error', rj)
    })
  }
  
  const pkgJSON: VSCodeThemePkgJSON = await fs.readJson(`${tmpPath}/extension/package.json`)
  const themeConfig = (pkgJSON.contributes.themes || []).find(
    t => t.label.toLowerCase() === theme.toLowerCase()
  )
  if(!themeConfig) {
    const avaliableThemes = (pkgJSON.contributes.themes || [])
      .map(t => `\`${t.label}\``)
      .join(' | ')
    throw new Error(`Not found theme \`${theme}\`, but found ${avaliableThemes}`)
  }
  const themePath = path.resolve(tmpPath, 'extension', themeConfig.path)
  const content = await fs.readFile(themePath, { encoding: 'utf-8' })
  const themeJSON = json5.parse(content)
  return themeJSON
}

function isBuiltinTheme(theme: Theme | RemoteVSCodeThemeId): theme is Theme {
  return BUNDLED_THEMES.includes(theme as Theme)
}

function isBuiltinLang(lang: shiki.Lang): lang is shiki.Lang {
  return shiki.BUNDLED_LANGUAGES.some(langRegistration => langRegistration.id === lang)
}

function isBold(style: HighlightTokenStyle) {
  return style.fontStyle === shiki.FontStyle.Bold
}

function isItalic(style: HighlightTokenStyle) {
  return style.fontStyle === shiki.FontStyle.Italic
}

function isUnderline(style: HighlightTokenStyle) {
  return style.fontStyle === shiki.FontStyle.Underline
}

function unique(list: unknown[]) {
  return Array.from(new Set(list))
}

interface VSCodeThemePkgJSON {
  contributes: {
    themes?: Array<{
      label: string
      uiTheme: string
      path: string
    }>
  }
}
