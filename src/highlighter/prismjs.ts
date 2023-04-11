import prismjs from 'prismjs'
import 'prismjs/components'

export function prismjsHighlighter(code: string, language?: string) {
  if(!language) {
    return code
  }
  const html = prismjs.highlight(code, prismjs.languages[language], language)
  return html
}
