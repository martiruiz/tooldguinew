'use client'

import { useEffect } from 'react'
import type { JarvisVoiceState, HistoryItem } from '@/hooks/useJarvisVoice'

// ── Holographic blue/cyan sphere — Jarvis UI ─────────────────────────────────
const CYAN       = '#00d4ff'
const CYAN_BRIGHT= '#7ef8ff'
const CYAN_DIM   = '#0066aa'
const BLUE_GLOW  = '#0044cc'

const W = 900, H = 560
const CX = 450, CY = 270
const SR = 88   // sphere radius

// Guinew agent constellation — organic scatter, not symmetric
const ROSTER: Array<[string, string, number, number]> = [
  ['orchestrator', 'Orchestrator',  178, 118],
  ['estrategia',   'Estratègia',    696,  98],
  ['analytics',    'Analytics',     768, 206],
  ['finances',     'Finances',      740, 375],
  ['comercial',    'Comercial',     604, 458],
  ['campanyes',    'Campanyes',     284, 462],
  ['contingut',    'Contingut',     148, 384],
  ['xarxes',       'Xarxes',         96, 238],
  ['email',        'Email',          138, 130],
  ['crm',          'CRM',            565, 126],
  ['clients',      'Clients',        350,  86],
  ['tasques',      'Tasques',        650, 290],
  ['memoria',      'Memòria',        386, 492],
  ['qualitat',     'Qualitat',       502, 468],
  ['briefing',     'Briefing',       196, 280],
]

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@keyframes jSphereBreath {
  0%,100%{opacity:.85;transform:scale(1)}
  50%{opacity:1;transform:scale(1.04)}
}
@keyframes jSphereGlow {
  0%,100%{opacity:.55}
  50%{opacity:.85}
}
@keyframes jRotateCW  {from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes jRotateCCW {from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
.jsphere-core  {animation:jSphereBreath 3.2s ease-in-out infinite;transform-origin:${CX}px ${CY}px}
.jsphere-glow  {animation:jSphereGlow 3.2s ease-in-out infinite}
.jsphere-glow2 {animation:jSphereGlow 4s ease-in-out .8s infinite}
.jorbit-cw     {animation:jRotateCW 6s linear infinite;transform-origin:${CX}px ${CY}px}
.jorbit-ccw    {animation:jRotateCCW 4s linear infinite;transform-origin:${CX}px ${CY}px}
.jorbit-slow   {animation:jRotateCW 14s linear infinite;transform-origin:${CX}px ${CY}px}

@keyframes jPulseRing {
  0%{r:${SR};opacity:.4;stroke-width:1.2}
  70%{opacity:.04}
  100%{r:${SR + 85};opacity:0;stroke-width:.3}
}
@keyframes jPulseRingActive {
  0%{r:${SR};opacity:.7;stroke-width:2}
  70%{opacity:.12}
  100%{r:${SR + 110};opacity:0;stroke-width:.4}
}
.jpulse{animation:jPulseRing 3.5s ease-out infinite}
.jpulse-1{animation-delay:.9s}.jpulse-2{animation-delay:1.8s}.jpulse-3{animation-delay:2.7s}

.jarvis-sphere[data-state="listening"] .jpulse,
.jarvis-sphere[data-state="speaking"]  .jpulse,
.jarvis-sphere[data-state="thinking"]  .jpulse {
  animation-name:jPulseRingActive;animation-duration:2s
}

/* listening — sphere grows */
@keyframes jListenGrow {
  0%{transform:scale(1)}
  30%{transform:scale(1.14)}
  100%{transform:scale(1.12)}
}
@keyframes jListenPulse {0%,100%{transform:scale(1.12)}50%{transform:scale(1.06)}}
.jarvis-sphere[data-state="listening"] .jsphere-core {
  animation:jListenGrow .8s cubic-bezier(.22,1,.36,1) forwards,
            jListenPulse 2.2s ease-in-out 1s infinite;
  transform-origin:${CX}px ${CY}px
}
.jarvis-sphere[data-state="listening"] .jorbit-cw  {animation-duration:3s}
.jarvis-sphere[data-state="listening"] .jorbit-ccw {animation-duration:2s}

/* thinking — faster spin */
.jarvis-sphere[data-state="thinking"] .jorbit-cw  {animation-duration:2s}
.jarvis-sphere[data-state="thinking"] .jorbit-ccw {animation-duration:1.2s}

/* speaking — glow intensifies */
.jarvis-sphere[data-state="speaking"] .jsphere-glow {opacity:.95!important;animation-duration:1s}

/* node pulse */
@keyframes jNodePulse{0%,100%{opacity:.5}50%{opacity:1}}
.jnode-on{animation:jNodePulse .9s ease-in-out infinite}

/* waveform bars */
@keyframes jBar{0%,100%{transform:scaleY(.3);opacity:.4}50%{transform:scaleY(1);opacity:.9}}
.jbar{transform-box:fill-box;transform-origin:center;animation:jBar .9s ease-in-out infinite}
.jb0{animation-delay:0s}.jb1{animation-delay:.1s}.jb2{animation-delay:.2s}.jb3{animation-delay:.3s}
.jb4{animation-delay:.4s}.jb5{animation-delay:.5s}.jb6{animation-delay:.6s}.jb7{animation-delay:.7s}
`

function injectCSS() {
  if (typeof document === 'undefined') return
  if (document.getElementById('jarvis-sphere-css')) return
  const s = document.createElement('style')
  s.id = 'jarvis-sphere-css'
  s.textContent = CSS
  document.head.appendChild(s)
}

// ── Waveform ──────────────────────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  const count = 22, bw = 2.4, gap = 3.2
  const totalW = count * bw + (count - 1) * gap
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const x = CX - totalW / 2 + i * (bw + gap)
        const h = active ? 8 + Math.abs(Math.sin(i * 0.75)) * 22 : 2 + Math.abs(Math.sin(i * 0.6)) * 3
        return (
          <rect key={i}
            x={x} y={CY - h / 2}
            width={bw} height={h}
            rx={1.2} fill={CYAN}
            opacity={active ? 0.82 : 0.15}
            className={`jbar jb${i % 8}`}
          />
        )
      })}
    </g>
  )
}

// ── Holographic sphere ────────────────────────────────────────────────────────
function JarvisOrb({ state }: { state: JarvisVoiceState }) {
  const isActive    = state !== 'idle'
  const isThinking  = state === 'thinking'
  const LABELS = { idle: 'STANDBY', listening: 'ESCOLTANT', thinking: 'PROCESSANT', speaking: 'PARLANT' }

  return (
    <g className="jarvis-sphere" data-state={state}>
      <defs>
        {/* sphere fill: bright cyan core → transparent */}
        <radialGradient id="jSphFill" cx="42%" cy="38%" r="60%">
          <stop offset="0%"   stopColor={CYAN_BRIGHT} stopOpacity="0.95" />
          <stop offset="22%"  stopColor={CYAN}        stopOpacity="0.78" />
          <stop offset="55%"  stopColor="#0088dd"     stopOpacity="0.45" />
          <stop offset="80%"  stopColor="#003399"     stopOpacity="0.18" />
          <stop offset="100%" stopColor="#001133"     stopOpacity="0" />
        </radialGradient>
        {/* outer ambient glow */}
        <radialGradient id="jAmbFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={BLUE_GLOW} stopOpacity="0.28" />
          <stop offset="100%" stopColor={BLUE_GLOW} stopOpacity="0" />
        </radialGradient>
        {/* deep background glow behind everything */}
        <radialGradient id="jBgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#002266" stopOpacity="0.55" />
          <stop offset="60%"  stopColor="#001133" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000814" stopOpacity="0" />
        </radialGradient>

        <filter id="jBlur6"  x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="jBlur14" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id="jBlur28" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="28" />
        </filter>
        <filter id="jGlow2" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="jTxtGlow" x="-40%" y="-100%" width="180%" height="300%">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* deep scene background glow */}
      <ellipse cx={CX} cy={CY} rx={280} ry={210}
        fill="url(#jBgGlow)" />

      {/* pulse rings */}
      {[0, 1, 2, 3].map(i => (
        <circle key={i} cx={CX} cy={CY} r={SR}
          stroke={CYAN} strokeWidth={isActive ? 1.8 : 1} fill="none"
          opacity={isActive ? 0.6 : 0.3}
          className={`jpulse jpulse-${i}`}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        />
      ))}

      {/* outer rings: concentric, decreasing opacity */}
      {[SR + 24, SR + 44, SR + 68, SR + 96].map((r, i) => (
        <circle key={r} cx={CX} cy={CY} r={r}
          stroke={CYAN_DIM}
          strokeWidth={i === 0 ? 0.7 : 0.4}
          strokeOpacity={0.14 - i * 0.025}
          fill="none"
          strokeDasharray={i % 2 ? '4 9' : undefined}
        />
      ))}

      {/* ambient outer glow blob */}
      <ellipse cx={CX} cy={CY} rx={SR + 60} ry={SR + 45}
        fill="url(#jAmbFill)"
        className="jsphere-glow2"
      />

      {/* soft sphere blur halo */}
      <circle cx={CX} cy={CY} r={SR + 10}
        fill={BLUE_GLOW} opacity={isActive ? 0.35 : 0.18}
        filter="url(#jBlur14)" className="jsphere-glow" />
      <circle cx={CX} cy={CY} r={SR - 6}
        fill={CYAN} opacity={isActive ? 0.25 : 0.12}
        filter="url(#jBlur28)" className="jsphere-glow" />

      {/* main sphere fill */}
      <circle cx={CX} cy={CY} r={SR}
        fill="url(#jSphFill)" className="jsphere-core" />

      {/* sphere rim edge glow */}
      <circle cx={CX} cy={CY} r={SR}
        stroke={CYAN_BRIGHT} strokeWidth="1.8"
        strokeOpacity={isActive ? 0.75 : 0.45}
        fill="none"
        filter="url(#jBlur6)" />
      <circle cx={CX} cy={CY} r={SR}
        stroke={CYAN_BRIGHT} strokeWidth="0.9"
        strokeOpacity={isActive ? 0.9 : 0.6}
        fill="none" />

      {/* inner highlight arc (top-left "shine") */}
      <path
        d={`M ${CX - SR * 0.5} ${CY - SR * 0.72}
            A ${SR * 0.65} ${SR * 0.55} 0 0 1 ${CX + SR * 0.28} ${CY - SR * 0.82}`}
        stroke={CYAN_BRIGHT} strokeWidth="2.2"
        strokeOpacity={isActive ? 0.55 : 0.3}
        fill="none" strokeLinecap="round"
      />

      {/* rotating orbit rings */}
      <circle cx={CX} cy={CY} r={SR * 0.62}
        stroke={CYAN} strokeWidth="0.9"
        strokeOpacity={isActive ? 0.35 : 0.1}
        fill="none" strokeDasharray="40 20"
        className="jorbit-cw" />
      <circle cx={CX} cy={CY} r={SR * 0.38}
        stroke={CYAN} strokeWidth="0.7"
        strokeOpacity={isActive ? 0.28 : 0.08}
        fill="none" strokeDasharray="20 14"
        className="jorbit-ccw" />

      {/* slow outer orbit dashes */}
      <circle cx={CX} cy={CY} r={SR + 14}
        stroke={CYAN_DIM} strokeWidth="0.5"
        strokeOpacity={isActive ? 0.22 : 0.06}
        fill="none" strokeDasharray="6 18"
        className="jorbit-slow" />

      {/* thinking dashed ring */}
      {isThinking && (
        <circle cx={CX} cy={CY} r={SR + 26}
          stroke={CYAN_BRIGHT} strokeWidth="1"
          strokeOpacity="0.45" strokeDasharray="8 14"
          fill="none"
          className="jorbit-cw"
          style={{ animationDuration: '2s', transformOrigin: `${CX}px ${CY}px` }} />
      )}

      {/* waveform bars inside sphere */}
      <Waveform active={isActive} />

      {/* core bright dot */}
      <circle cx={CX} cy={CY - 6} r={4.5}
        fill={CYAN_BRIGHT} opacity={isActive ? 0.98 : 0.65}
        style={{ filter: `drop-shadow(0 0 10px ${CYAN_BRIGHT})` }} />

      {/* state label below sphere */}
      <text x={CX} y={CY + SR + 22} textAnchor="middle"
        fill={CYAN} fontSize="9.5" fontFamily="'Inter',monospace"
        fontWeight="400" letterSpacing="0.28em" opacity="0.55"
        filter="url(#jTxtGlow)">
        {LABELS[state]}
      </text>

      {/* crosshair ticks */}
      {[
        [CX, CY - SR - 16, CX, CY - SR - 4],
        [CX, CY + SR + 4,  CX, CY + SR + 16],
        [CX - SR - 16, CY, CX - SR - 4, CY],
        [CX + SR + 4,  CY, CX + SR + 16, CY],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={CYAN} strokeWidth="0.9" opacity="0.28" />
      ))}
    </g>
  )
}

// ── Agent nodes web ───────────────────────────────────────────────────────────
function AgentWeb({ state }: { state: JarvisVoiceState }) {
  const isActive = state !== 'idle'
  return (
    <g>
      {ROSTER.map(([id, label, nx, ny]) => {
        const dx = nx - CX, dy = ny - CY
        const len = Math.hypot(dx, dy)
        const bend = len * 0.15
        const mx = (CX + nx) / 2, my = (CY + ny) / 2
        const perpX = (-dy / len) * bend, perpY = (dx / len) * bend
        const d = `M${CX} ${CY} Q${mx + perpX} ${my + perpY} ${nx} ${ny}`

        // anchor point on sphere surface
        const sx = CX + (dx / len) * SR, sy = CY + (dy / len) * SR

        return (
          <g key={id}>
            {/* spoke from sphere edge */}
            <path d={`M${sx} ${sy} Q${mx + perpX} ${my + perpY} ${nx} ${ny}`}
              stroke={CYAN} strokeWidth="1.4" fill="none"
              opacity={isActive ? 0.28 : 0.1}
              style={{ filter: 'url(#jGlow2)' }} />
            <path d={`M${sx} ${sy} Q${mx + perpX} ${my + perpY} ${nx} ${ny}`}
              stroke={CYAN} strokeWidth="0.6" fill="none"
              opacity={isActive ? 0.55 : 0.18}
              strokeDasharray="4 5" />

            {/* node halo */}
            <circle cx={nx} cy={ny} r={16}
              fill={CYAN} opacity="0.05"
              style={{ filter: 'url(#jBlur6)' }} />
            {/* node dot */}
            <circle cx={nx} cy={ny} r={5.5}
              fill="#020d1f" stroke={CYAN} strokeWidth="1.2"
              strokeOpacity={isActive ? 0.85 : 0.35}
              className={isActive ? 'jnode-on' : undefined} />
            <circle cx={nx} cy={ny} r={2.5}
              fill={CYAN_BRIGHT} opacity={isActive ? 0.95 : 0.3}
              style={{ filter: `drop-shadow(0 0 4px ${CYAN})` }} />

            {/* label */}
            <text x={nx} y={ny + 18} textAnchor="middle"
              fill={CYAN} fontSize="9" fontFamily="'Inter',monospace"
              fontWeight="500" letterSpacing="0.06em"
              opacity={isActive ? 0.78 : 0.32}
              style={{ filter: isActive ? 'url(#jTxtGlow)' : undefined }}>
              {label}
            </text>
          </g>
        )
      })}
    </g>
  )
}

// ── Public component ──────────────────────────────────────────────────────────
export function JarvisNodeCanvas({
  open, state, error, onClose,
}: {
  open: boolean
  state: JarvisVoiceState
  transcript: string
  history: HistoryItem[]
  error: string
  getAmplitude: () => number
  onClose: () => void
  onSend: (text: string) => void
}) {
  useEffect(() => { injectCSS() }, [])

  const handleOrbClick = () => {
    if (open) {
      onClose()
    } else {
      window.dispatchEvent(new Event('openJarvis'))
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
      <svg
        width="100%" height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      >
        {/* Agent web — no pointer events */}
        <g style={{ pointerEvents: 'none' }}>
          <AgentWeb state={state} />
        </g>

        {/* Sphere — no pointer events */}
        <g style={{ pointerEvents: 'none' }}>
          <JarvisOrb state={state} />
        </g>

        {/* Click target */}
        <circle
          cx={CX} cy={CY} r={SR + 10}
          fill="transparent" stroke="none"
          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          onClick={handleOrbClick}
        />

        {/* idle hint */}
        {state === 'idle' && (
          <text x={CX} y={CY - SR - 22} textAnchor="middle"
            fill={CYAN} fontSize="9" fontFamily="'Inter',monospace"
            fontWeight="500" letterSpacing="0.2em" opacity="0.45"
            style={{ pointerEvents: 'none' }}>
            TOCA PER ACTIVAR
          </text>
        )}

        {/* error badge */}
        {error && (
          <foreignObject x={CX - 120} y={CY + SR + 30} width={240} height={48}
            style={{ pointerEvents: 'none' }}>
            <div style={{
              fontSize: 9, color: '#f87171', textAlign: 'center',
              padding: '4px 8px', background: 'rgba(239,68,68,0.12)',
              borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)',
              fontFamily: 'Inter,monospace',
            }}>{error}</div>
          </foreignObject>
        )}
      </svg>
    </div>
  )
}
