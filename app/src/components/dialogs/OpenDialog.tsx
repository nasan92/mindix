import { useState, useEffect } from 'react'
import { listDocuments, deleteDocument } from '../../lib/storage'
import { useMindMapStore } from '../../store/mindmap'
import type { MindMapDocument } from '../../types'

interface OpenDialogProps {
  onClose: () => void
}

export function OpenDialog({ onClose }: OpenDialogProps) {
  const store = useMindMapStore()
  const [docs, setDocs] = useState<MindMapDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listDocuments().then(d => {
      setDocs(d)
      setLoading(false)
    })
  }, [])

  const handleOpen = (doc: MindMapDocument) => {
    store.setDocument(doc)
    store.addNotification('info', `Opened "${doc.title}"`)
    onClose()
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this document?')) return
    await deleteDocument(id)
    setDocs(d => d.filter(doc => doc.id !== id))
  }

  const formatDate = (ts: number | null) => {
    if (!ts) return 'never'
    return new Date(ts).toLocaleString()
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Open Document</h2>
          <button onClick={onClose} className="dialog-close">✕</button>
        </div>
        <div className="dialog-body">
          {loading ? (
            <p>Loading…</p>
          ) : docs.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No saved documents.</p>
          ) : (
            <ul className="doc-list">
              {docs.map(doc => (
                <li
                  key={doc.id}
                  className="doc-list-item"
                  onClick={() => handleOpen(doc)}
                >
                  <div>
                    <div className="doc-list-title">{doc.title || 'Untitled'}</div>
                    <div className="doc-list-meta">Modified: {formatDate(doc.modifiedAt)}</div>
                  </div>
                  <button
                    onClick={e => handleDelete(e, doc.id)}
                    className="doc-list-delete"
                    title="Delete"
                  >🗑</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
