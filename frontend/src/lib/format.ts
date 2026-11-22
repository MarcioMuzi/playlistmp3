export function formatDuration(totalSeconds: number | null | undefined): string {
  if (!totalSeconds || totalSeconds < 0) return '0:00'
  const s = Math.round(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

const mbFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '—'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${mbFormatter.format(bytes / (1024 * 1024))} MB`
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
