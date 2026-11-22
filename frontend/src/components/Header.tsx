import { ArrowRight, CirclePlay, EighthNotes, MonitorDown } from 'lucide-react'
import { useInstallPrompt } from '../lib/pwa'

export function Header() {
  const install = useInstallPrompt()

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6 xl:max-w-6xl short:h-12">
        <a href="/" className="flex items-center gap-2 rounded-lg text-[15px] font-semibold tracking-tight text-ink">
          <span className="grid size-7 place-items-center rounded-lg bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-700/30">
            <EighthNotes className="size-4" aria-hidden />
          </span>
          <span>
            Playlist<span className="text-brand-600">MP3</span>
          </span>
        </a>

        <div className="flex items-center gap-2">
          {install && (
            <button
              type="button"
              onClick={() => void install()}
              title="Instalar o PlaylistMP3 como aplicativo neste computador"
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 text-xs font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-100 focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:outline-none"
            >
              <MonitorDown className="size-3.5" aria-hidden />
              Instalar app
            </button>
          )}
          <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700 sm:inline-flex">
            <CirclePlay className="size-3.5 text-rose-500" aria-hidden />
            YouTube
            <ArrowRight className="size-3 text-slate-400" aria-hidden />
            MP3
          </span>
        </div>
      </div>
    </header>
  )
}
