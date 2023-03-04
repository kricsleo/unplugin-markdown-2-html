import { createUnplugin } from 'unplugin'
import { createMarkdownRender, pkgName } from './helper'
import type { Options } from './types'

let markdownRender
export default createUnplugin<Options | undefined>(options => ({
  name: pkgName,
  enforce: 'pre',
  transformInclude(id) {
    return /\.(md|markdown)$/i.test(id) 
  },
  async transform(markdown) {
    markdownRender ||= await createMarkdownRender()
    const html = markdownRender(markdown)
    const content = 
`export const markdown = ${JSON.stringify(markdown)}

export const html = ${JSON.stringify(html)}
`
return content
  },
}))
