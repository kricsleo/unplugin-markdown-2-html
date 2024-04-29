```ts
import { mdAt, mdComment, mdInfo } from '@mihoyo/wave-opensdk'
import type { Article, AtNode, BlockNode, BlockquoteNode, DocNode, HeadingNode, InlineNode, LinkTextNode, ListNode, News, ParagraphNode, TableNode, TagNode, TextNode } from './types'

export function parseArticleLink(link: string) {
  // 'https://km.mihoyo.com/articleBase/21832/823948'
  // => { knowledgeId: 21832, articleId: 823948 }
  const reg = /https:\/\/km\.mihoyo\.com\/articleBase\/(\d+)\/(\d+)/
  const [, knowledgeId, articleId] = link.match(reg) || []
  return { knowledgeId: +knowledgeId, articleId: +articleId }
}

export function parseArticle(article: Article) {
  const doc = JSON.parse(article.content) as DocNode
  const newsList = doc.content.filter(t => t.type === 'list') as ListNode[]
  return newsList.map(news => parseNews(news))
}

export function parseNews(news: ListNode): News {
  const titleNode = news.content.find(t => t.type === 'heading') as HeadingNode
  const metaTableNode = news.content.find(t => t.type === 'table') as TableNode
  const sumaryNode = news.content.find(t => t.type === 'blockquote') as BlockquoteNode
  const extraLinkNodes = news.content.filter(t => t.type === 'list') as ListNode[]

  const meta = parseMetaTable(metaTableNode)
  const title = heading2md(titleNode)
  const anchor = `st=${encodeURIComponent(heading2text(titleNode))}#${titleNode.attrs['node-id']}`
  const summary = blockquote2md(sumaryNode)
  const extraLinks = extraLinkNodes.map(listNode => {
    const linkNode = listNode.content[0].content[0] as LinkTextNode
    return parseLinkNode(linkNode)
  })

  return { ...meta, title, anchor, summary, extraLinks }
}

function parseMetaTable(metaTable: TableNode) {
  const [_titleRow, valueRow] = metaTable.content
  const [authorCell, dateCell, tagsCell, linkCell] = valueRow.content

  const authorNode = authorCell.content[0].content.find(
    t => t.type === 'at',
  ) as AtNode
  const dateNode = dateCell.content[0].content.find(
    t => t.type === 'text',
  ) as TextNode
  const tagNodes = tagsCell.content[0].content.filter(
    t => t.type === 'colorfulTag',
  ) as TagNode[]
  const linkNode = linkCell.content[0].content.find(
    t => t.type === 'text' && t.marks?.some(mark => mark.type === 'link'),
  ) as LinkTextNode

  const author = authorNode.attrs.id
  const date = dateNode.text
  const tags = tagNodes.map(tag => tag.attrs['txt-content'])
  const link = parseLinkNode(linkNode)

  return { author, date, tags, link }
}

function parseLinkNode(linkNode: LinkTextNode) {
  const linkMark = linkNode.marks.find(mark => mark.type === 'link')!
  return {
    title: linkNode.text,
    link: linkMark.attrs.href,
  }
}

function block2md(block: BlockNode): string {
  switch (block.type) {
    case 'heading': return heading2md(block)
    case 'blockquote': return blockquote2md(block)
    case 'paragraph': return paragraph2md(block)
    // wave does not support table
    // case 'table': return table2md(block)
    case 'list': return list2md(block)
    default: throw new Error(`Unknown block type: ${JSON.stringify(block)}`)
  }
}

function inline2md(inline: InlineNode) {
  switch (inline.type) {
    case 'text': return text2md(inline)
    case 'colorfulTag': return tag2md(inline)
    case 'at': return at2md(inline)
    default: throw new Error(`Unknown inline node type: ${JSON.stringify(inline)}`)
  }
}

function heading2md(heading: HeadingNode) {
  return heading.content.map(text2md).join('')
}

function heading2text(heading: HeadingNode) {
  return heading.content.map(node => node.text).join('')
}

function paragraph2md(paragraph: ParagraphNode) {
  return paragraph.content.map(inline2md).join('')
}

function blockquote2md(blockquote: BlockquoteNode) {
  return blockquote.content.map(block => `> ${block2md(block)}`).join('\n')
}

function list2md(list: ListNode) {
  return list.content
    .map(block => prependBullet(block2md(block)))
    .join('\n')
}

function tag2md(tag: TagNode) {
  return mdInfo(tag.attrs['txt-content'])
}

function text2md(text: TextNode) {
  return (text.marks || []).reduce((acc, mark) => {
    switch (mark.type) {
      case 'link': return `[${acc}](${mark.attrs.href})`
      case 'bold': return `**${acc}**`
      // Wave does not support inline code,
      // use colored text to represent it.
      case 'code': return mdInfo(acc)
      default: return acc
    }
  }, text.text)
}

function at2md(at: AtNode) {
  return mdAt(at.attrs.id)
}

function prependBullet(str: string) {
  // Wave does not support list,
  // use bullet emoji to represent it.
  return `${mdComment('•')} ${str}`
}

```