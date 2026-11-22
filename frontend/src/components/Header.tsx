import { ArrowRight, CirclePlay, EighthNotes } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2.5 rounded-lg text-lg font-bold tracking-tight text-ink">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
            <EighthNotes className="size-5" aria-hidden />
          </span>
          <span>
            Playlist<span className="text-brand-600">MP3</span>
          </span>
        </a>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
          <CirclePlay className="size-3.5 text-rose-600" aria-hidden />
          YouTube
          <ArrowRight className="size-3 text-slate-400" aria-hidden />
          MP3
        </span>
      </div>
    </header>
  )
}
