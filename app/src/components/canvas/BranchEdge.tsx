import { type EdgeProps } from '@xyflow/react'

interface BranchEdgeData {
  branchColor: string
  lineWidthOffset: number
}

export function BranchEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  const edgeData = data as BranchEdgeData | undefined
  const color = edgeData?.branchColor ?? '#333399'
  const lineWidth = Math.max(1, 3 + (edgeData?.lineWidthOffset ?? 0))

  // Use signed control points so left-side branches curve correctly
  const dx = Math.abs(targetX - sourceX) * 0.5
  const goingRight = targetX >= sourceX
  const c1x = goingRight ? sourceX + dx : sourceX - dx
  const c2x = goingRight ? targetX - dx : targetX + dx
  const d = `M ${sourceX} ${sourceY} C ${c1x} ${sourceY}, ${c2x} ${targetY}, ${targetX} ${targetY}`

  return (
    <path
      d={d}
      fill="none"
      // Use style (not SVG presentation attributes) so React Flow's CSS doesn't override the color
      style={{ stroke: color, strokeWidth: lineWidth, strokeLinecap: 'round' }}
      className="react-flow__edge-path"
    />
  )
}

export default BranchEdge
