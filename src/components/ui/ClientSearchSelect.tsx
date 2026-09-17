'use client'

import { useState, useEffect, useRef } from 'react'

interface ClientOpt {
  id: string
  name: string
  logo_url?: string | null
}

interface Props {
  clients: ClientOpt[]
  value: string
  onChange: (id: string, name: string) => void
  placeholder?: string
  emptyLabel?: string
}

function initial(name: string) { return name.slice(0, 2).toUpperCase() }
function avColor(name: string) {
  const colors = ['#254067','#7C3AED','#059669','#D97706','#DC2626','#2563EB','#0891B2','#65A30D']
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[Math.abs(h)]
}

export function ClientSearchSelect({ clients, value, onChange, placeholder = 'Cerca client...', emptyLabel = 'Sense client' }: Props) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selected = clients.find(c => c.id === value)
  const filtered = q ? clients.filter(c => c.name.toLowerCase().includes(q.toLowerCase())) : clients

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className="clisel-trigger" onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50) }}>
        {selected ? (
          <>
            {selected.logo_url
              ? <img src={selected.logo_url} alt="" className="clisel-logo" />
              : <div className="clisel-av" style={{ background: avColor(selected.name) }}>{initial(selected.name)}</div>}
            <span className="clisel-name">{selected.name}</span>
          </>
        ) : (
          <span className="clisel-placeholder">{placeholder}</span>
        )}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto', opacity: 0.35, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="M6 9l6 6 6-6"/></svg>
      </div>
      {open && (
        <div className="clisel-drop">
          <div className="clisel-search-wrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ opacity: 0.35, flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input ref={inputRef} className="clisel-search" placeholder="Cerca..." value={q} onChange={e => setQ(e.target.value)} />
            {q && <button className="clisel-clear" onClick={() => setQ('')}>×</button>}
          </div>
          <div className="clisel-list">
            <button className="clisel-item" onClick={() => { onChange('', ''); setOpen(false); setQ('') }}>
              <span style={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: 12.5 }}>{emptyLabel}</span>
            </button>
            {filtered.length === 0 && <div style={{ padding: '10px 14px', color: '#9CA3AF', fontSize: 12.5 }}>Cap resultat</div>}
            {filtered.map(c => (
              <button key={c.id} className={`clisel-item${c.id === value ? ' clisel-item--sel' : ''}`}
                onClick={() => { onChange(c.id, c.name); setOpen(false); setQ('') }}>
                {c.logo_url
                  ? <img src={c.logo_url} alt="" className="clisel-logo" />
                  : <div className="clisel-av" style={{ background: avColor(c.name) }}>{initial(c.name)}</div>}
                <span className="clisel-item-name">{c.name}</span>
                {c.id === value && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#254067" strokeWidth="2.5" style={{ marginLeft: 'auto', flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            ))}
          </div>
        </div>
      )}
      <style jsx global>{`
        .clisel-trigger { display: flex; align-items: center; gap: 8px; min-height: 36px; padding: 5px 10px; border: 1px solid #E5E7EB; border-radius: 8px; background: white; cursor: pointer; font-size: 13.5px; color: #0a0a0a; transition: border-color 0.15s; }
        .clisel-trigger:hover { border-color: #9CA3AF; }
        .clisel-logo { width: 22px; height: 22px; border-radius: 5px; object-fit: cover; flex-shrink: 0; }
        .clisel-av { width: 22px; height: 22px; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; color: white; flex-shrink: 0; letter-spacing: -0.5px; }
        .clisel-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13.5px; }
        .clisel-placeholder { flex: 1; color: #9CA3AF; font-size: 13px; }
        .clisel-drop { position: absolute; top: calc(100% + 4px); left: 0; right: 0; min-width: 200px; background: white; border: 1px solid #E5E7EB; border-radius: 10px; box-shadow: 0 8px 28px rgba(0,0,0,0.13); z-index: 300; overflow: hidden; }
        .clisel-search-wrap { display: flex; align-items: center; gap: 7px; padding: 8px 10px; border-bottom: 1px solid #F3F4F6; }
        .clisel-search { flex: 1; border: none; outline: none; font-size: 13px; color: #111827; font-family: inherit; background: none; }
        .clisel-clear { background: none; border: none; cursor: pointer; color: #9CA3AF; font-size: 16px; padding: 0 2px; line-height: 1; }
        .clisel-list { max-height: 220px; overflow-y: auto; padding: 4px; }
        .clisel-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 10px; border: none; background: none; cursor: pointer; border-radius: 7px; text-align: left; transition: background 0.1s; font-family: inherit; }
        .clisel-item:hover { background: #F8F9FB; }
        .clisel-item--sel { background: #EFF6FF; }
        .clisel-item-name { font-size: 13px; color: #111827; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      `}</style>
    </div>
  )
}
