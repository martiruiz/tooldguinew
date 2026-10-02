'use client'

import { useState, useMemo } from 'react'
import { Mail, Phone, MessageCircle, Search, X } from 'lucide-react'

interface Contact {
  id: string
  group: 'club' | 'guinew'
  club?: string
  role?: string
  name: string
  phone?: string
  email?: string
}

const CONTACTS: Contact[] = [
  // CLUBS
  { id: 'c1',  group: 'club', club: 'Barça',                         name: 'Miquel Muñoz',            phone: '676 964 452',               email: 'miquel.munoz@fcbarcelona.cat' },
  { id: 'c2',  group: 'club', club: 'Fraikin BM. Granollers',        name: 'Javi López',               phone: '605 09 42 37',              email: 'javi.lopez@bmgranollers.cat' },
  { id: 'c2b', group: 'club', club: 'Fraikin BM. Granollers',        name: 'Pol Rueda',                phone: '608 822 582',               email: 'javi.lopez@bmgranollers.cat' },
  { id: 'c3',  group: 'club', club: 'Abanca Ademar León',            name: 'René Mira',                phone: '619 11 37 39',              email: 'rene.mira@ademar.com' },
  { id: 'c3b', group: 'club', club: 'Abanca Ademar León',            name: 'Raul Carames',             phone: '722 675 525',               email: 'socialmedia@ademar.com' },
  { id: 'c4',  group: 'club', club: 'Irudek Bidasoa Irún',           name: 'Iker Rodríguez',           phone: '621 224 262',               email: 'prensa@cdbidasoa.eus' },
  { id: 'c5',  group: 'club', club: 'Bathco BM. Torrelavega',        name: 'Daniel Vázquez',           phone: '655 728 652',               email: 'comunicacion@torrebalonmano.com' },
  { id: 'c6',  group: 'club', club: 'Horneo BM. Alicante',           name: 'María Andreu',             phone: '610755726',                 email: 'prensa@eonalicante.com' },
  { id: 'c6b', group: 'club', club: 'Horneo BM. Alicante',           name: 'Santi',                    phone: '633 02 54 19',              email: 'marketing@eonalicante.com' },
  { id: 'c7',  group: 'club', club: 'Cajasol Sevilla BM. Proin',     name: 'Jose Antonio Jimenez',     phone: '625 694 244',               email: 'prensa@bmprointegrada.es' },
  { id: 'c8',  group: 'club', club: 'Fertiberia Puerto Sagunto',      name: 'Pepa Conesa',              phone: '654982163',                 email: 'conesa.pepa@gmail.com' },
  { id: 'c8b', group: 'club', club: 'Fertiberia Puerto Sagunto',      name: 'Equipo de diseño',         phone: '',                          email: 'bermudez@cbmpuertosagunto.com' },
  { id: 'c9',  group: 'club', club: 'Recoletas Salud At. Valladolid', name: 'Enrique López',            phone: '615 10 30 54',              email: 'enrique.lopez@atleticovalladolid.es' },
  { id: 'c9b', group: 'club', club: 'Recoletas Salud At. Valladolid', name: 'Saúl Asensio',             phone: '646 81 14 02',              email: 'prensa@atleticovalladolid.es' },
  { id: 'c9c', group: 'club', club: 'Recoletas Salud At. Valladolid', name: 'Laura Velasco',            phone: '647 53 97 57',              email: 'laura.velasco@atleticovalladolid.es' },
  { id: 'c10', group: 'club', club: 'Frigoríficos del Morrazo',       name: 'Pepe Camiña',              phone: '678 81 04 41',              email: 'p.camina@balonmancangas.com' },
  { id: 'c10b',group: 'club', club: 'Frigoríficos del Morrazo',       name: 'Raúl Fonseca (FOTO)',      phone: '683 53 45 59',              email: 'comunicacion@balonmancangas.com' },
  { id: 'c10c',group: 'club', club: 'Frigoríficos del Morrazo',       name: 'Rober Pastoriza (FOTO)',   phone: '662 09 95 62',              email: 'roberan812@gmail.com' },
  { id: 'c11', group: 'club', club: 'Dicorpedal Logroño La Rioja',   name: 'Juanjo Acobi',             phone: '625 15 78 36',              email: 'info@mambomarketing.es' },
  { id: 'c11b',group: 'club', club: 'Dicorpedal Logroño La Rioja',   name: 'Alejandro Ruiz',           phone: '696881573',                 email: 'alruiz20@gmail.com' },
  { id: 'c12', group: 'club', club: 'Rebi Balonmano Cuenca',          name: 'Carlos Maso',              phone: '635 894 179',               email: 'cmasso@bmciudadencantada.es' },
  { id: 'c13', group: 'club', club: 'BM Caserio Ciudad Real',         name: 'Marta López',              phone: '617 42 26 22',              email: 'comunicación@balonmanocaserio.com' },
  { id: 'c13b',group: 'club', club: 'BM Caserio Ciudad Real',         name: 'José Luís',                phone: '618 19 53 49',              email: 'comunicación@balonmanocaserio.com' },
  { id: 'c14', group: 'club', club: 'Viveron Herol BM. Nava',         name: 'Oliver Ajo',               phone: '678 39 40 65',              email: 'web@balonmanonava.com' },
  { id: 'c14b',group: 'club', club: 'Viveron Herol BM. Nava',         name: 'Paula Toledano',           phone: '683 64 44 87',              email: 'prensa@balonmanonava.com' },
  { id: 'c15', group: 'club', club: 'Cajasol Ángel Ximénez P. Genil', name: 'Fani Hernandez',           phone: '628 680 579',               email: 'prensaangelximenez@hotmail.com' },
  { id: 'c16', group: 'club', club: 'Tubos Aranda Villa de Aranda',   name: 'Rodrigo Calvo',            phone: '657 92 48 48',              email: 'prensa@bmvilladearanda.com' },
  { id: 'c16b',group: 'club', club: 'Tubos Aranda Villa de Aranda',   name: 'Juan Pablo Berdón',        phone: '686 19 49 55',              email: 'jpberdon@hotmail.com' },
  { id: 'c16c',group: 'club', club: 'Tubos Aranda Villa de Aranda',   name: 'Roberto Campillo',         phone: '640 04 96 20',              email: 'prensa@bmvilladearanda.com' },

  // GUINEW TEAM
  { id: 'g1', group: 'guinew', role: 'Director',              name: 'Martí',      phone: '658 295 136', email: 'marti@agenciaguinew.com' },
  { id: 'g2', group: 'guinew', role: 'Project Manager',       name: 'Josep',      phone: '638 376 298', email: 'josep@agenciaguinew.com' },
  { id: 'g3', group: 'guinew', role: 'Social Media Manager',  name: 'Gon',        phone: '622 704 127', email: 'gonzalo@agenciaguinew.com' },
  { id: 'g4', group: 'guinew', role: 'Social Media Manager',  name: 'Pau',        phone: '603 845 197', email: 'pau@agenciaguinew.com' },
  { id: 'g5', group: 'guinew', role: 'Filmmaker Oficial',     name: 'Bernat',     phone: '600 085 111', email: 'bernat@agenciaguinew.com' },
  { id: 'g6', group: 'guinew', role: 'Prensa ASOBAL',         name: 'Gonzalo R.', phone: '637 539 774', email: 'gromero@asobal.es' },
  { id: 'g7', group: 'guinew', role: 'Prensa ASOBAL',         name: 'Carlos',     phone: '636 409 450', email: 'cmolina@asobal.es' },
]

const CLUBS = Array.from(new Set(CONTACTS.filter(c => c.group === 'club').map(c => c.club!)))

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

function ContactCard({ c, compact }: { c: Contact; compact?: boolean }) {
  const isGuinew = c.group === 'guinew'
  const whatsappNum = c.phone?.replace(/\s/g, '') ?? ''
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: compact ? '10px 12px' : '12px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff',
        background: isGuinew ? 'linear-gradient(135deg,#1b3bda,#131ea6)' : 'linear-gradient(135deg,#374151,#6B7280)' }}>
        {initials(c.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isGuinew ? c.role : c.club}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        {c.phone && (
          <>
            <a href={`tel:${whatsappNum}`} title="Trucar" style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', color: '#374151', textDecoration: 'none', transition: 'background .12s' }}>
              <Phone size={13} />
            </a>
            <a href={`https://wa.me/34${whatsappNum.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0FDF4', color: '#16A34A', textDecoration: 'none', transition: 'background .12s' }}>
              <MessageCircle size={13} />
            </a>
          </>
        )}
        {c.email && (
          <a href={`mailto:${c.email}`} title="Email" style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EFF6FF', color: '#2563EB', textDecoration: 'none', transition: 'background .12s' }}>
            <Mail size={13} />
          </a>
        )}
      </div>
    </div>
  )
}

export function AsobalEquip({ filterClub }: { filterClub?: string }) {
  const [q, setQ] = useState('')
  const [groupFilter, setGroupFilter] = useState<'all' | 'club' | 'guinew'>('all')

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim()
    return CONTACTS.filter(c => {
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
  }, [q, groupFilter, filterClub])

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

  if (filterClub) {
    // Compact mode: just show club contacts
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {clubContacts.length === 0
          ? <div style={{ fontSize: 12, color: '#9CA3AF' }}>Sense contactes per a aquest club.</div>
          : clubContacts.map(c => <ContactCard key={c.id} c={c} compact />)
        }
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
      {/* Search + filter bar */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)', background: '#FAFAFA', flexShrink: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Cerca per nom, club, càrrec, email o telèfon…"
            style={{ width: '100%', padding: '7px 9px 7px 28px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
          />
          {q && <button onClick={() => setQ('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}><X size={13} /></button>}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'club', 'guinew'] as const).map(g => (
            <button key={g} onClick={() => setGroupFilter(g)}
              style={{ fontSize: 11.5, fontWeight: 600, padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: groupFilter === g ? '#1b3bda' : 'rgba(0,0,0,0.06)',
                color: groupFilter === g ? '#fff' : '#555' }}>
              {g === 'all' ? 'Tots' : g === 'club' ? 'Clubs' : 'Guinew'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px' }}>
        {/* Guinew Team */}
        {(groupFilter === 'all' || groupFilter === 'guinew') && guinewContacts.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1b3bda' }} />
              Guinew / ASOBAL Team · {guinewContacts.length}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 6 }}>
              {guinewContacts.map(c => <ContactCard key={c.id} c={c} />)}
            </div>
          </div>
        )}

        {/* Clubs */}
        {(groupFilter === 'all' || groupFilter === 'club') && Object.keys(groupedClubs).length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#374151' }} />
              Clubs · {Object.keys(groupedClubs).length} clubs, {clubContacts.length} contactes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {Object.entries(groupedClubs).map(([club, contacts]) => (
                <div key={club}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, paddingLeft: 2 }}>{club}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 6 }}>
                    {contacts.map(c => <ContactCard key={c.id} c={c} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
            Cap contacte trobat per "{q}"
          </div>
        )}
      </div>
    </div>
  )
}

// Export CONTACTS for use in jornada view
export { CONTACTS, CLUBS }
