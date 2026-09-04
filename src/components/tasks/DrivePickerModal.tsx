'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Folder, FileText, Image, Film, Archive, ChevronRight, Home, Loader2, Search, Check } from 'lucide-react'

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime?: string
  webViewLink?: string
}

interface BreadcrumbItem { id: string; name: string }

interface Props {
  onSelect: (file: { url: string; name: string }) => void
  onClose: () => void
}

const FOLDER_MIME = 'application/vnd.google-apps.folder'

function fileIcon(mimeType: string) {
  if (mimeType === FOLDER_MIME) return <Folder size={15} color="#4A82C6" fill="#EFF6FF" />
  if (mimeType.startsWith('image/')) return <Image size={15} color="#D97706" />
  if (mimeType.startsWith('video/')) return <Film size={15} color="#DC2626" />
  if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive size={15} color="#9A9A9A" />
  if (mimeType.includes('spreadsheet')) return <FileText size={15} color="#16A34A" />
  if (mimeType.includes('presentation')) return <FileText size={15} color="#D97706" />
  return <FileText size={15} color="#4A82C6" />
}

export function DrivePickerModal({ onSelect, onClose }: Props) {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: 'root', name: 'El meu Drive' }])

  const currentFolder = breadcrumb[breadcrumb.length - 1]

  const loadFiles = useCallback(async (folderId: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/drive/files?folderId=${folderId}`)
      if (res.status === 403) { setError('Drive no connectat. Ves a Documents per connectar-lo.'); setLoading(false); return }
      if (!res.ok) throw new Error('Error carregant fitxers')
      const data = await res.json()
      setFiles(data.files)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadFiles('root') }, [loadFiles])

  const openFolder = (file: DriveFile) => {
    setBreadcrumb(prev => [...prev, { id: file.id, name: file.name }])
    setSearch('')
    loadFiles(file.id)
  }

  const navigateTo = (index: number) => {
    setBreadcrumb(prev => prev.slice(0, index + 1))
    setSearch('')
    loadFiles(breadcrumb[index].id)
  }

  const handleSelect = (file: DriveFile) => {
    if (file.mimeType === FOLDER_MIME) { openFolder(file); return }
    onSelect({ url: file.webViewLink || '', name: file.name })
    onClose()
  }

  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="picker">
        {/* Header */}
        <div className="picker-header">
          <div className="header-title">
            <svg width="18" height="18" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z" fill="#00ac47"/>
              <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.4 9.5z" fill="#ea4335"/>
              <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
            <span>Selecciona un document de Drive</span>
          </div>
          <button className="close-btn" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Search */}
        <div className="search-bar">
          <Search size={13} color="#9A9A9A" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar fitxer..."
            autoFocus
          />
        </div>

        {/* Breadcrumb */}
        <div className="breadcrumb">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.id} className="crumb-wrap">
              {i > 0 && <ChevronRight size={11} color="#C0C0C0" />}
              <button className={`crumb${i === breadcrumb.length - 1 ? ' active' : ''}`} onClick={() => navigateTo(i)}>
                {i === 0 ? <Home size={11} /> : null}
                {crumb.name}
              </button>
            </span>
          ))}
        </div>

        {/* File list */}
        <div className="file-list">
          {loading ? (
            <div className="state-center">
              <Loader2 size={20} color="#9A9A9A" className="spin" />
              <span>Carregant...</span>
            </div>
          ) : error ? (
            <div className="state-center error">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="state-center">
              <Folder size={24} color="#D0D0D0" />
              <span>{search ? 'Cap resultat.' : 'Carpeta buida.'}</span>
            </div>
          ) : (
            filtered.map(file => (
              <button
                key={file.id}
                className={`file-row${file.mimeType === FOLDER_MIME ? ' is-folder' : ''}`}
                onClick={() => handleSelect(file)}
              >
                {fileIcon(file.mimeType)}
                <span className="file-name">{file.name}</span>
                {file.mimeType !== FOLDER_MIME && <Check size={13} color="#4A82C6" className="check-icon" />}
                {file.mimeType === FOLDER_MIME && <ChevronRight size={13} color="#C0C0C0" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
              </button>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 2000; padding: 24px;
        }
        .picker {
          background: white; border-radius: 16px; width: 100%; max-width: 480px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25); max-height: 80vh;
          display: flex; flex-direction: column; overflow: hidden;
        }
        .picker-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid #F0F0F0; flex-shrink: 0;
        }
        .header-title { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 700; color: #0a0a0a; }
        .close-btn { width: 26px; height: 26px; border: none; background: #F0F0F0; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #5C5C5C; }
        .close-btn:hover { background: #E8E8E8; }

        .search-bar {
          display: flex; align-items: center; gap: 8px; padding: 10px 16px;
          border-bottom: 1px solid #F5F5F5; flex-shrink: 0;
        }
        .search-bar input { flex: 1; border: none; outline: none; font-size: 13.5px; color: #0a0a0a; font-family: inherit; }
        .search-bar input::placeholder { color: #C0C0C0; }

        .breadcrumb { display: flex; align-items: center; gap: 2px; padding: 8px 16px; flex-shrink: 0; flex-wrap: wrap; border-bottom: 1px solid #F5F5F5; }
        .crumb-wrap { display: flex; align-items: center; gap: 2px; }
        .crumb { display: flex; align-items: center; gap: 4px; border: none; background: none; font-size: 12px; color: #9A9A9A; cursor: pointer; padding: 3px 6px; border-radius: 5px; font-family: inherit; font-weight: 500; }
        .crumb:hover { background: #F0F0F0; color: #1B2B4B; }
        .crumb.active { color: #0a0a0a; font-weight: 600; cursor: default; }
        .crumb.active:hover { background: none; }

        .file-list { flex: 1; overflow-y: auto; padding: 6px 8px; }
        .state-center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 48px 24px; color: #9A9A9A; font-size: 13px; }
        .state-center.error { color: #DC2626; }

        .file-row {
          display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 12px;
          border: none; background: none; border-radius: 8px; cursor: pointer;
          text-align: left; font-family: inherit; transition: background 0.1s;
        }
        .file-row:hover { background: #F5F8FF; }
        .file-row.is-folder:hover { background: #EFF6FF; }
        .file-name { flex: 1; font-size: 13.5px; color: #0a0a0a; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .check-icon { flex-shrink: 0; opacity: 0; margin-left: auto; }
        .file-row:hover .check-icon { opacity: 1; }

        :global(.spin) { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
