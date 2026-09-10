import { Link } from 'react-router-dom'
import { SectionTitle } from '../components/ui.jsx'

const TIERS = [
  {
    name: 'Free', price: '$0', per: 'forever', cta: 'Start Free', featured: false,
    features: ['3 AI calls per day', '5 starter characters', 'Basic call scores', 'Daily drills', 'Community leaderboard'],
  },
  {
    name: 'Premium', price: '$29', per: 'per month', cta: 'Go Premium', featured: true,
    features: ['Unlimited AI calls', 'All 21+ characters & challenge modes', 'Full 15-skill call reports & replay', 'Whisper coach + AI mentor', 'Scenario Lab (unlimited custom scenarios)', 'Voice analysis & progress analytics', 'All 29 academy modules'],
  },
  {
    name: 'Enterprise', price: 'Custom', per: 'per team', cta: 'Talk to Sales', featured: false,
    features: ['Team dashboards & manager review', 'Company-specific characters & playbooks', 'Custom objection libraries', 'CRM integration', 'SSO & provisioning', 'Performance certificates'],
  },
]

export function PricingCards() {
  return (
    <div className="grid grid-3" style={{ alignItems: 'stretch', paddingTop: 14 }}>
      {TIERS.map((t) => (
        <div key={t.name} className={`card price-card card-hover ${t.featured ? 'featured' : ''}`}>
          {t.featured && <span className="chip gold price-tag">★ Most popular</span>}
          <div>
            <h3 style={{ fontSize: 17, marginBottom: 8 }}>{t.name}</h3>
            <div className="price-value">{t.price} <small>{t.per}</small></div>
          </div>
          <ul className="price-features">
            {t.features.map((f) => <li key={f}>{f}</li>)}
          </ul>
          <Link to="/auth" className={`btn btn-block ${t.featured ? 'btn-gold' : 'btn-ghost'}`} style={{ marginTop: 'auto' }}>{t.cta}</Link>
        </div>
      ))}
    </div>
  )
}

export default function Pricing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)', padding: 'clamp(60px, 8vw, 100px) clamp(18px, 5vw, 56px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <Link to="/" className="btn btn-ghost btn-sm" style={{ marginBottom: 30 }}>← Back</Link>
        <SectionTitle center eyebrow="Pricing" title="Invest in the skill that pays for everything else." sub="Cancel anytime. Your progress stays yours." />
        <PricingCards />
      </div>
    </div>
  )
}
