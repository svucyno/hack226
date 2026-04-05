import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../utils/LanguageContext'
import './HeroSection.css'

const STAT_KEYS = [
  { value: '73%',   labelKey: 'hero.statOveruse',    trend: 'up'   },
  { value: '2.8M',  labelKey: 'hero.statResistance', trend: 'up'   },
  { value: '90.2%', labelKey: 'hero.statAccuracy',   trend: 'down' },
]

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  style: {
    '--dx': `${(Math.random() - 0.5) * 100}px`,
    '--dy': `${(Math.random() - 0.5) * 100}px`,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${4 + Math.random() * 4}s`,
    width: `${3 + Math.random() * 7}px`,
    height: `${3 + Math.random() * 7}px`,
  },
}))

export default function HeroSection() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <section className="hero" id="hero">
      {/* Animated background */}
      <div className="hero__bg">
        <div className="hero__bg-orb hero__bg-orb--1" />
        <div className="hero__bg-orb hero__bg-orb--2" />
        <div className="hero__bg-orb hero__bg-orb--3" />
        <div className="hero__grid-pattern" />
        {PARTICLES.map(p => (
          <div key={p.id} className="hero__particle" style={p.style} />
        ))}
      </div>

      <div className="section-container hero__container">

        {/* ── Left content ── */}
        <div className="hero__content animate-fadein-l">
          <div className="hero__eyebrow">
            <span className="status-dot green" />
            <span>{t('hero.eyebrow')}</span>
          </div>

          <h1 className="hero__title">
            <span className="hero__title-line1">{t('hero.title1')}</span>
            <span className="hero__title-line2 gradient-text">{t('hero.title2')}</span>
            <span className="hero__title-line3">{t('hero.title3')}</span>
          </h1>

          <p className="hero__subtitle">{t('hero.subtitle')}</p>

          <div className="hero__actions">
            <button
              className="hero__btn-primary"
              onClick={() => navigate('/analysis')}
            >
              <span className="hero__btn-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </span>
              <span>{t('hero.startAnalysis')}</span>
              <span className="hero__btn-arrow">→</span>
            </button>

            <button
              className="hero__btn-secondary"
              onClick={() => navigate('/disease-prediction')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10,8 16,12 10,16"/>
              </svg>
              {t('hero.exploreTools')}
            </button>
          </div>

          {/* Stats row */}
          <div className="hero__stats">
            {STAT_KEYS.map(({ value, labelKey, trend }) => (
              <div className="hero__stat" key={labelKey}>
                <div className={`hero__stat-value${trend === 'up' ? ' hero__stat-value--danger' : ' hero__stat-value--safe'}`}>
                  {value}
                </div>
                <div className="hero__stat-label">{t(labelKey)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right — 3D Video Visual ── */}
        <div className="hero__visual animate-fadein-r">

          {/* Outer glow aura */}
          <div className="hvid__aura" />

          {/* Orbit rings */}
          <div className="hvid__orbit hvid__orbit--1"><span className="hvid__orb-dot hvid__orb-dot--1"/></div>
          <div className="hvid__orbit hvid__orbit--2"><span className="hvid__orb-dot hvid__orb-dot--2"/></div>
          <div className="hvid__orbit hvid__orbit--3"><span className="hvid__orb-dot hvid__orb-dot--3"/></div>

          {/* 3D Video Frame */}
          <div className="hvid__frame-wrapper">
            <div className="hvid__frame">

              {/* Corner tech decorations */}
              <span className="hvid__corner hvid__corner--tl"/>
              <span className="hvid__corner hvid__corner--tr"/>
              <span className="hvid__corner hvid__corner--bl"/>
              <span className="hvid__corner hvid__corner--br"/>

              {/* Scan line overlay */}
              <div className="hvid__scan" aria-hidden/>

              {/* The video */}
              <video
                className="hvid__video"
                src="/antibioticvideo.mp4"
                autoPlay
                loop
                muted
                playsInline
              />

              {/* Gradient overlay at bottom for fade */}
              <div className="hvid__fade-bottom" />
            </div>
          </div>

          {/* EKG waveform under the frame */}
          <div className="hero__ekg">
            <svg viewBox="0 0 300 50" fill="none">
              <path
                d="M0,25 L40,25 L50,10 L60,40 L70,5 L80,45 L90,25 L140,25 L150,10 L160,40 L170,5 L180,45 L190,25 L300,25"
                stroke="url(#ekgGrad)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="hero__ekg-path"
              />
              <defs>
                <linearGradient id="ekgGrad" x1="0" y1="0" x2="300" y2="0">
                  <stop offset="0%"   stopColor="#0d9488" stopOpacity="0"/>
                  <stop offset="30%"  stopColor="#0d9488"/>
                  <stop offset="70%"  stopColor="#06b6d4"/>
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="hero__wave">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,0 C360,80 1080,80 1440,0 L1440,80 L0,80 Z" fill="#06091a"/>
        </svg>
      </div>
    </section>
  )
}
