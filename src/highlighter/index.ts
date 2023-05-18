import { HighlightOptions, ShikiTheme, Highlighter } from '../types'
import { highlightjsHighlighter } from './highlightjs'
import { prismjsHighlighter } from './prismjs'
import { createShikiHighlighter } from './shiki'

export async function createHighlighter(options?: HighlightOptions) {
  let highlighter: Highlighter
  if(!options || options.shiki) {
    highlighter = await createShikiHighlighter(options?.shiki)
  } else if(options.prismjs) {
    highlighter = prismjsHighlighter
  } else {
    highlighter = highlightjsHighlighter
  }
  return highlighter
}