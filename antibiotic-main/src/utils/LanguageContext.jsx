import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from './translations'

const LanguageContext = createContext(null)
const LANGUAGE_STORAGE_KEY = 'antibiotic-app-language'

const isValidLanguage = (code) => Object.prototype.hasOwnProperty.call(translations, code)

const normalizeLanguage = (code) => {
  const normalized = String(code || '').trim().toUpperCase()
  return isValidLanguage(normalized) ? normalized : 'EN'
}

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return 'EN'

  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (saved && isValidLanguage(saved.toUpperCase())) {
    return saved.toUpperCase()
  }

  const browserLang = window.navigator.language?.split('-')?.[0]
  return normalizeLanguage(browserLang)
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLanguage)

  const setLang = (nextLang) => {
    setLangState(normalizeLanguage(nextLang))
  }

  // Apply RTL direction + html lang attribute when language changes
  useEffect(() => {
    const config = translations[lang] || translations.EN
    document.documentElement.dir  = config.dir || 'ltr'
    document.documentElement.lang = lang.toLowerCase()

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    }
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
