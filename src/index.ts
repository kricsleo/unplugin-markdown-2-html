import { createUnplugin } from 'unplugin'
import { createMarkdownRender } from './helper'
import type { Options } from './types'

let markdownRender
export default createUnplugin<Options | undefined>(options => ({
  name: 'unplugin-markdown-2-html',
  enforce: 'pre',
  transformInclude(id) {
    console.log('id', id)
    return /\.(md|markdown)$/i.test(id) 
  },
  async transform(markdown) {
    markdownRender ||= await createMarkdownRender()
    const html = markdownRender(markdown)
    return `export const html = ${JSON.stringify(html)}`
  },
}))
