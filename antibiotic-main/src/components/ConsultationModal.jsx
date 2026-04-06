import { useState } from 'react'
import { useLanguage } from '../utils/LanguageContext'
import './ConsultationModal.css'

export default function ConsultationModal({ doctor, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    symptoms: '',
  })

  const [submitted, setSubmitted] = useState(false)
  const { t } = useLanguage()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate form
    if (!formData.name || !formData.email || !formData.phone) {
      alert(t('consultation.validationError'))
      return
    }

    setSubmitted(true)
    onSubmit(formData)

    // Clear after 2 seconds and close
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  if (submitted) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content success-modal" onClick={e => e.stopPropagation()}>
          <div className="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h3>{t('consultation.successTitle')}</h3>
          <p>{t('consultation.successMessage')}</p>
          <div className="success-details">
            <p><strong>{doctor.name}</strong></p>
            <p>{formData.email}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="modal-header">
          <h2>{t('consultation.title')}</h2>
          <p className="doctor-name">{doctor.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="consultation-form">
          <div className="form-group">
            <label htmlFor="name">{t('consultation.yourName')}</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('consultation.enterName')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">{t('consultation.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('consultation.enterEmail')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">{t('consultation.phone')}</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={t('consultation.enterPhone')}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="preferredDate">{t('consultation.preferredDate')}</label>
              <input
                type="date"
                id="preferredDate"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="preferredTime">{t('consultation.preferredTime')}</label>
              <input
                type="time"
                id="preferredTime"
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="symptoms">{t('consultation.symptoms')}</label>
            <textarea
              id="symptoms"
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              placeholder={t('consultation.describeSymptons')}
              rows="4"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              {t('consultation.cancel')}
            </button>
            <button type="submit" className="btn-primary">
              {t('consultation.confirmBooking')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
