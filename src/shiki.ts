import { VSCodeExtensionId } from './types';
import fetch from 'node-fetch'
import stream from 'stream'
import unzipper from 'unzipper'
import fs from 'fs-extra'
import shiki, { Theme, Lang } from 'shiki'

export async function createShikiHighlighter() {
  const highlighter = await shiki.getHighlighter({})
  return async (code: string, language?: Lang, theme?: Theme | VSCodeExtensionId) => {
    if(!language) {
      return code
    }
    if(!highlighter.getLoadedLanguages().includes(language)) {
      // todo: support download theme from VS Code market
      await highlighter.loadLanguage(language)
    }
    // todo: conver and load theme from VS Code market
    // if(!highlighter.getLoadedThemes().includes(theme)) {
    //   await highlighter.loadTheme()
    // }
    const html = highlighter.codeToHtml(code, { lang: language, theme })
    return html
  }
}

/**
 * Download theme from VS Code market.
 * .Eg. kricsleo.gentle-clen
 */
async function downloadVSCodeTheme(extensionId: VSCodeExtensionId, theme: string) {
  const tmpPath = `tmp/${extensionId}`
  const isThemeExist = await fs.pathExists(tmpPath)

  if(!isThemeExist) {
    const [publisher, extId] = extensionId.split('.')
    const themeLink = 
      `https://${publisher}.gallery.vsassets.io` +
      `/_apis/public/gallery/publisher/${publisher}` +
      `/extension/${extId}/latest` +
      `/assetbyname/Microsoft.VisualStudio.Services.VSIXPackage`
    const res = await fetch(themeLink)
    if(!res.ok) {
      throw new Error(`Download \`${extensionId}\` failed: ${res.statusText}`)
    }
    const buffer = await res.arrayBuffer();
    const bufferStream = new stream.Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);
    bufferStream.pipe(unzipper.Extract({ path: tmpPath }));
  }
  
  const pkgJSON: VSCodeThemePkgJSON = await fs.readJson(`${tmpPath}/extension/package.json`)
  const themeConfig = (pkgJSON.contributes.themes || []).find(t => t.label === theme)
  if(!themeConfig) {
    const avaliableThemes = (pkgJSON.contributes.themes || [])
      .map(t => `\`${t.label}\``)
      .join(' | ')
    throw new Error(`Not found theme \`${theme}\`, but found ${avaliableThemes}`)
  }
  // const absPath = path.resolve(pkgJSONPath, themeConfig.path)
  const themeJSON = await fs.readJSON(themeConfig.path)
  return themeJSON
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