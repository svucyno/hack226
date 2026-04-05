import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { LanguageProvider } from './utils/LanguageContext'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import AntibioticMeter from './components/AntibioticMeter'
import DiseasePrediction from './components/DiseasePrediction'
import DoctorConsultancy from './components/DoctorConsultancy'
import MedicalUpdates from './components/MedicalUpdates'
import PatientForm from './components/PatientForm'
import ResultPage from './components/ResultPage'
import Footer from './components/Footer'
import './App.css'

/* ── Animated bio-background entities ── */

function VirusShape({ id, size = 80, style }) {
  const spikes = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180
    const r = size * 0.36
    const ro = size * 0.52
    return {
      x1: size / 2 + r  * Math.cos(a),
      y1: size / 2 + r  * Math.sin(a),
      x2: size / 2 + ro * Math.cos(a),
      y2: size / 2 + ro * Math.sin(a),
    }
  })
  const gid = `vg${id}`
  return (
    <div className={`bio-entity bio-virus bio-virus--${id % 2 === 0 ? 'a' : 'b'}`} style={{ width: size, height: size, ...style }}>
      <svg viewBox={`0 0 ${size} ${size}`} fill="none">
        <defs>
          <radialGradient id={gid} cx="35%" cy="28%">
            <stop offset="0%"   stopColor="#ff6b9d" stopOpacity="0.95"/>
            <stop offset="45%"  stopColor="#f43f5e" stopOpacity="0.75"/>
            <stop offset="100%" stopColor="#be123c" stopOpacity="0.40"/>
          </radialGradient>
        </defs>
        {spikes.map((s, i) => (
          <g key={i}>
            <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
              stroke="rgba(244,63,94,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx={s.x2} cy={s.y2} r={size * 0.042}
              fill="rgba(255,100,130,0.50)" stroke="rgba(255,120,150,0.4)" strokeWidth="0.8"/>
          </g>
        ))}
        <circle cx={size/2} cy={size/2} r={size * 0.34} fill={`url(#${gid})`}
          stroke="rgba(244,63,94,0.3)" strokeWidth="1"/>
        <circle cx={size*0.40} cy={size*0.36} r={size*0.08} fill="rgba(255,200,220,0.28)"/>
        <circle cx={size*0.45} cy={size*0.30} r={size*0.04} fill="rgba(255,255,255,0.22)"/>
      </svg>
    </div>
  )
}

function PillShape({ id, style }) {
  const gid = `pg${id}`
  const hid = `ph${id}`
  return (
    <div className="bio-entity bio-pill" style={style}>
      <svg viewBox="0 0 110 44" fill="none">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#00d4c8" stopOpacity="0.85"/>
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.50"/>
          </linearGradient>
          <linearGradient id={hid} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.30)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="106" height="40" rx="20" fill={`url(#${gid})`}
          stroke="rgba(0,212,200,0.6)" strokeWidth="1.2"/>
        <rect x="8" y="7" width="40" height="12" rx="6" fill={`url(#${hid})`}/>
        <line x1="55" y1="3" x2="55" y2="41" stroke="rgba(0,212,200,0.35)" strokeWidth="1.2"/>
        <ellipse cx="27" cy="22" rx="18" ry="14" stroke="rgba(0,212,200,0.18)" strokeWidth="0.8" fill="none"/>
        <ellipse cx="83" cy="22" rx="18" ry="14" stroke="rgba(0,212,200,0.18)" strokeWidth="0.8" fill="none"/>
      </svg>
    </div>
  )
}

function MoleculeShape({ id, size = 90, style }) {
  const center = size / 2
  const bonds  = Array.from({ length: 6 }, (_, i) => {
    const a = ((i * 60 - 90) * Math.PI) / 180
    const r = size * 0.32
    return { x: center + r * Math.cos(a), y: center + r * Math.sin(a) }
  })
  const gid = `mg${id}`
  return (
    <div className="bio-entity bio-molecule" style={{ width: size, height: size, ...style }}>
      <svg viewBox={`0 0 ${size} ${size}`} fill="none">
        <defs>
          <radialGradient id={gid} cx="40%" cy="35%">
            <stop offset="0%"   stopColor="#c084fc" stopOpacity="0.95"/>
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.40"/>
          </radialGradient>
        </defs>
        {bonds.map((b, i) => (
          <line key={i}
            x1={center} y1={center} x2={b.x} y2={b.y}
            stroke="rgba(168,85,247,0.45)" strokeWidth="1.5"/>
        ))}
        {bonds.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={size * 0.072}
            fill="rgba(168,85,247,0.35)" stroke="rgba(192,132,252,0.55)" strokeWidth="1"/>
        ))}
        <circle cx={center} cy={center} r={size * 0.13} fill={`url(#${gid})`}
          stroke="rgba(192,132,252,0.5)" strokeWidth="1"/>
        <circle cx={center - size*0.04} cy={center - size*0.04}
          r={size * 0.04} fill="rgba(255,255,255,0.28)"/>
      </svg>
    </div>
  )
}

const VIRUS_CFG = [
  { id:0, size:88,  style:{ top:'7%',   left:'3%',   '--dur':'18s', '--delay':'0s'  } },
  { id:1, size:62,  style:{ top:'60%',  left:'1%',   '--dur':'22s', '--delay':'4s'  } },
  { id:2, size:104, style:{ top:'18%',  right:'2%',  '--dur':'20s', '--delay':'7s'  } },
  { id:3, size:72,  style:{ top:'72%',  right:'5%',  '--dur':'17s', '--delay':'11s' } },
  { id:4, size:54,  style:{ top:'42%',  left:'47%',  '--dur':'25s', '--delay':'14s' } },
]

const PILL_CFG = [
  { id:0, style:{ top:'12%',  left:'28%',  '--pill-rot':'-22deg', '--dur':'20s', '--delay':'2s'  } },
  { id:1, style:{ top:'52%',  right:'12%', '--pill-rot':'38deg',  '--dur':'18s', '--delay':'8s'  } },
  { id:2, style:{ top:'82%',  left:'18%',  '--pill-rot':'-48deg', '--dur':'23s', '--delay':'5s'  } },
  { id:3, style:{ top:'32%',  left:'70%',  '--pill-rot':'15deg',  '--dur':'19s', '--delay':'12s' } },
  { id:4, style:{ top:'8%',   right:'28%', '--pill-rot':'-62deg', '--dur':'21s', '--delay':'6s'  } },
]

const MOL_CFG = [
  { id:0, size:96, style:{ top:'28%',  left:'12%',  '--dur':'26s', '--delay':'1s'  } },
  { id:1, size:78, style:{ top:'68%',  right:'20%', '--dur':'22s', '--delay':'9s'  } },
  { id:2, size:66, style:{ top:'48%',  left:'58%',  '--dur':'24s', '--delay':'15s' } },
  { id:3, size:84, style:{ top:'78%',  left:'40%',  '--dur':'20s', '--delay':'3s'  } },
]

function BioBackground() {
  return (
    <div className="bio-bg" aria-hidden="true">
      {VIRUS_CFG.map(c => <VirusShape key={c.id} {...c} />)}
      {PILL_CFG.map(c  => <PillShape  key={c.id} {...c} />)}
      {MOL_CFG.map(c   => <MoleculeShape key={c.id} {...c} />)}
    </div>
  )
}

/* ── Scroll-reveal + route manager ── */
function PageManager() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    const els = document.querySelectorAll('.animate-fadein, .animate-fadein-l, .animate-fadein-r')
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.style.animationPlayState = 'running'
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.10, rootMargin: '0px 0px -30px 0px' }
    )
    els.forEach(el => {
      el.style.animationPlayState = 'paused'
      obs.observe(el)
    })
    return () => obs.disconnect()
  }, [pathname])

  return null
}

function AppShell() {
  const { pathname } = useLocation()

  return (
    <div className="app">
      <BioBackground />
      <Navbar />
      <main>
        <div className="page-view" key={pathname}>
          <Routes>
            <Route path="/"                   element={<HeroSection />} />
            <Route path="/analysis"           element={<PatientForm />} />
            <Route path="/result"             element={<ResultPage />} />
            <Route path="/usage-meter"        element={<AntibioticMeter />} />
            <Route path="/disease-prediction" element={<DiseasePrediction />} />
            <Route path="/doctors"            element={<DoctorConsultancy />} />
            <Route path="/updates"            element={<MedicalUpdates />} />
          </Routes>
        </div>
      </main>
      <Footer />
      <PageManager />
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </LanguageProvider>
  )
}
