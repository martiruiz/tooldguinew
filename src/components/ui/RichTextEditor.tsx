'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useState, useCallback } from 'react'
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Link as LinkIcon, List, ListOrdered, Unlink } from 'lucide-react'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder = 'Afegeix una descripció...' }: Props) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html === '<p></p>' ? '' : html)
    },
    editorProps: {
      attributes: { class: 'rte-content' },
    },
  })

  // Sync external value changes (e.g. initial load)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (current !== value && value !== undefined) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  const setLink = useCallback(() => {
    if (!editor) return
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run()
    } else {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`
      editor.chain().focus().setLink({ href: url }).run()
    }
    setLinkUrl('')
    setShowLinkInput(false)
  }, [editor, linkUrl])

  const openLinkInput = () => {
    if (!editor) return
    const existing = editor.getAttributes('link').href || ''
    setLinkUrl(existing)
    setShowLinkInput(true)
  }

  if (!editor) return null

  return (
    <div className="rte-wrap">
      {/* Toolbar */}
      <div className="rte-toolbar">
        <button
          type="button"
          className={`rte-btn${editor.isActive('bold') ? ' rte-btn--on' : ''}`}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
          title="Negreta"
        ><Bold size={13} strokeWidth={2.5} /></button>

        <button
          type="button"
          className={`rte-btn${editor.isActive('italic') ? ' rte-btn--on' : ''}`}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
          title="Cursiva"
        ><Italic size={13} /></button>

        <button
          type="button"
          className={`rte-btn${editor.isActive('underline') ? ' rte-btn--on' : ''}`}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleUnderline().run() }}
          title="Subratllat"
        ><UnderlineIcon size={13} /></button>

        <button
          type="button"
          className={`rte-btn${editor.isActive('strike') ? ' rte-btn--on' : ''}`}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleStrike().run() }}
          title="Ratllat"
        ><Strikethrough size={13} /></button>

        <div className="rte-sep" />

        <button
          type="button"
          className={`rte-btn${editor.isActive('bulletList') ? ' rte-btn--on' : ''}`}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
          title="Llista"
        ><List size={13} /></button>

        <button
          type="button"
          className={`rte-btn${editor.isActive('orderedList') ? ' rte-btn--on' : ''}`}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}
          title="Llista numerada"
        ><ListOrdered size={13} /></button>

        <div className="rte-sep" />

        <button
          type="button"
          className={`rte-btn${editor.isActive('link') ? ' rte-btn--on' : ''}`}
          onMouseDown={e => { e.preventDefault(); openLinkInput() }}
          title="Afegir enllaç"
        ><LinkIcon size={13} /></button>

        {editor.isActive('link') && (
          <button
            type="button"
            className="rte-btn"
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetLink().run() }}
            title="Treure enllaç"
          ><Unlink size={13} /></button>
        )}
      </div>

      {/* Link input */}
      {showLinkInput && (
        <div className="rte-link-bar">
          <input
            type="url"
            className="rte-link-inp"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="https://..."
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setLink() } if (e.key === 'Escape') setShowLinkInput(false) }}
            autoFocus
          />
          <button type="button" className="rte-link-ok" onMouseDown={e => { e.preventDefault(); setLink() }}>
            Afegir
          </button>
          <button type="button" className="rte-link-cancel" onMouseDown={e => { e.preventDefault(); setShowLinkInput(false) }}>
            Cancel·lar
          </button>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />

      <style jsx global>{`
        .rte-wrap {
          border: 1.5px solid #E8E8E8;
          border-radius: 8px;
          background: #FAFAFA;
          transition: border-color 0.15s;
          overflow: hidden;
        }
        .rte-wrap:focus-within {
          border-color: #1B2B4B;
          background: white;
        }
        .rte-toolbar {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 6px 8px;
          border-bottom: 1px solid #EFEFEF;
          background: #F8F8F8;
          flex-wrap: wrap;
        }
        .rte-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          border-radius: 5px;
          cursor: pointer;
          color: #5C5C5C;
          transition: all 0.12s;
          flex-shrink: 0;
        }
        .rte-btn:hover { background: #EBEBEB; color: #0a0a0a; }
        .rte-btn--on { background: #1B2B4B; color: white; }
        .rte-btn--on:hover { background: #254067; color: white; }
        .rte-sep {
          width: 1px;
          height: 18px;
          background: #E0E0E0;
          margin: 0 3px;
          flex-shrink: 0;
        }
        .rte-link-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-bottom: 1px solid #EFEFEF;
          background: #F0F4FF;
        }
        .rte-link-inp {
          flex: 1;
          height: 28px;
          padding: 0 8px;
          border: 1.5px solid #C8D4F0;
          border-radius: 5px;
          font-size: 12.5px;
          font-family: inherit;
          outline: none;
          background: white;
        }
        .rte-link-inp:focus { border-color: #1B2B4B; }
        .rte-link-ok {
          height: 28px;
          padding: 0 10px;
          background: #1B2B4B;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .rte-link-ok:hover { background: #254067; }
        .rte-link-cancel {
          height: 28px;
          padding: 0 10px;
          background: white;
          color: #5C5C5C;
          border: 1px solid #D8D8D8;
          border-radius: 5px;
          font-size: 12px;
          cursor: pointer;
          font-family: inherit;
        }
        .rte-content {
          padding: 10px 12px;
          min-height: 80px;
          font-size: 13.5px;
          line-height: 1.6;
          color: #1a1a1a;
          outline: none;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .rte-content p { margin: 0 0 6px; }
        .rte-content p:last-child { margin-bottom: 0; }
        .rte-content ul, .rte-content ol { padding-left: 20px; margin: 0 0 6px; }
        .rte-content li { margin-bottom: 3px; }
        .rte-content a { color: #1B2B4B; text-decoration: underline; }
        .rte-content a:hover { color: #4A82C6; }
        .rte-content strong { font-weight: 700; }
        .rte-content em { font-style: italic; }
        .rte-content u { text-decoration: underline; }
        .rte-content s { text-decoration: line-through; }
        .rte-content .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #C0C0C0;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  )
}
