'use client'

import { useState, useMemo } from 'react'
import { Search, X, Copy, Check } from 'lucide-react'

const NAVY = '#0B1F4A'

const CATEGORIES = [
  {
    key: 'asobal_tv',
    label: 'ASOBAL.TV',
    color: '#1B3BDA',
    ctas: [
      '¡Todo el balonmano, en ASOBAL.TV!',
      '¡No te pierdas ni un gol! Entra en ASOBAL.TV',
      'La Liga Nexus Energía ASOBAL, en directo. ¡Solo en ASOBAL.TV!',
      '¡Dale al play! ASOBAL.TV',
      '¡Vive cada partido en directo!',
      '¡El mejor balonmano está en ASOBAL.TV!',
      '¡Que empiece el show! Míralo en ASOBAL.TV',
      'Todos los partidos. Todas las jornadas. ¡ASOBAL.TV!',
      '¿Te lo vas a perder? ¡Entra ya!',
      '¡Tu equipo juega hoy! Síguelo en ASOBAL.TV',
      '¡Balonmano de élite, a un clic!',
      '¡Siente la pista desde casa!',
      '¡Directos, resúmenes y mucho más!',
      '¡La emoción no se cuenta, se ve!',
      '¡Conéctate a la Liga Nexus Energía ASOBAL!',
      '¡Pita el árbitro! Corre a ASOBAL.TV',
      '¡Cada contraataque, en directo!',
      '¡Hazte con ASOBAL.TV y no te pierdas nada!',
      '¡Esto no se ve en otro sitio!',
      '¡El balonmano se vive en ASOBAL.TV!',
      '¡Partidazo a la vista! Míralo ya',
      '¡Enciende la pasión! ASOBAL.TV',
      '¡Ni un siete metros sin ver!',
      '¡La liga más top, en tu pantalla!',
      '¡Balonmano 24/7 en ASOBAL.TV!',
      '¡Revive las mejores jugadas!',
      '¡Tu sofá, tu grada!',
      '¡Suscríbete y vive la ASOBAL!',
      '¡Donde hay balonmano, hay ASOBAL.TV!',
      '¡Ya está rodando! Entra ahora',
    ],
  },
  {
    key: 'fantasy',
    label: 'FANTASY',
    color: '#7C3AED',
    ctas: [
      '¡Ficha, juega y gana con ASOBAL Fantasy!',
      '¡Monta tu equipo de ensueño!',
      '¡Hoy el entrenador eres tú!',
      '¡Demuestra que sabes más que nadie de balonmano!',
      '¡Crea tu liga y reta a tus amigos!',
      '¡Cada gol suma! Juega ya',
      '¡El juego oficial de la Liga Nexus Energía ASOBAL!',
      '¡Elige a tus cracks y a por la jornada!',
      '¿Tienes olfato de míster? ¡Demuéstralo!',
      '¿Alineación lista? ¡A jugar!',
      '¡Ficha estrellas, gana premios!',
      '¡La jornada empieza en tu banquillo!',
      '¡Tu liga, tus reglas, tu equipo!',
      '¡Súbete al Fantasy!',
      '¡Arma tu siete ideal!',
      '¡Gratis y adictivo!',
      '¿Qué tiemble el mercado de fichajes!',
      '¡Gana a tu grupo de WhatsApp!',
      '¡Cada parada cuenta!',
      '¡Escala en la clasificación!',
      '¡Capitán elegido? ¡Que empiece el show!',
      '¡Vive la liga desde el banquillo!',
      '¡Juega gratis ya!',
      '¡Mete al pichichi en tu equipo!',
      '¡No mires el partido: juégalo!',
      '¡Tú fichas, ellos marcan, tú ganas!',
      '¡Ponte a prueba cada jornada!',
      '¡Aún estás a tiempo de apuntarte!',
      '¿Campeón de tu liga? ¡Demuéstralo!',
      '¡El balonmano también se juega fuera de la pista!',
    ],
  },
  {
    key: 'app_asobaltv',
    label: 'APP ASOBALTV',
    color: '#0369A1',
    ctas: [
      '¡Descárgate la app de ASOBAL.TV!',
      '¡El balonmano en tu bolsillo!',
      '¡Mira la liga donde quieras!',
      '¡Directos en tu móvil! Descárgala ya',
      '¡Ni en el bus te lo pierdes!',
      '¡Tu equipo, siempre contigo!',
      '¡Disponible en iOS y Android!',
      '¡Activa las notificaciones y no te pierdas nada!',
      '¡Un toque y a la pista!',
      '¡La Liga Nexus Energía ASOBAL, en tu móvil!',
      '¡Descárgala gratis y dale al play!',
      '¡Balonmano sin límites!',
      '¡Mira, repite, comparte!',
      '¡Vive la ASOBAL estés donde estés!',
      '¡Tu grada portátil!',
      '¡Directos, resúmenes y highlights en la app!',
      '¡Más rápida que un contraataque!',
      '¡Llévate la liga a todas partes!',
      '¡Descárgala ya!',
      '¡Del móvil a la tele en un toque!',
      '¡Alertas de gol al instante!',
      '¡Tu pantalla, tu pabellón!',
      '¡Nunca más llegues tarde a un partido!',
      '¡Instálala y siente la pista!',
      '¡Se vive mejor en la app!',
      '¡Todo el balonmano cabe en tu mano!',
      '¡Hoy hay partido! ¿Tienes la app?',
      '¡Cero excusas: descárgala!',
      '¡La app que todo fan necesita!',
      '¡Tu liga favorita, a un toque!',
    ],
  },
  {
    key: 'web',
    label: 'WEB',
    color: '#059669',
    ctas: [
      '¡Toda la info de la liga en asobal.es!',
      '¡Resultados al minuto!',
      '¡Consulta la clasificación ya!',
      '¡Calendario, resultados y más en asobal.es!',
      '¡Las estadísticas que buscas!',
      '¿Quién lidera la tabla? ¡Descúbrelo!',
      '¡Toda la actualidad de la Liga Nexus Energía ASOBAL!',
      '¡Entra en asobal.es y no te pierdas nada!',
      '¡Datos, goles y récords!',
      '¡Conoce a los máximos goleadores!',
      '¡La jornada, al detalle!',
      '¡Noticias frescas cada día!',
      '¡Sigue la liga minuto a minuto!',
      '¡Todo empieza en asobal.es!',
      '¡Fichajes, novedades y exclusivas!',
      '¡Tu equipo, en cifras!',
      '¿Cuándo juega tu equipo? ¡Míralo aquí!',
      '¡La casa del balonmano!',
      '¡Actas, estadísticas y rankings!',
      '¡Infórmate como un profesional!',
      '¡Visita asobal.es!',
      '¡Toda la liga en una web!',
      '¡Crónicas y resúmenes al momento!',
      '¡Descubre a las estrellas de la liga!',
      '¡Lo último del balonmano, aquí!',
      '¡Consulta, compara, disfruta!',
      '¡Los números del directo!',
      '¡Entérate antes que nadie!',
      '¡La fuente oficial de la ASOBAL!',
      '¡Un clic y lo sabes todo!',
    ],
  },
  {
    key: 'app_asobal',
    label: 'APP ASOBAL',
    color: '#CC0000',
    ctas: [
      '¡Descárgate la app oficial de ASOBAL!',
      '¡Toda la liga en tu móvil!',
      '¡Resultados en directo, al instante!',
      '¡Que no se te escape ni un gol!',
      '¡Activa las alertas de tu equipo!',
      '¡La clasificación, siempre a mano!',
      '¡La Liga Nexus Energía ASOBAL, en tu bolsillo!',
      '¡Descárgala gratis ya!',
      '¡Disponible en iOS y Android!',
      '¡Tu equipo, en tu pantalla de inicio!',
      '¡Estadísticas en tiempo real!',
      '¡Calendario, resultados y noticias en una app!',
      '¡Sigue cada jornada minuto a minuto!',
      '¡Notificaciones de gol al momento!',
      '¡El balonmano, a un toque!',
      '¡Infórmate antes que nadie!',
      '¡Fichajes y novedades al instante!',
      '¡Tus jugadores favoritos, al detalle!',
      '¡La app que todo fan necesita!',
      '¡Descárgala y no te pierdas nada!',
      '¡Más rápida que un contraataque!',
      '¿Cómo va tu equipo? ¡Míralo en la app!',
      '¡Toda la info, cero esperas!',
      '¡Tu liga favorita, siempre contigo!',
      '¡El marcador vive en tu móvil!',
      '¡Instálala y vive la ASOBAL!',
      '¡Del pabellón a tu bolsillo!',
      '¡Cero excusas: descárgala!',
      '¡La ASOBAL oficial, en una app!',
    ],
  },
]

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={copy}
      title={copied ? 'Copiat!' : 'Copiar'}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 22, height: 22, borderRadius: 5, border: '1px solid',
        borderColor: copied ? '#16a34a' : 'rgba(0,0,0,0.1)',
        background: copied ? '#f0fdf4' : '#f9fafb',
        color: copied ? '#16a34a' : '#9CA3AF',
        cursor: 'pointer', flexShrink: 0, transition: 'all .15s',
      }}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
    </button>
  )
}

export function AsobalCTAs() {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!q.trim()) return CATEGORIES
    const query = q.toLowerCase()
    return CATEGORIES.map(cat => ({
      ...cat,
      ctas: cat.ctas.filter(cta => cta.toLowerCase().includes(query)),
    })).filter(cat => cat.ctas.length > 0)
  }, [q])

  const totalVisible = filtered.reduce((acc, c) => acc + c.ctas.length, 0)

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden', background: '#F8F9FB' }}>

      {/* Search bar */}
      <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Cerca una CTA…"
            style={{ width: '100%', padding: '7px 9px 7px 28px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
          />
          {q && (
            <button onClick={() => setQ('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
              <X size={12} />
            </button>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{totalVisible} CTAs</div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
            Cap resultat per &ldquo;{q}&rdquo;
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, alignItems: 'start' }}>
          {filtered.map(cat => (
            <div key={cat.key} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              {/* Column header */}
              <div style={{ background: cat.color, padding: '8px 12px' }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '.1em' }}>{cat.label}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{cat.ctas.length} CTAs</div>
              </div>
              {/* CTA list */}
              <div>
                {cat.ctas.map((cta, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 10px', borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.05)', background: i % 2 === 0 ? '#fff' : '#F8F9FB' }}
                  >
                    <span style={{ flex: 1, fontSize: 11.5, color: '#111827', lineHeight: 1.45 }}>{cta}</span>
                    <CopyBtn text={cta} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
