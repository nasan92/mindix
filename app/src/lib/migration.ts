import type {
  MindMapDocument,
  MindMapNode,
  NodeStyle,
  NodeFont,
  NodeBorder,
  NodeLayout,
  Connection,
  MapSettings,
  Point,
} from '../types'
import { createUUID } from './uuid'

// ─── Default values ───────────────────────────────────────────────────────────

export const DEFAULT_FONT: NodeFont = {
  style: 'normal',
  weight: 'normal',
  decoration: 'none',
  align: 'center',
  fontfamily: 'sans-serif',
  size: 15,
  color: '#000000',
}

export const DEFAULT_BORDER: NodeBorder = {
  visible: false,
  style: 'none',
  color: '#ffffff',
  background: '#ffffff',
}

export const DEFAULT_STYLE: NodeStyle = {
  font: { ...DEFAULT_FONT },
  border: { ...DEFAULT_BORDER },
  branchColor: '#333399',
  lineWidthOffset: 0,
}

export const DEFAULT_LAYOUT: NodeLayout = {
  offset: { x: 0, y: 0 },
  foldChildren: false,
}

// ─── New document factory ─────────────────────────────────────────────────────

export function createNewDocument(): MindMapDocument {
  const rootId = createUUID()
  const docId = createUUID()
  const root: MindMapNode = {
    id: rootId,
    parentId: null,
    text: '<p>Central Idea</p>',
    style: { ...DEFAULT_STYLE, branchColor: '#333399' },
    layout: { offset: { x: 0, y: 0 }, foldChildren: false },
    childrenIds: [],
  }
  return {
    id: docId,
    title: 'New Document',
    rootId,
    nodes: { [rootId]: root },
    connections: [],
    settings: { backgroundColor: '#ffffff', gridEnabled: false },
    createdAt: Date.now(),
    modifiedAt: null,
    dimensions: { x: 16000, y: 8000 },
  }
}

// ─── Serialize / deserialize new format ──────────────────────────────────────

export function serializeDocument(doc: MindMapDocument): string {
  return JSON.stringify(doc)
}

export function parseDocument(json: string): MindMapDocument | null {
  try {
    const obj = JSON.parse(json)
    // Try new format first
    if (obj.rootId && obj.nodes) {
      return obj as MindMapDocument
    }
    // Try old format migration
    if (obj.mindmap && obj.mindmap.root) {
      return migrateOldDocument(obj)
    }
    return null
  } catch {
    return null
  }
}

// ─── Old → New format migration ───────────────────────────────────────────────

interface OldNode {
  id: string
  text: { caption: string }
  children: OldNode[]
  pluginData?: Record<string, Record<string, unknown>>
  parentId?: string
}

interface OldDocument {
  id: string
  title?: string
  mindmap: { root: OldNode }
  dates?: { created?: number; modified?: number | null }
  dimensions?: Point
  pluginData?: {
    style?: Record<string, {
      font?: Partial<NodeFont>
      border?: Partial<NodeBorder>
      branchColor?: string
      lineWidthOffset?: number
    }>
    layout?: Record<string, {
      offset?: Point
      foldChildren?: boolean
    }>
    canvas?: Record<string, {
      background?: { gridEnabled?: boolean; color?: string }
    }>
  }
  cnodes?: OldCnode[]
}

interface OldCnode {
  from?: string
  to?: string
  style?: string
  color?: string
  arrow?: number
  shape?: string
  toAnchorX?: number | null
  toAnchorY?: number | null
  fromAnchorX?: number | null
  fromAnchorY?: number | null
  curve1T?: number | null
  curve1N?: number | null
  curve2T?: number | null
  curve2N?: number | null
  curveLinked?: boolean
}

function captionToHtml(caption: string): string {
  if (!caption) return '<p></p>'
  return caption
    .split('\n')
    .map(line => `<p>${line === '' ? '<br>' : escapeHtml(line)}</p>`)
    .join('')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function migrateOldDocument(old: OldDocument): MindMapDocument {
  const styleMap = old.pluginData?.style ?? {}
  const layoutMap = old.pluginData?.layout ?? {}

  // Get map settings from the root node's canvas pluginData
  let settings: MapSettings = { backgroundColor: '#ffffff', gridEnabled: false }
  if (old.pluginData?.canvas) {
    const canvasEntries = Object.values(old.pluginData.canvas)
    if (canvasEntries.length > 0) {
      const bg = canvasEntries[0]?.background
      if (bg) {
        settings = {
          backgroundColor: typeof bg.color === 'string' ? bg.color : '#ffffff',
          gridEnabled: !!bg.gridEnabled,
        }
      }
    }
  }

  const nodes: Record<string, MindMapNode> = {}

  function visitOldNode(oldNode: OldNode, parentId: string | null): string {
    const id = oldNode.id
    const styleData = styleMap[id] ?? {}
    const layoutData = layoutMap[id] ?? {}

    const font: NodeFont = {
      ...DEFAULT_FONT,
      ...(styleData.font ?? {}),
    }
    const border: NodeBorder = {
      ...DEFAULT_BORDER,
      ...(styleData.border ?? {}),
    }

    const offset: Point = layoutData.offset
      ? { x: Number(layoutData.offset.x) || 0, y: Number(layoutData.offset.y) || 0 }
      : { x: 0, y: 0 }

    const childrenIds = (oldNode.children ?? []).map(child => visitOldNode(child, id))

    nodes[id] = {
      id,
      parentId,
      text: captionToHtml(oldNode.text?.caption ?? ''),
      style: {
        font,
        border,
        branchColor: typeof styleData.branchColor === 'string' ? styleData.branchColor : '#333399',
        lineWidthOffset: typeof styleData.lineWidthOffset === 'number' ? styleData.lineWidthOffset : 0,
      },
      layout: {
        offset,
        foldChildren: !!layoutData.foldChildren,
      },
      childrenIds,
    }

    return id
  }

  const rootId = visitOldNode(old.mindmap.root, null)

  const connections: Connection[] = (old.cnodes ?? [])
    .filter(c => c.from && c.to)
    .map(c => ({
      id: createUUID(),
      fromId: c.from!,
      toId: c.to!,
      style: (c.style === 'solid' || c.style === 'dashed' || c.style === 'dotted') ? c.style : 'solid',
      shape: c.shape === 'curved' ? 'curved' : 'straight',
      color: typeof c.color === 'string' ? c.color : '#1d3557',
      arrow: (c.arrow === 0 || c.arrow === 1 || c.arrow === 2) ? c.arrow : 0,
      fromAnchor: {
        x: typeof c.fromAnchorX === 'number' ? c.fromAnchorX : 0.5,
        y: typeof c.fromAnchorY === 'number' ? c.fromAnchorY : 0.5,
      },
      toAnchor: {
        x: typeof c.toAnchorX === 'number' ? c.toAnchorX : 0.5,
        y: typeof c.toAnchorY === 'number' ? c.toAnchorY : 0.5,
      },
      curve: {
        c1x: typeof c.curve1T === 'number' ? c.curve1T : 0.28,
        c1y: typeof c.curve1N === 'number' ? c.curve1N : 0.22,
        c2x: typeof c.curve2T === 'number' ? c.curve2T : 0.72,
        c2y: typeof c.curve2N === 'number' ? c.curve2N : -0.22,
      },
    }))

  return {
    id: old.id ?? createUUID(),
    title: old.title ?? 'Untitled',
    rootId,
    nodes,
    connections,
    settings,
    createdAt: old.dates?.created ?? Date.now(),
    modifiedAt: old.dates?.modified ?? null,
    dimensions: old.dimensions ?? { x: 16000, y: 8000 },
  }
}
