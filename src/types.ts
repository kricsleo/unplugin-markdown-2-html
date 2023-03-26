import { Options as MarkdownItOptions } from 'markdown-it'
import anchor from 'markdown-it-anchor'
import { TocOptions } from 'markdown-it-toc-done-right'
import { Theme } from 'shiki'

export type Highlighter = 'highlightjs' | 'shiki'

export interface Options {
  /** @see https://github.com/markdown-it/markdown-it#init-with-presets-and-options */
  markdown?: MarkdownItOptions
  /** @see https://github.com/nagaozen/markdown-it-toc-done-right#options */
  toc?: TocOptions
  /** @see https://github.com/valeriangalliat/markdown-it-anchor#usage */
  anchor?: anchor.AnchorOptions
  highlighter: Highlighter
  /** @see https://github.com/shikijs/shiki/blob/main/docs/themes.md */
  highlightTheme?: Theme
}
