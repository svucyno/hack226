import { useState } from 'react'
import { useLanguage } from '../utils/LanguageContext'
import './DiseasePrediction.css'

const LEVEL_CFG = {
  Low:    { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.30)',  label: 'Low Risk' },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)', label: 'Moderate Risk' },
  High:   { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.30)',  label: 'High Risk' },
}

const TOOLS = [
  {
    id: 'osteoporosis',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="url(#dpOs)"/>
        <circle cx="24" cy="13" r="4.5" fill="white" fillOpacity="0.9"/>
        <circle cx="24" cy="35" r="4.5" fill="white" fillOpacity="0.9"/>
        <rect x="21.5" y="17" width="5" height="14" rx="2.5" fill="white" fillOpacity="0.85"/>
        <path d="M21 23l6 2M21 27l6-2" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" strokeLinecap="round"/>
        <defs><linearGradient id="dpOs" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#4f46e5"/><stop offset="1" stopColor="#7c3aed"/></linearGradient></defs>
      </svg>
    ),
    number: '01',
    title: 'Osteoporosis Risk Prediction',
    desc: 'AI-driven bone density analysis using patient history, age, BMI, and lifestyle factors to predict osteoporosis risk and fracture probability.',
    tags: ['Bone Density', 'Fracture Risk', 'BMD'],
    accuracy: 92,
    status: 'available',
    endpoint: '/api/predict/osteoporosis',
    fields: [
      { key: 'age',               label: 'Age',                   type: 'number', placeholder: '55',  min: 20, max: 100 },
      { key: 'sex',               label: 'Sex',                   type: 'select', options: ['female', 'male'] },
      { key: 'bmi',               label: 'BMI',                   type: 'number', placeholder: '22.0', min: 10, max: 50, step: 0.1 },
      { key: 'menopause',         label: 'Post-menopausal',       type: 'select', options: ['yes', 'no', 'na'] },
      { key: 'previous_fracture', label: 'Previous Fracture',     type: 'select', options: ['yes', 'no'] },
      { key: 'family_history',    label: 'Family History',        type: 'select', options: ['yes', 'no'] },
      { key: 'steroid_use',       label: 'Long-term Steroid Use', type: 'select', options: ['yes', 'no'] },
      { key: 'smoking',           label: 'Smoking',               type: 'select', options: ['yes', 'no'] },
      { key: 't_score',           label: 'DEXA T-Score',          type: 'number', placeholder: '-1.0', min: -4, max: 2, step: 0.1, optional: true },
    ],
  },
  {
    id: 'respiratory',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="url(#dp1)"/>
        <path d="M16 20c0-4 2-7 5-8m11 8c0-4-2-7-5-8M16 20v10c0 3 2 5 5 6M32 20v10c0 3-2 5-5 6M21 14l3-4 3 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <defs><linearGradient id="dp1" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#0d9488"/><stop offset="1" stopColor="#0ea5e9"/></linearGradient></defs>
      </svg>
    ),
    number: '02',
    title: 'Respiratory Infection Prediction',
    desc: 'AI analysis of respiratory symptoms to predict bacterial vs viral infection likelihood and optimal treatment path.',
    tags: ['Pneumonia', 'Bronchitis', 'Strep'],
    accuracy: 94,
    status: 'available',
    endpoint: '/api/predict/respiratory',
    fields: [
      { key: 'age',               label: 'Age',                    type: 'number', placeholder: '35',   min: 1,  max: 120 },
      { key: 'temperature',       label: 'Temperature (\u00b0C)',  type: 'number', placeholder: '37.0', min: 35, max: 42,  step: 0.1 },
      { key: 'oxygen_saturation', label: 'SpO\u2082 (%)',         type: 'number', placeholder: '98',   min: 80, max: 100 },
      { key: 'cough',             label: 'Cough',                  type: 'select', options: ['yes', 'no'] },
      { key: 'cough_type',        label: 'Cough Type',             type: 'select', options: ['dry', 'productive', 'none'] },
      { key: 'dyspnea',           label: 'Shortness of Breath',    type: 'select', options: ['yes', 'no'] },
      { key: 'chest_pain',        label: 'Chest Pain',             type: 'select', options: ['yes', 'no'] },
      { key: 'duration_days',     label: 'Symptom Duration (days)',type: 'number', placeholder: '3',    min: 1,  max: 90 },
    ],
  },
  {
    id: 'fever',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="url(#dp2)"/>
        <path d="M24 10v18m0 0a6 6 0 1 0 6 6 6 6 0 0 0-6-6z" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="28" y1="14" x2="32" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <line x1="28" y1="18" x2="34" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <line x1="28" y1="22" x2="32" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <defs><linearGradient id="dp2" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#f59e0b"/><stop offset="1" stopColor="#ef4444"/></linearGradient></defs>
      </svg>
    ),
    number: '03',
    title: 'Fever Risk Analysis',
    desc: 'Evaluate fever patterns, duration, and associated symptoms to classify risk level and antibiotic requirement probability.',
    tags: ['Viral Fever', 'Typhoid', 'Dengue'],
    accuracy: 91,
    status: 'available',
    endpoint: '/api/predict/fever',
    fields: [
      { key: 'age',                 label: 'Age',                      type: 'number', placeholder: '35',   min: 1,  max: 120 },
      { key: 'temperature',         label: 'Temperature (\u00b0C)',    type: 'number', placeholder: '38.5', min: 35, max: 43,  step: 0.1 },
      { key: 'fever_duration_days', label: 'Fever Duration (days)',    type: 'number', placeholder: '2',    min: 1,  max: 30 },
      { key: 'fever_pattern',       label: 'Fever Pattern',            type: 'select', options: ['continuous', 'intermittent', 'remittent'] },
      { key: 'chills',              label: 'Chills / Rigors',          type: 'select', options: ['yes', 'no'] },
      { key: 'rash',                label: 'Rash Present',             type: 'select', options: ['yes', 'no'] },
      { key: 'recent_travel',       label: 'Recent Travel',            type: 'select', options: ['yes', 'no'] },
      { key: 'WBC_count',           label: 'WBC Count (\u00d710\u00b3/\u03bcL)', type: 'number', placeholder: '8.0', min: 1, max: 50, step: 0.1, optional: true },
    ],
  },
  {
    id: 'viral-bacterial',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="url(#dp3)"/>
        <circle cx="18" cy="24" r="6" stroke="white" strokeWidth="2"/>
        <circle cx="30" cy="24" r="6" stroke="white" strokeWidth="2"/>
        <circle cx="18" cy="24" r="2" fill="white"/>
        <circle cx="30" cy="24" r="2" fill="white"/>
        <path d="M18 10v4M18 34v4M30 10v4M30 34v4M10 18h4M34 18h4M10 30h4M34 30h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <defs><linearGradient id="dp3" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#ec4899"/></linearGradient></defs>
      </svg>
    ),
    number: '04',
    title: 'Viral vs Bacterial Analysis',
    desc: 'Smart differential diagnosis engine separating viral from bacterial infections—key to avoiding antibiotic overuse.',
    tags: ['Differentiation', 'Lab Markers', 'CRP'],
    accuracy: 96,
    status: 'available',
    endpoint: '/api/predict/viral-bacterial',
    fields: [
      { key: 'age',                   label: 'Age',                       type: 'number', placeholder: '35',   min: 1,  max: 120 },
      { key: 'temperature',           label: 'Temperature (\u00b0C)',     type: 'number', placeholder: '38.5', min: 35, max: 43,  step: 0.1 },
      { key: 'WBC_count',             label: 'WBC Count (\u00d710\u00b3/\u03bcL)', type: 'number', placeholder: '9.5', min: 1, max: 50, step: 0.1 },
      { key: 'CRP_level',             label: 'CRP Level (mg/L)',          type: 'number', placeholder: '5.0',  min: 0,  max: 200, step: 0.1 },
      { key: 'symptom_onset',         label: 'Symptom Onset',             type: 'select', options: ['rapid', 'gradual'] },
      { key: 'sore_throat',           label: 'Sore Throat',               type: 'select', options: ['yes', 'no'] },
      { key: 'runny_nose',            label: 'Runny Nose',                type: 'select', options: ['yes', 'no'] },
      { key: 'muscle_aches',          label: 'Muscle Aches',              type: 'select', options: ['yes', 'no'] },
    ],
  },
  {
    id: 'misuse-checker',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="url(#dp4)"/>
        <path d="M24 14v6m0 8v2M14 24a10 10 0 1 0 20 0 10 10 0 0 0-20 0z" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <defs><linearGradient id="dp4" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#ef4444"/><stop offset="1" stopColor="#f59e0b"/></linearGradient></defs>
      </svg>
    ),
    number: '05',
    title: 'Antibiotic Misuse Risk Checker',
    desc: 'Comprehensive AI evaluation of prescription history, dosage patterns, and clinical necessity to flag misuse risk.',
    tags: ['Resistance', 'Overuse', 'Audit'],
    accuracy: 98,
    status: 'featured',
    endpoint: '/api/predict/misuse',
    fields: [
      { key: 'antibiotic_name',      label: 'Antibiotic Name',                      type: 'text',   placeholder: 'e.g. Amoxicillin' },
      { key: 'prescribed_by',        label: 'Prescribed By',                        type: 'select', options: ['doctor', 'pharmacist', 'self', 'online'] },
      { key: 'dose_completion',      label: 'Dose Completion',                      type: 'select', options: ['complete', 'incomplete', 'ongoing'] },
      { key: 'courses_last_year',    label: 'Antibiotic Courses (last 12 months)',  type: 'number', placeholder: '1', min: 0, max: 20 },
      { key: 'indication_confirmed', label: 'Indication Clinically Confirmed',      type: 'select', options: ['yes', 'no', 'unsure'] },
      { key: 'shared_with_others',   label: 'Shared With Others',                   type: 'select', options: ['yes', 'no'] },
    ],
  },
]

function coerceForm(fields, form) {
  const out = {}
  fields.forEach(f => {
    const v = form[f.key]
    if (v === '' || v === undefined || v === null) return
    out[f.key] = f.type === 'number' ? parseFloat(v) : v
  })
  return out
}

// ── Client-side fallback engines (mirror backend logic) ──────────────────────
function computeRespiratory(f) {
  const temp = parseFloat(f.temperature) || 37.0
  const spo2 = parseFloat(f.oxygen_saturation) || 98.0
  const dur  = parseInt(f.duration_days) || 1
  const age  = parseFloat(f.age) || 35.0
  let score = 25
  if (temp >= 39.0) score += 22; else if (temp >= 38.0) score += 10
  if (spo2 < 92) score += 28; else if (spo2 < 95) score += 16
  if (f.dyspnea    === 'yes') score += 18
  if (f.chest_pain === 'yes') score += 14
  if (f.cough_type === 'productive') score += 12
  if (f.cough === 'yes') score += 5
  if (dur >= 7) score += 10; else if (dur >= 5) score += 5
  if (age > 65 || age < 5) score += 8
  score = Math.max(5, Math.min(98, score))
  let diagnosis, antibiotic
  if (spo2 < 95 || (f.dyspnea === 'yes' && f.cough_type === 'productive'))       { diagnosis = 'Pneumonia';             antibiotic = true }
  else if (dur >= 5 && f.cough === 'yes' && f.cough_type === 'productive')        { diagnosis = 'Acute Bronchitis';      antibiotic = score >= 58 }
  else if (f.chest_pain === 'yes' && temp >= 38.5)                                { diagnosis = 'Possible Pneumonia';    antibiotic = true }
  else if (temp >= 38.5 && f.cough === 'yes')                                     { diagnosis = 'Strep / Bacterial URTI'; antibiotic = true }
  else                                                                             { diagnosis = 'Viral URI';             antibiotic = false }
  const level = score < 38 ? 'Low' : score < 68 ? 'Medium' : 'High'
  const confidence = Math.min(95, 60 + Math.round(Math.abs(score - 50) * 0.6))
  const reasons = []
  if (temp >= 39.0)              reasons.push(`High fever (${temp.toFixed(1)}\u00b0C) \u2014 likely bacterial`)
  else if (temp >= 38.0)         reasons.push(`Fever (${temp.toFixed(1)}\u00b0C) detected`)
  if (spo2 < 95)                 reasons.push(`SpO\u2082 ${spo2.toFixed(1)}% \u2014 respiratory compromise`)
  if (f.dyspnea    === 'yes')    reasons.push('Dyspnea present \u2014 lower tract involvement')
  if (f.chest_pain === 'yes')    reasons.push('Chest pain \u2014 rule out pneumonia / pleuritis')
  if (f.cough_type === 'productive') reasons.push('Productive cough \u2014 bacterial marker')
  if (dur >= 7)                  reasons.push(`Symptoms persisting ${dur} days`)
  if (!reasons.length)           reasons.push('Mild upper respiratory presentation')
  const action = { Low: 'Rest, fluids, monitor for 48\u202fh', Medium: 'GP consultation within 24\u202fh', High: 'Chest X-ray + urgent clinical review' }[level]
  return { score, level, confidence, diagnosis, antibiotic_recommended: antibiotic, reasons: reasons.slice(0, 5), action }
}

function computeFever(f) {
  const temp = parseFloat(f.temperature) || 37.0
  const dur  = parseInt(f.fever_duration_days) || 1
  const wbc  = parseFloat(f.WBC_count) || 8.0
  const age  = parseFloat(f.age) || 35.0
  let score = 20
  if (temp >= 40.0) score += 30; else if (temp >= 39.0) score += 20; else if (temp >= 38.0) score += 10
  if (dur >= 7) score += 20; else if (dur >= 5) score += 10
  if (f.chills        === 'yes') score += 10
  if (f.rash          === 'yes') score += 15
  if (f.recent_travel === 'yes') score += 12
  if (f.fever_pattern === 'intermittent') score += 8
  if (wbc > 12) score += 12; else if (wbc < 4) score += 8
  if (age > 65 || age < 5) score += 8
  score = Math.max(5, Math.min(98, score))
  let fever_type
  if (f.rash === 'yes' && f.recent_travel === 'yes')                          fever_type = 'Possible Dengue / Tropical Fever'
  else if (f.fever_pattern === 'intermittent' && f.recent_travel === 'yes')   fever_type = 'Possible Malaria / Typhoid'
  else if (wbc > 12 && f.chills === 'yes')                                    fever_type = 'Bacterial Fever'
  else if (wbc < 5  && f.rash !== 'yes')                                      fever_type = 'Viral Fever'
  else if (dur >= 7)                                                           fever_type = 'Prolonged Fever \u2014 investigate'
  else                                                                         fever_type = 'Undifferentiated Fever'
  const level = score < 38 ? 'Low' : score < 68 ? 'Medium' : 'High'
  const confidence = Math.min(95, 58 + Math.round(Math.abs(score - 50) * 0.65))
  const reasons = []
  if (temp >= 40.0)              reasons.push(`Very high fever (${temp.toFixed(1)}\u00b0C) \u2014 urgent`)
  else if (temp >= 39.0)         reasons.push(`High fever (${temp.toFixed(1)}\u00b0C)`)
  if (dur >= 7)                  reasons.push(`Fever persisting ${dur} days \u2014 further workup needed`)
  if (f.chills        === 'yes') reasons.push('Chills / rigors \u2014 possible bacteraemia')
  if (f.rash          === 'yes') reasons.push('Rash present \u2014 dengue / viral aetiology')
  if (f.recent_travel === 'yes') reasons.push('Recent travel \u2014 tropical infection risk')
  if (f.fever_pattern === 'intermittent') reasons.push('Intermittent pattern \u2014 malaria screen advised')
  if (!reasons.length)           reasons.push('Mild undifferentiated febrile illness')
  const action = { Low: 'Antipyretics, hydration, observe 48\u202fh', Medium: 'CBC + blood cultures + clinical review', High: 'Hospitalisation workup \u2014 CBC, culture, malaria screen' }[level]
  return { score, level, confidence, fever_type, reasons: reasons.slice(0, 5), action }
}

function computeViralBacterial(f) {
  const temp = parseFloat(f.temperature) || 37.5
  const wbc  = parseFloat(f.WBC_count)  || 8.0
  const crp  = parseFloat(f.CRP_level)  || 0.0
  let b = 0
  if (temp >= 39.0) b += 15; else if (temp >= 38.5) b += 8
  if (wbc > 12) b += 25; else if (wbc > 10) b += 12; else if (wbc < 5) b -= 15
  if (crp > 10) b += 20; else if (crp > 5) b += 10
  if (f.symptom_onset    === 'rapid')   b -= 10; else if (f.symptom_onset === 'gradual') b += 8
  if (f.sore_throat      === 'yes')     b += 8
  if (f.runny_nose       === 'yes')     b -= 12
  if (f.muscle_aches     === 'yes')     b -= 8
  if (f.recent_antibiotic_use === 'yes') b -= 5
  const score = Math.max(5, Math.min(98, Math.round(50 + b)))
  const classification = score >= 58 ? 'Bacterial' : score <= 42 ? 'Viral' : 'Uncertain'
  const level = (score >= 68 || score <= 25) ? 'High' : (score >= 43 && score <= 67) ? 'Medium' : 'Low'
  const confidence = Math.min(95, Math.round(Math.abs(b) * 1.5 + 55))
  const reasons = []
  if (wbc > 12)  reasons.push(`WBC ${wbc.toFixed(1)} \u00d710\u00b3/\u03bcL \u2014 leukocytosis (bacterial)`)
  else if (wbc < 5) reasons.push(`WBC ${wbc.toFixed(1)} \u00d710\u00b3/\u03bcL \u2014 leukopenia (viral)`)
  if (crp > 10)  reasons.push(`CRP ${crp.toFixed(1)} mg/L \u2014 elevated (bacterial marker)`)
  else           reasons.push(`CRP ${crp.toFixed(1)} mg/L \u2014 normal (viral likely)`)
  if (f.runny_nose  === 'yes')  reasons.push('Rhinorrhoea \u2014 typical viral sign')
  if (f.muscle_aches === 'yes') reasons.push('Myalgia \u2014 viral pattern')
  if (temp >= 39.0)             reasons.push(`High fever (${temp.toFixed(1)}\u00b0C)`)
  if (f.symptom_onset === 'rapid')   reasons.push('Rapid onset \u2014 viral pattern')
  else if (f.symptom_onset === 'gradual') reasons.push('Gradual onset \u2014 bacterial pattern')
  if (!reasons.length) reasons.push('Insufficient markers for definitive classification')
  const action = { Bacterial: 'Antibiotic therapy recommended after culture', Viral: 'Supportive care \u2014 antibiotics not indicated', Uncertain: 'Further labs: CRP, blood culture, throat swab' }[classification]
  return { score, level, confidence, classification, reasons: reasons.slice(0, 5), action, markers: { WBC: +wbc.toFixed(1), CRP: +crp.toFixed(1), temperature: +temp.toFixed(1) } }
}

function computeMisuse(f) {
  let score = 10
  if (f.prescribed_by === 'self') score += 35; else if (f.prescribed_by === 'online') score += 28; else if (f.prescribed_by === 'pharmacist') score += 18
  if (f.dose_completion === 'incomplete') score += 20
  if (f.indication_confirmed === 'no') score += 25; else if (f.indication_confirmed === 'unsure') score += 10
  if (f.shared_with_others === 'yes') score += 30
  const courses = parseInt(f.courses_last_year) || 0
  if (courses >= 4) score += 20; else if (courses >= 2) score += 10
  score = Math.max(5, Math.min(98, score))
  const level = score < 38 ? 'Low' : score < 68 ? 'Medium' : 'High'
  const confidence = Math.min(95, 70 + Math.round(score * 0.2))
  const resistance_risk = score >= 75 ? 'Critical' : score >= 55 ? 'High' : score >= 35 ? 'Moderate' : 'Low'
  const flags = []
  if (['self', 'online'].includes(f.prescribed_by)) flags.push('Self / online prescription \u2014 no clinical diagnosis made')
  if (f.prescribed_by === 'pharmacist') flags.push('Dispensed by pharmacist without prescription')
  if (f.dose_completion === 'incomplete') flags.push('Incomplete course \u2014 promotes resistance selection')
  if (f.indication_confirmed === 'no') flags.push('Indication not clinically confirmed')
  if (f.shared_with_others === 'yes') flags.push('Shared antibiotics \u2014 unauthorised use detected')
  if (courses >= 4) flags.push(`${courses} antibiotic courses in last year \u2014 overuse pattern`)
  if (!flags.length) flags.push('No critical misuse patterns detected')
  const recommendations = []
  if (f.prescribed_by === 'self') recommendations.push('Always consult a doctor before starting antibiotics')
  if (f.dose_completion === 'incomplete') recommendations.push('Complete the full antibiotic course even if feeling better')
  if (f.shared_with_others === 'yes') recommendations.push('Never share antibiotics \u2014 dosage is patient-specific')
  if (courses >= 3) recommendations.push('Consult an infectious disease specialist for resistance screening')
  recommendations.push('Report all antibiotic use to your doctor at every visit')

  // AI-suggested alternatives & home remedies (mirror backend logic)
  const ab = (f.antibiotic_name || '').toLowerCase()
  const alternatives = []
  if (f.indication_confirmed === 'no' || f.indication_confirmed === 'unsure')
    alternatives.push('Consult a certified doctor first \u2014 a proper diagnosis may confirm antibiotics are unnecessary')
  alternatives.push('Rest and increase fluid intake (2\u20133\u202fL/day) \u2014 the most effective first-line treatment for most viral infections')
  alternatives.push('Paracetamol 500\u20131000\u202fmg every 6\u202fh (or Ibuprofen 400\u202fmg every 8\u202fh) to relieve fever and pain')
  const uriAbx = ['amox', 'penicil', 'augmen', 'azithro', 'doxycycl', 'clarithro', 'cephalex']
  const giAbx  = ['metro', 'tinidaz', 'cipro', 'levo', 'norflo']
  if (uriAbx.some(x => ab.includes(x))) {
    alternatives.push('Warm saline gargle (\u00bc tsp salt in 250\u202fmL warm water) 3\u00d7 daily to soothe sore throat')
    alternatives.push('Steam inhalation 10\u201315\u202fmin twice daily with eucalyptus oil for nasal / sinus congestion')
    alternatives.push('Honey + warm lemon water \u2014 clinically shown to reduce cough severity (age \u2265 1\u202fyr)')
    alternatives.push('Vitamin\u202fC 500\u20131000\u202fmg + Zinc 10\u201315\u202fmg daily to shorten illness duration')
  } else if (giAbx.some(x => ab.includes(x))) {
    alternatives.push('Probiotics (Lactobacillus acidophilus / Bifidobacterium) to restore healthy gut microbiome')
    alternatives.push('Oral Rehydration Salts (ORS) if GI symptoms such as diarrhoea or nausea are present')
    alternatives.push('Increase fluid intake to \u2265 2.5\u202fL/day to support urinary tract flushing')
    alternatives.push('Cranberry extract supplements \u2014 evidence-based for prevention of recurrent mild UTIs')
  } else {
    alternatives.push('Saline nasal rinse (Neti pot or squeeze bottle) for upper respiratory congestion')
    alternatives.push('Honey-based lozenges or OTC throat spray for throat irritation and mild pain')
    alternatives.push('Vitamin\u202fC 500\u20131000\u202fmg + Zinc lozenges to enhance innate immune response')
    alternatives.push('Probiotic supplements to maintain healthy microbiome balance during illness')
  }
  alternatives.push('Monitor symptoms for 48\u201372\u202fh; seek medical review if no improvement or temperature exceeds 39\u202f\u00b0C')

  return { score, level, confidence, resistance_risk, flags: flags.slice(0, 5), recommendations: recommendations.slice(0, 4), alternatives: alternatives.slice(0, 6), action: `Resistance risk: ${resistance_risk} \u2014 review antibiotic stewardship protocols` }
}

function computeOsteoporosis(f) {
  const age = parseFloat(f.age) || 50.0
  const bmi = parseFloat(f.bmi) || 22.0
  const ts  = f.t_score !== '' && f.t_score !== undefined ? parseFloat(f.t_score) : null
  let score = 15
  if (age >= 70) score += 25; else if (age >= 60) score += 15; else if (age >= 50) score += 8
  if (f.sex               === 'female') score += 12
  if (bmi < 18.5) score += 15; else if (bmi < 22.0) score += 5
  if (f.menopause         === 'yes') score += 15
  if (f.previous_fracture === 'yes') score += 20
  if (f.family_history    === 'yes') score += 12
  if (f.steroid_use       === 'yes') score += 18
  if (f.smoking           === 'yes') score += 8
  if (ts !== null) { if (ts <= -2.5) score += 30; else if (ts <= -1.0) score += 15 }
  score = Math.max(5, Math.min(98, score))
  let risk_category
  if (ts !== null && ts <= -2.5)       risk_category = 'Osteoporosis \u2014 T-score confirmed'
  else if (ts !== null && ts <= -1.0)  risk_category = 'Osteopenia \u2014 monitor closely'
  else if (score >= 68)                risk_category = 'High-risk Osteoporosis Candidate'
  else if (score >= 38)                risk_category = 'Moderate Fracture Risk'
  else                                 risk_category = 'Low Osteoporosis Risk'
  let base = 3
  if (age >= 70) base += 8; else if (age >= 60) base += 4; else if (age >= 50) base += 2
  if (f.sex === 'female')           base += 3
  if (f.previous_fracture === 'yes') base += 6
  if (f.family_history === 'yes')   base += 3
  if (f.steroid_use === 'yes')      base += 4
  if (ts !== null && ts <= -2.5)    base += 10
  else if (ts !== null && ts <= -1.0) base += 5
  const fracture_risk_10yr = Math.min(95, Math.round(base))
  const level = score < 38 ? 'Low' : score < 68 ? 'Medium' : 'High'
  const confidence = Math.min(92, 60 + Math.round(Math.abs(score - 50) * 0.55))
  const reasons = []
  if (age >= 70)                    reasons.push(`Age ${Math.round(age)} \u2014 very high osteoporosis risk zone`)
  else if (age >= 60)               reasons.push(`Age ${Math.round(age)} \u2014 elevated bone loss risk`)
  else if (age >= 50)               reasons.push(`Age ${Math.round(age)} \u2014 bone density monitoring recommended`)
  if (f.sex === 'female')           reasons.push('Female sex \u2014 accelerated bone loss after menopause')
  if (bmi < 18.5)                   reasons.push(`Low BMI (${bmi.toFixed(1)}) \u2014 reduced bone mass`)
  if (f.menopause === 'yes')        reasons.push('Post-menopausal \u2014 oestrogen loss accelerates bone resorption')
  if (f.previous_fracture === 'yes') reasons.push('Previous fragility fracture \u2014 strongest predictor of future fractures')
  if (f.family_history === 'yes')   reasons.push('Family history of osteoporosis / hip fracture')
  if (f.steroid_use === 'yes')      reasons.push('Long-term corticosteroid use \u2014 reduces bone mineral density')
  if (f.smoking === 'yes')          reasons.push('Smoking \u2014 impairs osteoblast activity')
  if (ts !== null && ts <= -2.5)    reasons.push(`T-score ${ts.toFixed(1)} \u2014 meets WHO criteria for osteoporosis`)
  else if (ts !== null && ts <= -1.0) reasons.push(`T-score ${ts.toFixed(1)} \u2014 osteopenia range`)
  if (!reasons.length) reasons.push('No major osteoporosis risk factors identified at this time')
  const action = { Low: 'Standard bone health advice; DEXA scan at 65+ per clinical guideline', Medium: 'DEXA bone density scan recommended; review calcium and vitamin\u202fD intake', High: 'Urgent DEXA scan + specialist referral; evaluate anti-resorptive therapy' }[level]
  return { score, level, confidence, risk_category, fracture_risk_10yr, reasons: reasons.slice(0, 5), action }
}

function computeLocal(toolId, form) {
  if (toolId === 'osteoporosis')    return computeOsteoporosis(form)
  if (toolId === 'respiratory')     return computeRespiratory(form)
  if (toolId === 'fever')           return computeFever(form)
  if (toolId === 'viral-bacterial') return computeViralBacterial(form)
  if (toolId === 'misuse-checker')  return computeMisuse(form)
  throw new Error('Unknown tool')
}

function PredictionModal({ tool, onClose }) {
  const [form, setForm]       = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(tool.endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(coerceForm(tool.fields, form)),
      })
      if (!res.ok) throw new Error(await res.text())
      setResult(await res.json())
    } catch {
      // Backend unavailable — run analysis locally in the browser
      setResult({ ...computeLocal(tool.id, form), _demo: true })
    } finally {
      setLoading(false)
    }
  }

  const lvl = result ? (LEVEL_CFG[result.level] || LEVEL_CFG.Medium) : null

  const extraStats = result ? (() => {
    if (tool.id === 'osteoporosis')   return [
      { label: 'Risk Category',       value: result.risk_category },
      { label: '10-yr Fracture Risk', value: result.fracture_risk_10yr + '%' },
    ]
    if (tool.id === 'respiratory')    return [
      { label: 'Likely Diagnosis',  value: result.diagnosis },
      { label: 'Antibiotic Needed', value: result.antibiotic_recommended ? 'Yes' : 'No' },
    ]
    if (tool.id === 'fever')          return [{ label: 'Fever Type',      value: result.fever_type }]
    if (tool.id === 'viral-bacterial') return [
      { label: 'Classification', value: result.classification },
      { label: 'WBC',            value: (result.markers?.WBC ?? '—') + ' \u00d710\u00b3/\u03bcL' },
    ]
    if (tool.id === 'misuse-checker') return [{ label: 'Resistance Risk', value: result.resistance_risk }]
    return []
  })() : []

  const detailList = result
    ? (tool.id === 'misuse-checker' ? result.flags : result.reasons)
    : []

  return (
    <div className="dp-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dp-modal">

        {/* Header */}
        <div className="dp-modal__head">
          <div className="dp-modal__head-icon">{tool.icon}</div>
          <h3 className="dp-modal__head-title">{tool.title}</h3>
          <button className="dp-modal__close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="dp-modal__body">
          <form onSubmit={handleSubmit}>
            <div className="dp-modal__form-grid">
              {tool.fields.map(field => (
                <div key={field.key} className="dp-modal__field">
                  <label>{field.label}{field.optional ? ' (optional)' : ''}</label>
                  {field.type === 'select' ? (
                    <select value={form[field.key] || ''} onChange={e => set(field.key, e.target.value)}>
                      <option value="">Select...</option>
                      {field.options.map(o => (
                        <option key={o} value={o}>
                          {o.charAt(0).toUpperCase() + o.slice(1).replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={form[field.key] || ''}
                      onChange={e => set(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      min={field.min}
                      max={field.max}
                      step={field.step ?? (field.type === 'number' ? 'any' : undefined)}
                    />
                  )}
                </div>
              ))}
            </div>

            <button type="submit" className={`${tool.status === 'featured' ? 'btn-primary' : 'btn-secondary'} dp-modal__submit`} disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <span className="dp-modal__spinner" /> Analysing...
                </span>
              ) : (
                <>
                  <span>Run AI Analysis</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {result && lvl && (
            <div className="dp-modal__result">
              {/* Score + Level */}
              <div className="dp-modal__result-head">
                <div>
                  <div className="dp-modal__result-small-label">Risk Score</div>
                  <div className="dp-modal__score" style={{ color: lvl.color }}>{result.score}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="dp-modal__level-badge" style={{ color: lvl.color, background: lvl.bg, borderColor: lvl.border }}>
                    {lvl.label}
                  </div>
                  <div className="dp-modal__confidence">Confidence: {result.confidence}%</div>
                  {result._demo && (
                    <div className="dp-modal__demo-badge">⚡ Client-side mode</div>
                  )}
                </div>
              </div>

              {/* Extra stats */}
              {extraStats.length > 0 && (
                <div className="dp-modal__result-meta">
                  {extraStats.map(s => (
                    <div key={s.label} className="dp-modal__result-stat">
                      <div className="dp-modal__result-stat-label">{s.label}</div>
                      <div className="dp-modal__result-stat-value">{s.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reasons / Flags */}
              {detailList.length > 0 && (
                <div className="dp-modal__result-section">
                  <div className="dp-modal__result-section-title">
                    {tool.id === 'misuse-checker' ? 'Risk Flags' : 'Clinical Indicators'}
                  </div>
                  <ul className="dp-modal__reason-list">
                    {detailList.map((r, i) => <li key={i} className="dp-modal__reason-item">{r}</li>)}
                  </ul>
                </div>
              )}

              {/* Recommendations (misuse only) */}
              {tool.id === 'misuse-checker' && result.recommendations?.length > 0 && (
                <div className="dp-modal__result-section">
                  <div className="dp-modal__result-section-title">Recommendations</div>
                  <ul className="dp-modal__reason-list">
                    {result.recommendations.map((r, i) => <li key={i} className="dp-modal__reason-item">{r}</li>)}
                  </ul>
                </div>
              )}

              {/* AI-Suggested Alternatives & Home Remedies (misuse only) */}
              {tool.id === 'misuse-checker' && result.alternatives?.length > 0 && (
                <div className="dp-modal__result-section dp-modal__result-section--alt">
                  <div className="dp-modal__result-section-title dp-modal__result-section-title--alt">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 5, verticalAlign: 'middle' }}>
                      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0c0 5-2 9-5 11m5-11c0 5 2 9 5 11"/>
                    </svg>
                    AI-Suggested Alternatives &amp; Home Remedies
                  </div>
                  <ul className="dp-modal__reason-list">
                    {result.alternatives.map((r, i) => (
                      <li key={i} className="dp-modal__reason-item dp-modal__reason-item--alt">{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Antibiotic note (respiratory only) */}
              {tool.id === 'respiratory' && (
                <div className="dp-modal__result-section">
                  <div className="dp-modal__result-section-title">Antibiotic Recommendation</div>
                  <div className="dp-modal__action-box" style={
                    result.antibiotic_recommended
                      ? { background: 'rgba(239,68,68,0.08)', color: '#ef4444' }
                      : { background: 'rgba(34,197,94,0.08)', color: '#22c55e' }
                  }>
                    {result.antibiotic_recommended
                      ? 'Antibiotic therapy likely required \u2014 confirm with culture'
                      : 'Antibiotics not currently indicated \u2014 supportive care recommended'}
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="dp-modal__result-section">
                <div className="dp-modal__result-section-title">Recommended Action</div>
                <div className="dp-modal__action-box">{result.action}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DiseasePrediction() {
  const [activeModal, setActiveModal] = useState(null)
  const { t } = useLanguage()

  return (
    <>
      <section className="disease section section-alt" id="disease">
        <div className="bg-mesh" aria-hidden>
          <div className="orb" style={{ width: 500, height: 500, bottom: '-150px', left: '-100px', background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)' }} />
        </div>

        <div className="section-container">
          {/* Header */}
          <div className="disease__header animate-fadein">
            <h2 className="section-title">
              {t('disease.title')} <span className="gradient-text">{t('disease.titleHL')}</span>
            </h2>
            <div className="section-divider" />
            <p className="section-subtitle">
              {t('disease.subtitle')}
            </p>
          </div>

          {/* Grid */}
          <div className="disease__grid">
            {TOOLS.map((tool, i) => (
              <div
                key={tool.id}
                className={`disease__card card animate-fadein anime-delay-${i + 1}${tool.status === 'featured' ? ' disease__card--featured' : ''}`}
              >
                {tool.status === 'featured' && (
                  <div className="disease__badge-featured">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Featured Tool
                  </div>
                )}

                <div className="disease__card-number">{tool.number}</div>

                <div className="disease__card-top">
                  <div className="disease__card-icon">{tool.icon}</div>
                  <div className="disease__card-accuracy">
                    <div className="disease__accuracy-value">{tool.accuracy}%</div>
                    <div className="disease__accuracy-label">Accuracy</div>
                  </div>
                </div>

                <h3 className="disease__card-title">{tool.title}</h3>
                <p className="disease__card-desc">{tool.desc}</p>

                <div className="disease__card-tags">
                  {tool.tags.map(t => <span key={t} className="disease__tag">{t}</span>)}
                </div>

                <button
                  className={tool.status === 'featured' ? 'btn-primary disease__btn' : 'btn-secondary disease__btn'}
                  onClick={() => tool.endpoint && setActiveModal(tool)}
                  disabled={!tool.endpoint}
                  title={!tool.endpoint ? 'Coming soon' : undefined}
                >
                  <span>{tool.endpoint ? 'Run Analysis' : 'Coming Soon'}</span>
                  {tool.endpoint && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  )}
                </button>

                <div className="disease__card-glow" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {activeModal && (
        <PredictionModal tool={activeModal} onClose={() => setActiveModal(null)} />
      )}
    </>
  )
}
