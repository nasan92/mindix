import type { MindMapNode, Point } from '../types'

export function computeAbsolutePositions(
  nodes: Record<string, MindMapNode>,
  rootId: string,
): Record<string, Point> {
  const result: Record<string, Point> = {}

  function visit(nodeId: string, base: Point) {
    const node = nodes[nodeId]
    if (!node) return
    const abs: Point = { x: base.x + node.layout.offset.x, y: base.y + node.layout.offset.y }
    result[nodeId] = abs
    for (const childId of node.childrenIds) {
      visit(childId, abs)
    }
  }

  visit(rootId, { x: 0, y: 0 })
  return result
}

// Returns the offset a newly created child node should have relative to its parent.
export function computeNewChildOffset(
  parent: MindMapNode,
  nodes: Record<string, MindMapNode>,
  isRoot: boolean,
): Point {
  if (isRoot) {
    const side = parent.childrenIds.length % 2 === 0 ? 1 : -1
    const xMag = 100 + Math.random() * 200
    const y = (Math.random() - 0.5) * 300
    return { x: side * xMag, y }
  }

  const siblings = parent.childrenIds
    .map(id => nodes[id])
    .filter((n): n is MindMapNode => !!n)

  const side = parent.layout.offset.x >= 0 ? 1 : -1

  if (siblings.length === 0) {
    return { x: 150 * side, y: 0 }
  }

  const lastSibling = siblings[siblings.length - 1]
  return {
    x: Math.abs(lastSibling.layout.offset.x) * side,
    y: lastSibling.layout.offset.y + 60,
  }
}

// Keyboard navigation: find a node "above" the current one by absolute position.
export function findNodeUp(
  nodeId: string,
  nodes: Record<string, MindMapNode>,
  rootId: string,
): string | null {
  return findNodeInDirection(nodeId, nodes, rootId, 'up')
}

export function findNodeDown(
  nodeId: string,
  nodes: Record<string, MindMapNode>,
  rootId: string,
): string | null {
  return findNodeInDirection(nodeId, nodes, rootId, 'down')
}

export function findNodeLeft(
  nodeId: string,
  nodes: Record<string, MindMapNode>,
  rootId: string,
): string | null {
  return findNodeInDirection(nodeId, nodes, rootId, 'left')
}

export function findNodeRight(
  nodeId: string,
  nodes: Record<string, MindMapNode>,
  rootId: string,
): string | null {
  return findNodeInDirection(nodeId, nodes, rootId, 'right')
}

function findNodeInDirection(
  nodeId: string,
  nodes: Record<string, MindMapNode>,
  rootId: string,
  dir: 'up' | 'down' | 'left' | 'right',
): string | null {
  const absPositions = computeAbsolutePositions(nodes, rootId)
  const current = absPositions[nodeId]
  if (!current) return null

  let best: string | null = null
  let bestDist = Infinity

  for (const [id, pos] of Object.entries(absPositions)) {
    if (id === nodeId) continue
    const dx = pos.x - current.x
    const dy = pos.y - current.y

    let qualifies = false
    if (dir === 'up' && dy < -10 && Math.abs(dy) > Math.abs(dx)) qualifies = true
    if (dir === 'down' && dy > 10 && Math.abs(dy) > Math.abs(dx)) qualifies = true
    if (dir === 'left' && dx < -10 && Math.abs(dx) > Math.abs(dy)) qualifies = true
    if (dir === 'right' && dx > 10 && Math.abs(dx) > Math.abs(dy)) qualifies = true

    if (qualifies) {
      const dist = Math.hypot(dx, dy)
      if (dist < bestDist) {
        bestDist = dist
        best = id
      }
    }
  }

  return best
}
