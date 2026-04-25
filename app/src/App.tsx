import { useState, useEffect } from 'react'
import { useMindMapStore } from './store/mindmap'
import { loadPersistedColorTheme } from './lib/color-themes'
import { listDocuments } from './lib/storage'
import { useAutoSave } from './hooks/useAutoSave'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { MindMapCanvas } from './components/canvas/MindMapCanvas'
import { Inspector } from './components/inspector/Inspector'
import { Toolbar } from './components/toolbar/Toolbar'
import { OpenDialog } from './components/dialogs/OpenDialog'
import { SaveDialog } from './components/dialogs/SaveDialog'
import { ExportDialog } from './components/dialogs/ExportDialog'
import { ImportMarkdownDialog } from './components/dialogs/ImportMarkdownDialog'
import { NotificationToast } from './components/panels/NotificationToast'

type DialogKind = 'open' | 'save' | 'export' | 'import-markdown' | null

function App() {
  const store = useMindMapStore()
  const [activeDialog, setActiveDialog] = useState<DialogKind>(null)

  // Initialize
  useEffect(() => {
    loadPersistedColorTheme()
    // Auto-open last document or create a new one
    listDocuments().then(docs => {
      if (docs.length > 0) {
        store.setDocument(docs[0])
      } else {
        store.newDocument()
      }
    })
  }, [])

  useAutoSave()
  useKeyboardShortcuts()

  const closeDialog = () => setActiveDialog(null)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Toolbar
        onOpenDialog={() => setActiveDialog('open')}
        onSaveDialog={() => setActiveDialog('save')}
        onExportDialog={() => setActiveDialog('export')}
        onImportMarkdownDialog={() => setActiveDialog('import-markdown')}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {store.document ? (
            <MindMapCanvas />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#94a3b8',
                fontSize: 18,
              }}
            >
              Loading…
            </div>
          )}
        </main>

        <Inspector />
      </div>

      {/* Dialogs */}
      {activeDialog === 'open' && <OpenDialog onClose={closeDialog} />}
      {activeDialog === 'save' && <SaveDialog onClose={closeDialog} />}
      {activeDialog === 'export' && <ExportDialog onClose={closeDialog} />}
      {activeDialog === 'import-markdown' && <ImportMarkdownDialog onClose={closeDialog} />}

      {/* Notifications */}
      <NotificationToast />
    </div>
  )
}

export default App
