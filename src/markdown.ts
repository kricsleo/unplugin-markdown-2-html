declare module "*.md" {
  /** raw contents for markdown */
  const markdown: string
  /** transpiled html contents for markdown */
  const html: string
  /** transpiled table of contents for markdown */
  const toc: string
}
