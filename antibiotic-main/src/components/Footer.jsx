import './Footer.css'

const FOOTER_LINKS = {
  Platform: [
    'AI Risk Analysis',
    'Disease Prediction',
    'Doctor Consultancy',
    'Usage Meter',
    'Medical Updates',
    'Resistance Database',
  ],
  Healthcare: [
    'Antibiotic Guidelines',
    'WHO Protocols',
    'CDC Resources',
    'Clinical Research',
    'Patient Education',
    'Hospital Integration',
  ],
  Support: [
    'Help Center',
    'Contact Us',
    'Report Issue',
    'Privacy Policy',
    'Terms of Service',
    'API Documentation',
  ],
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      {/* Top wave */}
      <div className="footer__wave">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,80 C360,0 1080,0 1440,80 L1440,0 L0,0 Z" fill="var(--clr-bg-dark)"/>
        </svg>
      </div>

      <div className="footer__main">
        <div className="section-container footer__grid">
          {/* Brand column */}
          <div className="footer__brand">
            <div className="footer__logo">
              <div className="footer__logo-icon">
                <svg viewBox="0 0 36 36" fill="none">
                  <circle cx="18" cy="18" r="17" fill="url(#ftLogo)"/>
                  <path d="M12 18 Q18 9 24 18 Q18 27 12 18Z" fill="white" opacity="0.9"/>
                  <circle cx="18" cy="18" r="4" fill="white"/>
                  <defs>
                    <linearGradient id="ftLogo" x1="0" y1="0" x2="36" y2="36">
                      <stop offset="0%" stopColor="#0d9488"/>
                      <stop offset="100%" stopColor="#0ea5e9"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div>
                <div className="footer__logo-name">AntibioticAI</div>
                <div className="footer__logo-sub">Risk Alert System</div>
              </div>
            </div>

            <p className="footer__brand-desc">
              An intelligent healthcare platform leveraging AI to combat antibiotic
              misuse and resistance. Empowering clinicians with real-time risk analysis
              and decision support tools.
            </p>

            {/* Badges */}
            <div className="footer__badges">
              <div className="footer__badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                HIPAA Compliant
              </div>
              <div className="footer__badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                WHO Aligned
              </div>
              <div className="footer__badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4l3 3"/>
                </svg>
                24/7 Available
              </div>
            </div>

            {/* Social links */}
            <div className="footer__socials">
              {['Twitter', 'LinkedIn', 'GitHub', 'YouTube'].map(s => (
                <button key={s} className="footer__social" aria-label={s}>
                  <span className="footer__social-label">{s[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div className="footer__col" key={title}>
              <h4 className="footer__col-title">{title}</h4>
              <ul className="footer__col-links">
                {links.map(link => (
                  <li key={link}>
                    <a href="#" className="footer__link">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div className="footer__newsletter">
            <h4 className="footer__col-title">Stay Updated</h4>
            <p className="footer__newsletter-desc">
              Get the latest antibiotic resistance alerts and clinical updates in your inbox.
            </p>
            <div className="footer__newsletter-form">
              <input
                type="email"
                placeholder="your@email.com"
                className="footer__newsletter-input"
              />
              <button className="btn-primary footer__newsletter-btn">
                Subscribe
              </button>
            </div>
            <p className="footer__newsletter-note">
              ✓ No spam. Unsubscribe anytime. Healthcare professionals only.
            </p>
          </div>
        </div>
      </div>

      {/* Medical disclaimer */}
      <div className="footer__disclaimer">
        <div className="section-container">
          <div className="footer__disclaimer-box">
            <div className="footer__disclaimer-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
            </div>
            <div>
              <strong>Medical Disclaimer</strong>
              <p>
                This platform provides decision-support information and does not replace professional medical advice,
                diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider
                with any questions you may have regarding a medical condition. Never disregard professional medical
                advice or delay in seeking it because of something you have read on this platform.
                In case of a medical emergency, contact your local emergency services immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottombar */}
      <div className="footer__bottom">
        <div className="section-container footer__bottom-inner">
          <p className="footer__copyright">
            © {year} AntibioticAI Risk Alert System. Built for healthcare innovation.
          </p>
          <div className="footer__bottom-links">
            {['Privacy', 'Terms', 'Cookies', 'Sitemap'].map(l => (
              <a key={l} href="#" className="footer__bottom-link">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
