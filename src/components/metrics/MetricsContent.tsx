'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Trash2, ChevronRight, BarChart2, X, Loader2, ExternalLink, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Report {
  id: string
  client_id?: string
  period_start?: string
  period_end?: string
  platform?: string
  account_handle?: string
  ai_analysis?: string
  raw_data?: any
  pdf_url?: string
  created_at: string
  client?: { id: string; name: string }
}

interface Props {
  clients: { id: string; name: string }[]
  reports: Report[]
  currentUserId: string
}

export function MetricsContent({ clients, reports: initialReports, currentUserId }: Props) {
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file || file.type !== 'application/pdf') { setError('Selecciona un fitxer PDF'); return }
    if (file.size > 20 * 1024 * 1024) { setError('El PDF no pot superar 20MB'); return }
    setError('')
    setUploading(true)
    setUploadProgress('Llegint el PDF...')

    try {
      const supabase = createClient()

      // Upload PDF to Supabase Storage (optional — continues even if bucket doesn't exist)
      let pdfUrl: string | null = null
      try {
        const fileName = `${Date.now()}_${file.name}`
        const { data: storageData } = await supabase.storage
          .from('metric-reports')
          .upload(fileName, file, { upsert: false })
        if (storageData?.path) {
          pdfUrl = supabase.storage.from('metric-reports').getPublicUrl(storageData.path).data.publicUrl
        }
      } catch {}

      setUploadProgress('Analitzant amb Intel·ligència Artificial...')

      // Send to analysis API
      const form = new FormData()
      form.append('pdf', file)
      if (customPrompt.trim()) form.append('prompt', customPrompt.trim())
      const res = await fetch('/api/metrics/analyze', { method: 'POST', body: form })
      const json = await res.json()
      const apiErr = json.error
      if (apiErr) {
        const msg = typeof apiErr === 'string' && apiErr.includes('credit')
          ? '💳 Saldo insuficient a Anthropic. Afegeix crèdits a console.anthropic.com/settings/billing per continuar.'
          : apiErr
        setError(msg)
        setUploading(false)
        return
      }
      const { rawData, analysis } = json

      setUploadProgress('Desant l\'anàlisi...')

      // Save to Supabase
      const d = rawData as any
      const { data: saved } = await supabase
        .from('metric_reports')
        .insert({
          client_id: selectedClient || null,
          created_by: currentUserId,
          period_start: d?.period_start || null,
          period_end: d?.period_end || null,
          platform: d?.platform || 'instagram',
          account_handle: d?.account_handle || null,
          pdf_url: pdfUrl,
          raw_data: rawData,
          ai_analysis: analysis,
        })
        .select('*, client:clients(id, name)')
        .single()

      if (saved) {
        setReports(prev => [saved as Report, ...prev])
        setSelectedReport(saved as Report)
        setShowUpload(false)
        setSelectedClient('')
        setCustomPrompt('')
      }
    } catch (e: any) {
      setError(e.message || 'Error processant el PDF')
    }
    setUploading(false)
    setUploadProgress('')
  }

  const deleteReport = async (id: string) => {
    if (!confirm('Eliminar aquest informe?')) return
    const supabase = createClient()
    await supabase.from('metric_reports').delete().eq('id', id)
    setReports(prev => prev.filter(r => r.id !== id))
    if (selectedReport?.id === id) setSelectedReport(null)
  }

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('ca-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
  const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)

  return (
    <div className="metrics-layout">
      {/* Sidebar: list of reports */}
      <div className="reports-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">Informes</span>
          <button className="btn-upload" onClick={() => setShowUpload(true)}>
            <Upload size={13} />Pujar PDF
          </button>
        </div>

        {reports.length === 0 ? (
          <div className="reports-empty">
            <BarChart2 size={28} color="#C0C0C0" />
            <p>Puja el primer informe PDF</p>
          </div>
        ) : (
          <div className="reports-list">
            {(() => {
              // Group by month (based on period_start or created_at)
              const groups = new Map<string, { key: string; label: string; reports: Report[] }>()
              reports.forEach(r => {
                const ref = r.period_start || r.created_at
                const date = new Date(ref)
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                const label = date.toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' })
                if (!groups.has(key)) groups.set(key, { key, label, reports: [] })
                groups.get(key)!.reports.push(r)
              })
              return Array.from(groups.values()).map(group => (
                <div key={group.key}>
                  <div className="month-header">{group.label.charAt(0).toUpperCase() + group.label.slice(1)}</div>
                  {group.reports.map(r => {
                    const d = r.raw_data as any
                    return (
                      <div key={r.id}
                        className={`report-item${selectedReport?.id === r.id ? ' report-item--active' : ''}`}
                        onClick={() => setSelectedReport(r)}>
                        <div className="report-item-icon"><span style={{ fontSize: 12, fontWeight: 800 }}>IG</span></div>
                        <div className="report-item-info">
                          <div className="report-item-name">{r.client?.name || d?.account_handle || 'Sense client'}</div>
                          <div className="report-item-period">
                            {r.period_start && r.period_end
                              ? `${new Date(r.period_start).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })} – ${new Date(r.period_end).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: '2-digit' })}`
                              : new Date(r.created_at).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </div>
                        </div>
                        <div className="report-item-actions">
                          <ChevronRight size={13} color="#C0C0C0" />
                          <button className="del-btn" onClick={e => { e.stopPropagation(); deleteReport(r.id) }}><Trash2 size={11} /></button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            })()}
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="report-main">
        {!selectedReport ? (
          <div className="report-placeholder">
            <BarChart2 size={40} color="#E0E0E0" />
            <p>Selecciona un informe o puja un nou PDF</p>
            <button className="btn-upload-lg" onClick={() => setShowUpload(true)}>
              <Upload size={15} />Pujar informe PDF
            </button>
          </div>
        ) : (
          <ReportView report={selectedReport} />
        )}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !uploading && setShowUpload(false)}>
          <div className="upload-modal">
            <div className="upload-modal-hdr">
              <h2>Pujar informe Social Media</h2>
              {!uploading && <button onClick={() => setShowUpload(false)}><X size={15} /></button>}
            </div>

            {uploading ? (
              <div className="uploading-state">
                <Loader2 size={36} color="#1B2B4B" className="spin" />
                <p>{uploadProgress}</p>
              </div>
            ) : (
              <>
                <div className="form-field">
                  <label>Client (opcional)</label>
                  <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
                    <option value="">Sense assignar a client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-field">
                  <label>Instruccions addicionals per la IA (opcional)</label>
                  <textarea
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    placeholder="Ex: Posa especial atenció als reels. El compte és @guinew_agency de l'empresa Guinew..."
                    rows={3}
                  />
                </div>

                <div
                  className={`drop-zone${dragOver ? ' drop-zone--over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                  onClick={() => fileRef.current?.click()}
                >
                  <FileText size={32} color={dragOver ? '#1B2B4B' : '#C0C0C0'} />
                  <p className="drop-title">Arrossega el PDF aquí</p>
                  <p className="drop-sub">o fes clic per seleccionar · màx. 20MB</p>
                  <p className="drop-note">Compatible amb informes Metricool, Later, Hootsuite i similars</p>
                </div>

                {error && (
                  <div className={`upload-error${error.includes('Saldo') ? ' upload-error--billing' : ''}`}>
                    {error}
                    {error.includes('Saldo') && (
                      <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noopener noreferrer" className="billing-link">
                        Anar a Billing →
                      </a>
                    )}
                  </div>
                )}

                <input ref={fileRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .metrics-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
          height: 100%;
        }

        @media (max-width: 1023px) {
          .metrics-layout { flex-direction: column; overflow: auto; height: auto; min-height: 100vh; }
          .reports-sidebar { width: 100% !important; min-width: 100% !important; border-right: none; border-bottom: 1px solid #ECECEC; max-height: 260px; }
          .reports-list { max-height: 200px; overflow-y: auto; }
          .report-main { flex: 1; min-height: 60vh; }
        }
        @media (max-width: 767px) {
          .reports-sidebar { max-height: 220px; }
          .sidebar-header { padding: 12px 12px 10px; }
        }

        /* Sidebar */
        .reports-sidebar {
          width: 260px;
          min-width: 260px;
          border-right: 1px solid #ECECEC;
          display: flex;
          flex-direction: column;
          background: white;
          overflow: hidden;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 16px 12px;
          border-bottom: 1px solid #F0F0F0;
          flex-shrink: 0;
        }

        .sidebar-title { font-size: 13px; font-weight: 700; color: #0a0a0a; }

        .btn-upload {
          display: flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 600;
          color: white; background: #1B2B4B; border: none; border-radius: 6px;
          padding: 5px 10px; cursor: pointer; font-family: inherit; transition: background 0.15s;
        }
        .btn-upload:hover { background: #4A82C6; }

        .reports-empty {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 10px; color: #9A9A9A; font-size: 13px;
          padding: 24px; text-align: center;
        }

        .reports-list { flex: 1; overflow-y: auto; }

        .month-header {
          padding: 8px 14px 5px;
          font-size: 10px; font-weight: 700; color: #9A9A9A;
          letter-spacing: 0.06em; text-transform: uppercase;
          background: #FAFAFA;
          border-bottom: 1px solid #F0F0F0;
          position: sticky; top: 0; z-index: 1;
        }

        .report-item {
          display: flex; align-items: center; gap: 10px; padding: 12px 14px;
          border-bottom: 1px solid #F8F8F8; cursor: pointer; transition: background 0.1s;
        }
        .report-item:hover { background: #FAFAFA; }
        .report-item--active { background: #1B2B4B0A; border-right: 2px solid #1B2B4B; }

        .report-item-icon {
          width: 30px; height: 30px; border-radius: 8px; background: #F5F0FF;
          color: #9333EA; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .report-item--active .report-item-icon { background: #1B2B4B14; color: #1B2B4B; }

        .report-item-info { flex: 1; min-width: 0; }
        .report-item-name { font-size: 13px; font-weight: 600; color: #0a0a0a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .report-item-period { font-size: 11px; color: #9A9A9A; margin-top: 2px; }

        .report-item-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .del-btn { border: none; background: transparent; cursor: pointer; color: #D0D0D0; padding: 3px; border-radius: 4px; display: flex; opacity: 0; transition: opacity 0.15s, color 0.15s; }
        .report-item:hover .del-btn { opacity: 1; }
        .del-btn:hover { color: #DC2626; background: #FEF2F2; }

        /* Main */
        .report-main { flex: 1; overflow-y: auto; background: #F8F8F8; }

        .report-placeholder {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 16px; height: 100%; padding: 40px;
        }
        .report-placeholder p { font-size: 14px; color: #9A9A9A; }

        .btn-upload-lg {
          display: flex; align-items: center; gap: 7px; height: 40px; padding: 0 18px;
          background: #1B2B4B; color: white; border: none; border-radius: 8px;
          font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: inherit;
          transition: background 0.15s; margin-top: 8px;
        }
        .btn-upload-lg:hover { background: #4A82C6; }

        /* Upload modal */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px;
        }

        .upload-modal {
          background: white; border-radius: 16px; width: 100%; max-width: 480px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18); overflow: hidden;
          display: flex; flex-direction: column; gap: 0;
        }

        .upload-modal-hdr {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px 16px; border-bottom: 1px solid #F0F0F0;
        }
        .upload-modal-hdr h2 { font-size: 15px; font-weight: 700; color: #0a0a0a; }
        .upload-modal-hdr button { border: none; background: #F0F0F0; border-radius: 6px; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #5C5C5C; }

        .form-field { display: flex; flex-direction: column; gap: 6px; padding: 16px 24px 0; }
        .form-field label { font-size: 11px; font-weight: 700; color: #9A9A9A; letter-spacing: 0.05em; text-transform: uppercase; }
        .form-field select { height: 36px; padding: 0 10px; border: 1.5px solid #E8E8E8; border-radius: 7px; font-size: 13px; font-family: inherit; outline: none; background: #FAFAFA; }
        .form-field textarea { padding: 8px 10px; border: 1.5px solid #E8E8E8; border-radius: 7px; font-size: 13px; font-family: inherit; outline: none; background: #FAFAFA; resize: vertical; line-height: 1.5; color: #0a0a0a; }
        .form-field textarea:focus { border-color: #1B2B4B60; }
        .form-field textarea::placeholder { color: #C0C0C0; }

        .drop-zone {
          margin: 16px 24px 20px; padding: 32px 20px; border: 2px dashed #E0E0E0; border-radius: 12px;
          display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer;
          transition: all 0.15s; text-align: center;
        }
        .drop-zone:hover { border-color: #1B2B4B60; background: #F0F4FF; }
        .drop-zone--over { border-color: #1B2B4B; background: #EEF4FF; }

        .drop-title { font-size: 14px; font-weight: 600; color: #0a0a0a; }
        .drop-sub { font-size: 12.5px; color: #9A9A9A; }
        .drop-note { font-size: 11.5px; color: #C0C0C0; margin-top: 4px; }

        .upload-error { margin: 0 24px 16px; font-size: 13px; color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA; padding: 10px 12px; border-radius: 8px; }
        .upload-error--billing { font-weight: 600; font-size: 13.5px; border-width: 2px; display: flex; flex-direction: column; gap: 8px; }
        :global(.billing-link) { display: inline-block; font-size: 12.5px; font-weight: 700; color: #DC2626; text-decoration: underline; }

        .uploading-state {
          display: flex; flex-direction: column; align-items: center; gap: 16px;
          padding: 48px 24px; color: #5C5C5C; font-size: 14px; font-weight: 500;
        }
        :global(.spin) { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}


function ReportView({ report }: { report: Report }) {
  const d = (report.raw_data || {}) as any
  const handle = d.account_handle || report.account_handle || ''
  const period = report.period_start && report.period_end
    ? `${new Date(report.period_start).toLocaleDateString('ca-ES', { day: '2-digit', month: 'long', year: 'numeric' })} — ${new Date(report.period_end).toLocaleDateString('ca-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`
    : new Date(report.created_at).toLocaleDateString('ca-ES', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="rv">
      {/* Header */}
      <div className="rv-header">
        <div className="rv-platform"><span style={{ fontWeight: 800, fontSize: 13 }}>IG</span></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="rv-handle">{handle || report.client?.name || 'Informe'}</div>
          <div className="rv-period">{period}</div>
        </div>
        {report.client && <div className="rv-client">{report.client.name}</div>}
        {report.pdf_url && (
          <a href={report.pdf_url} target="_blank" rel="noopener noreferrer" className="btn-open-pdf">
            <ExternalLink size={13} /> Obrir PDF
          </a>
        )}
      </div>

      {/* PDF Preview */}
      {report.pdf_url ? (
        <div className="pdf-section">
          <div className="section-label"><FileText size={13} /> Document original</div>
          <div className="pdf-frame-wrap">
            <iframe
              src={`${report.pdf_url}#toolbar=0&navpanes=0&scrollbar=1`}
              className="pdf-frame"
              title="PDF preview"
            />
          </div>
        </div>
      ) : (
        <div className="no-pdf">
          <FileText size={28} color="#C0C0C0" />
          <p>Document no disponible</p>
          <span>El PDF es desava en el bucket "metric-reports" que pot no existir</span>
        </div>
      )}

      {/* AI Analysis */}
      {report.ai_analysis && (
        <div className="ai-section">
          <div className="section-label"><Sparkles size={13} /> Anàlisi d'Intel·ligència Artificial</div>
          <div className="analysis-card">
            {report.ai_analysis.split('\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .rv {
          padding: 24px 28px 48px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 960px;
        }

        @media (max-width: 767px) {
          .rv { padding: 14px 12px 60px; gap: 16px; }
          .rv-header { flex-wrap: wrap; gap: 10px; }
          .btn-open-pdf { margin-left: 0; width: 100%; justify-content: center; }
        }

        .rv-header {
          display: flex;
          align-items: center;
          gap: 14px;
          background: white;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 16px;
          padding: 16px 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .rv-platform {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .rv-handle { font-size: 15px; font-weight: 700; color: #0a0a0a; }
        .rv-period { font-size: 12px; color: #9A9A9A; margin-top: 2px; }

        .rv-client {
          font-size: 12px;
          font-weight: 600;
          color: #1B2B4B;
          background: #1B2B4B0F;
          padding: 4px 10px;
          border-radius: 20px;
          white-space: nowrap;
        }

        .btn-open-pdf {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 14px;
          background: #1B2B4B;
          color: white;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .btn-open-pdf:hover { background: #4A82C6; }

        .section-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: #9A9A9A;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .pdf-section { display: flex; flex-direction: column; }

        .pdf-frame-wrap {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #E8E8E8;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
          background: #F5F5F5;
        }

        .pdf-frame {
          width: 100%;
          height: 75vh;
          min-height: 500px;
          border: none;
          display: block;
        }

        .no-pdf {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 40px;
          background: #FAFAFA;
          border: 1px dashed #E0E0E0;
          border-radius: 12px;
          text-align: center;
          color: #9A9A9A;
        }
        .no-pdf p { font-size: 14px; font-weight: 600; color: #555; }
        .no-pdf span { font-size: 12px; color: #C0C0C0; }

        .ai-section { display: flex; flex-direction: column; }

        .analysis-card {
          background: white;
          border: 1px solid #E8E4FF;
          border-left: 3px solid #7C3AED;
          border-radius: 12px;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(124,58,237,0.06);
        }
        .analysis-card p { font-size: 14px; line-height: 1.7; color: #3C3C3C; }
      `}</style>
    </div>
  )
}

