import { useState } from 'react'
import { useLanguage } from '../utils/LanguageContext'
import './DoctorConsultancy.css'

const DOCTORS = [
  {
    id: 1,
    name: 'Dr. Sarah Chen',
    title: 'Infectious Disease Specialist',
    hospital: 'MediCare Advanced Institute',
    rating: 4.9,
    reviews: 312,
    availability: 'Available Today',
    availStatus: 'green',
    experience: '14 yrs',
    specialty: 'Antibiotic Resistance',
    languages: ['English', 'Mandarin'],
    consults: 1240,
    avatar: 'SC',
    gradStart: '#0d9488',
    gradEnd: '#0ea5e9',
  },
  {
    id: 2,
    name: 'Dr. Rajesh Kumar',
    title: 'Internal Medicine Physician',
    hospital: 'HealthTech Medical Center',
    rating: 4.8,
    reviews: 228,
    availability: 'Next: 3:00 PM',
    availStatus: 'green',
    experience: '11 yrs',
    specialty: 'Infectious Diseases',
    languages: ['English', 'Hindi'],
    consults: 890,
    avatar: 'RK',
    gradStart: '#8b5cf6',
    gradEnd: '#ec4899',
  },
  {
    id: 3,
    name: 'Dr. Amelia Ross',
    title: 'Clinical Microbiologist',
    hospital: 'BioHealth Research Hospital',
    rating: 4.95,
    reviews: 456,
    availability: 'Available Now',
    availStatus: 'green',
    experience: '18 yrs',
    specialty: 'Microbiology & Resistance',
    languages: ['English', 'French'],
    consults: 2100,
    avatar: 'AR',
    gradStart: '#22c55e',
    gradEnd: '#0d9488',
  },
  {
    id: 4,
    name: 'Dr. Omar Hassan',
    title: 'Pediatric Infectiologist',
    hospital: 'WorldCare Children\'s Hospital',
    rating: 4.7,
    reviews: 189,
    availability: 'Tomorrow 9 AM',
    availStatus: 'amber',
    experience: '9 yrs',
    specialty: 'Pediatric Infections',
    languages: ['English', 'Arabic'],
    consults: 670,
    avatar: 'OH',
    gradStart: '#f59e0b',
    gradEnd: '#ef4444',
  },
]

function StarRating({ value }) {
  return (
    <div className="star-rating">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="13" height="13" viewBox="0 0 24 24"
          fill={s <= Math.round(value) ? '#f59e0b' : 'none'}
          stroke="#f59e0b" strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      <span>{value}</span>
    </div>
  )
}

export default function DoctorConsultancy() {
  const [activeDoctor, setActiveDoctor] = useState(null)
  const { t } = useLanguage()

  return (
    <section className="doctors section" id="doctors">
      <div className="bg-mesh" aria-hidden>
        <div className="orb" style={{ width: 600, height: 600, top: '-200px', right: '-200px', background: 'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)' }} />
        <div className="orb" style={{ width: 400, height: 400, bottom: '-100px', left: '-100px', background: 'radial-gradient(circle, rgba(34,197,94,0.10) 0%, transparent 70%)', animationDelay: '3s' }} />
      </div>

      <div className="section-container">
        {/* Header */}
        <div className="doctors__header animate-fadein">
          <h2 className="section-title">
            {t('doctors.title')} <span className="gradient-text">{t('doctors.titleHL')}</span>
          </h2>
          <div className="section-divider" />
          <p className="section-subtitle">{t('doctors.subtitle')}</p>
        </div>

        {/* Filter bar */}
        <div className="doctors__filters animate-fadein anime-delay-1">
          {[
            { labelKey: 'doctors.allSpecialists', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
            { labelKey: 'doctors.infectiousDis',  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/></svg> },
            { labelKey: 'doctors.microbiology',   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2v7.527a2 2 0 0 1-.211.896L3.5 21h17l-6.289-10.577A2 2 0 0 1 14 9.527V2"/><line x1="8.5" y1="2" x2="15.5" y2="2"/></svg> },
            { labelKey: 'doctors.pediatrics',     icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
            { labelKey: 'doctors.availNow',       icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          ].map(({ labelKey, icon }, idx) => (
            <button key={labelKey} className={`doctors__filter${idx === 0 ? ' doctors__filter--active' : ''}`}>
              {icon} {t(labelKey)}
            </button>
          ))}
        </div>

        {/* Doctors grid */}
        <div className="doctors__grid">
          {DOCTORS.map((doc, i) => (
            <div
              key={doc.id}
              className={`doctor-card card animate-fadein anime-delay-${i + 1}${activeDoctor === doc.id ? ' doctor-card--active' : ''}`}
              onMouseEnter={() => setActiveDoctor(doc.id)}
              onMouseLeave={() => setActiveDoctor(null)}
            >
              {/* Card top */}
              <div className="doctor-card__top">
                {/* Avatar */}
                <div className="doctor-avatar" style={{ background: `linear-gradient(135deg, ${doc.gradStart}, ${doc.gradEnd})` }}>
                  <span>{doc.avatar}</span>
                  <div className={`doctor-avatar__status status-dot ${doc.availStatus}`} />
                </div>

                {/* Basic info */}
                <div className="doctor-info">
                  <h3 className="doctor-info__name">{doc.name}</h3>
                  <p className="doctor-info__title">{doc.title}</p>
                  <p className="doctor-info__hospital">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    </svg>
                    {doc.hospital}
                  </p>
                  <StarRating value={doc.rating} />
                </div>
              </div>

              {/* Stats row */}
              <div className="doctor-stats">
                <div className="doctor-stat">
                  <span className="doctor-stat__value">{doc.experience}</span>
                  <span className="doctor-stat__label">{t('doctors.experience')}</span>
                </div>
                <div className="doctor-stat">
                  <span className="doctor-stat__value">{doc.consults.toLocaleString()}</span>
                  <span className="doctor-stat__label">{t('doctors.consults')}</span>
                </div>
                <div className="doctor-stat">
                  <span className="doctor-stat__value">{doc.reviews}</span>
                  <span className="doctor-stat__label">{t('doctors.reviews')}</span>
                </div>
              </div>

              {/* Specialty tag */}
              <div className="doctor-specialty">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>{doc.specialty}</span>
              </div>

              {/* Availability */}
              <div className={`doctor-avail doctor-avail--${doc.availStatus}`}>
                <span className={`status-dot ${doc.availStatus}`} />
                <span>{doc.availability}</span>
              </div>

              {/* Languages */}
              <div className="doctor-langs">
                {doc.languages.map(l => <span key={l} className="doctor-lang-tag">{l}</span>)}
              </div>

              {/* Actions */}
              <div className="doctor-actions">
                <button className="btn-primary doctor-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.61 5C1.6 3.97 2.35 3.1 3.36 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.9a16 16 0 0 0 6.6 6.6l.75-.76a2 2 0 0 1 2.12-.44c.906.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  {t('doctors.consult')}
                </button>
                <button className="btn-secondary doctor-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {t('doctors.book')}
                </button>
                <button className="btn-ghost doctor-btn-chat">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  {t('doctors.chat')}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Telemedicine banner */}
        <div className="doctors__banner animate-fadein anime-delay-5">
          <div className="doctors__banner-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.361a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"/>
            </svg>
          </div>
          <div>
            <h3>{t('doctors.telemedicineTitle')}</h3>
            <p>{t('doctors.telemedicineDesc')}</p>
          </div>
          <button className="btn-primary doctors__banner-btn">{t('doctors.startVideo')}</button>
        </div>
      </div>
    </section>
  )
}
