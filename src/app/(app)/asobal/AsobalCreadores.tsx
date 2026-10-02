'use client'

/*
  Supabase table required:
  create table asobal_creadores (
    id uuid default gen_random_uuid() primary key,
    nom text not null default '',
    pais text default '',
    plataforma text default '',
    followers integer,
    especialitzacio text default '',
    contacte text default '',
    instagram text default '',
    tiktok text default '',
    youtube text default '',
    x_twitter text default '',
    tipus text default 'CREADOR',
    estat text default 'POTENCIAL',
    notes text default '',
    created_at timestamptz default now()
  );
*/

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, Plus, Pencil, Trash2, ExternalLink, Copy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAVY = '#0006FF'

interface Creator {
  id: string
  nom: string
  pais: string
  plataforma: string
  followers: number | null
  especialitzacio: string
  contacte: string
  instagram: string
  tiktok: string
  youtube: string
  x_twitter: string
  tipus: string
  estat: string
  notes: string
}
type Form = Omit<Creator, 'id'>

const TIPUS_CFG: Record<string, { color: string; bg: string }> = {
  CREADOR:    { color: '#CC0000',  bg: 'rgba(204,0,0,0.1)' },
  MITJÀ:      { color: '#0006FF', bg: 'rgba(0,6,255,0.1)' },
  PERIODISTA: { color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  INFLUENCER: { color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  CLUB:       { color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  PARTNER:    { color: '#0369A1', bg: 'rgba(3,105,161,0.1)' },
}
const ALL_TIPUS = Object.keys(TIPUS_CFG)

const ESTAT_CFG: Record<string, { color: string; dot: string }> = {
  ACTIU:     { color: '#16a34a', dot: '#22c55e' },
  INACTIU:   { color: '#6B7280', dot: '#9CA3AF' },
  POTENCIAL: { color: '#D97706', dot: '#F59E0B' },
}

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X / Twitter', 'Podcast', 'Web', 'Altres']

const EMPTY: Form = {
  nom: '', pais: '', plataforma: 'Instagram', followers: null,
  especialitzacio: '', contacte: '', instagram: '', tiktok: '',
  youtube: '', x_twitter: '', tipus: 'CREADOR', estat: 'POTENCIAL', notes: '',
}

const SEEDS: Form[] = [
  { nom: 'Pablo Simonet', pais: 'ES', plataforma: 'Instagram', followers: null, especialitzacio: 'Jugador ASOBAL · P.Genil', contacte: '', instagram: 'pablosimonet', tiktok: '', youtube: '', x_twitter: '', tipus: 'CREADOR', estat: 'ACTIU', notes: '' },
  { nom: 'Lucas Moscariello', pais: 'ARG', plataforma: 'Instagram', followers: null, especialitzacio: 'Jugador ASOBAL · Cuenca', contacte: '', instagram: 'lucasmoscariello', tiktok: '', youtube: '', x_twitter: '', tipus: 'CREADOR', estat: 'ACTIU', notes: '' },
  { nom: 'Pereyra', pais: 'ARG', plataforma: 'TikTok', followers: null, especialitzacio: 'Balonmano', contacte: '', instagram: '', tiktok: '', youtube: '', x_twitter: '', tipus: 'CREADOR', estat: 'POTENCIAL', notes: '' },
  { nom: 'Handball News', pais: 'INT', plataforma: 'YouTube', followers: null, especialitzacio: 'Notícies handbol internacional', contacte: '', instagram: '', tiktok: '', youtube: '', x_twitter: '', tipus: 'MITJÀ', estat: 'POTENCIAL', notes: '' },
  { nom: 'Egypt Handball', pais: 'EG', plataforma: 'YouTube', followers: null, especialitzacio: 'Handbol Egipte', contacte: '', instagram: '', tiktok: '', youtube: '', x_twitter: '', tipus: 'MITJÀ', estat: 'POTENCIAL', notes: '' },
  { nom: 'Balonmaactual', pais: 'ES', plataforma: 'Instagram', followers: null, especialitzacio: 'Notícies balonmano espanyol', contacte: '', instagram: 'balonmaactual', tiktok: '', youtube: '', x_twitter: 'balonmaactual', tipus: 'MITJÀ', estat: 'POTENCIAL', notes: '' },
  { nom: 'Handnews', pais: 'ES', plataforma: 'Instagram', followers: null, especialitzacio: 'Notícies handbol', contacte: '', instagram: 'handnews', tiktok: '', youtube: '', x_twitter: '', tipus: 'MITJÀ', estat: 'POTENCIAL', notes: '' },
]

function SocialIcon({ type }: { type: 'ig' | 'tt' | 'yt' | 'x' }) {
  const icons = {
    ig: { label: 'IG',  color: '#E1306C', bg: 'rgba(225,48,108,0.1)' },
    tt: { label: 'TT',  color: '#000',    bg: 'rgba(0,0,0,0.08)' },
    yt: { label: 'YT',  color: '#FF0000', bg: 'rgba(255,0,0,0.1)' },
    x:  { label: '𝕏',   color: '#000',    bg: 'rgba(0,0,0,0.08)' },
  }
  const c = icons[type]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, background: c.bg, color: c.color, fontSize: 9, fontWeight: 900, flexShrink: 0 }}>{c.label}</span>
  )
}

function CopyContactBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#16a34a' : '#9CA3AF', padding: 2, display: 'flex', borderRadius: 4 }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  )
}

function formatFollowers(n: number | null): string {
  if (!n) return ''
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`
  return String(n)
}

function CreatorCard({ c, onEdit }: { c: Creator; onEdit: () => void }) {
  const tipusCfg = TIPUS_CFG[c.tipus] ?? TIPUS_CFG.CREADOR
  const estatCfg = ESTAT_CFG[c.estat] ?? ESTAT_CFG.POTENCIAL
  const hasSocial = c.instagram || c.tiktok || c.youtube || c.x_twitter

  return (
    <div
      style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}
    >
      {/* Top accent bar */}
      <div style={{ height: 3, background: tipusCfg.color }} />

      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: tipusCfg.color, background: tipusCfg.bg, borderRadius: 4, padding: '2px 6px', letterSpacing: '.07em', textTransform: 'uppercase' }}>{c.tipus}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: estatCfg.color }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: estatCfg.dot, display: 'inline-block' }} />
                {c.estat}
              </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>{c.nom}</div>
          </div>
          <button
            onClick={onEdit}
            style={{ background: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 7, cursor: 'pointer', color: '#6B7280', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, flexShrink: 0 }}
          >
            <Pencil size={10} /> Editar
          </button>
        </div>

        {/* Country + Platform + Followers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {c.pais && <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>{c.pais}</span>}
          {c.pais && c.plataforma && <span style={{ color: '#D1D5DB', fontSize: 10 }}>·</span>}
          {c.plataforma && <span style={{ fontSize: 10, color: NAVY, fontWeight: 700 }}>{c.plataforma}</span>}
          {c.followers && <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, background: '#F3F4F6', borderRadius: 4, padding: '1px 5px' }}>{formatFollowers(c.followers)}</span>}
        </div>

        {/* Specialization */}
        {c.especialitzacio && (
          <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.especialitzacio}</div>
        )}

        {/* Social icons */}
        {hasSocial && (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
            {c.instagram && (
              <a href={`https://instagram.com/${c.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" title={`@${c.instagram}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#6B7280' }}>
                <SocialIcon type="ig" /><span style={{ fontSize: 9, color: '#9CA3AF' }}>@{c.instagram.replace('@', '')}</span>
              </a>
            )}
            {c.tiktok && (
              <a href={`https://tiktok.com/@${c.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" title={`@${c.tiktok}`} style={{ textDecoration: 'none' }}>
                <SocialIcon type="tt" />
              </a>
            )}
            {c.youtube && (
              <a href={`https://youtube.com/${c.youtube}`} target="_blank" rel="noopener noreferrer" title={c.youtube} style={{ textDecoration: 'none' }}>
                <SocialIcon type="yt" />
              </a>
            )}
            {c.x_twitter && (
              <a href={`https://x.com/${c.x_twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" title={`@${c.x_twitter}`} style={{ textDecoration: 'none' }}>
                <SocialIcon type="x" />
              </a>
            )}
          </div>
        )}

        {/* Contact */}
        {c.contacte && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6B7280', background: '#F9FAFB', borderRadius: 6, padding: '4px 8px' }}>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.contacte}</span>
            <CopyContactBtn text={c.contacte} />
          </div>
        )}
      </div>
    </div>
  )
}

function ModalForm({ initial, onSave, onDelete, onClose, isNew }: {
  initial: Form; isNew: boolean
  onSave: (f: Form) => Promise<void>
  onDelete: () => Promise<void>
  onClose: () => void
}) {
  const [f, setF] = useState<Form>(initial)
  const [saving, setSaving] = useState(false)
  const set = (k: keyof Form, v: Form[keyof Form]) => setF(prev => ({ ...prev, [k]: v }))

  const save = async () => {
    if (!f.nom.trim()) return
    setSaving(true)
    await onSave(f)
    setSaving(false)
  }

  const tipusCfg = TIPUS_CFG[f.tipus] ?? TIPUS_CFG.CREADOR

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 32px 80px rgba(0,0,0,0.22)', width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: tipusCfg.color, background: tipusCfg.bg, borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '.07em' }}>{f.tipus}</span>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 800, color: '#111827' }}>{f.nom || (isNew ? 'Nou creador' : 'Editar creador')}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, display: 'flex', borderRadius: 6 }}><X size={18} /></button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Informació bàsica */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>Informació bàsica</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8, marginBottom: 8 }}>
              <input value={f.nom} onChange={e => set('nom', e.target.value)} placeholder="Nom *" style={inputStyle} />
              <input value={f.pais} onChange={e => set('pais', e.target.value)} placeholder="País" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8 }}>
              <select value={f.plataforma} onChange={e => set('plataforma', e.target.value)} style={inputStyle}>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input
                value={f.followers ?? ''}
                onChange={e => set('followers', e.target.value ? parseInt(e.target.value) || null : null)}
                placeholder="Followers"
                type="number"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Tipus */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Tipus</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ALL_TIPUS.map(t => {
                const cfg = TIPUS_CFG[t]
                const sel = f.tipus === t
                return (
                  <button key={t} onClick={() => set('tipus', t)}
                    style={{ padding: '5px 10px', borderRadius: 7, border: `1.5px solid ${sel ? cfg.color : '#e5e7eb'}`, background: sel ? cfg.bg : '#fff', color: sel ? cfg.color : '#6B7280', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Estat */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Estat</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {Object.entries(ESTAT_CFG).map(([k, v]) => {
                const sel = f.estat === k
                return (
                  <button key={k} onClick={() => set('estat', k)}
                    style={{ flex: 1, padding: '6px 4px', borderRadius: 8, border: `1.5px solid ${sel ? v.dot : '#e5e7eb'}`, background: sel ? `${v.dot}18` : '#fff', color: v.color, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.dot, display: 'inline-block' }} />
                    {k}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Xarxes socials */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Xarxes socials</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { key: 'instagram' as const, label: 'Instagram', prefix: '@', color: '#E1306C' },
                { key: 'tiktok'   as const, label: 'TikTok',    prefix: '@', color: '#000' },
                { key: 'youtube'  as const, label: 'YouTube',   prefix: '',  color: '#FF0000' },
                { key: 'x_twitter' as const, label: 'X / Twitter', prefix: '@', color: '#000' },
              ].map(({ key, label, prefix, color }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color, width: 80, flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 7, overflow: 'hidden', background: '#fff' }}>
                    {prefix && <span style={{ padding: '5px 8px', fontSize: 11, color: '#9CA3AF', background: '#F9FAFB', borderRight: '1px solid rgba(0,0,0,0.08)' }}>{prefix}</span>}
                    <input
                      value={(f[key] as string) ?? ''}
                      onChange={e => set(key, e.target.value)}
                      placeholder={label}
                      style={{ flex: 1, border: 'none', outline: 'none', padding: '5px 9px', fontSize: 12, fontFamily: 'inherit', background: 'transparent' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Especialització + Contacte + Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={f.especialitzacio} onChange={e => set('especialitzacio', e.target.value)} placeholder="Especialització (ex: Jugador ASOBAL · Balonmano)" style={inputStyle} />
            <input value={f.contacte} onChange={e => set('contacte', e.target.value)} placeholder="Contacte (email / telèfon / DM)" style={inputStyle} />
            <textarea value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes internes…" rows={2}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 } as React.CSSProperties} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8, justifyContent: 'space-between', flexShrink: 0 }}>
          {!isNew && (
            <button onClick={async () => { await onDelete(); onClose() }}
              style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid #fca5a5', background: '#fff', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Trash2 size={12} style={{ display: 'inline', marginRight: 4 }} />Eliminar
            </button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel·lar</button>
            <button onClick={save} disabled={saving || !f.nom.trim()}
              style={{ padding: '8px 22px', borderRadius: 9, border: 'none', background: saving || !f.nom.trim() ? '#9CA3AF' : NAVY, color: '#fff', fontSize: 12, fontWeight: 700, cursor: saving || !f.nom.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Guardant…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 7,
  fontSize: 12, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box',
  color: '#111827',
}

const SQL_SETUP = `create table asobal_creadores (
  id uuid default gen_random_uuid() primary key,
  nom text not null default '',
  pais text default '',
  plataforma text default '',
  followers integer,
  especialitzacio text default '',
  contacte text default '',
  instagram text default '',
  tiktok text default '',
  youtube text default '',
  x_twitter text default '',
  tipus text default 'CREADOR',
  estat text default 'POTENCIAL',
  notes text default '',
  created_at timestamptz default now()
);`

export function AsobalCreadores() {
  const supabase = useRef(createClient()).current
  const [creators, setCreators] = useState<Creator[]>([])
  const [tableError, setTableError] = useState(false)
  const [q, setQ] = useState('')
  const [filterTipus, setFilterTipus] = useState('ALL')
  const [filterEstat, setFilterEstat] = useState('ALL')
  const [modal, setModal] = useState<{ isNew: boolean; form: Form; id?: string } | null>(null)
  const [sqlCopied, setSqlCopied] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('asobal_creadores').select('*').order('created_at')
    if (error) {
      setTableError(true)
      return
    }
    setCreators((data ?? []) as Creator[])
  }, [supabase])

  useEffect(() => {
    load()
    const ch = supabase.channel('asobal_creadores_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asobal_creadores' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [supabase, load])

  const handleSave = useCallback(async (form: Form) => {
    setSaveError(null)
    let error
    if (modal?.id) {
      ;({ error } = await supabase.from('asobal_creadores').update(form).eq('id', modal.id))
    } else {
      ;({ error } = await supabase.from('asobal_creadores').insert(form))
    }
    if (error) {
      setSaveError(error.message ?? 'Error desconegut')
      return
    }
    await load()
    setModal(null)
  }, [modal, supabase, load])

  const handleDelete = useCallback(async () => {
    if (!modal?.id) return
    await supabase.from('asobal_creadores').delete().eq('id', modal.id)
    await load()
    setModal(null)
  }, [modal, supabase, load])

  const handleSeedImport = useCallback(async () => {
    await supabase.from('asobal_creadores').insert(SEEDS)
    await load()
  }, [supabase, load])

  const filtered = creators.filter(c => {
    if (filterTipus !== 'ALL' && c.tipus !== filterTipus) return false
    if (filterEstat !== 'ALL' && c.estat !== filterEstat) return false
    if (q.trim()) {
      const query = q.toLowerCase()
      return c.nom.toLowerCase().includes(query) ||
        c.especialitzacio.toLowerCase().includes(query) ||
        c.pais.toLowerCase().includes(query) ||
        c.plataforma.toLowerCase().includes(query)
    }
    return true
  })

  if (tableError) {
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: 20, background: '#F8F9FB' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: '#fff', border: '1.5px solid #fca5a5', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#ef4444', marginBottom: 8 }}>Taula no trobada a Supabase</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>Executa aquest SQL al Dashboard de Supabase → SQL Editor:</div>
          <pre style={{ background: '#1E293B', color: '#e2e8f0', borderRadius: 10, padding: '14px 16px', fontSize: 11, overflow: 'auto', lineHeight: 1.6, fontFamily: 'monospace' }}>{SQL_SETUP}</pre>
          <button
            onClick={() => { navigator.clipboard.writeText(SQL_SETUP); setSqlCopied(true); setTimeout(() => setSqlCopied(false), 2000) }}
            style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, border: 'none', background: sqlCopied ? '#16a34a' : NAVY, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {sqlCopied ? <><Check size={12} /> Copiat!</> : <><Copy size={12} /> Copiar SQL</>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden', background: '#F8F9FB' }}>

      {/* Top bar */}
      <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {/* Search */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca creador, especialitat, país…"
              style={{ width: '100%', padding: '7px 9px 7px 28px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
            {q && <button onClick={() => setQ('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}><X size={12} /></button>}
          </div>
          {/* Count */}
          <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{filtered.length} creadors</span>
          {/* Add button */}
          <button
            onClick={() => setModal({ isNew: true, form: EMPTY })}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: NAVY, border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
          >
            <Plus size={13} /> Nou creador
          </button>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Tipus filters */}
          {(['ALL', ...ALL_TIPUS] as string[]).map(t => {
            const cfg = t !== 'ALL' ? TIPUS_CFG[t] : null
            const sel = filterTipus === t
            return (
              <button key={t} onClick={() => setFilterTipus(t)}
                style={{ padding: '3px 9px', borderRadius: 20, border: `1px solid ${sel && cfg ? cfg.color : sel ? NAVY : '#e5e7eb'}`, background: sel ? (cfg ? cfg.bg : 'rgba(11,31,74,0.07)') : '#fff', color: sel ? (cfg ? cfg.color : NAVY) : '#6B7280', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '.05em', transition: 'all .12s' }}>
                {t === 'ALL' ? 'Tots' : t}
              </button>
            )
          })}
          <span style={{ color: '#e5e7eb', fontSize: 14, margin: '0 2px' }}>|</span>
          {/* Estat filters */}
          {(['ALL', ...Object.keys(ESTAT_CFG)] as string[]).map(s => {
            const cfg = s !== 'ALL' ? ESTAT_CFG[s] : null
            const sel = filterEstat === s
            return (
              <button key={s} onClick={() => setFilterEstat(s)}
                style={{ padding: '3px 9px', borderRadius: 20, border: `1px solid ${sel && cfg ? cfg.dot : sel ? '#9CA3AF' : '#e5e7eb'}`, background: sel ? (cfg ? `${cfg.dot}18` : '#F9FAFB') : '#fff', color: sel ? (cfg ? cfg.color : '#6B7280') : '#6B7280', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.04em', transition: 'all .12s' }}>
                {s === 'ALL' ? 'Tots els estats' : s}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {filtered.length === 0 && creators.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 12 }}>Encara no hi ha creadors. Importa els inicials o afegeix-ne de nous.</div>
            <button onClick={handleSeedImport}
              style={{ padding: '9px 18px', background: NAVY, border: 'none', borderRadius: 9, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Importar creadors inicials
            </button>
          </div>
        )}
        {saveError && (
          <div style={{ marginBottom: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 12, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>Error en guardar:</span> {saveError}
            <button onClick={() => setSaveError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 0, display: 'flex' }}><X size={12} /></button>
          </div>
        )}
        {filtered.length === 0 && creators.length > 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
            Cap resultat per als filtres actuals
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {filtered.map(c => (
            <CreatorCard key={c.id} c={c} onEdit={() => setModal({ isNew: false, form: { nom: c.nom, pais: c.pais, plataforma: c.plataforma, followers: c.followers, especialitzacio: c.especialitzacio, contacte: c.contacte, instagram: c.instagram, tiktok: c.tiktok, youtube: c.youtube, x_twitter: c.x_twitter, tipus: c.tipus, estat: c.estat, notes: c.notes }, id: c.id })} />
          ))}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <ModalForm
          key={modal.id ?? 'new'}
          initial={modal.form}
          isNew={modal.isNew}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
