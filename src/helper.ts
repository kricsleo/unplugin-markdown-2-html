import MakrdownIt from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import markdownItAttrs from 'markdown-it-attrs'
import markdownItToc, { TocOptions } from 'markdown-it-toc-done-right'
import markdownItMetaYaml, { Options as MarkdownItMetaYamlOptions} from 'markdown-it-meta-yaml'
import { getHighlighter, Lang, BUNDLED_LANGUAGES, Theme } from 'shiki'
import chalk from 'chalk'
import hljs from 'highlight.js'
import { Options } from './types'

export const pkgName = 'unplugin-markdown-2-html'

let markdownRender: Awaited<ReturnType<typeof createMarkdownRender>>
export async function transformMarkdown(markdown: string, options?: Options) {
  markdownRender ||= await createMarkdownRender(options)
  const { html, toc, meta } = markdownRender(markdown)
  const content = 
`
export const markdown = ${JSON.stringify(markdown)}
export const html = ${JSON.stringify(html)}
export const toc = ${JSON.stringify(toc)}
export const meta = ${JSON.stringify(meta)}
`.trim()
  return content
}

export async function createMarkdownRender(options?: Options) {
  /** todo: also support highlightjs */
  const highlight = options?.highlighter === 'shiki'
    ? await createCodeHighlighter(options?.highlightTheme)
    : createHljsHighlighter()
  let toc: string
  let meta: Record<string, unknown>
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
  .use(markdownItMetaYaml, {
    cb: metaJSON => meta = metaJSON
  } as MarkdownItMetaYamlOptions)
  const markdownRender = (markdown: string) => ({
    html: markdownIt.render(markdown),
    toc,
    meta
  })
  return markdownRender
}

export function createHljsHighlighter() {
  return (code: string, lang: string) => {
    if(!hljs.getLanguage(lang)) {
      console.warn(chalk.bgYellow(`[${pkgName}]:`),`No language registration for '${lang}', skipping highlight.`)
      return code
    }
    const result = hljs.highlight(code, { language: lang })
    return result.value
  }
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
