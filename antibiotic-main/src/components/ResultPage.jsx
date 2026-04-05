import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import './ResultPage.css'

const LEVEL_CFG = {
  Low:    { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.30)',  icon: '✓', label: 'Low Risk', grad: ['#16a34a','#22c55e'] },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)', icon: '⚠', label: 'Moderate Risk', grad: ['#d97706','#f59e0b'] },
  High:   { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.30)',  icon: '!', label: 'High Risk', grad: ['#dc2626','#ef4444'] },
}

const ACTION_CFG = {
  'observe':          { icon: '👁', title: 'Observe & Monitor', sub: 'No immediate antibiotic needed. Rest and monitor symptoms for 48–72 hours.', color: '#22c55e' },
  'doctor review':    { icon: '👨‍⚕️', title: 'Doctor Review Advised', sub: 'Schedule a clinical consultation within 24 hours for professional evaluation.', color: '#f59e0b' },
  'further testing':  { icon: '🔬', title: 'Further Testing Required', sub: 'Urgent clinical review + additional diagnostics (blood culture, chest X-ray) recommended.', color: '#ef4444' },
}

const PATTERN_CFG = {
  'viral-like':           { color: '#0891b2', icon: '🦠', desc: 'Symptom pattern consistent with viral infection' },
  'bacterial suspicion':  { color: '#7c3aed', icon: '🧫', desc: 'Clinical indicators suggest possible bacterial cause' },
  'urgent review':        { color: '#dc2626', icon: '🚨', desc: 'Urgent clinical evaluation required' },
}

/* Animated score gauge */
function ScoreGauge({ score, level }) {
  const cfg = LEVEL_CFG[level]
  const circumference = 502
  const [animated, setAnimated] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300)
    return () => clearTimeout(t)
  }, [])

  const offset = circumference - (circumference * score) / 100

  return (
    <div className="rp-gauge" ref={ref}>
      <svg className="rp-gauge__svg" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="rpGaugeGrad" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={cfg.grad[0]}/>
            <stop offset="100%" stopColor={cfg.grad[1]}/>
          </linearGradient>
          <filter id="rpGlow">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={cfg.color} floodOpacity="0.55"/>
          </filter>
        </defs>
        {/* Track */}
        <circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" strokeWidth="18"/>
        {/* Arc */}
        <circle
          cx="100" cy="100" r="80"
          fill="none"
          stroke="url(#rpGaugeGrad)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1)', filter: 'url(#rpGlow)' }}
        />
        {/* Zone ticks */}
        {[38, 68].map((v, i) => {
          const angle = (v / 100) * 360 - 90
          const rad = (angle * Math.PI) / 180
          const x1 = 100 + 70 * Math.cos(rad), y1 = 100 + 70 * Math.sin(rad)
          const x2 = 100 + 90 * Math.cos(rad), y2 = 100 + 90 * Math.sin(rad)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="2.5"/>
        })}
        {/* Center text */}
        <text x="100" y="90" textAnchor="middle" fontSize="38" fontWeight="900"
          fontFamily="Space Grotesk,sans-serif" fill={cfg.color}>
          {animated ? score : 0}
        </text>
        <text x="100" y="108" textAnchor="middle" fontSize="9.5" fill="#64748b"
          fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="1.5">
          RISK SCORE
        </text>
        <text x="100" y="124" textAnchor="middle" fontSize="9" fill={cfg.color}
          fontFamily="Inter,sans-serif" fontWeight="800" letterSpacing="0.5">
          {cfg.label.toUpperCase()}
        </text>
      </svg>
      <div className="rp-gauge__legend">
        {Object.entries(LEVEL_CFG).map(([k, v]) => (
          <div key={k} className={`rp-gauge__leg-item${level === k ? ' rp-gauge__leg-item--active' : ''}`}>
            <span className="rp-gauge__leg-dot" style={{ background: v.color }}/>
            <span>{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* Confidence bar */
function ConfidenceBar({ value }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(value), 400); return () => clearTimeout(t) }, [value])
  return (
    <div className="rp-conf">
      <div className="rp-conf__header">
        <span>AI Confidence Score</span>
        <span className="rp-conf__value">{value}%</span>
      </div>
      <div className="rp-conf__track">
        <div className="rp-conf__fill" style={{ width: `${w}%` }}/>
      </div>
      <div className="rp-conf__labels">
        <span>Low</span><span>Moderate</span><span>High</span>
      </div>
    </div>
  )
}

export default function ResultPage() {
  const { state } = useLocation()
  const navigate  = useNavigate()

  // Guard: if landed directly without form state, redirect
  if (!state?.result) {
    return (
      <div className="rp-empty">
        <h2>No analysis data found.</h2>
        <button className="hero__btn-primary" onClick={() => navigate('/analysis')}>
          Start New Analysis
        </button>
      </div>
    )
  }

  const { form, result } = state
  const { score, level, confidence, pattern, reasons, action } = result
  const cfg    = LEVEL_CFG[level]
  const actCfg = ACTION_CFG[action]
  const patCfg = PATTERN_CFG[pattern] || PATTERN_CFG['viral-like']

  return (
    <div className="rp-page">
      <div className="rp-bg">
        <div className="rp-bg__orb rp-bg__orb--1" style={{ background: `radial-gradient(circle, ${cfg.color}22 0%, transparent 70%)` }}/>
        <div className="rp-bg__orb rp-bg__orb--2"/>
        <div className="rp-bg__grid"/>
      </div>

      <div className="rp-container">

        {/* ── Header ── */}
        <div className="rp-header animate-fadein">
          <div className="section-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            AI Analysis Result
          </div>
          <h1 className="rp-header__title">
            Risk <span className="gradient-text">Assessment Report</span>
          </h1>
          <div className="rp-patient-tag">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Patient: <strong>{form.patient_id}</strong>
            <span className="rp-sep" />
            Age: <strong>{form.age}</strong>
            <span className="rp-sep" />
            Sex: <strong>{form.sex}</strong>
          </div>
        </div>

        {/* ── Top row: gauge + risk card ── */}
        <div className="rp-top animate-fadein anime-delay-1">

          {/* Gauge column */}
          <div className="rp-gauge-col card">
            <div className="rp-card-label">Risk Score Meter</div>
            <ScoreGauge score={score} level={level} />
          </div>

          {/* Risk + pattern + confidence */}
          <div className="rp-summary-col">

            {/* Risk level banner */}
            <div className="rp-risk-banner card animate-fadein anime-delay-2"
              style={{ '--risk-color': cfg.color, '--risk-bg': cfg.bg, '--risk-border': cfg.border }}>
              <div className="rp-risk-icon">{cfg.icon}</div>
              <div>
                <div className="rp-risk-level">{cfg.label}</div>
                <div className="rp-risk-sub">Antibiotic Misuse Risk Level</div>
              </div>
              <div className="rp-risk-score-pill">{score}/100</div>
            </div>

            {/* Pattern */}
            <div className="rp-pattern card animate-fadein anime-delay-2"
              style={{ '--pat-color': patCfg.color }}>
              <div className="rp-pattern__icon">{patCfg.icon}</div>
              <div>
                <div className="rp-pattern__label">Possible Pattern</div>
                <div className="rp-pattern__value" style={{ color: patCfg.color }}>
                  {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                </div>
                <div className="rp-pattern__desc">{patCfg.desc}</div>
              </div>
            </div>

            {/* Confidence */}
            <div className="card" style={{ padding: '20px 22px' }}>
              <ConfidenceBar value={confidence} />
            </div>
          </div>
        </div>

        {/* ── Reasons ── */}
        <div className="rp-section card animate-fadein anime-delay-3">
          <div className="rp-section__head">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
            AI Reasoning Factors
          </div>
          <div className="rp-reasons">
            {reasons.map((r, i) => (
              <div className="rp-reason animate-fadein" key={i}
                style={{ animationDelay: `${0.5 + i * 0.08}s` }}>
                <span className="rp-reason__num">{String(i + 1).padStart(2,'0')}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={cfg.color} strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="rp-reason__text">{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Inputs summary ── */}
        <div className="rp-section card animate-fadein anime-delay-4">
          <div className="rp-section__head">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            Input Data Summary
          </div>
          <div className="rp-inputs-grid">
            {[
              { label: 'Fever',              val: form.fever },
              { label: 'Cough',              val: form.cough },
              { label: 'Sore Throat',        val: form.sore_throat },
              { label: 'Runny Nose',         val: form.runny_nose },
              { label: 'Duration',           val: `${form.symptom_duration_days} day(s)` },
              { label: 'Recent Antibiotic',  val: form.recent_antibiotic_use },
              { label: 'Allergy',            val: form.antibiotic_allergy },
              { label: 'Infection Type',     val: form.suspected_infection_type || '—' },
              { label: 'WBC',                val: form.WBC_count ? `${form.WBC_count} ×10³/μL` : '—' },
              { label: 'CRP',                val: form.CRP_level  ? `${form.CRP_level} mg/L`   : '—' },
            ].map(item => (
              <div className="rp-input-chip" key={item.label}>
                <span className="rp-input-chip__label">{item.label}</span>
                <span className={`rp-input-chip__val${item.val === 'yes' ? ' v-yes' : item.val === 'no' ? ' v-no' : ''}`}>
                  {item.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recommended Action ── */}
        <div className="rp-action-banner card animate-fadein anime-delay-5"
          style={{ '--act-color': actCfg.color }}>
          <div className="rp-action-icon">{actCfg.icon}</div>
          <div className="rp-action-body">
            <div className="rp-action-label">Recommended Action</div>
            <div className="rp-action-title">{actCfg.title}</div>
            <p className="rp-action-sub">{actCfg.sub}</p>
          </div>
        </div>

        {/* ── Disclaimer ── */}
        <div className="rp-disclaimer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          This AI analysis is a <strong>decision-support tool only</strong> and does not replace
          professional medical diagnosis. Always consult a licensed healthcare provider for clinical decisions.
        </div>

        {/* ── Action buttons ── */}
        <div className="rp-actions animate-fadein">
          <button className="hero__btn-primary rp-btn" onClick={() => navigate('/analysis')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
            New Analysis
          </button>
          <button className="hero__btn-secondary rp-btn" onClick={() => navigate('/doctors')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Consult a Doctor
          </button>
          <button className="rp-btn-print" onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print Report
          </button>
        </div>

      </div>
    </div>
  )
}
