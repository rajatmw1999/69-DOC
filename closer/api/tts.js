// Vercel serverless TTS proxy.
// Holds the ElevenLabs key server-side so EVERY visitor gets studio voices on
// any browser, without the key ever reaching the client.
//
// Setup:  vercel env add ELEVENLABS_API_KEY   (then redeploy)
// Without the env var the endpoint reports "not configured" and the app
// falls back to browser voices automatically.

const MAX_TEXT = 400
const VOICE_ID_RX = /^[A-Za-z0-9]{12,32}$/
const RATE_LIMIT = 40 // requests per IP per minute (per warm instance)
const hits = new Map()

function rateLimited(ip) {
  const now = Date.now()
  const h = hits.get(ip) || { n: 0, t: now }
  if (now - h.t > 60_000) { h.n = 0; h.t = now }
  h.n += 1
  hits.set(ip, h)
  if (hits.size > 5000) hits.clear() // crude memory cap
  return h.n > RATE_LIMIT
}

export default async function handler(req, res) {
  const configured = Boolean(process.env.ELEVENLABS_API_KEY)

  // GET = capability probe for the client
  if (req.method === 'GET') {
    return res.status(200).json({ configured })
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method-not-allowed' })
  }
  if (!configured) {
    return res.status(501).json({ error: 'tts-not-configured' })
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'rate-limited' })
  }

  const { text, voiceId, voiceSettings } = req.body || {}
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT) {
    return res.status(400).json({ error: 'bad-text' })
  }
  if (typeof voiceId !== 'string' || !VOICE_ID_RX.test(voiceId)) {
    return res.status(400).json({ error: 'bad-voice' })
  }
  // Whitelist + clamp tuning values so the endpoint can't be abused
  const clamp = (v, lo, hi, dflt) => (typeof v === 'number' && v >= lo && v <= hi ? v : dflt)
  const vs = voiceSettings || {}
  const settings = {
    stability: clamp(vs.stability, 0, 1, 0.45),
    similarity_boost: clamp(vs.similarity_boost, 0, 1, 0.85),
    style: clamp(vs.style, 0, 1, 0.3),
    speed: clamp(vs.speed, 0.8, 1.2, 1),
  }

  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, model_id: 'eleven_turbo_v2_5', voice_settings: settings }),
    },
  )
  if (!upstream.ok) {
    return res.status(502).json({ error: `upstream-${upstream.status}` })
  }
  const audio = Buffer.from(await upstream.arrayBuffer())
  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(audio)
}
