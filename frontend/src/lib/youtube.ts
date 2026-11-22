// Espelho da validação do backend (backend/app/validators.py) para feedback instantâneo.
// A validação definitiva acontece no servidor.

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'])
const SHORT_HOSTS = new Set(['youtu.be', 'www.youtu.be'])

export function extractVideoId(raw: string): string | null {
  let url = raw.trim()
  if (!url || url.length > 2048) return null
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url)) url = `https://${url}`

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null

  const host = parsed.hostname.toLowerCase()
  const path = parsed.pathname
  let candidate: string | null = null

  if (SHORT_HOSTS.has(host)) {
    candidate = path.replace(/^\/+/, '').split('/')[0]
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (path.replace(/\/+$/, '') === '/watch') candidate = parsed.searchParams.get('v')
    else if (path.startsWith('/shorts/')) candidate = path.slice('/shorts/'.length).split('/')[0]
  }

  return candidate && VIDEO_ID.test(candidate) ? candidate : null
}
