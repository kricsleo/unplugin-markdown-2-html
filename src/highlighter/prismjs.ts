import prismjs from 'prismjs'
import 'prismjs/components'
import { StyleToken } from '../types'

export function prismjsHighlighter(code: string, language?: string) {
  if(!language) {
    return { html: code, styleTokens: [] as StyleToken[]}
  }
  const html = prismjs.highlight(code, prismjs.languages[language], language)
  // todo: support styleToken
  return {html, styleTokens: [] as StyleToken[]}
}
