import { useState } from 'react'
import { useMindMapStore } from '../../store/mindmap'
import { exportMarkdown } from '../../lib/export/export-markdown'
import { exportSVG } from '../../lib/export/export-svg'
import { exportPNG, downloadBlob } from '../../lib/export/export-png'

interface ExportDialogProps {
  onClose: () => void
}

type ExportFormat = 'png' | 'svg' | 'markdown'

export function ExportDialog({ onClose }: ExportDialogProps) {
  const store = useMindMapStore()
  const doc = store.document
  const [format, setFormat] = useState<ExportFormat>('png')
  const [scale, setScale] = useState(2)
  const [exporting, setExporting] = useState(false)

  if (!doc) return null

  const filename = (doc.title || 'mindmap').replace(/[^\w\-. ]/g, '_')

  const handleExport = async () => {
    setExporting(true)
    try {
      if (format === 'markdown') {
        const md = exportMarkdown(doc)
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
        downloadBlob(blob, filename + '.md')
      } else if (format === 'svg') {
        const svg = exportSVG(doc)
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
        downloadBlob(blob, filename + '.svg')
      } else {
        const blob = await exportPNG(doc, scale)
        downloadBlob(blob, filename + '.png')
      }
      onClose()
    } catch {
      store.addNotification('error', 'Export failed.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Export</h2>
          <button onClick={onClose} className="dialog-close">✕</button>
        </div>
        <div className="dialog-body">
          <div className="dialog-field">
            <label>Format</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['png', 'svg', 'markdown'] as ExportFormat[]).map(f => (
                <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value={f}
                    checked={format === f}
                    onChange={() => setFormat(f)}
                  />
                  {f.toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          {format === 'png' && (
            <div className="dialog-field">
              <label>Scale</label>
              <select
                value={scale}
                onChange={e => setScale(Number(e.target.value))}
                className="dialog-select"
              >
                <option value={1}>1× (normal)</option>
                <option value={2}>2× (retina)</option>
                <option value={3}>3× (high DPI)</option>
              </select>
            </div>
          )}
        </div>
        <div className="dialog-footer">
          <button onClick={handleExport} disabled={exporting} className="dialog-btn primary">
            {exporting ? 'Exporting…' : `Download .${format === 'markdown' ? 'md' : format}`}
          </button>
          <button onClick={onClose} className="dialog-btn">Cancel</button>
        </div>
      </div>
    </div>
  )
}
