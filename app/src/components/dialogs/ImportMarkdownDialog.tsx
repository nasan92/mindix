import { useState, useRef } from 'react'
import { useMindMapStore } from '../../store/mindmap'
import { importMarkdown } from '../../lib/export/import-markdown'

interface ImportMarkdownDialogProps {
  onClose: () => void
}

export function ImportMarkdownDialog({ onClose }: ImportMarkdownDialogProps) {
  const store = useMindMapStore()
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')
  const [pendingText, setPendingText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const name = file.name.toLowerCase()
    if (name && !(/\.(md|markdown)$/).test(name)) {
      setError('Please choose a .md or .markdown file.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      try {
        // Validate by trying to parse
        importMarkdown(text)
        setPendingText(text)
        setPreview(text.slice(0, 500) + (text.length > 500 ? '…' : ''))
        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to parse markdown.')
        setPendingText('')
        setPreview('')
      }
    }
    reader.onerror = () => setError('Unable to read file.')
    reader.readAsText(file)
  }

  const handleImport = () => {
    if (!pendingText) return
    try {
      const doc = importMarkdown(pendingText)
      store.setDocument(doc)
      store.addNotification('info', `Imported "${doc.title}"`)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.')
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Import Markdown</h2>
          <button onClick={onClose} className="dialog-close">✕</button>
        </div>
        <div className="dialog-body">
          <div className="dialog-field">
            <label>Choose a .md file</label>
            <input
              ref={fileRef}
              type="file"
              accept=".md,.markdown"
              onChange={handleFile}
              style={{ marginTop: 4 }}
            />
          </div>
          {error && (
            <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>
          )}
          {preview && (
            <div className="dialog-field">
              <label>Preview</label>
              <textarea
                readOnly
                value={preview}
                rows={8}
                className="dialog-textarea"
              />
            </div>
          )}
        </div>
        <div className="dialog-footer">
          <button
            onClick={handleImport}
            disabled={!pendingText}
            className="dialog-btn primary"
          >Import</button>
          <button onClick={onClose} className="dialog-btn">Cancel</button>
        </div>
      </div>
    </div>
  )
}
