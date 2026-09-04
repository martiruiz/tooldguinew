'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Folder, FileText, Image, Film, Archive, ExternalLink,
  ChevronRight, Home, Loader2, RefreshCw, LogIn, CheckCircle2, AlertCircle,
} from 'lucide-react'

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime?: string
  webViewLink?: string
  iconLink?: string
  thumbnailLink?: string
}

interface BreadcrumbItem {
  id: string
  name: string
}

interface Props {
  isConnected: boolean
  justConnected?: boolean
  error?: string
}

const FOLDER_MIME = 'application/vnd.google-apps.folder'

function fileIcon(mimeType: string) {
  if (mimeType === FOLDER_MIME) return <Folder size={16} color="#4A82C6" fill="#EFF6FF" />
  if (mimeType.startsWith('image/')) return <Image size={16} color="#D97706" />
  if (mimeType.startsWith('video/')) return <Film size={16} color="#DC2626" />
  if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive size={16} color="#9A9A9A" />
  return <FileText size={16} color="#5C5C5C" />
}

function fmtSize(bytes?: string) {
  if (!bytes) return ''
  const n = parseInt(bytes)
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function fmtDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function DocumentsContent({ isConnected, justConnected, error }: Props) {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: 'root', name: 'El meu Drive' }])
  const [fetchError, setFetchError] = useState('')

  const currentFolder = breadcrumb[breadcrumb.length - 1]

  const loadFiles = useCallback(async (folderId: string) => {
    setLoading(true)
    setFetchError('')
    try {
      const res = await fetch(`/api/drive/files?folderId=${folderId}`)
      if (res.status === 403) { setFetchError('not_connected'); setLoading(false); return }
      if (!res.ok) throw new Error('Error carregant fitxers')
      const data = await res.json()
      setFiles(data.files)
    } catch (e: any) {
      setFetchError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isConnected) loadFiles('root')
  }, [isConnected, loadFiles])

  const openFolder = (file: DriveFile) => {
    setBreadcrumb(prev => [...prev, { id: file.id, name: file.name }])
    loadFiles(file.id)
  }

  const navigateTo = (index: number) => {
    const crumb = breadcrumb[index]
    setBreadcrumb(prev => prev.slice(0, index + 1))
    loadFiles(crumb.id)
  }

  if (!isConnected) {
    return (
      <div className="connect-screen">
        <div className="connect-card">
          <div className="drive-logo">
            <svg width="48" height="48" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z" fill="#00ac47"/>
              <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.4 9.5z" fill="#ea4335"/>
              <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
          </div>
          <h2>Connecta Google Drive</h2>
          <p>Accedeix i gestiona els documents de l'agència directament des de GUINEW TOOLS.</p>
          {error && (
            <div className="error-banner">
              <AlertCircle size={14} />
              {error === 'oauth_failed' ? 'Error al connectar amb Google. Torna-ho a intentar.' : 'Error desconegut.'}
            </div>
          )}
          <a href="/api/auth/google" className="btn-connect">
            <LogIn size={16} />
            Connectar amb Google Drive
          </a>
          <p className="privacy-note">Només accedirà als fitxers del teu Drive. No compartirem cap dada.</p>
        </div>

        <style jsx>{`
          .connect-screen { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
          .connect-card { background: white; border: 1px solid #ECECEC; border-radius: 20px; padding: 48px 40px; max-width: 420px; width: 100%; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
          .drive-logo { margin-bottom: 4px; }
          .connect-card h2 { font-size: 20px; font-weight: 700; color: #0a0a0a; }
          .connect-card p { font-size: 14px; color: #5C5C5C; line-height: 1.6; max-width: 320px; }
          .error-banner { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA; padding: 10px 14px; border-radius: 8px; width: 100%; }
          .btn-connect { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 24px; background: #1B2B4B; color: white; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; transition: background 0.15s; }
          .btn-connect:hover { background: #4A82C6; }
          .privacy-note { font-size: 11.5px; color: #C0C0C0; margin-top: -4px; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="docs-page">
      {/* Header */}
      <div className="docs-header">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.id} className="crumb-wrap">
              {i > 0 && <ChevronRight size={13} color="#C0C0C0" />}
              <button
                className={`crumb${i === breadcrumb.length - 1 ? ' crumb--active' : ''}`}
                onClick={() => navigateTo(i)}
              >
                {i === 0 ? <Home size={13} /> : null}
                {crumb.name}
              </button>
            </span>
          ))}
        </nav>

        <div className="docs-actions">
          {justConnected && (
            <div className="connected-badge">
              <CheckCircle2 size={13} color="#16A34A" />
              Drive connectat!
            </div>
          )}
          <button className="btn-refresh" onClick={() => loadFiles(currentFolder.id)} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Files */}
      {loading ? (
        <div className="loading-state">
          <Loader2 size={24} color="#9A9A9A" className="spin" />
          <span>Carregant fitxers...</span>
        </div>
      ) : fetchError ? (
        <div className="error-state">
          <AlertCircle size={24} color="#DC2626" />
          <span>{fetchError}</span>
        </div>
      ) : files.length === 0 ? (
        <div className="empty-state">
          <Folder size={36} color="#D0D0D0" strokeWidth={1.5} />
          <span>Aquesta carpeta és buida.</span>
        </div>
      ) : (
        <div className="files-table-wrap">
          <table className="files-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Modificat</th>
                <th>Mida</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr
                  key={file.id}
                  className={file.mimeType === FOLDER_MIME ? 'row-folder' : ''}
                  onClick={() => file.mimeType === FOLDER_MIME ? openFolder(file) : undefined}
                >
                  <td>
                    <div className="file-name">
                      {fileIcon(file.mimeType)}
                      <span>{file.name}</span>
                    </div>
                  </td>
                  <td className="text-sm">{fmtDate(file.modifiedTime)}</td>
                  <td className="text-sm">{fmtSize(file.size)}</td>
                  <td>
                    {file.webViewLink && file.mimeType !== FOLDER_MIME && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-open"
                        onClick={e => e.stopPropagation()}
                        title="Obrir a Drive"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .docs-page { flex: 1; padding: 20px 28px 60px; display: flex; flex-direction: column; gap: 16px; }
        @media (max-width: 768px) { .docs-page { padding: 12px 12px 80px; } }

        .docs-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }

        .breadcrumb { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
        .crumb-wrap { display: flex; align-items: center; gap: 4px; }
        .crumb { display: flex; align-items: center; gap: 5px; border: none; background: none; font-size: 13.5px; color: #9A9A9A; cursor: pointer; padding: 4px 6px; border-radius: 6px; font-family: inherit; font-weight: 500; transition: all 0.15s; }
        .crumb:hover { background: #F0F0F0; color: #1B2B4B; }
        .crumb--active { color: #0a0a0a; font-weight: 600; cursor: default; }
        .crumb--active:hover { background: none; color: #0a0a0a; }

        .docs-actions { display: flex; align-items: center; gap: 8px; }
        .connected-badge { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #16A34A; background: #F0FDF4; padding: 4px 10px; border-radius: 6px; }
        .btn-refresh { width: 32px; height: 32px; border: 1px solid #E8E8E8; border-radius: 8px; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #9A9A9A; transition: all 0.15s; }
        .btn-refresh:hover { border-color: #D0D0D0; color: #1B2B4B; }

        .loading-state, .empty-state, .error-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #9A9A9A; font-size: 14px; padding: 80px 24px; }
        .error-state { color: #DC2626; }

        .files-table-wrap { border: 1px solid #ECECEC; border-radius: 12px; background: white; overflow: hidden; }
        .files-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .files-table thead th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #9A9A9A; letter-spacing: 0.04em; text-transform: uppercase; border-bottom: 1px solid #F0F0F0; background: #FAFAFA; }
        .files-table tbody tr { border-bottom: 1px solid #F8F8F8; transition: background 0.1s; }
        .files-table tbody tr:last-child { border-bottom: none; }
        .files-table tbody tr:hover { background: #FAFAFA; }
        .files-table tbody tr.row-folder { cursor: pointer; }
        .files-table tbody tr.row-folder:hover { background: #F0F6FF; }
        .files-table td { padding: 11px 16px; color: #0a0a0a; vertical-align: middle; }

        .file-name { display: flex; align-items: center; gap: 10px; font-weight: 500; }
        .text-sm { font-size: 12.5px; color: #9A9A9A; white-space: nowrap; }

        .btn-open { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: 1px solid #E8E8E8; border-radius: 6px; background: white; color: #9A9A9A; text-decoration: none; transition: all 0.15s; }
        .btn-open:hover { border-color: #4A82C6; color: #4A82C6; }

        :global(.spin) { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
