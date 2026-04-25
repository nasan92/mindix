import { useMindMapStore, useSelectedNodeIds } from '../../store/mindmap'
import type { NodeBorder } from '../../types'

export function NodePanel() {
  const store = useMindMapStore()
  const doc = store.document
  const selectedNodeIds = useSelectedNodeIds()
  const nodeId = selectedNodeIds[0]
  const node = nodeId && doc ? doc.nodes[nodeId] : null

  if (!node) return null

  const border = node.style.border

  function updateBorder(partial: Partial<NodeBorder>) {
    if (!nodeId) return
    const updated = { ...border, ...partial }
    store.setNodeStyle(nodeId, { border: updated })
  }

  return (
    <div className="panel-section">
      <h3 className="panel-title">Node</h3>

      <div className="panel-row">
        <label className="panel-label">Border</label>
        <select
          value={border.style}
          onChange={e => {
            const s = e.target.value as NodeBorder['style']
            updateBorder({ style: s, visible: s !== 'none' })
          }}
          className="panel-select"
        >
          <option value="none">None</option>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </div>

      {border.style !== 'none' && (
        <div className="panel-row">
          <label className="panel-label">Border color</label>
          <input
            type="color"
            value={border.color}
            onChange={e => updateBorder({ color: e.target.value })}
            className="panel-color"
          />
        </div>
      )}

      <div className="panel-row">
        <label className="panel-label">Background</label>
        <input
          type="color"
          value={border.background}
          onChange={e => updateBorder({ background: e.target.value, visible: border.style !== 'none' })}
          className="panel-color"
        />
      </div>

      <div className="panel-row">
        <button
          onClick={() => store.setChildrenStyle(nodeId, { border: { ...border } })}
          className="panel-btn-wide"
        >Apply to children</button>
      </div>
    </div>
  )
}
