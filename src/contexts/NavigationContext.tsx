'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'

interface NavCtx {
  loading: boolean
  startLoading: () => void
  stopLoading: () => void
}

const Ctx = createContext<NavCtx>({ loading: false, startLoading: () => {}, stopLoading: () => {} })

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false)
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startLoading = useCallback(() => {
    if (stopTimer.current) clearTimeout(stopTimer.current)
    setLoading(true)
  }, [])

  const stopLoading = useCallback(() => {
    stopTimer.current = setTimeout(() => setLoading(false), 400)
  }, [])

  return (
    <Ctx.Provider value={{ loading, startLoading, stopLoading }}>
      {children}
    </Ctx.Provider>
  )
}

export const useNavigation = () => useContext(Ctx)
