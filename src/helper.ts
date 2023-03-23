import MakrdownIt from 'markdown-it'
// @ts-expect-error
import MarkdownItTOC from 'markdown-it-table-of-contents'
import markdownItAnchor from 'markdown-it-anchor'
import { getHighlighter, Lang, BUNDLED_LANGUAGES, Theme } from 'shiki'
import chalk from 'chalk'
import { Options } from './types'

export const pkgName = 'unplugin-markdown-2-html'

let markdownRender
export async function transformMarkdown(markdown: string, options?: Options) {
  markdownRender ||= await createMarkdownRender(options)
  const html = markdownRender(markdown)
  const content = 
`
export const markdown = ${JSON.stringify(markdown)}
export const html = ${JSON.stringify(html)}
`.trim()
  return content
}

export async function createMarkdownRender(options?: Options) {
  const highlight = await createCodeHighlighter(options?.highlightTheme)
  const markdownIt = new MakrdownIt({ 
    html: true,
    highlight,
    ...options?.markdown
  })
  .use(markdownItAnchor)
  .use(MarkdownItTOC, { 
    containerClass: 'toc',
    markerPattern: /^\[toc\]/im,
    ...options?.toc
  })
  const markdownRender = (markdown: string) => markdownIt.render(markdown)
  return markdownRender
}

/** comment */
export async function createCodeHighlighter(theme: Theme = 'vitesse-dark') {
  // const customTheme = await loadTheme(theme)
  const shikiHighlighter = await getHighlighter({
    langs: BUNDLED_LANGUAGES,
    themes: [theme],
  })
  const highlighter = (code: string, lang: string) => {
    const isSupportedLang = shikiHighlighter.getLoadedLanguages().includes(lang as Lang)
    if(!isSupportedLang) {
      console.warn(chalk.bgYellow(`[${pkgName}]:`),`No language registration for '${lang}', skipping highlight.`)
      return code
    }
    return shikiHighlighter.codeToHtml(code, { lang })
  }
  return highlighter
}
