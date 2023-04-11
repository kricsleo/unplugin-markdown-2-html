import { RemoteVSCodeThemeId } from './types';
import fetch from 'node-fetch'
import stream from 'stream'
import unzipper from 'unzipper'
import fs from 'fs-extra'
import shiki, { Theme, Lang, BUNDLED_THEMES, BUNDLED_LANGUAGES } from 'shiki'
import path from 'path'

export async function createShikiHighlighter(theme: Theme | RemoteVSCodeThemeId = 'vitesse-dark') {
  const highlighter = await shiki.getHighlighter({ langs: BUNDLED_LANGUAGES })
  if(isBuiltinTheme(theme)) {
    await highlighter.loadTheme(theme)
  } else {
    const themeJSON = await downloadVSCodeTheme(theme)
    await highlighter.loadTheme(themeJSON)
  }
  const themeName = isBuiltinTheme(theme) ? theme : theme.split('.')[2]
  return (code: string, language?: Lang) => {
    if(!language) {
      return code
    }
    const html = highlighter.codeToHtml(code, { lang: language, theme: themeName })
    return html
  }
}

/**
 * Download theme from VS Code market.
 * .Eg. kricsleo.gentle-clen
 */
async function downloadVSCodeTheme(remoteVSCodeThemeId: RemoteVSCodeThemeId) {
  const [publisher, extId, theme] = remoteVSCodeThemeId.split('.')
  const extensionId = publisher + '.' + extId
  const tmpPath = `tmp/${extensionId}`
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
  const themeConfig = (pkgJSON.contributes.themes || []).find(t => t.label === theme)
  if(!themeConfig) {
    const avaliableThemes = (pkgJSON.contributes.themes || [])
      .map(t => `\`${t.label}\``)
      .join(' | ')
    throw new Error(`Not found theme \`${theme}\`, but found ${avaliableThemes}`)
  }
  const themePath = path.resolve(tmpPath, 'extension', themeConfig.path)
  const themeJSON = await fs.readJSON(themePath)
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
