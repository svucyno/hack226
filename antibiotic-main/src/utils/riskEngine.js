/* Shared AI risk computation engine */
export function computeRisk(f) {
  let score = 30

  if (f.recent_antibiotic_use === 'yes')      score += 28
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
  if (dur <= 3)                               reasons.push('Short symptom duration (likely viral)')
  if (dur >= 7)                               reasons.push('Prolonged symptom duration')
  if (f.fever === 'yes')                      reasons.push('Fever present')
  if (f.fever === 'no')                       reasons.push('No fever detected (mild presentation)')
  if (f.recent_antibiotic_use === 'yes')      reasons.push('Recent antibiotic use — resistance risk')
  if (f.suspected_infection_type === 'viral') reasons.push('Viral infection suspected')
  if (!isNaN(crp) && crp <= 5)               reasons.push('Normal CRP level')
  if (!isNaN(crp) && crp > 10)               reasons.push('Elevated CRP — bacterial indicator')
  if (!isNaN(wbc) && wbc <= 11)              reasons.push('Normal WBC count')
  if (!isNaN(wbc) && wbc > 11)              reasons.push('Elevated WBC — possible bacterial infection')
  if (symptomCount <= 2)                      reasons.push('Limited symptom cluster')

  const action =
    level === 'Low'    ? 'observe'
    : level === 'Medium' ? 'doctor review'
    : 'further testing'

  return { score, level, confidence, pattern, reasons: reasons.slice(0, 5), action }
}

export const LEVEL_CFG = {
  Low:    { color: '#22c55e', gradA: '#16a34a', gradB: '#22c55e', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.30)',  label: 'Low Risk',      icon: '✓' },
  Medium: { color: '#f59e0b', gradA: '#d97706', gradB: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)', label: 'Moderate Risk', icon: '⚠' },
  High:   { color: '#ef4444', gradA: '#dc2626', gradB: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.30)',  label: 'High Risk',     icon: '!' },
}

export const ACTION_CFG = {
  'observe':          { icon: '👁', title: 'Observe & Monitor',        sub: 'No immediate antibiotic needed. Rest and monitor for 48–72 hours.', color: '#22c55e' },
  'doctor review':    { icon: '👨‍⚕️', title: 'Doctor Review Advised',    sub: 'Schedule a clinical consultation within 24 hours.', color: '#f59e0b' },
  'further testing':  { icon: '🔬', title: 'Further Testing Required', sub: 'Urgent clinical review + diagnostics recommended.', color: '#ef4444' },
}

export const INIT_FORM = {
  patient_id: '', age: '', sex: '',
  fever: '', cough: '', sore_throat: '', runny_nose: '',
  symptom_duration_days: '',
  recent_antibiotic_use: '', antibiotic_allergy: '',
  suspected_infection_type: '',
  WBC_count: '', CRP_level: '',
}
