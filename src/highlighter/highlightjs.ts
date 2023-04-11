import highlightjs  from 'highlight.js';

export function highlightjsHighlighter(code: string, language?: string) {
  if(!language) {
    return code
  }
  const html = highlightjs.highlight(code, { language, ignoreIllegals: true }).value
  return html
}