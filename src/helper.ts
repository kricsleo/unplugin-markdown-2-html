import MakrdownIt from 'markdown-it'
// @ts-expect-error
import MarkdownItTOC from 'markdown-it-table-of-contents'
import markdownItAnchor from 'markdown-it-anchor'
import { getHighlighter } from 'shiki'
import slugify from 'slugify'

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
    themes: ['vitesse-light', 'vitesse-dark'],
    langs: ['javascript', 'typescript']
  })
  const highlighter = (code: string, lang: string) => shikiHighlighter.codeToHtml(code, { lang })
  return highlighter
}
