import { CircleCheck, CircleExclamationPoint, Info, Link2, LoaderCircle, X } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { cn } from '../lib/format'
import { extractVideoId } from '../lib/youtube'

interface UrlInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (url: string) => void
  busy: boolean
}

export function UrlInput({ value, onChange, onSubmit, busy }: UrlInputProps) {
  const [touched, setTouched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const trimmed = value.trim()
  const isValid = extractVideoId(trimmed) !== null
  const error =
    touched && !busy
      ? !trimmed
        ? 'Cole um link do YouTube para começar.'
        : !isValid
          ? 'Este link não é de um vídeo do YouTube.'
          : null
      : null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (busy || !isValid) return
    onSubmit(trimmed)
  }

  const handleClear = () => {
    onChange('')
    setTouched(false)
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="video-url" className="sr-only">
        Link do vídeo do YouTube
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div
          className={cn(
            'relative flex min-w-0 flex-1 items-center rounded-xl border bg-white shadow-xs transition',
            error
              ? 'border-rose-400 ring-4 ring-rose-100'
              : 'border-slate-300 hover:border-slate-400 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-100 focus-within:hover:border-brand-600',
          )}
        >
          <Link2 className="pointer-events-none absolute left-3 size-4 text-slate-500" aria-hidden />
          <input
            id="video-url"
            ref={inputRef}
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={value}
            disabled={busy}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => trimmed && setTouched(true)}
            onPaste={() => setTouched(true)}
            placeholder="Cole o link do YouTube aqui…"
            aria-invalid={!!error}
            aria-describedby="url-help"
            className="h-11 w-full min-w-0 rounded-xl bg-transparent pr-16 pl-9 text-[15px] text-ink outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:text-slate-500"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            {isValid && !busy && <CircleCheck className="size-4 text-emerald-600" aria-label="Link válido" />}
            {value && !busy && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Limpar campo"
                title="Limpar"
                className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:outline-none"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="btn-primary inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold"
        >
          {busy ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              Convertendo…
            </>
          ) : (
            <span>
              Converter<span className="hidden xl:inline"> para MP3</span>
            </span>
          )}
        </button>
      </div>

      {/* Linha única para ajuda ou erro: não altera a altura do painel. */}
      <p
        id="url-help"
        role={error ? 'alert' : undefined}
        className={cn('mt-2 flex min-h-4 items-center gap-1.5 text-xs', error ? 'text-rose-700' : 'text-slate-500')}
      >
        {error ? (
          <CircleExclamationPoint className="size-3.5 shrink-0" aria-hidden />
        ) : (
          <Info className="size-3.5 shrink-0" aria-hidden />
        )}
        {error ?? 'Aceita links youtube.com, youtu.be e shorts.'}
      </p>
    </form>
  )
}
