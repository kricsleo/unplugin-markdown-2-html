import { HighlighTheme, RemoteVSCodeThemeId, ShikiTheme, ShikiThemeMap, StyleToken } from '../types';
import fetch from 'node-fetch'
import stream from 'stream'
import unzipper from 'unzipper'
import fs from 'fs-extra'
import { getHighlighter, Theme, BUNDLED_THEMES, BUNDLED_LANGUAGES } from 'shiki'
import * as shiki from 'shiki'
import path from 'path'
import json5 from 'json5'
import crypto from 'crypto'
import { ThemeToken } from '../types';

const explanationIdMap = new Map<string, string>()
export async function createShikiHighlighter(options?: {
  langs?: (shiki.ILanguageRegistration | shiki.Lang)[]
  theme?: HighlighTheme
}) {
  const langs = options?.langs || BUNDLED_LANGUAGES
  const themeMap: ShikiThemeMap = options?.theme
    ? typeof options?.theme === 'string'
      ? {default: options.theme}
      : options.theme
    : { default: 'vitesse-dark' }
  
  const builtinThemes = Object.values(themeMap).filter(theme => isBuiltinTheme(theme)) as Theme[]
  const remoteThemes = Object.entries(themeMap).filter(([_themeAlias, theme]) => !isBuiltinTheme(theme)) as [string, RemoteVSCodeThemeId][]
  const highlighter = await getHighlighter({ langs, themes: builtinThemes })
  if(remoteThemes.length) {
    await Promise.all(remoteThemes.map(async ([themeAlias, theme]) => {
      const themeJSON = await downloadVSCodeTheme(theme)
      themeJSON.name = themeAlias
      await highlighter.loadTheme(themeJSON)
    }))
  }

  function highlight(code: string, lang?: string) {
    if(!lang) {
      return { html: code, themeTokens: [] as ThemeToken[] }
    }
    const themeTokens = Object.entries(themeMap).map(([themeAlias, theme]) => ({
      themeAlias,
      theme,
      ...highlightWithTheme(code, lang, isBuiltinTheme(theme) ? theme : themeAlias)
    }))
    const html = themeTokens[0].html
    return { html, themeTokens }
  }

  function highlightWithTheme(code: string, lang?: string, theme?: Theme | string) {
    const styleTokens: StyleToken[] = []
    let html = ''
    const lineTokens = highlighter
      .codeToThemedTokens(code, lang, theme, { includeExplanation: true })
      .filter(lineToken => lineToken.length)
    lineTokens.forEach(lineToken => {
      html += '<span class="line">'
      lineToken.forEach(token => {
        token.explanation!
          .forEach(explanation => {
            const explanationId = getExplanationId(explanation)
            const className = 'sk-' + explanationId
            html += `<span class="${className}">${escapeHTMLContent(explanation.content)}</span>`
            const style = getTokenStyle(token)
            styleTokens.push({className, style })
          })
      })
      html += '</span>\n'
    })
    return { html, styleTokens }
  }

  function getTokenStyle(token: shiki.IThemedToken) {
    const style = [
      ['color', token.color],
      ['font-weight', token.fontStyle === shiki.FontStyle.Bold ? 'bold' : null],
      ['font-style', token.fontStyle === shiki.FontStyle.Italic ? 'italic' : null],
      ['text-decoration', token.fontStyle === shiki.FontStyle.Underline ? 'underline' : null],
    ]
      .filter(t => t[1])
      .map(t => t.join(':') + ';')
      .join('')
    return style
  }

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

  return highlight
}

function escapeHTMLContent(text: string) {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export class ShikiHighlighter {
  private static explanationIdMap = new Map()
  private highlighter: shiki.Highlighter | undefined

  private static getExplanationId(explanation: {scopes: Array<{scopeName: string}>}) {
    const scopesName = explanation.scopes.map(scope => scope.scopeName).join('|')
    if(ShikiHighlighter.explanationIdMap.has(scopesName)) {
      return ShikiHighlighter.explanationIdMap.get(scopesName)
    }
    const explanationId = 'sk-' + ShikiHighlighter.digest(scopesName)
    ShikiHighlighter.explanationIdMap.set(scopesName, explanationId)
    return explanationId
  }

  private static digest(text: string) {
    return crypto.createHash('shake256', { outputLength: 3}).update(text).digest('hex')
  }

  async highlight(code: string, lang: shiki.Lang, theme: HighlighTheme) {
    const themes = typeof theme === 'string' 
      ? { default: theme}
      : theme
    if(!this.highlighter) {
      this.highlighter = await shiki.getHighlighter({ langs: [lang] })
    }

    if(!this.highlighter.getLoadedLanguages().includes(lang)) {
      if(isBuiltinLang(lang)) {
        await this.highlighter.loadLanguage(lang)
      } else {
        console.warn(`No language registration for \`${lang}\`, skipped highlight`)
        return code
      }
    }

    // todo: validate theme name loaded from <pubid.extid>
    const notLoadedThemes = Array.from(new Set(Object.values(themes)))
      .filter(t => !this.highlighter!.getLoadedThemes().includes(t as unknown as shiki.Theme))
    if(notLoadedThemes.length) {
      await Promise.all(notLoadedThemes.map(async t => {
        if(isBuiltinTheme(t)) {
          this.highlighter!.loadTheme(t)
        } else {
          try {
            const themeJSON = await downloadVSCodeTheme(t)
            await this.highlighter!.loadTheme(themeJSON)
          } catch(e) {
            Object.entries(themes).forEach(([alias, themeName]) => {
              if(themeName === t) {
                delete themes[alias]
              }
            })
            console.warn(`Load theme \`${t}\` failed, skipped this theme.`, e)
          }
        }
      }))
    }
    const avaliableThemes = Array.from(new Set(Object.values(themes)))
    const renderResults = avaliableThemes.map(themeName => ({theme: themeName, rendered: this.render(code, lang, themeName)}))
    const html = renderResults[0]
    const styleTokens = Object.entries(themes).map(([themeAlias, themeName]) => {
      const themeResult = renderResults.find(result => result.theme === themeName)
      const styleToken = {
        theme: themeName,
        themeAlias,
        tokens: themeResult?.rendered.spanTokens
      }
      return styleToken;
    })
    return { html, styleTokens }
  }

  render(code: string, lang: shiki.Lang, theme: ShikiTheme) {
    const spanTokens: StyleToken[] = []
    let html = ''
    const lineTokens = this.highlighter!.codeToThemedTokens(code, lang, theme, { includeExplanation: true })
    lineTokens.forEach(lineToken => {
      html += '<span class="line">'
      lineToken.forEach(token => {
        token.explanation!
          .forEach(explanation => {
            const explanationId = ShikiHighlighter.getExplanationId(explanation)
            html += `<span class="${explanationId}">${explanation.content}</span>`
            const style = this.getTokenStyle(token)
            spanTokens.push({className: 'sk-' + explanationId, style })
          })
      })
      html += '</span>\n'
    })
    return { html, spanTokens }
  }

  getTokenStyle(token: shiki.IThemedToken) {
    const style = [
      ['color', token.color],
      ['font-weight', token.fontStyle === shiki.FontStyle.Bold ? 'bold' : null],
      ['font-style', token.fontStyle === shiki.FontStyle.Italic ? 'italic' : null],
      ['text-decoration', token.fontStyle === shiki.FontStyle.Underline ? 'underline' : null],
    ]
      .filter(t => t[1])
      .map(t => t.join(':') + ';')
      .join('')
    return style
  }
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

interface VSCodeThemePkgJSON {
  contributes: {
    themes?: Array<{
      label: string
      uiTheme: string
      path: string
    }>
  }
}
