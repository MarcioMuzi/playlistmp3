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
          ? 'Este link não parece ser de um vídeo do YouTube (youtube.com/watch, youtu.be ou shorts).'
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
    <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-3xl text-left" noValidate>
      <div
        className={cn(
          'flex flex-col gap-2 rounded-2xl border bg-white p-2 shadow-xl shadow-slate-900/5 transition sm:flex-row',
          error
            ? 'border-rose-300 ring-4 ring-rose-100'
            : 'border-slate-200 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100',
        )}
      >
        <div className="relative flex min-w-0 flex-1 items-center">
          <Link2 className="pointer-events-none absolute left-3.5 size-5 text-slate-400" aria-hidden />
          <input
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
            placeholder="Cole o link do vídeo do YouTube aqui..."
            aria-label="Link do vídeo do YouTube"
            aria-invalid={!!error}
            aria-describedby={error ? 'url-error' : undefined}
            className="h-12 w-full rounded-xl bg-transparent pr-28 pl-11 text-base text-ink outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-500"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            {isValid && !busy && <CircleCheck className="size-5 text-emerald-500" aria-label="Link válido" />}
            {value && !busy ? (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Limpar campo"
                className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:outline-none"
              >
                <X className="size-4" />
              </button>
            ) : (
              !value &&
              canReadClipboard && (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:outline-none"
                >
                  <ClipboardPaste className="size-4" aria-hidden />
                  Colar
                </button>
              )
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-200 focus-visible:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
          {busy ? 'Convertendo…' : 'Converter para MP3'}
        </button>
      </div>

      <p id="url-error" role="alert" className="mt-2 flex min-h-5 items-center gap-1.5 px-2 text-sm text-rose-600">
        {error && (
          <>
            <CircleExclamationPoint className="size-4 shrink-0" aria-hidden />
            {error}
          </>
        )}
      </p>
    </form>
  )
}
