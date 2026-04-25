import Dexie, { type Table } from 'dexie'
import type { MindMapDocument, StoredDocument } from '../types'
import { serializeDocument, parseDocument } from './migration'

class MindMapDB extends Dexie {
  documents!: Table<StoredDocument, string>

  constructor() {
    super('mindmaps-db')
    this.version(1).stores({
      documents: 'id, modifiedAt',
    })
  }
}

const db = new MindMapDB()

export async function saveDocument(doc: MindMapDocument): Promise<boolean> {
  try {
    const prepared = { ...doc, modifiedAt: Date.now() }
    await db.documents.put({
      id: prepared.id,
      data: serializeDocument(prepared),
      modifiedAt: prepared.modifiedAt as number,
    })
    return true
  } catch (err) {
    console.error('saveDocument failed', err)
    return false
  }
}

export async function loadDocument(id: string): Promise<MindMapDocument | null> {
  try {
    const row = await db.documents.get(id)
    if (!row) return null
    return parseDocument(row.data)
  } catch {
    return null
  }
}

export async function listDocuments(): Promise<MindMapDocument[]> {
  try {
    const rows = await db.documents.orderBy('modifiedAt').reverse().toArray()
    const docs = rows
      .map(row => parseDocument(row.data))
      .filter((d): d is MindMapDocument => d !== null)
    return docs
  } catch {
    return []
  }
}

export async function deleteDocument(id: string): Promise<void> {
  try {
    await db.documents.delete(id)
  } catch (err) {
    console.error('deleteDocument failed', err)
  }
}

// File System Access API helpers

export async function saveToFile(
  handle: FileSystemFileHandle,
  doc: MindMapDocument,
): Promise<boolean> {
  try {
    const writable = await handle.createWritable()
    await writable.write(serializeDocument(doc))
    await writable.close()
    return true
  } catch {
    return false
  }
}

export async function loadFromFile(
  handle: FileSystemFileHandle,
): Promise<MindMapDocument | null> {
  try {
    const file = await handle.getFile()
    const text = await file.text()
    return parseDocument(text)
  } catch {
    return null
  }
}

export async function pickOpenFile(): Promise<{ handle: FileSystemFileHandle; doc: MindMapDocument } | null> {
  try {
    // @ts-expect-error - File System Access API
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'Mind Map Files',
          accept: { 'application/json': ['.mindmap', '.json'] },
        },
      ],
    })
    const doc = await loadFromFile(handle)
    if (!doc) return null
    return { handle, doc }
  } catch {
    return null
  }
}

export async function pickSaveFile(
  doc: MindMapDocument,
): Promise<FileSystemFileHandle | null> {
  try {
    // @ts-expect-error - File System Access API
    const handle = await window.showSaveFilePicker({
      suggestedName: `${doc.title ?? 'mindmap'}.mindmap`,
      types: [
        {
          description: 'Mind Map Files',
          accept: { 'application/json': ['.mindmap', '.json'] },
        },
      ],
    })
    await saveToFile(handle, doc)
    return handle
  } catch {
    return null
  }
}
