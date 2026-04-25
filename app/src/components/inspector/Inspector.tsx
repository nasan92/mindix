import { useMindMapStore, useSelectedNodeId, useSelectedConnectionId } from '../../store/mindmap'
import { TextPanel } from './TextPanel'
import { BranchPanel } from './BranchPanel'
import { NodePanel } from './NodePanel'
import { ConnectionPanel } from './ConnectionPanel'
import { MapPanel } from './MapPanel'

export function Inspector() {
  const store = useMindMapStore()
  const selectedNodeId = useSelectedNodeId()
  const selectedConnectionId = useSelectedConnectionId()
  const doc = store.document

  if (!doc) return null

  const hasNodeSelection = !!selectedNodeId
  const hasConnectionSelection = !!selectedConnectionId

  return (
    <aside
      className="inspector no-print"
      style={{
        width: 240,
        borderLeft: '1px solid #e2e8f0',
        overflowY: 'auto',
        background: '#f8fafc',
        flexShrink: 0,
      }}
    >
      {hasConnectionSelection && <ConnectionPanel />}
      {hasNodeSelection && !hasConnectionSelection && (
        <>
          <TextPanel />
          <BranchPanel />
          <NodePanel />
        </>
      )}
      <MapPanel />
    </aside>
  )
}
