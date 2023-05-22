import { getHighlighter, Theme, BUNDLED_THEMES, BUNDLED_LANGUAGES, FontStyle, Lang, Highlighter } from 'shiki-es'
import { escapeHtml } from 'markdown-it/lib/common/utils';
import { HighlighTheme, HighlightOptions, HighlightThemeName, HightlightSpan, HightlightSpanThemeStyle, VSCodeTheme } from '../types'
import { downloadVSCodeTheme } from './theme'

const wrapperClassName = 'sk-199507'

export async function createHighlighter(options?: HighlightOptions) {
  const langs = options?.langs || BUNDLED_LANGUAGES
  const themes = resolveTheme(options?.theme)
  
  const builtinThemes = Object.values(themes).filter(theme => isBuiltinTheme(theme as HighlightThemeName)) as Theme[]
  const vscodeThemes = Object.values(themes).filter(theme => !isBuiltinTheme(theme as HighlightThemeName)) as VSCodeTheme[]
  const highlighter = await getHighlighter({ langs, themes: builtinThemes })
  if(vscodeThemes.length) {
    await Promise.all(vscodeThemes.map(async theme => {
      const themeJSON = await downloadVSCodeTheme(theme)
      themeJSON.name = theme
      await highlighter.loadTheme(themeJSON)
    }))
  }
  return { highlight, generateWrapperCSS }

  function highlight(code: string, lang?: string) {
    const lines = highlightToLines(code, lang)
    const css = linesToCSS(lines)
    const html = linesToHtml(lines)
    return { html, css, lines }
  }

  function highlightToLines(code: string, lang?: string): HightlightSpan[][] {
    if(!lang) {
      return highlightToPlainLines(code)
    }
    if(!highlighter.getLoadedLanguages().includes(lang as Lang)) {
      console.warn(`No language registration for \`lang\`, skipping highlight.`)
      return highlightToPlainLines(code)
    }
    const themeLines = Object.entries(themes).map(([themeAlias, theme]) => {
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

  function generateWrapperCSS() {
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
    : { default: 'vitesse-dark' }
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
