'use client'

import { useState, useEffect } from 'react'
import {
  Search, Settings, Copy, Mail, Phone, Link2,
  Building2, ChevronDown, ChevronUp, Loader2, MapPin,
  CheckCircle, ExternalLink, Plus, Download, Star, Globe,
  LayoutGrid, List, FileText,
} from 'lucide-react'
import { PlantillesContent } from '@/components/plantilles/PlantillesContent'

interface Lead {
  first_name: string
  last_name: string
  email: string
  position: string
  linkedin_url: string
  phone: string
  company: string
  company_domain: string
  source: string
  confidence?: number | null
  // Google Maps fields
  address?: string
  website?: string
  maps_url?: string
  rating?: number
  ratings_count?: number
  types?: string[]
  photo_url?: string
  city?: string
  country?: string
}

const GUINEW_PITCH = `Hola [nom],

T'escric des de Guinew, una agència especialitzada en producció de contingut, gestió de xarxes socials i estratègia digital per a marques i esportistes.

Crec que podríem ajudar-vos a [empresa] a potenciar la vostra presència digital amb contingut de qualitat.

Podríem tenir una trucada de 15 minuts per explicar-vos com?

Salutacions,
Equip Guinew`

export function ProspeccioContent() {
  const [activeTab, setActiveTab] = useState<'cerca' | 'plantilles'>('cerca')
  const [showSettings, setShowSettings] = useState(false)
  const [apolloKey, setApolloKey] = useState('')
  const [mapsApiKey, setMapsApiKey] = useState('')
  const [provider, setProvider] = useState<'googlemaps' | 'apollo'>('googlemaps')

  // Apollo params
  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  // Google Maps params
  const [mapsQuery, setMapsQuery] = useState('')
  const [mapsLocation, setMapsLocation] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Lead[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sentTo, setSentTo] = useState<Map<string, Set<string>>>(new Map())
  const [sendingTo, setSendingTo] = useState<Map<string, string>>(new Map())
  const [copied, setCopied] = useState<string | null>(null)
  const [expandedLead, setExpandedLead] = useState<string | null>(null)

  useEffect(() => {
    const ak = localStorage.getItem('guinew_apollo_key') || ''
    if (ak) setApolloKey(ak)
    const mk = localStorage.getItem('guinew_maps_key') || ''
    if (mk) setMapsApiKey(mk)
  }, [])

  const saveKeys = () => {
    localStorage.setItem('guinew_apollo_key', apolloKey)
    localStorage.setItem('guinew_maps_key', mapsApiKey)
    setShowSettings(false)
  }

  const search = async () => {
    setLoading(true); setError(null); setResults([])
    try {
      const res = await fetch('/api/prospeccio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apolloKey, mapsApiKey, company, title, location, mapsQuery, mapsLocation }),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      setResults(json.results || [])
      if (!json.results?.length) setError('No s\'han trobat contactes amb aquests criteris.')
    } catch {
      setError('Error de connexió')
    } finally {
      setLoading(false) }
  }

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const exportCSV = () => {
    const header = 'Nom,Cognom,Email,Càrrec,Empresa,Domini,Telèfon,LinkedIn,Font'
    const rows = results.map(l =>
      [l.first_name, l.last_name, l.email, l.position, l.company, l.company_domain, l.phone, l.linkedin_url, l.source]
        .map(v => `"${(v || '').replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'leads-guinew.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const sendToCRM = async (lead: Lead, crm: 'guinew' | 'scp') => {
    const key = leadKey(lead)
    const sendKey = key + crm
    setSendingTo(prev => { const n = new Map(prev); n.set(sendKey, crm); return n })
    const clientName = lead.source === 'googlemaps'
      ? lead.company
      : [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.company || 'Lead'
    const descParts = [
      lead.email && `Email: ${lead.email}`,
      lead.phone && `Telèfon: ${lead.phone}`,
      lead.position && `Càrrec: ${lead.position}`,
      lead.address && `Adreça: ${lead.address}`,
      lead.website && `Web: ${lead.website}`,
      lead.linkedin_url && `LinkedIn: ${lead.linkedin_url}`,
      lead.city && lead.country && `Ubicació: ${lead.city}, ${lead.country}`,
    ].filter(Boolean).join('\n')
    try {
      const res = await fetch('/api/crm/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName,
          stage: 'prospect',
          crm_source: crm,
          lead_source: lead.source === 'googlemaps' ? 'google_maps' : 'apollo',
          description: descParts || null,
        }),
      })
      if (!res.ok) throw new Error()
      setSentTo(prev => {
        const n = new Map(prev)
        const existing = new Set(n.get(key) || [])
        existing.add(crm)
        n.set(key, existing)
        return n
      })
    } catch { /* silent */ }
    finally {
      setSendingTo(prev => { const n = new Map(prev); n.delete(sendKey); return n })
    }
  }

  const leadKey = (l: Lead) => `${l.email || l.linkedin_url || l.first_name + l.last_name}`

  const initials = (l: Lead) => {
    const f = l.first_name?.[0] || ''
    const s = l.last_name?.[0] || ''
    return (f + s).toUpperCase() || '?'
  }

  return (
    <div className="prosp-page">
      <style>{`
        .prosp-page { flex: 1; padding: 24px 28px 40px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; overflow-x: hidden; }

        /* Header */
        .prosp-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .prosp-title { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 4px; }
        .prosp-title-sub { font-size: 13px; color: #6B7280; margin: 0; }

        /* Page tabs */
        .prosp-tabs { display: flex; gap: 2px; border-bottom: 2px solid #F3F4F6; }
        .prosp-tab {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 16px; border: none; background: none;
          font-size: 13.5px; font-weight: 500; color: #6B7280;
          cursor: pointer; font-family: inherit;
          border-bottom: 2px solid transparent; margin-bottom: -2px;
          transition: color 0.12s;
        }
        .prosp-tab:hover { color: #374151; }
        .prosp-tab.active { color: #1B2B4B; font-weight: 700; border-bottom-color: #1B2B4B; }
        .btn-settings {
          display: flex; align-items: center; gap: 6px; padding: 7px 14px;
          border: 1px solid #E8E8E8; border-radius: 8px; background: white;
          font-size: 12.5px; font-weight: 500; color: #374151; cursor: pointer; font-family: inherit;
          transition: background 0.12s;
        }
        .btn-settings:hover { background: #F9FAFB; }

        /* Settings panel */
        .settings-panel {
          background: white; border: 1px solid #E8E8E8; border-radius: 14px;
          padding: 20px; display: flex; flex-direction: column; gap: 14px;
        }
        .settings-title { font-size: 13px; font-weight: 700; color: #1B2B4B; }
        .settings-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .settings-field { display: flex; flex-direction: column; gap: 5px; }
        .settings-field label { font-size: 11px; font-weight: 600; color: #5C5C5C; text-transform: uppercase; letter-spacing: 0.04em; }
        .settings-field input {
          height: 36px; padding: 0 10px; border: 1px solid #E8E8E8; border-radius: 8px;
          font-size: 13px; font-family: monospace; outline: none; color: #0a0a0a;
        }
        .settings-field input:focus { border-color: #1B2B4B60; }
        .settings-hint { font-size: 11.5px; color: #9A9A9A; line-height: 1.5; }
        .settings-hint a { color: #1B2B4B; text-decoration: underline; }
        .btn-save-keys {
          align-self: flex-start; padding: 7px 16px;
          background: #1B2B4B; color: white; border: none; border-radius: 8px;
          font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit;
        }

        /* Provider tabs */
        .provider-tabs { display: flex; gap: 6px; background: #F3F4F6; border-radius: 10px; padding: 4px; width: fit-content; }
        .provider-tab {
          padding: 6px 16px; border-radius: 7px; border: none; background: none;
          font-size: 13px; font-weight: 500; color: #6B7280; cursor: pointer; font-family: inherit;
          transition: all 0.12s;
        }
        .provider-tab.active { background: white; color: #1B2B4B; font-weight: 600; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }

        /* Search form */
        .search-card {
          background: white; border: 1px solid #E8E8E8; border-radius: 14px; padding: 20px;
          display: flex; flex-direction: column; gap: 14px;
        }
        .search-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; }
        .search-field { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 160px; }
        .search-field label { font-size: 11px; font-weight: 600; color: #5C5C5C; text-transform: uppercase; letter-spacing: 0.04em; }
        .search-field input {
          height: 38px; padding: 0 12px; border: 1px solid #E8E8E8; border-radius: 8px;
          font-size: 13.5px; outline: none; font-family: inherit; color: #0a0a0a;
          transition: border-color 0.15s;
        }
        .search-field input:focus { border-color: #1B2B4B60; }
        .btn-search {
          height: 38px; padding: 0 20px; background: #1B2B4B; color: white;
          border: none; border-radius: 8px; font-size: 13.5px; font-weight: 600;
          cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 7px;
          transition: background 0.12s; white-space: nowrap; flex-shrink: 0;
        }
        .btn-search:hover { background: #254067; }
        .btn-search:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Tips */
        .search-tips { display: flex; gap: 8px; flex-wrap: wrap; }
        .tip-chip {
          padding: 3px 10px; background: #F0F4FF; border: 1px solid #C7D7FF;
          border-radius: 20px; font-size: 11.5px; color: #3B5FC0; cursor: pointer;
          transition: background 0.1s;
        }
        .tip-chip:hover { background: #E0EAFF; }

        /* Error */
        .prosp-error { padding: 10px 14px; background: #FEF2F2; color: #DC2626; border-radius: 8px; font-size: 13px; }

        /* Results header */
        .results-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .results-count { font-size: 13px; font-weight: 600; color: #374151; }
        .btn-export {
          display: flex; align-items: center; gap: 6px; padding: 6px 12px;
          border: 1px solid #E8E8E8; border-radius: 8px; background: white;
          font-size: 12px; font-weight: 500; color: #374151; cursor: pointer; font-family: inherit;
        }
        .btn-export:hover { background: #F9FAFB; }

        /* View toggle */
        .view-toggle { display: flex; border: 1px solid #E8E8E8; border-radius: 7px; overflow: hidden; background: white; }
        .view-btn { border: none; background: none; padding: 5px 8px; cursor: pointer; color: #9CA3AF; display: flex; align-items: center; transition: all 0.1s; }
        .view-btn:hover { color: #374151; background: #F9FAFB; }
        .view-btn.active { background: #1B2B4B; color: white; }

        /* Lead cards grid */
        .leads-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }

        /* Lead table (list view) */
        .leads-table-wrap { width: 100%; overflow-x: auto; border: 1px solid #EBEBEB; border-radius: 12px; background: white; }
        .leads-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .leads-table thead th {
          padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700;
          color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em;
          background: #F9FAFB; border-bottom: 1px solid #EBEBEB; white-space: nowrap;
        }
        .leads-table tbody tr { border-bottom: 1px solid #F3F4F6; transition: background 0.1s; }
        .leads-table tbody tr:last-child { border-bottom: none; }
        .leads-table tbody tr:hover { background: #FAFAFA; }
        .leads-table td { padding: 10px 14px; vertical-align: middle; color: #111827; }
        .lt-name { font-weight: 600; color: #111827; white-space: nowrap; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
        .lt-sub { font-size: 11.5px; color: #6B7280; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
        .lt-contact { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
        .lt-contact a { color: #1B2B4B; text-decoration: none; }
        .lt-contact a:hover { text-decoration: underline; }
        .lt-rating { display: flex; align-items: center; gap: 4px; white-space: nowrap; }
        .lt-actions { display: flex; gap: 5px; white-space: nowrap; }

        .lead-card {
          background: white; border: 1px solid #EBEBEB; border-radius: 14px;
          padding: 16px; display: flex; flex-direction: column; gap: 10px;
          transition: box-shadow 0.15s;
        }
        .lead-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }

        .lead-top { display: flex; align-items: flex-start; gap: 12px; }
        .lead-avatar {
          width: 42px; height: 42px; border-radius: 10px; background: #EEF3FA;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #1B2B4B; flex-shrink: 0; overflow: hidden;
        }
        .lead-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .lead-info { flex: 1; min-width: 0; }
        .lead-name { font-size: 14px; font-weight: 700; color: #0a0a0a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lead-pos { font-size: 12px; color: #6B7280; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lead-company { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #374151; margin-top: 3px; }

        .lead-contacts { display: flex; flex-direction: column; gap: 6px; }
        .lead-contact-row { display: flex; align-items: center; gap: 8px; }
        .lead-contact-val {
          font-size: 12.5px; color: #374151; flex: 1; min-width: 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .lead-contact-val.empty { color: #C4C4C4; font-style: italic; }
        .btn-copy {
          border: none; background: none; cursor: pointer; padding: 3px 5px; border-radius: 5px;
          color: #9CA3AF; transition: color 0.1s, background 0.1s; flex-shrink: 0;
          display: flex; align-items: center;
        }
        .btn-copy:hover { color: #1B2B4B; background: #F3F4F6; }
        .btn-copy.copied { color: #16A34A; }

        .confidence-badge {
          font-size: 10.5px; font-weight: 600; padding: 2px 7px;
          border-radius: 20px; background: #F0FDF4; color: #16A34A;
          flex-shrink: 0;
        }
        .confidence-badge.low { background: #FEF3C7; color: #D97706; }

        /* CRM destination bar */
        .crm-dest-bar {
          display: flex; align-items: center; gap: 10px; padding: 10px 14px;
          background: #F8F9FA; border: 1px solid #EBEBEB; border-radius: 10px;
          flex-wrap: wrap;
        }
        .crm-dest-label { font-size: 11px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; flex-shrink: 0; }
        .crm-dest-chip {
          display: flex; align-items: center; gap: 6px; padding: 4px 12px;
          border-radius: 20px; font-size: 12px; font-weight: 600; border: none; cursor: default;
        }
        .crm-dest-chip.guinew { background: #EEF3FA; color: #1B2B4B; }
        .crm-dest-chip.scp { background: linear-gradient(135deg, #EEF3FA 0%, #FDF8EC 100%); color: #0f3460; }
        .crm-dest-sep { color: #D1D5DB; font-size: 11px; }

        .lead-actions { display: flex; flex-direction: column; gap: 6px; padding-top: 4px; border-top: 1px solid #F5F5F5; }
        .lead-actions-row { display: flex; gap: 6px; }
        .btn-lead-action {
          flex: 1; padding: 6px 0; border: 1px solid #E8E8E8; border-radius: 8px;
          background: white; font-size: 11.5px; font-weight: 500; color: #374151;
          cursor: pointer; font-family: inherit; display: flex; align-items: center;
          justify-content: center; gap: 5px; transition: all 0.1s;
        }
        .btn-lead-action:hover { background: #F9FAFB; }
        .btn-lead-action.primary { background: #1B2B4B; color: white; border-color: #1B2B4B; }
        .btn-lead-action.primary:hover { background: #254067; }

        /* Send to CRM buttons */
        .crm-send-row { display: flex; gap: 6px; }
        .btn-crm-send {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
          height: 30px; padding: 0 8px; border: none; border-radius: 7px;
          font-size: 11.5px; font-weight: 700; cursor: pointer; font-family: inherit;
          transition: all 0.12s; white-space: nowrap;
        }
        .btn-crm-send.guinew { background: #1B2B4B; color: white; }
        .btn-crm-send.guinew:hover:not(:disabled) { background: #254067; }
        .btn-crm-send.guinew.sent { background: #F0FDF4; color: #16A34A; border: 1.5px solid #86EFAC; cursor: default; }
        .btn-crm-send.scp { background: linear-gradient(135deg, #0f3460 0%, #1a5fa8 60%, #b8902a 100%); color: white; }
        .btn-crm-send.scp:hover:not(:disabled) { opacity: 0.88; }
        .btn-crm-send.scp.sent { background: #F0FDF4; color: #16A34A; border: 1.5px solid #86EFAC; cursor: default; }
        .btn-crm-send:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Pitch modal */
        .pitch-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100;
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .pitch-modal {
          background: white; border-radius: 16px; width: 100%; max-width: 560px;
          padding: 24px; display: flex; flex-direction: column; gap: 16px;
        }
        .pitch-header { display: flex; align-items: center; justify-content: space-between; }
        .pitch-title { font-size: 15px; font-weight: 700; color: #0a0a0a; }
        .pitch-close { border: none; background: none; cursor: pointer; color: #9A9A9A; padding: 4px; }
        .pitch-textarea {
          border: 1px solid #E8E8E8; border-radius: 10px; padding: 14px;
          font-size: 13px; font-family: inherit; line-height: 1.6; resize: vertical;
          outline: none; color: #0a0a0a; min-height: 220px;
        }
        .pitch-textarea:focus { border-color: #1B2B4B60; }
        .pitch-footer { display: flex; gap: 8px; justify-content: flex-end; }
        .btn-pitch-copy {
          padding: 8px 18px; background: #1B2B4B; color: white; border: none;
          border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
          display: flex; align-items: center; gap: 6px;
        }

        /* Source badge */
        .source-badge {
          font-size: 9.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .source-badge.hunter { background: #FEF3C7; color: #92400E; }
        .source-badge.apollo { background: #EDE9FE; color: #5B21B6; }

        /* Empty */
        .prosp-empty {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: 48px 20px; color: #9CA3AF; text-align: center;
        }
        .prosp-empty-icon { color: #D1D5DB; }
        .prosp-empty p { font-size: 14px; }
        .prosp-empty small { font-size: 12px; }
      `}</style>

      {/* Header */}
      <div className="prosp-header">
        <div>
          <h1 className="prosp-title">Prospecció de leads</h1>
          <p className="prosp-title-sub">Troba contactes i empreses potencials per als serveis de Guinew</p>
        </div>
        {activeTab === 'cerca' && (
          <button className="btn-settings" onClick={() => setShowSettings(s => !s)}>
            <Settings size={14} />
            Claus API
            {showSettings ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {/* Page tabs */}
      <div className="prosp-tabs">
        <button className={`prosp-tab${activeTab === 'cerca' ? ' active' : ''}`} onClick={() => setActiveTab('cerca')}>
          <Search size={14} /> Cerca de leads
        </button>
        <button className={`prosp-tab${activeTab === 'plantilles' ? ' active' : ''}`} onClick={() => setActiveTab('plantilles')}>
          <FileText size={14} /> Plantilles de venda
        </button>
      </div>

      {activeTab === 'plantilles' && <PlantillesContent />}
      {activeTab === 'cerca' && (<>

      {/* Settings panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-title">Configuració d'APIs</div>
          <div className="settings-row">
            <div className="settings-field">
              <label>Google Maps API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={mapsApiKey}
                onChange={e => setMapsApiKey(e.target.value)}
              />
            </div>
            <div className="settings-field">
              <label>Apollo.io API Key</label>
              <input
                type="password"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={apolloKey}
                onChange={e => setApolloKey(e.target.value)}
              />
            </div>
          </div>
          <div className="settings-hint">
            Google Maps: activa <strong>Places API</strong> a <a href="https://console.cloud.google.com" target="_blank" rel="noopener">Google Cloud Console</a>. Apollo: <a href="https://developer.apollo.io" target="_blank" rel="noopener">developer.apollo.io</a>. Les claus es guarden al navegador localment.
          </div>
          <button className="btn-save-keys" onClick={saveKeys}>Guardar claus</button>
        </div>
      )}

      {/* Provider selector */}
      <div>
        <div className="provider-tabs">
          <button
            className={`provider-tab${provider === 'googlemaps' ? ' active' : ''}`}
            onClick={() => setProvider('googlemaps')}
          >
            <MapPin size={13} /> Google Maps
          </button>
          <button
            className={`provider-tab${provider === 'apollo' ? ' active' : ''}`}
            onClick={() => setProvider('apollo')}
          >
            Apollo.io — persones
          </button>
        </div>
      </div>

      {/* Search form */}
      <div className="search-card">
        {provider === 'googlemaps' ? (
          <>
            <div className="search-row">
              <div className="search-field" style={{ flex: 2 }}>
                <label>Tipus de negoci</label>
                <input
                  placeholder="ex: agència de màrqueting, club esportiu, marca de moda..."
                  value={mapsQuery}
                  onChange={e => setMapsQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                />
              </div>
              <div className="search-field">
                <label>Ubicació</label>
                <input
                  placeholder="ex: Barcelona, Madrid, Catalunya"
                  value={mapsLocation}
                  onChange={e => setMapsLocation(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                />
              </div>
              <button className="btn-search" onClick={search} disabled={loading}>
                {loading ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
                Cercar
              </button>
            </div>
            <div className="search-tips">
              {[
                ['marca esportiva', 'Barcelona'],
                ['club de futbol', 'Catalunya'],
                ['agència publicitat', 'Madrid'],
                ['marca de roba', 'Spain'],
                ['federació esportiva', 'España'],
                ['influencer agency', 'Barcelona'],
              ].map(([q, l]) => (
                <button key={q} className="tip-chip" onClick={() => { setMapsQuery(q); setMapsLocation(l) }}>
                  {q} · {l}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="search-row">
              <div className="search-field">
                <label>Empresa</label>
                <input
                  placeholder="ex: Nike, Red Bull, Adidas"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                />
              </div>
              <div className="search-field">
                <label>Càrrec / Rol</label>
                <input
                  placeholder="ex: Marketing Director, CMO, Brand Manager"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                />
              </div>
              <div className="search-field">
                <label>Localització</label>
                <input
                  placeholder="ex: Spain, Barcelona"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                />
              </div>
              <button className="btn-search" onClick={search} disabled={loading}>
                {loading ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
                Buscar
              </button>
            </div>
            <div className="search-tips">
              {[
                ['Marketing Director', 'Spain'],
                ['CMO', 'Barcelona'],
                ['Brand Manager', ''],
                ['Head of Social Media', ''],
              ].map(([t, l]) => (
                <button key={t} className="tip-chip" onClick={() => { setTitle(t); if (l) setLocation(l) }}>
                  {t}{l ? ` · ${l}` : ''}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && <div className="prosp-error">{error}</div>}

      {/* Results */}
      {results.length > 0 && (
        <>
          <div className="results-header">
            <div className="results-count">{results.length} {provider === 'googlemaps' ? 'empreses' : 'contactes'} trobats</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div className="view-toggle">
                <button className={`view-btn${viewMode === 'grid' ? ' active' : ''}`} onClick={() => setViewMode('grid')} title="Vista graella"><LayoutGrid size={14} /></button>
                <button className={`view-btn${viewMode === 'list' ? ' active' : ''}`} onClick={() => setViewMode('list')} title="Vista llista"><List size={14} /></button>
              </div>
              <button className="btn-export" onClick={exportCSV}>
                <Download size={13} /> Exportar CSV
              </button>
            </div>
          </div>
          <div className="crm-dest-bar">
            <span className="crm-dest-label">Enviar a</span>
            <span className="crm-dest-chip guinew">CRM Guinew</span>
            <span className="crm-dest-sep">·</span>
            <span className="crm-dest-chip scp">CRM SCP</span>
          </div>
          {viewMode === 'list' ? (
            <div className="leads-table-wrap">
              <table className="leads-table">
                <thead>
                  <tr>
                    <th>Nom / Empresa</th>
                    {provider === 'googlemaps' ? <th>Adreça</th> : <th>Càrrec</th>}
                    <th>Telèfon</th>
                    {provider === 'googlemaps' ? <th>Web</th> : <th>Email</th>}
                    {provider === 'googlemaps' && <th>Valoració</th>}
                    <th>Enviar a CRM</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((lead, i) => {
                    const key = leadKey(lead)
                    return (
                      <tr key={i}>
                        <td>
                          <div className="lt-name">{lead.source === 'googlemaps' ? lead.company : `${lead.first_name} ${lead.last_name}`.trim()}</div>
                          {lead.source !== 'googlemaps' && lead.company && <div className="lt-sub">{lead.company}</div>}
                        </td>
                        <td>
                          {provider === 'googlemaps'
                            ? <div className="lt-sub" style={{ maxWidth: 220 }}>{lead.address}</div>
                            : <div className="lt-sub">{lead.position}</div>
                          }
                        </td>
                        <td>
                          {lead.phone
                            ? <div className="lt-contact"><Phone size={12} style={{ color: '#9CA3AF' }} />{lead.phone}</div>
                            : <span style={{ color: '#D1D5DB' }}>—</span>
                          }
                        </td>
                        <td>
                          {provider === 'googlemaps'
                            ? lead.website
                              ? <div className="lt-contact"><a href={lead.website} target="_blank" rel="noopener">{lead.company_domain || lead.website}</a><ExternalLink size={11} style={{ color: '#9CA3AF' }} /></div>
                              : <span style={{ color: '#D1D5DB' }}>—</span>
                            : lead.email
                              ? <div className="lt-contact"><Mail size={12} style={{ color: '#9CA3AF' }} />{lead.email}</div>
                              : <span style={{ color: '#D1D5DB' }}>—</span>
                          }
                        </td>
                        {provider === 'googlemaps' && (
                          <td>
                            {lead.rating
                              ? <div className="lt-rating"><Star size={12} fill="#F59E0B" color="#F59E0B" />{lead.rating}<span style={{ color: '#9CA3AF', fontSize: 11 }}>({lead.ratings_count})</span></div>
                              : <span style={{ color: '#D1D5DB' }}>—</span>
                            }
                          </td>
                        )}
                        <td>
                          <div className="lt-actions">
                            {(['guinew', 'scp'] as const).map(crm => {
                              const isSent = sentTo.get(key)?.has(crm)
                              const isSending = sendingTo.has(key + crm)
                              return (
                                <button
                                  key={crm}
                                  className={`btn-crm-send ${crm}${isSent ? ' sent' : ''}`}
                                  onClick={() => sendToCRM(lead, crm)}
                                  disabled={isSent || isSending}
                                >
                                  {isSent ? <CheckCircle size={11} /> : isSending ? <Loader2 size={11} className="spin" /> : <Plus size={11} />}
                                  {crm === 'guinew' ? 'Guinew' : 'SCP'}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
          <div className="leads-grid">
            {results.map((lead, i) => {
              const key = leadKey(lead)
              const isExpanded = expandedLead === key
              const pitch = GUINEW_PITCH
                .replace('[nom]', lead.first_name || lead.first_name + ' ' + lead.last_name)
                .replace('[empresa]', lead.company)

              // Google Maps card (company, not person)
              if (lead.source === 'googlemaps') {
                return (
                  <div key={i} className="lead-card">
                    <div className="lead-top">
                      <div className="lead-avatar" style={{ background: '#E8F4FD', color: '#1B4F72' }}>
                        <MapPin size={18} />
                      </div>
                      <div className="lead-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className="lead-name">{lead.company}</div>
                          <span className="source-badge googlemaps" style={{ background: '#E8F5E9', color: '#1B5E20' }}>Maps</span>
                        </div>
                        {lead.rating && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                            <Star size={11} fill="#F59E0B" color="#F59E0B" />
                            <span style={{ fontSize: 12, color: '#374151' }}>{lead.rating}</span>
                            {lead.ratings_count && <span style={{ fontSize: 11, color: '#9CA3AF' }}>({lead.ratings_count})</span>}
                          </div>
                        )}
                        {lead.address && (
                          <div className="lead-company" style={{ marginTop: 3 }}>
                            <MapPin size={11} />
                            <span style={{ fontSize: 11, color: '#6B7280' }}>{lead.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lead-contacts">
                      {lead.phone && (
                        <div className="lead-contact-row">
                          <Phone size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                          <span className="lead-contact-val">{lead.phone}</span>
                          <button className={`btn-copy${copied === key + 'phone' ? ' copied' : ''}`} onClick={() => copyText(lead.phone!, key + 'phone')}>
                            {copied === key + 'phone' ? <CheckCircle size={13} /> : <Copy size={13} />}
                          </button>
                        </div>
                      )}
                      {lead.website && (
                        <div className="lead-contact-row">
                          <Globe size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                          <a href={lead.website} target="_blank" rel="noopener" className="lead-contact-val" style={{ color: '#1B2B4B', textDecoration: 'none', fontSize: 12 }}>
                            {lead.company_domain || lead.website}
                          </a>
                          <ExternalLink size={11} style={{ color: '#9CA3AF' }} />
                        </div>
                      )}
                    </div>

                    <div className="lead-actions">
                      <div className="lead-actions-row">
                        {lead.maps_url && (
                          <a href={lead.maps_url} target="_blank" rel="noopener" className="btn-lead-action" style={{ textDecoration: 'none' }}>
                            <MapPin size={12} /> Maps
                          </a>
                        )}
                        {lead.website && (
                          <a href={lead.website} target="_blank" rel="noopener" className="btn-lead-action primary" style={{ textDecoration: 'none' }}>
                            <Globe size={12} /> Web
                          </a>
                        )}
                      </div>
                      <div className="crm-send-row">
                        {(['guinew', 'scp'] as const).map(crm => {
                          const isSent = sentTo.get(key)?.has(crm)
                          const isSending = sendingTo.has(key + crm)
                          return (
                            <button
                              key={crm}
                              className={`btn-crm-send ${crm}${isSent ? ' sent' : ''}`}
                              onClick={() => sendToCRM(lead, crm)}
                              disabled={isSent || isSending}
                            >
                              {isSent ? <CheckCircle size={11} /> : isSending ? <Loader2 size={11} className="spin" /> : <Plus size={11} />}
                              {crm === 'guinew' ? 'CRM Guinew' : 'CRM SCP'}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={i} className="lead-card">
                  <div className="lead-top">
                    <div className="lead-avatar">
                      {lead.photo_url
                        ? <img src={lead.photo_url} alt="" />
                        : initials(lead)
                      }
                    </div>
                    <div className="lead-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="lead-name">{lead.first_name} {lead.last_name}</div>
                        <span className={`source-badge ${lead.source}`}>{lead.source}</span>
                      </div>
                      {lead.position && <div className="lead-pos">{lead.position}</div>}
                      {lead.company && (
                        <div className="lead-company">
                          <Building2 size={11} />
                          {lead.company}
                          {lead.city && <span style={{ color: '#9CA3AF' }}>· {lead.city}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lead-contacts">
                    {/* Email */}
                    <div className="lead-contact-row">
                      <Mail size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                      <span className={`lead-contact-val${!lead.email ? ' empty' : ''}`}>
                        {lead.email || 'No disponible'}
                      </span>
                      {lead.confidence != null && (
                        <span className={`confidence-badge${lead.confidence < 70 ? ' low' : ''}`}>
                          {lead.confidence}%
                        </span>
                      )}
                      {lead.email && (
                        <button
                          className={`btn-copy${copied === key + 'email' ? ' copied' : ''}`}
                          onClick={() => copyText(lead.email, key + 'email')}
                          title="Copiar email"
                        >
                          {copied === key + 'email' ? <CheckCircle size={13} /> : <Copy size={13} />}
                        </button>
                      )}
                    </div>
                    {/* Phone */}
                    {lead.phone && (
                      <div className="lead-contact-row">
                        <Phone size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                        <span className="lead-contact-val">{lead.phone}</span>
                        <button
                          className={`btn-copy${copied === key + 'phone' ? ' copied' : ''}`}
                          onClick={() => copyText(lead.phone, key + 'phone')}
                        >
                          {copied === key + 'phone' ? <CheckCircle size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                    )}
                    {/* LinkedIn */}
                    {lead.linkedin_url && (
                      <div className="lead-contact-row">
                        <Link2 size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                        <a
                          href={lead.linkedin_url}
                          target="_blank"
                          rel="noopener"
                          className="lead-contact-val"
                          style={{ color: '#1B2B4B', textDecoration: 'none' }}
                        >
                          Veure perfil
                        </a>
                        <ExternalLink size={11} style={{ color: '#9CA3AF' }} />
                      </div>
                    )}
                  </div>

                  <div className="lead-actions">
                    <div className="lead-actions-row">
                      <button
                        className="btn-lead-action"
                        onClick={() => setExpandedLead(isExpanded ? null : key)}
                      >
                        <Mail size={12} />
                        Pitch
                      </button>
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}?subject=Guinew — Producció de contingut&body=${encodeURIComponent(pitch)}`}
                          className="btn-lead-action primary"
                          style={{ textDecoration: 'none' }}
                        >
                          <Mail size={12} />
                          Enviar mail
                        </a>
                      )}
                    </div>
                    <div className="crm-send-row">
                      {(['guinew', 'scp'] as const).map(crm => {
                        const isSent = sentTo.get(key)?.has(crm)
                        const isSending = sendingTo.has(key + crm)
                        return (
                          <button
                            key={crm}
                            className={`btn-crm-send ${crm}${isSent ? ' sent' : ''}`}
                            onClick={() => sendToCRM(lead, crm)}
                            disabled={isSent || isSending}
                          >
                            {isSent ? <CheckCircle size={11} /> : isSending ? <Loader2 size={11} className="spin" /> : <Plus size={11} />}
                            {crm === 'guinew' ? 'CRM Guinew' : 'CRM SCP'}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Pitch preview */}
                  {isExpanded && (
                    <div style={{ marginTop: 4 }}>
                      <textarea
                        className="pitch-textarea"
                        defaultValue={pitch}
                        rows={8}
                        style={{ width: '100%', boxSizing: 'border-box', fontSize: 12 }}
                      />
                      <button
                        className="btn-lead-action"
                        style={{ marginTop: 6, width: '100%' }}
                        onClick={() => copyText(pitch, key + 'pitch')}
                      >
                        {copied === key + 'pitch' ? <CheckCircle size={12} /> : <Copy size={12} />}
                        {copied === key + 'pitch' ? 'Copiat!' : 'Copiar text'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && !error && (
        <div className="prosp-empty">
          <Search size={48} className="prosp-empty-icon" strokeWidth={1} />
          <p>Introdueix els paràmetres de cerca per trobar leads</p>
          <small>Google Maps necessita una clau API amb Places API activada. Apollo.io per cerques de persones.</small>
        </div>
      )}
      </>)}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
