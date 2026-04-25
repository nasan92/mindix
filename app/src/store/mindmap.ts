import { create } from 'zustand'
import { temporal } from 'zundo'
import { immer } from 'zustand/middleware/immer'
import { createUUID } from '../lib/uuid'
import { computeNewChildOffset } from '../lib/geometry'
import { computeAutoLayout } from '../lib/layout'
import { createNewDocument, DEFAULT_FONT, DEFAULT_BORDER } from '../lib/migration'
import { getNextRootBranchColor } from '../lib/color-themes'
import type {
  MindMapDocument,
  MindMapNode,
  NodeStyle,
  Connection,
  AppNotification,
  NotificationKind,
  ClipboardEntry,
  Point,
} from '../types'

// ─── State shape ──────────────────────────────────────────────────────────────

interface MindMapState {
  document: MindMapDocument | null
  selectedNodeIds: string[]
  editingNodeId: string | null
  connectingFromNodeId: string | null
  selectedConnectionId: string | null
  notifications: AppNotification[]
  clipboard: ClipboardEntry | null
  linkedFileHandle: FileSystemFileHandle | null

  // Document
  setDocument: (doc: MindMapDocument | null) => void
  newDocument: () => void

  // Nodes
  createNode: (parentId: string) => string | null
  createSiblingNode: (nodeId: string) => string | null
  deleteNode: (nodeId: string) => void
  moveNode: (nodeId: string, offset: Point) => void
  changeCaption: (nodeId: string, text: string) => void
  setNodeStyle: (nodeId: string, partial: Partial<NodeStyle>) => void
  setChildrenStyle: (nodeId: string, partial: Partial<NodeStyle>) => void
  toggleFold: (nodeId: string) => void
  autoArrange: (rootId?: string) => void

  // Selection
  selectNode: (nodeId: string | null) => void
  selectNodes: (nodeIds: string[]) => void
  toggleNodeSelection: (nodeId: string) => void
  clearSelection: () => void
  setEditingNode: (nodeId: string | null) => void

  // Connections
  addConnection: (conn: Connection) => void
  removeConnection: (id: string) => void
  updateConnection: (id: string, partial: Partial<Connection>) => void
  selectConnection: (id: string | null) => void
  startConnecting: (nodeId: string) => void
  cancelConnecting: () => void

  // Map settings
  setMapBackground: (color: string) => void
  setGridEnabled: (enabled: boolean) => void

  // Clipboard
  copyNode: (nodeId: string) => void
  cutNode: (nodeId: string) => void
  pasteNode: (parentId: string) => void

  // Notifications
  addNotification: (kind: NotificationKind, message: string) => void
  dismissNotification: (id: string) => void

  // Linked file
  setLinkedFileHandle: (handle: FileSystemFileHandle | null) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function collectSubtree(
  nodeId: string,
  nodes: Record<string, MindMapNode>,
): Record<string, MindMapNode> {
  const result: Record<string, MindMapNode> = {}
  function visit(id: string) {
    const n = nodes[id]
    if (!n) return
    result[id] = { ...n, childrenIds: [...n.childrenIds] }
    for (const cid of n.childrenIds) visit(cid)
  }
  visit(nodeId)
  return result
}

function remapSubtree(
  nodeId: string,
  nodes: Record<string, MindMapNode>,
  newParentId: string,
): { nodes: Record<string, MindMapNode>; newRootId: string } {
  const idMap: Record<string, string> = {}
  const remapped: Record<string, MindMapNode> = {}

  function remap(id: string) {
    idMap[id] = createUUID()
    const n = nodes[id]
    if (!n) return
    for (const cid of n.childrenIds) remap(cid)
  }

  function build(id: string, parentId: string | null) {
    const n = nodes[id]
    if (!n) return
    const newId = idMap[id]
    remapped[newId] = {
      ...n,
      id: newId,
      parentId,
      childrenIds: n.childrenIds.map(cid => idMap[cid] ?? cid),
    }
    for (const cid of n.childrenIds) build(cid, newId)
  }

  remap(nodeId)
  build(nodeId, newParentId)
  return { nodes: remapped, newRootId: idMap[nodeId] }
}

function removeSubtreeFromDoc(
  nodeId: string,
  doc: MindMapDocument,
) {
  const node = doc.nodes[nodeId]
  if (!node) return

  // Remove from parent's childrenIds
  if (node.parentId && doc.nodes[node.parentId]) {
    doc.nodes[node.parentId].childrenIds = doc.nodes[node.parentId].childrenIds.filter(
      id => id !== nodeId,
    )
  }

  // Remove all descendants
  function remove(id: string) {
    const n = doc.nodes[id]
    if (!n) return
    for (const cid of n.childrenIds) remove(cid)
    delete doc.nodes[id]
  }
  remove(nodeId)

  // Remove connections referencing deleted nodes
  doc.connections = doc.connections.filter(
    c => doc.nodes[c.fromId] && doc.nodes[c.toId],
  )
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useMindMapStore = create<MindMapState>()(
  temporal(
    immer<MindMapState>((set, get) => ({
      document: null,
      selectedNodeIds: [],
      editingNodeId: null,
      connectingFromNodeId: null,
      selectedConnectionId: null,
      notifications: [],
      clipboard: null,
      linkedFileHandle: null,

      setDocument: (doc) => {
        set(state => {
          state.document = doc
          state.selectedNodeIds = []
          state.editingNodeId = null
          state.connectingFromNodeId = null
          state.selectedConnectionId = null
        })
      },

      newDocument: () => {
        const doc = createNewDocument()
        set(state => {
          state.document = doc
          state.selectedNodeIds = []
          state.editingNodeId = null
          state.connectingFromNodeId = null
          state.selectedConnectionId = null
        })
      },

      createNode: (parentId) => {
        const doc = get().document
        if (!doc) return null
        const parent = doc.nodes[parentId]
        if (!parent) return null

        const isRoot = parent.parentId === null
        const branchColor = isRoot
          ? getNextRootBranchColor(parent.childrenIds.length)
          : parent.style.branchColor

        const offset = computeNewChildOffset(parent, doc.nodes, isRoot)
        const newId = createUUID()

        set(state => {
          if (!state.document) return
          const p = state.document.nodes[parentId]
          if (!p) return
          state.document.nodes[newId] = {
            id: newId,
            parentId,
            text: '<p>New Idea</p>',
            style: {
              font: { ...DEFAULT_FONT },
              border: { ...DEFAULT_BORDER },
              branchColor,
              lineWidthOffset: 0,
            },
            layout: { offset, foldChildren: false },
            childrenIds: [],
          }
          p.childrenIds.push(newId)
          state.editingNodeId = newId
          state.selectedNodeIds = [newId]
        })

        return newId
      },

      createSiblingNode: (nodeId) => {
        const doc = get().document
        if (!doc) return null
        const node = doc.nodes[nodeId]
        if (!node || !node.parentId) return null
        return get().createNode(node.parentId)
      },

      deleteNode: (nodeId) => {
        set(state => {
          if (!state.document) return
          const node = state.document.nodes[nodeId]
          if (!node || !node.parentId) return // don't delete root

          removeSubtreeFromDoc(nodeId, state.document)

          state.selectedNodeIds = state.selectedNodeIds.filter(id => id !== nodeId)
          if (state.editingNodeId === nodeId) state.editingNodeId = null
        })
      },

      moveNode: (nodeId, offset) => {
        set(state => {
          if (!state.document) return
          const node = state.document.nodes[nodeId]
          if (!node) return
          node.layout.offset = offset
        })
      },

      changeCaption: (nodeId, text) => {
        set(state => {
          if (!state.document) return
          const node = state.document.nodes[nodeId]
          if (!node) return
          node.text = text
          // Update document title from root
          if (nodeId === state.document.rootId) {
            const plain = text.replace(/<[^>]+>/g, '').trim()
            state.document.title = plain || state.document.title
          }
        })
      },

      setNodeStyle: (nodeId, partial) => {
        set(state => {
          if (!state.document) return
          const node = state.document.nodes[nodeId]
          if (!node) return
          Object.assign(node.style, partial)
          if (partial.font) Object.assign(node.style.font, partial.font)
          if (partial.border) Object.assign(node.style.border, partial.border)
        })
      },

      setChildrenStyle: (nodeId, partial) => {
        set(state => {
          if (!state.document) return
          function applyToDescendants(id: string) {
            const n = state.document!.nodes[id]
            if (!n) return
            Object.assign(n.style, partial)
            if (partial.font) Object.assign(n.style.font, partial.font)
            if (partial.border) Object.assign(n.style.border, partial.border)
            for (const cid of n.childrenIds) applyToDescendants(cid)
          }
          const root = state.document.nodes[nodeId]
          if (root) {
            for (const cid of root.childrenIds) applyToDescendants(cid)
          }
        })
      },

      toggleFold: (nodeId) => {
        set(state => {
          if (!state.document) return
          const node = state.document.nodes[nodeId]
          if (!node) return
          node.layout.foldChildren = !node.layout.foldChildren
        })
      },

      autoArrange: (rootId) => {
        set(state => {
          if (!state.document) return
          const id = rootId ?? state.document.rootId
          const positions = computeAutoLayout(id, state.document.nodes)
          for (const { nodeId, offset } of positions) {
            const node = state.document.nodes[nodeId]
            if (node) node.layout.offset = offset
          }
        })
      },

      selectNode: (nodeId) => {
        set(state => {
          state.selectedNodeIds = nodeId ? [nodeId] : []
          state.selectedConnectionId = null
        })
      },

      selectNodes: (nodeIds) => {
        set(state => {
          state.selectedNodeIds = nodeIds
        })
      },

      toggleNodeSelection: (nodeId) => {
        set(state => {
          const idx = state.selectedNodeIds.indexOf(nodeId)
          if (idx === -1) {
            state.selectedNodeIds.push(nodeId)
          } else if (state.selectedNodeIds.length > 1) {
            state.selectedNodeIds.splice(idx, 1)
          }
        })
      },

      clearSelection: () => {
        set(state => {
          state.selectedNodeIds = []
          state.selectedConnectionId = null
          state.connectingFromNodeId = null
        })
      },

      setEditingNode: (nodeId) => {
        set(state => {
          state.editingNodeId = nodeId
        })
      },

      addConnection: (conn) => {
        set(state => {
          if (!state.document) return
          // Remove any existing connection between same nodes
          state.document.connections = state.document.connections.filter(
            c => !(
              (c.fromId === conn.fromId && c.toId === conn.toId) ||
              (c.fromId === conn.toId && c.toId === conn.fromId)
            ),
          )
          state.document.connections.push(conn)
          state.connectingFromNodeId = null
        })
      },

      removeConnection: (id) => {
        set(state => {
          if (!state.document) return
          state.document.connections = state.document.connections.filter(c => c.id !== id)
          if (state.selectedConnectionId === id) state.selectedConnectionId = null
        })
      },

      updateConnection: (id, partial) => {
        set(state => {
          if (!state.document) return
          const conn = state.document.connections.find(c => c.id === id)
          if (conn) Object.assign(conn, partial)
        })
      },

      selectConnection: (id) => {
        set(state => {
          state.selectedConnectionId = id
          if (id) state.selectedNodeIds = []
        })
      },

      startConnecting: (nodeId) => {
        set(state => {
          state.connectingFromNodeId = nodeId
        })
      },

      cancelConnecting: () => {
        set(state => {
          state.connectingFromNodeId = null
        })
      },

      setMapBackground: (color) => {
        set(state => {
          if (!state.document) return
          state.document.settings.backgroundColor = color
        })
      },

      setGridEnabled: (enabled) => {
        set(state => {
          if (!state.document) return
          state.document.settings.gridEnabled = enabled
        })
      },

      copyNode: (nodeId) => {
        const doc = get().document
        if (!doc) return
        const subtree = collectSubtree(nodeId, doc.nodes)
        set(state => {
          state.clipboard = { rootNodeId: nodeId, nodes: subtree }
        })
      },

      cutNode: (nodeId) => {
        const doc = get().document
        if (!doc) return
        const node = doc.nodes[nodeId]
        if (!node || !node.parentId) return
        const subtree = collectSubtree(nodeId, doc.nodes)
        set(state => {
          state.clipboard = { rootNodeId: nodeId, nodes: subtree }
          if (!state.document) return
          removeSubtreeFromDoc(nodeId, state.document)
          state.selectedNodeIds = state.selectedNodeIds.filter(id => id !== nodeId)
          if (state.editingNodeId === nodeId) state.editingNodeId = null
        })
      },

      pasteNode: (parentId) => {
        const { clipboard, document: doc } = get()
        if (!clipboard || !doc) return
        const parent = doc.nodes[parentId]
        if (!parent) return

        const { nodes: remapped, newRootId } = remapSubtree(
          clipboard.rootNodeId,
          clipboard.nodes,
          parentId,
        )

        set(state => {
          if (!state.document) return
          Object.assign(state.document.nodes, remapped)
          state.document.nodes[parentId].childrenIds.push(newRootId)
          state.selectedNodeIds = [newRootId]
        })
      },

      addNotification: (kind, message) => {
        const id = createUUID()
        set(state => {
          state.notifications.push({ id, kind, message })
        })
        setTimeout(() => get().dismissNotification(id), 4000)
      },

      dismissNotification: (id) => {
        set(state => {
          state.notifications = state.notifications.filter(n => n.id !== id)
        })
      },

      setLinkedFileHandle: (handle) => {
        set(state => {
          state.linkedFileHandle = handle
        })
      },
    })),
    {
      partialize: (state) => ({ document: state.document }),
      limit: 50,
    },
  ),
)

// Temporal store hook for undo/redo
export const useTemporalStore = <T>(selector: (state: ReturnType<typeof useMindMapStore.temporal.getState>) => T) =>
  useMindMapStore((_state) => selector(useMindMapStore.temporal.getState()))

// Convenience selectors
export const useDocument = () => useMindMapStore(s => s.document)
export const useSelectedNodeId = () => useMindMapStore(s => s.selectedNodeIds[0] ?? null)
export const useSelectedNode = () =>
  useMindMapStore(s => {
    const id = s.selectedNodeIds[0]
    return id && s.document ? s.document.nodes[id] : null
  })
export const useSelectedNodeIds = () => useMindMapStore(s => s.selectedNodeIds)
export const useEditingNodeId = () => useMindMapStore(s => s.editingNodeId)
export const useConnectingFromNodeId = () => useMindMapStore(s => s.connectingFromNodeId)
export const useSelectedConnectionId = () => useMindMapStore(s => s.selectedConnectionId)
export const useNotifications = () => useMindMapStore(s => s.notifications)
export const useClipboard = () => useMindMapStore(s => s.clipboard)
