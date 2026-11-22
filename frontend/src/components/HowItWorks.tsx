import { ClipboardPaste, Download, Timer, type LucideIcon } from 'lucide-react'

const STEPS: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: ClipboardPaste, title: 'Cole o link', text: 'Copie o endereço do vídeo no YouTube e cole no campo acima.' },
  { icon: Timer, title: 'Aguarde a conversão', text: 'Extraímos o melhor áudio disponível e convertemos para MP3 320\u00a0kbps.' },
  { icon: Download, title: 'Baixe o MP3', text: 'O download começa na hora e o arquivo é apagado do servidor em seguida.' },
]

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pt-10 pb-8 sm:px-6 sm:pt-6 short:pt-2 short:pb-6" aria-labelledby="how-title">
      <h2 id="how-title" className="text-center text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
        Como funciona
      </h2>
      <ol className="mt-6 short:mt-4 grid gap-6 sm:grid-cols-3 sm:gap-8">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-brand-600 shadow-sm">
              <Icon className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-ink">
                <span className="text-slate-400">{i + 1}.</span> {title}
              </p>
              <p className="mt-1 text-sm text-pretty text-slate-500">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
