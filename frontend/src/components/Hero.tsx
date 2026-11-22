import type { ReactNode } from 'react'

export function Hero({ children }: { children: ReactNode }) {
  return (
    <section className="px-4 pt-14 pb-6 text-center sm:px-6 sm:pt-20">
      <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
        <span className="size-1.5 rounded-full bg-brand-600" aria-hidden />
        MP3 320 kbps · Grátis · Sem cadastro
      </span>

      <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-balance text-ink sm:text-5xl sm:leading-[1.1]">
        Converta vídeos do YouTube para <span className="text-brand-600">MP3</span> em segundos
      </h1>

      <p className="mx-auto mt-4 max-w-2xl text-base text-pretty text-slate-600 sm:text-lg">
        Extraímos o áudio na melhor qualidade disponível e entregamos um MP3 de 320&nbsp;kbps, com título,
        artista e capa. Grátis e sem cadastro.
      </p>

      {children}
    </section>
  )
}
