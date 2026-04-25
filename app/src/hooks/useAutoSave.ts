import { useEffect, useRef } from 'react'
import { useMindMapStore } from '../store/mindmap'
import { saveDocument, saveToFile } from '../lib/storage'

const DEBOUNCE_MS = 1500

export function useAutoSave() {
  const document = useMindMapStore(s => s.document)
  const linkedFileHandle = useMindMapStore(s => s.linkedFileHandle)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!document) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      await saveDocument(document)
      if (linkedFileHandle) {
        await saveToFile(linkedFileHandle, document)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [document, linkedFileHandle])
}
