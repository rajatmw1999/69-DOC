// Brand mark helpers. The gold cursive "C" glyph is drawn by the .logo-mark
// CSS (styles/app.css) so it stays consistent everywhere.
export function LogoMark({ size = 34 }) {
  const s = size <= 30
  return <span className={`logo-mark${s ? ' sm' : ''}`} style={s ? { width: size, height: size } : undefined}>C</span>
}

export function Wordmark({ size = 34 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <LogoMark size={size} />
      <b style={{ fontSize: size * 0.5, letterSpacing: '.01em', fontFamily: 'var(--font-display)', fontWeight: 700 }}>Closer</b>
    </span>
  )
}
