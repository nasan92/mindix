import { type EdgeProps } from '@xyflow/react'
import type { Connection } from '../../types'

interface ConnectionEdgeData {
  connection: Connection
  isSelected: boolean
}

export function ConnectionEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  id,
}: EdgeProps) {
  const edgeData = data as ConnectionEdgeData | undefined
  const conn = edgeData?.connection
  if (!conn) return null

  const color = conn.color ?? '#1d3557'
  const strokeDash =
    conn.style === 'dashed' ? '6,3' :
    conn.style === 'dotted' ? '2,3' : undefined

  let d: string
  if (conn.shape === 'curved') {
    const dx = (targetX - sourceX) * conn.curve.c1x
    const dy1 = (targetY - sourceY) * conn.curve.c1y
    const dy2 = (targetY - sourceY) * conn.curve.c2y
    d = `M ${sourceX} ${sourceY} C ${sourceX + dx} ${sourceY + dy1}, ${targetX - dx} ${targetY + dy2}, ${targetX} ${targetY}`
  } else {
    d = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
  }

  const markerId = `conn-arrow-${id}`

  return (
    <>
      {conn.arrow > 0 && (
        <defs>
          <marker
            id={markerId}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill={color} />
          </marker>
        </defs>
      )}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={strokeDash}
        markerEnd={conn.arrow > 0 ? `url(#${markerId})` : undefined}
        markerStart={conn.arrow === 2 ? `url(#${markerId})` : undefined}
        className="react-flow__edge-path"
      />
      {edgeData?.isSelected && (
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeOpacity={0.2}
        />
      )}
    </>
  )
}

export default ConnectionEdge
