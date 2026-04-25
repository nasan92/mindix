import { useMindMapStore, useSelectedNodeIds } from '../../store/mindmap'
import type { NodeFont } from '../../types'

const FONT_FACES = [
  'sans-serif',
  'serif',
  'monospace',
  'Arial',
  'Georgia',
  'Verdana',
  'Trebuchet MS',
  'Times New Roman',
  'Courier New',
]

export function TextPanel() {
  const store = useMindMapStore()
  const doc = store.document
  const selectedNodeIds = useSelectedNodeIds()
  const nodeId = selectedNodeIds[0]
  const node = nodeId && doc ? doc.nodes[nodeId] : null

  if (!node) return null

  const font = node.style.font

  function updateFont(partial: Partial<NodeFont>) {
    if (!nodeId) return
    store.setNodeStyle(nodeId, { font: { ...font, ...partial } })
  }

  return (
    <div className="panel-section">
      <h3 className="panel-title">Text</h3>

      <div className="panel-row">
        <label className="panel-label">Font</label>
        <select
          value={font.fontfamily}
          onChange={e => updateFont({ fontfamily: e.target.value })}
          className="panel-select"
        >
          {FONT_FACES.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      <div className="panel-row">
        <label className="panel-label">Size</label>
        <div className="panel-row-inline">
          <button
            onClick={() => updateFont({ size: Math.max(8, font.size - 2) })}
            className="panel-btn"
          >−</button>
          <span className="panel-value">{font.size}px</span>
          <button
            onClick={() => updateFont({ size: Math.min(64, font.size + 2) })}
            className="panel-btn"
          >+</button>
        </div>
      </div>

      <div className="panel-row">
        <label className="panel-label">Style</label>
        <div className="panel-row-inline">
          <button
            onClick={() => updateFont({ weight: font.weight === 'bold' ? 'normal' : 'bold' })}
            className={`panel-btn ${font.weight === 'bold' ? 'active' : ''}`}
            title="Bold"
          ><b>B</b></button>
          <button
            onClick={() => updateFont({ style: font.style === 'italic' ? 'normal' : 'italic' })}
            className={`panel-btn ${font.style === 'italic' ? 'active' : ''}`}
            title="Italic"
          ><i>I</i></button>
          <button
            onClick={() => updateFont({ decoration: font.decoration === 'underline' ? 'none' : 'underline' })}
            className={`panel-btn ${font.decoration === 'underline' ? 'active' : ''}`}
            title="Underline"
          ><u>U</u></button>
          <button
            onClick={() => updateFont({ decoration: font.decoration === 'line-through' ? 'none' : 'line-through' })}
            className={`panel-btn ${font.decoration === 'line-through' ? 'active' : ''}`}
            title="Strikethrough"
          ><s>S</s></button>
        </div>
      </div>

      <div className="panel-row">
        <label className="panel-label">Align</label>
        <div className="panel-row-inline">
          {(['left', 'center', 'right'] as const).map(a => (
            <button
              key={a}
              onClick={() => updateFont({ align: a })}
              className={`panel-btn ${font.align === a ? 'active' : ''}`}
              title={a}
            >
              {a === 'left' ? '⇤' : a === 'center' ? '⇔' : '⇥'}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-row">
        <label className="panel-label">Color</label>
        <input
          type="color"
          value={font.color}
          onChange={e => updateFont({ color: e.target.value })}
          className="panel-color"
        />
      </div>

      <div className="panel-row">
        <button
          onClick={() => store.setChildrenStyle(nodeId, { font: { ...font } })}
          className="panel-btn-wide"
          title="Apply font settings to all descendants"
        >Apply to children</button>
      </div>
    </div>
  )
}
