import { useState } from 'react'
import { saveDocument } from '../../lib/storage'
import { downloadBlob } from '../../lib/export/export-png'
import { serializeDocument } from '../../lib/migration'
import { useMindMapStore } from '../../store/mindmap'

interface SaveDialogProps {
  onClose: () => void
}

export function SaveDialog({ onClose }: SaveDialogProps) {
  const store = useMindMapStore()
  const doc = store.document
  const [title, setTitle] = useState(doc?.title ?? '')

  if (!doc) return null

  const handleSaveBrowser = async () => {
    const updated = { ...doc, title: title || doc.title }
    store.setDocument(updated)
    const ok = await saveDocument(updated)
    if (ok) {
      store.addNotification('info', 'Saved to browser storage.')
      onClose()
    } else {
      store.addNotification('error', 'Save failed.')
    }
  }

  const handleDownload = () => {
    const updated = { ...doc, title: title || doc.title }
    store.setDocument(updated)
    const blob = new Blob([serializeDocument(updated)], { type: 'application/json' })
    const filename = (updated.title || 'mindmap').replace(/[^\w\-. ]/g, '_') + '.mindmap'
    downloadBlob(blob, filename)
    onClose()
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Save Document</h2>
          <button onClick={onClose} className="dialog-close">✕</button>
        </div>
        <div className="dialog-body">
          <div className="dialog-field">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="dialog-input"
              placeholder="Document title"
            />
          </div>
        </div>
        <div className="dialog-footer">
          <button onClick={handleSaveBrowser} className="dialog-btn primary">
            Save to browser
          </button>
          <button onClick={handleDownload} className="dialog-btn">
            Download .mindmap
          </button>
          <button onClick={onClose} className="dialog-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
