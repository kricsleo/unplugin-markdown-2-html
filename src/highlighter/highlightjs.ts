import highlightjs  from 'highlight.js';
import { ThemeToken } from '../types';

export function highlightjsHighlighter(code: string, language?: string) {
  if(!language) {
    return { html: code, themeTokens: [] as ThemeToken[]}
  }
  const html = highlightjs.highlight(code, { language, ignoreIllegals: true }).value
  // todo: themeTokens
  return {html, themeTokens: [] as ThemeToken[]}
}