'use client'

import { useEffect, useState, useCallback } from 'react'

interface Voice {
  voice_id: string
  name: string
  category: string
  labels: Record<string, string>
  preview_url: string
  description: string
}

interface Props {
  onClose: () => void
}

export default function VoiceSelector({ onClose }: Props) {
  const [voices, setVoices] = useState<Voice[]>([])
  const [loading, setLoading] = useState(true)
  const [activeVoiceId, setActiveVoiceId] = useState('')
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState('')
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null)
  const [filter, setFilter] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/jarvis/voices').then(r => r.json()),
      fetch('/api/jarvis/voice-config').then(r => r.json()),
    ]).then(([vdata, cfg]) => {
      setVoices(vdata.voices ?? [])
      setActiveVoiceId(cfg.voice_id ?? '')
      setLoading(false)
    })
  }, [])

  const previewVoice = useCallback(async (voice: Voice) => {
    if (previewing === voice.voice_id) {
      previewAudio?.pause()
      setPreviewing('')
      setPreviewAudio(null)
      return
    }
    previewAudio?.pause()

    // Use ElevenLabs preview_url if available
    if (voice.preview_url) {
      setPreviewing(voice.voice_id)
      const audio = new Audio(voice.preview_url)
      setPreviewAudio(audio)
      audio.onended = () => { setPreviewing(''); setPreviewAudio(null) }
      audio.play().catch(() => { setPreviewing(''); setPreviewAudio(null) })
      return
    }

    // Fallback: generate a preview via our TTS route
    setPreviewing(voice.voice_id)
    const res = await fetch('/api/jarvis/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hola, sóc BEKA. Estic aquí per ajudar-te.', voice_id: voice.voice_id }),
    })
    if (!res.ok) { setPreviewing(''); return }
    const blob = new Blob([await res.arrayBuffer()], { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    setPreviewAudio(audio)
    audio.onended = () => { URL.revokeObjectURL(url); setPreviewing(''); setPreviewAudio(null) }
    audio.play().catch(() => { URL.revokeObjectURL(url); setPreviewing('') })
  }, [previewing, previewAudio])

  const saveVoice = useCallback(async (voiceId: string) => {
    setSaving(true)
    const res = await fetch('/api/jarvis/voice-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voice_id: voiceId }),
    })
    if (res.ok) {
      setActiveVoiceId(voiceId)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }, [])

  const filtered = voices.filter(v =>
    !filter || v.name.toLowerCase().includes(filter.toLowerCase()) ||
    (v.labels.accent ?? '').toLowerCase().includes(filter.toLowerCase()) ||
    (v.labels.gender ?? '').toLowerCase().includes(filter.toLowerCase()) ||
    v.category.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        width: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        background: 'rgba(8,16,32,0.97)',
        border: '1px solid rgba(0,174,239,0.2)',
        borderRadius: 16,
        boxShadow: '0 0 60px rgba(0,174,239,0.08)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#00aeef', letterSpacing: '0.08em' }}>
              VEU DE BEKA
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3, letterSpacing: '0.1em' }}>
              ELEVEN LABS · {voices.length} VEUS DISPONIBLES
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer', fontSize: 18, padding: '4px 8px',
          }}>✕</button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Cerca per nom, accent, gènere…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: '8px 12px',
              color: 'rgba(255,255,255,0.7)', fontSize: 12,
              outline: 'none',
            }}
          />
        </div>

        {/* Voice list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              Carregant veus…
            </div>
          )}
          {!loading && filtered.map(v => {
            const isActive = v.voice_id === activeVoiceId
            const isPreviewing = previewing === v.voice_id
            return (
              <div key={v.voice_id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 24px',
                background: isActive ? 'rgba(0,174,239,0.06)' : 'transparent',
                borderLeft: isActive ? '2px solid #00aeef' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = isActive ? 'rgba(0,174,239,0.09)' : 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = isActive ? 'rgba(0,174,239,0.06)' : 'transparent')}
              >
                {/* Play button */}
                <button
                  onClick={() => previewVoice(v)}
                  title="Previsualitzar veu"
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: `1px solid ${isPreviewing ? '#00aeef' : 'rgba(255,255,255,0.12)'}`,
                    background: isPreviewing ? 'rgba(0,174,239,0.15)' : 'rgba(255,255,255,0.04)',
                    color: isPreviewing ? '#00aeef' : 'rgba(255,255,255,0.4)',
                    fontSize: 10, cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {isPreviewing ? '■' : '▶'}
                </button>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => saveVoice(v.voice_id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: isActive ? '#00aeef' : 'rgba(255,255,255,0.7)' }}>
                      {v.name}
                    </span>
                    {isActive && (
                      <span style={{
                        fontSize: 8, padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(0,174,239,0.15)', color: '#00aeef',
                        letterSpacing: '0.1em',
                      }}>ACTIVA</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, display: 'flex', gap: 8 }}>
                    <span>{v.category}</span>
                    {v.labels.gender && <span>· {v.labels.gender}</span>}
                    {v.labels.accent && <span>· {v.labels.accent}</span>}
                    {v.labels.age && <span>· {v.labels.age}</span>}
                  </div>
                </div>

                {/* Select button */}
                {!isActive && (
                  <button
                    onClick={() => saveVoice(v.voice_id)}
                    style={{
                      fontSize: 9, padding: '4px 10px', borderRadius: 5,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: 'rgba(255,255,255,0.3)',
                      cursor: 'pointer', letterSpacing: '0.08em', whiteSpace: 'nowrap',
                    }}
                  >
                    SELECCIONAR
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}>
            Clica una veu per seleccionar · ▶ per previsualitzar
          </div>
          {saved && (
            <div style={{ fontSize: 10, color: '#00aeef', letterSpacing: '0.08em' }}>
              ✓ DESAT
            </div>
          )}
          {saving && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
              Desant…
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
