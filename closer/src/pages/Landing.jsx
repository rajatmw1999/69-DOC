// Cinematic landing: scroll-scrubbed video background + frosted glass UI.
// Adapted for Closer from the NovaAI hero language — Inter, white-on-video,
// glass chips, sparse editorial layout.
import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

const HERO_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4'
const PORTRAIT = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260728_050334_5b076e26-0ce7-4898-b432-d764190e448f.png&w=1280&q=85'

function Chevron({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

// Reveal-on-scroll (IntersectionObserver, 700ms fade-up)
function Reveal({ children, delay = 0, className = '', style, ...rest }) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`reveal ${seen ? 'reveal-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms`, ...style }} {...rest}>
      {children}
    </div>
  )
}

// Fixed background video, scrubbed by page scroll (smoothed seek).
function ScrollVideo() {
  const videoRef = useRef(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let smoothed = 0
    let target = 0
    let raf = 0
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    }
    const tick = () => {
      smoothed += (target - smoothed) * 0.12
      const d = video.duration
      if (d && !Number.isNaN(d)) {
        const t = smoothed * (d - 0.05)
        if (Math.abs(video.currentTime - t) > 0.04) { try { video.currentTime = t } catch { /* seeking */ } }
      }
      raf = requestAnimationFrame(tick)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll) }
  }, [])
  return (
    <div className="cine-bg" aria-hidden="true">
      <video
        ref={videoRef}
        className={`cine-video ${ready ? 'is-ready' : ''}`}
        src={HERO_VIDEO}
        muted
        playsInline
        preload="auto"
        onLoadedData={() => setReady(true)}
      />
      <div className="cine-scrim" />
    </div>
  )
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)

  const NavLinks = ({ onClick }) => (
    <>
      <a href="#method" onClick={onClick}>The Method</a>
      <Link to="/app/characters" onClick={onClick}>Characters</Link>
      <Link to="/pricing" onClick={onClick}>Pricing</Link>
    </>
  )

  return (
    <div className="cine">
      <ScrollVideo />

      <div className="cine-wrap">
        {/* Navbar */}
        <header className="cine-nav">
          <Link to="/" className="cine-logo">
            <span className="logo-mark">C</span>
            <b>Closer</b>
          </Link>
          <nav className="cine-links">
            <NavLinks />
          </nav>
          <Link to="/auth" className="cine-nav-cta">Start Training</Link>
        </header>

        <main>
          {/* ── Section One — Hero ─────────────────────────── */}
          <section className="cine-section">
            <div className="cine-toprow">
              <div className="cine-services">
                {['COLD-CALL SIMULATION', 'OBJECTION MASTERY', 'LIVE CALL COACHING'].map((s, i) => (
                  <Reveal key={s} delay={150 + i * 120} className="cine-service">/ {s}</Reveal>
                ))}
              </div>
              <Reveal delay={300} className="cine-intro">
                We build the training ground where reps become closers — real reps, real pressure,
                and brutal, useful feedback after every single call.
              </Reveal>
            </div>

            <div className="cine-bottomrow">
              <div className="cine-headline-col">
                <Reveal delay={150}>
                  <span className="badge-accent">Trusted by 2,800+ closers in training</span>
                </Reveal>
                <Reveal delay={280}>
                  <h1 className="cine-h1">Read the room.<br />Close the deal.</h1>
                </Reveal>
              </div>

              <Reveal delay={420} className="cine-contact">
                <img src={PORTRAIT} alt="Mitha, head coach at Closer" className="cine-portrait" />
                <div className="cine-contact-text">
                  <span className="cine-contact-name">Talk with Mitha</span>
                  <span className="cine-contact-role">Head coach at Closer</span>
                  <Link to="/contact" className="cine-contact-btn">Book a 15-min call <Chevron size={14} /></Link>
                </div>
              </Reveal>
            </div>
          </section>

          {/* Spacer — gives scroll room to scrub the video */}
          <div className="cine-spacer" aria-hidden="true" />

          {/* ── Section Two — Capability ───────────────────── */}
          <section className="cine-section" id="method">
            <div className="cine-toprow">
              <Reveal delay={120}>
                <span className="badge-accent">Coaching on demand</span>
              </Reveal>
              <Reveal delay={220} className="cine-intro">
                Our AI doesn't just answer — it probes, pushes back, and breaks like a real prospect,
                then hands you the tape.
              </Reveal>
            </div>

            <div className="cine-cap">
              <div className="cine-cap-left">
                <Reveal delay={180}>
                  <h2 className="cine-h1">Learn to close<br />fearlessly.</h2>
                </Reveal>
                <Reveal delay={320}>
                  <p className="cine-cap-body">
                    From your first nervous dial to a booked meeting, Closer turns raw reps into instincts
                    you keep — quietly, precisely, at speed.
                  </p>
                </Reveal>
                <Reveal delay={420} className="cine-cap-ctas">
                  <Link to="/app" className="btn btn-white cine-pill">Start training <Chevron size={14} /></Link>
                  <Link to="/app/simulator" className="btn btn-ghost cine-pill">Watch a demo</Link>
                </Reveal>
              </div>

              <Reveal delay={300} className="cine-cap-panel">
                {[
                  ['01', 'Live objection handling', 'Reads what the prospect throws and coaches your comeback before you freeze.'],
                  ['02', '15-metric call review', 'Every call scored on tone, questions, closing and twelve more — no hiding from the tape.'],
                  ['03', '21 AI opponents', 'From patient buyers to prospects who hang up in eight seconds — each one adapts to you.'],
                ].map(([n, title, body], i) => (
                  <div key={n} className={`cine-cap-row ${i < 2 ? 'divided' : ''}`}>
                    <span className="cine-cap-idx">{n}</span>
                    <div>
                      <div className="cine-cap-title">{title} <Chevron size={16} /></div>
                      <p className="cine-cap-rowbody">{body}</p>
                    </div>
                  </div>
                ))}
              </Reveal>
            </div>
          </section>
        </main>
      </div>

      {/* Mobile menu */}
      <button className="cine-burger" aria-label="Menu" onClick={() => setMenuOpen((o) => !o)}>
        <span className={menuOpen ? 'open' : ''} /><span className={menuOpen ? 'open' : ''} /><span className={menuOpen ? 'open' : ''} />
      </button>
      <div className={`cine-mobile ${menuOpen ? 'show' : ''}`}>
        <NavLinks onClick={() => setMenuOpen(false)} />
        <Link to="/auth" className="btn btn-white cine-pill" onClick={() => setMenuOpen(false)}>Start Training</Link>
      </div>
    </div>
  )
}
