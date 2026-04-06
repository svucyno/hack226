import { useState } from 'react'
import { useLanguage } from '../utils/LanguageContext'
import './MedicalUpdates.css'

const UPDATES = [
  {
    id: 1,
    categoryKey: 'updates.categoryAlert',
    categoryColor: 'red',
    titleKey: 'updates.article1.title',
    excerptKey: 'updates.article1.excerpt',
    dateKey: 'updates.article1.date',
    readTimeKey: 'updates.article1.readTime',
    image: 'alert',
    gradStart: '#ef4444',
    gradEnd: '#f59e0b',
  },
  {
    id: 2,
    categoryKey: 'updates.categoryGuideline',
    categoryColor: 'blue',
    titleKey: 'updates.article2.title',
    excerptKey: 'updates.article2.excerpt',
    dateKey: 'updates.article2.date',
    readTimeKey: 'updates.article2.readTime',
    image: 'guide',
    gradStart: '#0ea5e9',
    gradEnd: '#8b5cf6',
  },
  {
    id: 3,
    categoryKey: 'updates.categoryResearch',
    categoryColor: 'teal',
    titleKey: 'updates.article3.title',
    excerptKey: 'updates.article3.excerpt',
    dateKey: 'updates.article3.date',
    readTimeKey: 'updates.article3.readTime',
    image: 'research',
    gradStart: '#0d9488',
    gradEnd: '#22c55e',
  },
  {
    id: 4,
    categoryKey: 'updates.categoryPrevention',
    categoryColor: 'green',
    titleKey: 'updates.article4.title',
    excerptKey: 'updates.article4.excerpt',
    dateKey: 'updates.article4.date',
    readTimeKey: 'updates.article4.readTime',
    image: 'prevent',
    gradStart: '#22c55e',
    gradEnd: '#0d9488',
  },
  {
    id: 5,
    categoryKey: 'updates.categoryPublicHealth',
    categoryColor: 'teal',
    titleKey: 'updates.article5.title',
    excerptKey: 'updates.article5.excerpt',
    dateKey: 'updates.article5.date',
    readTimeKey: 'updates.article5.readTime',
    image: 'public',
    gradStart: '#14b8a6',
    gradEnd: '#0ea5e9',
  },
  {
    id: 6,
    categoryKey: 'updates.categoryTechnology',
    categoryColor: 'blue',
    titleKey: 'updates.article6.title',
    excerptKey: 'updates.article6.excerpt',
    dateKey: 'updates.article6.date',
    readTimeKey: 'updates.article6.readTime',
    image: 'tech',
    gradStart: '#8b5cf6',
    gradEnd: '#ec4899',
  },
]

const ICON_MAP = {
  alert:   <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01"/>,
  guide:   <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  research:<><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
  prevent: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
  public:  <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
  tech:    <><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><path d="M8 21h8M12 17v4"/></>,
}

const TAG_COLOR_MAP = {
  red:    'tag-red',
  blue:   'tag-blue',
  teal:   'tag-teal',
  green:  'tag-green',
  amber:  'tag-amber',
}

export default function MedicalUpdates() {
  const { t } = useLanguage()
  const [expandedById, setExpandedById] = useState({})
  const [showAllUpdates, setShowAllUpdates] = useState(false)
  const featured = UPDATES[0]
  const READ_LESS = 'Read Less'

  const isExpanded = (id) => Boolean(expandedById[id])
  const toggleExpanded = (id) => {
    setExpandedById((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const getExcerpt = (key, id, previewLength) => {
    const text = t(key)
    if (isExpanded(id) || text.length <= previewLength) return text
    return `${text.slice(0, previewLength).trim()}...`
  }

  return (
    <section className="updates section section-alt" id="updates">
      <div className="bg-mesh" aria-hidden>
        <div className="orb" style={{ width: 500, height: 500, top: '-100px', left: '-150px', background: 'radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)' }} />
      </div>

      <div className="section-container">
        {/* Header */}
        <div className="updates__header animate-fadein">
          <h2 className="section-title">
            {t('updates.title')} <span className="gradient-text">{t('updates.titleHL')}</span>
          </h2>
          <div className="section-divider" />
          <p className="section-subtitle">{t('updates.subtitle')}</p>
        </div>

        {/* Featured + grid */}
        <div className="updates__layout">
          {/* Featured article */}
          <div className="updates__featured card animate-fadein anime-delay-1">
            <div className="updates__featured-visual" style={{ background: `linear-gradient(135deg, ${featured.gradStart}, ${featured.gradEnd})` }}>
              <div className="updates__featured-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {ICON_MAP[featured.image]}
                </svg>
              </div>
              <div className="updates__featured-overlay" />
            </div>

            <div className="updates__featured-content">
              <div className="updates__meta">
                <span className={`tag ${TAG_COLOR_MAP[featured.categoryColor]}`}>{t(featured.categoryKey)}</span>
                <span className="updates__date">{t(featured.dateKey)}</span>
                <span className="updates__read-time">{t(featured.readTimeKey)}</span>
              </div>
              <h3 className="updates__featured-title">{t(featured.titleKey)}</h3>
              <p className={`updates__featured-excerpt${isExpanded(featured.id) ? ' updates__featured-excerpt--expanded' : ''}`}>
                {getExcerpt(featured.excerptKey, featured.id, 110)}
              </p>
              <button type="button" className="btn-primary updates__read-btn" onClick={() => toggleExpanded(featured.id)}>
                {isExpanded(featured.id) ? READ_LESS : t('updates.readFull')}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Side cards */}
          <div className="updates__aside">
            {UPDATES.slice(1, 4).map((u, i) => (
              <div key={u.id} className={`updates__card card animate-fadein anime-delay-${i + 2}`}>
                <div className="updates__card-icon-wrap" style={{ background: `linear-gradient(135deg, ${u.gradStart}, ${u.gradEnd})` }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {ICON_MAP[u.image]}
                  </svg>
                </div>
                <div className="updates__card-body">
                  <div className="updates__meta">
                    <span className={`tag ${TAG_COLOR_MAP[u.categoryColor]}`}>{t(u.categoryKey)}</span>
                    <span className="updates__date">{t(u.dateKey)}</span>
                  </div>
                  <h4 className="updates__card-title">{t(u.titleKey)}</h4>
                  <p className={`updates__card-excerpt${isExpanded(u.id) ? ' updates__card-excerpt--expanded' : ''}`}>
                    {getExcerpt(u.excerptKey, u.id, 85)}
                  </p>
                  <button type="button" className="btn-ghost" onClick={() => toggleExpanded(u.id)}>
                    {isExpanded(u.id) ? READ_LESS : t('updates.readMore')}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row (hidden until View All is clicked) */}
        {showAllUpdates && (
          <div className="updates__bottom-row">
            {UPDATES.slice(4).map((u, i) => (
              <div key={u.id} className={`updates__mini card animate-fadein anime-delay-${i + 4}`}>
                <div className="updates__mini-icon" style={{ background: `linear-gradient(135deg, ${u.gradStart}, ${u.gradEnd})` }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {ICON_MAP[u.image]}
                  </svg>
                </div>
                <div>
                  <div className="updates__meta" style={{ marginBottom: 4 }}>
                    <span className={`tag ${TAG_COLOR_MAP[u.categoryColor]}`}>{t(u.categoryKey)}</span>
                    <span className="updates__date">{t(u.dateKey)}</span>
                  </div>
                  <h4 className="updates__mini-title">{t(u.titleKey)}</h4>
                  <p className={`updates__card-excerpt${isExpanded(u.id) ? ' updates__card-excerpt--expanded' : ''}`}>
                    {getExcerpt(u.excerptKey, u.id, 70)}
                  </p>
                  <button type="button" className="btn-ghost" onClick={() => toggleExpanded(u.id)}>
                    {isExpanded(u.id) ? READ_LESS : `${t('updates.readMore')} →`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View all */}
        <div className="updates__view-all">
          <button type="button" className="btn-secondary" onClick={() => setShowAllUpdates((prev) => !prev)}>
            {showAllUpdates ? t('meter.back') : t('updates.viewAll')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
