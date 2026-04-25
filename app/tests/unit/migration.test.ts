import { describe, it, expect } from 'vitest'
import { createNewDocument, serializeDocument, parseDocument } from '../../src/lib/migration'

describe('createNewDocument', () => {
  it('creates a document with a root node', () => {
    const doc = createNewDocument()
    expect(doc.rootId).toBeTruthy()
    expect(doc.nodes[doc.rootId]).toBeDefined()
    expect(doc.nodes[doc.rootId].parentId).toBeNull()
  })

  it('creates unique IDs on each call', () => {
    const doc1 = createNewDocument()
    const doc2 = createNewDocument()
    expect(doc1.id).not.toBe(doc2.id)
    expect(doc1.rootId).not.toBe(doc2.rootId)
  })
})

describe('parseDocument / serializeDocument round-trip', () => {
  it('round-trips a new document', () => {
    const doc = createNewDocument()
    const json = serializeDocument(doc)
    const parsed = parseDocument(json)
    expect(parsed).not.toBeNull()
    expect(parsed!.id).toBe(doc.id)
    expect(parsed!.rootId).toBe(doc.rootId)
  })

  it('returns null for invalid JSON', () => {
    expect(parseDocument('not json')).toBeNull()
  })
})

describe('old format migration', () => {
  it('migrates old-format document with pluginData', () => {
    const rootId = 'root-001'
    const childId = 'child-001'
    const oldDoc = {
      id: 'doc-001',
      title: 'Migrated Doc',
      mindmap: {
        root: {
          id: rootId,
          text: { caption: 'Root Node' },
          children: [
            {
              id: childId,
              text: { caption: 'Child Node' },
              children: [],
            },
          ],
        },
      },
      dates: { created: 1000000, modified: null },
      dimensions: { x: 16000, y: 8000 },
      pluginData: {
        style: {
          [rootId]: { font: { size: 20, color: '#ff0000', style: 'normal', weight: 'bold', decoration: 'none', align: 'center', fontfamily: 'serif' }, border: { visible: false, style: 'none', color: '#fff', background: '#fff' }, branchColor: '#ff0000', lineWidthOffset: 2 },
          [childId]: { font: { size: 15, color: '#000', style: 'normal', weight: 'normal', decoration: 'none', align: 'center', fontfamily: 'sans-serif' }, border: { visible: false, style: 'none', color: '#fff', background: '#fff' }, branchColor: '#333', lineWidthOffset: 0 },
        },
        layout: {
          [rootId]: { offset: { x: 0, y: 0 }, foldChildren: false },
          [childId]: { offset: { x: 150, y: -30 }, foldChildren: false },
        },
      },
      cnodes: [],
    }

    const json = JSON.stringify(oldDoc)
    const doc = parseDocument(json)
    expect(doc).not.toBeNull()
    expect(doc!.rootId).toBe(rootId)
    expect(doc!.nodes[rootId]).toBeDefined()
    expect(doc!.nodes[rootId].style.font.size).toBe(20)
    expect(doc!.nodes[childId].layout.offset.x).toBe(150)
    expect(doc!.nodes[rootId].childrenIds).toContain(childId)
  })
})
