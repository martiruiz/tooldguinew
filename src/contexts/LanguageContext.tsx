'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Lang, getLang, TRANSLATIONS, t as tFn } from '@/lib/i18n'

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: keyof typeof TRANSLATIONS) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'ca',
  setLang: () => {},
  t: (key) => key as string,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ca')

  useEffect(() => {
    setLangState(getLang())
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('guinew-language', l)
  }

  function t(key: keyof typeof TRANSLATIONS): string {
    return tFn(key, lang)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
