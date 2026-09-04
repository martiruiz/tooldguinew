'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckSquare, Users, FolderKanban, Calendar,
  FileText, AlertCircle, Search, ArrowRight,
} from 'lucide-react'

interface Action {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  action: () => void
  category: 'create' | 'navigate' | 'search'
}

interface Props {
  onNewTask?: () => void
  onNewClient?: () => void
  onNewProject?: () => void
}

export function CommandPalette({ onNewTask, onNewClient, onNewProject }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const actions: Action[] = [
    { id: 'new-task', label: 'Nova tasca', description: 'Crear una nova tasca', icon: <CheckSquare size={15} />, action: () => { onNewTask?.(); setOpen(false) }, category: 'create' },
    { id: 'new-client', label: 'Nou client', description: 'Afegir un client nou', icon: <Users size={15} />, action: () => { onNewClient?.(); setOpen(false) }, category: 'create' },
    { id: 'new-project', label: 'Nou projecte', description: 'Crear un nou projecte', icon: <FolderKanban size={15} />, action: () => { onNewProject?.(); setOpen(false) }, category: 'create' },
    { id: 'nav-dashboard', label: 'Anar al Dashboard', icon: <ArrowRight size={15} />, action: () => { router.push('/dashboard'); setOpen(false) }, category: 'navigate' },
    { id: 'nav-tasks', label: 'Anar a Tasques', icon: <CheckSquare size={15} />, action: () => { router.push('/tasks'); setOpen(false) }, category: 'navigate' },
    { id: 'nav-clients', label: 'Anar a Clients', icon: <Users size={15} />, action: () => { router.push('/clients'); setOpen(false) }, category: 'navigate' },
    { id: 'nav-projects', label: 'Anar a Projectes', icon: <FolderKanban size={15} />, action: () => { router.push('/projects'); setOpen(false) }, category: 'navigate' },
    { id: 'nav-calendar', label: 'Anar al Calendari', icon: <Calendar size={15} />, action: () => { router.push('/calendar'); setOpen(false) }, category: 'navigate' },
    { id: 'nav-documents', label: 'Anar a Documents', icon: <FileText size={15} />, action: () => { router.push('/documents'); setOpen(false) }, category: 'navigate' },
    { id: 'nav-metrics', label: 'Anar a Mètriques', icon: <AlertCircle size={15} />, action: () => { router.push('/metrics'); setOpen(false) }, category: 'navigate' },
  ]

  const filtered = query.trim()
    ? actions.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.description?.toLowerCase().includes(query.toLowerCase())
      )
    : actions

  useEffect(() => {
    setSelected(0)
  }, [query])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setOpen(v => !v)
      setQuery('')
      setSelected(0)
    }
    if (e.key === 'Escape') setOpen(false)
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const handlePaletteKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter') { e.preventDefault(); filtered[selected]?.action() }
  }

  const categoryLabel: Record<string, string> = {
    create: 'Crear',
    navigate: 'Navegar',
    search: 'Cerca',
  }

  const groups = filtered.reduce<Record<string, Action[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category].push(a)
    return acc
  }, {})

  if (!open) return null

  return (
    <div className="cmd-overlay" onClick={e => e.target === e.currentTarget && setOpen(false)}>
      <div className="cmd-modal" onKeyDown={handlePaletteKey}>
        <div className="cmd-search-wrap">
          <Search size={16} color="#9A9A9A" />
          <input
            ref={inputRef}
            className="cmd-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Què vols fer?"
          />
          <kbd className="cmd-esc">Esc</kbd>
        </div>

        <div className="cmd-results">
          {filtered.length === 0 ? (
            <div className="cmd-empty">Cap resultat per «{query}»</div>
          ) : (
            Object.entries(groups).map(([cat, items]) => (
              <div key={cat} className="cmd-group">
                <div className="cmd-group-label">{categoryLabel[cat] || cat}</div>
                {items.map((item) => {
                  const idx = filtered.indexOf(item)
                  return (
                    <button
                      key={item.id}
                      className={`cmd-item${selected === idx ? ' cmd-item--active' : ''}`}
                      onMouseEnter={() => setSelected(idx)}
                      onClick={item.action}
                    >
                      <span className="cmd-item-icon">{item.icon}</span>
                      <span className="cmd-item-label">{item.label}</span>
                      {item.description && <span className="cmd-item-desc">{item.description}</span>}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="cmd-footer">
          <span><kbd>↑↓</kbd> navegar</span>
          <span><kbd>↵</kbd> seleccionar</span>
          <span><kbd>⌘K</kbd> tancar</span>
        </div>
      </div>

      <style jsx>{`
        .cmd-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.45);
          z-index: 9999; display: flex; align-items: flex-start; justify-content: center;
          padding-top: 120px;
        }

        .cmd-modal {
          background: white; border-radius: 16px; width: 100%; max-width: 540px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.1);
          overflow: hidden; display: flex; flex-direction: column;
        }

        .cmd-search-wrap {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 20px; border-bottom: 1px solid #F0F0F0;
        }

        .cmd-input {
          flex: 1; border: none; outline: none; font-size: 16px;
          color: #0a0a0a; background: none; font-family: inherit;
        }
        .cmd-input::placeholder { color: #C0C0C0; }

        .cmd-esc {
          font-size: 11px; color: #C0C0C0; background: #F4F4F4;
          border: 1px solid #E8E8E8; border-radius: 4px; padding: 2px 6px;
          font-family: inherit; cursor: pointer;
        }

        .cmd-results { max-height: 380px; overflow-y: auto; padding: 8px 0; }

        .cmd-empty { padding: 24px 20px; font-size: 14px; color: #9A9A9A; text-align: center; }

        .cmd-group { margin-bottom: 4px; }

        .cmd-group-label {
          font-size: 10.5px; font-weight: 700; color: #9A9A9A;
          text-transform: uppercase; letter-spacing: 0.06em;
          padding: 8px 20px 4px;
        }

        .cmd-item {
          display: flex; align-items: center; gap: 12px;
          width: 100%; padding: 10px 20px; border: none; background: none;
          cursor: pointer; font-family: inherit; text-align: left;
          transition: background 0.08s;
        }

        .cmd-item--active { background: #1B2B4B0F; }

        .cmd-item-icon { color: #5C5C5C; flex-shrink: 0; }
        .cmd-item--active .cmd-item-icon { color: #1B2B4B; }

        .cmd-item-label { font-size: 14px; font-weight: 500; color: #0a0a0a; flex: 1; }
        .cmd-item--active .cmd-item-label { color: #1B2B4B; }

        .cmd-item-desc { font-size: 12px; color: #9A9A9A; }

        .cmd-footer {
          border-top: 1px solid #F4F4F4; padding: 10px 20px;
          display: flex; gap: 16px;
          font-size: 11px; color: #C0C0C0;
        }

        .cmd-footer kbd {
          display: inline-block; font-size: 10px; background: #F4F4F4;
          border: 1px solid #E8E8E8; border-radius: 3px;
          padding: 1px 4px; font-family: inherit; margin-right: 3px;
          color: #9A9A9A;
        }
      `}</style>
    </div>
  )
}
