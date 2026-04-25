import { describe, it, expect } from 'vitest'
import { importMarkdown } from '../../src/lib/export/import-markdown'

describe('importMarkdown', () => {
  it('parses a simple h1/h2 structure', () => {
    const md = `# Central\n\n## Branch A\n\n## Branch B`
    const doc = importMarkdown(md)
    const root = doc.nodes[doc.rootId]
    expect(root.text).toContain('Central')
    expect(root.childrenIds).toHaveLength(2)
  })

  it('sets the document title from the root caption', () => {
    const md = `# My Map\n\n## Topic`
    const doc = importMarkdown(md)
    expect(doc.title).toBe('My Map')
  })

  it('creates nested nodes for h3', () => {
    const md = `# Root\n\n## Branch\n\n### Sub`
    const doc = importMarkdown(md)
    const root = doc.nodes[doc.rootId]
    const branch = doc.nodes[root.childrenIds[0]]
    expect(branch).toBeDefined()
    expect(branch.childrenIds).toHaveLength(1)
    const sub = doc.nodes[branch.childrenIds[0]]
    expect(sub.text).toContain('Sub')
  })

  it('throws if no h1 heading found', () => {
    expect(() => importMarkdown('## Only h2')).toThrow()
  })

  it('throws on empty input', () => {
    expect(() => importMarkdown('')).toThrow()
  })

  it('creates nodes with branch colors from theme', () => {
    const md = `# Root\n\n## Branch A\n\n## Branch B`
    const doc = importMarkdown(md)
    const root = doc.nodes[doc.rootId]
    const childA = doc.nodes[root.childrenIds[0]]
    const childB = doc.nodes[root.childrenIds[1]]
    expect(childA.style.branchColor).not.toBe(childB.style.branchColor)
  })

  it('applies auto-layout so children have non-zero offsets', () => {
    const md = `# Root\n\n## Branch A\n\n## Branch B`
    const doc = importMarkdown(md)
    const root = doc.nodes[doc.rootId]
    const child = doc.nodes[root.childrenIds[0]]
    const { x, y } = child.layout.offset
    expect(x !== 0 || y !== 0).toBe(true)
  })

  it('handles list items under a heading', () => {
    const md = `# Root\n\n## Branch\n\n- Item 1\n- Item 2`
    const doc = importMarkdown(md)
    const root = doc.nodes[doc.rootId]
    const branch = doc.nodes[root.childrenIds[0]]
    expect(branch.childrenIds.length).toBeGreaterThanOrEqual(2)
  })
})
