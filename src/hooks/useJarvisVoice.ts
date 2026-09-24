'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export type JarvisVoiceState = 'idle' | 'listening' | 'thinking' | 'speaking'
export interface HistoryItem { role: 'user' | 'jarvis'; text: string }

export function useJarvisVoice() {
  const [open, setOpen]             = useState(false)
  const [state, setState]           = useState<JarvisVoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [history, setHistory]       = useState<HistoryItem[]>([])
  const [error, setError]           = useState('')

  // Refs — NEVER synced from render body; only updated alongside their setState call
  const openRef    = useRef(false)
  const stateRef   = useRef<JarvisVoiceState>('idle')
  const historyRef = useRef<HistoryItem[]>([])
  const pendingRef = useRef('')
  const recogRef   = useRef<any>(null)
  const noSpeechRef = useRef(0)   // consecutive no-speech counter for language fallback

  // WebAudio for mic amplitude only
  const ctxRef       = useRef<AudioContext | null>(null)
  const analyserRef  = useRef<AnalyserNode | null>(null)
  const amplitudeRef = useRef(0)
  const dataRef      = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const frameRef     = useRef(0)
  const ctxFailedRef = useRef(false)

  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const startListeningRef = useRef<(() => void) | null>(null)

  // ── Helpers to update state + ref atomically ─────────────────────────────
  const setStateSafe = useCallback((s: JarvisVoiceState) => {
    stateRef.current = s
    setState(s)
  }, [])

  const setOpenSafe = useCallback((v: boolean) => {
    openRef.current = v
    setOpen(v)
  }, [])

  const setHistorySafe = useCallback((h: HistoryItem[]) => {
    historyRef.current = h
    setHistory(h)
  }, [])

  // ── Amplitude ────────────────────────────────────────────────────────────
  const getAmplitude = useCallback(() => amplitudeRef.current, [])

  const trySetupCtx = useCallback(async () => {
    if (ctxRef.current || ctxFailedRef.current) return
    try {
      const ctx = new AudioContext()
      ctx.addEventListener('statechange', () => { if (ctx.state === 'closed') ctxFailedRef.current = true })
      if (ctx.state === 'suspended') await ctx.resume()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      ctxRef.current      = ctx
      analyserRef.current = analyser
      dataRef.current     = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
      const poll = () => {
        if (analyserRef.current && dataRef.current) {
          analyserRef.current.getByteTimeDomainData(dataRef.current)
          let peak = 0
          for (let i = 0; i < dataRef.current.length; i++) peak = Math.max(peak, Math.abs(dataRef.current[i] - 128))
          amplitudeRef.current = peak * 2
        }
        frameRef.current = requestAnimationFrame(poll)
      }
      poll()
    } catch { ctxFailedRef.current = true }
  }, [])

  const connectMic = useCallback(async () => {
    if (ctxFailedRef.current || !ctxRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      const src = ctxRef.current.createMediaStreamSource(stream)
      src.connect(analyserRef.current!)
    } catch {}
  }, [])

  // ── TTS: HTMLAudioElement only ───────────────────────────────────────────
  const speak = useCallback(async (text: string) => {
    setStateSafe('speaking')

    const restart = () => {
      amplitudeRef.current = 0
      audioElRef.current   = null
      if (openRef.current) {
        setStateSafe('listening')
        setTimeout(() => startListeningRef.current?.(), 400)
      } else {
        setStateSafe('idle')
      }
    }

    try {
      const res = await fetch('/api/jarvis/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        let msg = `Error TTS ${res.status}`
        try { msg = (await res.json()).error ?? msg } catch { msg = (await res.text().catch(() => '')).slice(0, 120) || msg }
        console.error('[JARVIS speak]', msg)
        setError(msg)
        restart()
        return
      }

      const blob = new Blob([await res.arrayBuffer()], { type: 'audio/mpeg' })
      if (!blob.size) { setError('ElevenLabs va retornar àudio buit'); restart(); return }

      setError('')
      const url   = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioElRef.current = audio
      audio.onended = () => { URL.revokeObjectURL(url); restart() }
      audio.onerror = () => { URL.revokeObjectURL(url); restart() }
      try {
        await audio.play()
      } catch (e: any) {
        console.error('[JARVIS play() blocked]', e?.name)
        setError('Àudio bloquejat — recarrega la pàgina')
        URL.revokeObjectURL(url)
        restart()
      }
    } catch (e) {
      console.error('[JARVIS speak]', e)
      setError('Error síntesi de veu')
      restart()
    }
  }, [setStateSafe])

  // ── Send to Claude ───────────────────────────────────────────────────────
  const send = useCallback(async (text: string) => {
    if (!text.trim()) return
    setStateSafe('thinking')
    setTranscript('')
    amplitudeRef.current = 0

    const prevHistory = historyRef.current
    const newHistory: HistoryItem[] = [...prevHistory, { role: 'user', text }]
    setHistorySafe(newHistory)

    try {
      const res = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: prevHistory }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        const msg  = body.error ?? `Error ${res.status}`
        console.error('[JARVIS chat]', msg)
        setError(msg)
        setStateSafe('idle')
        if (openRef.current) setTimeout(() => startListeningRef.current?.(), 500)
        return
      }

      const data  = await res.json()
      const reply = data.text || 'No he pogut processar la petició.'
      setHistorySafe([...historyRef.current, { role: 'jarvis', text: reply }])
      await speak(reply)
    } catch (e) {
      console.error('[JARVIS send]', e)
      setError('Error de connexió')
      setStateSafe('idle')
      if (openRef.current) setTimeout(() => startListeningRef.current?.(), 500)
    }
  }, [speak, setStateSafe, setHistorySafe])

  // ── Start listening ──────────────────────────────────────────────────────
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startListening = useCallback(() => {
    if (stateRef.current === 'speaking' || stateRef.current === 'thinking') return
    if (!openRef.current) return

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setError('Usa Chrome — el teu navegador no suporta reconeixement de veu'); return }

    try { recogRef.current?.abort() } catch {}
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }

    // Language fallback: after 3 consecutive no-speech, switch to es-ES
    const lang = noSpeechRef.current >= 3 ? 'es-ES' : (navigator.language || 'ca-ES')

    const recog = new SR()
    recog.lang            = lang
    recog.continuous      = true   // keep open to capture speech reliably
    recog.interimResults  = true
    pendingRef.current    = ''

    // Committed flag prevents double-commit from isFinal + timer
    let committed = false

    const commit = (text: string) => {
      if (committed) return
      if (!text.trim()) return
      if (stateRef.current !== 'listening') return
      committed = true
      noSpeechRef.current = 0
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      setStateSafe('thinking')
      pendingRef.current = ''
      try { recog.stop() } catch {}
      send(text.trim())
    }

    recog.onstart = () => {
      if (stateRef.current !== 'thinking' && stateRef.current !== 'speaking') {
        setStateSafe('listening')
      }
      pendingRef.current = ''
      committed = false
    }

    recog.onresult = (e: any) => {
      if (committed) return
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join('')
      pendingRef.current = t
      setTranscript(t)

      if (e.results[e.results.length - 1].isFinal) {
        commit(t)
        return
      }

      // Silence fallback: 1.2s after last interim result
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => {
        commit(pendingRef.current.trim())
      }, 1200)
    }

    recog.onerror = (e: any) => {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      if (e.error === 'no-speech') {
        noSpeechRef.current++
        if (openRef.current && stateRef.current === 'listening') setTimeout(() => startListeningRef.current?.(), 200)
      } else if (e.error === 'aborted') {
        // expected when we call recog.stop() — do nothing
      } else if (e.error === 'not-allowed') {
        setError('Micròfon no autoritzat — activa\'l a la barra d\'adreces de Chrome')
        setStateSafe('idle')
      } else {
        console.error('[JARVIS STT]', e.error)
        if (openRef.current && stateRef.current === 'listening') setTimeout(() => startListeningRef.current?.(), 500)
      }
    }

    recog.onend = () => {
      if (committed) return
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      if (stateRef.current !== 'listening') return
      const p = pendingRef.current.trim()
      if (p) {
        commit(p)
      } else if (openRef.current) {
        setTimeout(() => startListeningRef.current?.(), 200)
      } else {
        setStateSafe('idle')
      }
    }

    recog.start()
    recogRef.current = recog
  }, [send, setStateSafe])

  startListeningRef.current = startListening

  // ── Open / Close ─────────────────────────────────────────────────────────
  const openingRef = useRef(false)

  const openJarvis = useCallback(async () => {
    if (openRef.current || openingRef.current) return
    openingRef.current = true
    setError('')
    setHistorySafe([])
    setTranscript('')
    noSpeechRef.current = 0

    await trySetupCtx()
    await connectMic()

    setOpenSafe(true)
    setTimeout(() => startListeningRef.current?.(), 300)
    openingRef.current = false
  }, [trySetupCtx, connectMic, setOpenSafe, setHistorySafe])

  const closeJarvis = useCallback(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    try { recogRef.current?.abort() } catch {}
    if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current = null }
    amplitudeRef.current = 0
    setStateSafe('idle')
    setOpenSafe(false)
    setTranscript('')
    window.dispatchEvent(new Event('closeJarvis'))
  }, [setStateSafe, setOpenSafe])

  useEffect(() => {
    const onOpen = () => { openJarvis() }
    window.addEventListener('openJarvis', onOpen)
    return () => window.removeEventListener('openJarvis', onOpen)
  }, [openJarvis])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frameRef.current)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      ctxRef.current?.close()
    }
  }, [])

  return {
    open, state, transcript, history, error,
    getAmplitude, openJarvis, closeJarvis, send, startListening,
    amplitudeRef,
  }
}
