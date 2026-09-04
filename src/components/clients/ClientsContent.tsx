'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Users, FolderKanban, CheckSquare, MoreHorizontal, Pencil, Trash2, LayoutGrid, List, Table2, BarChart2 } from 'lucide-react'
import { cn, clientTypeLabels, getInitials } from '@/lib/utils'
import { NewClientModal } from './NewClientModal'
import type { Client } from '@/types'

const healthConfig = {
  healthy: { label: 'Healthy', bg: '#F0FDF4', color: '#16A34A', dot: '#16A34A' },
  attention: { label: 'Attention', bg: '#FFFBEB', color: '#D97706', dot: '#D97706' },
  risk: { label: 'Risk', bg: '#FEF2F2', color: '#DC2626', dot: '#DC2626' },
}

const statusFilter = ['Tots', 'Actius', 'Pausats', 'Inactius']
const statusMap: Record<string, string> = { Actius: 'active', Pausats: 'paused', Inactius: 'inactive' }

interface Props {
  clients: Client[]
  profiles: { id: string; full_name: string }[]
  userRole?: string
}

export function ClientsContent({ clients: initialClients, profiles, userRole }: Props) {
  const PAGE_SIZE = 10
  const [clients, setClients] = useState(initialClients)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Tots')
  const [view, setView] = useState<'grid' | 'list' | 'table'>('grid')
  const [isMobile, setIsMobile] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setView('grid')
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  const [showNew, setShowNew] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editName, setEditName] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filter === 'Tots' || c.status === statusMap[filter]
    return matchSearch && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function changeSearch(v: string) { setSearch(v); setPage(1) }
  function changeFilter(f: string) { setFilter(f); setPage(1) }

  const canManage = userRole === 'superadmin' || userRole === 'manager'

  function openEdit(client: Client) {
    setEditingClient(client)
    setEditName(client.name)
    setEditError('')
  }

  async function saveEdit() {
    if (!editingClient) return
    if (!editName.trim()) { setEditError('El nom no pot estar buit'); return }
    setEditSaving(true)
    setEditError('')
    try {
      const res = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error')
      setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, name: editName.trim() } : c))
      setEditingClient(null)
    } catch (err: any) {
      setEditError(err.message)
    } finally {
      setEditSaving(false)
    }
  }

  function deleteClient(client: Client) {
    setDeletingClient(client)
  }

  async function confirmDelete() {
    if (!deletingClient) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/clients/${deletingClient.id}`, { method: 'DELETE' })
      if (res.ok) {
        setClients(prev => prev.filter(c => c.id !== deletingClient.id))
        setDeletingClient(null)
      } else {
        const json = await res.json()
        alert(json.error || 'Error esborrant client')
      }
    } catch {
      alert('Error de connexió')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="clients-page">
      {/* Toolbar */}
      <div className="clients-toolbar">
        {/* Row 1: cerca + botó */}
        <div className="toolbar-row1">
          <div className="clients-search-wrap">
            <Search size={14} color="#9A9A9A" />
            <input
              type="text"
              placeholder="Buscar client..."
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
              className="clients-search"
            />
          </div>

          {!isMobile && (
            <div className="view-toggle">
              <button className={cn('view-btn', view === 'grid' && 'view-btn--active')} onClick={() => setView('grid')} title="Graella">
                <LayoutGrid size={14} />
              </button>
              <button className={cn('view-btn', view === 'list' && 'view-btn--active')} onClick={() => setView('list')} title="Llista">
                <List size={14} />
              </button>
              <button className={cn('view-btn', view === 'table' && 'view-btn--active')} onClick={() => setView('table')} title="Taula">
                <Table2 size={14} />
              </button>
            </div>
          )}

          {canManage && (
            <button className="btn-primary" onClick={() => setShowNew(true)}>
              <Plus size={14} strokeWidth={2.5} />
              {isMobile ? 'Nou client' : 'Nou client'}
            </button>
          )}
        </div>

        {/* Row 2: filtres */}
        <div className="clients-filters">
          {statusFilter.map((f) => (
            <button
              key={f}
              onClick={() => changeFilter(f)}
              className={cn('filter-btn', filter === f && 'filter-btn--active')}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Count + pagination info */}
      <div className="clients-count">
        {filtered.length} {filtered.length === 1 ? 'client' : 'clients'}
        {totalPages > 1 && (
          <span className="clients-page-info"> · pàgina {safePage} de {totalPages}</span>
        )}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="clients-empty">
          <Users size={32} color="#D0D0D0" />
          <p>Cap client trobat.</p>
          {canManage && (
            <button className="btn-primary" onClick={() => setShowNew(true)}>
              <Plus size={14} strokeWidth={2.5} /> Nou client
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="clients-grid">
          {paginated.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              canManage={canManage}
              isSuperadmin={userRole === 'superadmin'}
              onEdit={() => openEdit(client)}
              onDelete={() => deleteClient(client)}
            />
          ))}
        </div>
      ) : view === 'list' ? (
        <div className="clients-list">
          {paginated.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              canManage={canManage}
              onEdit={() => openEdit(client)}
              onDelete={() => deleteClient(client)}
            />
          ))}
        </div>
      ) : (
        <ClientTable
          clients={paginated}
          canManage={canManage}
          onEdit={openEdit}
          onDelete={deleteClient}
        />
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pag-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >
            ‹ Anterior
          </button>
          <div className="pag-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={cn('pag-num', p === safePage && 'pag-num--active')}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            className="pag-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >
            Següent ›
          </button>
        </div>
      )}

      {/* New client modal */}
      {showNew && (
        <NewClientModal profiles={profiles} onClose={() => setShowNew(false)} />
      )}

      {/* Delete confirmation modal */}
      {deletingClient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 380, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.16)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#0F1B2D', letterSpacing: '-0.2px' }}>Esborrar client</h3>
            <p style={{ margin: '0 0 22px', fontSize: 13.5, color: '#5C6B80', lineHeight: 1.6 }}>
              Segur que vols esborrar <strong>"{deletingClient.name}"</strong>? Aquesta acció no es pot desfer.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDeletingClient(null)} disabled={deleteLoading}
                style={{ padding: '9px 18px', background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontWeight: 500, color: '#5C6B80' }}>
                Cancel·lar
              </button>
              <button onClick={confirmDelete} disabled={deleteLoading}
                style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: deleteLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }}>
                {deleteLoading ? 'Esborrant...' : 'Sí, esborrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit name modal */}
      {editingClient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 400, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.16)' }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: '#0F1B2D', letterSpacing: '-0.2px' }}>Editar client</h3>
            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#A0A9BB', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nom</label>
            <input
              autoFocus
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveEdit()}
              style={{ width: '100%', padding: '10px 13px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, fontSize: 14, boxSizing: 'border-box', outline: 'none', color: '#0F1B2D', fontFamily: 'inherit' }}
            />
            {editError && <p style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>{editError}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button onClick={() => setEditingClient(null)}
                style={{ padding: '9px 18px', background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontWeight: 500, color: '#5C6B80' }}>
                Cancel·lar
              </button>
              <button onClick={saveEdit} disabled={editSaving}
                style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #1B2B4B, #2563EB)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: editSaving ? 'wait' : 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                {editSaving ? 'Guardant...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .clients-page {
          flex: 1;
          padding: 24px 28px 40px;
        }

        @media (max-width: 1023px) {
          .clients-page { padding: 16px 16px 32px; }
        }
        @media (max-width: 767px) {
          .clients-page { padding: 10px 12px 80px; }
          .clients-toolbar { gap: 6px; }
          .toolbar-row1 { gap: 8px; }
          .clients-search-wrap { max-width: 100%; min-width: 0; }
          .clients-filters { gap: 5px; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 2px; }
          .filter-btn { height: 32px; padding: 0 10px; font-size: 12px; white-space: nowrap; flex-shrink: 0; }
          .btn-primary { padding: 0 14px; white-space: nowrap; flex-shrink: 0; }
          .clients-grid { grid-template-columns: 1fr; }
          .clients-count { font-size: 11.5px; margin-bottom: 10px; }
        }

        .clients-toolbar {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 16px;
        }

        .toolbar-row1 {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .clients-search-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 38px;
          padding: 0 13px;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 10px;
          background: white;
          flex: 1;
          min-width: 200px;
          max-width: 360px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .clients-search-wrap:focus-within {
          border-color: rgba(37,99,235,0.3);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
        }

        .clients-search {
          flex: 1;
          border: none;
          outline: none;
          font-size: 13.5px;
          color: #0F1B2D;
          background: transparent;
        }

        .clients-search::placeholder { color: #C8D0DC; }

        .clients-filters {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .filter-btn {
          height: 36px;
          padding: 0 13px;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 10px;
          font-size: 13px;
          color: #5C6B80;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          font-weight: 500;
        }

        .filter-btn:hover {
          border-color: rgba(0,0,0,0.14);
          color: #0F1B2D;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          transform: translateY(-1px);
        }

        .filter-btn--active {
          background: linear-gradient(135deg, #1B2B4B, #2563EB);
          border-color: transparent;
          color: white;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(37,99,235,0.25);
        }

        .filter-btn--active:hover {
          background: linear-gradient(135deg, #0F1E33, #1D4ED8);
          color: white;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 16px;
          background: linear-gradient(135deg, #1B2B4B, #2563EB);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(37,99,235,0.3);
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #0F1E33, #1D4ED8);
          box-shadow: 0 4px 14px rgba(37,99,235,0.38);
          transform: translateY(-1px);
        }

        .clients-count {
          font-size: 12.5px;
          color: #A0A9BB;
          margin-bottom: 16px;
          font-weight: 500;
        }

        .clients-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 80px 24px;
          color: #A0A9BB;
          font-size: 14px;
        }

        .view-toggle {
          display: flex;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 10px;
          overflow: hidden;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .view-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: transparent;
          color: #A0A9BB;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          border-right: 1px solid rgba(0,0,0,0.07);
        }
        .view-btn:last-child { border-right: none; }
        .view-btn:hover { background: #F5F8FF; color: #1B2B4B; }
        .view-btn--active { background: linear-gradient(135deg, #1B2B4B, #2563EB); color: white; }
        .view-btn--active:hover { background: linear-gradient(135deg, #0F1E33, #1D4ED8); color: white; }

        .clients-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          grid-auto-rows: 1fr;
          gap: 16px;
          align-items: stretch;
        }

        .clients-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .clients-page-info {
          color: #C0C9D8;
          font-weight: 400;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding-top: 8px;
          margin-top: 4px;
        }

        .pag-btn {
          height: 36px;
          padding: 0 16px;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 10px;
          background: white;
          font-size: 13px;
          font-weight: 500;
          color: #5C6B80;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .pag-btn:hover:not(:disabled) {
          background: #F5F8FF;
          border-color: rgba(37,99,235,0.2);
          color: #1B2B4B;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        }
        .pag-btn:disabled {
          opacity: 0.35;
          cursor: default;
        }

        .pag-pages {
          display: flex;
          gap: 4px;
        }

        .pag-num {
          width: 36px;
          height: 36px;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 10px;
          background: white;
          font-size: 13px;
          font-weight: 500;
          color: #5C6B80;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .pag-num:hover {
          background: #F5F8FF;
          border-color: rgba(37,99,235,0.2);
          color: #1B2B4B;
        }
        .pag-num--active {
          background: linear-gradient(135deg, #1B2B4B, #2563EB);
          border-color: transparent;
          color: white;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(37,99,235,0.3);
        }
        .pag-num--active:hover {
          background: linear-gradient(135deg, #0F1E33, #1D4ED8);
          color: white;
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────
// Client card
// ─────────────────────────────────────────────
interface CardProps {
  client: Client
  canManage: boolean
  isSuperadmin?: boolean
  onEdit: () => void
  onDelete: () => void
}

function ClientCard({ client, canManage, isSuperadmin, onEdit, onDelete }: CardProps) {
  const health = healthConfig[client.health] || healthConfig.healthy
  const projectCount = (client as any).projects?.[0]?.count || 0
  const taskCount = (client as any).tasks?.[0]?.count || 0
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Link href={`/clients/${client.id}`} className="client-card" style={{ flex: 1 }}>
        <div className="client-card-header">
          <div className="client-avatar">
            {client.logo_url ? (
              <img src={client.logo_url} alt={client.name} />
            ) : (
              <span>{getInitials(client.name)}</span>
            )}
          </div>
          <div className="client-card-info">
            <div className="client-name">{client.name}</div>
            <div className="client-type">{clientTypeLabels[client.type] || client.type}</div>
          </div>
          <div className="client-health" style={{ background: health.bg, color: health.color }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: health.dot, display: 'inline-block', marginRight: 5 }} />
            {health.label}
          </div>
        </div>

        <div className="client-responsible">
          {client.responsible ? (
            <>
              <div className="resp-avatar">{getInitials(client.responsible.full_name)}</div>
              <span>{client.responsible.full_name}</span>
            </>
          ) : (
            <span style={{ color: '#C8D0DC', fontSize: 12, fontStyle: 'italic' }}>Sense responsable</span>
          )}
        </div>

        <div className="client-stats">
          <span><FolderKanban size={12} />{projectCount} projectes</span>
          <span><CheckSquare size={12} />{taskCount} tasques</span>
        </div>
        {isSuperadmin && (
          <Link
            href={`/finances?s=cartera`}
            onClick={e => e.stopPropagation()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, padding: '3px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: 11.5, fontWeight: 600, color: '#2563EB', textDecoration: 'none', width: 'fit-content', transition: 'background 0.12s' }}
          >
            <BarChart2 size={11} /> Finances
          </Link>
        )}
      </Link>

      {/* Actions menu */}
      {canManage && (
        <div ref={menuRef} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(o => !o) }}
            style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid transparent', background: menuOpen ? '#F0F0F0' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9A9A9A' }}
            className="card-menu-btn"
            title="Opcions"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', top: 32, right: 0, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.14)', minWidth: 152, overflow: 'hidden', zIndex: 20 }}>
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); onEdit() }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', color: '#0a0a0a', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <Pencil size={13} style={{ color: '#9A9A9A' }} /> Editar nom
              </button>
              <div style={{ height: 1, background: '#F0F0F0' }} />
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); onDelete() }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', color: '#DC2626', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <Trash2 size={13} /> Esborrar
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        :global(.client-card) {
          background: white;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 18px;
          padding: 20px;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
        }

        :global(.client-card:hover) {
          box-shadow: 0 8px 28px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.04);
          border-color: rgba(37,99,235,0.15);
          transform: translateY(-2px);
        }

        @media (max-width: 767px) {
          :global(.client-card) { padding: 16px; border-radius: 16px; gap: 10px; }
          .client-name { font-size: 15px; padding-right: 0; }
          .client-type { font-size: 12px; }
          .client-stats { padding-top: 10px; }
        }

        :global(.client-card:hover) + * .card-menu-btn,
        .card-menu-btn:hover {
          border-color: #E8E8E8 !important;
          background: #F5F5F5 !important;
          color: #555 !important;
        }

        .client-card-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .client-avatar {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: linear-gradient(135deg, #3B82F6, #1B2B4B);
          color: white;
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        .client-avatar img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .client-card-info {
          flex: 1;
          min-width: 0;
        }

        .client-name {
          font-size: 14.5px;
          font-weight: 700;
          color: #0F1B2D;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding-right: 24px;
          letter-spacing: -0.2px;
        }

        .client-type {
          font-size: 11.5px;
          color: #A0A9BB;
          margin-top: 3px;
          font-weight: 500;
        }

        .client-health {
          font-size: 10.5px;
          font-weight: 600;
          padding: 4px 9px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .client-responsible {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: #5C6B80;
          font-weight: 500;
        }

        .resp-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3B6FD4, #1B2B4B);
          color: white;
          font-size: 8px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .client-stats {
          display: flex;
          gap: 14px;
          border-top: 1px solid rgba(0,0,0,0.05);
          padding-top: 13px;
          font-size: 12px;
          color: #A0A9BB;
          font-weight: 500;
        }

        .client-stats span {
          display: flex;
          align-items: center;
          gap: 5px;
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────
// List row view
// ─────────────────────────────────────────────
function ClientRow({ client, canManage, onEdit, onDelete }: CardProps) {
  const health = healthConfig[client.health] || healthConfig.healthy
  const projectCount = (client as any).projects?.[0]?.count || 0
  const taskCount = (client as any).tasks?.[0]?.count || 0
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <div style={{ position: 'relative' }}>
      <Link href={`/clients/${client.id}`} className="client-row">
        <div className="cr-avatar">
          {client.logo_url
            ? <img src={client.logo_url} alt={client.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <span>{getInitials(client.name)}</span>}
        </div>

        <div className="cr-main">
          <div className="cr-name">{client.name}</div>
          <div className="cr-type">{clientTypeLabels[client.type] || client.type}</div>
        </div>

        <div className="cr-health" style={{ background: health.bg, color: health.color }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: health.dot, display: 'inline-block', marginRight: 5 }} />
          {health.label}
        </div>

        <div className="cr-resp">
          {client.responsible ? (
            <>
              <div className="cr-resp-avatar">{getInitials(client.responsible.full_name)}</div>
              <span className="cr-resp-name">{client.responsible.full_name}</span>
            </>
          ) : (
            <span style={{ color: '#C8D0DC', fontSize: 12, fontStyle: 'italic' }}>Sense responsable</span>
          )}
        </div>

        <div className="cr-stats">
          <span><FolderKanban size={11} />{projectCount}</span>
          <span><CheckSquare size={11} />{taskCount}</span>
        </div>

        {canManage && <div style={{ width: 26 }} />}
      </Link>

      {canManage && (
        <div ref={menuRef} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: 14, zIndex: 10 }}>
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(o => !o) }}
            style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid transparent', background: menuOpen ? '#F0F0F0' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9A9A9A' }}
            className="card-menu-btn"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', top: 32, right: 0, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.14)', minWidth: 152, overflow: 'hidden', zIndex: 20 }}>
              <button onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); onEdit() }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', color: '#0a0a0a', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <Pencil size={13} style={{ color: '#9A9A9A' }} /> Editar nom
              </button>
              <div style={{ height: 1, background: '#F0F0F0' }} />
              <button onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); onDelete() }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', color: '#DC2626', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <Trash2 size={13} /> Esborrar
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        :global(.client-row) {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          background: white;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 14px;
          text-decoration: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s;
        }
        :global(.client-row:hover) {
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
          border-color: rgba(37,99,235,0.15);
          transform: translateY(-1px);
        }
        .cr-avatar {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, #3B82F6, #1B2B4B);
          color: white; font-size: 13px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .cr-main { flex: 1; min-width: 0; }
        .cr-name { font-size: 14px; font-weight: 700; color: #0F1B2D; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cr-type { font-size: 11.5px; color: #A0A9BB; margin-top: 2px; font-weight: 500; }
        .cr-health { font-size: 10.5px; font-weight: 600; padding: 4px 9px; border-radius: 8px; display: flex; align-items: center; white-space: nowrap; flex-shrink: 0; }
        .cr-resp { display: flex; align-items: center; gap: 7px; flex-shrink: 0; min-width: 140px; }
        .cr-resp-avatar { width: 22px; height: 22px; border-radius: 50%; background: linear-gradient(135deg, #3B6FD4, #1B2B4B); color: white; font-size: 8px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cr-resp-name { font-size: 12.5px; color: #5C6B80; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
        .cr-stats { display: flex; gap: 12px; font-size: 12px; color: #A0A9BB; font-weight: 500; flex-shrink: 0; }
        .cr-stats span { display: flex; align-items: center; gap: 4px; }

        @media (max-width: 767px) {
          :global(.client-row) {
            display: grid;
            grid-template-columns: 44px 1fr auto;
            grid-template-rows: auto auto;
            gap: 2px 12px;
            padding: 14px 14px;
            border-radius: 16px;
          }
          .cr-avatar { grid-column: 1; grid-row: 1 / 3; align-self: center; }
          .cr-main { grid-column: 2; grid-row: 1; }
          .cr-health { grid-column: 3; grid-row: 1; align-self: center; font-size: 10px; padding: 3px 8px; }
          .cr-resp { grid-column: 2; grid-row: 2; min-width: 0; }
          .cr-resp-name { max-width: 160px; font-size: 11.5px; color: #8896A8; }
          .cr-stats { display: none; }
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────
// Table view
// ─────────────────────────────────────────────
function ClientTable({ clients, canManage, onEdit, onDelete }: {
  clients: Client[]
  canManage: boolean
  onEdit: (c: Client) => void
  onDelete: (c: Client) => void
}) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpenId) return
    function handleClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpenId(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpenId])

  return (
    <div className="ct-wrap">
      <div className="ct-table">
        <div className="ct-head">
          <div className="ct-th" style={{ flex: 2 }}>Client</div>
          <div className="ct-th">Tipus</div>
          <div className="ct-th">Estat</div>
          <div className="ct-th">Responsable</div>
          <div className="ct-th" style={{ textAlign: 'center' }}>Projectes</div>
          <div className="ct-th" style={{ textAlign: 'center' }}>Tasques</div>
          {canManage && <div className="ct-th" style={{ width: 40 }} />}
        </div>

        {clients.map((client) => {
          const health = healthConfig[client.health] || healthConfig.healthy
          const projectCount = (client as any).projects?.[0]?.count || 0
          const taskCount = (client as any).tasks?.[0]?.count || 0
          const isOpen = menuOpenId === client.id

          return (
            <div key={client.id} className="ct-row-wrap" style={{ position: 'relative' }}>
              <Link href={`/clients/${client.id}`} className="ct-row">
                <div className="ct-td" style={{ flex: 2 }}>
                  <div className="ct-avatar">
                    {client.logo_url
                      ? <img src={client.logo_url} alt={client.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      : <span>{getInitials(client.name)}</span>}
                  </div>
                  <div>
                    <div className="ct-name">{client.name}</div>
                  </div>
                </div>
                <div className="ct-td">
                  <span className="ct-type">{clientTypeLabels[client.type] || client.type}</span>
                </div>
                <div className="ct-td">
                  <span className="ct-health" style={{ background: health.bg, color: health.color }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: health.dot, display: 'inline-block', marginRight: 4 }} />
                    {health.label}
                  </span>
                </div>
                <div className="ct-td">
                  {client.responsible ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="ct-resp-av">{getInitials(client.responsible.full_name)}</div>
                      <span className="ct-resp-name">{client.responsible.full_name}</span>
                    </div>
                  ) : (
                    <span style={{ color: '#C8D0DC', fontSize: 12, fontStyle: 'italic' }}>—</span>
                  )}
                </div>
                <div className="ct-td" style={{ justifyContent: 'center' }}>
                  <span className="ct-count">{projectCount}</span>
                </div>
                <div className="ct-td" style={{ justifyContent: 'center' }}>
                  <span className="ct-count">{taskCount}</span>
                </div>
                {canManage && <div style={{ width: 40 }} />}
              </Link>

              {canManage && (
                <div ref={isOpen ? menuRef : undefined} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: 12, zIndex: 10 }}>
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpenId(isOpen ? null : client.id) }}
                    style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid transparent', background: isOpen ? '#F0F0F0' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9A9A9A' }}
                    className="card-menu-btn"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {isOpen && (
                    <div style={{ position: 'absolute', top: 32, right: 0, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.14)', minWidth: 152, overflow: 'hidden', zIndex: 20 }}>
                      <button onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpenId(null); onEdit(client) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', color: '#0a0a0a', textAlign: 'left' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F5')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        <Pencil size={13} style={{ color: '#9A9A9A' }} /> Editar nom
                      </button>
                      <div style={{ height: 1, background: '#F0F0F0' }} />
                      <button onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpenId(null); onDelete(client) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', color: '#DC2626', textAlign: 'left' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        <Trash2 size={13} /> Esborrar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style jsx>{`
        .ct-wrap {
          background: white;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
        }
        .ct-table { display: flex; flex-direction: column; }
        .ct-head {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 18px; background: #FAFBFD;
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .ct-th {
          font-size: 10.5px; font-weight: 700; color: #A0A9BB;
          text-transform: uppercase; letter-spacing: 0.06em;
          flex: 1; display: flex; align-items: center;
        }
        .ct-row-wrap { border-bottom: 1px solid rgba(0,0,0,0.04); }
        .ct-row-wrap:last-child { border-bottom: none; }
        :global(.ct-row) {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 18px; text-decoration: none;
          transition: background 0.15s;
        }
        :global(.ct-row:hover) { background: #F8FAFF; }
        .ct-td {
          flex: 1; display: flex; align-items: center; gap: 9px;
          font-size: 13px; color: #0F1B2D; min-width: 0;
        }
        .ct-avatar {
          width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
          background: linear-gradient(135deg, #3B82F6, #1B2B4B);
          color: white; font-size: 10px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .ct-name { font-size: 13.5px; font-weight: 700; color: #0F1B2D; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ct-type { font-size: 11.5px; color: #A0A9BB; font-weight: 500; white-space: nowrap; }
        .ct-health { font-size: 10.5px; font-weight: 600; padding: 3px 9px; border-radius: 7px; display: flex; align-items: center; white-space: nowrap; }
        .ct-resp-av { width: 22px; height: 22px; border-radius: 50%; background: linear-gradient(135deg, #3B6FD4, #1B2B4B); color: white; font-size: 8px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ct-resp-name { font-size: 12.5px; color: #5C6B80; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px; }
        .ct-count { font-size: 13px; font-weight: 600; color: #5C6B80; }
      `}</style>
    </div>
  )
}
