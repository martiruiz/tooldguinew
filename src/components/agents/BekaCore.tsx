'use client'

import { useEffect, useRef } from 'react'
import type { JarvisVoiceState } from '@/hooks/useJarvisVoice'

export type BekaState = JarvisVoiceState | 'executing'

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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 3)

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

    type Pt = { x: number; y: number; vx: number; vy: number; r: number; op: number }
    const N = reducedMotion ? 0 : 36
    const particles: Pt[] = Array.from({ length: N }, () => {
      const a = Math.random() * Math.PI * 2
      const d = 65 + Math.random() * 95
      return { x: Math.cos(a)*d, y: Math.sin(a)*d, vx: (Math.random()-0.5)*0.13, vy: (Math.random()-0.5)*0.13, r: 0.6+Math.random()*1.1, op: 0.12+Math.random()*0.28 }
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

      const desired = Math.round(Math.min(540, Math.max(80, sizeRef?.current ?? 300)))
      if (Math.abs(desired - curSize) > 1) { curSize = desired; applySize(curSize) }

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

      // ── Outer atmospheric energy field ────────────────────────────────────────
      const atmoR = coreR * 3.2
      const eg = ctx.createRadialGradient(CX, CY, coreR * 0.5, CX, CY, atmoR)
      eg.addColorStop(0,   `rgba(0,180,255,${coreGlow * 0.28})`)
      eg.addColorStop(0.4, `rgba(0,100,220,${coreGlow * 0.10})`)
      eg.addColorStop(0.75,`rgba(0,40,140,${coreGlow * 0.04})`)
      eg.addColorStop(1,    'rgba(0,0,0,0)')
      ctx.fillStyle = eg
      ctx.fillRect(0, 0, curSize, curSize)

      // ── Neural particles ──────────────────────────────────────────────────────
      if (!reducedMotion) {
        const thinkPull = stateRef.current === 'thinking' ? 0.004 : 0
        for (const p of particles) {
          p.x += p.vx * ptSpeed; p.y += p.vy * ptSpeed
          if (thinkPull > 0) {
            const d = Math.sqrt(p.x*p.x + p.y*p.y)
            if (d > 45) { p.x -= (p.x/d)*thinkPull*d*0.002; p.y -= (p.y/d)*thinkPull*d*0.002 }
          }
          const dist = Math.sqrt(p.x*p.x + p.y*p.y)
          if (dist < 60)  { p.vx += p.x/dist*0.025; p.vy += p.y/dist*0.025 }
          if (dist > 165) { p.vx -= p.x/dist*0.025; p.vy -= p.y/dist*0.025 }
          ctx.beginPath(); ctx.arc(CX + p.x*U, CY + p.y*U, p.r*U, 0, Math.PI*2)
          ctx.fillStyle = `rgba(0,200,255,${p.op})`; ctx.fill()
        }
        for (let i = 0; i < N; i++) {
          for (let j = i+1; j < N; j++) {
            const dx = particles[i].x - particles[j].x
            const dy = particles[i].y - particles[j].y
            const d  = Math.sqrt(dx*dx + dy*dy)
            if (d < 48) {
              ctx.beginPath()
              ctx.moveTo(CX + particles[i].x*U, CY + particles[i].y*U)
              ctx.lineTo(CX + particles[j].x*U, CY + particles[j].y*U)
              ctx.strokeStyle = `rgba(0,200,255,${(1-d/48)*0.09})`
              ctx.lineWidth = 0.4 * U; ctx.stroke()
            }
          }
        }
      }

      // ── 3D Orbital rings (tilted ellipses for depth illusion) ─────────────────
      const orbitRings = [
        { r: 72*U,  tiltY: 0.30, spinBase: ring1Ang, spinScale: 0.22, nodeAng: ring1Ang, op: 0.22, nodes: 4, dashed: false },
        { r: 96*U,  tiltY: 0.58, spinBase: ring2Ang, spinScale: 0.16, nodeAng: ring2Ang, op: 0.15, nodes: 5, dashed: false },
        { r: 118*U, tiltY: 0.40, spinBase: ring3Ang, spinScale: 0.24, nodeAng: ring3Ang, op: 0.09, nodes: 0, dashed: true  },
      ]

      for (const orb of orbitRings) {
        const eff = orb.op * (1 + coreGlow * 0.65)

        // Draw the tilted ring as a rotated ellipse
        ctx.save()
        ctx.translate(CX, CY)
        ctx.rotate(orb.spinBase * orb.spinScale)
        if (orb.dashed) ctx.setLineDash([3*U, 9*U])
        ctx.beginPath()
        ctx.ellipse(0, 0, orb.r, orb.r * orb.tiltY, 0, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(0,200,255,${eff})`
        ctx.lineWidth = 0.9 * U
        ctx.stroke()

        // Orbiting nodes on the ring with depth-based opacity/size
        for (let n = 0; n < orb.nodes; n++) {
          const a = orb.nodeAng + (n / orb.nodes) * Math.PI * 2
          const lx = orb.r * Math.cos(a)
          const ly = orb.r * orb.tiltY * Math.sin(a)
          const depth = Math.sin(a)           // +1 = front, -1 = back
          const nodeAlpha = Math.max(0.06, eff * (0.8 + depth * 0.55))
          const nodeR = Math.max(0.5, (1.6 + depth * 0.6) * U)
          ctx.beginPath(); ctx.arc(lx, ly, nodeR, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0,200,255,${nodeAlpha * 2.8})`; ctx.fill()
        }
        ctx.restore()
      }

      // ── Circular waveform (state-reactive) ───────────────────────────────────
      if (waveAmp > 0.02 && !reducedMotion) {
        const wR  = coreR + 13*U
        const pts = 72
        ctx.beginPath()
        for (let i = 0; i <= pts; i++) {
          const a = (i/pts) * Math.PI*2
          const n = Math.sin(a*9 + ts*0.006)*0.55 + Math.sin(a*16 + ts*0.004)*0.45
          const r = wR + n * waveAmp * 14 * U
          i === 0 ? ctx.moveTo(CX + Math.cos(a)*r, CY + Math.sin(a)*r)
                  : ctx.lineTo(CX + Math.cos(a)*r, CY + Math.sin(a)*r)
        }
        ctx.closePath()
        ctx.strokeStyle = `rgba(0,200,255,${waveAmp*0.5})`; ctx.lineWidth = U; ctx.stroke()
      }

      // ── 3D Sphere: multi-layer glow border ───────────────────────────────────
      for (let i = 5; i >= 0; i--) {
        const a = coreGlow * (0.14 - i * 0.022)
        if (a <= 0) continue
        ctx.beginPath(); ctx.arc(CX, CY, coreR + i * 8 * U, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(0,200,255,${a})`
        ctx.lineWidth = 1.4 * U; ctx.stroke()
      }

      // ── 3D Sphere: main body (offset gradient = light from top-left) ─────────
      const cg = ctx.createRadialGradient(
        CX - coreR * 0.38, CY - coreR * 0.42, coreR * 0.04,
        CX + coreR * 0.08, CY + coreR * 0.10, coreR
      )
      cg.addColorStop(0,    'rgba(0,105,215,0.97)')
      cg.addColorStop(0.20, 'rgba(0,52,130,0.97)')
      cg.addColorStop(0.60, 'rgba(0,11,46,0.98)')
      cg.addColorStop(1,    'rgba(0,2,12,0.99)')
      ctx.beginPath(); ctx.arc(CX, CY, coreR, 0, Math.PI * 2)
      ctx.fillStyle = cg; ctx.fill()

      // Clip sphere for inner overlays
      ctx.save()
      ctx.beginPath(); ctx.arc(CX, CY, coreR - 0.4 * U, 0, Math.PI * 2); ctx.clip()

      // Rim light (bottom-right backscatter)
      const rimG = ctx.createRadialGradient(
        CX + coreR * 0.70, CY + coreR * 0.62, 0,
        CX + coreR * 0.28, CY + coreR * 0.26, coreR * 0.78
      )
      rimG.addColorStop(0, `rgba(0,175,255,${0.30 + coreGlow * 0.38})`)
      rimG.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = rimG; ctx.fillRect(CX - coreR, CY - coreR, coreR * 2, coreR * 2)

      // Specular highlight (sharp bright spot top-left)
      const specG = ctx.createRadialGradient(
        CX - coreR * 0.32, CY - coreR * 0.37, 0,
        CX - coreR * 0.25, CY - coreR * 0.29, coreR * 0.44
      )
      specG.addColorStop(0,    `rgba(210,248,255,${0.68 + coreGlow * 0.28})`)
      specG.addColorStop(0.32, `rgba(90,210,255,${0.18 + coreGlow * 0.22})`)
      specG.addColorStop(1,     'rgba(0,0,0,0)')
      ctx.fillStyle = specG; ctx.fillRect(CX - coreR, CY - coreR, coreR * 2, coreR * 2)

      ctx.restore()

      // Sphere border ring
      ctx.beginPath(); ctx.arc(CX, CY, coreR, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(0,200,255,${0.30 + coreGlow * 0.58})`; ctx.lineWidth = 1.2 * U; ctx.stroke()

      // ── Geometric BEKA icon (engraved on sphere) ──────────────────────────────
      const iR  = 15 * U * coreScale
      const iOp = 0.32 + coreGlow * 0.58

      // Hexagon
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (i/6)*Math.PI*2 - Math.PI/6
        i === 0 ? ctx.moveTo(CX + Math.cos(a)*iR, CY + Math.sin(a)*iR)
                : ctx.lineTo(CX + Math.cos(a)*iR, CY + Math.sin(a)*iR)
      }
      ctx.closePath(); ctx.strokeStyle = `rgba(0,200,255,${iOp})`; ctx.lineWidth = 1.1*U; ctx.stroke()

      // Inner diamond
      ctx.beginPath()
      ctx.moveTo(CX, CY - iR*0.52); ctx.lineTo(CX + iR*0.52, CY)
      ctx.lineTo(CX, CY + iR*0.52); ctx.lineTo(CX - iR*0.52, CY)
      ctx.closePath(); ctx.strokeStyle = `rgba(0,200,255,${iOp*0.52})`; ctx.lineWidth = 0.8*U; ctx.stroke()

      // Center dot
      ctx.beginPath(); ctx.arc(CX, CY, 2.8*U, 0, Math.PI*2)
      ctx.fillStyle = `rgba(0,200,255,${iOp * 1.6})`; ctx.fill()

      // Thinking pulse ring
      if (stateRef.current === 'thinking') {
        const pp = Math.sin(pulsePhase)
        if (pp > 0) {
          ctx.beginPath(); ctx.arc(CX, CY, coreR * 0.6 + pp * coreR * 0.4, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(0,200,255,${pp*0.22})`; ctx.lineWidth = 1.5*U; ctx.stroke()
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
