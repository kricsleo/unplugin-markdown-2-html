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
            html += `<span class="${className}">${escapeHTML(explanation.content)}</span>`
            const style = getTokenStyle(token)
            styleTokens.push({className, style })
          })
      })
      html += '</span>\n'
    })
    return { html, styleTokens }
  }

  function getTokenStyle(token: shiki.IThemedToken) {
    const style: Record<string, string | undefined> = {
      color: token.color,
      'font-weight': token.fontStyle === shiki.FontStyle.Bold ? 'bold' : undefined,
      'font-style': token.fontStyle === shiki.FontStyle.Italic ? 'italic' : undefined,
      'text-decoration': token.fontStyle === shiki.FontStyle.Underline ? 'underline' : undefined
    }
    Object.keys(style).forEach(attr => !style[attr] && (delete style[attr]))
    return Object.keys(style).length ? style : undefined
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

interface VSCodeThemePkgJSON {
  contributes: {
    themes?: Array<{
      label: string
      uiTheme: string
      path: string
    }>
  }
}
