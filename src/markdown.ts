declare module "*.md" {
  /** Raw content for markdown */
  const markdown: string
  /** Rendered html content for markdown */
  const html: string
  /** Rendered table of contents for markdown */
  const toc: string
  /** YAML-formatted metadata for markdown */
  const meta: Record<string, unknown>
}
