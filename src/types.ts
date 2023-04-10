import { Options as MarkdownItOptions } from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import { HighlightOptions } from 'markdown-it-highlightjs/types/core'
import { TocOptions } from 'markdown-it-toc-done-right'

export interface Options {
  /** @see https://github.com/markdown-it/markdown-it#init-with-presets-and-options */
  markdown?: MarkdownItOptions
  /** @see https://github.com/nagaozen/markdown-it-toc-done-right#options */
  toc?: TocOptions
  /** @see https://github.com/valeriangalliat/markdown-it-anchor#usage */
  anchor?: markdownItAnchor.AnchorOptions
  highlight?: {
    highlightjs?: HighlightOptions
    // todo: support shiki
    // shiki?: ShikiOptions
    shiki?: boolean

    // support prismjs
    // roadmap for prismjs v2: https://github.com/PrismJS/prism/discussions/3531
    // prismjs throws error when language not found?
    prismjs?: boolean
  }
}

/** transformed results */
export interface Markdown {
  markdown: string
  html: string
  toc: string
  meta: Record<string, unknown>
}

export type VSCodeExtensionId = `${string}.${string}`