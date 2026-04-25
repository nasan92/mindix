import type { MindMapDocument, MindMapNode, Point } from '../../types'
import { computeAbsolutePositions } from '../geometry'

const NODE_PADDING = 10
const NODE_MIN_WIDTH = 80
const FONT_CHAR_WIDTH = 8
const FONT_LINE_HEIGHT = 22

function escapeXml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n+$/, '')
    .trim()
}

interface NodeBox {
  x: number
  y: number
  width: number
  height: number
}

function estimateNodeBox(node: MindMapNode, absPos: Point): NodeBox {
  const text = htmlToPlainText(node.text)
  const lines = text.split('\n')
  const maxLen = Math.max(...lines.map(l => l.length), 1)
  const width = Math.max(NODE_MIN_WIDTH, maxLen * FONT_CHAR_WIDTH + NODE_PADDING * 2)
  const height = lines.length * FONT_LINE_HEIGHT + NODE_PADDING * 2
  return {
    x: absPos.x - width / 2,
    y: absPos.y - height / 2,
    width,
    height,
  }
}

function cubicBezierPath(sx: number, sy: number, tx: number, ty: number): string {
  const dx = Math.abs(tx - sx) * 0.5
  return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`
}

export function exportSVG(doc: MindMapDocument): string {
  const absPositions = computeAbsolutePositions(doc.nodes, doc.rootId)
  const boxes: Record<string, NodeBox> = {}

  for (const [id, absPos] of Object.entries(absPositions)) {
    const node = doc.nodes[id]
    if (node) boxes[id] = estimateNodeBox(node, absPos)
  }

  // Compute bounding box with padding
  const padding = 40
  const allBoxes = Object.values(boxes)
  if (!allBoxes.length) return '<svg xmlns="http://www.w3.org/2000/svg"></svg>'

  const minX = Math.min(...allBoxes.map(b => b.x)) - padding
  const minY = Math.min(...allBoxes.map(b => b.y)) - padding
  const maxX = Math.max(...allBoxes.map(b => b.x + b.width)) + padding
  const maxY = Math.max(...allBoxes.map(b => b.y + b.height)) + padding
  const svgWidth = maxX - minX
  const svgHeight = maxY - minY

  const lines: string[] = []
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="${minX} ${minY} ${svgWidth} ${svgHeight}">`,
  )

  // Background
  const bg = doc.settings.backgroundColor || '#ffffff'
  lines.push(`<rect x="${minX}" y="${minY}" width="${svgWidth}" height="${svgHeight}" fill="${escapeXml(bg)}"/>`)

  // Draw branch edges
  const nodeList = Object.values(doc.nodes)
  for (const node of nodeList) {
    if (!node.parentId) continue
    const srcBox = boxes[node.parentId]
    const tgtBox = boxes[node.id]
    if (!srcBox || !tgtBox) continue

    const sx = srcBox.x + srcBox.width / 2
    const sy = srcBox.y + srcBox.height / 2
    const tx = tgtBox.x + tgtBox.width / 2
    const ty = tgtBox.y + tgtBox.height / 2
    const lineWidth = Math.max(1, 3 + node.style.lineWidthOffset)

    lines.push(
      `<path d="${cubicBezierPath(sx, sy, tx, ty)}" fill="none" stroke="${escapeXml(node.style.branchColor)}" stroke-width="${lineWidth}"/>`,
    )
  }

  // Draw connection edges
  for (const conn of doc.connections) {
    const srcBox = boxes[conn.fromId]
    const tgtBox = boxes[conn.toId]
    if (!srcBox || !tgtBox) continue

    const sx = srcBox.x + srcBox.width / 2
    const sy = srcBox.y + srcBox.height / 2
    const tx = tgtBox.x + tgtBox.width / 2
    const ty = tgtBox.y + tgtBox.height / 2

    const strokeDash =
      conn.style === 'dashed' ? 'stroke-dasharray="6,3"' :
      conn.style === 'dotted' ? 'stroke-dasharray="2,3"' : ''

    const markerEnd = conn.arrow > 0
      ? `<defs><marker id="a${conn.id}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="${escapeXml(conn.color)}"/></marker></defs>`
      : ''

    if (markerEnd) lines.push(markerEnd)

    const arkerAttr = conn.arrow > 0 ? `marker-end="url(#a${conn.id})"` : ''
    const d = conn.shape === 'curved' ? cubicBezierPath(sx, sy, tx, ty) : `M ${sx} ${sy} L ${tx} ${ty}`
    lines.push(
      `<path d="${d}" fill="none" stroke="${escapeXml(conn.color)}" stroke-width="2" ${strokeDash} ${arkerAttr}/>`,
    )
  }

  // Draw nodes
  for (const node of nodeList) {
    const box = boxes[node.id]
    if (!box) continue

    const font = node.style.font
    const border = node.style.border

    if (border.visible && border.style !== 'none') {
      const dash =
        border.style === 'dashed' ? 'stroke-dasharray="4,2"' :
        border.style === 'dotted' ? 'stroke-dasharray="1,3"' : ''
      lines.push(
        `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="4" fill="${escapeXml(border.background)}" stroke="${escapeXml(border.color)}" ${dash}/>`,
      )
    }

    const text = htmlToPlainText(node.text)
    const textLines = text.split('\n')
    const fontStyle = `font-family="${escapeXml(font.fontfamily)}" font-size="${font.size}" fill="${escapeXml(font.color)}"`
    const fontWeight = font.weight === 'bold' ? ' font-weight="bold"' : ''
    const fontItalic = font.style === 'italic' ? ' font-style="italic"' : ''
    const textDecoration = font.decoration !== 'none' ? ` text-decoration="${escapeXml(font.decoration)}"` : ''
    const anchor =
      font.align === 'left' ? 'start' :
      font.align === 'right' ? 'end' : 'middle'

    const textX =
      font.align === 'left' ? box.x + NODE_PADDING :
      font.align === 'right' ? box.x + box.width - NODE_PADDING :
      box.x + box.width / 2

    textLines.forEach((line, i) => {
      const lineY = box.y + NODE_PADDING + font.size + i * FONT_LINE_HEIGHT
      lines.push(
        `<text x="${textX}" y="${lineY}" text-anchor="${anchor}" ${fontStyle}${fontWeight}${fontItalic}${textDecoration}>${escapeXml(line)}</text>`,
      )
    })
  }

  lines.push('</svg>')
  return lines.join('\n')
}
