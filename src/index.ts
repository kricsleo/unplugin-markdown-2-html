import { createUnplugin } from 'unplugin'
import { pkgName, transformMarkdown } from './helper'
import type { Options } from './types'

export default createUnplugin<Options | undefined>(options => ({
  name: pkgName,
  enforce: 'pre',
  transformInclude(id: string) {
    return /\.(md|markdown)$/i.test(id) 
  },
  async transform(markdown: string) {
    return await transformMarkdown(markdown)
  }
}))
