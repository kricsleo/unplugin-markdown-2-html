import prismjs from 'prismjs'
import 'prismjs/components'
import { ThemeToken } from '../types'

export function prismjsHighlighter(code: string, language?: string) {
  if(!language) {
    return { html: code, themeTokens: [] as ThemeToken[]}
  }
  const html = prismjs.highlight(code, prismjs.languages[language], language)
  // todo: themeTokens
  return {html, themeTokens: [] as ThemeToken[]}
}
