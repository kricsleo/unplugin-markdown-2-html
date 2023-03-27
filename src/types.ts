import { Options as MarkdownItOptions } from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import { TocOptions } from 'markdown-it-toc-done-right'

export interface Options {
  /** @see https://github.com/markdown-it/markdown-it#init-with-presets-and-options */
  markdown?: MarkdownItOptions
  /** @see https://github.com/nagaozen/markdown-it-toc-done-right#options */
  toc?: TocOptions
  /** @see https://github.com/valeriangalliat/markdown-it-anchor#usage */
  anchor?: markdownItAnchor.AnchorOptions
}
