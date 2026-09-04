'use client'

import { useState } from 'react'
import { X, Sparkles, Download, Loader2, Building2, Briefcase, Euro, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Client {
  id: string
  name: string
}

interface Props {
  clients: Client[]
  onClose: () => void
  onCreated?: (contract: any) => void
}

interface FormData {
  client_id: string
  // Dades fiscals
  rao_social: string
  nif: string
  adreca: string
  codi_postal: string
  poble: string
  provincia: string
  pais: string
  representant: string
  dni_representant: string
  carrec_representant: string
  // Serveis
  serveis: string
  activitat_guinew: string
  // Pressupost
  import_mensual: string
  import_total: string
  indemnitzacio: string
  // Duració
  duracio: string
  dies_avis: string
  resolucio_anticipada: string
}

const empty: FormData = {
  client_id: '',
  rao_social: '', nif: '', adreca: '', codi_postal: '', poble: '', provincia: '', pais: 'España',
  representant: '', dni_representant: '', carrec_representant: 'Administrador/a Único/a',
  serveis: '', activitat_guinew: 'marketing digital, gestión de redes sociales, diseño gráfico y consultoría de comunicación',
  import_mensual: '', import_total: '', indemnitzacio: '3.000',
  duracio: '12 meses', dies_avis: '7', resolucio_anticipada: 'el Cliente deberá abonar el importe correspondiente al mes en curso',
}

type Section = 'fiscal' | 'serveis' | 'pressupost' | 'duracio'

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'fiscal',     label: 'Dades fiscals',  icon: <Building2 size={14} /> },
  { id: 'serveis',    label: 'Serveis',         icon: <Briefcase size={14} /> },
  { id: 'pressupost', label: 'Pressupost',      icon: <Euro size={14} /> },
  { id: 'duracio',    label: 'Duració',         icon: <Calendar size={14} /> },
]

function numberToWordsES(n: number): string {
  const units = ['','UN','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE',
    'DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS','DIECISIETE','DIECIOCHO','DIECINUEVE']
  const tens = ['','DIEZ','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA']
  const hundreds = ['','CIEN','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS','SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS']
  if (n === 0) return 'CERO'
  if (n < 20) return units[n]
  if (n < 100) return n % 10 === 0 ? tens[Math.floor(n/10)] : tens[Math.floor(n/10)] + ' Y ' + units[n%10]
  if (n < 1000) return n % 100 === 0 ? hundreds[Math.floor(n/100)] : hundreds[Math.floor(n/100)] + ' ' + numberToWordsES(n%100)
  if (n < 1000000) {
    const m = Math.floor(n/1000); const r = n % 1000
    return (m === 1 ? 'MIL' : numberToWordsES(m) + ' MIL') + (r > 0 ? ' ' + numberToWordsES(r) : '')
  }
  return n.toString()
}

function formatEurosText(amount: string): { text: string; num: string } {
  const n = parseFloat(amount.replace(',', '.'))
  if (isNaN(n)) return { text: '', num: '' }
  const words = numberToWordsES(Math.round(n))
  return {
    text: `${words} EUROS (${n.toLocaleString('es-ES')} €)`,
    num: `${n.toLocaleString('es-ES')} €`,
  }
}

export function GenerateContractModal({ clients, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormData>(empty)
  const [active, setActive] = useState<Section>('fiscal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  // Quan es selecciona un client, omplim la raó social automàticament
  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    const client = clients.find(c => c.id === id)
    setForm(f => ({ ...f, client_id: id, rao_social: client ? client.name : f.rao_social }))
  }

  const handleGenerate = async () => {
    if (!form.rao_social.trim()) { setActive('fiscal'); setError('La raó social és obligatòria.'); return }
    setLoading(true)
    setError('')

    const mensual = formatEurosText(form.import_mensual)
    const total = formatEurosText(
      form.import_total ||
      (parseFloat(form.import_mensual.replace(',', '.')) * parseInt(form.duracio) || 0).toString()
    )

    const prompt = `
Client: ${form.rao_social}
CIF/NIF: ${form.nif}
Adreça: ${form.adreca}, ${form.codi_postal} ${form.poble}, ${form.provincia}, ${form.pais}
Representant: ${form.representant}, DNI ${form.dni_representant}, ${form.carrec_representant}

Serveis: ${form.serveis}
Activitat Guinew: ${form.activitat_guinew}

Import mensual: ${mensual.text || form.import_mensual + ' €'}
Import total: ${total.text || form.import_total + ' €'}
Indemnització per incompliment confidencialitat: ${form.indemnitzacio} €

Durada: ${form.duracio}
Dies d'avís per canvis: ${form.dies_avis} dies
Resolució anticipada: ${form.resolucio_anticipada}
    `.trim()

    try {
      const res = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error generant el contracte')
      }

      // Descarreguem el DOCX
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = disposition.match(/filename="([^"]+)"/)
      a.download = match?.[1] || 'Contracte.docx'
      a.href = blobUrl
      a.click()
      URL.revokeObjectURL(blobUrl)

      // Guardem el registre a Supabase vinculat al client
      const sb = createClient()
      const monthlyVal = parseFloat(form.import_mensual.replace(',', '.')) || null
      const { data: saved } = await sb
        .from('contracts')
        .insert({
          title: `Contracte ${form.rao_social}`,
          client_id: form.client_id || null,
          type: 'retainer',
          status: 'draft',
          value: monthlyVal,
          notes: `Serveis: ${form.serveis}\nDurada: ${form.duracio}`,
        })
        .select('*, client:clients(id,name)')
        .single()

      onCreated?.(saved)
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const sectionIdx = SECTIONS.findIndex(s => s.id === active)

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <div className="header-left">
            <Sparkles size={15} color="#4A82C6" />
            <h2>Generar contracte amb IA</h2>
          </div>
          <button className="close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Client selector — sempre visible */}
        <div className="client-bar">
          <label>Client</label>
          <select value={form.client_id} onChange={handleClientChange} className="client-select">
            <option value="">— Selecciona un client —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Section tabs */}
        <div className="tabs">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`tab${active === s.id ? ' active' : ''}`}
              onClick={() => setActive(s.id)}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {/* Form sections */}
        <div className="modal-body">

          {active === 'fiscal' && (
            <div className="section">
              <div className="row2">
                <Field label="Raó social *" value={form.rao_social} onChange={set('rao_social')} placeholder="Empresa ABC SL" />
                <Field label="NIF / CIF" value={form.nif} onChange={set('nif')} placeholder="B12345678" />
              </div>
              <Field label="Adreça" value={form.adreca} onChange={set('adreca')} placeholder="Carrer Major, 10" />
              <div className="row3">
                <Field label="Codi postal" value={form.codi_postal} onChange={set('codi_postal')} placeholder="08001" />
                <Field label="Poble / Ciutat" value={form.poble} onChange={set('poble')} placeholder="Barcelona" />
                <Field label="Província" value={form.provincia} onChange={set('provincia')} placeholder="Barcelona" />
              </div>
              <div className="row2">
                <Field label="País" value={form.pais} onChange={set('pais')} placeholder="España" />
                <span />
              </div>
              <div className="separator"><span>Representant legal</span></div>
              <div className="row2">
                <Field label="Nom complet" value={form.representant} onChange={set('representant')} placeholder="Joan García López" />
                <Field label="DNI" value={form.dni_representant} onChange={set('dni_representant')} placeholder="12345678A" />
              </div>
              <Field label="Càrrec" value={form.carrec_representant} onChange={set('carrec_representant')} placeholder="Administrador/a Único/a" />
            </div>
          )}

          {active === 'serveis' && (
            <div className="section">
              <TextareaField
                label="Serveis contractats"
                value={form.serveis}
                onChange={set('serveis')}
                placeholder={"- Gestió de xarxes socials (Instagram, LinkedIn, Facebook)\n- Creació de contingut mensual\n- Disseny gràfic\n- Informe mensual de resultats"}
                rows={8}
              />
              <Field
                label="Activitat que presta Guinew (per al contracte)"
                value={form.activitat_guinew}
                onChange={set('activitat_guinew')}
                placeholder="marketing digital, gestión de redes sociales..."
              />
            </div>
          )}

          {active === 'pressupost' && (
            <div className="section">
              <div className="row2">
                <Field
                  label="Import mensual (€)"
                  value={form.import_mensual}
                  onChange={set('import_mensual')}
                  placeholder="800"
                  type="number"
                  hint={form.import_mensual ? formatEurosText(form.import_mensual).text : ''}
                />
                <Field
                  label="Import total (€) — opcional"
                  value={form.import_total}
                  onChange={set('import_total')}
                  placeholder="9.600"
                  type="number"
                  hint={form.import_total ? formatEurosText(form.import_total).text : ''}
                />
              </div>
              <Field
                label="Indemnització per incompliment confidencialitat (€)"
                value={form.indemnitzacio}
                onChange={set('indemnitzacio')}
                placeholder="3.000"
                type="number"
              />
            </div>
          )}

          {active === 'duracio' && (
            <div className="section">
              <div className="row2">
                <Field label="Durada del contracte" value={form.duracio} onChange={set('duracio')} placeholder="12 mesos" />
                <Field label="Dies d'avís per canvis" value={form.dies_avis} onChange={set('dies_avis')} placeholder="7" type="number" />
              </div>
              <Field
                label="Condicions resolució anticipada"
                value={form.resolucio_anticipada}
                onChange={set('resolucio_anticipada')}
                placeholder="el Client haurà d'abonar l'import corresponent al mes en curs"
              />
            </div>
          )}

          {error && <div className="error-msg">{error}</div>}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="nav-btns">
            {sectionIdx > 0 && (
              <button className="btn-nav" onClick={() => setActive(SECTIONS[sectionIdx - 1].id)}>
                ← Anterior
              </button>
            )}
            {sectionIdx < SECTIONS.length - 1 && (
              <button className="btn-nav primary-nav" onClick={() => setActive(SECTIONS[sectionIdx + 1].id)}>
                Següent →
              </button>
            )}
          </div>
          <button
            className="btn-generate"
            onClick={handleGenerate}
            disabled={loading || !form.rao_social.trim()}
          >
            {loading ? (
              <><Loader2 size={14} className="spin" />Generant...</>
            ) : (
              <><Download size={14} />Generar contracte</>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 24px;
        }
        .modal {
          background: white; border-radius: 18px; width: 100%; max-width: 600px;
          box-shadow: 0 24px 72px rgba(0,0,0,0.22); max-height: 92vh;
          display: flex; flex-direction: column; overflow: hidden;
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 24px 14px; border-bottom: 1px solid #F0F0F0; flex-shrink: 0;
        }
        .header-left { display: flex; align-items: center; gap: 8px; }
        .modal-header h2 { font-size: 15.5px; font-weight: 700; color: #0a0a0a; }
        .close-btn {
          width: 28px; height: 28px; border: none; background: #F0F0F0;
          border-radius: 6px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #5C5C5C;
        }
        .close-btn:hover { background: #E8E8E8; }

        .client-bar {
          display: flex; align-items: center; gap: 12px; padding: 10px 24px;
          background: #F8F9FC; border-bottom: 1px solid #F0F0F0; flex-shrink: 0;
        }
        .client-bar label {
          font-size: 11px; font-weight: 700; color: #5C5C5C;
          text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;
        }
        .client-select {
          flex: 1; height: 34px; padding: 0 10px; border: 1.5px solid #E0E8F0;
          border-radius: 8px; font-size: 13.5px; color: #0a0a0a; background: white;
          outline: none; font-family: inherit; cursor: pointer;
        }
        .client-select:focus { border-color: #4A82C6; }

        .tabs {
          display: flex; border-bottom: 1px solid #F0F0F0; flex-shrink: 0;
          overflow-x: auto; padding: 0 8px;
        }
        .tab {
          display: flex; align-items: center; gap: 6px; padding: 11px 14px;
          font-size: 13px; font-weight: 500; color: #9A9A9A; border: none;
          background: none; cursor: pointer; border-bottom: 2px solid transparent;
          white-space: nowrap; font-family: inherit; transition: color 0.15s;
          margin-bottom: -1px;
        }
        .tab:hover { color: #1B2B4B; }
        .tab.active { color: #4A82C6; border-bottom-color: #4A82C6; font-weight: 600; }

        .modal-body { padding: 20px 24px 8px; overflow-y: auto; flex: 1; }
        .section { display: flex; flex-direction: column; gap: 13px; }

        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .row3 { display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: 12px; }
        @media (max-width: 500px) { .row2, .row3 { grid-template-columns: 1fr; } }

        .separator {
          display: flex; align-items: center; gap: 10px; margin: 4px 0;
        }
        .separator span {
          font-size: 11px; font-weight: 700; color: #9A9A9A;
          text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;
        }
        .separator::before, .separator::after {
          content: ''; flex: 1; height: 1px; background: #F0F0F0;
        }

        .error-msg {
          font-size: 13px; color: #DC2626; background: #FEF2F2;
          border: 1px solid #FECACA; padding: 10px 12px; border-radius: 8px;
          margin-top: 4px;
        }

        .modal-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px 20px; border-top: 1px solid #F0F0F0; flex-shrink: 0;
          gap: 10px; flex-wrap: wrap;
        }
        .nav-btns { display: flex; gap: 6px; }
        .btn-nav {
          height: 36px; padding: 0 14px; border: 1px solid #E8E8E8; border-radius: 8px;
          font-size: 13px; font-weight: 500; cursor: pointer; background: white;
          color: #5C5C5C; font-family: inherit; transition: all 0.15s;
        }
        .btn-nav:hover { border-color: #D0D0D0; color: #0a0a0a; }
        .btn-nav.primary-nav { background: #F5F7FA; color: #1B2B4B; border-color: #D8E0EC; }
        .btn-nav.primary-nav:hover { background: #EBF0F8; }

        .btn-generate {
          height: 38px; padding: 0 18px; background: #4A82C6; color: white; border: none;
          border-radius: 8px; font-size: 13.5px; font-weight: 600; cursor: pointer;
          font-family: inherit; display: flex; align-items: center; gap: 7px;
          transition: background 0.15s;
        }
        .btn-generate:hover:not(:disabled) { background: #3A6FB5; }
        .btn-generate:disabled { opacity: 0.5; cursor: not-allowed; }

        :global(.spin) { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

/* ── Subcomponents ── */

function Field({
  label, value, onChange, placeholder, type = 'text', hint,
}: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; hint?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#5C5C5C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          height: 38, padding: '0 11px', border: '1.5px solid #E8E8E8', borderRadius: 8,
          fontSize: 13.5, color: '#0a0a0a', background: '#FAFAFA', outline: 'none',
          fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
        }}
        onFocus={e => (e.target.style.borderColor = '#4A82C6')}
        onBlur={e => (e.target.style.borderColor = '#E8E8E8')}
      />
      {hint && <span style={{ fontSize: 11, color: '#9A9A9A', marginTop: 2 }}>{hint}</span>}
    </div>
  )
}

function TextareaField({
  label, value, onChange, placeholder, rows = 5,
}: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#5C5C5C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={{
          padding: '10px 11px', border: '1.5px solid #E8E8E8', borderRadius: 8,
          fontSize: 13.5, color: '#0a0a0a', background: '#FAFAFA', outline: 'none',
          fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6,
          boxSizing: 'border-box',
        }}
        onFocus={e => (e.target.style.borderColor = '#4A82C6')}
        onBlur={e => (e.target.style.borderColor = '#E8E8E8')}
      />
    </div>
  )
}
