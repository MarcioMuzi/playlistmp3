import { AudioLines, ShieldCheck, Tags, type LucideIcon } from 'lucide-react'

const SPECS: Array<{ icon: LucideIcon; term: string; value: string }> = [
  { icon: AudioLines, term: 'Qualidade', value: 'MP3 320 kbps (CBR)' },
  { icon: Tags, term: 'Metadados', value: 'Título, artista e capa' },
  { icon: ShieldCheck, term: 'Privacidade', value: 'Sem cadastro e sem histórico' },
]

export function Intro() {
  return (
    <div className="max-w-md">
      <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-balance text-ink sm:text-3xl">
        Converta vídeos do YouTube para MP3
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-pretty text-slate-600 short:mt-2">
        Cole o link de um vídeo e receba o áudio na melhor qualidade disponível, pronto para ouvir em qualquer lugar.
      </p>

      <dl className="mt-6 hidden divide-y divide-slate-200/70 border-y border-slate-200/70 text-sm md:block short:mt-4">
        {SPECS.map(({ icon: Icon, term, value }) => (
          <div key={term} className="flex items-start gap-3 py-2.5 short:py-2">
            <Icon className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
            <dt className="w-24 shrink-0 text-slate-500">{term}</dt>
            <dd className="font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
