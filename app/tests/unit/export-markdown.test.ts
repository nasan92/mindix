import { describe, it, expect } from 'vitest'
import { exportMarkdown } from '../../src/lib/export/export-markdown'
import { createNewDocument } from '../../src/lib/migration'
import { createUUID } from '../../src/lib/uuid'
import type { MindMapDocument, MindMapNode } from '../../src/types'
import { DEFAULT_FONT, DEFAULT_BORDER } from '../../src/lib/migration'

function makeDoc(rootCaption: string, children: { caption: string; children?: { caption: string }[] }[] = []): MindMapDocument {
  const doc = createNewDocument()
  const root = doc.nodes[doc.rootId]
  root.text = `<p>${rootCaption}</p>`

  for (const child of children) {
    const childId = createUUID()
    const childNode: MindMapNode = {
      id: childId,
      parentId: doc.rootId,
      text: `<p>${child.caption}</p>`,
      style: { font: { ...DEFAULT_FONT }, border: { ...DEFAULT_BORDER }, branchColor: '#333', lineWidthOffset: 0 },
      layout: { offset: { x: 100, y: 0 }, foldChildren: false },
      childrenIds: [],
    }
    doc.nodes[childId] = childNode
    root.childrenIds.push(childId)

    if (child.children) {
      for (const grandchild of child.children) {
        const gcId = createUUID()
        const gcNode: MindMapNode = {
          id: gcId,
          parentId: childId,
          text: `<p>${grandchild.caption}</p>`,
          style: { font: { ...DEFAULT_FONT }, border: { ...DEFAULT_BORDER }, branchColor: '#333', lineWidthOffset: 0 },
          layout: { offset: { x: 100, y: 0 }, foldChildren: false },
          childrenIds: [],
        }
        doc.nodes[gcId] = gcNode
        childNode.childrenIds.push(gcId)
      }
    }
  }

  return doc
}

describe('exportMarkdown', () => {
  it('root only produces a single h1', () => {
    const md = exportMarkdown(makeDoc('My Map'))
    expect(md).toBe('# My Map')
  })

  it('root with branches produces h2 entries', () => {
    const md = exportMarkdown(makeDoc('Root', [{ caption: 'Branch A' }, { caption: 'Branch B' }]))
    const lines = md.split('\n')
    expect(lines[0]).toBe('# Root')
    expect(lines).toContain('## Branch A')
    expect(lines).toContain('## Branch B')
  })

  it('blank line separates top-level branches', () => {
    const md = exportMarkdown(makeDoc('Root', [{ caption: 'A' }, { caption: 'B' }]))
    const lines = md.split('\n')
    const bIdx = lines.indexOf('## B')
    expect(lines[bIdx - 1]).toBe('')
  })

  it('nested 3 levels uses correct heading depths', () => {
    const md = exportMarkdown(makeDoc('Root', [{ caption: 'L2', children: [{ caption: 'L3' }] }]))
    expect(md).toContain('## L2')
    expect(md).toContain('### L3')
  })

  it('output does not end with a trailing newline', () => {
    const md = exportMarkdown(makeDoc('Root', [{ caption: 'Branch' }]))
    expect(md.endsWith('\n')).toBe(false)
  })

  it('special characters are preserved', () => {
    const md = exportMarkdown(makeDoc('Title: Ideas & More'))
    expect(md).toContain('# Title: Ideas & More')
  })
})
