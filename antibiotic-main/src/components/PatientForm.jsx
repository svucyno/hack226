import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../utils/LanguageContext'
import './PatientForm.css'

/* ── Mock risk engine (replace with real API call later) ── */
function computeRisk(f) {
  let score = 30  // baseline

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

  score = Math.max(5, Math.min(98, score))

  const level      = score < 38 ? 'Low' : score < 68 ? 'Medium' : 'High'
  const confidence = Math.round(72 + Math.random() * 22)

  const pattern =
    f.suspected_infection_type === 'viral' || (dur <= 3 && f.runny_nose === 'yes')
      ? 'viral-like'
      : score >= 68 ? 'urgent review'
      : 'bacterial suspicion'

  const reasons = []
  if (dur <= 3)                               reasons.push('form.shortDuration')
  if (dur >= 7)                               reasons.push('form.prolongedDuration')
  if (f.fever === 'yes')                      reasons.push('form.feverPresent')
  if (f.fever === 'no')                       reasons.push('form.noFever')
  if (f.recent_antibiotic_use === 'yes')      reasons.push('form.recentAbuse')
  if (f.suspected_infection_type === 'viral') reasons.push('form.viralSuspected')
  if (!isNaN(crp) && crp <= 5)               reasons.push('form.normalCrp')
  if (!isNaN(crp) && crp > 10)               reasons.push('form.elevatedCrp')
  if (!isNaN(wbc) && wbc <= 11)              reasons.push('form.normalWbc')
  if (!isNaN(wbc) && wbc > 11)              reasons.push('form.elevatedWbc')
  if (symptomCount <= 2)                      reasons.push('form.limitedSymptoms')

  const action =
    level === 'Low'    ? 'observe'
    : level === 'Medium' ? 'doctor review'
    : 'further testing'

  return { score, level, confidence, pattern, reasons: reasons.slice(0, 5), action }
}

/* ── Field helpers ── */
function YesNo({ label, field, value, onChange, t }) {
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
            {opt === 'yes' ? `✓ ${t('form.yes')}` : `✗ ${t('form.no')}`}
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

const INIT = {
  patient_id: '', age: '', sex: '',
  fever: '', cough: '', sore_throat: '', runny_nose: '',
  symptom_duration_days: '',
  recent_antibiotic_use: '', antibiotic_allergy: '',
  suspected_infection_type: '',
  WBC_count: '', CRP_level: '',
}

export default function PatientForm() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [step, setStep]   = useState(1)
  const [form, setForm]   = useState(INIT)
  const [errors, setErrors] = useState({})

  const STEPS = [
    { id: 1, labelKey: 'form.patientInfo',    icon: '👤' },
    { id: 2, labelKey: 'form.symptoms',       icon: '🌡️' },
    { id: 3, labelKey: 'form.clinicalDetails', icon: '🔬' },
  ]

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    setErrors(e => { const n = { ...e }; delete n[field]; return n })
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
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const submit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const result = computeRisk(form)
    navigate('/result', { state: { form, result } })
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="pf-page">
      {/* Background mesh */}
      <div className="pf-bg">
        <div className="pf-bg__orb pf-bg__orb--1"/>
        <div className="pf-bg__orb pf-bg__orb--2"/>
        <div className="pf-bg__grid"/>
      </div>

      <div className="pf-container">
        {/* Header */}
        <div className="pf-header animate-fadein">
          <div className="section-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            {t('meter.badge')} — {t('form.patientInfo')}
          </div>
          <h1 className="pf-header__title">
            Enter <span className="gradient-text">Patient Data</span>
          </h1>
          <p className="pf-header__sub">
            Fill in the patient's symptom data below. The AI model will assess
            antibiotic misuse risk based on clinical inputs.
          </p>
        </div>

        {/* Step wizard */}
        <div className="pf-stepper animate-fadein anime-delay-1">
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
        <div className="pf-progress">
          <div className="pf-progress__bar" style={{ width: `${Math.max(5, progress)}%` }} />
        </div>

        {/* Form card */}
        <form className="pf-card card animate-fadein anime-delay-2" onSubmit={submit} noValidate>

          {/* ── STEP 1: Basic Patient Info ─── */}
          {step === 1 && (
            <div className="pf-step-content">
              <div className="pf-step-title">
                <span>👤</span> {t('form.patientInfo')}
              </div>

              <div className="pf-grid pf-grid--3">
                <Field label={t('form.age')} hint="">
                  <input
                    className={`pf-input${errors.age ? ' pf-input--error' : ''}`}
                    type="number" min="1" max="120"
                    placeholder="e.g. 34"
                    value={form.age}
                    onChange={e => set('age', e.target.value)}
                  />
                  {errors.age && <span className="pf-error">{errors.age}</span>}
                </Field>

                <Field label={t('form.sex')} hint="">
                  <div className="pf-radio-group">
                    {['Male','Female','Other'].map(opt => (
                      <button
                        key={opt} type="button"
                        className={`pf-radio${form.sex === opt ? ' pf-radio--active' : ''}`}
                        onClick={() => set('sex', opt)}
                      >
                        {opt === 'Male' ? '♂' : opt === 'Female' ? '♀' : '⊕'} {opt}
                      </button>
                    ))}
                  </div>
                  {errors.sex && <span className="pf-error">{errors.sex}</span>}
                </Field>
              </div>
            </div>
          )}

          {/* ── STEP 2: Symptoms ─── */}
          {step === 2 && (
            <div className="pf-step-content">
              <div className="pf-step-title"><span>🌡️</span> {t('form.symptoms')}</div>

              <div className="pf-section-label">{t('form.symptoms')}</div>
              <div className="pf-yesno-grid">
                <YesNo label={`🌡️ ${t('form.fever')}`}          field="fever"       value={form.fever}       onChange={set} t={t} />
                <YesNo label={`😮‍💨 ${t('form.cough')}`}          field="cough"       value={form.cough}       onChange={set} t={t} />
                <YesNo label={`🦠 ${t('form.soreThroat')}`}    field="sore_throat" value={form.sore_throat} onChange={set} t={t} />
                <YesNo label={`🤧 ${t('form.runnyNose')}`}     field="runny_nose"  value={form.runny_nose}  onChange={set} t={t} />
              </div>
              {(errors.fever || errors.cough || errors.sore_throat || errors.runny_nose) && (
                <span className="pf-error">Please select {t('form.yes')} or {t('form.no')} for all symptoms</span>
              )}

              <div className="pf-section-label" style={{ marginTop: 24 }}>{t('form.symptomDuration')}</div>
              <div className="pf-grid pf-grid--2">
                <Field label={t('form.symptomDuration')} hint="">
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
              </div>
            </div>
          )}

          {/* ── STEP 3: Medical History + Clinical ─── */}
          {step === 3 && (
            <div className="pf-step-content">
              <div className="pf-step-title"><span>🔬</span> {t('form.clinicalDetails')}</div>

              <div className="pf-section-label">{t('form.recentAntibiotics')}</div>
              <div className="pf-yesno-grid">
                <YesNo label={`💊 ${t('form.recentAntibiotics')}`} field="recent_antibiotic_use" value={form.recent_antibiotic_use} onChange={set} t={t} />
                <YesNo label={`⚠️ ${t('form.antibioticAllergy')}`}   field="antibiotic_allergy"    value={form.antibiotic_allergy}    onChange={set} t={t} />
              </div>
              {(errors.recent_antibiotic_use || errors.antibiotic_allergy) && (
                <span className="pf-error">Please answer all medical history fields</span>
              )}

              <div className="pf-section-label" style={{ marginTop: 28 }}>{t('form.suspectedInfection')}</div>
              <div className="pf-infection-grid">
                {[
                  { val: 'viral',      label: 'Viral',      icon: '🦠', color: '#0891b2' },
                  { val: 'bacterial',  label: 'Bacterial',  icon: '🧫', color: '#dc2626' },
                  { val: 'unknown',    label: 'Unknown',    icon: '❓', color: '#7c3aed' },
                ].map(opt => (
                  <button
                    key={opt.val} type="button"
                    className={`pf-infection-card${form.suspected_infection_type === opt.val ? ' pf-infection-card--active' : ''}`}
                    onClick={() => set('suspected_infection_type', opt.val)}
                    style={{ '--card-color': opt.color }}
                  >
                    <span className="pf-infection-icon">{opt.icon}</span>
                    <span className="pf-infection-label">{opt.label}</span>
                    {form.suspected_infection_type === opt.val && (
                      <span className="pf-infection-check">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Navigation buttons ── */}
          <div className="pf-nav">
            {step > 1 && (
              <button type="button" className="pf-btn-back" onClick={back}>
                ← {t('meter.back')}
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < 3 && (
              <button type="button" className="hero__btn-primary pf-btn-next" onClick={next}>
                {t('meter.continue')} →
              </button>
            )}
            {step === 3 && (
              <button type="submit" className="hero__btn-primary pf-btn-submit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                {t('meter.analyzeRisk')}
              </button>
            )}
          </div>
        </form>

        {/* Step indicator dots */}
        <div className="pf-dots">
          {STEPS.map(s => (
            <span key={s.id} className={`pf-dot${step === s.id ? ' pf-dot--active' : ''}${step > s.id ? ' pf-dot--done' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
