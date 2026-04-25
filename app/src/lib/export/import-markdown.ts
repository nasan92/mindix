import type { MindMapDocument, MindMapNode } from '../../types'
import { createUUID } from '../uuid'
import { DEFAULT_FONT, DEFAULT_BORDER, createNewDocument } from '../migration'
import { getNextRootBranchColor, getThemeBranchColor } from '../color-themes'
import { computeAutoLayout } from '../layout'

interface HeadingEntry {
  level: number
  caption: string
}

function getIndentWidth(raw: string): number {
  let width = 0
  for (const ch of raw) {
    width += ch === '\t' ? 4 : 1
  }
  return width
}

function parseHeadings(markdownText: string): { rootCaption: string; headings: HeadingEntry[] } {
  const lines = markdownText.replace(/\r\n/g, '\n').split('\n')
  const headings: HeadingEntry[] = []
  let inCodeBlock = false
  let currentHeadingLevel: number | null = null
  let listIndentStack: number[] = []

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    const match = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/)
    if (match) {
      const level = match[1].length
      const caption = match[2].replace(/\s+#+\s*$/, '').trim()
      if (!caption) continue
      headings.push({ level, caption })
      currentHeadingLevel = level
      listIndentStack = []
      continue
    }

    const listMatch = line.match(/^(\s*)(?:[-*+]\s+|\d+[.)]\s+)(.+?)\s*$/)
    if (!listMatch || currentHeadingLevel === null) continue

    const listCaption = listMatch[2].trim()
    if (!listCaption) continue

    const indentWidth = getIndentWidth(listMatch[1])
    while (listIndentStack.length && indentWidth < listIndentStack[listIndentStack.length - 1]) {
      listIndentStack.pop()
    }
    if (!listIndentStack.length || indentWidth > listIndentStack[listIndentStack.length - 1]) {
      listIndentStack.push(indentWidth)
    }

    headings.push({
      level: currentHeadingLevel + listIndentStack.length,
      caption: listCaption,
    })
  }

  if (!headings.length) {
    throw new Error('No markdown headings were found. Use # for the root, then ##/###/#### for branches.')
  }

  const rootIndex = headings.findIndex(h => h.level === 1)
  if (rootIndex === -1) {
    throw new Error('Markdown must include one top-level heading (#) for the central idea.')
  }

  return {
    rootCaption: headings[rootIndex].caption,
    headings: headings.slice(rootIndex + 1),
  }
}

export function importMarkdown(markdownText: string): MindMapDocument {
  const { rootCaption, headings } = parseHeadings(markdownText)

  const doc = createNewDocument()
  const root = doc.nodes[doc.rootId]
  root.text = `<p>${rootCaption}</p>`
  root.layout.offset = { x: 0, y: 0 }

  const stack: Record<number, string> = { 1: doc.rootId }
  let rootChildCount = 0

  for (const entry of headings) {
    let level = entry.level
    if (level === 1) level = 2
    if (level < 2) level = 2
    if (level > 4) level = 4

    let parentLevel = level - 1
    while (parentLevel >= 1 && !stack[parentLevel]) {
      parentLevel--
    }

    const parentId = stack[parentLevel] ?? doc.rootId
    const parent = doc.nodes[parentId]

    const isRootChild = parentId === doc.rootId
    const branchColor = isRootChild
      ? getNextRootBranchColor(rootChildCount)
      : doc.nodes[parentId]?.style.branchColor ?? getThemeBranchColor(0)

    if (isRootChild) rootChildCount++

    const nodeId = createUUID()
    const node: MindMapNode = {
      id: nodeId,
      parentId,
      text: `<p>${entry.caption}</p>`,
      style: {
        font: { ...DEFAULT_FONT },
        border: { ...DEFAULT_BORDER },
        branchColor,
        lineWidthOffset: 0,
      },
      layout: { offset: { x: 0, y: 0 }, foldChildren: false },
      childrenIds: [],
    }

    doc.nodes[nodeId] = node
    parent.childrenIds.push(nodeId)

    stack[level] = nodeId
    for (let clearLevel = level + 1; clearLevel <= 6; clearLevel++) {
      delete stack[clearLevel]
    }
  }

  // Apply auto-layout
  const positions = computeAutoLayout(doc.rootId, doc.nodes)
  for (const { nodeId, offset } of positions) {
    if (doc.nodes[nodeId]) {
      doc.nodes[nodeId].layout.offset = offset
    }
  }

  doc.title = rootCaption

  return doc
}
