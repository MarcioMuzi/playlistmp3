import {
  Ban,
  Check,
  CircleCheck,
  CircleExclamationPoint,
  Clock,
  Download,
  HardDrive,
  LoaderCircle,
  Lock,
  RotateCcw,
  ShieldCheck,
  Timer,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'
import type { ConversionState } from '../hooks/useConversion'
import type { VideoInfo } from '../lib/api'
import { cn, formatBytes, formatDuration } from '../lib/format'

interface JobCardProps {
  state: Exclude<ConversionState, { phase: 'idle' }>
  onReset: () => void
  onRetry: () => void
  onDownloaded: () => void
}

export function JobCard({ state, onReset, onRetry, onDownloaded }: JobCardProps) {
  const video = 'video' in state ? state.video : undefined

  return (
    <section aria-live="polite" className="mx-auto mt-2 max-w-3xl animate-fade-in px-4 text-left sm:px-0">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {video ? <VideoSummary video={video} /> : state.phase === 'validating' && <VideoSkeleton />}
        <div className={cn('p-4 sm:p-5', (video || state.phase === 'validating') && 'border-t border-slate-100')}>
          {(state.phase === 'validating' || state.phase === 'processing') && (
            <ProgressPanel state={state} onCancel={onReset} />
          )}
          {state.phase === 'ready' && (
            <ReadyPanel
              href={state.job.download_url ?? '#'}
              size={state.job.size}
              bitrate={state.video.bitrate}
              onDownloaded={onDownloaded}
              onReset={onReset}
            />
          )}
          {state.phase === 'downloaded' && <DownloadedPanel onReset={onReset} />}
          {state.phase === 'error' && (
            <ErrorPanel code={state.error.code} message={state.error.message} onRetry={onRetry} onReset={onReset} />
          )}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- vídeo */

function VideoSummary({ video }: { video: VideoInfo }) {
  return (
    <div className="flex gap-4 p-4 sm:p-5">
      <div className="relative aspect-video w-32 shrink-0 self-start overflow-hidden rounded-xl bg-slate-100 sm:w-44">
        <img
          src={video.thumbnail}
          alt=""
          className="size-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <span className="absolute right-1.5 bottom-1.5 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[11px] font-semibold text-white tabular-nums">
          {formatDuration(video.duration)}
        </span>
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <h2 className="line-clamp-2 font-semibold text-ink sm:text-lg sm:leading-snug" title={video.title}>
          {video.title}
        </h2>
        {video.uploader && <p className="mt-1 truncate text-sm text-slate-500">{video.uploader}</p>}
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
          <Chip icon={Clock}>{formatDuration(video.duration)}</Chip>
          {video.estimated_size && <Chip icon={HardDrive}>~{formatBytes(video.estimated_size)}</Chip>}
          <Chip>MP3 · {video.bitrate} kbps</Chip>
        </div>
      </div>
    </div>
  )
}

function Chip({ icon: Icon, children }: { icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 tabular-nums">
      {Icon && <Icon className="size-3.5 text-slate-400" aria-hidden />}
      {children}
    </span>
  )
}

function VideoSkeleton() {
  return (
    <div className="flex animate-pulse gap-4 p-4 sm:p-5" aria-hidden>
      <div className="aspect-video w-32 shrink-0 self-start rounded-xl bg-slate-100 sm:w-44" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-4 w-4/5 rounded bg-slate-100" />
        <div className="h-3 w-2/5 rounded bg-slate-100" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-16 rounded-lg bg-slate-100" />
          <div className="h-6 w-20 rounded-lg bg-slate-100" />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ progresso */

const STEPS = [
  { key: 'validating', label: 'Validando link' },
  { key: 'extracting', label: 'Extraindo áudio' },
  { key: 'converting', label: 'Convertendo para MP3' },
] as const

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
      ? 'Validando o link e buscando informações do vídeo…'
      : current === 1
        ? determinate
          ? `Extraindo o áudio… ${Math.round(percent)}%`
          : 'Extraindo o áudio…'
        : 'Convertendo para MP3 e adicionando a capa…'

  return (
    <div>
      <ol className="grid gap-3 sm:grid-cols-3 sm:gap-2">
        {STEPS.map((step, i) => {
          const status = i < current ? 'done' : i === current ? 'active' : 'pending'
          return (
            <li key={step.key} className="flex items-center gap-2.5 text-sm">
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full border transition',
                  status === 'done' && 'border-brand-600 bg-brand-600 text-white',
                  status === 'active' && 'border-brand-200 bg-brand-50 text-brand-600',
                  status === 'pending' && 'border-slate-200 bg-white text-slate-300',
                )}
              >
                {status === 'done' ? (
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                ) : status === 'active' ? (
                  <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <span className="size-1.5 rounded-full bg-current" aria-hidden />
                )}
              </span>
              <span
                className={cn(
                  'font-medium',
                  status === 'pending' ? 'text-slate-400' : 'text-ink',
                  status === 'active' && 'text-brand-700',
                )}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>

      <div
        className="relative mt-5 h-2 overflow-hidden rounded-full bg-slate-100"
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

      <div className="mt-3 flex items-center justify-between gap-4 text-sm">
        <p className="text-slate-500">{caption}</p>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-md font-medium text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:outline-none"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ resultado */

function ReadyPanel({
  href,
  size,
  bitrate,
  onDownloaded,
  onReset,
}: {
  href: string
  size: number | null
  bitrate: number
  onDownloaded: () => void
  onReset: () => void
}) {
  return (
    <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CircleCheck className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-semibold text-ink">Seu MP3 está pronto!</p>
          <p className="text-sm text-slate-500">
            {formatBytes(size)} · {bitrate} kbps · com capa e tags
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 sm:items-end">
        <a
          href={href}
          download
          onClick={onDownloaded}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-200 focus-visible:outline-none active:scale-[0.99] sm:w-auto"
        >
          <Download className="size-5" aria-hidden />
          Baixar MP3{size ? ` (${formatBytes(size)})` : ''}
        </a>
        <LinkButton onClick={onReset}>Converter outro vídeo</LinkButton>
      </div>
    </div>
  )
}

function DownloadedPanel({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-semibold text-ink">Download iniciado</p>
          <p className="text-sm text-slate-500">O arquivo já foi removido do servidor.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 font-semibold text-ink transition hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-brand-100 focus-visible:outline-none"
      >
        <RotateCcw className="size-4" aria-hidden />
        Converter outro vídeo
      </button>
    </div>
  )
}

/* ----------------------------------------------------------------- erro */

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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">
          <Icon className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-semibold text-ink">{meta.title}</p>
          <p className="text-sm text-pretty text-slate-500">{message}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-3">
        {meta.retry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-200 focus-visible:outline-none"
          >
            <RotateCcw className="size-4" aria-hidden />
            Tentar novamente
          </button>
        )}
        <LinkButton onClick={onReset}>Converter outro vídeo</LinkButton>
      </div>
    </div>
  )
}

function LinkButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md text-sm font-medium text-brand-600 underline-offset-4 hover:text-brand-700 hover:underline focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:outline-none"
    >
      {children}
    </button>
  )
}
