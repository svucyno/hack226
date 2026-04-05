import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../utils/LanguageContext'
import './Navbar.css'

const NAV_LINKS = [
  {
    path: '/',
    labelKey: 'nav.home',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    path: '/usage-meter',
    labelKey: 'nav.usageMeter',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    path: '/disease-prediction',
    labelKey: 'nav.diseasePrediction',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
        <path d="M11 8v6M8 11h6"/>
      </svg>
    ),
  },
  {
    path: '/doctors',
    labelKey: 'nav.doctors',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    path: '/updates',
    labelKey: 'nav.updates',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
]

const LANGUAGES = [
  { code: 'EN', name: 'English',    flag: '🇺🇸', region: 'United States' },
  { code: 'HI', name: 'हिन्दी',      flag: '🇮🇳', region: 'India' },
  { code: 'ES', name: 'Español',    flag: '🇪🇸', region: 'España' },
  { code: 'FR', name: 'Français',   flag: '🇫🇷', region: 'France' },
  { code: 'AR', name: 'العربية',    flag: '🇸🇦', region: 'Saudi Arabia' },
  { code: 'ZH', name: '中文',        flag: '🇨🇳', region: 'China' },
  { code: 'DE', name: 'Deutsch',    flag: '🇩🇪', region: 'Deutschland' },
  { code: 'PT', name: 'Português',  flag: '🇧🇷', region: 'Brasil' },
]

function LanguageSwitcher() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { lang: activeLang, setLang, t } = useLanguage()

  const selected = LANGUAGES.find(l => l.code === activeLang) || LANGUAGES[0]

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const choose = (lang) => { setLang(lang.code); setOpen(false) }

  return (
    <div className="lang-switcher" ref={ref}>
      <button
        className={`lang-switcher__trigger${open ? ' lang-switcher__trigger--open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label="Change language"
        aria-expanded={open}
      >
        {/* Globe icon */}
        <svg className="lang-switcher__globe" width="15" height="15" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>

        <span className="lang-switcher__flag">{selected.flag}</span>
        <span className="lang-switcher__code">{selected.code}</span>

        {/* Chevron */}
        <svg className={`lang-switcher__chevron${open ? ' lang-switcher__chevron--up' : ''}`}
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {/* Dropdown panel */}
      <div className={`lang-switcher__dropdown${open ? ' lang-switcher__dropdown--open' : ''}`}
        role="listbox" aria-label="Select language">

        <div className="lang-switcher__dropdown-header">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          {t('nav.langHeader')}
        </div>

        <ul className="lang-switcher__list">
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                className={`lang-switcher__option${activeLang === lang.code ? ' lang-switcher__option--active' : ''}`}
                onClick={() => choose(lang)}
                role="option"
                aria-selected={activeLang === lang.code}
              >
                <span className="lang-option__flag">{lang.flag}</span>
                <span className="lang-option__info">
                  <span className="lang-option__name">{lang.name}</span>
                  <span className="lang-option__region">{lang.region}</span>
                </span>
                <span className="lang-option__code">{lang.code}</span>
                {activeLang === lang.code && (
                  <svg className="lang-option__check" width="13" height="13"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Powered-by note */}
        <div className="lang-switcher__footer">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          {t('nav.langFooter')} {LANGUAGES.length} languages
        </div>
      </div>
    </div>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const handleNav = (path) => {
    navigate(path)
    setMenuOpen(false)
  }

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        {/* Logo */}
        <button className="navbar__logo" onClick={() => handleNav('/')}>
          <div className="navbar__logo-icon">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="17" fill="url(#logoGrad)" />
              <path d="M12 18 Q18 9 24 18 Q18 27 12 18Z" fill="white" opacity="0.9"/>
              <circle cx="18" cy="18" r="4" fill="white"/>
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36">
                  <stop offset="0%" stopColor="#0d9488"/>
                  <stop offset="100%" stopColor="#0ea5e9"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="navbar__logo-text">
            <span className="logo-name">AntibioticAI</span>
            <span className="logo-tagline">{t('nav.logoTagline')}</span>
          </div>
        </button>

        {/* Links */}
        <ul className={`navbar__links${menuOpen ? ' navbar__links--open' : ''}`}>
          {NAV_LINKS.map(({ path, labelKey, icon }) => {
            const isActive = pathname === path
            return (
              <li key={path}>
                <button
                  className={`navbar__link${isActive ? ' navbar__link--active' : ''}`}
                  onClick={() => handleNav(path)}
                >
                  {icon}
                  {t(labelKey)}
                  {isActive && <span className="navbar__link-dot" />}
                </button>
              </li>
            )
          })}
        </ul>

        {/* Actions: Language + CTA + Hamburger */}
        <div className="navbar__actions">
          <LanguageSwitcher />

          <button className="btn-primary navbar__cta" onClick={() => handleNav('/analysis')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <span>{t('nav.analyzeNow')}</span>
          </button>

          <button
            className={`navbar__hamburger${menuOpen ? ' navbar__hamburger--open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  )
}
