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
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 text-xs sm:px-6 short:py-2 lg:flex-row lg:items-center lg:justify-between xl:max-w-6xl">
        <section aria-labelledby="how-title" className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 id="how-title" className="font-semibold tracking-wider text-slate-500 uppercase">
            Como funciona
          </h2>
          <ol className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
            {STEPS.map(({ icon: Icon, label }, i) => (
              <Fragment key={label}>
                {i > 0 && <ChevronRight className="hidden size-3.5 text-slate-400 sm:block" aria-hidden />}
                <li className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="relative grid size-6 place-items-center rounded-md bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <Icon className="size-3.5" aria-hidden />
                    <span className="absolute -top-1.5 -right-1.5 grid size-3.5 place-items-center rounded-full bg-brand-600 text-[9px] leading-none font-bold text-white ring-2 ring-white">
                      {i + 1}
                    </span>
                  </span>
                  {label}
                </li>
              </Fragment>
            ))}
          </ol>
        </section>
        <p className="text-slate-500">Converta apenas conteúdos que você tem o direito de baixar.</p>
      </div>
    </footer>
  )
}
