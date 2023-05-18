import { createUnplugin } from 'unplugin'
import { createMarkdownTransformer, pkgName } from './helper'
import type { Options } from './types'

export * from './helper'

const unplugin = createUnplugin<Options | undefined>(options => {
  let style: string
  const markdownTransformer = createMarkdownTransformer(options)
  const plugin = {
    name: pkgName,
    // resolveId(id) {
    //   return id.endsWith('unplugin-markdown-2-html.css') ? id: null
    // },
    // loadInclude(id: string) {
    //   return id.endsWith('unplugin-markdown-2-html.css')
    // },
    // load(id: string) {
    //   // todo: update virtual module
    //   return id.endsWith('unplugin-markdown-2-html.css') ? style : null
    // },
    transformInclude(id: string) {
      return /\.(md|markdown)$/i.test(id) 
    },
    async transform(markdown: string,) {
      const transformer = await markdownTransformer
      const content = transformer(markdown)
      return content
    }
  }
  return plugin
})

export default unplugin