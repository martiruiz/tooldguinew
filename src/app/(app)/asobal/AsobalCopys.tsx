'use client'

import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'

interface Template {
  id: string
  category: string
  name: string
  platform: 'instagram' | 'twitter' | 'ambdues'
  template: string
  variables: string[]
}

const TEMPLATES: Template[] = [
  // RESULTADO FINAL
  { id: 'rf1', category: 'Resultat final', name: 'Final del partido', platform: 'instagram', variables: ['LOCAL','GOL_LOCAL','GOL_VISITANT','VISITANT'],
    template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\n@{LOCAL} {GOL_LOCAL} – {GOL_VISITANT} @{VISITANT}' },
  { id: 'rf2', category: 'Resultat final', name: 'Se termina el encuentro', platform: 'instagram', variables: ['LOCAL','GOL_LOCAL','GOL_VISITANT','VISITANT'],
    template: '🔚 ¡𝑺𝑬 𝑻𝑬𝑹𝑴𝑰𝑵𝑨 𝑬𝑳 𝑬𝑵𝑪𝑼𝑬𝑵𝑻𝑹𝑶!\n@{LOCAL} {GOL_LOCAL} – {GOL_VISITANT} @{VISITANT}' },
  { id: 'rf3', category: 'Resultat final', name: 'Llegamos al final', platform: 'instagram', variables: ['LOCAL','GOL_LOCAL','GOL_VISITANT','VISITANT'],
    template: '🔥 ¡𝑳𝑳𝑬𝑮𝑨𝑴𝑶𝑺 𝑨𝑳 𝑭𝑰𝑵𝑨𝑳!\n@{LOCAL} {GOL_LOCAL} – {GOL_VISITANT} @{VISITANT}' },
  { id: 'rf4', category: 'Resultat final', name: 'Final de infarto', platform: 'instagram', variables: ['LOCAL','GOL_LOCAL','GOL_VISITANT','VISITANT'],
    template: '⚡ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬 𝑰𝑵𝑭𝑨𝑹𝑻𝑶!\n@{LOCAL} {GOL_LOCAL} – {GOL_VISITANT} @{VISITANT}' },

  // FANTASY
  { id: 'fan1', category: 'Fantasy ASOBAL', name: 'Ya tiene su 7 ideal (IG)', platform: 'instagram', variables: ['JUGADOR'],
    template: '¡@{JUGADOR} ya tiene su 7️⃣ ideal en ASOBAL Fantasy!\n\n👉🏼 Ahora te toca a ti. Haz tu equipo en la web de ASOBAL.' },
  { id: 'fan2', category: 'Fantasy ASOBAL', name: 'Ya tiene su 7 ideal (TW)', platform: 'twitter', variables: ['JUGADOR'],
    template: '¡@{JUGADOR} ya tiene su 7️⃣ ideal en ASOBAL Fantasy!\n\n👉🏼 Ahora te toca a ti. Haz tu equipo en:  https://fantasy.asobal.es' },

  // ASOBAL TV
  { id: 'tv1', category: 'ASOBAL TV', name: 'Saben lo que hacen', platform: 'instagram', variables: ['EQUIP'],
    template: 'En @{EQUIP} saben lo que hacen🫣\n\n👉 Todos los partidos en https://asobal.tv' },

  // HORARIOS
  { id: 'hor1', category: 'Horaris', name: 'Horarios confirmados v1', platform: 'instagram', variables: ['JORNADA'],
    template: '𝑯𝑶𝑹𝑨𝑹𝑰𝑶𝑺 | JORNADA {JORNADA}\n\n📲 ¡Ya tienes todos los horarios! Vive todos los partidos en ASOBAL.TV y en la app de StreamWay+, disponible en iOS y Android.' },
  { id: 'hor2', category: 'Horaris', name: 'Horarios confirmados v2', platform: 'instagram', variables: ['JORNADA'],
    template: '𝑯𝑶𝑹𝑨𝑹𝑰𝑶𝑺 𝑪𝑶𝑵𝑭𝑰𝑹𝑴𝑨𝑫𝑶𝑺 | JORNADA {JORNADA}\n\n📲 ¡Disfruta de todos los partidos en ASOBAL.TV y en StreamWay+, disponible en iOS y Android!' },
  { id: 'hor3', category: 'Horaris', name: 'No te pierdas ni uno', platform: 'instagram', variables: ['JORNADA'],
    template: '𝑵𝑶 𝑻𝑬 𝑷𝑰𝑬𝑹𝑫𝑨𝑺 𝑵𝑰 𝑼𝑵 𝑺𝑶𝑳𝑶 𝑷𝑨𝑹𝑻𝑰𝑫𝑶 | JORNADA {JORNADA}\n\n📲 ¡Ya tienes todos los horarios! Vive todos los partidos en ASOBAL.TV y en la app de StreamWay+, disponible en iOS y Android.' },
  { id: 'hor4', category: 'Horaris', name: 'Horarios v4', platform: 'instagram', variables: ['JORNADA'],
    template: '𝑯𝑶𝑹𝑨𝑹𝑰𝑶𝑺 | JORNADA {JORNADA}\n\n📲 ¡Disfruta de todos los partidos en ASOBAL.TV y en la app de StreamWay+, disponible en iOS y Android!' },

  // MVP
  { id: 'mvp1', category: 'MVP', name: 'Del 1 al 10', platform: 'instagram', variables: ['JORNADA','MVP'],
    template: '🌟 𝑴𝑽𝑷 @nexusenergia | JORNADA {JORNADA}\n\n¡{MVP} se lleva el MVP! 🔥\n\n👇🏻 Del 1 al 10, ¿qué nota le das?' },
  { id: 'mvp2', category: 'MVP', name: '60 minutos', platform: 'instagram', variables: ['JORNADA','MVP'],
    template: '🌟 𝑴𝑽𝑷 @nexusenergia | JORNADA {JORNADA}\n\n60 minutos. Una actuación. Un MVP.\n\n¡{MVP}! 🔥\n\n¿Qué te pareció su partido?' },
  { id: 'mvp3', category: 'MVP', name: 'MVP de la jornada', platform: 'instagram', variables: ['JORNADA','MVP'],
    template: '🌟 𝑴𝑽𝑷 @nexusenergia | JORNADA {JORNADA}\n¡{MVP}, MVP de la jornada! 🔥' },

  // RESULTADOS JORNADA
  { id: 'rj1', category: 'Resultats jornada', name: 'Así vivimos v1', platform: 'instagram', variables: [],
    template: '¡Así vivimos una nueva jornada de la Liga NEXUS ENERGÍA ASOBAL! 🤾‍♂️⚡' },
  { id: 'rj2', category: 'Resultats jornada', name: 'Goles y emoción', platform: 'instagram', variables: [],
    template: '¡La jornada nos deja goles, emoción y mucho balonmano!' },
  { id: 'rj3', category: 'Resultats jornada', name: 'Sigue avanzando', platform: 'instagram', variables: ['JORNADA'],
    template: 'La Liga NEXUS ENERGÍA ASOBAL sigue avanzando. ¡Así queda la 𝑱𝑶𝑹𝑵𝑨𝑫𝑨 {JORNADA}!' },

  // CLASIFICACIÓN
  { id: 'cla1', category: 'Classificació', name: 'Te leemos v1', platform: 'instagram', variables: ['JORNADA'],
    template: '⭐️  ¡La CLASIFICACIÓN de la Liga NEXUS ENERGÍA ASOBAL tras la jornada {JORNADA}!\n\n👀 ¡Te leemos en comentarios! 👇🏻' },
  { id: 'cla2', category: 'Classificació', name: 'Sorpresa v2', platform: 'instagram', variables: ['JORNADA'],
    template: '👀 ¡La CLASIFICACIÓN de la Liga NEXUS ENERGÍA ASOBAL tras la jornada {JORNADA}!\n\n🔥 ¿Qué posición te sorprende más?' },
  { id: 'cla3', category: 'Classificació', name: 'Sorpresa v3', platform: 'instagram', variables: ['JORNADA'],
    template: '⚡️ ¡La CLASIFICACIÓN de la Liga NEXUS ENERGÍA ASOBAL tras la jornada {JORNADA}!\n\n👀 ¿Hay alguna sorpresa en la clasificación?' },

  // 7 IDEAL
  { id: '7i1', category: '7 Ideal', name: 'Qué te parece', platform: 'instagram', variables: ['JORNADA'],
    template: '⭐️ 𝑺𝑰𝑬𝑻𝑬 𝑰𝑫𝑬𝑨𝑳 | JORNADA {JORNADA}\n👀 ¿Qué te parece? Te leemos en comentarios' },
  { id: '7i2', category: '7 Ideal', name: 'Quién debería estar', platform: 'instagram', variables: ['JORNADA'],
    template: '⭐️ 𝑺𝑰𝑬𝑻𝑬 𝑰𝑫𝑬𝑨𝑳 | JORNADA {JORNADA}\n🔥 ¿Quién debería estar sí o sí?' },
  { id: '7i3', category: '7 Ideal', name: 'Qué cambio harías', platform: 'instagram', variables: ['JORNADA'],
    template: '⭐️ 𝑺𝑰𝑬𝑻𝑬 𝑰𝑫𝑬𝑨𝑳 | JORNADA {JORNADA}\n💬 ¿Qué cambio harías?' },

  // TOP 5 GOLES
  { id: 'tg1', category: 'Top 5 Gols', name: 'Con cuál te quedas (IG)', platform: 'instagram', variables: ['JORNADA'],
    template: '𝑻𝑶𝑷 𝟓 𝑮𝑶𝑳𝑬𝑺 @decathlon_espana | JORNADA {JORNADA}\n\n👀 ¿Con cuál te quedas?' },
  { id: 'tg2', category: 'Top 5 Gols', name: 'Con cuál te quedas (TW)', platform: 'twitter', variables: ['JORNADA'],
    template: '𝑻𝑶𝑷 𝟓 𝑮𝑶𝑳𝑬𝑺 @decathlonespana | JORNADA {JORNADA}\n\n👀 ¿Con cuál te quedas?' },
  { id: 'tg3', category: 'Top 5 Gols', name: 'Favorito (IG)', platform: 'instagram', variables: ['JORNADA'],
    template: '𝑻𝑶𝑷 𝟓 𝑮𝑶𝑳𝑬𝑺 @decathlon_espana | JORNADA {JORNADA}\n\n👀 ¿Cuál es tu favorito?' },
  { id: 'tg4', category: 'Top 5 Gols', name: 'Favorito (TW)', platform: 'twitter', variables: ['JORNADA'],
    template: '𝑻𝑶𝑷 𝟓 𝑮𝑶𝑳𝑬𝑺 @decathlonespana | JORNADA {JORNADA}\n\n👀 ¿Cuál es tu favorito?' },
  { id: 'tg5', category: 'Top 5 Gols', name: 'Elige 1 2 3 (IG)', platform: 'instagram', variables: ['JORNADA'],
    template: '𝑻𝑶𝑷 𝟓 𝑮𝑶𝑳𝑬𝑺 @decathlon_espana | JORNADA {JORNADA}\n\n🗳️¿Cuál eliges: 1, 2, 3, 4 o 5?' },
  { id: 'tg6', category: 'Top 5 Gols', name: 'Elige 1 2 3 (TW)', platform: 'twitter', variables: ['JORNADA'],
    template: '𝑻𝑶𝑷 𝟓 𝑮𝑶𝑳𝑬𝑺 @decathlonespana | JORNADA {JORNADA}\n\n🗳️¿Cuál eliges: 1, 2, 3, 4 o 5?' },

  // TOP 5 PARADES
  { id: 'tp1', category: 'Top 5 Parades', name: 'Con cuál te quedas', platform: 'instagram', variables: ['JORNADA'],
    template: '🧤 𝑻𝑶𝑷 𝟓 𝑷𝑨𝑹𝑨𝑫𝑨𝑺 | JORNADA {JORNADA}\n\n👀 ¿Con cuál te quedas?' },
  { id: 'tp2', category: 'Top 5 Parades', name: 'Elige tu parada', platform: 'instagram', variables: ['JORNADA'],
    template: '🧤 𝑻𝑶𝑷 𝟓 𝑷𝑨𝑹𝑨𝑫𝑨𝑺 | JORNADA {JORNADA}\n\n🧱 ¿1, 2, 3, 4 o 5?\n\n👇🏻 ¡Elige tu parada favorita!' },
  { id: 'tp3', category: 'Top 5 Parades', name: 'Defiende a tu portero', platform: 'instagram', variables: ['JORNADA'],
    template: '🧤 𝑻𝑶𝑷 𝟓 𝑷𝑨𝑹𝑨𝑫𝑨𝑺 | JORNADA {JORNADA}\n\n🧱 ¿Qué afición se lleva la mejor parada de la jornada?\n\n👇🏻 ¡Defiende a tu portero!' },
  { id: 'tp4', category: 'Top 5 Parades', name: 'TOP 1', platform: 'instagram', variables: ['JORNADA'],
    template: '🧤 𝑻𝑶𝑷 𝟓 𝑷𝑨𝑹𝑨𝑫𝑨𝑺 | JORNADA {JORNADA}\n\n🔝 ¿Cuál es tu TOP 1?' },

  // IMAGEN JORNADA
  { id: 'ij1', category: 'Imatge jornada', name: 'La foto de la jornada v1', platform: 'instagram', variables: ['JORNADA','FOTOGRAF'],
    template: '📸 ¡𝑳𝑨 𝑭𝑶𝑻𝑶 𝑫𝑬 𝑳𝑨 𝑱𝑶𝑹𝑵𝑨𝑫𝑨!\nUna imagen. Toda una historia.\nJornada {JORNADA} by @artipubli' },
  { id: 'ij2', category: 'Imatge jornada', name: 'Un momento que lo dice todo', platform: 'instagram', variables: ['JORNADA','FOTOGRAF'],
    template: '👀 ¡𝑼𝑵 𝑴𝑶𝑴𝑬𝑵𝑻𝑶 𝑸𝑼𝑬 𝑳𝑶 𝑫𝑰𝑪𝑬 𝑻𝑶𝑫𝑶!\nLa foto de la Jornada {JORNADA} by @artipubli\n📸 {FOTOGRAF}' },
  { id: 'ij3', category: 'Imatge jornada', name: 'Un instante v3', platform: 'instagram', variables: ['JORNADA','FOTOGRAF'],
    template: '𝑼𝑵 𝑰𝑵𝑺𝑻𝑨𝑵𝑻𝑬. 𝑼𝑵𝑨 𝑯𝑰𝑺𝑻𝑶𝑹𝑰𝑨.\nLa foto de la jornada by @artipubli\n📸 {FOTOGRAF}' },
  { id: 'ij4', category: 'Imatge jornada', name: 'La foto v4', platform: 'instagram', variables: ['JORNADA','FOTOGRAF'],
    template: '¡𝑳𝑨 𝑭𝑶𝑻𝑶 𝑫𝑬 𝑳𝑨 𝑱𝑶𝑹𝑵𝑨𝑫𝑨 by @artipubli!\n\n📸 Foto de {FOTOGRAF}' },

  // MVP DEL MES
  { id: 'mm1', category: 'MVP del mes', name: 'Quién merece v1', platform: 'instagram', variables: ['MES'],
    template: '🏆 𝑴𝑽𝑷 @nexusenergia 𝑫𝑬𝑳 𝑴𝑬𝑺 | {MES}\n\n👀 ¿Quién merece llevarse el MVP?\n\n📲 Vota por tu favorito a través de nuestro canal de WhatsApp.' },
  { id: 'mm2', category: 'MVP del mes', name: 'Quién merece v2', platform: 'instagram', variables: ['MES'],
    template: '🏆 𝑴𝑽𝑷 @nexusenergia 𝑫𝑬𝑳 𝑴𝑬𝑺 | {MES}\n\n👀 ¿Quién merece ser el MVP de {MES}?\n📲 Entra en nuestro canal de WhatsApp y vota por tu favorito.' },
  { id: 'mm3', category: 'MVP del mes', name: 'Quién merece v3', platform: 'instagram', variables: ['MES'],
    template: '🏆 𝑴𝑽𝑷 @nexusenergia 𝑫𝑬𝑳 𝑴𝑬𝑺 | {MES}\n\n👀 ¿Quién merece llevarse el MVP?\n\n📲 Vota por tu favorito a través de nuestro canal de WhatsApp.' },
]

const CATEGORIES = Array.from(new Set(TEMPLATES.map(t => t.category)))

const VARIABLE_LABELS: Record<string, string> = {
  LOCAL: 'Equip local (sense @)',
  VISITANT: 'Equip visitant (sense @)',
  GOL_LOCAL: 'Gols local',
  GOL_VISITANT: 'Gols visitant',
  JORNADA: 'Número de jornada',
  MVP: 'Nom del MVP',
  MES: 'Mes (p.ex. OCTUBRE)',
  EQUIP: 'Handle equip (sense @)',
  JUGADOR: 'Handle jugador (sense @)',
  FOTOGRAF: 'Nom fotògraf',
}

const PLATFORM_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  instagram: { bg: 'rgba(214,58,145,0.10)', color: '#D63A91', label: 'Instagram' },
  twitter:   { bg: 'rgba(29,161,242,0.10)', color: '#1DA1F2', label: 'Twitter/X' },
  ambdues:   { bg: 'rgba(107,114,128,0.10)', color: '#6B7280', label: 'Ambdues' },
}

function generateCopy(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, val] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, val || `{${key}}`)
  }
  return result
}

export function AsobalCopys() {
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'instagram' | 'twitter'>('all')
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)
  const [vars, setVars] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  const filtered = useMemo(() => TEMPLATES.filter(t => {
    if (selectedCat && t.category !== selectedCat) return false
    if (selectedPlatform !== 'all' && t.platform !== selectedPlatform && t.platform !== 'ambdues') return false
    return true
  }), [selectedCat, selectedPlatform])

  const preview = activeTemplate ? generateCopy(activeTemplate.template, vars) : ''

  const handleSelectTemplate = (t: Template) => {
    setActiveTemplate(t)
    setVars({})
    setCopied(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(preview)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pl = activeTemplate ? PLATFORM_COLORS[activeTemplate.platform] : null

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      {/* Left: template list */}
      <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.08)', overflowY: 'auto', background: '#FAFAFA' }}>
        {/* Filters */}
        <div style={{ padding: '10px 10px 6px', borderBottom: '1px solid rgba(0,0,0,0.07)', position: 'sticky', top: 0, background: '#FAFAFA', zIndex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9AA5B4', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>Plataforma</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(['all', 'instagram', 'twitter'] as const).map(p => (
              <button key={p} onClick={() => setSelectedPlatform(p)}
                style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: selectedPlatform === p ? '#1b3bda' : 'rgba(0,0,0,0.06)',
                  color: selectedPlatform === p ? '#fff' : '#555' }}>
                {p === 'all' ? 'Totes' : p === 'instagram' ? 'IG' : 'TW'}
              </button>
            ))}
          </div>
        </div>

        {/* Category list */}
        <div style={{ padding: '8px 0' }}>
          <button onClick={() => setSelectedCat(null)}
            style={{ width: '100%', textAlign: 'left', padding: '7px 14px', background: selectedCat === null ? 'rgba(27,59,218,0.08)' : 'none',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: selectedCat === null ? 700 : 500,
              color: selectedCat === null ? '#1b3bda' : '#374151', borderLeft: selectedCat === null ? '2px solid #1b3bda' : '2px solid transparent' }}>
            Totes les categories
            <span style={{ float: 'right', fontSize: 11, color: '#9AA5B4', fontWeight: 400 }}>{filtered.length}</span>
          </button>
          {CATEGORIES.map(cat => {
            const count = TEMPLATES.filter(t => t.category === cat && (selectedPlatform === 'all' || t.platform === selectedPlatform || t.platform === 'ambdues')).length
            return (
              <button key={cat} onClick={() => setSelectedCat(cat === selectedCat ? null : cat)}
                style={{ width: '100%', textAlign: 'left', padding: '7px 14px', background: selectedCat === cat ? 'rgba(27,59,218,0.08)' : 'none',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: selectedCat === cat ? 700 : 500,
                  color: selectedCat === cat ? '#1b3bda' : '#374151', borderLeft: selectedCat === cat ? '2px solid #1b3bda' : '2px solid transparent',
                  transition: 'background .12s' }}>
                {cat}
                <span style={{ float: 'right', fontSize: 11, color: '#9AA5B4', fontWeight: 400 }}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Templates within selected category */}
        {selectedCat && (
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', padding: '6px 0' }}>
            {filtered.map(t => {
              const plStyle = PLATFORM_COLORS[t.platform]
              return (
                <button key={t.id} onClick={() => handleSelectTemplate(t)}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 14px', background: activeTemplate?.id === t.id ? 'rgba(27,59,218,0.06)' : 'none',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .1s',
                    borderLeft: activeTemplate?.id === t.id ? '2px solid #1b3bda' : '2px solid transparent' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{t.name}</div>
                  <span style={{ fontSize: 10.5, fontWeight: 600, background: plStyle.bg, color: plStyle.color, borderRadius: 4, padding: '1px 6px' }}>
                    {plStyle.label}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Right: template cards or generator */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, minWidth: 0 }}>
        {!selectedCat && !activeTemplate ? (
          /* Grid of all categories */
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Copy Library · {TEMPLATES.length} templates</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {CATEGORIES.map(cat => {
                const catTemplates = TEMPLATES.filter(t => t.category === cat)
                const igCount = catTemplates.filter(t => t.platform === 'instagram').length
                const twCount = catTemplates.filter(t => t.platform === 'twitter').length
                return (
                  <button key={cat} onClick={() => setSelectedCat(cat)}
                    style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 10, padding: '14px 16px',
                      textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{cat}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {igCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, background: PLATFORM_COLORS.instagram.bg, color: PLATFORM_COLORS.instagram.color, borderRadius: 4, padding: '2px 6px' }}>IG ×{igCount}</span>}
                      {twCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, background: PLATFORM_COLORS.twitter.bg, color: PLATFORM_COLORS.twitter.color, borderRadius: 4, padding: '2px 6px' }}>TW ×{twCount}</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : activeTemplate ? (
          /* Generator */
          <div style={{ maxWidth: 560 }}>
            <button onClick={() => setActiveTemplate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9CA3AF', fontFamily: 'inherit', marginBottom: 12, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              ← Tornar
            </button>
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {/* Header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{activeTemplate.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{activeTemplate.category}</div>
                </div>
                {pl && <span style={{ fontSize: 11, fontWeight: 600, background: pl.bg, color: pl.color, borderRadius: 5, padding: '3px 8px', flexShrink: 0 }}>{pl.label}</span>}
              </div>

              {/* Variables */}
              {activeTemplate.variables.length > 0 && (
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F0' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Variables</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activeTemplate.variables.map(v => (
                      <div key={v}>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                          {VARIABLE_LABELS[v] ?? v}
                        </label>
                        <input
                          value={vars[v] ?? ''}
                          onChange={e => setVars(prev => ({ ...prev, [v]: e.target.value }))}
                          placeholder={`{${v}}`}
                          style={{ width: '100%', padding: '7px 10px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 7,
                            fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                            background: '#FAFAFA', color: '#111827' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Previsualització</div>
                <div style={{ background: '#F8F9FA', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#111827', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontFamily: 'inherit', minHeight: 60 }}>
                  {preview}
                </div>
              </div>

              {/* Copy button */}
              <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                <button onClick={handleCopy}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    height: 40, borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 13, fontWeight: 700,
                    background: copied ? '#059669' : 'linear-gradient(135deg,#1b3bda 0%,#131ea6 100%)',
                    color: '#fff', transition: 'background .2s' }}>
                  {copied ? <><Check size={15} /> Copy copiat!</> : <><Copy size={15} /> Copiar copy</>}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Template list for selected category (no template selected) */
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>{selectedCat}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(t => {
                const plStyle = PLATFORM_COLORS[t.platform]
                return (
                  <button key={t.id} onClick={() => handleSelectTemplate(t)}
                    style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 10, padding: '12px 16px',
                      textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 6 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'pre-wrap', lineHeight: 1.5, overflow: 'hidden',
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any }}>
                        {t.template}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 600, background: plStyle.bg, color: plStyle.color, borderRadius: 4, padding: '2px 7px' }}>
                        {plStyle.label}
                      </span>
                      <span style={{ fontSize: 10, color: '#9CA3AF' }}>{t.variables.length} vars</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
