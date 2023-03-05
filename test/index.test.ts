import { describe, expect, it } from 'vitest'
import markdownRaw from '../playground/index.md?raw'
import { transformMarkdown } from '../src/helper'

describe('markdown', () => {
  it('transform', async () => {
    const html = await transformMarkdown(markdownRaw)
    console.log('html', html)
    expect(html).toMatchInlineSnapshot()
  })
})
