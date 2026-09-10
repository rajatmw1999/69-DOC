// Skill Academy: comprehensive certified courses + shorter quick courses.
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ACADEMY, ACADEMY_CATEGORIES } from '../data/academy.js'
import { Meter } from '../components/ui.jsx'
import { useProfile } from '../components/AppShell.jsx'

function progressOf(profile, m) {
  const p = profile.academy[m.id]
  if (!p) return 0
  const total = m.lessons.length + 2 // lessons + drill + quiz
  const done = (p.lessonsDone?.length || 0) + (p.drillDone ? 1 : 0) + (p.quizBest != null ? 1 : 0)
  return Math.round((done / total) * 100)
}

function CourseCard({ profile, m, i }) {
  const pct = progressOf(profile, m)
  const earned = !!profile.certificates?.[m.id]
  return (
    <Link to={`/app/academy/${m.id}`} className={`card module-card card-hover anim-up d${(i % 3) + 1}`}>
      <span className={`course-badge ${m.certificate ? 'certified' : 'quick'}`}>
        {m.certificate ? (earned ? '🏅 Earned' : '🎖 Certificate') : 'Quick'}
      </span>
      <span className="module-emoji">{m.emoji}</span>
      <h3>{m.name}</h3>
      <div className="module-meta">
        <span className="chip">{m.category}</span>
        <span>{m.level}</span>
        <span>·</span>
        <span>{m.lessons.length} lessons</span>
        <span>·</span>
        <span>~{m.minutes}m</span>
      </div>
      <p className="char-desc">{m.description}</p>
      <div style={{ marginTop: 'auto' }}>
        <div className="row between" style={{ fontSize: 11.5, color: 'var(--ink-2)', marginBottom: 5 }}>
          <span>{pct === 100 ? '✓ Complete' : pct > 0 ? 'In progress' : 'Not started'}</span>
          <span className="mono">{pct}%</span>
        </div>
        <Meter value={pct} thin tone={pct === 100 ? '' : 'blue'} />
      </div>
    </Link>
  )
}

export default function Academy() {
  const profile = useProfile()
  const [cat, setCat] = useState('All')
  const list = ACADEMY.filter((m) => cat === 'All' || m.category === cat)
  const certified = list.filter((m) => m.certificate)
  const quick = list.filter((m) => !m.certificate)

  const certsEarned = Object.keys(profile.certificates || {}).length
  const totalCertifiable = ACADEMY.filter((m) => m.certificate).length

  return (
    <div className="page-enter">
      <div className="main-header row between wrap">
        <div>
          <h1>Skill Academy</h1>
          <p>Comprehensive certified courses and quick-hit reps — lessons, drills, AI practice, and graded quizzes.</p>
        </div>
        <span className="chip gold">🏅 {certsEarned}/{totalCertifiable} certificates earned</span>
      </div>

      <div className="row wrap" style={{ marginBottom: 22 }}>
        {['All', ...ACADEMY_CATEGORIES].map((c) => (
          <button key={c} className={`chip ${cat === c ? 'gold' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      {certified.length > 0 && (
        <>
          <div className="row between wrap" style={{ marginBottom: 14 }}>
            <h2 className="display" style={{ fontSize: 19 }}>🎖 Certified courses</h2>
            <span className="muted" style={{ fontSize: 12.5 }}>Full syllabus · pass the assessment to earn a certificate</span>
          </div>
          <div className="grid grid-3" style={{ marginBottom: 28 }}>
            {certified.map((m, i) => <CourseCard key={m.id} profile={profile} m={m} i={i} />)}
          </div>
        </>
      )}

      {quick.length > 0 && (
        <>
          <div className="row between wrap" style={{ marginBottom: 14 }}>
            <h2 className="display" style={{ fontSize: 19 }}>⚡ Quick courses</h2>
            <span className="muted" style={{ fontSize: 12.5 }}>Short, focused reps · no certificate</span>
          </div>
          <div className="grid grid-3">
            {quick.map((m, i) => <CourseCard key={m.id} profile={profile} m={m} i={i} />)}
          </div>
        </>
      )}
    </div>
  )
}
