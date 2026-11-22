import { AudioLines, ShieldCheck, Tags, type LucideIcon } from 'lucide-react'

const SPECS: Array<{ icon: LucideIcon; term: string; value: string }> = [
  { icon: AudioLines, term: 'Qualidade', value: 'MP3 320 kbps (CBR)' },
  { icon: Tags, term: 'Metadados', value: 'Título, artista e capa' },
  { icon: ShieldCheck, term: 'Privacidade', value: 'Sem cadastro e sem histórico' },
]

export function Intro() {
  return (
    <div className="max-w-md">
      <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-brand-700 uppercase short:hidden">
        <span className="h-px w-6 bg-brand-600" aria-hidden />
        Conversor de áudio
      </p>
      <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-balance text-ink sm:text-[2rem]">
        Converta vídeos do YouTube para <span className="text-brand-600">MP3</span>
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-pretty text-slate-600 short:mt-2">
        Cole o link de um vídeo e receba o áudio na melhor qualidade disponível, pronto para ouvir em qualquer lugar.
      </p>

      <dl className="mt-6 hidden space-y-1 md:block short:mt-4">
        {SPECS.map(({ icon: Icon, term, value }) => (
          <div
            key={term}
            className="flex items-center gap-3 rounded-xl px-1 py-1.5 transition-colors hover:bg-white/70 short:py-1"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-brand-100 bg-white text-brand-600 shadow-xs">
              <Icon className="size-4" aria-hidden />
            </span>
            <dt className="w-24 shrink-0 text-sm text-slate-500">{term}</dt>
            <dd className="text-sm font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
