import { CircleCheck, CircleExclamationPoint, ClipboardPaste, Link2, LoaderCircle, X } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { cn } from '../lib/format'
import { extractVideoId } from '../lib/youtube'

interface UrlInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (url: string) => void
  busy: boolean
}

const canReadClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard?.readText

const iconButton =
  'grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:outline-none'

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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        onChange(text.trim())
        setTouched(true)
      }
    } catch {
      /* permissão negada: o usuário ainda pode usar Ctrl+V */
    }
    inputRef.current?.focus()
  }

  const handleClear = () => {
    onChange('')
    setTouched(false)
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor="video-url" className="text-sm font-medium text-ink">
          Link do vídeo
        </label>
        <span className="truncate text-xs text-slate-400">youtube.com · youtu.be · shorts</span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div
          className={cn(
            'relative flex min-w-0 flex-1 items-center rounded-xl border bg-slate-50/70 transition focus-within:bg-white',
            error
              ? 'border-rose-300 ring-4 ring-rose-100'
              : 'border-slate-200 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100',
          )}
        >
          <Link2 className="pointer-events-none absolute left-3 size-4 text-slate-400" aria-hidden />
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
            aria-describedby="url-error"
            className="h-11 w-full min-w-0 rounded-xl bg-transparent pr-20 pl-9 text-[15px] text-ink outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-500"
          />
          <div className="absolute right-1.5 flex items-center gap-0.5">
            {isValid && !busy && <CircleCheck className="mr-1 size-4 text-emerald-500" aria-label="Link válido" />}
            {value && !busy ? (
              <button type="button" onClick={handleClear} aria-label="Limpar campo" title="Limpar" className={iconButton}>
                <X className="size-4" />
              </button>
            ) : (
              !value &&
              canReadClipboard && (
                <button
                  type="button"
                  onClick={handlePaste}
                  aria-label="Colar da área de transferência"
                  title="Colar"
                  className={iconButton}
                >
                  <ClipboardPaste className="size-4" />
                </button>
              )
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-200 focus-visible:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {busy ? (
            'Convertendo…'
          ) : (
            <span>
              Converter<span className="hidden xl:inline"> para MP3</span>
            </span>
          )}
        </button>
      </div>

      <p id="url-error" role="alert" className="mt-1.5 flex min-h-4 items-center gap-1.5 text-xs text-rose-600">
        {error && (
          <>
            <CircleExclamationPoint className="size-3.5 shrink-0" aria-hidden />
            {error}
          </>
        )}
      </p>
    </form>
  )
}
