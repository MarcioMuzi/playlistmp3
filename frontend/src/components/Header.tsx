import { ArrowRight, CirclePlay, EighthNotes } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl xl:max-w-6xl short:h-12 items-center justify-between px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2 rounded-lg text-[15px] font-semibold tracking-tight text-ink">
          <span className="grid size-7 place-items-center rounded-lg bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-700/30">
            <EighthNotes className="size-4" aria-hidden />
          </span>
          <span>
            Playlist<span className="text-brand-600">MP3</span>
          </span>
        </a>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          <CirclePlay className="size-3.5 text-rose-500" aria-hidden />
          YouTube
          <ArrowRight className="size-3 text-slate-400" aria-hidden />
          MP3
        </span>
      </div>
    </header>
  )
}
