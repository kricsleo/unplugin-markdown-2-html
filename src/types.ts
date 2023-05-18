import { Options as MarkdownItOptions } from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import { TocOptions } from 'markdown-it-toc-done-right'
import { Theme } from 'shiki'

export interface Options {
  /** @see https://github.com/markdown-it/markdown-it#init-with-presets-and-options */
  markdown?: MarkdownItOptions
  /** @see https://github.com/nagaozen/markdown-it-toc-done-right#options */
  toc?: Partial<TocOptions>
  /** @see https://github.com/valeriangalliat/markdown-it-anchor#usage */
  anchor?: markdownItAnchor.AnchorOptions
  highlight?: HighlightOptions
}

/** Rendered results */
export interface Markdown {
  markdown: string
  html: string
  toc: string
  meta: Record<string, unknown>
}

export interface HighlightOptions {
  shiki?: { theme: ShikiTheme }
  // roadmap for prismjs v2: https://github.com/PrismJS/prism/discussions/3531
  prismjs?: boolean
  highlightjs?: boolean
}

export type Highlighter = (code: string, language?: string) => { html: string; themeTokens: ThemeToken[] }

export type VSCodeExtensionId = `${string}.${string}`
export type RemoteVSCodeThemeId = `${VSCodeExtensionId}.${string}`
export type ShikiTheme = Theme | RemoteVSCodeThemeId
export type ShikiThemeMap = ({ default?: ShikiTheme } & Record<string, ShikiTheme>)

export type HighlighTheme = ShikiTheme | ShikiThemeMap

export interface StyleToken {
  className: string
  style: string
}
export interface ThemeToken {
  theme: string
  themeAlias: string
  styleTokens: StyleToken[]
}