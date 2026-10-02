'use client'

import { useState } from 'react'
import { Search, X, Star } from 'lucide-react'

interface FranchiseClub {
  club: string
  logoFile: string
  players: [string, string, string]
}

const FRANCHISE: FranchiseClub[] = [
  { club: 'Barça',                          logoFile: 'BARÇA.svg',              players: ['Aleix Gómez',       'Ludovic Fabregas',   'Dani Fernandez'] },
  { club: 'Fraikin BM. Granollers',         logoFile: 'BM GRANOLLERS.svg',      players: ['Marcos Fis',        'Adrià Figueras',     'Pablo Urdangarin'] },
  { club: 'Abanca Ademar León',             logoFile: 'ADEMAR.svg',             players: ['Gonzalo Pérez',     'Adrián Casqueiro',   'Juan Castro'] },
  { club: 'Irudek Bidasoa Irún',            logoFile: 'BIDASOA IRUN.svg',       players: ['Gorka Nieto',       'Esteban Salinas',    'Leo Maciel'] },
  { club: 'Bathco BM. Torrelavega',         logoFile: 'BM TORRELAVEGA.svg',     players: ['Ángel Fernández',   'Prokop',             'Isidro Martínez'] },
  { club: 'Fertiberia Puerto Sagunto',       logoFile: 'PUERTO SAGUNTO.svg',     players: ['Nicolas Zungri',    'Alberto Serradilla', 'Alex Pozzer'] },
  { club: 'Recoletas Salud At. Valladolid', logoFile: 'ATLÉTICO VALLADOLID.svg', players: ['Pablo Herrero',    'Sergio Sánchez',     'Alejandro Pisonero'] },
  { club: 'Frigoríficos del Morrazo',       logoFile: 'CANGAS.svg',             players: ['Ivan Panjan',       'Manu Perez',         'Arnau Fernández'] },
  { club: 'Dicorpedal Logroño La Rioja',   logoFile: 'LOGROÑO.svg',            players: ['Álvaro Preciado',   'Xoan Ledo',          'Álvaro Martínez'] },
  { club: 'Rebi Balonmano Cuenca',          logoFile: 'CUENCA.svg',             players: ['Fede Pizarro',      'Maniel Lima',        'Rajmond Tóth'] },
  { club: 'BM Caserio Ciudad Real',         logoFile: 'CIUDAD REAL.svg',        players: ['Jorge Maqueda',     'David Cadarso',      'Albizu'] },
  { club: 'Viveron Herol BM. Nava',         logoFile: 'BM NAVA.svg',            players: ['David Fernández',   'Pablo Herranz',      'Mateus Buda'] },
  { club: 'Cajasol Ángel Ximénez P. Genil', logoFile: 'PUENTE GENIL.svg',      players: ['Pablo Simonet',     'Mario Dorado',       'Dani Serrano'] },
  { club: 'Tubos Aranda Villa de Aranda',   logoFile: 'ARANDA.PNG',             players: ['Artur Parera',      'David López',        'Filip Saric'] },
  { club: 'Horneo BM. Alicante',            logoFile: 'EON ALICANTE.svg',       players: ['James Lewis Parker','Ander Torriko',      'Ivan Montoya'] },
  { club: 'Cajasol Sevilla BM. Proin',      logoFile: 'BM PROIN SEVILLA.svg',   players: ['Chema Márquez',     'Salinas',            'Ronaldo Urios'] },
]

const RANK_STYLE = [
  { bg: '#FEF9C3', color: '#854D0E', border: '#FDE047', label: '#1' },
  { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1', label: '#2' },
  { bg: '#FFF7ED', color: '#9A3412', border: '#FDBA74', label: '#3' },
]

export function AsobalFranquicia() {
  const [q, setQ] = useState('')

  const filtered = FRANCHISE.filter(row => {
    if (!q.trim()) return true
    const query = q.toLowerCase()
    return (
      row.club.toLowerCase().includes(query) ||
      row.players.some(p => p.toLowerCase().includes(query))
    )
  })

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden', background: '#F8F9FB' }}>

      {/* Header */}
      <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca per club o jugador…"
            style={{ width: '100%', padding: '7px 9px 7px 28px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
          {q && <button onClick={() => setQ('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}><X size={12} /></button>}
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{filtered.length} clubs</div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Star size={10} fill="#9CA3AF" />
          Jugadors franquícia · top 3 per club
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
          {filtered.map(row => (
            <div key={row.club} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              {/* Club header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#F8F9FA', border: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 4, overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/asobal/clubs/${row.logoFile}`} alt={row.club} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#111827', lineHeight: 1.3, flex: 1 }}>{row.club}</div>
              </div>

              {/* Players */}
              <div style={{ padding: '8px 0' }}>
                {row.players.map((player, i) => {
                  const rank = RANK_STYLE[i]
                  const isHighlight = q && player.toLowerCase().includes(q.toLowerCase())
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', background: isHighlight ? 'rgba(27,59,218,0.05)' : 'transparent' }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: rank.bg, border: `1px solid ${rank.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: rank.color }}>{rank.label}</span>
                      </div>
                      <span style={{ fontSize: 13, color: '#111827', fontWeight: isHighlight ? 700 : 500 }}>{player}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
            Cap resultat per &ldquo;{q}&rdquo;
          </div>
        )}
      </div>
    </div>
  )
}
