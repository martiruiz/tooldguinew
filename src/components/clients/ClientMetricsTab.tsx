'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Trash2, ChevronRight, BarChart2, X, Loader2, Sparkles } from 'lucide-react'
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
  clientId: string
  clientName: string
  reports: Report[]
  currentUserId: string
}

export function ClientMetricsTab({ clientId, clientName, reports: initialReports, currentUserId }: Props) {
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [selectedReport, setSelectedReport] = useState<Report | null>(initialReports[0] || null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file || file.type !== 'application/pdf') { setError('Selecciona un fitxer PDF'); return }
    if (file.size > 20 * 1024 * 1024) { setError('El PDF no pot superar 20MB'); return }
    setError('')
    setUploading(true)
    setUploadProgress('Analitzant amb Intel·ligència Artificial...')

    try {
      const form = new FormData()
      form.append('pdf', file)
      if (customPrompt.trim()) form.append('prompt', customPrompt.trim())
      const res = await fetch('/api/metrics/analyze', { method: 'POST', body: form })
      const json = await res.json()
      if (json.error) {
        const msg = typeof json.error === 'string' && json.error.includes('credit')
          ? '💳 Saldo insuficient a Anthropic. Afegeix crèdits a console.anthropic.com/settings/billing.'
          : json.error
        setError(msg)
        setUploading(false)
        return
      }
      const { rawData, analysis } = json

      setUploadProgress('Desant l\'anàlisi...')
      const supabase = createClient()
      const d = rawData as any
      const { data: saved } = await supabase
        .from('metric_reports')
        .insert({
          client_id: clientId,
          created_by: currentUserId,
          period_start: d?.period_start || null,
          period_end: d?.period_end || null,
          platform: d?.platform || 'instagram',
          account_handle: d?.account_handle || null,
          pdf_url: null,
          raw_data: rawData,
          ai_analysis: analysis,
        })
        .select('*, client:clients(id, name)')
        .single()

      if (saved) {
        setReports(prev => [saved as Report, ...prev])
        setSelectedReport(saved as Report)
        setShowUpload(false)
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
    if (selectedReport?.id === id) setSelectedReport(reports.find(r => r.id !== id) || null)
  }

  return (
    <div className="cmt-wrap">
      <div className="cmt-toolbar">
        <span className="cmt-count">{reports.length} informe{reports.length !== 1 ? 's' : ''}</span>
        <button className="cmt-btn-upload" onClick={() => setShowUpload(true)}>
          <Upload size={13} /> Pujar informe PDF
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="cmt-empty">
          <BarChart2 size={32} color="#D0D0D0" />
          <p>Puja el primer informe de {clientName}</p>
          <button className="cmt-btn-upload-lg" onClick={() => setShowUpload(true)}>
            <Upload size={14} /> Pujar informe PDF
          </button>
        </div>
      ) : (
        <div className="cmt-layout">
          {/* Sidebar */}
          <div className="cmt-sidebar">
            {(() => {
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
                  <div className="cmt-month">{group.label.charAt(0).toUpperCase() + group.label.slice(1)}</div>
                  {group.reports.map(r => {
                    const d = r.raw_data as any
                    return (
                      <div
                        key={r.id}
                        className={`cmt-item${selectedReport?.id === r.id ? ' cmt-item--active' : ''}`}
                        onClick={() => setSelectedReport(r)}
                      >
                        <div className="cmt-item-icon"><span style={{ fontSize: 11, fontWeight: 800 }}>IG</span></div>
                        <div className="cmt-item-info">
                          <div className="cmt-item-handle">{d?.account_handle || 'Informe'}</div>
                          <div className="cmt-item-period">
                            {r.period_start && r.period_end
                              ? `${new Date(r.period_start).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })} – ${new Date(r.period_end).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: '2-digit' })}`
                              : new Date(r.created_at).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </div>
                        </div>
                        <div className="cmt-item-actions">
                          <ChevronRight size={12} color="#C0C0C0" />
                          <button className="cmt-del-btn" onClick={e => { e.stopPropagation(); deleteReport(r.id) }}><Trash2 size={10} /></button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            })()}
          </div>

          {/* Main */}
          <div className="cmt-main">
            {selectedReport ? <ReportView report={selectedReport} /> : (
              <div className="cmt-placeholder">
                <BarChart2 size={28} color="#D0D0D0" />
                <p>Selecciona un informe</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="cmt-modal-overlay" onClick={e => e.target === e.currentTarget && !uploading && setShowUpload(false)}>
          <div className="cmt-modal">
            <div className="cmt-modal-hdr">
              <h2>Pujar informe Social Media</h2>
              {!uploading && <button onClick={() => setShowUpload(false)}><X size={15} /></button>}
            </div>

            {uploading ? (
              <div className="cmt-uploading">
                <Loader2 size={32} color="#1B2B4B" className="cmt-spin" />
                <p>{uploadProgress}</p>
              </div>
            ) : (
              <>
                <div className="cmt-form-field">
                  <label>Instruccions addicionals per la IA (opcional)</label>
                  <textarea
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    placeholder={`Ex: Posa especial atenció als reels. El compte és @${clientName.toLowerCase().replace(/\s/g, '_')}...`}
                    rows={3}
                  />
                </div>

                <div
                  className={`cmt-dropzone${dragOver ? ' cmt-dropzone--over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                  onClick={() => fileRef.current?.click()}
                >
                  <FileText size={28} color={dragOver ? '#1B2B4B' : '#C0C0C0'} />
                  <p className="cmt-drop-title">Arrossega el PDF aquí</p>
                  <p className="cmt-drop-sub">o fes clic · màx. 20MB · Metricool, Later, Hootsuite...</p>
                </div>

                {error && (
                  <div className="cmt-error">
                    {error}
                    {error.includes('Saldo') && (
                      <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noopener noreferrer" className="cmt-billing-link">
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
        .cmt-wrap { display: flex; flex-direction: column; gap: 16px; }

        .cmt-toolbar {
          display: flex; align-items: center; justify-content: space-between;
        }
        .cmt-count { font-size: 12.5px; color: #9A9A9A; font-weight: 500; }

        .cmt-btn-upload {
          display: flex; align-items: center; gap: 6px;
          height: 34px; padding: 0 14px; background: #1B2B4B; color: white;
          border: none; border-radius: 8px; font-size: 12.5px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: background 0.15s;
        }
        .cmt-btn-upload:hover { background: #254067; }

        .cmt-empty {
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          padding: 60px 24px; color: #9A9A9A; font-size: 14px; text-align: center;
        }
        .cmt-btn-upload-lg {
          display: flex; align-items: center; gap: 6px; height: 38px; padding: 0 18px;
          background: #1B2B4B; color: white; border: none; border-radius: 8px;
          font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
          transition: background 0.15s;
        }
        .cmt-btn-upload-lg:hover { background: #254067; }

        .cmt-layout { display: flex; gap: 0; border: 1px solid #ECECEC; border-radius: 16px; overflow: hidden; min-height: 500px; }

        .cmt-sidebar {
          width: 220px; min-width: 220px; border-right: 1px solid #ECECEC;
          overflow-y: auto; background: white;
        }
        @media (max-width: 767px) { .cmt-layout { flex-direction: column; } .cmt-sidebar { width: 100%; min-width: 100%; border-right: none; border-bottom: 1px solid #ECECEC; max-height: 200px; } }

        .cmt-month {
          padding: 7px 12px 5px; font-size: 9.5px; font-weight: 700; color: #9A9A9A;
          text-transform: uppercase; letter-spacing: 0.06em; background: #FAFAFA;
          border-bottom: 1px solid #F0F0F0; position: sticky; top: 0;
        }
        .cmt-item {
          display: flex; align-items: center; gap: 8px; padding: 10px 12px;
          border-bottom: 1px solid #F8F8F8; cursor: pointer; transition: background 0.1s;
        }
        .cmt-item:hover { background: #FAFAFA; }
        .cmt-item--active { background: #1B2B4B08; border-right: 2px solid #1B2B4B; }

        .cmt-item-icon {
          width: 28px; height: 28px; border-radius: 7px; background: #F5F0FF;
          color: #9333EA; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .cmt-item--active .cmt-item-icon { background: #1B2B4B14; color: #1B2B4B; }
        .cmt-item-info { flex: 1; min-width: 0; }
        .cmt-item-handle { font-size: 12.5px; font-weight: 600; color: #0a0a0a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cmt-item-period { font-size: 10.5px; color: #9A9A9A; margin-top: 1px; }
        .cmt-item-actions { display: flex; align-items: center; gap: 3px; }
        .cmt-del-btn { border: none; background: transparent; cursor: pointer; color: #D0D0D0; padding: 3px; border-radius: 4px; display: flex; opacity: 0; transition: opacity 0.15s, color 0.15s; }
        .cmt-item:hover .cmt-del-btn { opacity: 1; }
        .cmt-del-btn:hover { color: #DC2626; }

        .cmt-main { flex: 1; min-width: 0; overflow-y: auto; background: #FAFAFA; }
        .cmt-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 10px; color: #C0C0C0; font-size: 13px; padding: 40px; }

        /* Modal */
        .cmt-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px;
        }
        .cmt-modal {
          background: white; border-radius: 16px; width: 100%; max-width: 460px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18); overflow: hidden; display: flex; flex-direction: column;
        }
        .cmt-modal-hdr {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 22px 14px; border-bottom: 1px solid #F0F0F0;
        }
        .cmt-modal-hdr h2 { font-size: 14.5px; font-weight: 700; color: #0a0a0a; }
        .cmt-modal-hdr button { border: none; background: #F0F0F0; border-radius: 6px; width: 26px; height: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #5C5C5C; }
        .cmt-form-field { display: flex; flex-direction: column; gap: 5px; padding: 14px 22px 0; }
        .cmt-form-field label { font-size: 10.5px; font-weight: 700; color: #9A9A9A; text-transform: uppercase; letter-spacing: 0.05em; }
        .cmt-form-field textarea { padding: 8px 10px; border: 1.5px solid #E8E8E8; border-radius: 7px; font-size: 13px; font-family: inherit; outline: none; background: #FAFAFA; resize: vertical; line-height: 1.5; color: #0a0a0a; }
        .cmt-form-field textarea:focus { border-color: #1B2B4B60; }
        .cmt-form-field textarea::placeholder { color: #C0C0C0; }
        .cmt-dropzone {
          margin: 14px 22px 18px; padding: 28px 18px; border: 2px dashed #E0E0E0; border-radius: 12px;
          display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: all 0.15s; text-align: center;
        }
        .cmt-dropzone:hover { border-color: #1B2B4B60; background: #F0F4FF; }
        .cmt-dropzone--over { border-color: #1B2B4B; background: #EEF4FF; }
        .cmt-drop-title { font-size: 13.5px; font-weight: 600; color: #0a0a0a; }
        .cmt-drop-sub { font-size: 12px; color: #9A9A9A; }
        .cmt-error { margin: 0 22px 14px; font-size: 12.5px; color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA; padding: 9px 12px; border-radius: 8px; }
        :global(.cmt-billing-link) { display: block; font-size: 12px; font-weight: 700; color: #DC2626; text-decoration: underline; margin-top: 4px; }
        .cmt-uploading { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 40px 22px; color: #5C5C5C; font-size: 13.5px; font-weight: 500; }
        .cmt-spin { animation: cmt-spin 1s linear infinite; }
        @keyframes cmt-spin { to { transform: rotate(360deg); } }
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

  const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n ?? '—')

  const community = d.community || {}
  const posts = d.posts || {}
  const reels = d.reels || {}
  const reach = d.reach || {}

  return (
    <div className="rv">
      <div className="rv-header">
        <div className="rv-platform"><span style={{ fontWeight: 800, fontSize: 12 }}>IG</span></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="rv-handle">{handle || 'Informe'}</div>
          <div className="rv-period">{period}</div>
        </div>
      </div>

      {/* KPIs */}
      {(community.followers || posts.count || reels.count) ? (
        <div className="rv-kpis">
          {community.followers != null && <div className="rv-kpi"><div className="rv-kpi-val">{fmtNum(community.followers)}</div><div className="rv-kpi-label">Seguidors</div></div>}
          {community.followers_balance != null && <div className="rv-kpi"><div className="rv-kpi-val" style={{ color: community.followers_balance >= 0 ? '#16A34A' : '#DC2626' }}>{community.followers_balance >= 0 ? '+' : ''}{fmtNum(community.followers_balance)}</div><div className="rv-kpi-label">Balanç</div></div>}
          {reach.total_views != null && <div className="rv-kpi"><div className="rv-kpi-val">{fmtNum(reach.total_views)}</div><div className="rv-kpi-label">Visualitzacions</div></div>}
          {posts.count != null && <div className="rv-kpi"><div className="rv-kpi-val">{posts.count}</div><div className="rv-kpi-label">Posts</div></div>}
          {reels.count != null && <div className="rv-kpi"><div className="rv-kpi-val">{reels.count}</div><div className="rv-kpi-label">Reels</div></div>}
          {posts.avg_engagement != null && <div className="rv-kpi"><div className="rv-kpi-val">{Number(posts.avg_engagement).toFixed(2)}%</div><div className="rv-kpi-label">Engagement posts</div></div>}
          {reels.avg_engagement != null && <div className="rv-kpi"><div className="rv-kpi-val">{Number(reels.avg_engagement).toFixed(2)}%</div><div className="rv-kpi-label">Engagement reels</div></div>}
        </div>
      ) : null}

      {/* AI Analysis */}
      {report.ai_analysis && (
        <div className="rv-analysis">
          <div className="rv-analysis-label"><Sparkles size={12} /> Anàlisi IA</div>
          <div className="rv-analysis-body">
            {report.ai_analysis.split('\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .rv { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

        .rv-header {
          display: flex; align-items: center; gap: 12px;
          background: white; border: 1px solid rgba(0,0,0,0.06);
          border-radius: 12px; padding: 14px 16px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.05);
        }
        .rv-platform {
          width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
          background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
          display: flex; align-items: center; justify-content: center; color: white;
        }
        .rv-handle { font-size: 14px; font-weight: 700; color: #0a0a0a; }
        .rv-period { font-size: 11.5px; color: #9A9A9A; margin-top: 2px; }

        .rv-kpis {
          display: flex; flex-wrap: wrap; gap: 8px;
        }
        .rv-kpi {
          background: white; border: 1px solid #F0F0F0; border-radius: 10px;
          padding: 12px 16px; min-width: 90px; flex: 1;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .rv-kpi-val { font-size: 18px; font-weight: 700; color: #0a0a0a; }
        .rv-kpi-label { font-size: 10.5px; color: #9A9A9A; margin-top: 3px; font-weight: 500; }

        .rv-analysis { display: flex; flex-direction: column; gap: 8px; }
        .rv-analysis-label {
          display: flex; align-items: center; gap: 5px;
          font-size: 10.5px; font-weight: 700; color: #254067;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .rv-analysis-body {
          background: white; border: 1px solid #E8E4FF; border-left: 3px solid #254067;
          border-radius: 10px; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px;
          box-shadow: 0 2px 8px rgba(37,64,103,0.06);
        }
        .rv-analysis-body p { font-size: 13.5px; line-height: 1.7; color: #3C3C3C; }
      `}</style>
    </div>
  )
}
