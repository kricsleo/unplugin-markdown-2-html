import MakrdownIt from 'markdown-it'
// @ts-expect-error
import MarkdownItTOC from 'markdown-it-table-of-contents'
import markdownItAnchor from 'markdown-it-anchor'
import { getHighlighter, Lang } from 'shiki'
import slugify from 'slugify'
import chalk from 'chalk'

export const pkgName = 'unplugin-markdown-2-html'

export async function createMarkdownRender() {
  const highlight = await createCodeHighlighter()
  const markdownIt = new MakrdownIt({ 
    html: true,
    highlight,
  })
  .use(markdownItAnchor, { slugify })
  .use(MarkdownItTOC, { 
    includeLevel: [2, 3],
    containerClass: 'toc',
    markerPattern: /^\[toc\]/im
  })
  const markdownRender = (markdown: string) => markdownIt.render(markdown)
  return markdownRender
}

export async function createCodeHighlighter() {
  const shikiHighlighter = await getHighlighter({
    // todo: extend options
    // todo: dark & light mode
    themes: ['css-variables', 'vitesse-light', 'vitesse-dark'],
    langs: ['javascript', 'typescript']
  })
  const highlighter = (code: string, lang: string) => {
    const isSupportedLang = shikiHighlighter.getLoadedLanguages().includes(lang as Lang)
    if(!isSupportedLang) {
      console.warn(chalk.yellow(`[${pkgName}]:`),`Unsupported language '${lang}', skipping highlight.`)
      return code
    }
    return shikiHighlighter.codeToHtml(code, { lang, theme: 'css-variables' })
  }
  return highlighter
}
