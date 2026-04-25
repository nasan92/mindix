import { useCallback, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  type OnNodeDrag,
  ReactFlowProvider,
} from '@xyflow/react'
import { useMindMapStore } from '../../store/mindmap'
import { computeAbsolutePositions } from '../../lib/geometry'
import type { Point } from '../../types'
import { MindMapNode } from './MindMapNode'
import { BranchEdge } from './BranchEdge'
import { ConnectionEdge } from './ConnectionEdge'

const nodeTypes = { mindMapNode: MindMapNode }
const edgeTypes = { branch: BranchEdge, connection: ConnectionEdge }

function Canvas() {
  const store = useMindMapStore()
  const { setNodes } = useReactFlow()
  const doc = store.document
  const selectedNodeIds = store.selectedNodeIds
  const editingNodeId = store.editingNodeId
  const connectingFromNodeId = store.connectingFromNodeId
  const selectedConnectionId = store.selectedConnectionId

  const absPositions = useMemo(() => {
    if (!doc) return {}
    return computeAbsolutePositions(doc.nodes, doc.rootId)
  }, [doc])

  // Snapshot of abs positions at drag start — used to move descendants in sync
  const dragStartSnapshot = useRef<Record<string, Point>>({})

  // Build React Flow nodes from document
  const rfNodes: Node[] = useMemo(() => {
    if (!doc) return []
    const rootAbsX = absPositions[doc.rootId]?.x ?? 0
    return Object.values(doc.nodes)
      .filter(node => {
        // Filter out folded subtrees
        if (!node.parentId) return true
        let current = doc.nodes[node.parentId]
        while (current) {
          if (current.layout.foldChildren) return false
          if (!current.parentId) break
          current = doc.nodes[current.parentId]
        }
        return true
      })
      .map(node => {
        const absPos = absPositions[node.id] ?? { x: 0, y: 0 }
        const isLeftSide = node.id !== doc.rootId && absPos.x < rootAbsX
        return {
          id: node.id,
          type: 'mindMapNode',
          position: absPos,
          data: {
            node,
            isEditing: editingNodeId === node.id,
            isSelected: selectedNodeIds.includes(node.id),
            isConnecting: !!connectingFromNodeId,
            isLeftSide,
          },
          draggable: !editingNodeId,
          selectable: false, // we manage selection ourselves
        }
      })
  }, [doc, absPositions, editingNodeId, selectedNodeIds, connectingFromNodeId])

  // Build React Flow edges from document
  const rfEdges: Edge[] = useMemo(() => {
    if (!doc) return []

    const visibleNodeIds = new Set(rfNodes.map(n => n.id))

    const branchEdges: Edge[] = Object.values(doc.nodes)
      .filter(node => node.parentId && visibleNodeIds.has(node.id) && visibleNodeIds.has(node.parentId))
      .map(node => {
        const childX = absPositions[node.id]?.x ?? 0
        const parentX = absPositions[node.parentId!]?.x ?? 0
        const childIsLeft = childX < parentX
        return {
          id: `branch-${node.id}`,
          type: 'branch',
          source: node.parentId!,
          target: node.id,
          sourceHandle: childIsLeft ? 'source-left' : 'source-right',
          targetHandle: childIsLeft ? 'target-right' : 'target-left',
          data: {
            branchColor: node.style.branchColor,
            lineWidthOffset: node.style.lineWidthOffset,
          },
          selectable: false,
        }
      })

    const connectionEdges: Edge[] = doc.connections
      .filter(c => visibleNodeIds.has(c.fromId) && visibleNodeIds.has(c.toId))
      .map(conn => ({
        id: `conn-${conn.id}`,
        type: 'connection',
        source: conn.fromId,
        target: conn.toId,
        data: {
          connection: conn,
          isSelected: selectedConnectionId === conn.id,
        },
        selectable: false,
      }))

    return [...branchEdges, ...connectionEdges]
  }, [doc, rfNodes, selectedConnectionId])

  const onNodeDragStart: OnNodeDrag = useCallback(
    (_, node) => {
      // Snapshot positions so descendants can be moved in lockstep during drag
      dragStartSnapshot.current = { ...absPositions, __dragged__: { ...node.position } }
    },
    [absPositions],
  )

  const onNodeDrag: OnNodeDrag = useCallback(
    (_, node) => {
      if (!doc) return
      const snapshot = dragStartSnapshot.current
      const startPos = snapshot['__dragged__']
      if (!startPos) return

      const delta = { x: node.position.x - startPos.x, y: node.position.y - startPos.y }

      // Collect IDs of all descendants of the dragged node
      const descendants = new Set<string>()
      const collectDescendants = (id: string) => {
        const n = doc.nodes[id]
        if (!n) return
        for (const cid of n.childrenIds) {
          descendants.add(cid)
          collectDescendants(cid)
        }
      }
      collectDescendants(node.id)
      if (descendants.size === 0) return

      setNodes(nds =>
        nds.map(n => {
          if (!descendants.has(n.id)) return n
          const orig = snapshot[n.id]
          if (!orig) return n
          return { ...n, position: { x: orig.x + delta.x, y: orig.y + delta.y } }
        }),
      )
    },
    [doc, setNodes],
  )

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_, node) => {
      if (!doc) return
      const docNode = doc.nodes[node.id]
      if (!docNode) return

      // Convert absolute position back to relative offset
      let parentAbs = { x: 0, y: 0 }
      if (docNode.parentId) {
        parentAbs = absPositions[docNode.parentId] ?? { x: 0, y: 0 }
      }

      const newOffset = {
        x: node.position.x - parentAbs.x,
        y: node.position.y - parentAbs.y,
      }

      store.moveNode(node.id, newOffset)
    },
    [doc, absPositions, store],
  )

  const onPaneClick = useCallback(() => {
    if (store.editingNodeId) {
      store.setEditingNode(null)
    } else {
      store.clearSelection()
    }
  }, [store])

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (edge.type === 'connection') {
        const connId = edge.id.replace('conn-', '')
        store.selectConnection(connId)
      }
    },
    [store],
  )

  const bgColor = doc?.settings.backgroundColor ?? '#ffffff'
  const gridEnabled = doc?.settings.gridEnabled ?? false

  return (
    <div style={{ width: '100%', height: '100%', background: bgColor }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        onEdgeClick={onEdgeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={4}
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
      >
        {gridEnabled && (
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d1d5db" />
        )}
        <MiniMap zoomable pannable nodeColor={n => {
          const docNode = doc?.nodes[n.id]
          return docNode?.style.branchColor ?? '#94a3b8'
        }} />
      </ReactFlow>
    </div>
  )
}

export function MindMapCanvas() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  )
}

export default MindMapCanvas
