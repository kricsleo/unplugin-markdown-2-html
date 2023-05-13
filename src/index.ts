import { createUnplugin } from 'unplugin'
import { createMarkdownTransformer, pkgName } from './helper'
import type { Options } from './types'

export * from './helper'

export default createUnplugin<Options | undefined>(options => {
  let style: string
  const markdownTransformer = createMarkdownTransformer(options)
  return {
    name: pkgName,
    resolveId(id) {
      return id.endsWith('unplugin-markdown-2-html.css') ? id: null
    },
    loadInclude(id: string) {
      return id.endsWith('unplugin-markdown-2-html.css')
    },
    load(id: string) {
      return id.endsWith('unplugin-markdown-2-html.css') ? style : null
    },
    transformInclude(id: string) {
      return /\.(md|markdown)$/i.test(id) 
    },
    async transform(markdown: string,) {
      const transformer = await markdownTransformer
      const {content, codeStyle } = transformer(markdown)
      style = codeStyle
      return content
    }
  }
})
