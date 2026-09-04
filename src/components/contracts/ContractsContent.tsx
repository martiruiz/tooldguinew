'use client'

import { useState } from 'react'
import { FileSignature, Plus, Search, Calendar, Download, Eye, Sparkles } from 'lucide-react'
import { NewContractModal } from './NewContractModal'
import { GenerateContractModal } from './GenerateContractModal'

interface Client {
  id: string
  name: string
}

interface Contract {
  id: string
  title: string
  client_id?: string
  client?: { id: string; name: string }
  type: string
  status: string
  start_date?: string
  end_date?: string
  value?: number
  notes?: string
  pdf_url?: string
  created_at?: string
}

interface Props {
  clients: Client[]
  contracts?: Contract[]
}

type ContractStatus = 'active' | 'pending' | 'expired' | 'draft'

const statusColors: Record<string, { bg: string; color: string }> = {
  active:  { bg: '#F0FDF4', color: '#16A34A' },
  pending: { bg: '#FFFBEB', color: '#D97706' },
  expired: { bg: '#FEF2F2', color: '#DC2626' },
  draft:   { bg: '#F5F5F5', color: '#9A9A9A' },
}

const statusLabels: Record<string, string> = {
  active: 'Actiu', pending: 'Pendent firma', expired: 'Expirat', draft: 'Esborrany',
}

const typeLabels: Record<string, string> = {
  service: 'Servei mensual', project: 'Projecte', retainer: 'Retainer', annual: 'Anual',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(n)

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const statusFilters = ['Tots', 'Actiu', 'Pendent firma', 'Expirat', 'Esborrany']
const statusFilterMap: Record<string, string> = {
  'Actiu': 'active', 'Pendent firma': 'pending', 'Expirat': 'expired', 'Esborrany': 'draft',
}

export function ContractsContent({ clients, contracts: initial = [] }: Props) {
  const [contracts, setContracts] = useState<Contract[]>(initial)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tots')
  const [showNew, setShowNew] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)

  const filtered = contracts.filter(c => {
    const q = search.toLowerCase()
    const clientName = (c.client as any)?.name ?? ''
    const matchSearch = c.title.toLowerCase().includes(q) || clientName.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'Tots' || c.status === statusFilterMap[statusFilter]
    return matchSearch && matchStatus
  })

  const totalActive = contracts.filter(c => c.status === 'active').reduce((s, c) => s + (c.value ?? 0), 0)
  const totalPending = contracts.filter(c => c.status === 'pending').length

  return (
    <div className="contracts-page">
      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total contractes</div>
          <div className="stat-value">{contracts.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Actius</div>
          <div className="stat-value" style={{ color: '#16A34A' }}>{contracts.filter(c => c.status === 'active').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Valor actiu</div>
          <div className="stat-value" style={{ color: '#1B2B4B', fontSize: 20 }}>{fmt(totalActive)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendents de firma</div>
          <div className="stat-value" style={{ color: '#D97706' }}>{totalPending}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={14} color="#9A9A9A" />
          <input
            type="text"
            placeholder="Buscar contracte o client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filters">
          {statusFilters.map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className={`filter-btn${statusFilter === f ? ' active' : ''}`}>
              {f}
            </button>
          ))}
        </div>
        <button className="btn-generate" onClick={() => setShowGenerate(true)}>
          <Sparkles size={14} strokeWidth={2} />
          Generar amb IA
        </button>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <Plus size={14} strokeWidth={2.5} />
          Nou contracte
        </button>
      </div>

      <div className="count">{filtered.length} contractes</div>

      {/* Table */}
      <div className="table-wrap">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <FileSignature size={36} color="#D0D0D0" strokeWidth={1.5} />
            <p>{contracts.length === 0 ? 'Encara no hi ha contractes. Crea\'n un!' : 'Cap contracte coincideix amb la cerca.'}</p>
            {contracts.length === 0 && (
              <button className="btn-primary" onClick={() => setShowNew(true)}>
                <Plus size={14} strokeWidth={2.5} />
                Nou contracte
              </button>
            )}
          </div>
        ) : (
          <table className="contracts-table">
            <thead>
              <tr>
                <th>Contracte</th>
                <th>Client</th>
                <th>Tipus</th>
                <th>Estat</th>
                <th>Inici</th>
                <th>Fi</th>
                <th>Valor</th>
                <th>PDF</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(contract => {
                const badge = statusColors[contract.status] || statusColors.draft
                const clientName = (contract.client as any)?.name ?? '—'
                return (
                  <tr key={contract.id}>
                    <td>
                      <div className="contract-title">
                        <FileSignature size={14} color="#9A9A9A" strokeWidth={1.8} />
                        {contract.title}
                      </div>
                    </td>
                    <td className="text-sm">{clientName}</td>
                    <td><span className="type-badge">{typeLabels[contract.type] ?? contract.type}</span></td>
                    <td>
                      <span className="status-badge" style={{ background: badge.bg, color: badge.color }}>
                        {statusLabels[contract.status] ?? contract.status}
                      </span>
                    </td>
                    <td className="date-cell"><Calendar size={11} />{fmtDate(contract.start_date)}</td>
                    <td className="date-cell"><Calendar size={11} />{fmtDate(contract.end_date)}</td>
                    <td className="value-cell">{contract.value != null ? fmt(contract.value) : '—'}</td>
                    <td>
                      {contract.pdf_url ? (
                        <a href={contract.pdf_url} target="_blank" rel="noreferrer" className="pdf-btn" title="Obrir PDF">
                          <Eye size={13} />
                          PDF
                        </a>
                      ) : (
                        <span className="no-pdf">—</span>
                      )}
                    </td>
                    <td>
                      {contract.pdf_url && (
                        <a href={contract.pdf_url} download className="action-btn" title="Descarregar">
                          <Download size={13} />
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showGenerate && (
        <GenerateContractModal
          clients={clients}
          onClose={() => setShowGenerate(false)}
          onCreated={(c) => { setContracts(prev => [c, ...prev]); setShowGenerate(false) }}
        />
      )}

      {showNew && (
        <NewContractModal
          clients={clients}
          onClose={() => setShowNew(false)}
          onCreated={(c) => {
            setContracts(prev => [c, ...prev])
            setShowNew(false)
          }}
        />
      )}

      <style jsx>{`
        .contracts-page { flex: 1; padding: 24px 28px 40px; display: flex; flex-direction: column; gap: 20px; }
        @media (max-width: 768px) { .contracts-page { padding: 16px 12px 80px; } }

        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        @media (max-width: 600px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
        .stat-card { background: white; border: 1px solid #ECECEC; border-radius: 12px; padding: 18px 20px; }
        .stat-label { font-size: 12px; color: #9A9A9A; font-weight: 500; margin-bottom: 6px; }
        .stat-value { font-size: 26px; font-weight: 700; color: #0a0a0a; }

        .toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .search-wrap {
          display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px;
          border: 1px solid #E8E8E8; border-radius: 8px; background: white;
          flex: 1; min-width: 180px; max-width: 300px;
        }
        .search-input { flex: 1; border: none; outline: none; font-size: 13.5px; color: #0a0a0a; background: transparent; }
        .search-input::placeholder { color: #C0C0C0; }
        .filters { display: flex; gap: 4px; flex-wrap: wrap; }
        .filter-btn {
          height: 34px; padding: 0 12px; border: 1px solid #E8E8E8; border-radius: 7px;
          font-size: 13px; color: #5C5C5C; background: white; cursor: pointer; transition: all 0.15s;
        }
        .filter-btn:hover { border-color: #D0D0D0; color: #0a0a0a; }
        .filter-btn.active { background: #1B2B4B0F; border-color: #1B2B4B30; color: #1B2B4B; font-weight: 600; }
        .btn-generate {
          display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px;
          background: #EFF6FF; color: #4A82C6; border: 1.5px solid #BFDBFE; border-radius: 8px;
          font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap;
          font-family: inherit;
        }
        .btn-generate:hover { background: #DBEAFE; border-color: #93C5FD; }
        .btn-primary {
          display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px;
          background: #1B2B4B; color: white; border: none; border-radius: 8px;
          font-size: 13.5px; font-weight: 500; cursor: pointer; transition: background 0.15s; white-space: nowrap;
          font-family: inherit;
        }
        .btn-primary:hover { background: #4A82C6; }

        .count { font-size: 12.5px; color: #9A9A9A; }

        .table-wrap { overflow-x: auto; border: 1px solid #ECECEC; border-radius: 12px; background: white; }
        .contracts-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .contracts-table thead th {
          padding: 11px 16px; text-align: left; font-size: 11px; font-weight: 600;
          color: #9A9A9A; letter-spacing: 0.04em; text-transform: uppercase;
          border-bottom: 1px solid #F0F0F0; white-space: nowrap; background: #FAFAFA;
        }
        .contracts-table tbody tr { border-bottom: 1px solid #F8F8F8; transition: background 0.1s; }
        .contracts-table tbody tr:last-child { border-bottom: none; }
        .contracts-table tbody tr:hover { background: #FAFAFA; }
        .contracts-table td { padding: 12px 16px; color: #0a0a0a; vertical-align: middle; white-space: nowrap; }

        .contract-title { display: flex; align-items: center; gap: 8px; font-weight: 600; }
        .type-badge { font-size: 11px; color: #5C5C5C; background: #F0F0F0; padding: 2px 8px; border-radius: 5px; }
        .status-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 5px; white-space: nowrap; }
        .text-sm { font-size: 13px; color: #5C5C5C; }
        .date-cell { display: flex; align-items: center; gap: 5px; color: #5C5C5C; font-size: 13px; }
        .value-cell { font-weight: 700; color: #1B2B4B; font-size: 13.5px; }
        :global(.pdf-btn) {
          display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px;
          background: #EFF6FF; color: #1B2B4B; border-radius: 6px; font-size: 12px;
          font-weight: 600; text-decoration: none; transition: background 0.15s;
        }
        :global(.pdf-btn:hover) { background: #DBEAFE; }
        .no-pdf { color: #C0C0C0; font-size: 13px; }
        .action-btn {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border: 1px solid #E8E8E8; border-radius: 7px;
          background: white; cursor: pointer; color: #9A9A9A; transition: all 0.15s;
          text-decoration: none;
        }
        .action-btn:hover { border-color: #1B2B4B; color: #1B2B4B; }

        .empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; padding: 80px 24px; color: #9A9A9A; font-size: 14px;
        }
      `}</style>
    </div>
  )
}
