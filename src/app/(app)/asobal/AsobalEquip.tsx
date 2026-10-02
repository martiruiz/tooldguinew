'use client'

import { useState, useMemo, useEffect } from 'react'
import { Mail, Phone, MessageCircle, Search, X, Plus, Trash2, ChevronDown, ChevronRight, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Contact {
  id: string
  group: 'club' | 'guinew'
  club?: string
  role?: string
  name: string
  phone?: string
  email?: string
  is_local?: boolean // hardcoded contacts
}

// Color + abbreviation per club
const CLUB_META: Record<string, { abbr: string; color: string; bg: string }> = {
  'Barça':                          { abbr: 'FCB', color: '#fff',    bg: '#A50044' },
  'Fraikin BM. Granollers':         { abbr: 'GRA', color: '#fff',    bg: '#0D3B8E' },
  'Abanca Ademar León':             { abbr: 'ADE', color: '#fff',    bg: '#1A1A1A' },
  'Irudek Bidasoa Irún':            { abbr: 'BID', color: '#fff',    bg: '#003DA5' },
  'Bathco BM. Torrelavega':         { abbr: 'TLV', color: '#fff',    bg: '#E63329' },
  'Horneo BM. Alicante':            { abbr: 'ALI', color: '#fff',    bg: '#0066CC' },
  'Cajasol Sevilla BM. Proin':      { abbr: 'SEV', color: '#fff',    bg: '#009246' },
  'Fertiberia Puerto Sagunto':      { abbr: 'PSG', color: '#fff',    bg: '#CC0000' },
  'Recoletas Salud At. Valladolid': { abbr: 'VAL', color: '#fff',    bg: '#5B2D8E' },
  'Frigoríficos del Morrazo':       { abbr: 'MOR', color: '#fff',    bg: '#004E98' },
  'Dicorpedal Logroño La Rioja':    { abbr: 'LOG', color: '#fff',    bg: '#C8102E' },
  'Rebi Balonmano Cuenca':          { abbr: 'CUE', color: '#fff',    bg: '#FF6B00' },
  'BM Caserio Ciudad Real':         { abbr: 'CRE', color: '#fff',    bg: '#006341' },
  'Viveron Herol BM. Nava':         { abbr: 'NAV', color: '#fff',    bg: '#1B4F72' },
  'Cajasol Ángel Ximénez P. Genil': { abbr: 'PGE', color: '#fff',    bg: '#8B0000' },
  'Tubos Aranda Villa de Aranda':   { abbr: 'VDA', color: '#fff',    bg: '#2C3E50' },
}

const GUINEW_COLORS = [
  '#1b3bda', '#2563EB', '#3B82F6', '#6366F1', '#8B5CF6', '#7C3AED', '#4338CA',
]

const HARDCODED: Contact[] = [
  // CLUBS
  { id: 'c1',   group: 'club', club: 'Barça',                          name: 'Miquel Muñoz',           phone: '676 964 452',  email: 'miquel.munoz@fcbarcelona.cat', is_local: true },
  { id: 'c2',   group: 'club', club: 'Fraikin BM. Granollers',         name: 'Javi López',              phone: '605 09 42 37', email: 'javi.lopez@bmgranollers.cat', is_local: true },
  { id: 'c2b',  group: 'club', club: 'Fraikin BM. Granollers',         name: 'Pol Rueda',               phone: '608 822 582',  email: 'javi.lopez@bmgranollers.cat', is_local: true },
  { id: 'c3',   group: 'club', club: 'Abanca Ademar León',             name: 'René Mira',               phone: '619 11 37 39', email: 'rene.mira@ademar.com', is_local: true },
  { id: 'c3b',  group: 'club', club: 'Abanca Ademar León',             name: 'Raul Carames',            phone: '722 675 525',  email: 'socialmedia@ademar.com', is_local: true },
  { id: 'c4',   group: 'club', club: 'Irudek Bidasoa Irún',            name: 'Iker Rodríguez',          phone: '621 224 262',  email: 'prensa@cdbidasoa.eus', is_local: true },
  { id: 'c5',   group: 'club', club: 'Bathco BM. Torrelavega',         name: 'Daniel Vázquez',          phone: '655 728 652',  email: 'comunicacion@torrebalonmano.com', is_local: true },
  { id: 'c6',   group: 'club', club: 'Horneo BM. Alicante',            name: 'María Andreu',            phone: '610755726',    email: 'prensa@eonalicante.com', is_local: true },
  { id: 'c6b',  group: 'club', club: 'Horneo BM. Alicante',            name: 'Santi',                   phone: '633 02 54 19', email: 'marketing@eonalicante.com', is_local: true },
  { id: 'c7',   group: 'club', club: 'Cajasol Sevilla BM. Proin',      name: 'Jose Antonio Jimenez',    phone: '625 694 244',  email: 'prensa@bmprointegrada.es', is_local: true },
  { id: 'c8',   group: 'club', club: 'Fertiberia Puerto Sagunto',       name: 'Pepa Conesa',             phone: '654982163',    email: 'conesa.pepa@gmail.com', is_local: true },
  { id: 'c8b',  group: 'club', club: 'Fertiberia Puerto Sagunto',       name: 'Equipo de diseño',        phone: '',             email: 'bermudez@cbmpuertosagunto.com', is_local: true },
  { id: 'c9',   group: 'club', club: 'Recoletas Salud At. Valladolid',  name: 'Enrique López',           phone: '615 10 30 54', email: 'enrique.lopez@atleticovalladolid.es', is_local: true },
  { id: 'c9b',  group: 'club', club: 'Recoletas Salud At. Valladolid',  name: 'Saúl Asensio',            phone: '646 81 14 02', email: 'prensa@atleticovalladolid.es', is_local: true },
  { id: 'c9c',  group: 'club', club: 'Recoletas Salud At. Valladolid',  name: 'Laura Velasco',           phone: '647 53 97 57', email: 'laura.velasco@atleticovalladolid.es', is_local: true },
  { id: 'c10',  group: 'club', club: 'Frigoríficos del Morrazo',        name: 'Pepe Camiña',             phone: '678 81 04 41', email: 'p.camina@balonmancangas.com', is_local: true },
  { id: 'c10b', group: 'club', club: 'Frigoríficos del Morrazo',        name: 'Raúl Fonseca (FOTO)',     phone: '683 53 45 59', email: 'comunicacion@balonmancangas.com', is_local: true },
  { id: 'c10c', group: 'club', club: 'Frigoríficos del Morrazo',        name: 'Rober Pastoriza (FOTO)',  phone: '662 09 95 62', email: 'roberan812@gmail.com', is_local: true },
  { id: 'c11',  group: 'club', club: 'Dicorpedal Logroño La Rioja',    name: 'Juanjo Acobi',            phone: '625 15 78 36', email: 'info@mambomarketing.es', is_local: true },
  { id: 'c11b', group: 'club', club: 'Dicorpedal Logroño La Rioja',    name: 'Alejandro Ruiz',          phone: '696881573',    email: 'alruiz20@gmail.com', is_local: true },
  { id: 'c12',  group: 'club', club: 'Rebi Balonmano Cuenca',           name: 'Carlos Maso',             phone: '635 894 179',  email: 'cmasso@bmciudadencantada.es', is_local: true },
  { id: 'c13',  group: 'club', club: 'BM Caserio Ciudad Real',          name: 'Marta López',             phone: '617 42 26 22', email: 'comunicación@balonmanocaserio.com', is_local: true },
  { id: 'c13b', group: 'club', club: 'BM Caserio Ciudad Real',          name: 'José Luís',               phone: '618 19 53 49', email: 'comunicación@balonmanocaserio.com', is_local: true },
  { id: 'c14',  group: 'club', club: 'Viveron Herol BM. Nava',          name: 'Oliver Ajo',              phone: '678 39 40 65', email: 'web@balonmanonava.com', is_local: true },
  { id: 'c14b', group: 'club', club: 'Viveron Herol BM. Nava',          name: 'Paula Toledano',          phone: '683 64 44 87', email: 'prensa@balonmanonava.com', is_local: true },
  { id: 'c15',  group: 'club', club: 'Cajasol Ángel Ximénez P. Genil',  name: 'Fani Hernandez',          phone: '628 680 579',  email: 'prensaangelximenez@hotmail.com', is_local: true },
  { id: 'c16',  group: 'club', club: 'Tubos Aranda Villa de Aranda',    name: 'Rodrigo Calvo',           phone: '657 92 48 48', email: 'prensa@bmvilladearanda.com', is_local: true },
  { id: 'c16b', group: 'club', club: 'Tubos Aranda Villa de Aranda',    name: 'Juan Pablo Berdón',       phone: '686 19 49 55', email: 'jpberdon@hotmail.com', is_local: true },
  { id: 'c16c', group: 'club', club: 'Tubos Aranda Villa de Aranda',    name: 'Roberto Campillo',        phone: '640 04 96 20', email: 'prensa@bmvilladearanda.com', is_local: true },
  // GUINEW TEAM
  { id: 'g1', group: 'guinew', role: 'Director',             name: 'Martí',      phone: '658 295 136', email: 'marti@agenciaguinew.com', is_local: true },
  { id: 'g2', group: 'guinew', role: 'Project Manager',      name: 'Josep',      phone: '638 376 298', email: 'josep@agenciaguinew.com', is_local: true },
  { id: 'g3', group: 'guinew', role: 'Social Media Manager', name: 'Gon',        phone: '622 704 127', email: 'gonzalo@agenciaguinew.com', is_local: true },
  { id: 'g4', group: 'guinew', role: 'Social Media Manager', name: 'Pau',        phone: '603 845 197', email: 'pau@agenciaguinew.com', is_local: true },
  { id: 'g5', group: 'guinew', role: 'Filmmaker Oficial',    name: 'Bernat',     phone: '600 085 111', email: 'bernat@agenciaguinew.com', is_local: true },
  { id: 'g6', group: 'guinew', role: 'Prensa ASOBAL',        name: 'Gonzalo R.', phone: '637 539 774', email: 'gromero@asobal.es', is_local: true },
  { id: 'g7', group: 'guinew', role: 'Prensa ASOBAL',        name: 'Carlos',     phone: '636 409 450', email: 'cmolina@asobal.es', is_local: true },
]

const CLUBS_LIST = Array.from(new Set(HARDCODED.filter(c => c.group === 'club').map(c => c.club!)))

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

function ActionBtn({ href, title, bg, color, children }: { href: string; title: string; bg: string; color: string; children: React.ReactNode }) {
  return (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" title={title}
      style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color, textDecoration: 'none', flexShrink: 0 }}>
      {children}
    </a>
  )
}

// Club logo badge
function ClubBadge({ club, size = 32 }: { club: string; size?: number }) {
  const meta = CLUB_META[club]
  const abbr = meta?.abbr ?? initials(club)
  const bg = meta?.bg ?? '#374151'
  const color = meta?.color ?? '#fff'
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.25, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.28, fontWeight: 800, letterSpacing: '-0.02em', flexShrink: 0 }}>
      {abbr}
    </div>
  )
}

// Inline add-contact form
interface NewContact { group: 'club' | 'guinew'; club: string; role: string; name: string; phone: string; email: string }
const EMPTY_FORM: NewContact = { group: 'club', club: '', role: '', name: '', phone: '', email: '' }

export function AsobalEquip({ filterClub }: { filterClub?: string }) {
  const [contacts, setContacts] = useState<Contact[]>(HARDCODED)
  const [q, setQ] = useState('')
  const [groupFilter, setGroupFilter] = useState<'all' | 'club' | 'guinew'>('all')
  const [openClubs, setOpenClubs] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NewContact>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const supabase = createClient()

  // Load extra contacts from Supabase (not overwrite hardcoded)
  useEffect(() => {
    supabase
      .from('asobal_contacts')
      .select('*')
      .then(({ data }) => {
        if (data && data.length > 0) {
          const remote = data.map((r: Record<string, unknown>) => ({ ...r, is_local: false } as Contact))
          setContacts([...HARDCODED, ...remote])
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim()
    return contacts.filter(c => {
      if (filterClub && c.group === 'club' && c.club !== filterClub) return false
      if (groupFilter !== 'all' && c.group !== groupFilter) return false
      if (!query) return true
      return (
        c.name.toLowerCase().includes(query) ||
        (c.club ?? '').toLowerCase().includes(query) ||
        (c.role ?? '').toLowerCase().includes(query) ||
        (c.email ?? '').toLowerCase().includes(query) ||
        (c.phone ?? '').includes(query)
      )
    })
  }, [contacts, q, groupFilter, filterClub])

  const clubContacts = filtered.filter(c => c.group === 'club')
  const guinewContacts = filtered.filter(c => c.group === 'guinew')

  const groupedClubs = useMemo(() => {
    const map: Record<string, Contact[]> = {}
    for (const c of clubContacts) {
      if (!map[c.club!]) map[c.club!] = []
      map[c.club!].push(c)
    }
    return map
  }, [clubContacts])

  const toggleClub = (club: string) => {
    setOpenClubs(prev => {
      const next = new Set(prev)
      next.has(club) ? next.delete(club) : next.add(club)
      return next
    })
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const newContact: Contact = {
      id: `local_${Date.now()}`,
      group: form.group,
      club: form.group === 'club' ? (form.club || 'Sense club') : undefined,
      role: form.group === 'guinew' ? form.role : undefined,
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      is_local: false,
    }
    // Try Supabase save, continue even if table doesn't exist
    const { data } = await supabase
      .from('asobal_contacts')
      .insert({ group: newContact.group, club: newContact.club, role: newContact.role, name: newContact.name, phone: newContact.phone, email: newContact.email })
      .select('id')
      .single()
    if (data?.id) newContact.id = data.id
    setContacts(prev => [...prev, newContact])
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
  }

  const handleDelete = async (c: Contact) => {
    if (!confirm(`Eliminar "${c.name}"?`)) return
    setDeleting(c.id)
    if (!c.is_local) {
      await supabase.from('asobal_contacts').delete().eq('id', c.id)
    }
    setContacts(prev => prev.filter(x => x.id !== c.id))
    setDeleting(null)
  }

  // Compact mode used from Jornades
  if (filterClub) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {clubContacts.length === 0
          ? <div style={{ fontSize: 12, color: '#9CA3AF' }}>Sense contactes per a aquest club.</div>
          : clubContacts.map(c => <CompactRow key={c.id} c={c} />)
        }
      </div>
    )
  }

  const inputStyle: React.CSSProperties = { padding: '7px 10px', border: '1px solid rgba(0,0,0,0.13)', borderRadius: 8, fontSize: 12.5, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden', background: '#F8F9FB' }}>

      {/* Top bar */}
      <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)', flexShrink: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca nom, club, càrrec, email…"
            style={{ ...inputStyle, paddingLeft: 28, paddingRight: q ? 28 : 10 }} />
          {q && <button onClick={() => setQ('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}><X size={12} /></button>}
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {(['all', 'club', 'guinew'] as const).map(g => (
            <button key={g} onClick={() => setGroupFilter(g)}
              style={{ fontSize: 11.5, fontWeight: 600, padding: '5px 9px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: groupFilter === g ? '#111827' : 'rgba(0,0,0,0.06)', color: groupFilter === g ? '#fff' : '#555' }}>
              {g === 'all' ? 'Tots' : g === 'club' ? 'Clubs' : 'Guinew'}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, background: '#1b3bda', color: '#fff' }}>
          <UserPlus size={13} /> Nou
        </button>
      </div>

      {/* Add contact form */}
      {showForm && (
        <div style={{ background: '#EFF6FF', borderBottom: '1px solid rgba(27,59,218,0.15)', padding: '12px 14px', flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1b3bda', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={13} /> Nou contacte
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 10.5, color: '#6B7280', marginBottom: 3 }}>Tipus</div>
              <select value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value as 'club' | 'guinew' }))} style={{ ...inputStyle }}>
                <option value="club">Club</option>
                <option value="guinew">Guinew Team</option>
              </select>
            </div>
            {form.group === 'club' ? (
              <div>
                <div style={{ fontSize: 10.5, color: '#6B7280', marginBottom: 3 }}>Club</div>
                <input list="clubs-list" value={form.club} onChange={e => setForm(f => ({ ...f, club: e.target.value }))} placeholder="Nom del club" style={inputStyle} />
                <datalist id="clubs-list">{CLUBS_LIST.map(c => <option key={c} value={c} />)}</datalist>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 10.5, color: '#6B7280', marginBottom: 3 }}>Càrrec</div>
                <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Director, SMM…" style={inputStyle} />
              </div>
            )}
            <div>
              <div style={{ fontSize: 10.5, color: '#6B7280', marginBottom: 3 }}>Nom *</div>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom complet" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: '#6B7280', marginBottom: 3 }}>Telèfon</div>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="600 000 000" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: '#6B7280', marginBottom: 3 }}>Email</div>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="exemple@club.es" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: '#1b3bda', color: '#fff', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Guardant…' : 'Guardar'}
              </button>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                style={{ padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, background: 'rgba(0,0,0,0.08)', color: '#555' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>

        {/* Guinew Team section */}
        {(groupFilter === 'all' || groupFilter === 'guinew') && guinewContacts.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1b3bda' }} />
              Equip intern Guinew · {guinewContacts.length}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {guinewContacts.map((c, i) => {
                const bg = GUINEW_COLORS[i % GUINEW_COLORS.length]
                const num = c.phone?.replace(/\s/g, '') ?? ''
                return (
                  <div key={c.id} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, overflow: 'hidden', position: 'relative', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    {/* Color accent bar */}
                    <div style={{ height: 4, background: bg }} />
                    <div style={{ padding: '12px 12px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                          {initials(c.name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                          <div style={{ fontSize: 10.5, color: '#6B7280', marginTop: 1 }}>{c.role}</div>
                        </div>
                        {!c.is_local && (
                          <button onClick={() => handleDelete(c)} disabled={deleting === c.id}
                            style={{ position: 'absolute', top: 10, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4, opacity: deleting === c.id ? 0.4 : 0.6 }}>
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {num && <>
                          <ActionBtn href={`tel:${num}`} title="Trucar" bg="#F3F4F6" color="#374151"><Phone size={12} /></ActionBtn>
                          <ActionBtn href={`https://wa.me/34${num.replace(/^0/, '')}`} title="WhatsApp" bg="#F0FDF4" color="#16A34A"><MessageCircle size={12} /></ActionBtn>
                        </>}
                        {c.email && <ActionBtn href={`mailto:${c.email}`} title="Email" bg="#EFF6FF" color="#2563EB"><Mail size={12} /></ActionBtn>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Clubs section - accordion */}
        {(groupFilter === 'all' || groupFilter === 'club') && Object.keys(groupedClubs).length > 0 && (
          <section>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#374151' }} />
              Clubs ASOBAL · {Object.keys(groupedClubs).length} clubs, {clubContacts.length} contactes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(groupedClubs).map(([club, clubConts]) => {
                const isOpen = openClubs.has(club) || q.length > 0
                const meta = CLUB_META[club]
                return (
                  <div key={club} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    {/* Club header row */}
                    <button onClick={() => toggleClub(club)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <ClubBadge club={club} size={30} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#111827' }}>{club}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>
                        {clubConts.length} {clubConts.length === 1 ? 'contacte' : 'contactes'}
                      </span>
                      <span style={{ color: '#9CA3AF', marginLeft: 4 }}>
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                    </button>

                    {/* Contacts table */}
                    {isOpen && (
                      <div style={{ borderTop: `3px solid ${meta?.bg ?? '#E5E7EB'}` }}>
                        {clubConts.map((c, idx) => {
                          const num = c.phone?.replace(/\s/g, '') ?? ''
                          return (
                            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderTop: idx > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none', background: idx % 2 === 0 ? '#FAFAFA' : '#fff' }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.08)', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10, flexShrink: 0 }}>
                                {initials(c.name)}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                                {c.email && <div style={{ fontSize: 10.5, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>}
                              </div>
                              {c.phone && <span style={{ fontSize: 11, color: '#6B7280', whiteSpace: 'nowrap', flexShrink: 0 }}>{c.phone}</span>}
                              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                {num && <>
                                  <ActionBtn href={`tel:${num}`} title="Trucar" bg="#F3F4F6" color="#374151"><Phone size={11} /></ActionBtn>
                                  <ActionBtn href={`https://wa.me/34${num.replace(/^0/, '')}`} title="WhatsApp" bg="#F0FDF4" color="#16A34A"><MessageCircle size={11} /></ActionBtn>
                                </>}
                                {c.email && <ActionBtn href={`mailto:${c.email}`} title="Email" bg="#EFF6FF" color="#2563EB"><Mail size={11} /></ActionBtn>}
                                {!c.is_local && (
                                  <button onClick={() => handleDelete(c)} disabled={deleting === c.id}
                                    style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FEF2F2', color: '#EF4444', border: 'none', cursor: 'pointer', opacity: deleting === c.id ? 0.4 : 1 }}>
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
            Cap contacte trobat per &ldquo;{q}&rdquo;
          </div>
        )}
      </div>
    </div>
  )
}

function CompactRow({ c }: { c: Contact }) {
  const num = c.phone?.replace(/\s/g, '') ?? ''
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{c.name}</div>
        {c.email && <div style={{ fontSize: 10.5, color: '#9CA3AF' }}>{c.email}</div>}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {num && <ActionBtn href={`tel:${num}`} title="Trucar" bg="#F3F4F6" color="#374151"><Phone size={11} /></ActionBtn>}
        {num && <ActionBtn href={`https://wa.me/34${num.replace(/^0/, '')}`} title="WhatsApp" bg="#F0FDF4" color="#16A34A"><MessageCircle size={11} /></ActionBtn>}
        {c.email && <ActionBtn href={`mailto:${c.email}`} title="Email" bg="#EFF6FF" color="#2563EB"><Mail size={11} /></ActionBtn>}
      </div>
    </div>
  )
}

export { HARDCODED as CONTACTS, CLUBS_LIST as CLUBS }
