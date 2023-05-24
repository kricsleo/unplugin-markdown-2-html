import { getHighlighter, Theme, BUNDLED_THEMES, BUNDLED_LANGUAGES, FontStyle, Lang, Highlighter, ILanguageRegistration } from 'shiki-es'
import { escapeHtml } from 'markdown-it/lib/common/utils';
import { HighlighTheme, HighlightOptions, HighlightThemeName, HightlightSpan, HightlightSpanThemeStyle, VSCodeTheme } from '../types'
import { downloadVSCodeTheme } from './theme'

const wrapperClassName = 'sk-199507'

export async function createHighlighter(options?: HighlightOptions) {
  const langs = options?.langs || BUNDLED_LANGUAGES
  const themes = resolveTheme(options?.theme)
  const highlighter = await getHighlighter({})
  await Promise.all([
    loadLanguage(...langs),
    loadTheme(themes)
  ])
  return { 
    highlight, 
    highlightAsync,
    highlightToMultiThemes,
    highlightToMultiThemesAsync,
    highlightToLines,
    highlightToLinesAsync,
    loadLanguage,
    loadTheme,
    generateWrapperCSS,
  }

  /**
   * Highlight code to html.
   * Use preloaded language and theme.
   */
  function highlight(code: string, lang?: Lang, theme?: HighlightThemeName) {
    const isLoadedLang = highlighter.getLoadedLanguages().includes(lang as Lang)
    if(!lang || !isLoadedLang) {
      !isLoadedLang && console.warn(`No language registration for \`lang\`, skipping highlight.`)
      return `<pre class="${wrapperClassName}"><code>${code}</code></pre>`
    }
    return highlighter.codeToHtml(code, { lang, theme: theme as Theme })
  }

  /**
   * Hightlight code to html.
   * Dynamic on-demand loading of language and theme.
   */
  async function highlightAsync(code: string, lang?: Lang, theme?: HighlightThemeName) {
    await Promise.all([
      lang && loadLanguage(lang),
      theme && loadTheme(theme)
    ])
    const html = highlight(code, lang, theme)
    return html
  }

  /**
   * Highlight code to html with multile themes.
   * Additional styles specified by className will be generated.
   */
  function highlightToMultiThemes(code: string, lang?: string) {
    const lines = highlightToLines(code, lang)
    const css = linesToCSS(lines)
    const html = linesToHtml(lines)
    return { html, css, lines }
  }

  /**
   * Highlight code to html with multile themes.
   * Additional styles specified by className will be generated.
   */
  async function highlightToMultiThemesAsync(code: string, lang?: string, theme?: HighlighTheme) {
    await Promise.all([
      lang && loadLanguage(lang as Lang),
      theme && loadTheme(theme)
    ])
    return highlightToMultiThemes(code, lang)
  }

  /**
   * Load a language.
   */
  async function loadLanguage(...langs: (Lang | ILanguageRegistration)[]) {
    const newLangs = langs.filter(lang => {
      const langName = typeof lang === 'string' ? lang : lang.id as Lang
      return !highlighter.getLoadedLanguages().includes(langName)
    })
    await Promise.all(newLangs.map(lang => highlighter.loadLanguage(lang)))
  }

  /**
   * Load a theme.
   * Support for shiki built-in themes and any remote VSCode theme marketplace themes.
   * VSCode themes are specified via `<Identifier>.<ThemeName>`
   */
  async function loadTheme(theme: HighlighTheme) {
    const themes = resolveTheme(theme)
    const newThemes = Object.values(themes).filter(theme => !highlighter.getLoadedThemes().includes(theme as Theme))
    await Promise.all(newThemes.map(async theme => {
      if(isBuiltinTheme(theme)) {
        await highlighter.loadTheme(theme)
      } else {
        const themeJSON = await downloadVSCodeTheme(theme)
        themeJSON.name = theme
        await highlighter.loadTheme(themeJSON)
      }
    }))
  }

  function highlightToLines(code: string, lang?: string, theme?: HighlighTheme): HightlightSpan[][] {
    const isLoadedLang = highlighter.getLoadedLanguages().includes(lang as Lang)
    if(!lang || !isLoadedLang) {
      !isLoadedLang && console.warn(`No language registration for \`lang\`, skipping highlight.`)
      return highlightToPlainLines(code)
    }

    const themeLines = Object.entries(resolveTheme(theme)).map(([themeAlias, theme]) => {
      const lines: HightlightSpan[][] = highlighter.codeToThemedTokens(
        code, 
        lang,
        theme,
        { includeExplanation: false }
      ).map(line => line.map(span => ({
        content: span.content,
        style: {
          [themeAlias]: {
            color: span.color,
            fontStyle: span.fontStyle
          },
        }
      })))
      return { theme, themeAlias, lines }
    })

    const mergedLines: HightlightSpan[][] = []
    for (const line in themeLines[0].lines) {
      mergedLines[line] = themeLines.reduce((acc, themeLine) => {
        return mergeLines({
          themeAlias: themeLines[0].themeAlias,
          spans: acc
        }, {
          themeAlias: themeLine.themeAlias,
          spans: themeLine.lines[line]
        })
      }, themeLines[0].lines[line])
    }
    return mergedLines
  }

  async function highlightToLinesAsync(code: string, lang?: string, theme?: HighlighTheme): Promise<HightlightSpan[][]> {
    await Promise.all([
      lang && loadLanguage(lang as Lang),
      theme && loadTheme(theme)
    ])
    return highlightToLines(code, lang)
  }

  function generateWrapperCSS(theme: HighlighTheme) {
    const themes = resolveTheme(theme)
    const defaultThemeBg = highlighter.getBackgroundColor(themes.default)
    const wrapperCss = Object.entries(themes).map(([themeAlias, theme]) => {
      const bg = highlighter.getBackgroundColor(theme)
      return themeAlias === 'default' 
        ? `.${wrapperClassName}{background-color: ${bg};}`
        : bg === defaultThemeBg 
          ? ''
          : `.${themeAlias} .${wrapperClassName}{background-color: ${bg};}`
    }).join('')
    return wrapperCss
  }
}

function linesToHtml(lines: HightlightSpan[][]) {
  const html = lines.map(line => 
    '<span class="line">' +
    line.map(span => {
      const { className } = generateSpanCSS(span)
      return `<span class="${className}">${escapeHtml(span.content)}</span>`
    }).join('') +
    '\n</span>'
  ).join('')
  return `<pre class="${wrapperClassName}"><code>${html}</code></pre>`
}

export function linesToCSS(lines: HightlightSpan[][]) {
  return unique(lines.flat().map(span => generateSpanCSS(span).css))
    .join('')
}

function generateSpanCSS(span: HightlightSpan) {
  if(!span.style) {
    return { className: '', css: ''}
  }
  const defaultStyle = span.style.default
  const hasColor = !!defaultStyle.color
  const hasBold = isBold(defaultStyle)
  const hasItalic = isItalic(defaultStyle)
  const hasUnderline = isUnderline(defaultStyle)
  const themeStyles = Object.entries(span.style).map(([themeAlias, style]) => {
    const css = [
      ['color', style.color || (hasColor ? 'unset' : '')], 
      ['font-weight', isBold(style) ? 'bold' : hasBold ? 'unset' : '' ], 
      ['font-style', isItalic(style) ? 'italic' : hasItalic ? 'unset' : '' ], 
      ['text-decoration', isUnderline(style) ? 'bold' : hasUnderline ? 'unset' : '' ],
    ]
      .filter(kv => kv[1])
      .map(kv => kv.join(':') + ';')
      .join('')
    return { themeAlias, css }
  })
  const key = themeStyles.map(themeStyle => themeStyle.css).join('')
  const className = 'sk-' + hash(key)
  const defaultThemeStyle = themeStyles.find(themeStyle => themeStyle.themeAlias === 'default')!
  const css = themeStyles.map(themeStyle => 
    themeStyle.themeAlias === 'default'
      ? `.${className}{${themeStyle.css}}`
      : themeStyle.css === defaultThemeStyle.css
        ? '' 
        : `.${themeStyle.themeAlias} .${className}{${themeStyle.css}}`
  ).join('')
  return { className, css }
}


interface HighlightThemeLine {
  themeAlias: string
  spans: HightlightSpan[]
}
function mergeLines(line1: HighlightThemeLine, line2: HighlightThemeLine) {
  const mergedLine: HightlightSpan[] = []
  const right = {
    themeAlias: line1.themeAlias,
    spans: line1.spans.slice()
  }
  const left = {
    themeAlias: line2.themeAlias,
    spans: line2.spans.slice()
  }
  let index = 0
  while (index < right.spans.length) {
    const rightToken = right.spans[index]
    const leftToken = left.spans[index]

    if (rightToken.content === leftToken.content) {
      mergedLine.push({
        content: rightToken.content,
        style: {
          ...right.spans[index].style,
          ...left.spans[index].style,
        }
      })
      index += 1
      continue
    }

    if (rightToken.content.startsWith(leftToken.content)) {
      const nextRightToken = {
        ...rightToken,
        content: rightToken.content.slice(leftToken.content.length)
      }
      rightToken.content = leftToken.content
      right.spans.splice(index + 1, 0, nextRightToken)
      continue
    }

    if (leftToken.content.startsWith(rightToken.content)) {
      const nextLeftToken = {
        ...leftToken,
        content: leftToken.content.slice(rightToken.content.length)
      }
      leftToken.content = rightToken.content
      left.spans.splice(index + 1, 0, nextLeftToken)
      continue
    }
    throw new Error('Unexpected token')
  }
  return mergedLine
}

function highlightToPlainLines(code: string) {
  const lines = code.split(/\r\n|\r|\n/);
  return lines.map(line => [{ content: line }]);
}

function resolveTheme(theme?: HighlighTheme) {
  const themes = theme
    ? typeof theme === 'string'
      ? {default: theme}
      : theme
    : { default: 'vitesse-dark' as HighlightThemeName }
  return themes
}

function isBuiltinTheme(theme: HighlightThemeName): theme is Theme {
  return BUNDLED_THEMES.includes(theme as any)
}

function isBold(style: HightlightSpanThemeStyle) {
  return style.fontStyle === FontStyle.Bold
}

function isItalic(style: HightlightSpanThemeStyle) {
  return style.fontStyle === FontStyle.Italic
}

function isUnderline(style: HightlightSpanThemeStyle) {
  return style.fontStyle === FontStyle.Underline
}

function unique(list: unknown[]) {
  return Array.from(new Set(list))
}

// https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0?permalink_comment_id=4261728#gistcomment-4261728
function hash(str: string) {
  return Array.from(str)
    .reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0)
    .toString()
    .slice(-6)
}
