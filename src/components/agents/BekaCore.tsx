'use client'

import { useEffect, useRef } from 'react'
import type { JarvisVoiceState } from '@/hooks/useJarvisVoice'

export type BekaState = JarvisVoiceState | 'executing'

const LEFT_IDS  = ['memory', 'automation', 'email', 'analytics']
const RIGHT_IDS = ['tasks', 'crm', 'strategy', 'finances', 'content']

const STATE_LABEL: Record<BekaState, string> = {
  idle: 'BEKA · STANDBY', listening: 'BEKA · LISTENING',
  thinking: 'BEKA · PROCESSING', speaking: 'BEKA · SPEAKING', executing: 'BEKA · EXECUTING',
}
const STATE_SUB: Record<BekaState, string> = {
  idle: 'Ready', listening: 'Listening...', thinking: 'Analysing request...',
  speaking: 'Generating response', executing: 'Coordinating agents...',
}
const STATE_COLOR: Record<BekaState, string> = {
  idle: 'rgba(42,58,82,0.7)', listening: '#00C8FF', thinking: '#F59E0B',
  speaking: '#22C55E', executing: '#00C8FF',
}

interface BekaCoreProps {
  state: BekaState
  activeAgents: string[]
  amplitudeRef: React.MutableRefObject<number>
  audioElRef?: React.MutableRefObject<HTMLAudioElement | null>
  reducedMotion?: boolean
  // Ref written by AgentRadial3D every frame with the desired display size in px
  sizeRef?: React.MutableRefObject<number>
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

export function BekaCore({
  state, activeAgents, amplitudeRef, audioElRef,
  reducedMotion = false, sizeRef,
}: BekaCoreProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const stateRef    = useRef(state)
  const activeRef   = useRef(activeAgents)
  const frameRef    = useRef(0)
  const speakAmpRef = useRef(0)

  useEffect(() => { stateRef.current  = state },        [state])
  useEffect(() => { activeRef.current = activeAgents }, [activeAgents])

  // Speaker audio reactivity
  useEffect(() => {
    if (state !== 'speaking') { speakAmpRef.current = 0; return }
    let rafId = 0
    let speakCtx: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let data: Uint8Array | null = null
    let lastAudio: HTMLAudioElement | null = null

    const tryConnect = (audio: HTMLAudioElement) => {
      if (!speakCtx) speakCtx = new AudioContext()
      if (speakCtx.state === 'suspended') speakCtx.resume()
      analyser = speakCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.7
      data = new Uint8Array(analyser.frequencyBinCount) as unknown as Uint8Array
      try {
        const src = speakCtx.createMediaElementSource(audio)
        src.connect(analyser)
        analyser.connect(speakCtx.destination)
        lastAudio = audio
      } catch { /* already connected */ }
    }

    const poll = () => {
      if (audioElRef?.current && audioElRef.current !== lastAudio) tryConnect(audioElRef.current)
      if (analyser && data) {
        analyser.getByteTimeDomainData(data as Uint8Array<ArrayBuffer>)
        let peak = 0
        for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128))
        speakAmpRef.current = peak / 128
      }
      rafId = requestAnimationFrame(poll)
    }
    poll()
    return () => { cancelAnimationFrame(rafId); speakCtx?.close(); speakAmpRef.current = 0 }
  }, [state]) // eslint-disable-line

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 3)

    // Dynamic canvas sizing — resizes without restarting the loop
    let curSize = sizeRef?.current ?? 300

    const applySize = (s: number) => {
      const px = Math.round(s * dpr)
      canvas.width  = px
      canvas.height = px
      canvas.style.width  = s + 'px'
      canvas.style.height = s + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    applySize(curSize)

    // Particles stored as unit-space offsets (relative to base 300px canvas)
    type Pt = { x: number; y: number; vx: number; vy: number; r: number; op: number }
    const N = reducedMotion ? 0 : 38
    const particles: Pt[] = Array.from({ length: N }, () => {
      const a = Math.random() * Math.PI * 2
      const d = 70 + Math.random() * 100
      return { x: Math.cos(a)*d, y: Math.sin(a)*d, vx: (Math.random()-0.5)*0.14, vy: (Math.random()-0.5)*0.14, r: 0.7+Math.random()*1.2, op: 0.15+Math.random()*0.35 }
    })

    let coreScale = 1, coreGlow = 0.2, orbSpeed = 0.0006, ptSpeed = 0.4, waveAmp = 0
    let ring1Ang = 0, ring2Ang = Math.PI / 3, ring3Ang = Math.PI * 0.9
    let breathPhase = 0, pulsePhase = 0, execPulse = 0

    const getTargets = () => {
      const s    = stateRef.current
      const mAmp = Math.min(amplitudeRef.current / 255, 1)
      const sAmp = speakAmpRef.current
      switch (s) {
        case 'listening': return { scale: 1+mAmp*0.12, glow: 0.45+mAmp*0.35, orbS: 0.0014, ptS: 1,         wAmp: mAmp }
        case 'thinking':  return { scale: 1.07,        glow: 0.65,           orbS: 0.003,  ptS: 2,         wAmp: 0.35 }
        case 'speaking':  return { scale: 1+sAmp*0.18, glow: 0.55+sAmp*0.45, orbS: 0.0018, ptS: 1.2+sAmp, wAmp: sAmp }
        case 'executing': return { scale: 1.05,        glow: 0.6,            orbS: 0.002,  ptS: 1.5,       wAmp: 0.35 }
        default:          return { scale: 1,           glow: 0.18,           orbS: 0.0006, ptS: 0.35,      wAmp: 0 }
      }
    }

    const draw = (ts: number) => {
      frameRef.current = requestAnimationFrame(draw)

      // ── Dynamic resize: update canvas if desired size changed ──────────────
      const desired = Math.round(Math.min(540, Math.max(80, sizeRef?.current ?? 300)))
      if (Math.abs(desired - curSize) > 1) {
        curSize = desired
        applySize(curSize)
      }

      // All drawing in "logical" units scaled by U (U=1 at base 300px size)
      const U  = curSize / 300
      const CX = curSize / 2
      const CY = curSize / 2

      const T  = getTargets()
      const LT = 0.05
      coreScale = lerp(coreScale, T.scale, LT * 2.5)
      coreGlow  = lerp(coreGlow,  T.glow,  LT)
      orbSpeed  = lerp(orbSpeed,  T.orbS,  LT)
      ptSpeed   = lerp(ptSpeed,   T.ptS,   LT)
      waveAmp   = lerp(waveAmp,   T.wAmp,  LT * 2.5)

      breathPhase = (breathPhase + 0.009) % (Math.PI * 2)
      pulsePhase  = (pulsePhase  + 0.022) % (Math.PI * 2)
      ring1Ang   += orbSpeed * 60
      ring2Ang   -= orbSpeed * 43
      ring3Ang   += orbSpeed * 27
      if (stateRef.current === 'executing') execPulse = (execPulse + 0.018) % (Math.PI * 2)

      const breathScale = 1 + Math.sin(breathPhase) * 0.018
      const coreR = 50 * U * coreScale * breathScale

      ctx.clearRect(0, 0, curSize, curSize)

      // Energy field
      const eg = ctx.createRadialGradient(CX, CY, coreR*0.5, CX, CY, coreR*3.5)
      eg.addColorStop(0,   `rgba(0,200,255,${coreGlow*0.22})`)
      eg.addColorStop(0.5, `rgba(0,200,255,${coreGlow*0.06})`)
      eg.addColorStop(1,    'rgba(0,0,0,0)')
      ctx.fillStyle = eg
      ctx.fillRect(0, 0, curSize, curSize)

      // Particles + neural connections
      if (!reducedMotion) {
        const thinkPull = stateRef.current === 'thinking' ? 0.004 : 0

        for (const p of particles) {
          p.x += p.vx * ptSpeed
          p.y += p.vy * ptSpeed
          if (thinkPull > 0) {
            const d = Math.sqrt(p.x*p.x + p.y*p.y)
            if (d > 48) { p.x -= (p.x/d)*thinkPull*d*0.002; p.y -= (p.y/d)*thinkPull*d*0.002 }
          }
          const dist = Math.sqrt(p.x*p.x + p.y*p.y)
          if (dist < 62)  { p.vx += p.x/dist*0.025; p.vy += p.y/dist*0.025 }
          if (dist > 180) { p.vx -= p.x/dist*0.025; p.vy -= p.y/dist*0.025 }
          ctx.beginPath()
          ctx.arc(CX + p.x*U, CY + p.y*U, p.r*U, 0, Math.PI*2)
          ctx.fillStyle = `rgba(0,200,255,${p.op})`
          ctx.fill()
        }

        for (let i = 0; i < N; i++) {
          for (let j = i+1; j < N; j++) {
            const dx = particles[i].x - particles[j].x
            const dy = particles[i].y - particles[j].y
            const d  = Math.sqrt(dx*dx + dy*dy)
            if (d < 52) {
              ctx.beginPath()
              ctx.moveTo(CX + particles[i].x*U, CY + particles[i].y*U)
              ctx.lineTo(CX + particles[j].x*U, CY + particles[j].y*U)
              ctx.strokeStyle = `rgba(0,200,255,${(1-d/52)*0.1})`
              ctx.lineWidth = 0.4 * U
              ctx.stroke()
            }
          }
        }
      }

      // Agent connections (executing / thinking)
      if (stateRef.current === 'executing' || stateRef.current === 'thinking') {
        const nonBeka = activeRef.current.filter(id => id !== 'orchestrator')
        for (const agentId of nonBeka) {
          const leftIdx  = LEFT_IDS.indexOf(agentId)
          const rightIdx = RIGHT_IDS.indexOf(agentId)
          let angle: number
          if      (leftIdx  >= 0) angle = Math.PI + (leftIdx  - (LEFT_IDS.length-1)/2)  * 0.28
          else if (rightIdx >= 0) angle =            (rightIdx - (RIGHT_IDS.length-1)/2) * 0.28
          else                    angle = (nonBeka.indexOf(agentId) / nonBeka.length) * Math.PI * 2

          const edgeR = 148 * U
          const tx = CX + Math.cos(angle) * edgeR
          const ty = CY + Math.sin(angle) * edgeR

          ctx.save()
          ctx.setLineDash([3*U, 6*U])
          ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(tx, ty)
          ctx.strokeStyle = 'rgba(0,200,255,0.1)'; ctx.lineWidth = U; ctx.stroke()
          ctx.restore()

          const progress = ((ts * 0.0007 + nonBeka.indexOf(agentId) * 0.4) % 1)
          ctx.beginPath()
          ctx.arc(CX + (tx-CX)*progress, CY + (ty-CY)*progress, 2*U, 0, Math.PI*2)
          ctx.fillStyle = 'rgba(0,200,255,0.75)'; ctx.fill()

          ctx.beginPath()
          ctx.arc(tx, ty, 3.5*U, 0, Math.PI*2)
          ctx.fillStyle = `rgba(0,200,255,${0.3 + Math.sin(execPulse + nonBeka.indexOf(agentId)) * 0.2})`
          ctx.fill()
        }
      }

      // Orbital rings
      const rings = [
        { r: 74*U,  a: ring1Ang, op: 0.2,  nodes: 4, dashed: false },
        { r: 98*U,  a: ring2Ang, op: 0.14, nodes: 6, dashed: false },
        { r: 120*U, a: ring3Ang, op: 0.08, nodes: 0, dashed: true  },
      ]
      for (const rg of rings) {
        const eff = rg.op * (1 + coreGlow * 0.6)
        ctx.save()
        if (rg.dashed) ctx.setLineDash([2*U, 8*U])
        ctx.beginPath(); ctx.arc(CX, CY, rg.r, 0, Math.PI*2)
        ctx.strokeStyle = `rgba(0,200,255,${eff})`; ctx.lineWidth = 0.8*U; ctx.stroke()
        ctx.restore()
        for (let n = 0; n < rg.nodes; n++) {
          const na = rg.a + (n/rg.nodes)*Math.PI*2
          ctx.beginPath()
          ctx.arc(CX + Math.cos(na)*rg.r, CY + Math.sin(na)*rg.r, 1.8*U, 0, Math.PI*2)
          ctx.fillStyle = `rgba(0,200,255,${eff*2.5})`; ctx.fill()
        }
      }

      // Circular waveform
      if (waveAmp > 0.02 && !reducedMotion) {
        const wR  = coreR + 13*U
        const pts = 72
        ctx.beginPath()
        for (let i = 0; i <= pts; i++) {
          const a = (i/pts) * Math.PI*2
          const n = Math.sin(a*9 + ts*0.006)*0.55 + Math.sin(a*16 + ts*0.004)*0.45
          const r = wR + n * waveAmp * 14 * U
          i === 0
            ? ctx.moveTo(CX + Math.cos(a)*r, CY + Math.sin(a)*r)
            : ctx.lineTo(CX + Math.cos(a)*r, CY + Math.sin(a)*r)
        }
        ctx.closePath()
        ctx.strokeStyle = `rgba(0,200,255,${waveAmp*0.55})`; ctx.lineWidth = U; ctx.stroke()
      }

      // Core glow layers
      for (let i = 4; i >= 0; i--) {
        ctx.beginPath(); ctx.arc(CX, CY, coreR + i*10*U, 0, Math.PI*2)
        ctx.strokeStyle = `rgba(0,200,255,${coreGlow*(0.1-i*0.018)})`
        ctx.lineWidth = 1.5*U; ctx.stroke()
      }

      // Core fill
      const cg = ctx.createRadialGradient(CX - coreR*0.28, CY - coreR*0.32, coreR*0.05, CX, CY, coreR)
      cg.addColorStop(0,   'rgba(0,55,110,0.97)')
      cg.addColorStop(0.6, 'rgba(0,18,55,0.94)')
      cg.addColorStop(1,   'rgba(0,4,18,0.9)')
      ctx.beginPath(); ctx.arc(CX, CY, coreR, 0, Math.PI*2)
      ctx.fillStyle = cg; ctx.fill()

      ctx.beginPath(); ctx.arc(CX, CY, coreR, 0, Math.PI*2)
      ctx.strokeStyle = `rgba(0,200,255,${0.3 + coreGlow*0.6})`; ctx.lineWidth = 1.3*U; ctx.stroke()

      const hg = ctx.createRadialGradient(CX - coreR*0.3, CY - coreR*0.35, 0, CX - coreR*0.3, CY - coreR*0.35, coreR*0.85)
      hg.addColorStop(0, `rgba(0,200,255,${coreGlow*0.25})`); hg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath(); ctx.arc(CX, CY, coreR, 0, Math.PI*2)
      ctx.fillStyle = hg; ctx.fill()

      // BEKA geometric icon
      const iR  = 15 * U * coreScale
      const iOp = 0.3 + coreGlow*0.6

      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (i/6)*Math.PI*2 - Math.PI/6
        i === 0 ? ctx.moveTo(CX + Math.cos(a)*iR, CY + Math.sin(a)*iR) : ctx.lineTo(CX + Math.cos(a)*iR, CY + Math.sin(a)*iR)
      }
      ctx.closePath(); ctx.strokeStyle = `rgba(0,200,255,${iOp})`; ctx.lineWidth = 1.1*U; ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(CX, CY - iR*0.5); ctx.lineTo(CX + iR*0.5, CY)
      ctx.lineTo(CX, CY + iR*0.5); ctx.lineTo(CX - iR*0.5, CY)
      ctx.closePath(); ctx.strokeStyle = `rgba(0,200,255,${iOp*0.55})`; ctx.lineWidth = 0.8*U; ctx.stroke()

      ctx.beginPath(); ctx.arc(CX, CY, 2.8*U, 0, Math.PI*2)
      ctx.fillStyle = `rgba(0,200,255,${iOp*1.5})`; ctx.fill()

      if (stateRef.current === 'thinking') {
        const pulseProg = Math.sin(pulsePhase)
        if (pulseProg > 0) {
          ctx.beginPath(); ctx.arc(CX, CY, coreR*0.6 + pulseProg*coreR*0.4, 0, Math.PI*2)
          ctx.strokeStyle = `rgba(0,200,255,${pulseProg*0.22})`; ctx.lineWidth = 1.5*U; ctx.stroke()
        }
      }
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [amplitudeRef, reducedMotion, sizeRef])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, position: 'relative' }}>
      <canvas ref={canvasRef} />
      <div style={{ textAlign: 'center', minHeight: 32 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: STATE_COLOR[state], transition: 'color 0.5s ease' }}>
          {STATE_LABEL[state]}
        </div>
        <div style={{ fontSize: 9.5, color: 'rgba(244,247,250,0.3)', marginTop: 4, letterSpacing: '0.06em', transition: 'opacity 0.3s' }}>
          {STATE_SUB[state]}
        </div>
      </div>
    </div>
  )
}
