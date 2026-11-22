import { ChevronRight, ClipboardPaste, Download, Timer, type LucideIcon } from 'lucide-react'
import { Fragment } from 'react'

const STEPS: Array<{ icon: LucideIcon; label: string }> = [
  { icon: ClipboardPaste, label: 'Cole o link' },
  { icon: Timer, label: 'Aguarde a conversão' },
  { icon: Download, label: 'Baixe o MP3' },
]

/** Faixa inferior discreta: "Como funciona" em 3 passos + nota legal. */
export function StepsStrip() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/60">
      <div className="mx-auto flex max-w-5xl xl:max-w-6xl flex-col gap-3 px-4 py-3 text-xs sm:px-6 short:py-2 lg:flex-row lg:items-center lg:justify-between">
        <section aria-labelledby="how-title" className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 id="how-title" className="font-semibold tracking-wider text-slate-400 uppercase">
            Como funciona
          </h2>
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
            {STEPS.map(({ icon: Icon, label }, i) => (
              <Fragment key={label}>
                {i > 0 && <ChevronRight className="hidden size-3.5 text-slate-300 sm:block" aria-hidden />}
                <li className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="grid size-6 place-items-center rounded-md border border-slate-200 bg-white text-brand-600">
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  <span>
                    <span className="text-slate-400">{i + 1}.</span> {label}
                  </span>
                </li>
              </Fragment>
            ))}
          </ol>
        </section>
        <p className="text-slate-400">Converta apenas conteúdos que você tem o direito de baixar.</p>
      </div>
    </footer>
  )
}
