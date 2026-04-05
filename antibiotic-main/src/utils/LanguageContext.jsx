import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from './translations'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('EN')

  // Apply RTL direction + html lang attribute when language changes
  useEffect(() => {
    const config = translations[lang] || translations.EN
    document.documentElement.dir  = config.dir || 'ltr'
    document.documentElement.lang = lang.toLowerCase()
  }, [lang])

  /** Dot-path lookup with EN fallback. e.g. t('nav.home') */
  const t = (key) => {
    const keys   = key.split('.')
    const walk   = (obj) => keys.reduce((v, k) => v?.[k], obj)
    const result = walk(translations[lang]) ?? walk(translations.EN)
    return result ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}
