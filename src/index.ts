import { createUnplugin } from 'unplugin'
import { createMarkdownTransformer } from './renderer'
import type { Options } from './types'

const unplugin = createUnplugin<Options | undefined>(options => {
  const markdownTransformer = createMarkdownTransformer(options)
  return {
    name: 'unplugin-markdown-2-html',
    transformInclude(id: string) {
      return /\.(md|markdown)$/i.test(id) 
    },
    async transform(markdown: string,) {
      const transformer = await markdownTransformer
      const content = transformer(markdown)
      return content
    }
  }
})

export default unplugin