'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X, ChevronDown, GripVertical, Calendar, User, Tag, FileText, Filter, Search, MoreHorizontal, Edit2, Trash2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { ClientSearchSelect } from '@/components/ui/ClientSearchSelect'

export type ContentStatus = 'idea' | 'produccio' | 'revisio' | 'publicat'

const COLUMNS: { key: ContentStatus; label: string; color: string; bg: string }[] = [
  { key: 'idea',      label: 'Idea',        color: '#6B7280', bg: '#F9FAFB' },
  { key: 'produccio', label: 'En producció', color: '#D97706', bg: '#FFFBEB' },
  { key: 'revisio',   label: 'En revisió',  color: '#2563EB', bg: '#EFF6FF' },
  { key: 'publicat',  label: 'Publicat',    color: '#16A34A', bg: '#F0FDF4' },
]

const FORMATS = ['Post', 'Reel', 'Story', 'Carrusel', 'Video', 'Blog', 'Email', 'Podcast', 'Infografia', 'Altre']
const CHANNELS = ['Instagram', 'LinkedIn', 'TikTok', 'YouTube', 'Twitter/X', 'Facebook', 'Web', 'Newsletter', 'Altre']

export interface ContentItem {
  id: string
  title: string
  status: ContentStatus
  format?: string | null
  channel?: string | null
  client_id?: string | null
  assigned_to?: string | null
  due_date?: string | null
  notes?: string | null
  created_at: string
  client?: { id: string; name: string; logo_url?: string | null } | null
  assignee?: { id: string; full_name: string; avatar_url?: string | null } | null
}

interface Props {
  items: ContentItem[]
  clients: { id: string; name: string; logo_url?: string | null }[]
  profiles: { id: string; full_name: string; avatar_url?: string | null }[]
  currentUserId: string
}

function avColor(name: string) {
  const colors = ['#254067','#7C3AED','#059669','#D97706','#DC2626','#2563EB','#0891B2','#65A30D']
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[Math.abs(h)]
}

function Av({ name, url, size = 24 }: { name: string; url?: string | null; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: url ? undefined : avColor(name), flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: 'white' }}>
      {url ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(name)}
    </div>
  )
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const today = new Date(); today.setHours(0,0,0,0)
  const dd = new Date(d); dd.setHours(0,0,0,0)
  const diff = Math.round((dd.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Avui'
  if (diff === 1) return 'Demà'
  if (diff === -1) return 'Ahir'
  return d.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })
}

function isOverdue(due: string) {
  return new Date(due).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)
}

// ── Item Card ──
function ItemCard({
  item, onEdit, onDelete, onMove, columns
}: {
  item: ContentItem
  onEdit: (item: ContentItem) => void
  onDelete: (id: string) => void
  onMove: (id: string, status: ContentStatus) => void
  columns: typeof COLUMNS
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const col = columns.find(c => c.key === item.status)
  const overdue = item.due_date && isOverdue(item.due_date) && item.status !== 'publicat'

  return (
    <div className="ci-card" onClick={() => onEdit(item)}>
      <div className="ci-card-top">
        <span className="ci-title">{item.title}</span>
        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button className="ci-menu-btn" onClick={() => setMenuOpen(o => !o)}><MoreHorizontal size={14} /></button>
          {menuOpen && (
            <div className="ci-menu-drop">
              {columns.filter(c => c.key !== item.status).map(c => (
                <button key={c.key} className="ci-menu-item" onClick={() => { onMove(item.id, c.key); setMenuOpen(false) }}>
                  → {c.label}
                </button>
              ))}
              <div className="ci-menu-sep" />
              <button className="ci-menu-item" onClick={() => { onEdit(item); setMenuOpen(false) }}>
                <Edit2 size={12} /> Editar
              </button>
              <button className="ci-menu-item ci-menu-item--del" onClick={() => { onDelete(item.id); setMenuOpen(false) }}>
                <Trash2 size={12} /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="ci-tags">
        {item.format && <span className="ci-tag">{item.format}</span>}
        {item.channel && <span className="ci-tag ci-tag--ch">{item.channel}</span>}
      </div>

      <div className="ci-card-footer">
        <div className="ci-meta">
          {item.client && (
            <span className="ci-client" title={item.client.name}>
              {item.client.logo_url
                ? <img src={item.client.logo_url} alt="" className="ci-client-logo" />
                : <div className="ci-client-av" style={{ background: avColor(item.client.name) }}>{item.client.name.slice(0,1)}</div>}
              <span className="ci-client-name">{item.client.name}</span>
            </span>
          )}
          {item.due_date && (
            <span className={`ci-date${overdue ? ' ci-date--overdue' : ''}`}>
              <Calendar size={10} />{fmtDate(item.due_date)}
            </span>
          )}
        </div>
        {item.assignee && (
          <Av name={item.assignee.full_name} url={item.assignee.avatar_url} size={22} />
        )}
      </div>
    </div>
  )
}

// ── Item Form Modal ──
function ItemModal({
  item, clients, profiles, currentUserId, onSave, onClose
}: {
  item: Partial<ContentItem> | null
  clients: Props['clients']
  profiles: Props['profiles']
  currentUserId: string
  onSave: (data: Partial<ContentItem>) => void
  onClose: () => void
}) {
  const isNew = !item?.id
  const [form, setForm] = useState({
    title: item?.title || '',
    status: item?.status || 'idea' as ContentStatus,
    format: item?.format || '',
    channel: item?.channel || '',
    client_id: item?.client_id || '',
    assigned_to: item?.assigned_to || '',
    due_date: item?.due_date || '',
    notes: item?.notes || '',
  })

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))
  const valid = form.title.trim().length > 0

  return (
    <div className="ci-modal-bg" onClick={onClose}>
      <div className="ci-modal" onClick={e => e.stopPropagation()}>
        <div className="ci-modal-hdr">
          <span className="ci-modal-title">{isNew ? 'Nou contingut' : 'Editar contingut'}</span>
          <button className="ci-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="ci-modal-body">
          <div className="ci-field">
            <label>Títol *</label>
            <input className="ci-input" placeholder="Títol del contingut..." value={form.title} onChange={set('title')} autoFocus />
          </div>
          <div className="ci-row2">
            <div className="ci-field">
              <label>Estat</label>
              <select className="ci-select" value={form.status} onChange={set('status')}>
                {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className="ci-field">
              <label>Data entrega</label>
              <input type="date" className="ci-input" value={form.due_date} onChange={set('due_date')} />
            </div>
          </div>
          <div className="ci-row2">
            <div className="ci-field">
              <label>Format</label>
              <select className="ci-select" value={form.format} onChange={set('format')}>
                <option value="">— Format —</option>
                {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="ci-field">
              <label>Canal</label>
              <select className="ci-select" value={form.channel} onChange={set('channel')}>
                <option value="">— Canal —</option>
                {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="ci-field">
            <label>Client</label>
            <ClientSearchSelect
              clients={clients}
              value={form.client_id}
              onChange={(id) => setForm(f => ({ ...f, client_id: id }))}
              placeholder="Cerca client..."
              emptyLabel="Sense client"
            />
          </div>
          <div className="ci-field">
            <label>Assignat a</label>
            <select className="ci-select" value={form.assigned_to} onChange={set('assigned_to')}>
              <option value="">— Sense assignar —</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div className="ci-field">
            <label>Notes</label>
            <textarea className="ci-textarea" rows={3} placeholder="Notes, idea, referència..." value={form.notes} onChange={set('notes')} />
          </div>
        </div>

        <div className="ci-modal-footer">
          <button className="ci-btn-sec" onClick={onClose}>Cancel·lar</button>
          <button className="ci-btn-pri" onClick={() => valid && onSave(form)} disabled={!valid}>
            {isNew ? 'Crear' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ──
export function ContentPipeline({ items: initialItems, clients, profiles, currentUserId }: Props) {
  const supabase = createClient()
  const [items, setItems] = useState<ContentItem[]>(initialItems)
  const [filterClient, setFilterClient] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [search, setSearch] = useState('')
  const [editItem, setEditItem] = useState<Partial<ContentItem> | null | false>(false)
  const [loading, setLoading] = useState(false)

  const filtered = items.filter(it => {
    if (filterClient && it.client_id !== filterClient) return false
    if (filterAssignee && it.assigned_to !== filterAssignee) return false
    if (search && !it.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const byStatus = (s: ContentStatus) => filtered.filter(it => it.status === s)

  const handleSave = async (data: Partial<ContentItem>) => {
    setLoading(true)
    const isNew = !editItem || !(editItem as ContentItem).id
    const payload = {
      title: data.title,
      status: data.status || 'idea',
      format: data.format || null,
      channel: data.channel || null,
      client_id: data.client_id || null,
      assigned_to: data.assigned_to || null,
      due_date: data.due_date || null,
      notes: data.notes || null,
      created_by: currentUserId,
    }

    const clientObj = data.client_id ? clients.find(c => c.id === data.client_id) || null : null
    const assigneeObj = data.assigned_to ? profiles.find(p => p.id === data.assigned_to) || null : null

    if (isNew) {
      const { data: created, error } = await supabase
        .from('content_items')
        .insert(payload)
        .select('id, created_at')
        .single()
      if (error) {
        console.error('[ContentPipeline] insert error:', error)
        alert(`Error al crear: ${error.message}`)
      } else {
        const newItem: ContentItem = {
          id: created?.id ?? crypto.randomUUID(),
          created_at: created?.created_at ?? new Date().toISOString(),
          title: payload.title!,
          status: (payload.status as ContentStatus) || 'idea',
          format: payload.format ?? null,
          channel: payload.channel ?? null,
          client_id: payload.client_id ?? null,
          assigned_to: payload.assigned_to ?? null,
          due_date: payload.due_date ?? null,
          notes: payload.notes ?? null,
          client: clientObj,
          assignee: assigneeObj,
        }
        setItems(prev => [newItem, ...prev])
      }
    } else {
      const id = (editItem as ContentItem).id
      const { error } = await supabase
        .from('content_items')
        .update(payload)
        .eq('id', id)
      if (error) {
        console.error('[ContentPipeline] update error:', error)
        alert(`Error al guardar: ${error.message}`)
      } else {
        setItems(prev => prev.map(it => it.id === id ? {
          ...it,
          title: payload.title!,
          status: (payload.status as ContentStatus) || it.status,
          format: payload.format ?? null,
          channel: payload.channel ?? null,
          client_id: payload.client_id ?? null,
          assigned_to: payload.assigned_to ?? null,
          due_date: payload.due_date ?? null,
          notes: payload.notes ?? null,
          client: clientObj,
          assignee: assigneeObj,
        } : it))
      }
    }
    setLoading(false)
    setEditItem(false)
  }

  const handleMove = async (id: string, status: ContentStatus) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, status } : it))
    await supabase.from('content_items').update({ status }).eq('id', id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar aquest contingut?')) return
    setItems(prev => prev.filter(it => it.id !== id))
    await supabase.from('content_items').delete().eq('id', id)
  }

  return (
    <div className="cp-root">
      {/* Toolbar */}
      <div className="cp-toolbar">
        <div className="cp-search-wrap">
          <Search size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
          <input className="cp-search" placeholder="Cerca contingut..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="cp-filter-sel" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
          <option value="">Tots els clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="cp-filter-sel" value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
          <option value="">Tots els membres</option>
          {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
        <button className="cp-btn-new" onClick={() => setEditItem({})}>
          <Plus size={14} /> Nou contingut
        </button>
      </div>

      {/* Kanban board */}
      <div className="cp-board">
        {COLUMNS.map(col => {
          const colItems = byStatus(col.key)
          return (
            <div key={col.key} className="cp-col">
              <div className="cp-col-hdr">
                <div className="cp-col-dot" style={{ background: col.color }} />
                <span className="cp-col-label" style={{ color: col.color }}>{col.label}</span>
                <span className="cp-col-count">{colItems.length}</span>
                <button className="cp-col-add" onClick={() => setEditItem({ status: col.key })} title="Nou">
                  <Plus size={13} />
                </button>
              </div>
              <div className="cp-col-body">
                {colItems.length === 0 && (
                  <div className="cp-empty" onClick={() => setEditItem({ status: col.key })}>
                    <Plus size={14} style={{ opacity: 0.3 }} />
                  </div>
                )}
                {colItems.map(it => (
                  <ItemCard
                    key={it.id}
                    item={it}
                    columns={COLUMNS}
                    onEdit={setEditItem}
                    onDelete={handleDelete}
                    onMove={handleMove}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {editItem !== false && (
        <ItemModal
          item={editItem}
          clients={clients}
          profiles={profiles}
          currentUserId={currentUserId}
          onSave={handleSave}
          onClose={() => setEditItem(false)}
        />
      )}

      <style jsx global>{`
        /* Layout */
        .cp-root { display: flex; flex-direction: column; height: calc(100vh - 60px); padding: 20px 24px; gap: 16px; overflow: hidden; }

        /* Toolbar */
        .cp-toolbar { display: flex; align-items: center; gap: 10px; flex-shrink: 0; flex-wrap: wrap; }
        .cp-search-wrap { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 180px; background: white; border: 1.5px solid #E5E7EB; border-radius: 9px; padding: 0 12px; height: 36px; }
        .cp-search { flex: 1; border: none; outline: none; font-size: 13px; font-family: inherit; background: transparent; color: #111827; }
        .cp-filter-sel { height: 36px; padding: 0 10px; border: 1.5px solid #E5E7EB; border-radius: 9px; font-size: 13px; font-family: inherit; color: #374151; background: white; cursor: pointer; outline: none; }
        .cp-btn-new { display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px; background: #1B2B4B; color: white; border: none; border-radius: 9px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; white-space: nowrap; }
        .cp-btn-new:hover { background: #254067; }

        /* Board */
        .cp-board { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; flex: 1; min-height: 0; }
        .cp-col { display: flex; flex-direction: column; background: #F8F9FB; border-radius: 14px; min-height: 0; overflow: hidden; }

        @media (max-width: 900px) {
          .cp-root { overflow-x: hidden; padding: 14px 16px 90px; }
          .cp-board { display: flex !important; flex-direction: row; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; padding-bottom: 8px; flex: none; min-height: 0; height: calc(100vh - 160px); }
          .cp-col { min-width: 240px; max-width: 240px; scroll-snap-align: start; flex-shrink: 0; height: 100%; }
          .cp-col-body { flex: 1; overflow-y: auto; }
        }
        .cp-col-hdr { display: flex; align-items: center; gap: 8px; padding: 14px 14px 10px; flex-shrink: 0; }
        .cp-col-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .cp-col-label { font-size: 12.5px; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase; }
        .cp-col-count { font-size: 12px; color: #9CA3AF; background: #E5E7EB; border-radius: 10px; padding: 1px 7px; margin-left: 2px; }
        .cp-col-add { margin-left: auto; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: none; background: none; cursor: pointer; color: #9CA3AF; border-radius: 6px; transition: background 0.1s; }
        .cp-col-add:hover { background: #E5E7EB; color: #374151; }
        .cp-col-body { flex: 1; overflow-y: auto; padding: 4px 10px 10px; display: flex; flex-direction: column; gap: 8px; }

        /* Empty */
        .cp-empty { border: 1.5px dashed #D1D5DB; border-radius: 10px; padding: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #D1D5DB; transition: border-color 0.15s; }
        .cp-empty:hover { border-color: #9CA3AF; color: #9CA3AF; }

        /* Card */
        .ci-card { background: white; border-radius: 10px; padding: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); cursor: pointer; transition: box-shadow 0.15s, transform 0.1s; }
        .ci-card:hover { box-shadow: 0 3px 12px rgba(0,0,0,0.12); transform: translateY(-1px); }
        .ci-card-top { display: flex; align-items: flex-start; gap: 6px; margin-bottom: 8px; }
        .ci-title { flex: 1; font-size: 13px; font-weight: 600; color: #111827; line-height: 1.4; word-break: break-word; }
        .ci-menu-btn { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: none; background: none; cursor: pointer; color: #9CA3AF; border-radius: 5px; flex-shrink: 0; }
        .ci-menu-btn:hover { background: #F3F4F6; color: #374151; }
        .ci-menu-drop { position: absolute; top: 100%; right: 0; min-width: 150px; background: white; border: 1px solid #E5E7EB; border-radius: 9px; box-shadow: 0 6px 20px rgba(0,0,0,0.12); z-index: 100; padding: 4px; }
        .ci-menu-item { display: flex; align-items: center; gap: 7px; width: 100%; padding: 7px 10px; border: none; background: none; cursor: pointer; font-size: 12.5px; color: #374151; font-family: inherit; border-radius: 6px; text-align: left; }
        .ci-menu-item:hover { background: #F3F4F6; }
        .ci-menu-item--del { color: #DC2626; }
        .ci-menu-item--del:hover { background: #FEF2F2; }
        .ci-menu-sep { height: 1px; background: #F3F4F6; margin: 4px 0; }
        .ci-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
        .ci-tag { font-size: 11px; padding: 2px 8px; background: #F1F3F5; color: #4B5563; border-radius: 20px; font-weight: 500; }
        .ci-tag--ch { background: #EFF6FF; color: #2563EB; }
        .ci-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .ci-meta { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; flex-wrap: wrap; }
        .ci-client { display: flex; align-items: center; gap: 5px; min-width: 0; }
        .ci-client-logo { width: 16px; height: 16px; border-radius: 3px; object-fit: cover; flex-shrink: 0; }
        .ci-client-av { width: 16px; height: 16px; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 800; color: white; flex-shrink: 0; }
        .ci-client-name { font-size: 11.5px; color: #6B7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px; }
        .ci-date { display: flex; align-items: center; gap: 3px; font-size: 11px; color: #6B7280; white-space: nowrap; }
        .ci-date--overdue { color: #DC2626; font-weight: 600; }

        /* Modal */
        .ci-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 900; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .ci-modal { background: white; border-radius: 16px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .ci-modal-hdr { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid #F3F4F6; position: sticky; top: 0; background: white; z-index: 1; border-radius: 16px 16px 0 0; }
        .ci-modal-title { font-size: 16px; font-weight: 700; color: #111827; }
        .ci-modal-close { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: none; background: none; cursor: pointer; color: #6B7280; border-radius: 6px; }
        .ci-modal-close:hover { background: #F3F4F6; }
        .ci-modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
        .ci-modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #F3F4F6; }
        .ci-field { display: flex; flex-direction: column; gap: 6px; }
        .ci-field label { font-size: 12.5px; font-weight: 600; color: #374151; }
        .ci-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ci-input { height: 36px; padding: 0 12px; border: 1.5px solid #E5E7EB; border-radius: 8px; font-size: 13.5px; font-family: inherit; color: #111827; outline: none; transition: border-color 0.15s; }
        .ci-input:focus { border-color: #1B2B4B; }
        .ci-select { height: 36px; padding: 0 10px; border: 1.5px solid #E5E7EB; border-radius: 8px; font-size: 13.5px; font-family: inherit; color: #111827; background: white; outline: none; cursor: pointer; }
        .ci-textarea { padding: 10px 12px; border: 1.5px solid #E5E7EB; border-radius: 8px; font-size: 13px; font-family: inherit; color: #111827; outline: none; resize: vertical; transition: border-color 0.15s; }
        .ci-textarea:focus { border-color: #1B2B4B; }
        .ci-btn-pri { height: 36px; padding: 0 20px; background: #1B2B4B; color: white; border: none; border-radius: 9px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
        .ci-btn-pri:disabled { opacity: 0.5; cursor: not-allowed; }
        .ci-btn-sec { height: 36px; padding: 0 16px; background: transparent; color: #6B7280; border: 1.5px solid #E5E7EB; border-radius: 9px; font-size: 13px; font-family: inherit; cursor: pointer; }

      `}</style>
    </div>
  )
}
