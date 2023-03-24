import MakrdownIt from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import markdownItAttrs from 'markdown-it-attrs'
import markdownItToc, { TocOptions } from 'markdown-it-toc-done-right'
import { getHighlighter, Lang, BUNDLED_LANGUAGES, Theme } from 'shiki'
import chalk from 'chalk'
import { Options } from './types'

export const pkgName = 'unplugin-markdown-2-html'

type MarkdownRender = (markdown: string) => { html: string; toc: string; }
let markdownRender: MarkdownRender
export async function transformMarkdown(markdown: string, options?: Options) {
  markdownRender ||= await createMarkdownRender(options)
  const { html, toc } = markdownRender(markdown)
  const content = 
  // todo: extract meta info
`
export const markdown = ${JSON.stringify(markdown)}
export const html = ${JSON.stringify(html)}
export const toc = ${JSON.stringify(toc)}
`.trim()
  return content
}

export async function createMarkdownRender(options?: Options) {
  const highlight = await createCodeHighlighter(options?.highlightTheme)
  let toc: string
  const markdownIt = new MakrdownIt({ 
    html: true,
    highlight,
    ...options?.markdown
  })
  .use(markdownItAttrs)
  .use(markdownItToc, {
    listType: 'ul',
    callback: tocStr => toc = tocStr
  } as Partial<TocOptions>)
  .use(markdownItAnchor, {
    // if support headings from html,
    // https://github.com/valeriangalliat/markdown-it-anchor#parsing-headings-from-html-blocks
    permalink: markdownItAnchor.permalink.linkInsideHeader({
      placement: 'before'
    })
  })
  const markdownRender = (markdown: string) => ({
    html: markdownIt.render(markdown),
    toc
  })
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
