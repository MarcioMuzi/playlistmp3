import {
  Ban,
  Check,
  CircleExclamationPoint,
  Download,
  EighthNotes,
  LoaderCircle,
  Lock,
  RotateCcw,
  ShieldCheck,
  Timer,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { ConversionState } from '../hooks/useConversion'
import type { VideoInfo } from '../lib/api'
import { cn, formatBytes, formatDuration } from '../lib/format'

interface ResultAreaProps {
  state: ConversionState
  onReset: () => void
  onRetry: () => void
  onDownloaded: () => void
}

/** Área de resultado dentro do painel: mantém altura estável entre os estados. */
export function ResultArea({ state, onReset, onRetry, onDownloaded }: ResultAreaProps) {
  if (state.phase === 'idle') return <EmptyState />

  const video = 'video' in state ? state.video : undefined

  return (
    <div className="flex animate-fade-in flex-col gap-4" aria-live="polite">
      {video ? <VideoSummary video={video} /> : state.phase === 'validating' && <VideoSkeleton />}

      {(state.phase === 'validating' || state.phase === 'processing') && (
        <ProgressPanel state={state} onCancel={onReset} />
      )}
      {state.phase === 'ready' && (
        <ReadyPanel href={state.job.download_url ?? '#'} size={state.job.size} onDownloaded={onDownloaded} onReset={onReset} />
      )}
      {state.phase === 'downloaded' && <DownloadedPanel onReset={onReset} />}
      {state.phase === 'error' && (
        <ErrorPanel code={state.error.code} message={state.error.message} onRetry={onRetry} onReset={onReset} />
      )}
    </div>
  )
}

/* -------------------------------------------------------------- vazio */

// Alturas fixas: forma de onda decorativa e determinística.
const WAVE = [6, 10, 16, 9, 20, 14, 24, 12, 18, 28, 16, 22, 10, 26, 18, 30, 14, 20, 12, 24, 16, 10, 22, 14, 18, 8, 16, 12, 20, 10, 14, 6]

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-3">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3" aria-hidden>
        <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-700/30">
          <EighthNotes className="size-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="h-2.5 w-2/5 rounded-full bg-slate-300/80" />
            <span className="text-[10px] font-semibold tracking-wide text-slate-500">MP3 · 320 kbps</span>
          </div>
          <div className="flex h-7 items-center gap-[3px] overflow-hidden">
            {[...WAVE, ...WAVE, ...WAVE].map((h, i) => (
              <span key={i} className="w-[3px] shrink-0 rounded-full bg-brand-300" style={{ height: `${h}px` }} />
            ))}
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-slate-600">
        Seu MP3 aparece aqui, <span className="text-slate-500">com capa, título e artista.</span>
      </p>
    </div>
  )
}

/* -------------------------------------------------------------- vídeo */

function VideoSummary({ video }: { video: VideoInfo }) {
  return (
    <div className="flex gap-3">
      <div className="relative aspect-video w-28 shrink-0 short:w-24 self-start overflow-hidden rounded-lg bg-slate-100">
        <img src={video.thumbnail} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
        <span className="absolute right-1 bottom-1 rounded bg-slate-900/80 px-1 py-px text-[10px] font-semibold text-white tabular-nums">
          {formatDuration(video.duration)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="line-clamp-2 text-sm leading-snug font-semibold text-ink" title={video.title}>
          {video.title}
        </h2>
        <p className="mt-0.5 truncate text-xs text-slate-600">
          {[video.uploader, formatDuration(video.duration)].filter(Boolean).join(' · ')}
        </p>
        <p className="mt-1.5 text-xs text-slate-600 tabular-nums">
          MP3 {video.bitrate}&nbsp;kbps
          {video.estimated_size ? ` · ~${formatBytes(video.estimated_size)}` : ''}
        </p>
      </div>
    </div>
  )
}

function VideoSkeleton() {
  return (
    <div className="flex animate-pulse gap-3" aria-hidden>
      <div className="aspect-video w-28 shrink-0 rounded-lg short:w-24 bg-slate-200/70" />
      <div className="flex-1 space-y-2 py-0.5">
        <div className="h-3.5 w-4/5 rounded bg-slate-200/70" />
        <div className="h-3 w-2/5 rounded bg-slate-200/70" />
        <div className="h-3 w-1/4 rounded bg-slate-200/70" />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------- progresso */

const STEPS = ['Validando link', 'Extraindo áudio', 'Convertendo para MP3'] as const

function ProgressPanel({
  state,
  onCancel,
}: {
  state: Extract<ConversionState, { phase: 'validating' | 'processing' }>
  onCancel: () => void
}) {
  const current = state.phase === 'validating' ? 0 : state.stage === 'extracting' ? 1 : 2
  const percent = state.phase === 'processing' && state.stage === 'extracting' ? state.progress : 0
  const determinate = current === 1 && percent > 0
  const caption =
    current === 0
      ? 'Buscando informações do vídeo…'
      : current === 1
        ? determinate
          ? `Extraindo o áudio… ${Math.round(percent)}%`
          : 'Extraindo o áudio…'
        : 'Convertendo e adicionando a capa…'

  return (
    <div>
      <ol className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {STEPS.map((label, i) => {
          const status = i < current ? 'done' : i === current ? 'active' : 'pending'
          return (
            <li key={label} className="flex items-center gap-1.5">
              <span
                className={cn(
                  'grid size-4 place-items-center rounded-full',
                  status === 'done' && 'bg-brand-600 text-white',
                  status === 'active' && 'text-brand-600',
                  status === 'pending' && 'text-slate-400',
                )}
              >
                {status === 'done' ? (
                  <Check className="size-2.5" strokeWidth={3.5} aria-hidden />
                ) : status === 'active' ? (
                  <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <span className="size-1.5 rounded-full bg-current" aria-hidden />
                )}
              </span>
              <span
                className={cn(
                  'font-medium',
                  status === 'pending' ? 'text-slate-500' : status === 'active' ? 'text-brand-700' : 'text-slate-600',
                )}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>

      <div
        className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200/70"
        role="progressbar"
        aria-label={caption}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={determinate ? Math.round(percent) : undefined}
      >
        {determinate ? (
          <div
            className="h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(4, percent)}%` }}
          />
        ) : (
          <div className="absolute inset-y-0 w-2/5 animate-indeterminate rounded-full bg-brand-500/80" />
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-4 text-xs">
        <p className="text-slate-600">{caption}</p>
        <TextButton onClick={onCancel} tone="muted">
          Cancelar
        </TextButton>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------- resultado */

function ReadyPanel({
  href,
  size,
  onDownloaded,
  onReset,
}: {
  href: string
  size: number | null
  onDownloaded: () => void
  onReset: () => void
}) {
  return (
    <div className="flex gap-2">
      <a
        href={href}
        download
        onClick={onDownloaded}
        className="btn-primary inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold"
      >
        <Download className="size-4 shrink-0" aria-hidden />
        Baixar MP3
        {size ? <span className="font-normal text-white/75 tabular-nums">· {formatBytes(size)}</span> : null}
      </a>
      <SecondaryButton onClick={onReset} title="Converter outro vídeo">
        <RotateCcw className="size-4" aria-hidden />
        <span className="hidden sm:inline">Outro vídeo</span>
      </SecondaryButton>
    </div>
  )
}

function DownloadedPanel({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <ShieldCheck className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Download iniciado</p>
          <p className="truncate text-xs text-slate-600">O arquivo já foi removido do servidor.</p>
        </div>
      </div>
      <SecondaryButton onClick={onReset}>
        <RotateCcw className="size-4" aria-hidden />
        Outro vídeo
      </SecondaryButton>
    </div>
  )
}

/* --------------------------------------------------------------- erro */

const ERROR_META: Record<string, { title: string; icon: LucideIcon; retry?: boolean }> = {
  INVALID_URL: { title: 'Link inválido', icon: CircleExclamationPoint },
  PRIVATE: { title: 'Vídeo privado', icon: Lock },
  UNAVAILABLE: { title: 'Vídeo indisponível', icon: Ban },
  AGE_RESTRICTED: { title: 'Vídeo com restrição de idade', icon: Lock },
  MEMBERS_ONLY: { title: 'Conteúdo exclusivo para membros', icon: Lock },
  LIVE: { title: 'Transmissão ao vivo', icon: Ban },
  TOO_LONG: { title: 'Vídeo longo demais', icon: Timer },
  BLOCKED: { title: 'O YouTube recusou a requisição', icon: ShieldCheck, retry: true },
  NETWORK: { title: 'Erro de conexão', icon: WifiOff, retry: true },
  NOT_FOUND: { title: 'Conversão expirada', icon: Timer, retry: true },
  EXPIRED: { title: 'Arquivo expirado', icon: Timer, retry: true },
}
const DEFAULT_ERROR = { title: 'Algo deu errado', icon: CircleExclamationPoint, retry: true }

function ErrorPanel({
  code,
  message,
  onRetry,
  onReset,
}: {
  code: string
  message: string
  onRetry: () => void
  onReset: () => void
}) {
  const meta = ERROR_META[code] ?? DEFAULT_ERROR
  const Icon = meta.icon
  return (
    <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{meta.title}</p>
          <p className="mt-0.5 text-xs text-pretty text-slate-600">{message}</p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-end gap-4 text-xs">
        <TextButton onClick={onReset} tone="muted">
          Converter outro vídeo
        </TextButton>
        {meta.retry && (
          <TextButton onClick={onRetry}>
            <RotateCcw className="size-3.5" aria-hidden />
            Tentar novamente
          </TextButton>
        )}
      </div>
    </div>
  )
}

function SecondaryButton({ onClick, title, children }: { onClick: () => void; title?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-xs transition hover:border-slate-400 hover:bg-slate-50 hover:text-ink focus-visible:ring-4 focus-visible:ring-brand-100 focus-visible:outline-none"
    >
      {children}
    </button>
  )
}

function TextButton({
  onClick,
  children,
  tone = 'brand',
}: {
  onClick: () => void
  children: ReactNode
  tone?: 'brand' | 'muted'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:outline-none',
        tone === 'brand' ? 'text-brand-600 hover:text-brand-700' : 'text-slate-600 hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
