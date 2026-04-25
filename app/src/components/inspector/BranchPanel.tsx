import { useMindMapStore, useSelectedNodeIds } from '../../store/mindmap'

export function BranchPanel() {
  const store = useMindMapStore()
  const doc = store.document
  const selectedNodeIds = useSelectedNodeIds()
  const nodeId = selectedNodeIds[0]
  const node = nodeId && doc ? doc.nodes[nodeId] : null

  if (!node) return null

  const { branchColor, lineWidthOffset } = node.style

  return (
    <div className="panel-section">
      <h3 className="panel-title">Branch</h3>

      <div className="panel-row">
        <label className="panel-label">Color</label>
        <input
          type="color"
          value={branchColor}
          onChange={e => store.setNodeStyle(nodeId, { branchColor: e.target.value })}
          className="panel-color"
        />
      </div>

      <div className="panel-row">
        <label className="panel-label">Width</label>
        <div className="panel-row-inline">
          <button
            onClick={() => store.setNodeStyle(nodeId, { lineWidthOffset: Math.max(-2, lineWidthOffset - 2) })}
            className="panel-btn"
          >−</button>
          <span className="panel-value">{3 + lineWidthOffset}px</span>
          <button
            onClick={() => store.setNodeStyle(nodeId, { lineWidthOffset: Math.min(10, lineWidthOffset + 2) })}
            className="panel-btn"
          >+</button>
        </div>
      </div>

      <div className="panel-row">
        <button
          onClick={() => store.setChildrenStyle(nodeId, { branchColor })}
          className="panel-btn-wide"
        >Apply color to children</button>
      </div>
    </div>
  )
}
