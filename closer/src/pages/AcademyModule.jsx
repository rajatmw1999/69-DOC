// Module detail: a full course — outcomes, syllabus, lessons, drill,
// interactive quiz, AI practice, and (for certified courses) a certificate.
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getModule } from '../data/academy.js'
import { Card, Meter, EmptyState, Modal, Certificate } from '../components/ui.jsx'
import { updateProfile, awardCertificate } from '../lib/storage.js'
import { useProfile } from '../components/AppShell.jsx'

const PASS_MARK = 60

export default function AcademyModule() {
  const { moduleId } = useParams()
  const nav = useNavigate()
  const mod = getModule(moduleId)
  const profile = useProfile()
  const state = profile.academy[moduleId] || {}

  const [openLesson, setOpenLesson] = useState(null)
  const [quizOpen, setQuizOpen] = useState(false)
  const [qIdx, setQIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [quizDone, setQuizDone] = useState(false)
  const [certOpen, setCertOpen] = useState(false)

  const lessonsDone = state.lessonsDone || []
  const total = mod ? mod.lessons.length + 2 : 1
  const done = lessonsDone.length + (state.drillDone ? 1 : 0) + (state.quizBest != null ? 1 : 0)
  const pct = Math.round((done / total) * 100)
  const passed = state.quizBest != null && state.quizBest >= PASS_MARK
  const complete = pct === 100
  const earnedCert = !!profile.certificates?.[moduleId]

  // Auto-award the certificate the moment a certified course is completed + passed.
  useEffect(() => {
    if (mod?.certificate && complete && passed && !earnedCert) {
      awardCertificate(moduleId, {
        name: profile.user.name, course: mod.name, emoji: mod.emoji,
        level: mod.level, score: state.quizBest, id: mod.id,
      })
      setCertOpen(true)
    }
  }, [mod, complete, passed, earnedCert, moduleId, profile.user.name, state.quizBest])

  if (!mod) {
    return <EmptyState icon="🔍" title="Module not found" action={<Link className="btn btn-gold" to="/app/academy">Back to Academy</Link>} />
  }

  const markLesson = (i) => {
    updateProfile((p) => {
      const s = p.academy[moduleId] || (p.academy[moduleId] = {})
      s.lessonsDone = Array.from(new Set([...(s.lessonsDone || []), i]))
      if (!p.achievements.includes('academy-first')) p.achievements.push('academy-first')
    })
  }

  const markDrill = () => {
    updateProfile((p) => {
      const s = p.academy[moduleId] || (p.academy[moduleId] = {})
      s.drillDone = true
    })
  }

  const answer = (i) => {
    if (picked != null) return
    setPicked(i)
    if (i === mod.quiz[qIdx].answer) setCorrect((c) => c + 1)
    setTimeout(() => {
      if (qIdx + 1 < mod.quiz.length) {
        setQIdx(qIdx + 1)
        setPicked(null)
      } else {
        const isRight = i === mod.quiz[qIdx].answer
        const score = Math.round(((correct + (isRight ? 1 : 0)) / mod.quiz.length) * 100)
        updateProfile((p) => {
          const s = p.academy[moduleId] || (p.academy[moduleId] = {})
          s.quizBest = Math.max(s.quizBest || 0, score)
          if (score === 100 && !p.achievements.includes('perfect-quiz')) p.achievements.push('perfect-quiz')
        })
        setQuizDone(true)
      }
    }, 1300)
  }

  const resetQuiz = () => { setQIdx(0); setPicked(null); setCorrect(0); setQuizDone(false) }

  const syllabus = [
    ...mod.lessons.map((l, i) => ({ label: `Lesson ${i + 1}`, done: lessonsDone.includes(i) })),
    { label: 'Practice drill', done: !!state.drillDone },
    { label: `Assessment${state.quizBest != null ? ` · ${state.quizBest}%` : ''}`, done: state.quizBest != null },
    ...(mod.certificate ? [{ label: 'Certificate', done: earnedCert }] : []),
  ]

  return (
    <div className="page-enter" style={{ maxWidth: 860, margin: '0 auto' }}>
      <Link to="/app/academy" className="btn btn-ghost btn-sm" style={{ marginBottom: 18 }}>← Academy</Link>
      <div className="main-header">
        <div className="row between wrap" style={{ gap: 12 }}>
          <div className="row" style={{ gap: 14, marginBottom: 8 }}>
            <span style={{ fontSize: 40 }}>{mod.emoji}</span>
            <div>
              <h1>{mod.name}</h1>
              <p>{mod.category} · {mod.level} · ~{mod.minutes} min · {mod.lessons.length} lessons</p>
            </div>
          </div>
          <span className={`chip ${mod.certificate ? 'gold' : ''}`}>
            {mod.certificate ? '🎖 Certified course' : '⚡ Quick course'}
          </span>
        </div>
        <p className="sub" style={{ maxWidth: 640 }}>{mod.description}</p>
        <div style={{ maxWidth: 380, marginTop: 12 }}>
          <div className="row between" style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 5 }}>
            <span>Course progress</span><span className="mono">{pct}%</span>
          </div>
          <Meter value={pct} />
        </div>
      </div>

      {/* Certificate banner for certified courses */}
      {mod.certificate && (
        <Card className="pad" style={{ marginBottom: 16, borderColor: earnedCert ? 'rgba(203,162,78,.5)' : 'var(--glass-border)', background: earnedCert ? 'linear-gradient(110deg, var(--gold-soft), transparent 60%), var(--bg-3)' : undefined }}>
          <div className="row between wrap" style={{ gap: 12 }}>
            <div className="row" style={{ gap: 12 }}>
              <span style={{ fontSize: 30 }}>🏅</span>
              <div>
                <b style={{ fontSize: 14.5 }}>{earnedCert ? 'Certificate earned' : 'Earn your certificate'}</b>
                <p className="muted" style={{ fontSize: 12.5, maxWidth: 460 }}>
                  {earnedCert
                    ? `Awarded to ${profile.user.name} — completed with ${profile.certificates[moduleId].score}% on the assessment.`
                    : `Finish every lesson, the drill, and pass the assessment (${PASS_MARK}%+) to receive a personalised certificate of completion.`}
                </p>
              </div>
            </div>
            <button className="btn btn-gold btn-sm" disabled={!earnedCert} onClick={() => setCertOpen(true)}>
              {earnedCert ? 'View certificate →' : 'Locked'}
            </button>
          </div>
        </Card>
      )}

      {/* Outcomes + syllabus */}
      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <Card className="pad">
          <h3 style={{ fontSize: 15.5, marginBottom: 12 }}>🎯 What you'll be able to do</h3>
          <ul className="outcomes-list">
            {mod.outcomes.map((o) => <li key={o}>{o}</li>)}
          </ul>
        </Card>
        <Card className="pad">
          <h3 style={{ fontSize: 15.5, marginBottom: 12 }}>🗂 Syllabus</h3>
          <div className="syllabus">
            {syllabus.map((s, i) => (
              <span key={i} className={`syllabus-item ${s.done ? 'done' : ''}`}>{s.done ? '✓' : '○'} {s.label}</span>
            ))}
          </div>
        </Card>
      </div>

      <Card className="pad" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15.5, marginBottom: 6 }}>📖 Lessons</h3>
        {mod.lessons.map((l, i) => {
          const isDone = lessonsDone.includes(i)
          const isOpen = openLesson === i
          return (
            <div key={l.title} className="lesson-row">
              <span className={`lesson-num ${isDone ? 'done' : ''}`}>{isDone ? '✓' : i + 1}</span>
              <div style={{ flex: 1 }}>
                <button className="row between" style={{ width: '100%', textAlign: 'left' }} onClick={() => setOpenLesson(isOpen ? null : i)}>
                  <h4>{l.title}</h4>
                  <span className="muted">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="anim-in" style={{ marginTop: 8 }}>
                    <p>{l.takeaway}</p>
                    <div className="lesson-points">
                      {l.points.map((pt) => <span key={pt} className="chip">{pt}</span>)}
                    </div>
                    {!isDone && (
                      <button className="btn btn-gold btn-sm" style={{ marginTop: 12 }} onClick={() => markLesson(i)}>✓ Mark complete</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </Card>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <Card className="pad">
          <h3 style={{ fontSize: 15.5, marginBottom: 8 }}>🏋️ Drill {state.drillDone && <span className="chip good" style={{ marginLeft: 6 }}>done</span>}</h3>
          <p className="sub" style={{ fontSize: 13.5, marginBottom: 14 }}>{mod.drill}</p>
          {!state.drillDone
            ? <button className="btn btn-ghost btn-sm" onClick={markDrill}>I did the drill ✓</button>
            : <button className="btn btn-dark btn-sm" onClick={markDrill}>Run it again</button>}
        </Card>
        <Card className="pad">
          <h3 style={{ fontSize: 15.5, marginBottom: 8 }}>📞 AI practice</h3>
          <p className="sub" style={{ fontSize: 13.5, marginBottom: 14 }}>Apply {mod.name.toLowerCase()} in a live call, the coach will score it.</p>
          <button className="btn btn-gold btn-sm" onClick={() => nav('/app/simulator', { state: { characterId: mod.category === 'Executive' ? 'busy-ceo' : mod.category === 'Persuasion' ? 'skeptical-customer' : 'budget-buyer' } })}>
            Start practice call →
          </button>
        </Card>
      </div>

      <Card className="pad">
        <div className="row between" style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 15.5 }}>🧠 Assessment {state.quizBest != null && <span className={`chip ${passed ? 'gold' : 'warn'}`} style={{ marginLeft: 6 }}>best: {state.quizBest}%</span>}</h3>
          {quizOpen && !quizDone && <span className="muted" style={{ fontSize: 12.5 }}>Question {qIdx + 1} / {mod.quiz.length}</span>}
        </div>

        {!quizOpen ? (
          <div className="col" style={{ gap: 8, alignItems: 'flex-start' }}>
            <button className="btn btn-gold" onClick={() => { resetQuiz(); setQuizOpen(true) }}>
              {state.quizBest != null ? 'Retake assessment' : 'Start assessment'} · {mod.quiz.length} questions
            </button>
            {mod.certificate && <span className="muted" style={{ fontSize: 12 }}>Pass mark for the certificate: {PASS_MARK}%</span>}
          </div>
        ) : quizDone ? (
          <div className="anim-scale col" style={{ alignItems: 'flex-start', gap: 10 }}>
            <div style={{ fontSize: 34 }}>{correct === mod.quiz.length ? '🏆' : correct >= mod.quiz.length / 2 ? '💪' : '📚'}</div>
            <h4 style={{ fontSize: 17 }}>You scored {Math.round((correct / mod.quiz.length) * 100)}%</h4>
            <p className="muted" style={{ fontSize: 13 }}>{correct}/{mod.quiz.length} correct{correct === mod.quiz.length ? ', perfect recall.' : '. Review the lessons and go again.'}</p>
            <div className="row wrap" style={{ gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={resetQuiz}>↻ Retake</button>
              {earnedCert && <button className="btn btn-gold btn-sm" onClick={() => setCertOpen(true)}>View certificate →</button>}
              <Link to="/app/academy" className="btn btn-dark btn-sm">Next course →</Link>
            </div>
          </div>
        ) : (
          <div className="anim-in" key={qIdx}>
            <p style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 14 }}>{mod.quiz[qIdx].question}</p>
            {mod.quiz[qIdx].options.map((opt, i) => {
              let cls = ''
              if (picked != null) {
                if (i === mod.quiz[qIdx].answer) cls = 'correct'
                else if (i === picked) cls = 'wrong'
              }
              return (
                <button key={opt} className={`quiz-option ${cls}`} onClick={() => answer(i)} disabled={picked != null}>
                  {opt}
                </button>
              )
            })}
            {picked != null && (
              <p className="anim-in" style={{ fontSize: 13, color: 'var(--gold-bright)', marginTop: 8 }}>
                {picked === mod.quiz[qIdx].answer ? '✓ Correct. ' : '✕ Not quite. '}{mod.quiz[qIdx].why}
              </p>
            )}
          </div>
        )}
      </Card>

      <Modal open={certOpen} onClose={() => setCertOpen(false)} width={720}>
        {earnedCert && (
          <div className="col" style={{ gap: 16, alignItems: 'center' }}>
            <Certificate {...profile.certificates[moduleId]} date={profile.certificates[moduleId].earnedAt} />
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-gold btn-sm" onClick={() => window.print()}>🖨 Print / Save PDF</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setCertOpen(false)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
