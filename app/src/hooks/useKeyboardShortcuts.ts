import { useHotkeys } from 'react-hotkeys-hook'
import { useMindMapStore } from '../store/mindmap'
import { findNodeUp, findNodeDown, findNodeLeft, findNodeRight } from '../lib/geometry'

export function useKeyboardShortcuts() {
  const store = useMindMapStore()
  const { document: doc, selectedNodeIds, editingNodeId } = store

  const selectedNodeId = selectedNodeIds[0] ?? null
  const hasSelection = !!selectedNodeId && !editingNodeId
  const hasDoc = !!doc

  // Create child (Tab)
  useHotkeys(
    'tab',
    (e) => {
      e.preventDefault()
      if (!selectedNodeId) return
      store.createNode(selectedNodeId)
    },
    { enabled: hasSelection && hasDoc },
    [selectedNodeId, hasDoc],
  )

  // Create sibling (Enter)
  useHotkeys(
    'enter',
    (e) => {
      e.preventDefault()
      if (!selectedNodeId) return
      store.createSiblingNode(selectedNodeId)
    },
    { enabled: hasSelection && hasDoc },
    [selectedNodeId, hasDoc],
  )

  // Delete node
  useHotkeys(
    'delete,backspace',
    (e) => {
      e.preventDefault()
      if (!selectedNodeId) return
      const node = doc?.nodes[selectedNodeId]
      if (node?.parentId === null) return // don't delete root
      store.deleteNode(selectedNodeId)
    },
    { enabled: hasSelection && hasDoc },
    [selectedNodeId, hasDoc],
  )

  // Undo
  useHotkeys(
    'mod+z',
    (e) => {
      e.preventDefault()
      useMindMapStore.temporal.getState().undo()
    },
    { enabled: hasDoc },
    [hasDoc],
  )

  // Redo
  useHotkeys(
    'mod+y,mod+shift+z',
    (e) => {
      e.preventDefault()
      useMindMapStore.temporal.getState().redo()
    },
    { enabled: hasDoc },
    [hasDoc],
  )

  // Copy
  useHotkeys(
    'mod+c',
    (e) => {
      e.preventDefault()
      if (selectedNodeId) store.copyNode(selectedNodeId)
    },
    { enabled: hasSelection },
    [selectedNodeId],
  )

  // Cut
  useHotkeys(
    'mod+x',
    (e) => {
      e.preventDefault()
      if (selectedNodeId) {
        const node = doc?.nodes[selectedNodeId]
        if (node?.parentId !== null) store.cutNode(selectedNodeId)
      }
    },
    { enabled: hasSelection },
    [selectedNodeId],
  )

  // Paste
  useHotkeys(
    'mod+v',
    (e) => {
      e.preventDefault()
      if (selectedNodeId) store.pasteNode(selectedNodeId)
    },
    { enabled: hasSelection && !!store.clipboard },
    [selectedNodeId, store.clipboard],
  )

  // Edit (F2)
  useHotkeys(
    'f2',
    (e) => {
      e.preventDefault()
      if (selectedNodeId) store.setEditingNode(selectedNodeId)
    },
    { enabled: hasSelection },
    [selectedNodeId],
  )

  // Escape
  useHotkeys(
    'escape',
    () => {
      if (editingNodeId) {
        store.setEditingNode(null)
      } else if (store.connectingFromNodeId) {
        store.cancelConnecting()
      } else {
        store.clearSelection()
      }
    },
    {},
    [editingNodeId, store.connectingFromNodeId],
  )

  // Arrow key navigation
  useHotkeys(
    'up',
    (e) => {
      e.preventDefault()
      if (!selectedNodeId || !doc) return
      const next = findNodeUp(selectedNodeId, doc.nodes, doc.rootId)
      if (next) store.selectNode(next)
    },
    { enabled: hasSelection && hasDoc },
    [selectedNodeId, hasDoc],
  )

  useHotkeys(
    'down',
    (e) => {
      e.preventDefault()
      if (!selectedNodeId || !doc) return
      const next = findNodeDown(selectedNodeId, doc.nodes, doc.rootId)
      if (next) store.selectNode(next)
    },
    { enabled: hasSelection && hasDoc },
    [selectedNodeId, hasDoc],
  )

  useHotkeys(
    'left',
    (e) => {
      e.preventDefault()
      if (!selectedNodeId || !doc) return
      const next = findNodeLeft(selectedNodeId, doc.nodes, doc.rootId)
      if (next) store.selectNode(next)
    },
    { enabled: hasSelection && hasDoc },
    [selectedNodeId, hasDoc],
  )

  useHotkeys(
    'right',
    (e) => {
      e.preventDefault()
      if (!selectedNodeId || !doc) return
      const next = findNodeRight(selectedNodeId, doc.nodes, doc.rootId)
      if (next) store.selectNode(next)
    },
    { enabled: hasSelection && hasDoc },
    [selectedNodeId, hasDoc],
  )
}
