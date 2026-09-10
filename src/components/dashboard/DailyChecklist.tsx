'use client'

import { useState, useEffect, useRef } from 'react'
import type React from 'react'
import { CheckCircle2, Circle, Plus, X } from 'lucide-react'

interface CheckItem {
  id: string
  text: string
  done: boolean
  createdAt: number
}

interface Props {
  userId: string
  moveButtons?: React.ReactNode
}

function storageKey(userId: string) {
  return `guinew-checklist-v1-${userId}`
}

function load(userId: string): CheckItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(userId: string, items: CheckItem[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(items))
}

export function DailyChecklist({ userId, moveButtons }: Props) {
  const [items, setItems] = useState<CheckItem[]>([])
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setItems(load(userId))
  }, [userId])

  useEffect(() => {
    if (adding) setTimeout(() => inputRef.current?.focus(), 50)
  }, [adding])

  const update = (next: CheckItem[]) => {
    setItems(next)
    save(userId, next)
  }

  const toggle = (id: string) => {
    update(items.map(i => i.id === id ? { ...i, done: !i.done } : i))
  }

  const remove = (id: string) => {
    update(items.filter(i => i.id !== id))
  }

  const addItem = () => {
    const text = draft.trim().toUpperCase()
    if (!text) { setAdding(false); setDraft(''); return }
    update([...items, { id: crypto.randomUUID(), text, done: false, createdAt: Date.now() }])
    setDraft('')
    inputRef.current?.focus()
  }

  const pending = items.filter(i => !i.done)
  const done = items.filter(i => i.done)
  const sorted = [...pending, ...done]

  return (
    <div className="checklist-widget">
      <div className="checklist-header">
        <div className="checklist-title-row">
          {moveButtons}
          <CheckCircle2 size={14} strokeWidth={2} color="#92400E" />
          <h2 className="checklist-title">La meva llista del dia</h2>
          {pending.length > 0 && (
            <span className="checklist-badge">{pending.length}</span>
          )}
        </div>
      </div>

      <div className="checklist-body">
        {sorted.length === 0 && !adding && (
          <div className="checklist-empty">
            <p>Cap element. Afegeix les teves tasques del dia.</p>
          </div>
        )}

        {sorted.map(item => (
          <div key={item.id} className={`checklist-item ${item.done ? 'checklist-item--done' : ''}`}>
            <button
              className="checklist-check-btn"
              onClick={() => toggle(item.id)}
              title={item.done ? 'Marcar com a pendent' : 'Marcar com a fet'}
            >
              {item.done
                ? <CheckCircle2 size={18} color="#1A73E8" strokeWidth={2} />
                : <Circle size={18} color="#C0C0C0" strokeWidth={1.8} />
              }
            </button>
            <span className="checklist-text">{item.text}</span>
            <button
              className="checklist-remove-btn"
              onClick={() => remove(item.id)}
              title="Eliminar"
            >
              <X size={13} />
            </button>
          </div>
        ))}

        {adding && (
          <div className="checklist-add-row">
            <Circle size={18} color="#C0C0C0" strokeWidth={1.8} />
            <input
              ref={inputRef}
              className="checklist-input"
              value={draft}
              onChange={e => setDraft(e.target.value.toUpperCase())}
              onKeyDown={e => {
                if (e.key === 'Enter') addItem()
                if (e.key === 'Escape') { setAdding(false); setDraft('') }
              }}
              onBlur={() => { if (!draft.trim()) { setAdding(false); setDraft('') } else addItem() }}
              placeholder="Nom de l'element..."
              style={{ textTransform: 'uppercase' }}
            />
          </div>
        )}

        <button
          className="checklist-add-btn"
          onClick={() => setAdding(true)}
        >
          <Plus size={14} strokeWidth={2.5} color="#4A82C6" />
          Afegir element de llista
        </button>
      </div>

      <style jsx>{`
        .checklist-widget {
          background: #FFFBF0;
          border: 1px solid #FDE68A;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(251,191,36,0.12), 0 2px 12px rgba(251,191,36,0.08);
        }

        .checklist-header {
          background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
          padding: 13px 14px 13px;
          border-bottom: 1px solid #FCD34D;
        }

        .checklist-title-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .checklist-title {
          font-size: 13px;
          font-weight: 700;
          color: #78350F;
          letter-spacing: -0.01em;
          flex: 1;
        }

        .checklist-badge {
          font-size: 10px;
          font-weight: 700;
          background: #D97706;
          color: white;
          padding: 1px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .checklist-body {
          padding: 4px 0 8px;
        }

        .checklist-empty {
          padding: 16px;
          font-size: 12.5px;
          color: #9A9A9A;
          text-align: center;
        }

        .checklist-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 16px;
          transition: background 0.1s;
        }

        .checklist-item:hover {
          background: #FEF9EC;
        }

        .checklist-item:hover .checklist-remove-btn {
          opacity: 1;
        }

        .checklist-item--done .checklist-text {
          text-decoration: line-through;
          color: #B0B0B0;
        }

        .checklist-check-btn {
          border: none;
          background: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: transform 0.1s;
        }

        .checklist-check-btn:hover {
          transform: scale(1.1);
        }

        .checklist-text {
          flex: 1;
          font-size: 12.5px;
          font-weight: 600;
          color: #0F1B2D;
          letter-spacing: 0.01em;
          line-height: 1.3;
          word-break: break-word;
        }

        .checklist-remove-btn {
          border: none;
          background: none;
          cursor: pointer;
          padding: 2px;
          color: #C0C0C0;
          display: flex;
          align-items: center;
          opacity: 0;
          transition: opacity 0.15s, color 0.15s;
          flex-shrink: 0;
        }

        .checklist-remove-btn:hover {
          color: #DC2626;
        }

        .checklist-add-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
        }

        .checklist-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 12.5px;
          font-weight: 600;
          color: #0F1B2D;
          background: transparent;
          font-family: inherit;
          letter-spacing: 0.01em;
        }

        .checklist-input::placeholder {
          color: #C0C0C0;
          font-weight: 400;
          text-transform: none;
        }

        .checklist-add-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          font-size: 12.5px;
          font-weight: 500;
          color: #4A82C6;
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: background 0.1s;
        }

        .checklist-add-btn:hover {
          background: #FEF3C7;
        }

        .checklist-header .widget-move-btns { opacity: 0; transition: opacity 0.15s; }
        .checklist-widget:hover .checklist-header .widget-move-btns { opacity: 1; }
        .checklist-header .widget-move-btn { color: #B45309; }
        .checklist-header .widget-move-btn:hover:not(:disabled) { color: #92400E; background: rgba(0,0,0,0.08); }
      `}</style>
    </div>
  )
}
