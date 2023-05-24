import { Options as MarkdownItOptions } from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import { TocOptions } from 'markdown-it-toc-done-right'
import { IThemedToken, Theme, ILanguageRegistration, Lang } from 'shiki-es'

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
  css: string
}

export interface HighlightOptions {
  langs?: (Lang | ILanguageRegistration)[]
  theme?: HighlightTheme
}

export interface HighlightMultiOptions {
  lang?: (Lang | ILanguageRegistration)
  theme?: HighlightTheme
}

export interface HighlightSingleOptions {
  lang?: (Lang | ILanguageRegistration)
  theme?: HighlightThemeName
}

export type VSCodeExtensionId = `${string}.${string}`
export type VSCodeTheme = `${VSCodeExtensionId}.${string}`
export type HighlightThemeName = Theme | VSCodeTheme
export type HighlightTheme = HighlightThemeName | {
  default: HighlightThemeName;
  [themeAlias: string]: HighlightThemeName;
}

export type HightlightSpanThemeStyle = Pick<IThemedToken, 'color' | 'fontStyle'>
export interface HightlightSpan {
  content: string
  // { [themeName]: themeStyle }
  style?: Record<string, HightlightSpanThemeStyle>
}
