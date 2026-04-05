import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../utils/LanguageContext'
import './AntibioticMeter.css'
import './PatientForm.css'

const LEVELS = [
  { id: 'safe',     labelKey: 'meter.safe',     descKey: 'meter.safeDesc', color: '#22c55e', range: [0, 40]   },
  { id: 'moderate', labelKey: 'meter.moderate',  descKey: 'meter.modDesc',  color: '#f59e0b', range: [40, 70]  },
  { id: 'high',     labelKey: 'meter.high',      descKey: 'meter.highDesc', color: '#ef4444', range: [70, 100] },
]

const STEPS = [
  { id: 1, labelKey: 'meter.step1', icon: '👤' },
  { id: 2, labelKey: 'meter.step2', icon: '🌡️' },
  { id: 3, labelKey: 'meter.step3', icon: '🔬' },
  { id: 4, labelKey: 'meter.step4', icon: '💓' },
]

const INIT = {
  patient_id: '', age: '', sex: '',
  fever: '', cough: '', sore_throat: '', runny_nose: '',
  symptom_duration_days: '',
  recent_antibiotic_use: '', antibiotic_allergy: '',
  suspected_infection_type: '',
  WBC_count: '', CRP_level: '',
  spo2: '', pulse_rate: '', temperature: '',
  ts_channel_id: '',
  ts_field_temp: '1', ts_field_spo2: '2', ts_field_pulse: '3',
}

function computeRisk(f) {
  let score = 30
  if (f.recent_antibiotic_use === 'yes') score += 28
  if (f.suspected_infection_type === 'bacterial') score += 22
  if (f.suspected_infection_type === 'viral')     score -= 12
  if (f.suspected_infection_type === 'unknown')   score += 8
  const dur = parseInt(f.symptom_duration_days) || 0
  if (dur <= 2) score -= 12
  else if (dur >= 7) score += 16
  const symptomCount = ['fever','cough','sore_throat','runny_nose'].filter(k => f[k] === 'yes').length
  score += symptomCount * 4
  const crp = parseFloat(f.CRP_level)
  if (!isNaN(crp)) { if (crp > 10) score += 18; else if (crp > 5) score += 8 }
  const wbc = parseFloat(f.WBC_count)
  if (!isNaN(wbc)) { if (wbc > 11) score += 12; else if (wbc < 4) score += 6 }

  /* ── Vitals scoring ── */
  const spo2  = parseFloat(f.spo2)
  const pulse = parseFloat(f.pulse_rate)
  const temp  = parseFloat(f.temperature)
  if (!isNaN(spo2)) {
    if      (spo2 < 90)  score += 22   // critical hypoxaemia
    else if (spo2 < 94)  score += 14   // low SpO2 → respiratory concern
    else if (spo2 >= 97) score -=  5   // healthy oxygenation
  }
  if (!isNaN(pulse)) {
    if      (pulse > 120) score += 15  // significant tachycardia
    else if (pulse > 100) score +=  8  // mild tachycardia
    else if (pulse <  60) score +=  5  // bradycardia
  }
  if (!isNaN(temp)) {
    if      (temp >= 39.0) score += 16  // high fever
    else if (temp >= 38.0) score +=  8  // fever confirmed
    else if (temp <  36.0) score +=  8  // hypothermia
    else                   score -=  5  // normal temperature
  }

  score = Math.max(5, Math.min(98, score))
  const level      = score < 38 ? 'Low' : score < 68 ? 'Medium' : 'High'
  const confidence = Math.round(72 + Math.random() * 22)
  const pattern =
    f.suspected_infection_type === 'viral' || (dur <= 3 && f.runny_nose === 'yes')
      ? 'Viral-like'
      : score >= 68 ? 'Urgent review'
      : 'Bacterial suspicion'
  const reasons = []
  if (dur <= 3)                               reasons.push('Short symptom duration (likely viral)')
  if (dur >= 7)                               reasons.push('Prolonged symptom duration')
  if (f.fever === 'yes')                      reasons.push('Fever present')
  if (f.fever === 'no')                       reasons.push('No fever detected (mild presentation)')
  if (f.recent_antibiotic_use === 'yes')      reasons.push('Recent antibiotic use — resistance risk')
  if (f.suspected_infection_type === 'viral') reasons.push('Viral infection suspected by clinician')
  if (!isNaN(crp) && crp <= 5)               reasons.push('Normal CRP level')
  if (!isNaN(crp) && crp > 10)               reasons.push('Elevated CRP — bacterial indicator')
  if (!isNaN(wbc) && wbc <= 11)              reasons.push('Normal WBC count')
  if (!isNaN(wbc) && wbc > 11)               reasons.push('Elevated WBC — possible bacterial infection')
  if (!isNaN(spo2) && spo2 < 94)             reasons.push(`Low SpO₂ (${spo2}%) — respiratory concern`)
  if (!isNaN(spo2) && spo2 >= 97)            reasons.push(`Normal SpO₂ (${spo2}%)`)
  if (!isNaN(pulse) && pulse > 100)          reasons.push(`Tachycardia (${pulse} bpm)`)
  if (!isNaN(temp)  && temp >= 38)           reasons.push(`Confirmed fever (${temp}°C)`)
  if (!isNaN(temp)  && temp < 36)            reasons.push(`Hypothermia (${temp}°C)`)
  if (symptomCount <= 2)                      reasons.push('Limited symptom cluster')
  const action =
    level === 'Low' ? 'Observe' : level === 'Medium' ? 'Doctor Review' : 'Further Testing'
  return { score, level, confidence, pattern, reasons: reasons.slice(0, 6), action }
}

function YesNo({ label, field, value, onChange }) {
  return (
    <div className="pf-yesno">
      <div className="pf-yesno__label">{label}</div>
      <div className="pf-yesno__btns">
        {['yes','no'].map(opt => (
          <button
            key={opt}
            type="button"
            className={`pf-yesno__btn pf-yesno__btn--${opt}${value === opt ? ' pf-yesno__btn--active' : ''}`}
            onClick={() => onChange(field, opt)}
          >
            {opt === 'yes' ? (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Yes</>
            ) : (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg> No</>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="pf-field">
      <label className="pf-field__label">{label}{hint && <span className="pf-field__hint">{hint}</span>}</label>
      {children}
    </div>
  )
}

/* ── Dynamic info cards ── */
const STATIC_CARDS = [
  {
    id: 'status',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    title: 'Antibiotic Usage Status',
    badge: { label: 'Live Monitor', color: 'teal' },
    metrics: [
      { label: 'Current Dosage Frequency', value: '2x daily', status: 'green' },
      { label: 'Treatment Duration',        value: '7 days',    status: 'green' },
      { label: 'Resistance Index',          value: 'Low 12%',   status: 'green' },
      { label: 'Last Updated',              value: '2 min ago', status: 'neutral' },
    ],
  },
  {
    id: 'symptoms',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    title: 'Patient Symptoms Summary',
    badge: { label: 'AI Analyzed', color: 'blue' },
    metrics: [
      { label: 'Fever',            value: '38.2°C', status: 'amber' },
      { label: 'Throat Infection', value: 'Mild',   status: 'green' },
      { label: 'Cough Duration',   value: '3 days', status: 'amber' },
      { label: 'Bacterial Likely', value: '34%',    status: 'green' },
    ],
  },
  {
    id: 'attention',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: 'Suggested Medical Attention',
    badge: { label: 'Recommendation', color: 'green' },
    metrics: [
      { label: 'Urgency Level',     value: 'Non-urgent', status: 'green' },
      { label: 'Consultation Type', value: 'General GP',  status: 'green' },
      { label: 'Antibiotic Need',   value: 'Unlikely',   status: 'green' },
      { label: 'Follow-up In',      value: '5–7 days',   status: 'neutral' },
    ],
  },
]

const ICON_STATUS  = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
const ICON_SYMPTOM = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
const ICON_ATTN    = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>

function getDynamicCards(form, result) {
  if (!result) return STATIC_CARDS
  const lvl = result.level
  const lvlStatus = lvl === 'Low' ? 'green' : lvl === 'Medium' ? 'amber' : 'red'
  return [
    {
      id: 'status',
      icon: ICON_STATUS,
      title: 'AI Risk Analysis Results',
      badge: { label: 'Analyzed', color: lvlStatus === 'green' ? 'teal' : lvlStatus === 'amber' ? 'teal' : 'teal' },
      metrics: [
        { label: 'Risk Score',    value: `${result.score} / 100`,  status: lvlStatus },
        { label: 'Risk Level',    value: result.level,              status: lvlStatus },
        { label: 'Confidence',    value: `${result.confidence}%`,   status: 'green' },
        { label: 'Pattern',       value: result.pattern,            status: 'neutral' },
      ],
    },
    {
      id: 'symptoms',
      icon: ICON_SYMPTOM,
      title: 'Patient Symptoms Summary',
      badge: { label: 'AI Analyzed', color: 'blue' },
      metrics: [
        { label: 'Fever',            value: form.fever === 'yes' ? 'Present' : 'None',             status: form.fever === 'yes' ? 'amber' : 'green' },
        { label: 'Symptom Duration', value: `${form.symptom_duration_days} day(s)`,                status: +form.symptom_duration_days >= 7 ? 'amber' : 'green' },
        { label: 'Cough',            value: form.cough === 'yes' ? 'Present' : 'None',             status: form.cough === 'yes' ? 'amber' : 'green' },
        { label: 'Bacterial Likely', value: form.suspected_infection_type === 'bacterial' ? 'Yes' : form.suspected_infection_type === 'viral' ? 'No' : 'Unknown', status: form.suspected_infection_type === 'bacterial' ? 'amber' : 'green' },
      ],
    },
    {
      id: 'attention',
      icon: ICON_ATTN,
      title: 'Suggested Medical Attention',
      badge: { label: 'Recommendation', color: 'green' },
      metrics: [
        { label: 'Urgency Level',   value: lvl === 'High' ? 'Urgent' : lvl === 'Medium' ? 'Moderate' : 'Non-urgent', status: lvl === 'High' ? 'red' : lvl === 'Medium' ? 'amber' : 'green' },
        { label: 'Action Required', value: result.action,     status: lvlStatus },
        { label: 'Antibiotic Need', value: lvl === 'Low' ? 'Unlikely' : lvl === 'Medium' ? 'Review Needed' : 'Testing Advised', status: lvl === 'High' ? 'amber' : 'green' },
        { label: 'Recent Antibiotic', value: form.recent_antibiotic_use === 'yes' ? 'Yes (Risk+)' : 'None', status: form.recent_antibiotic_use === 'yes' ? 'amber' : 'green' },
      ],
    },
  ]
}

function GaugeChart({ score }) {
  const circum = 502
  const offset = circum - (circum * score) / 100
  const level = score < 40 ? LEVELS[0] : score < 70 ? LEVELS[1] : LEVELS[2]
  const { t } = useLanguage()

  const [animated, setAnimated] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setAnimated(true) }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => { setAnimated(true) }, [score])

  return (
    <div className="gauge" ref={ref}>
      <svg className="gauge__svg" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="gaugeGrad" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#22c55e"/>
            <stop offset="50%"  stopColor="#f59e0b"/>
            <stop offset="100%" stopColor="#ef4444"/>
          </linearGradient>
          <filter id="gaugeShadow">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={level.color} floodOpacity="0.5"/>
          </filter>
        </defs>

        {/* Track */}
        <circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" strokeWidth="18" />

        {/* Progress arc */}
        <circle
          cx="100" cy="100" r="80"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={circum}
          strokeDashoffset={animated ? offset : circum}
          transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.4,0,0.2,1)', filter: 'url(#gaugeShadow)' }}
        />

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map(v => {
          const angle = (v / 100) * 360 - 90
          const rad = (angle * Math.PI) / 180
          const x1 = 100 + 72 * Math.cos(rad)
          const y1 = 100 + 72 * Math.sin(rad)
          const x2 = 100 + 88 * Math.cos(rad)
          const y2 = 100 + 88 * Math.sin(rad)
          return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="2" />
        })}

        {/* Center score */}
        <text x="100" y="92" textAnchor="middle" fontSize="36" fontWeight="800" fontFamily="Space Grotesk,sans-serif" fill={level.color}>
          {animated ? score : 0}
        </text>
        <text x="100" y="110" textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="Inter,sans-serif" fontWeight="600" letterSpacing="1">
          RISK SCORE
        </text>
        <text x="100" y="126" textAnchor="middle" fontSize="9" fill={level.color} fontFamily="Inter,sans-serif" fontWeight="700">
          {t(level.labelKey).toUpperCase()}
        </text>
      </svg>

      {/* Labels */}
      <div className="gauge__labels">
        {LEVELS.map(l => (
          <div key={l.id} className={`gauge__label${l.id === level.id ? ' gauge__label--active' : ''}`}>
            <span className="gauge__label-dot" style={{ background: l.color }} />
            <span>{t(l.labelKey)}</span>
          </div>
        ))}
      </div>

      <p className="gauge__desc">{t(level.descKey)}</p>
    </div>
  )
}

// ── Non-antibiotic alternative suggestions based on result ───────────────────
function getAlternatives(result) {
  if (!result) return null
  const f   = result.form || {}
  const lvl = result.level

  if (lvl === 'High') {
    return {
      warning: true,
      items: [
        'High risk detected \u2014 seek urgent clinical assessment before any self-treatment',
        'Do not self-prescribe antibiotics: request blood culture, CRP and WBC panel first',
        'Paracetamol 500\u20131000\u202fmg (not Aspirin) for symptom relief while awaiting assessment',
        'Maintain hydration with 2\u20133\u202fL of fluids/day and rest completely',
        'Monitor body temperature every 4\u20136\u202fh; if > 39.5\u202f\u00b0C proceed to emergency',
      ],
    }
  }

  const items = []
  if (f.suspected_infection_type === 'viral' || lvl === 'Low')
    items.push('Viral infections resolve naturally \u2014 antibiotics have no effect and accelerate resistance')
  items.push('Rest and increase fluid intake (2\u20133\u202fL/day) \u2014 most effective first-line treatment for viral illnesses')
  if (f.fever === 'yes') {
    items.push('Paracetamol 500\u20131000\u202fmg every 6\u202fh or Ibuprofen 400\u202fmg every 8\u202fh to reduce fever and relieve pain')
    items.push('Cool compress on forehead and lukewarm sponging to manage high temperature comfortably')
  }
  if (f.sore_throat === 'yes') {
    items.push('Warm saline gargle (\u00bc tsp salt in 250\u202fmL warm water) 3\u00d7 daily to reduce throat inflammation')
    items.push('Honey + warm lemon water \u2014 clinically shown to reduce cough severity and soothe the throat')
  }
  if (f.cough === 'yes') {
    items.push('Steam inhalation 10\u201315\u202fmin twice daily with eucalyptus oil for congestion and airway relief')
    items.push('OTC cough syrup: dextromethorphan for dry cough or guaifenesin (expectorant) for productive cough')
  }
  if (f.runny_nose === 'yes') {
    items.push('Saline nasal rinse (Neti pot or spray) twice daily to clear nasal passages and reduce congestion')
    items.push('Antihistamines (cetirizine\u202f/\u202floratadine) for allergic symptoms \u2014 safe for regular use')
  }
  items.push('Vitamin\u202fC 500\u20131000\u202fmg + Zinc 10\u201315\u202fmg daily to strengthen immunity and reduce illness duration')
  if (f.recent_antibiotic_use === 'yes')
    items.push('Probiotics (Lactobacillus acidophilus\u202f/\u202fBifidobacterium) to restore gut microbiome')
  if (lvl === 'Medium')
    items.push('If no improvement in 48\u201372\u202fh or symptoms worsen, consult a doctor before starting antibiotics')

  return { warning: false, items: items.slice(0, 6) }
}

export default function AntibioticMeter() {
  const [score,       setScore]       = useState(28)
  const [result,      setResult]      = useState(null)
  const { t } = useLanguage()
  const [showForm,    setShowForm]    = useState(false)
  const [step,        setStep]        = useState(1)
  const [form,        setForm]        = useState(INIT)
  const [errors,      setErrors]      = useState({})
  const [fetching,    setFetching]    = useState(false)
  const [fetchStatus, setFetchStatus] = useState(null) // null | 'success' | 'error' | 'no-channel'
  const [analyzing,   setAnalyzing]   = useState(false)
  const formRef = useRef(null)

  /* ── ThingSpeak read API key (read-only public key) ── */
  const TS_API_KEY = '74XKYGW54Z6E1ZGC'

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    setErrors(e => { const n = { ...e }; delete n[field]; return n })
  }

  const fetchVitals = async () => {
    const cid = form.ts_channel_id.trim()
    if (!cid) { setFetchStatus('no-channel'); return }
    setFetching(true)
    setFetchStatus(null)
    try {
      const res = await fetch(
        `https://api.thingspeak.com/channels/${cid}/feeds/last.json?api_key=${TS_API_KEY}`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const tempVal  = data[`field${form.ts_field_temp}`]
      const spo2Val  = data[`field${form.ts_field_spo2}`]
      const pulseVal = data[`field${form.ts_field_pulse}`]
      setForm(f => ({
        ...f,
        temperature: tempVal  != null ? String(((parseFloat(tempVal) - 32) * 5 / 9).toFixed(1)) : f.temperature,
        spo2:        spo2Val  != null ? String(parseFloat(spo2Val).toFixed(1))   : f.spo2,
        pulse_rate:  pulseVal != null ? String(Math.round(parseFloat(pulseVal))) : f.pulse_rate,
      }))
      setFetchStatus('success')
    } catch {
      setFetchStatus('error')
    } finally {
      setFetching(false)
    }
  }

  const validate = () => {
    const e = {}
    if (step === 1) {
      if (!form.patient_id.trim()) e.patient_id = 'Patient ID is required'
      if (!form.age || isNaN(form.age) || +form.age < 1 || +form.age > 120) e.age = 'Enter a valid age (1–120)'
      if (!form.sex) e.sex = 'Please select sex'
    }
    if (step === 2) {
      if (!form.fever)       e.fever       = 'Required'
      if (!form.cough)       e.cough       = 'Required'
      if (!form.sore_throat) e.sore_throat = 'Required'
      if (!form.runny_nose)  e.runny_nose  = 'Required'
      if (!form.symptom_duration_days || +form.symptom_duration_days < 1)
        e.symptom_duration_days = 'Enter duration (min 1 day)'
    }
    if (step === 3) {
      if (!form.recent_antibiotic_use) e.recent_antibiotic_use = 'Required'
      if (!form.antibiotic_allergy)    e.antibiotic_allergy    = 'Required'
    }
    if (step === 4) {
      if (form.spo2       && (+form.spo2 < 50 || +form.spo2 > 100))
        e.spo2       = 'SpO₂ must be 50–100%'
      if (form.pulse_rate && (+form.pulse_rate < 20 || +form.pulse_rate > 300))
        e.pulse_rate = 'Pulse must be 20–300 bpm'
      if (form.temperature && (+form.temperature < 30 || +form.temperature > 45))
        e.temperature = 'Temperature must be 30–45°C'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setAnalyzing(true)
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id:              form.patient_id,
          age:                     form.age              ? parseFloat(form.age)              : null,
          sex:                     form.sex,
          fever:                   form.fever,
          cough:                   form.cough,
          sore_throat:             form.sore_throat,
          runny_nose:              form.runny_nose,
          symptom_duration_days:   form.symptom_duration_days ? parseInt(form.symptom_duration_days) : null,
          recent_antibiotic_use:   form.recent_antibiotic_use,
          antibiotic_allergy:      form.antibiotic_allergy,
          suspected_infection_type: form.suspected_infection_type,
          WBC_count:               form.WBC_count     ? parseFloat(form.WBC_count)     : null,
          CRP_level:               form.CRP_level     ? parseFloat(form.CRP_level)     : null,
          spo2:                    form.spo2          ? parseFloat(form.spo2)          : null,
          pulse_rate:              form.pulse_rate    ? parseFloat(form.pulse_rate)    : null,
          temperature:             form.temperature   ? parseFloat(form.temperature)   : null,
        }),
      })
      if (!res.ok) throw new Error(`Backend ${res.status}`)
      const r = await res.json()
      setScore(r.score)
      setResult({ ...r, form })
    } catch {
      // Backend unavailable — fall back to local rule engine
      const r = computeRisk(form)
      setScore(r.score)
      setResult({ ...r, form })
    } finally {
      setAnalyzing(false)
      setShowForm(false)
      setStep(1)
    }
  }

  const openForm = () => {
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80)
  }

  const resetForm = () => {
    setForm(INIT)
    setErrors({})
    setStep(1)
    setResult(null)
    setScore(28)
    setShowForm(false)
    setFetchStatus(null)
  }

  const cards = getDynamicCards(result?.form ?? form, result)
  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <section className="meter section" id="usage-meter">
      <div className="bg-mesh" aria-hidden>
        <div className="orb" style={{ width: 400, height: 400, top: '-100px', right: '-100px', background: 'radial-gradient(circle, rgba(13,148,136,0.14) 0%, transparent 70%)' }} />
      </div>

      <div className="section-container">
        {/* Header */}
        <div className="meter__header animate-fadein">
          <h2 className="section-title">
            {t('meter.title')} <span className="gradient-text">{t('meter.titleHL')}</span>
          </h2>
          <div className="section-divider" />
          <p className="section-subtitle">
            {t('meter.subtitle')}
          </p>
        </div>

        {/* ── Analyze Now toggle ── */}
        <div className="meter__analyze-row animate-fadein anime-delay-2">
          {result ? (
            <div className="meter__result-banner">
              <div className="meter__result-banner-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>
                  Analysis complete for <strong>Patient {result.form?.patient_id || 'N/A'}</strong> —
                  Risk Level: <strong style={{ color: result.level === 'Low' ? '#15803d' : result.level === 'Medium' ? '#b45309' : '#b91c1c' }}>{result.level}</strong>
                </span>
              </div>
              <div className="meter__result-banner-actions">
                <button className="meter__analyze-btn meter__analyze-btn--outline" onClick={openForm}>
                  Analyze Another Patient
                </button>
                <button className="meter__analyze-btn meter__analyze-btn--ghost" onClick={resetForm}>
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <button
              className={`meter__analyze-btn${showForm ? ' meter__analyze-btn--active' : ''}`}
              onClick={() => showForm ? setShowForm(false) : openForm()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {showForm
                  ? <path d="M18 6L6 18M6 6l12 12"/>
                  : <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>
                }
              </svg>
              {showForm ? 'Close Form' : 'Enter Patient Data — Analyze Now'}
              {!showForm && <span className="meter__analyze-btn-arrow">→</span>}
            </button>
          )}
        </div>

        {/* ── Inline Patient Form Panel ── */}
        {showForm && (
          <div className="meter__form-panel animate-fadein" ref={formRef}>
            <div className="meter__form-header">
              <div>
                <div className="section-badge" style={{ marginBottom: 8 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  AI Risk Analysis — Patient Form
                </div>
                <h3 className="meter__form-title">
                  Enter <span className="gradient-text">Patient Data</span>
                </h3>
                <p className="meter__form-sub">
                  Fill in the patient's symptom data. The AI model will assess antibiotic misuse risk and update the meter below.
                </p>
              </div>
            </div>

            {/* Stepper */}
            <div className="pf-stepper" style={{ marginBottom: 16 }}>
              {STEPS.map((s, i) => (
                <div key={s.id} className={`pf-step${step === s.id ? ' pf-step--active' : ''}${step > s.id ? ' pf-step--done' : ''}`}>
                  <div className="pf-step__circle">
                    {step > s.id
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      : <span>{s.icon}</span>
                    }
                  </div>
                  <span className="pf-step__label">{t(s.labelKey)}</span>
                  {i < STEPS.length - 1 && (
                    <div className={`pf-step__line${step > s.id ? ' pf-step__line--done' : ''}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="pf-progress" style={{ marginBottom: 28 }}>
              <div className="pf-progress__bar" style={{ width: `${Math.max(5, progress)}%` }} />
            </div>

            {/* Form */}
            <form className="pf-card card" onSubmit={submit} noValidate>

              {/* Step 1 */}
              {step === 1 && (
                <div className="pf-step-content">
                  <div className="pf-step-title">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg>
                    Basic Patient Information</div>
                  <div className="pf-grid pf-grid--3">
                    <Field label="Patient ID" hint="Unique identifier">
                      <input
                        className={`pf-input${errors.patient_id ? ' pf-input--error' : ''}`}
                        placeholder="e.g. PAT-2026-001"
                        value={form.patient_id}
                        onChange={e => set('patient_id', e.target.value)}
                      />
                      {errors.patient_id && <span className="pf-error">{errors.patient_id}</span>}
                    </Field>
                    <Field label="Age" hint="Years">
                      <input
                        className={`pf-input${errors.age ? ' pf-input--error' : ''}`}
                        type="number" min="1" max="120"
                        placeholder="e.g. 34"
                        value={form.age}
                        onChange={e => set('age', e.target.value)}
                      />
                      {errors.age && <span className="pf-error">{errors.age}</span>}
                    </Field>
                    <Field label="Sex">
                      <div className="pf-radio-group">
                        {['Male','Female','Other'].map(opt => (
                          <button
                            key={opt} type="button"
                            className={`pf-radio${form.sex === opt ? ' pf-radio--active' : ''}`}
                            onClick={() => set('sex', opt)}
                          >
                            {opt === 'Male' ? (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="14" r="5"/><line x1="19" y1="5" x2="14.14" y2="9.86"/><polyline points="15 5 19 5 19 9"/></svg>
                            ) : opt === 'Female' ? (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="9" r="5"/><line x1="12" y1="14" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg>
                            )} {opt}
                          </button>
                        ))}
                      </div>
                      {errors.sex && <span className="pf-error">{errors.sex}</span>}
                    </Field>
                  </div>
                  <div className="pf-info-box">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                    </svg>
                    Patient identifiers are used only for this analysis session and are not stored permanently.
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="pf-step-content">
                  <div className="pf-step-title">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
                    Symptoms &amp; Duration</div>
                  <div className="pf-section-label">Reported Symptoms</div>
                  <div className="pf-yesno-grid">
                    <YesNo label="🌡️ Fever"        field="fever"       value={form.fever}       onChange={set} />
                    <YesNo label="😮‍💨 Cough"        field="cough"       value={form.cough}       onChange={set} />
                    <YesNo label="🦠 Sore Throat"  field="sore_throat" value={form.sore_throat} onChange={set} />
                    <YesNo label="🤧 Runny Nose"   field="runny_nose"  value={form.runny_nose}  onChange={set} />
                  </div>
                  {(errors.fever || errors.cough || errors.sore_throat || errors.runny_nose) && (
                    <span className="pf-error">Please select Yes or No for all symptoms</span>
                  )}
                  <div className="pf-section-label" style={{ marginTop: 24 }}>Symptom Timeline</div>
                  <div className="pf-grid pf-grid--2">
                    <Field label="Symptom Duration" hint="Number of days">
                      <div className="pf-number-wrap">
                        <button type="button" className="pf-num-btn" onClick={() => set('symptom_duration_days', Math.max(1, (parseInt(form.symptom_duration_days)||0) - 1).toString())}>−</button>
                        <input
                          className={`pf-input pf-input--center${errors.symptom_duration_days ? ' pf-input--error' : ''}`}
                          type="number" min="1" max="365"
                          placeholder="Days"
                          value={form.symptom_duration_days}
                          onChange={e => set('symptom_duration_days', e.target.value)}
                        />
                        <button type="button" className="pf-num-btn" onClick={() => set('symptom_duration_days', ((parseInt(form.symptom_duration_days)||0) + 1).toString())}>+</button>
                      </div>
                      {errors.symptom_duration_days && <span className="pf-error">{errors.symptom_duration_days}</span>}
                    </Field>
                    <div className="pf-duration-hint">
                      {form.symptom_duration_days ? (
                        <>
                          <div className={`pf-duration-badge${+form.symptom_duration_days <= 3 ? ' green' : +form.symptom_duration_days <= 7 ? ' amber' : ' red'}`}>
                            {+form.symptom_duration_days <= 3 ? '✓ Acute / Short' : +form.symptom_duration_days <= 7 ? '⚠ Moderate' : '⚠ Prolonged'}
                          </div>
                          <p>
                            {+form.symptom_duration_days <= 3
                              ? 'Usually viral. Antibiotics often not needed.'
                              : +form.symptom_duration_days <= 7
                              ? 'Monitor closely. Clinical review recommended.'
                              : 'Prolonged — bacterial cause more likely. Doctor review advised.'}
                          </p>
                        </>
                      ) : <span style={{ color: '#cbd5e1' }}>Enter days above to see guidance</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="pf-step-content">
                  <div className="pf-step-title">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2v7.527a2 2 0 0 1-.211.896L3.5 21h17l-6.289-10.577A2 2 0 0 1 14 9.527V2"/><line x1="8.5" y1="2" x2="15.5" y2="2"/></svg>
                    Medical History &amp; Clinical Inputs</div>
                  <div className="pf-section-label">Medical History</div>
                  <div className="pf-yesno-grid">
                    <YesNo label="💊 Recent Antibiotic Use" field="recent_antibiotic_use" value={form.recent_antibiotic_use} onChange={set} />
                    <YesNo label="⚠️ Antibiotic Allergy"   field="antibiotic_allergy"    value={form.antibiotic_allergy}    onChange={set} />
                  </div>
                  {(errors.recent_antibiotic_use || errors.antibiotic_allergy) && (
                    <span className="pf-error">Please answer all medical history fields</span>
                  )}
                  <div className="pf-section-label" style={{ marginTop: 28 }}>Suspected Infection Type</div>
                  <div className="pf-infection-grid">
                    {[
                      { val: 'viral',     label: 'Viral',     icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/></svg>, color: '#0891b2', desc: 'Cold, flu, COVID-like' },
                      { val: 'bacterial', label: 'Bacterial', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2v7.527a2 2 0 0 1-.211.896L3.5 21h17l-6.289-10.577A2 2 0 0 1 14 9.527V2"/><line x1="8.5" y1="2" x2="15.5" y2="2"/></svg>, color: '#dc2626', desc: 'Strep, UTI, pneumonia' },
                      { val: 'unknown',   label: 'Unknown',   icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg>, color: '#7c3aed', desc: 'Not yet determined' },
                    ].map(opt => (
                      <button
                        key={opt.val} type="button"
                        className={`pf-infection-card${form.suspected_infection_type === opt.val ? ' pf-infection-card--active' : ''}`}
                        onClick={() => set('suspected_infection_type', opt.val)}
                        style={{ '--card-color': opt.color }}
                      >
                        <span className="pf-infection-icon">{opt.icon}</span>
                        <span className="pf-infection-label">{opt.label}</span>
                        <span className="pf-infection-desc">{opt.desc}</span>
                        {form.suspected_infection_type === opt.val && (
                          <span className="pf-infection-check">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="pf-section-label" style={{ marginTop: 28 }}>
                    Optional Clinical Lab Values
                    <span className="pf-optional-badge">Optional</span>
                  </div>
                  <div className="pf-grid pf-grid--2">
                    <Field label="WBC Count" hint="×10³/μL — normal 4–11">
                      <div className="pf-input-with-unit">
                        <input
                          className="pf-input"
                          type="number" step="0.1" min="0" max="100"
                          placeholder="e.g. 8.5"
                          value={form.WBC_count}
                          onChange={e => set('WBC_count', e.target.value)}
                        />
                        <span className="pf-unit">×10³/μL</span>
                      </div>
                      {form.WBC_count && (
                        <div className={`pf-lab-hint${+form.WBC_count > 11 ? ' red' : +form.WBC_count < 4 ? ' amber' : ' green'}`}>
                          {+form.WBC_count > 11 ? '⬆ Elevated — possible bacterial' : +form.WBC_count < 4 ? '⬇ Low count' : '✓ Normal range'}
                        </div>
                      )}
                    </Field>
                    <Field label="CRP Level" hint="mg/L — normal < 5">
                      <div className="pf-input-with-unit">
                        <input
                          className="pf-input"
                          type="number" step="0.1" min="0" max="500"
                          placeholder="e.g. 3.2"
                          value={form.CRP_level}
                          onChange={e => set('CRP_level', e.target.value)}
                        />
                        <span className="pf-unit">mg/L</span>
                      </div>
                      {form.CRP_level && (
                        <div className={`pf-lab-hint${+form.CRP_level > 10 ? ' red' : +form.CRP_level > 5 ? ' amber' : ' green'}`}>
                          {+form.CRP_level > 10 ? '⬆ High — strong bacterial marker' : +form.CRP_level > 5 ? '⚠ Mildly elevated' : '✓ Normal range'}
                        </div>
                      )}
                    </Field>
                  </div>
                  <div className="pf-info-box pf-info-box--amber">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01"/>
                    </svg>
                    Lab values improve AI accuracy but are not mandatory. Leave blank if unavailable.
                  </div>
                </div>
              )}

              {/* Step 4 — Live Vitals from ThingSpeak */}
              {step === 4 && (
                <div className="pf-step-content">
                  <div className="pf-step-title">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    Live Vitals — ThingSpeak IoT</div>

                  {/* ThingSpeak connection panel */}
                  <div className="vitals__ts-panel">
                    <div className="vitals__ts-header">
                      <div className="vitals__ts-brand">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                        <span>ThingSpeak IoT</span>
                      </div>
                      <div className="tag tag-teal">
                        <span className="status-dot green" style={{ marginRight: 5 }} />
                        API Ready
                      </div>
                    </div>

                    <div className="vitals__ts-connect">
                      <div className="pf-field" style={{ flex: 1 }}>
                        <label className="pf-field__label">
                          Channel ID
                          <span className="pf-field__hint">Your ThingSpeak channel number</span>
                        </label>
                        <input
                          className="pf-input"
                          placeholder="e.g. 2345678"
                          value={form.ts_channel_id}
                          onChange={e => set('ts_channel_id', e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className={`vitals__fetch-btn${fetching ? ' vitals__fetch-btn--loading' : ''}`}
                        onClick={fetchVitals}
                        disabled={fetching}
                      >
                        {fetching ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="vitals__spin">
                            <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="23 4 23 10 17 10"/>
                            <path d="M20.49 15a9 9 0 1 1-.49-4.49"/>
                          </svg>
                        )}
                        {fetching ? 'Fetching…' : 'Fetch Live Data'}
                      </button>
                    </div>

                    {/* Field mapping */}
                    <div className="vitals__field-map">
                      <span className="vitals__field-map-label">ThingSpeak field mapping:</span>
                      {[
                        { label: <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg> Temp</>,  key: 'ts_field_temp' },
                        { label: <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2c0 5-2 9-5 11m5-11c0 5 2 9 5 11"/></svg> SpO₂</>,  key: 'ts_field_spo2' },
                        { label: <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Pulse</>, key: 'ts_field_pulse' },
                      ].map(({ label, key }) => (
                        <div key={key} className="vitals__field-map-item">
                          <span>{label}</span>
                          <span>→</span>
                          <select
                            className="vitals__field-select"
                            value={form[key]}
                            onChange={e => set(key, e.target.value)}
                          >
                            {[1,2,3,4,5,6,7,8].map(n => (
                              <option key={n} value={String(n)}>Field {n}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    {/* Fetch status */}
                    {fetchStatus === 'success' && (
                      <div className="vitals__status vitals__status--ok">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Data fetched from ThingSpeak — fields auto-populated below.
                      </div>
                    )}
                    {fetchStatus === 'error' && (
                      <div className="vitals__status vitals__status--err">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01"/></svg>
                        Fetch failed. Check Channel ID or network connection.
                      </div>
                    )}
                    {fetchStatus === 'no-channel' && (
                      <div className="vitals__status vitals__status--warn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                        Enter a Channel ID before fetching.
                      </div>
                    )}
                  </div>

                  {/* Vitals input cards */}
                  <div className="vitals__grid">

                    {/* Temperature */}
                    <div className="vitals__card">
                      <div className="vitals__card-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
                      </div>
                      <div className="vitals__card-label">Temperature</div>
                      <div className="vitals__card-normal">Normal: 36.1–37.2°C</div>
                      <div className="pf-input-with-unit">
                        <input
                          className={`pf-input${errors.temperature ? ' pf-input--error' : ''}`}
                          type="number" step="0.1" min="30" max="45"
                          placeholder="e.g. 37.2"
                          value={form.temperature}
                          onChange={e => set('temperature', e.target.value)}
                        />
                        <span className="pf-unit">°C</span>
                      </div>
                      {errors.temperature && <span className="pf-error">{errors.temperature}</span>}
                      {form.temperature && !errors.temperature && (() => {
                        const t = +form.temperature
                        const cls = t >= 39 ? 'red' : t >= 38 ? 'amber' : t < 36 ? 'amber' : 'green'
                        const txt = t >= 39 ? '⬆ High fever' : t >= 38 ? '⚠ Fever' : t < 36 ? '⬇ Low temp' : '✓ Normal'
                        return <div className={`pf-lab-hint ${cls}`}>{txt}</div>
                      })()}
                    </div>

                    {/* SpO2 */}
                    <div className="vitals__card">
                      <div className="vitals__card-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 0c0 5-2 9-5 11m5-11c0 5 2 9 5 11"/></svg>
                      </div>
                      <div className="vitals__card-label">SpO₂</div>
                      <div className="vitals__card-normal">Normal: 95–100%</div>
                      <div className="pf-input-with-unit">
                        <input
                          className={`pf-input${errors.spo2 ? ' pf-input--error' : ''}`}
                          type="number" step="0.1" min="50" max="100"
                          placeholder="e.g. 98.5"
                          value={form.spo2}
                          onChange={e => set('spo2', e.target.value)}
                        />
                        <span className="pf-unit">%</span>
                      </div>
                      {errors.spo2 && <span className="pf-error">{errors.spo2}</span>}
                      {form.spo2 && !errors.spo2 && (() => {
                        const v = +form.spo2
                        const cls = v < 90 ? 'red' : v < 94 ? 'amber' : v < 97 ? 'amber' : 'green'
                        const txt = v < 90 ? '⬇ Critical — seek help' : v < 94 ? '⬇ Low SpO₂' : v < 97 ? '⚠ Borderline' : '✓ Normal'
                        return <div className={`pf-lab-hint ${cls}`}>{txt}</div>
                      })()}
                    </div>

                    {/* Pulse Rate */}
                    <div className="vitals__card">
                      <div className="vitals__card-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      </div>
                      <div className="vitals__card-label">Pulse Rate</div>
                      <div className="vitals__card-normal">Normal: 60–100 bpm</div>
                      <div className="pf-input-with-unit">
                        <input
                          className={`pf-input${errors.pulse_rate ? ' pf-input--error' : ''}`}
                          type="number" step="1" min="20" max="300"
                          placeholder="e.g. 72"
                          value={form.pulse_rate}
                          onChange={e => set('pulse_rate', e.target.value)}
                        />
                        <span className="pf-unit">bpm</span>
                      </div>
                      {errors.pulse_rate && <span className="pf-error">{errors.pulse_rate}</span>}
                      {form.pulse_rate && !errors.pulse_rate && (() => {
                        const v = +form.pulse_rate
                        const cls = v > 120 ? 'red' : v > 100 ? 'amber' : v < 60 ? 'amber' : 'green'
                        const txt = v > 120 ? '⬆ Tachycardia' : v > 100 ? '⚠ Elevated' : v < 60 ? '⬇ Bradycardia' : '✓ Normal'
                        return <div className={`pf-lab-hint ${cls}`}>{txt}</div>
                      })()}
                    </div>
                  </div>

                  <div className="pf-info-box">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                    </svg>
                    Vitals are optional but improve AI accuracy significantly. Fetch live from ThingSpeak or enter manually.
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="pf-nav">
                {step > 1 && (
                  <button type="button" className="pf-btn-back" onClick={back}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                    {t('meter.back')}
                  </button>
                )}
                <div style={{ flex: 1 }} />
                {step < 4 && (
                  <button type="button" className="hero__btn-primary pf-btn-next" onClick={next}>
                    {t('meter.continue')}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                )}
                {step === 4 && (
                  <button type="submit" className="hero__btn-primary pf-btn-submit" disabled={analyzing}>
                    {analyzing ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="vitals__spin">
                          <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
                        </svg>
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                        </svg>
                        {t('meter.analyzeRisk')}
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Step dots */}
            <div className="pf-dots">
              {STEPS.map(s => (
                <span key={s.id} className={`pf-dot${step === s.id ? ' pf-dot--active' : ''}${step > s.id ? ' pf-dot--done' : ''}`} />
              ))}
            </div>
          </div>
        )}

        {/* Main content — Analysis data */}
        <div className="meter__body">
          {/* Gauge */}
          <div className="meter__gauge-panel animate-fadein anime-delay-2">
            <div className="meter__gauge-header">
              <h3>Usage Risk Meter</h3>
              <div className="tag tag-green">
                <span className="status-dot green" style={{ marginRight: 5 }} />
                {result ? 'Updated' : 'Live'}
              </div>
            </div>
            <GaugeChart score={score} />

            {/* Progress bars */}
            <div className="meter__bars">
              {LEVELS.map((l, i) => {
                const fill = i === 0 ? 80 : i === 1 ? 35 : 10
                return (
                  <div className="meter__bar-row" key={l.id}>
                    <div className="meter__bar-label">
                      <span className="gauge__label-dot" style={{ background: l.color }} />
                      <span>{l.label}</span>
                    </div>
                    <div className="meter__bar-track">
                      <div className="meter__bar-fill" style={{ width: `${fill}%`, background: l.color }} />
                    </div>
                    <span className="meter__bar-pct">{fill}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Info cards */}
          <div className="meter__cards">
            {cards.map((card, i) => (
              <div key={card.id} className={`meter__card card animate-fadein anime-delay-${i + 2}`}>
                <div className="meter__card-header">
                  <div className="meter__card-icon">{card.icon}</div>
                  <div>
                    <h4 className="meter__card-title">{card.title}</h4>
                    <div className={`tag tag-${card.badge.color}`}>{card.badge.label}</div>
                  </div>
                </div>
                <div className="meter__card-metrics">
                  {card.metrics.map(m => (
                    <div key={m.label} className="meter__metric">
                      <span className="meter__metric-label">{m.label}</span>
                      <span className={`meter__metric-value meter__metric-value--${m.status}`}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI-Suggested Alternatives & Home Remedies ── */}
        {(() => {
          const alts = getAlternatives(result)
          if (!alts) return null
          return (
            <div className={`meter__alt-panel animate-fadein${alts.warning ? ' meter__alt-panel--warning' : ''}`}>
              <div className="meter__alt-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0c0 5-2 9-5 11m5-11c0 5 2 9 5 11"/>
                </svg>
                AI-Suggested Alternatives &amp; Home Remedies
              </div>
              <p className="meter__alt-sub">
                {alts.warning
                  ? 'High-risk pattern detected. Seek medical review immediately. Only supportive measures while waiting:'
                  : 'Non-antibiotic care options matched to the detected symptoms. Consult a doctor if symptoms persist beyond 72\u202fh.'}
              </p>
              <ul className="meter__alt-list">
                {alts.items.map((item, i) => (
                  <li key={i} className="meter__alt-item">{item}</li>
                ))}
              </ul>
            </div>
          )
        })()}

      </div>
    </section>
  )
}
