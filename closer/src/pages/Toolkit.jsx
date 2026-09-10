// Toolkit: extra simulators, script generator, playbooks, outreach practice,
// CRM/calendar placeholders, certificates.
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { TOOLKIT_SIMULATORS, PLAYBOOKS, generateScript } from '../data/scenarios.js'
import { Card, Modal } from '../components/ui.jsx'
import { useProfile } from '../components/AppShell.jsx'
import { levelFromXp, rankForLevel } from '../lib/xp.js'

export default function Toolkit() {
  const nav = useNavigate()
  const profile = useProfile()
  const { level } = levelFromXp(profile.xp)
  const rank = rankForLevel(level)

  const [scriptOpen, setScriptOpen] = useState(false)
  const [scriptForm, setScriptForm] = useState({ product: '', audience: '', tone: 'consultative' })
  const [script, setScript] = useState(null)
  const [certOpen, setCertOpen] = useState(false)

  const makeScript = (e) => {
    e.preventDefault()
    setScript(generateScript(scriptForm))
  }

  const emailPractice = {
    subject: 'Quick question about {company}\'s Q3 pipeline',
    body: 'Hi {name},\n\nNoticed {trigger event}. Most {role}s I talk to are fighting {pain} right now.\n\nWe helped {peer company} get {result} in {timeframe}. Worth 15 minutes to see if it maps to you?\n\nEither way, {genuine compliment}.\n\n{your name}',
  }

  return (
    <div className="page-enter">
      <div className="main-header">
        <h1>Toolkit 🧰</h1>
        <p>Beyond cold calls, every high-stakes conversation, plus the assets that support them.</p>
      </div>

      <h3 style={{ fontSize: 15.5, margin: '4px 0 12px' }}>Conversation simulators</h3>
      <div className="grid grid-3" style={{ marginBottom: 26 }}>
        {TOOLKIT_SIMULATORS.map((t, i) => (
          <button key={t.id} className={`card tool-card card-hover anim-up d${(i % 3) + 1}`} onClick={() => nav('/app/simulator', { state: { characterId: t.characterId, scenario: { title: t.name, topic: t.desc.toLowerCase(), openingContext: `${t.name}: ${t.desc}` } } })}>
            <span className="tool-ic">{t.emoji}</span>
            <div>
              <h4>{t.name}</h4>
              <p>{t.desc}</p>
              <span className="chip" style={{ marginTop: 8 }}>{t.tag}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 26 }}>
        <Card className="pad">
          <h3 style={{ fontSize: 15.5, marginBottom: 6 }}>✍️ AI script generator</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>A personalized cold-call script built around your product, audience, and style.</p>
          <button className="btn btn-gold btn-sm" onClick={() => setScriptOpen(true)}>Generate my script</button>
        </Card>
        <Card className="pad">
          <h3 style={{ fontSize: 15.5, marginBottom: 6 }}>📜 Performance certificate</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Certify your current rank, share it with recruiters and managers.</p>
          <button className="btn btn-ghost btn-sm" onClick={() => setCertOpen(true)}>Preview certificate</button>
        </Card>
      </div>

      <h3 style={{ fontSize: 15.5, margin: '4px 0 12px' }}>Industry playbooks</h3>
      <div className="grid grid-3" style={{ marginBottom: 26 }}>
        {PLAYBOOKS.map((p) => (
          <Card key={p.id} className="pad card-hover">
            <div className="row between" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 24 }}>{p.emoji}</span>
              <span className="chip">{p.plays} plays</span>
            </div>
            <h4 style={{ fontSize: 14.5, marginBottom: 4 }}>{p.name}</h4>
            <p className="muted" style={{ fontSize: 12.5 }}>{p.desc}</p>
          </Card>
        ))}
      </div>

      <h3 style={{ fontSize: 15.5, margin: '4px 0 12px' }}>Written outreach practice</h3>
      <div className="grid grid-2" style={{ marginBottom: 26 }}>
        <Card className="pad">
          <span className="chip blue" style={{ marginBottom: 10 }}>📧 Cold email practice</span>
          <p className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>The template elite SDRs iterate from, fill the brackets, cut 30%, send.</p>
          <div style={{ fontSize: 13, background: 'var(--bg-2)', borderRadius: 12, padding: 14, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
            <b style={{ color: 'var(--gold-bright)' }}>Subject: {emailPractice.subject}</b>{'\n\n'}{emailPractice.body}
          </div>
        </Card>
        <Card className="pad">
          <span className="chip blue" style={{ marginBottom: 10 }}>💼 LinkedIn outreach practice</span>
          <p className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>Connection → value → soft ask. Never pitch in the connection request.</p>
          <div className="col" style={{ gap: 10, fontSize: 13 }}>
            <div style={{ background: 'var(--bg-2)', borderRadius: 12, padding: 12 }}><b style={{ fontSize: 11, color: 'var(--gold)' }}>STEP 1 · CONNECT</b><p style={{ marginTop: 4 }}>"Loved your post on {'{topic}'}, the point about {'{detail}'} matched what I'm seeing with clients. Would be glad to connect."</p></div>
            <div style={{ background: 'var(--bg-2)', borderRadius: 12, padding: 12 }}><b style={{ fontSize: 11, color: 'var(--gold)' }}>STEP 2 · VALUE</b><p style={{ marginTop: 4 }}>"That thing you posted about {'{pain}'}, we built a 2-page benchmark on exactly that. Want it? No strings."</p></div>
            <div style={{ background: 'var(--bg-2)', borderRadius: 12, padding: 12 }}><b style={{ fontSize: 11, color: 'var(--gold)' }}>STEP 3 · ASK</b><p style={{ marginTop: 4 }}>"If the benchmark was useful, 15 minutes Thursday to walk through how {'{peer}'} applied it?"</p></div>
          </div>
        </Card>
      </div>

      <h3 style={{ fontSize: 15.5, margin: '4px 0 12px' }}>Workflow integrations</h3>
      <div className="grid grid-4">
        {[
          { name: 'CRM Sync', ic: '🔗', desc: 'Salesforce · HubSpot · Pipedrive', soon: true },
          { name: 'Calendar Booking', ic: '📅', desc: 'Simulated booking flow in calls', soon: false },
          { name: 'Recording History', ic: '🎙️', desc: 'Your call archive with transcripts', soon: false },
          { name: 'Company Training', ic: '🏢', desc: 'Custom characters from your ICP', soon: true },
        ].map((x) => (
          <Card key={x.name} className="pad">
            <div className="row between" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 22 }}>{x.ic}</span>
              {x.soon ? <span className="chip warn">Enterprise</span> : <span className="chip good">Included</span>}
            </div>
            <b style={{ fontSize: 13.5 }}>{x.name}</b>
            <p className="muted" style={{ fontSize: 12, marginTop: 3 }}>{x.desc}</p>
          </Card>
        ))}
      </div>

      <Modal open={scriptOpen} onClose={() => setScriptOpen(false)} width={620}>
        <h2 className="display" style={{ fontSize: 21, marginBottom: 16 }}>AI script generator</h2>
        {!script ? (
          <form onSubmit={makeScript} className="col" style={{ gap: 14 }}>
            <div className="field">
              <label>What are you selling?</label>
              <input className="input" placeholder="e.g. payroll automation software" value={scriptForm.product} onChange={(e) => setScriptForm({ ...scriptForm, product: e.target.value })} />
            </div>
            <div className="field">
              <label>To whom?</label>
              <input className="input" placeholder="e.g. owners of 10–50 person agencies" value={scriptForm.audience} onChange={(e) => setScriptForm({ ...scriptForm, audience: e.target.value })} />
            </div>
            <div className="field">
              <label>Tone</label>
              <select className="select" value={scriptForm.tone} onChange={(e) => setScriptForm({ ...scriptForm, tone: e.target.value })}>
                <option value="consultative">Consultative, calm expert</option>
                <option value="direct">Direct, brisk and outcome-first</option>
                <option value="warm">Warm, friendly and curious</option>
              </select>
            </div>
            <button className="btn btn-gold btn-block" type="submit">⚡ Generate script</button>
          </form>
        ) : (
          <div className="col" style={{ gap: 12 }}>
            {script.map((s) => (
              <div key={s.section}>
                <b style={{ fontSize: 11.5, color: 'var(--gold)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{s.section}</b>
                <p style={{ fontSize: 13.5, marginTop: 4, color: 'var(--ink-1)' }}>{s.text}</p>
              </div>
            ))}
            <div className="row" style={{ gap: 8, marginTop: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setScript(null)}>↻ New script</button>
              <button className="btn btn-gold btn-sm" onClick={() => { setScriptOpen(false); nav('/app/simulator') }}>Practice it live →</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={certOpen} onClose={() => setCertOpen(false)} width={560}>
        <div style={{ border: '1px solid rgba(211,169,78,.5)', borderRadius: 16, padding: '34px 26px', textAlign: 'center', background: 'radial-gradient(100% 100% at 50% 0%, rgba(211,169,78,.12), transparent 70%)' }}>
          <span className="logo-mark" style={{ margin: '0 auto 14px' }}>C</span>
          <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 12 }}>Certificate of Performance</div>
          <h2 className="display" style={{ fontSize: 26, marginBottom: 6 }}>{profile.user.name}</h2>
          <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>has achieved the rank of</p>
          <div style={{ fontSize: 21, marginBottom: 14 }} className="gold-text"><b>{rank.icon} {rank.name} · Level {level}</b></div>
          <p className="muted" style={{ fontSize: 12 }}>
            {profile.calls.length} training calls · {Math.round(profile.calls.reduce((s, c) => s + c.overall, 0) / Math.max(1, profile.calls.length))} avg score · {profile.streak.best}-day best streak
          </p>
          <p className="muted" style={{ fontSize: 11, marginTop: 16 }}>Verified by Closer Training · {new Date().toLocaleDateString()}</p>
        </div>
        <button className="btn btn-gold btn-block" style={{ marginTop: 16 }} onClick={() => window.print()}>🖨 Print / save as PDF</button>
      </Modal>
    </div>
  )
}
