import { useLanguage } from '../utils/LanguageContext'
import './MedicalUpdates.css'

const UPDATES = [
  {
    id: 1,
    category: 'Alert',
    categoryColor: 'red',
    title: 'WHO Warning: Antibiotic Resistance Reaches Critical Levels',
    excerpt: 'Global health authorities issue urgent guidance on the escalating antibiotic resistance crisis. Over 1.2 million deaths annually attributable to resistant bacteria.',
    date: 'Mar 12, 2026',
    readTime: '4 min read',
    image: 'alert',
    gradStart: '#ef4444',
    gradEnd: '#f59e0b',
  },
  {
    id: 2,
    category: 'Guideline',
    categoryColor: 'blue',
    title: 'New Antibiotic Stewardship Guidelines for Primary Care Clinics',
    excerpt: 'Updated clinical protocols for antibiotic prescription in outpatient settings. Key changes include mandatory AI-screening for respiratory infections.',
    date: 'Mar 10, 2026',
    readTime: '6 min read',
    image: 'guide',
    gradStart: '#0ea5e9',
    gradEnd: '#8b5cf6',
  },
  {
    id: 3,
    category: 'Research',
    categoryColor: 'teal',
    title: 'AI Model Achieves 98% Accuracy in Differentiating Viral vs Bacterial Infections',
    excerpt: 'Breakthrough study from Stanford demonstrates machine learning can reduce unnecessary antibiotic prescriptions by 67% in emergency departments.',
    date: 'Mar 8, 2026',
    readTime: '8 min read',
    image: 'research',
    gradStart: '#0d9488',
    gradEnd: '#22c55e',
  },
  {
    id: 4,
    category: 'Prevention',
    categoryColor: 'green',
    title: 'Top 10 Infection Prevention Strategies for Healthcare Workers',
    excerpt: 'Evidence-based protocols for minimizing infection spread and reducing the pressure for antibiotic use in clinical environments.',
    date: 'Mar 6, 2026',
    readTime: '5 min read',
    image: 'prevent',
    gradStart: '#22c55e',
    gradEnd: '#0d9488',
  },
  {
    id: 5,
    category: 'Public Health',
    categoryColor: 'teal',
    title: 'Community Awareness Campaign: "Antibiotics Are Not Always the Answer"',
    excerpt: 'National health campaign results show 40% reduction in patient-driven antibiotic demand following AI-powered patient education initiatives.',
    date: 'Mar 4, 2026',
    readTime: '3 min read',
    image: 'public',
    gradStart: '#14b8a6',
    gradEnd: '#0ea5e9',
  },
  {
    id: 6,
    category: 'Technology',
    categoryColor: 'blue',
    title: 'Smart Prescription Systems Integrate with Hospital EHR Platforms',
    excerpt: 'New interoperability standards allow AI risk-alert systems to directly flag inappropriate antibiotic orders within existing clinical workflows.',
    date: 'Mar 2, 2026',
    readTime: '5 min read',
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
            <div className="updates__featured-visual" style={{ background: `linear-gradient(135deg, ${UPDATES[0].gradStart}, ${UPDATES[0].gradEnd})` }}>
              <div className="updates__featured-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {ICON_MAP[UPDATES[0].image]}
                </svg>
              </div>
              <div className="updates__featured-overlay" />
            </div>

            <div className="updates__featured-content">
              <div className="updates__meta">
                <span className={`tag ${TAG_COLOR_MAP[UPDATES[0].categoryColor]}`}>{UPDATES[0].category}</span>
                <span className="updates__date">{UPDATES[0].date}</span>
                <span className="updates__read-time">{UPDATES[0].readTime}</span>
              </div>
              <h3 className="updates__featured-title">{UPDATES[0].title}</h3>
              <p className="updates__featured-excerpt">{UPDATES[0].excerpt}</p>
              <button className="btn-primary updates__read-btn">
                {t('updates.readFull')}
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
                    <span className={`tag ${TAG_COLOR_MAP[u.categoryColor]}`}>{u.category}</span>
                    <span className="updates__date">{u.date}</span>
                  </div>
                  <h4 className="updates__card-title">{u.title}</h4>
                  <p className="updates__card-excerpt">{u.excerpt}</p>
                  <button className="btn-ghost">
                    {t('updates.readMore')}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row */}
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
                  <span className={`tag ${TAG_COLOR_MAP[u.categoryColor]}`}>{u.category}</span>
                  <span className="updates__date">{u.date}</span>
                </div>
                <h4 className="updates__mini-title">{u.title}</h4>
                <button className="btn-ghost">{t('updates.readMore')} →</button>
              </div>
            </div>
          ))}
        </div>

        {/* View all */}
        <div className="updates__view-all">
          <button className="btn-secondary">
            {t('updates.viewAll')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
