'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Copy, Check, ArrowLeft } from 'lucide-react'

type MatchData = { home: string; away: string }
type JornadaData = { date: string; matches: MatchData[] }
type Player = { num: string; name: string; pos: string }

interface AsobalSeteProps {
  calendar: JornadaData[]
  players: Record<string, Player[]>
  teams: Record<string, string>
}

const POS_ORDER = ['PO', 'EI', 'LI', 'CE', 'LD', 'ED', 'PI']
const POS_LABEL: Record<string, string> = {
  PO: 'Porter', EI: 'Extrem esq.', LI: 'Lateral esq.', CE: 'Central',
  LD: 'Lateral dret', ED: 'Extrem dret', PI: 'Pivot',
}
const POS_COLOR: Record<string, string> = {
  PO: '#7c6fe0', EI: '#e07c6f', LI: '#6f9ee0', CE: '#1b3bda',
  LD: '#6fb3e0', ED: '#e09a6f', PI: '#16a34a',
}
const TEAM_LOGOS: Record<string, string> = {
  LOG: '/team-log.svg', BAR: '/team-bar.svg', GRA: '/team-gra.svg', CAN: '/team-can.svg',
  BID: '/team-bid.svg', NAV: '/team-nav.svg', ALI: '/team-ali.svg', TLV: '/team-tlv.svg',
  VDA: '/team-vda.png', CAS: '/team-cas.svg', CQN: '/team-cqn.svg', ATV: '/team-atv.svg',
  SEV: '/team-sev.svg', PGE: '/team-pge.svg', PSG: '/team-psg.svg', ADE: '/team-ade.svg',
}

function TeamLogo({ code, name, size = 28 }: { code: string; name: string; size?: number }) {
  const logo = TEAM_LOGOS[code]
  return logo
    ? <img src={logo} alt={name} style={{ width: size, height: size, objectFit: 'contain', display: 'block', flexShrink: 0 }} />
    : <span style={{ width: size, height: size, background: '#E8ECF4', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: '#9AA5B4', flexShrink: 0 }}>{code}</span>
}

type Lineup = Partial<Record<string, string>>

function nearestJornadaIdx(calendar: JornadaData[]) {
  const today = new Date()
  let best = 0, bestDiff = Infinity
  calendar.forEach((j, i) => {
    const [d, m, y] = j.date.split('/')
    const jDate = new Date(+y, +m - 1, +d)
    const diff = Math.abs(jDate.getTime() - today.getTime())
    if (diff < bestDiff) { best = i; bestDiff = diff }
  })
  return best
}

export function AsobalSete({ calendar, players, teams }: AsobalSeteProps) {
  const [jornadaIdx, setJornadaIdx] = useState(() => nearestJornadaIdx(calendar))
  const [matchIdx, setMatchIdx] = useState<number | null>(null)
  const [side, setSide] = useState<'home' | 'away' | null>(null)
  const [lineups, setLineups] = useState<Record<string, Lineup>>({})
  const [copied, setCopied] = useState(false)

  const jornada = calendar[jornadaIdx]
  const jornadaNum = jornadaIdx + 1
  const match = matchIdx !== null ? jornada.matches[matchIdx] : null
  const teamCode = match ? (side === 'home' ? match.home : side === 'away' ? match.away : null) : null
  const lineupKey = matchIdx !== null && side ? `j${jornadaNum}m${matchIdx + 1}_${side}` : null
  const lineup: Lineup = lineupKey ? (lineups[lineupKey] ?? {}) : {}
  const teamPlayers = teamCode ? (players[teamCode] ?? []) : []
  const selectedCount = POS_ORDER.filter(p => lineup[p]).length

  const setPlayer = (pos: string, name: string) => {
    if (!lineupKey) return
    setLineups(l => {
      const prev = l[lineupKey] ?? {}
      return { ...l, [lineupKey]: { ...prev, [pos]: prev[pos] === name ? undefined : name } }
    })
  }

  const formatLineup = () => {
    if (!match || !teamCode) return ''
    const home = teams[match.home] || match.home
    const away = teams[match.away] || match.away
    const teamName = teams[teamCode] || teamCode
    const lines: string[] = [
      `7️⃣ 7 INICIAL | ${home} - ${away}`,
      `🔴 ${teamName}`,
      '',
    ]
    POS_ORDER.forEach(pos => {
      const name = lineup[pos]
      if (name) {
        const p = teamPlayers.find(pl => pl.name === name)
        lines.push(`${POS_LABEL[pos]}: ${p?.num ? `#${p.num} ` : ''}${name}`)
      }
    })
    return lines.join('\n')
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatLineup())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const changeJornada = (delta: number) => {
    setJornadaIdx(i => Math.max(0, Math.min(calendar.length - 1, i + delta)))
    setMatchIdx(null)
    setSide(null)
  }

  const goBack = () => {
    if (side !== null) { setSide(null); return }
    setMatchIdx(null)
  }

  const btn: React.CSSProperties = {
    background: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 7,
    cursor: 'pointer', padding: '5px 8px', display: 'flex', alignItems: 'center', color: '#374151',
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

      {/* Top navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, minHeight: 44 }}>
        {matchIdx !== null ? (
          <>
            <button onClick={goBack} style={{ ...btn, gap: 4, fontSize: 13, padding: '6px 10px' }}>
              <ArrowLeft size={14} /> Tornar
            </button>
            <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#374151' }}>
              J{jornadaNum} · {teams[match!.home]} – {teams[match!.away]}
            </div>
            <div style={{ width: 70 }} />
          </>
        ) : (
          <>
            <button onClick={() => changeJornada(-1)} disabled={jornadaIdx === 0} style={{ ...btn, opacity: jornadaIdx === 0 ? 0.35 : 1, cursor: jornadaIdx === 0 ? 'not-allowed' : 'pointer' }}>
              <ChevronLeft size={16} />
            </button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Jornada {jornadaNum}</div>
              <div style={{ fontSize: 11, color: '#9AA5B4', marginTop: 1 }}>{jornada.date}</div>
            </div>
            <button onClick={() => changeJornada(1)} disabled={jornadaIdx === calendar.length - 1} style={{ ...btn, opacity: jornadaIdx === calendar.length - 1 ? 0.35 : 1, cursor: jornadaIdx === calendar.length - 1 ? 'not-allowed' : 'pointer' }}>
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* Match list */}
      {matchIdx === null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {jornada.matches.map((m, i) => {
            const hk = `j${jornadaNum}m${i + 1}_home`
            const ak = `j${jornadaNum}m${i + 1}_away`
            const hd = POS_ORDER.filter(p => (lineups[hk] ?? {})[p]).length
            const ad = POS_ORDER.filter(p => (lineups[ak] ?? {})[p]).length
            const hasData = hd > 0 || ad > 0
            return (
              <button
                key={i}
                onClick={() => setMatchIdx(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}
              >
                <TeamLogo code={m.home} name={teams[m.home] || m.home} size={26} />
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#111827' }}>
                  {teams[m.home] || m.home}
                  <span style={{ color: '#9AA5B4', fontWeight: 400, margin: '0 6px' }}>vs</span>
                  {teams[m.away] || m.away}
                </div>
                <TeamLogo code={m.away} name={teams[m.away] || m.away} size={26} />
                {hasData && (
                  <span style={{ fontSize: 10, color: hd === 7 && ad === 7 ? '#16a34a' : '#6B7280', flexShrink: 0, marginLeft: 4 }}>
                    {hd}/7 · {ad}/7
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Team selector + lineup builder */}
      {matchIdx !== null && match && (
        <div>
          {/* Team tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['home', 'away'] as const).map(s => {
              const code = s === 'home' ? match.home : match.away
              const lk = `j${jornadaNum}m${matchIdx + 1}_${s}`
              const done = POS_ORDER.filter(p => (lineups[lk] ?? {})[p]).length
              const active = side === s
              return (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                    background: active ? 'rgba(27,59,218,0.06)' : '#fff',
                    border: `2px solid ${active ? '#1b3bda' : 'rgba(0,0,0,0.08)'}`,
                    borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                  }}
                >
                  <TeamLogo code={code} name={teams[code] || code} size={32} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{teams[code] || code}</div>
                    <div style={{ fontSize: 11, color: done === 7 ? '#16a34a' : '#9AA5B4' }}>
                      {done === 7 ? '✓ Complet' : `${done}/7 jugadors`}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Lineup builder */}
          {side && teamCode && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
                  {selectedCount === 7
                    ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ 7 inicial complet</span>
                    : <>{selectedCount}/7 jugadors seleccionats</>}
                </div>
                {selectedCount >= 1 && (
                  <button
                    onClick={handleCopy}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: selectedCount === 7 ? '#1b3bda' : '#6B7280', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
                  >
                    {copied ? <><Check size={13} /> Copiat!</> : <><Copy size={13} /> Copiar text</>}
                  </button>
                )}
              </div>

              {/* Position slots */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {POS_ORDER.map(pos => {
                  const posPlayers = teamPlayers.filter(p => p.pos === pos)
                  const selected = lineup[pos]
                  return (
                    <div key={pos} style={{ background: '#fff', border: `1px solid ${selected ? POS_COLOR[pos] + '40' : 'rgba(0,0,0,0.08)'}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color .15s' }}>
                      {/* Position header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: selected ? POS_COLOR[pos] + '12' : '#fafafa' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: POS_COLOR[pos] || '#6B7280', borderRadius: 4, padding: '2px 6px', letterSpacing: '.04em', flexShrink: 0 }}>{pos}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', flex: 1 }}>{POS_LABEL[pos] || pos}</span>
                        {selected && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: POS_COLOR[pos] }}>
                            {(() => {
                              const p = teamPlayers.find(pl => pl.name === selected)
                              return p?.num ? `#${p.num} ${selected}` : selected
                            })()}
                          </span>
                        )}
                      </div>
                      {/* Player pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '7px 10px' }}>
                        {posPlayers.length === 0 && (
                          <span style={{ fontSize: 11, color: '#9AA5B4', padding: '2px 0' }}>Sense jugadors disponibles</span>
                        )}
                        {posPlayers.map(p => {
                          const isSelected = selected === p.name
                          return (
                            <button
                              key={p.num + p.name}
                              onClick={() => setPlayer(pos, p.name)}
                              style={{
                                padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, transition: 'all .1s',
                                background: isSelected ? POS_COLOR[pos] || '#1b3bda' : 'rgba(0,0,0,0.05)',
                                color: isSelected ? '#fff' : '#374151',
                              }}
                            >
                              {p.num && <span style={{ opacity: 0.7, marginRight: 3 }}>#{p.num}</span>}{p.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Preview */}
              {selectedCount > 0 && (
                <div style={{ marginTop: 14, padding: '14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Preview text</div>
                  <pre style={{ fontSize: 12, fontFamily: 'inherit', color: '#374151', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{formatLineup()}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
