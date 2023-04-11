import { createUnplugin } from 'unplugin'
import { createMarkdownTransformer, pkgName } from './helper'
import type { Options } from './types'

export * from './helper'

export default createUnplugin<Options | undefined>(options => {
  const markdownTransformer = createMarkdownTransformer(options)
  return {
    name: pkgName,
    enforce: 'pre',
    transformInclude(id: string) {
      return /\.(md|markdown)$/i.test(id) 
    },
    async transform(markdown: string,) {
      const transformer = await markdownTransformer
      const transformed = transformer(markdown)
      return transformed
    }
  }
})
