// ─── Primitives ──────────────────────────────────────────────────────────────

export interface Point {
  x: number
  y: number
}

// ─── Node styling ─────────────────────────────────────────────────────────────

export interface NodeFont {
  style: 'normal' | 'italic'
  weight: 'normal' | 'bold'
  decoration: 'none' | 'underline' | 'line-through'
  align: 'left' | 'center' | 'right'
  fontfamily: string
  size: number
  color: string
}

export interface NodeBorder {
  visible: boolean
  style: 'none' | 'solid' | 'dashed' | 'dotted'
  color: string
  background: string
}

export interface NodeStyle {
  font: NodeFont
  border: NodeBorder
  branchColor: string
  lineWidthOffset: number
}

export interface NodeLayout {
  offset: Point
  foldChildren: boolean
}

// ─── Node ────────────────────────────────────────────────────────────────────

export interface MindMapNode {
  id: string
  parentId: string | null
  text: string // rich text HTML from TipTap
  style: NodeStyle
  layout: NodeLayout
  childrenIds: string[]
}

// ─── Connection (cnode) ────────────────────────────────────────────────────────

export type ConnectionStyle = 'solid' | 'dashed' | 'dotted'
export type ConnectionShape = 'curved' | 'straight'
export type ConnectionArrow = 0 | 1 | 2 // 0=none, 1=end, 2=both

export interface ConnectionAnchor {
  x: number
  y: number
}

export interface ConnectionCurve {
  c1x: number
  c1y: number
  c2x: number
  c2y: number
}

export interface Connection {
  id: string
  fromId: string
  toId: string
  style: ConnectionStyle
  shape: ConnectionShape
  color: string
  arrow: ConnectionArrow
  fromAnchor: ConnectionAnchor
  toAnchor: ConnectionAnchor
  curve: ConnectionCurve
}

// ─── Map settings ─────────────────────────────────────────────────────────────

export interface MapSettings {
  backgroundColor: string
  gridEnabled: boolean
}

// ─── Document ────────────────────────────────────────────────────────────────

export interface MindMapDocument {
  id: string
  title: string
  rootId: string
  nodes: Record<string, MindMapNode>
  connections: Connection[]
  settings: MapSettings
  createdAt: number // Unix ms
  modifiedAt: number | null
  dimensions: Point
}

// ─── Color theme ──────────────────────────────────────────────────────────────

export interface ColorTheme {
  label: string
  branch: string[]
  border: string[]
  background: string[]
  connect: string[]
  font: string[]
}

export type ThemeName = 'classic' | 'rainbow' | 'vintage'

// ─── Storage ──────────────────────────────────────────────────────────────────

export interface StoredDocument {
  id: string
  data: string // JSON serialized MindMapDocument
  modifiedAt: number
}

// ─── App notification ─────────────────────────────────────────────────────────

export type NotificationKind = 'info' | 'warn' | 'error'

export interface AppNotification {
  id: string
  kind: NotificationKind
  message: string
}

// ─── Clipboard ────────────────────────────────────────────────────────────────

export interface ClipboardEntry {
  rootNodeId: string
  nodes: Record<string, MindMapNode>
}
