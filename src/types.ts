import MarkdownIt, { Options as MarkdownItOptions } from 'markdown-it'
import { Theme } from 'shiki'

export interface Options {
  /** @see https://github.com/markdown-it/markdown-it#init-with-presets-and-options */
  markdown?: MarkdownItOptions
  /** @see https://github.com/cmaas/markdown-it-table-of-contents#options */
  toc?: {
    includeLevel?: number[]
    containerClass?: string
    markerPattern?: RegExp
    listType?: string
    format?: (content: string, markdownIt: MarkdownIt) => string
    forceFullToc?: boolean
    containerHeaderHtml?: string
    containerFooterHtml?: string
    transformLink?: (link: string) => string
  }
  /** @see https://github.com/shikijs/shiki/blob/main/docs/themes.md */
  highlightTheme?: Theme
}
