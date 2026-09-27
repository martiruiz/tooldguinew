'use client'

import { useEffect, useRef } from 'react'

// JarvisOrb: only handles wake-word detection + double-clap globally.
// All conversation logic + visuals live in the agents page CentralNode.
export function JarvisOrb() {
  const openRef = useRef(false)
  const clapTimesRef = useRef<number[]>([])
  const wakeRecogRef = useRef<any>(null)

  useEffect(() => {
    const onOpen  = () => { openRef.current = true  }
    const onClose = () => { openRef.current = false }
    window.addEventListener('openJarvis',  onOpen)
    window.addEventListener('closeJarvis', onClose)
    return () => {
      window.removeEventListener('openJarvis',  onOpen)
      window.removeEventListener('closeJarvis', onClose)
    }
  }, [])

  // ── Double-clap detection (background mic) ──────────────────────────────
  useEffect(() => {
    let ctx: AudioContext | null = null
    let frameId = 0
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        ctx = new AudioContext()
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        ctx.createMediaStreamSource(stream).connect(analyser)
        const data = new Uint8Array(analyser.frequencyBinCount)
        const poll = () => {
          analyser.getByteTimeDomainData(data)
          let peak = 0
          for (let i = 0; i < data.length; i++) {
            const v = Math.abs(data[i] - 128)
            if (v > peak) peak = v
          }
          if (peak > 55) {
            const now = Date.now()
            clapTimesRef.current.push(now)
            clapTimesRef.current = clapTimesRef.current.filter(t => now - t < 700)
            if (clapTimesRef.current.length >= 2) {
              clapTimesRef.current = []
              if (!openRef.current) window.dispatchEvent(new Event('openJarvis'))
            }
          }
          frameId = requestAnimationFrame(poll)
        }
        poll()
      })
      .catch(() => {})
    return () => { cancelAnimationFrame(frameId); ctx?.close() }
  }, [])

  // ── Wake-word recognition (paused while conversation is active) ────────────
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    let paused = openRef.current
    const recog = new SR()
    recog.lang = 'ca-ES'
    recog.continuous = true
    recog.interimResults = false
    recog.onresult = (e: any) => {
      const txt = (e.results[e.results.length - 1][0].transcript ?? '').toLowerCase()
      if (txt.includes('jarvis') && !openRef.current) {
        window.dispatchEvent(new Event('openJarvis'))
      }
    }
    recog.onend = () => {
      if (!paused) { try { recog.start() } catch {} }
    }

    const pause = () => {
      paused = true
      try { recog.abort() } catch {}
    }
    const resume = () => {
      paused = false
      try { recog.start() } catch {}
    }

    window.addEventListener('openJarvis', pause)
    window.addEventListener('closeJarvis', resume)

    if (!paused) { try { recog.start() } catch {} }
    wakeRecogRef.current = recog
    return () => {
      window.removeEventListener('openJarvis', pause)
      window.removeEventListener('closeJarvis', resume)
      try { recog.abort() } catch {}
    }
  }, [])

  return null
}
