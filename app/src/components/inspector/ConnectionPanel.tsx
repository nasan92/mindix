import { useMindMapStore, useSelectedConnectionId } from '../../store/mindmap'
import type { ConnectionStyle, ConnectionShape, ConnectionArrow } from '../../types'

export function ConnectionPanel() {
  const store = useMindMapStore()
  const doc = store.document
  const selectedConnectionId = useSelectedConnectionId()
  const conn = selectedConnectionId && doc
    ? doc.connections.find(c => c.id === selectedConnectionId)
    : null

  if (!conn) return null

  return (
    <div className="panel-section">
      <h3 className="panel-title">Connection</h3>

      <div className="panel-row">
        <label className="panel-label">Color</label>
        <input
          type="color"
          value={conn.color}
          onChange={e => store.updateConnection(conn.id, { color: e.target.value })}
          className="panel-color"
        />
      </div>

      <div className="panel-row">
        <label className="panel-label">Line</label>
        <select
          value={conn.style}
          onChange={e => store.updateConnection(conn.id, { style: e.target.value as ConnectionStyle })}
          className="panel-select"
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </div>

      <div className="panel-row">
        <label className="panel-label">Shape</label>
        <select
          value={conn.shape}
          onChange={e => store.updateConnection(conn.id, { shape: e.target.value as ConnectionShape })}
          className="panel-select"
        >
          <option value="straight">Straight</option>
          <option value="curved">Curved</option>
        </select>
      </div>

      <div className="panel-row">
        <label className="panel-label">Arrow</label>
        <select
          value={conn.arrow}
          onChange={e => store.updateConnection(conn.id, { arrow: Number(e.target.value) as ConnectionArrow })}
          className="panel-select"
        >
          <option value={0}>None</option>
          <option value={1}>End →</option>
          <option value={2}>Both ↔</option>
        </select>
      </div>

      <div className="panel-row">
        <button
          onClick={() => store.removeConnection(conn.id)}
          className="panel-btn-wide panel-btn-danger"
        >Remove connection</button>
      </div>
    </div>
  )
}
