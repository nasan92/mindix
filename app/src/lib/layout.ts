import type { MindMapNode, Point } from '../types'

const NODE_HEIGHT = 50
const CHILD_GAP = 22
const ROOT_X = 260
const LEVEL_X = 200

function getSubtreeHeight(nodeId: string, nodes: Record<string, MindMapNode>): number {
  const node = nodes[nodeId]
  if (!node || node.childrenIds.length === 0) return NODE_HEIGHT

  let total = 0
  for (const childId of node.childrenIds) {
    total += getSubtreeHeight(childId, nodes)
  }
  total += CHILD_GAP * (node.childrenIds.length - 1)
  return total
}

interface LayoutEntry {
  nodeId: string
  offset: Point
}

export function computeAutoLayout(
  rootId: string,
  nodes: Record<string, MindMapNode>,
): LayoutEntry[] {
  const positions: LayoutEntry[] = []
  const root = nodes[rootId]
  if (!root) return positions

  function layoutSubtree(nodeId: string, direction: number) {
    const node = nodes[nodeId]
    if (!node || node.childrenIds.length === 0) return

    const heights = node.childrenIds.map(id => getSubtreeHeight(id, nodes))
    const total = heights.reduce((a, b) => a + b, 0) + CHILD_GAP * (node.childrenIds.length - 1)
    let y = -total / 2

    node.childrenIds.forEach((childId, i) => {
      const center = y + heights[i] / 2
      positions.push({ nodeId: childId, offset: { x: direction * LEVEL_X, y: center } })
      y += heights[i] + CHILD_GAP
      layoutSubtree(childId, direction)
    })
  }

  const children = root.childrenIds
  const rightGroup = children.filter((_, i) => i % 2 === 0)
  const leftGroup = children.filter((_, i) => i % 2 !== 0)

  function placeGroup(group: string[], direction: number) {
    if (!group.length) return
    const heights = group.map(id => getSubtreeHeight(id, nodes))
    const total = heights.reduce((a, b) => a + b, 0) + CHILD_GAP * (group.length - 1)
    let y = -total / 2

    group.forEach((childId, i) => {
      const center = y + heights[i] / 2
      positions.push({ nodeId: childId, offset: { x: direction * ROOT_X, y: center } })
      y += heights[i] + CHILD_GAP
      layoutSubtree(childId, direction)
    })
  }

  placeGroup(rightGroup, 1)
  placeGroup(leftGroup, -1)

  return positions
}
