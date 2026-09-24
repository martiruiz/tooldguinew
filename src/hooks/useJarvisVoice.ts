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

  const openRef       = useRef(false)
  const stateRef      = useRef<JarvisVoiceState>('idle')
  const historyRef    = useRef<HistoryItem[]>([])
  const pendingRef    = useRef('')
  const recogRef      = useRef<any>(null)

  // WebAudio — ONLY for mic amplitude visualisation, NOT for TTS playback
  const ctxRef       = useRef<AudioContext | null>(null)
  const analyserRef  = useRef<AnalyserNode | null>(null)
  const amplitudeRef = useRef(0)
  const dataRef      = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const frameRef     = useRef(0)
  const ctxFailedRef = useRef(false)   // if AudioContext fails, skip it entirely

  // Current TTS <audio> element so we can stop it on close
  const audioElRef = useRef<HTMLAudioElement | null>(null)

  // Ref to break speak→startListening circular dep
  const startListeningRef = useRef<(() => void) | null>(null)

  // Keep refs in sync (safe to mutate refs during render)
  openRef.current    = open
  stateRef.current   = state
  historyRef.current = history

  // ── Amplitude ────────────────────────────────────────────────────────────
  const getAmplitude = useCallback(() => amplitudeRef.current, [])

  // Try to set up AudioContext for mic amplitude; if it fails, we skip it
  const trySetupCtx = useCallback(async () => {
    if (ctxRef.current || ctxFailedRef.current) return
    try {
      const ctx = new AudioContext()
      // If the context errors at device level it fires 'statechange' → 'closed'
      ctx.addEventListener('statechange', () => {
        if (ctx.state === 'closed') ctxFailedRef.current = true
      })
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
          for (let i = 0; i < dataRef.current.length; i++) {
            const v = Math.abs(dataRef.current[i] - 128)
            if (v > peak) peak = v
          }
          amplitudeRef.current = peak * 2
        }
        frameRef.current = requestAnimationFrame(poll)
      }
      poll()
    } catch {
      ctxFailedRef.current = true
    }
  }, [])

  const connectMic = useCallback(async () => {
    if (ctxFailedRef.current || !ctxRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      const src = ctxRef.current.createMediaStreamSource(stream)
      src.connect(analyserRef.current!)
    } catch {
      // mic amplitude won't work but STT still works via SpeechRecognition
    }
  }, [])

  // ── TTS: always HTMLAudioElement (avoids WebAudio device errors) ──────────
  const speak = useCallback(async (text: string) => {
    setState('speaking')
    stateRef.current = 'speaking'

    const restart = () => {
      amplitudeRef.current = 0
      audioElRef.current   = null
      if (openRef.current) {
        setState('listening')
        stateRef.current = 'listening'
        setTimeout(() => startListeningRef.current?.(), 400)
      } else {
        setState('idle')
        stateRef.current = 'idle'
      }
    }

    try {
      const res = await fetch('/api/jarvis/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        let errMsg = `Error TTS ${res.status}`
        try { const j = await res.json(); errMsg = j.error ?? errMsg } catch {
          const t = await res.text().catch(() => ''); errMsg = t.slice(0, 120) || errMsg
        }
        console.error('[JARVIS speak]', errMsg)
        setError(errMsg)
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
      audio.onerror = (e) => {
        console.error('[JARVIS HTMLAudio error]', e)
        URL.revokeObjectURL(url)
        restart()
      }

      try {
        await audio.play()
      } catch (e: any) {
        console.error('[JARVIS audio.play() blocked]', e?.name, e?.message)
        setError('Àudio bloquejat — recarrega la pàgina i torna a clicar l\'orbe')
        URL.revokeObjectURL(url)
        restart()
      }
    } catch (e) {
      console.error('[JARVIS speak catch]', e)
      setError('Error en la síntesi de veu')
      restart()
    }
  }, [])

  // ── Send message to Claude ───────────────────────────────────────────────
  const send = useCallback(async (text: string) => {
    if (!text.trim()) return
    stateRef.current = 'thinking'
    setState('thinking')
    setTranscript('')
    amplitudeRef.current = 0

    const prevHistory = historyRef.current
    const newHistory: HistoryItem[] = [...prevHistory, { role: 'user', text }]
    setHistory(newHistory)
    historyRef.current = newHistory

    try {
      const res = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: prevHistory }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        const errMsg  = errBody.error ?? `Error ${res.status}`
        console.error('[JARVIS chat]', errMsg)
        setError(errMsg)
        setState('idle')
        stateRef.current = 'idle'
        if (openRef.current) setTimeout(() => startListeningRef.current?.(), 500)
        return
      }

      const data  = await res.json()
      const reply = data.text || 'No he pogut processar la petició.'
      const withReply = [...historyRef.current, { role: 'jarvis' as const, text: reply }]
      setHistory(withReply)
      historyRef.current = withReply
      await speak(reply)
    } catch (e) {
      console.error('[JARVIS send catch]', e)
      setError('Error de connexió')
      setState('idle')
      stateRef.current = 'idle'
      if (openRef.current) setTimeout(() => startListeningRef.current?.(), 500)
    }
  }, [speak])

  // ── Start listening ──────────────────────────────────────────────────────
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startListening = useCallback(() => {
    if (stateRef.current === 'speaking' || stateRef.current === 'thinking') return
    if (!openRef.current) return

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setError('El navegador no suporta reconeixement de veu. Prova Chrome.'); return }

    try { recogRef.current?.abort() } catch {}
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }

    const recog = new SR()
    recog.lang = navigator.language || 'ca-ES'
    recog.continuous      = false
    recog.interimResults  = true
    pendingRef.current    = ''

    const commit = (text: string) => {
      if (!text.trim() || stateRef.current !== 'listening') return
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      stateRef.current   = 'thinking'
      pendingRef.current = ''
      try { recog.stop() } catch {}
      send(text.trim())
    }

    recog.onstart = () => {
      if (stateRef.current !== 'thinking' && stateRef.current !== 'speaking') {
        setState('listening')
        stateRef.current = 'listening'
      }
      pendingRef.current = ''
    }

    recog.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join('')
      pendingRef.current = t
      setTranscript(t)

      if (e.results[e.results.length - 1].isFinal) { commit(t); return }

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => {
        const p = pendingRef.current.trim()
        if (p) commit(p)
      }, 1500)
    }

    recog.onerror = (e: any) => {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      if (e.error === 'no-speech' || e.error === 'aborted') {
        if (openRef.current && stateRef.current === 'listening') setTimeout(() => startListeningRef.current?.(), 300)
      } else if (e.error === 'not-allowed') {
        setError('Micròfon no autoritzat — permet l\'accés al micròfon a Chrome')
        setState('idle'); stateRef.current = 'idle'
      } else {
        console.error('[JARVIS STT error]', e.error)
        if (openRef.current && stateRef.current === 'listening') setTimeout(() => startListeningRef.current?.(), 500)
      }
    }

    recog.onend = () => {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      if (stateRef.current !== 'listening') return
      const p = pendingRef.current.trim()
      if (p) commit(p)
      else if (openRef.current) setTimeout(() => startListeningRef.current?.(), 300)
      else { setState('idle'); stateRef.current = 'idle' }
    }

    recog.start()
    recogRef.current = recog
  }, [send])

  // Always points to the latest startListening (breaks circular dep with speak/send)
  startListeningRef.current = startListening

  // ── Open / Close ─────────────────────────────────────────────────────────
  const openingRef = useRef(false)

  const openJarvis = useCallback(async () => {
    if (openRef.current || openingRef.current) return
    openingRef.current = true
    setError('')
    setHistory([])
    historyRef.current = []
    setTranscript('')

    // Try WebAudio for mic amplitude (optional — ignore failures)
    await trySetupCtx()

    // Connect mic to analyser for amplitude (ignore failures)
    await connectMic()

    setOpen(true)
    openRef.current = true
    setTimeout(() => startListeningRef.current?.(), 300)
    openingRef.current = false
  }, [trySetupCtx, connectMic])

  const closeJarvis = useCallback(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    try { recogRef.current?.abort() } catch {}
    // Stop any playing TTS audio
    if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current = null }
    amplitudeRef.current = 0
    stateRef.current = 'idle'
    setState('idle')
    setOpen(false)
    openRef.current = false
    setTranscript('')
    window.dispatchEvent(new Event('closeJarvis'))
  }, [])

  // Global openJarvis event (from orb click)
  useEffect(() => {
    const onOpen = () => { openJarvis() }
    window.addEventListener('openJarvis', onOpen)
    return () => window.removeEventListener('openJarvis', onOpen)
  }, [openJarvis])

  // Cleanup
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
