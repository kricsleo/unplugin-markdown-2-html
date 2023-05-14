import { RemoteVSCodeThemeId } from '../types';
import fetch from 'node-fetch'
import stream from 'stream'
import unzipper from 'unzipper'
import fs from 'fs-extra'
import { getHighlighter, Theme, BUNDLED_THEMES, BUNDLED_LANGUAGES } from 'shiki'
import * as shiki from 'shiki'
import path from 'path'
import json5 from 'json5'
import { inspect } from 'node:util'
import crypto from 'crypto'

export async function createShikiHighlighter(theme: Theme | RemoteVSCodeThemeId) {
  const highlighter = await getHighlighter({ langs: BUNDLED_LANGUAGES })
  if(isBuiltinTheme(theme)) {
    await highlighter.loadTheme(theme)
  } else {
    const themeJSON = await downloadVSCodeTheme(theme)
    await highlighter.loadTheme(themeJSON)
  }
  const themeName = isBuiltinTheme(theme) ? theme : theme.split('.')[2]
  return (code: string, language?: string) => {
    if(!language) {
      return code
    }
    const html = highlighter.codeToHtml(code, { lang: language, theme: themeName })
    return html
  }
}

export async function customRender(
  code: string, 
  lang: string, 
  theme: Theme = 'vitesse-dark'
) {
  const highlighter = await shiki.getHighlighter({ langs: BUNDLED_LANGUAGES, themes: BUNDLED_THEMES })
  const lineTokens = highlighter.codeToThemedTokens(code, lang, theme, { includeExplanation: true })

  let css = ''
  let html = ''
  lineTokens.forEach(lineToken => {
    html += '<span class="line">'
    lineToken.forEach(token => {
      token.explanation!
        .forEach(explanation => {
          const explanationId = getExplanationId(explanation)
          html += `<span class="${explanationId}">${explanation.content}</span>`
          const style = [
            ['color:', token.color],
            ['font-weight:', token.fontStyle === shiki.FontStyle.Bold ? 'bold' : null],
            ['font-style:', token.fontStyle === shiki.FontStyle.Italic ? 'italic' : null],
            ['text-decoration:', token.fontStyle === shiki.FontStyle.Underline ? 'underline' : null],
          ].filter(t => t[1])
            .map(t => t.join(''))
            .join(';')
          css += `.${explanationId}{${style}}`
        })
    })
    html += '</span>\n'
  })
  return { html, css }
}

const explanationIdMap = new Map()
export function getExplanationId(explanation: {scopes: Array<{scopeName: string}>}) {
  const scopesName = explanation.scopes.map(scope => scope.scopeName).join('|')
  if(explanationIdMap.has(scopesName)) {
    return explanationIdMap.get(scopesName)
  }
  const explanationId = 'sk-' + digest(scopesName)
  explanationIdMap.set(scopesName, explanationId)
  return explanationId
}

function digest(text: string) {
  return crypto.createHash('shake256', { outputLength: 3}).update(text).digest('hex')
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

interface VSCodeThemePkgJSON {
  contributes: {
    themes?: Array<{
      label: string
      uiTheme: string
      path: string
    }>
  }
}
