import type { MindMapDocument, MindMapNode } from '../../types'

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .trim()
}

function visitNode(
  nodeId: string,
  nodes: Record<string, MindMapNode>,
  depth: number,
  lines: string[],
) {
  const node = nodes[nodeId]
  if (!node) return

  const caption = htmlToPlainText(node.text).replace(/\n/g, ' ').trim()
  if (!caption) return

  if (depth === 0) {
    lines.push('# ' + caption)
  } else if (depth <= 3) {
    if (depth === 1 && lines.length > 0) lines.push('')
    lines.push('#'.repeat(depth + 1) + ' ' + caption)
  } else {
    const indent = '  '.repeat(depth - 4)
    lines.push(indent + '- ' + caption)
  }

  for (const childId of node.childrenIds) {
    visitNode(childId, nodes, depth + 1, lines)
  }
}

export function exportMarkdown(doc: MindMapDocument): string {
  const lines: string[] = []
  visitNode(doc.rootId, doc.nodes, 0, lines)
  return lines.join('\n')
}
