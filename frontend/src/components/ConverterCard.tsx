import { AudioLines } from 'lucide-react'
import type { ConversionState } from '../hooks/useConversion'
import { cn } from '../lib/format'
import { ResultArea } from './ResultArea'
import { UrlInput } from './UrlInput'

interface ConverterCardProps {
  url: string
  onUrlChange: (value: string) => void
  onSubmit: (url: string) => void
  state: ConversionState
  onReset: () => void
  onRetry: () => void
  onDownloaded: () => void
}

export function ConverterCard({ url, onUrlChange, onSubmit, state, onReset, onRetry, onDownloaded }: ConverterCardProps) {
  const busy = state.phase === 'validating' || state.phase === 'processing'

  return (
    <div className="relative">
      {/* brilho índigo atrás do painel */}
      <div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-brand-200/45 blur-3xl"
        aria-hidden
      />
      <section
        aria-label="Conversor"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.06),0_20px_40px_-16px_rgb(49_46_129/0.25)]"
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50 px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <AudioLines className="size-4" aria-hidden />
            </span>
            <h2 className="text-sm font-semibold text-ink">Converter vídeo</h2>
          </div>
          <StatusPill state={state} />
        </header>

        <div className="px-4 pt-4 pb-3 sm:px-5">
          <UrlInput value={url} onChange={onUrlChange} onSubmit={onSubmit} busy={busy} />
        </div>

        <div className="flex min-h-40 flex-col border-t border-slate-100 p-4 sm:px-5 short:min-h-0">
          <ResultArea state={state} onReset={onReset} onRetry={onRetry} onDownloaded={onDownloaded} />
        </div>
      </section>
    </div>
  )
}

const STATUS: Record<ConversionState['phase'], { label: string; tone: 'idle' | 'busy' | 'ok' | 'error' }> = {
  idle: { label: 'Aguardando link', tone: 'idle' },
  validating: { label: 'Validando', tone: 'busy' },
  processing: { label: 'Convertendo', tone: 'busy' },
  ready: { label: 'Pronto', tone: 'ok' },
  downloaded: { label: 'Baixado', tone: 'ok' },
  error: { label: 'Falhou', tone: 'error' },
}

function StatusPill({ state }: { state: ConversionState }) {
  const { label, tone } = STATUS[state.phase]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tone === 'idle' && 'border-slate-200 bg-white text-slate-600',
        tone === 'busy' && 'border-brand-200 bg-brand-50 text-brand-700',
        tone === 'ok' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        tone === 'error' && 'border-rose-200 bg-rose-50 text-rose-700',
      )}
    >
      <span className="relative flex size-1.5">
        {tone === 'busy' && <span className="absolute inset-0 animate-ping rounded-full bg-brand-500 opacity-70" />}
        <span
          className={cn(
            'relative size-1.5 rounded-full',
            tone === 'idle' && 'bg-slate-400',
            tone === 'busy' && 'bg-brand-600',
            tone === 'ok' && 'bg-emerald-500',
            tone === 'error' && 'bg-rose-500',
          )}
        />
      </span>
      {label}
    </span>
  )
}
