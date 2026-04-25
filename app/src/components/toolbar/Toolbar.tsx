import { useState, useRef, useCallback } from 'react'
import { useMindMapStore } from '../../store/mindmap'
import { saveDocument } from '../../lib/storage'
import { pickOpenFile, pickSaveFile } from '../../lib/storage'
import { exportMarkdown } from '../../lib/export/export-markdown'
import { exportSVG } from '../../lib/export/export-svg'
import { exportPNG, downloadBlob } from '../../lib/export/export-png'

interface ToolbarProps {
  onOpenDialog: () => void
  onSaveDialog: () => void
  onExportDialog: () => void
  onImportMarkdownDialog: () => void
}


function DropdownMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleToggle = () => setOpen(o => !o)
  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }} onBlur={handleBlur}>
      <button onClick={handleToggle} className="toolbar-menu-btn">
        {label}
      </button>
      {open && (
        <div
          className="toolbar-dropdown"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function MenuItem({ label, shortcut, onClick, disabled }: {
  label: string
  shortcut?: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="toolbar-menu-item"
    >
      <span>{label}</span>
      {shortcut && <span className="toolbar-shortcut">{shortcut}</span>}
    </button>
  )
}

function Divider() {
  return <div className="toolbar-divider" />
}

export function Toolbar({ onOpenDialog, onSaveDialog, onExportDialog: _onExportDialog, onImportMarkdownDialog }: ToolbarProps) {
  const store = useMindMapStore()
  const doc = store.document
  const hasDoc = !!doc

  const handleNew = () => {
    if (hasDoc) {
      if (!confirm('Create a new map? Unsaved changes may be lost.')) return
    }
    store.newDocument()
  }

  const handleSaveBrowser = async () => {
    if (!doc) return
    const ok = await saveDocument(doc)
    if (ok) store.addNotification('info', 'Saved to browser storage.')
    else store.addNotification('error', 'Save failed.')
  }

  const handleOpenFile = async () => {
    const result = await pickOpenFile()
    if (!result) return
    store.setDocument(result.doc)
    store.setLinkedFileHandle(result.handle)
    store.addNotification('info', `Opened "${result.doc.title}"`)
  }

  const handleSaveFile = async () => {
    if (!doc) return
    const handle = store.linkedFileHandle
    if (handle) {
      const { saveToFile } = await import('../../lib/storage')
      const ok = await saveToFile(handle, doc)
      if (ok) store.addNotification('info', 'Saved to file.')
      else store.addNotification('error', 'File save failed.')
    } else {
      const newHandle = await pickSaveFile(doc)
      if (newHandle) {
        store.setLinkedFileHandle(newHandle)
        store.addNotification('info', 'Saved to file.')
      }
    }
  }

  const handleExportMarkdown = () => {
    if (!doc) return
    const md = exportMarkdown(doc)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const filename = (doc.title || 'mindmap').replace(/[^\w\-. ]/g, '_') + '.md'
    downloadBlob(blob, filename)
  }

  const handleExportSVG = () => {
    if (!doc) return
    const svg = exportSVG(doc)
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const filename = (doc.title || 'mindmap').replace(/[^\w\-. ]/g, '_') + '.svg'
    downloadBlob(blob, filename)
  }

  const handleExportPNG = async () => {
    if (!doc) return
    try {
      const blob = await exportPNG(doc, 2)
      const filename = (doc.title || 'mindmap').replace(/[^\w\-. ]/g, '_') + '.png'
      downloadBlob(blob, filename)
    } catch {
      store.addNotification('error', 'PNG export failed.')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const undo = () => useMindMapStore.temporal.getState().undo()
  const redo = () => useMindMapStore.temporal.getState().redo()

  const selectedNodeId = store.selectedNodeIds[0]
  const selectedNode = selectedNodeId && doc ? doc.nodes[selectedNodeId] : null

  return (
    <header
      className="toolbar no-print"
      style={{
        height: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '0 8px',
        borderBottom: '1px solid #e2e8f0',
        background: '#fff',
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 14, marginRight: 8, color: '#1e40af' }}>
        Mind Map
      </span>

      <DropdownMenu label="File">
        <MenuItem label="New" shortcut="⌘N" onClick={handleNew} />
        <MenuItem label="Open…" shortcut="⌘O" onClick={onOpenDialog} />
        <MenuItem label="Open from file" onClick={handleOpenFile} />
        <Divider />
        <MenuItem label="Save to browser" shortcut="⌘S" onClick={handleSaveBrowser} disabled={!hasDoc} />
        <MenuItem label="Save to file" onClick={handleSaveFile} disabled={!hasDoc} />
        <MenuItem label="Save as…" onClick={onSaveDialog} disabled={!hasDoc} />
        <Divider />
        <MenuItem label="Import Markdown…" onClick={onImportMarkdownDialog} />
        <Divider />
        <MenuItem label="Export PNG…" onClick={handleExportPNG} disabled={!hasDoc} />
        <MenuItem label="Export SVG…" onClick={handleExportSVG} disabled={!hasDoc} />
        <MenuItem label="Export Markdown…" onClick={handleExportMarkdown} disabled={!hasDoc} />
        <Divider />
        <MenuItem label="Print" shortcut="⌘P" onClick={handlePrint} disabled={!hasDoc} />
      </DropdownMenu>

      <DropdownMenu label="Edit">
        <MenuItem label="Undo" shortcut="⌘Z" onClick={undo} disabled={!hasDoc} />
        <MenuItem label="Redo" shortcut="⌘Y" onClick={redo} disabled={!hasDoc} />
        <Divider />
        <MenuItem
          label="Copy node"
          shortcut="⌘C"
          onClick={() => selectedNodeId && store.copyNode(selectedNodeId)}
          disabled={!selectedNode}
        />
        <MenuItem
          label="Cut node"
          shortcut="⌘X"
          onClick={() => selectedNodeId && store.cutNode(selectedNodeId)}
          disabled={!selectedNode || !selectedNode.parentId}
        />
        <MenuItem
          label="Paste node"
          shortcut="⌘V"
          onClick={() => selectedNodeId && store.pasteNode(selectedNodeId)}
          disabled={!selectedNode || !store.clipboard}
        />
        <Divider />
        <MenuItem
          label="Delete node"
          shortcut="Del"
          onClick={() => selectedNodeId && store.deleteNode(selectedNodeId)}
          disabled={!selectedNode || !selectedNode.parentId}
        />
        <Divider />
        <MenuItem label="Auto-arrange" onClick={() => store.autoArrange()} disabled={!hasDoc} />
      </DropdownMenu>

      <DropdownMenu label="Insert">
        <MenuItem
          label="Add child node"
          shortcut="Tab"
          onClick={() => selectedNodeId && store.createNode(selectedNodeId)}
          disabled={!selectedNode}
        />
        <MenuItem
          label="Add sibling node"
          shortcut="Enter"
          onClick={() => selectedNodeId && store.createSiblingNode(selectedNodeId)}
          disabled={!selectedNode || !selectedNode.parentId}
        />
        <Divider />
        <MenuItem
          label="Connect nodes"
          onClick={() => selectedNodeId && store.startConnecting(selectedNodeId)}
          disabled={!selectedNode}
        />
      </DropdownMenu>

      <DropdownMenu label="View">
        <MenuItem
          label="Toggle grid"
          onClick={() => doc && store.setGridEnabled(!doc.settings.gridEnabled)}
          disabled={!hasDoc}
        />
      </DropdownMenu>

      {/* Connection mode indicator */}
      {store.connectingFromNodeId && (
        <span style={{ marginLeft: 16, fontSize: 13, color: '#ef4444', fontStyle: 'italic' }}>
          Click a node to connect — Esc to cancel
        </span>
      )}

      {/* Title */}
      {doc && (
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b' }}>
          {doc.title || 'Untitled'}
        </span>
      )}
    </header>
  )
}
