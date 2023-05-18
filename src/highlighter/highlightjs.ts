import highlightjs  from 'highlight.js';
import { StyleToken } from '../types';

export function highlightjsHighlighter(code: string, language?: string) {
  if(!language) {
    return { html: code, styleTokens: [] as StyleToken[]}
  }
  const html = highlightjs.highlight(code, { language, ignoreIllegals: true }).value
  // todo: styleTokens
  return {html, styleTokens: [] as StyleToken[]}
}