import { memo, useCallback, useEffect } from 'react'
import { type NodeProps, Handle, Position } from '@xyflow/react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Strike from '@tiptap/extension-strike'
import { useMindMapStore } from '../../store/mindmap'
import type { MindMapNode as MindMapNodeType } from '../../types'

interface MindMapNodeData {
  node: MindMapNodeType
  isEditing: boolean
  isSelected: boolean
  isConnecting: boolean
  isLeftSide: boolean
}

const TIPTAP_EXTENSIONS = [
  StarterKit.configure({ strike: false }),
  Underline,
  TextStyle,
  Color,
  Strike,
]

function MindMapNodeInner({ data, id }: NodeProps) {
  const nodeData = data as unknown as MindMapNodeData
  const { node, isEditing, isSelected, isConnecting, isLeftSide } = nodeData
  const { style, layout, text } = node

  const store = useMindMapStore()

  const editor = useEditor({
    extensions: TIPTAP_EXTENSIONS,
    content: text,
    editable: isEditing,
    onUpdate: ({ editor }) => {
      store.changeCaption(id, editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap-node-editor',
      },
    },
  })

  // Sync content when text changes externally
  useEffect(() => {
    if (!editor || isEditing) return
    const current = editor.getHTML()
    if (current !== text) {
      editor.commands.setContent(text)
    }
  }, [text, editor, isEditing])

  // Toggle editability
  useEffect(() => {
    if (!editor) return
    editor.setEditable(isEditing)
    if (isEditing) {
      setTimeout(() => {
        editor.commands.focus('end')
        // Pause undo tracking during text editing
        useMindMapStore.temporal.getState().pause?.()
      }, 0)
    }
  }, [isEditing, editor])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isConnecting) {
        const fromId = store.connectingFromNodeId
        if (fromId && fromId !== id) {
          store.addConnection({
            id: crypto.randomUUID(),
            fromId,
            toId: id,
            style: 'solid',
            shape: 'straight',
            color: '#1d3557',
            arrow: 1,
            fromAnchor: { x: 0.5, y: 0.5 },
            toAnchor: { x: 0.5, y: 0.5 },
            curve: { c1x: 0.28, c1y: 0.22, c2x: 0.72, c2y: -0.22 },
          })
        } else {
          store.cancelConnecting()
        }
        return
      }
      if (e.shiftKey) {
        store.toggleNodeSelection(id)
      } else {
        store.selectNode(id)
      }
    },
    [id, isConnecting, store],
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!isEditing) {
        store.selectNode(id)
        store.setEditingNode(id)
      }
    },
    [id, isEditing, store],
  )

  const handleBlur = useCallback(() => {
    if (isEditing) {
      store.setEditingNode(null)
      // Resume undo tracking after editing
      useMindMapStore.temporal.getState().resume?.()
    }
  }, [isEditing, store])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isEditing) {
        e.stopPropagation()
        if (e.key === 'Escape') {
          editor?.commands.blur()
          store.setEditingNode(null)
          useMindMapStore.temporal.getState().resume?.()
        }
      }
    },
    [isEditing, editor, store],
  )

  const { font, border } = style
  const nodeStyle: React.CSSProperties = {
    fontFamily: font.fontfamily,
    fontSize: font.size,
    fontWeight: font.weight,
    fontStyle: font.style,
    textDecoration: font.decoration,
    textAlign: font.align,
    color: font.color,
    borderStyle: border.visible ? border.style : 'none',
    borderColor: border.visible ? border.color : 'transparent',
    borderWidth: border.visible ? 1 : 0,
    backgroundColor: border.visible ? border.background : 'transparent',
    position: 'relative',
    padding: '6px 10px',
    borderRadius: 4,
    minWidth: 60,
    maxWidth: 260,
    cursor: isConnecting ? 'crosshair' : isEditing ? 'text' : 'default',
    outline: isSelected ? `2px solid #3b82f6` : isEditing ? `2px solid #60a5fa` : 'none',
    outlineOffset: 2,
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
    userSelect: isEditing ? 'text' : 'none',
  }

  return (
    <div
      style={nodeStyle}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      {/* Four named handles so branch edges can route from/to the correct side */}
      <Handle type="target" id="target-left" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" id="source-left" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="target" id="target-right" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="source" id="source-right" position={Position.Right} style={{ opacity: 0 }} />

      {isEditing ? (
        <div
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <EditorContent editor={editor} />
        </div>
      ) : (
        <div
          dangerouslySetInnerHTML={{ __html: text }}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Fold button — sits on the side where children are */}
      {node.childrenIds.length > 0 && !isEditing && (
        <button
          className="fold-btn"
          onClick={e => {
            e.stopPropagation()
            store.toggleFold(id)
          }}
          style={{
            position: 'absolute',
            [isLeftSide ? 'left' : 'right']: -10,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: '1px solid #94a3b8',
            background: '#fff',
            fontSize: 10,
            lineHeight: '14px',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          {layout.foldChildren ? '+' : '−'}
        </button>
      )}
    </div>
  )
}

export const MindMapNode = memo(MindMapNodeInner)
export default MindMapNode
