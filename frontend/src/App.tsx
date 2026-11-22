import { useState } from 'react'
import { ConverterCard } from './components/ConverterCard'
import { Header } from './components/Header'
import { Intro } from './components/Intro'
import { StepsStrip } from './components/StepsStrip'
import { useConversion } from './hooks/useConversion'

export default function App() {
  const [url, setUrl] = useState('')
  const [submittedUrl, setSubmittedUrl] = useState('')
  const { state, start, reset, markDownloaded } = useConversion()

  const handleSubmit = (value: string) => {
    setSubmittedUrl(value)
    void start(value)
  }

  const handleReset = () => {
    reset()
    setUrl('')
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      {/* Conteúdo centralizado no espaço livre: cabe sem rolagem mesmo em telas baixas. */}
      <main className="relative isolate flex flex-1 items-center overflow-hidden">
        <Backdrop />
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-8 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,4fr)_minmax(0,5fr)] md:gap-10 lg:gap-14 xl:max-w-6xl short:py-4">
          <Intro />
          <ConverterCard
            url={url}
            onUrlChange={setUrl}
            onSubmit={handleSubmit}
            state={state}
            onReset={handleReset}
            onRetry={() => void start(submittedUrl)}
            onDownloaded={markDownloaded}
          />
        </div>
      </main>

      <StepsStrip />
    </div>
  )
}

/** Fundo decorativo: grade de pontos esmaecida + brilho índigo suave. */
function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(var(--color-slate-300)_1px,transparent_1px)] mask-[radial-gradient(ellipse_70%_70%_at_60%_50%,black,transparent)] bg-size-[22px_22px] opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(40rem_24rem_at_15%_0%,var(--color-brand-50),transparent_70%)]" />
    </div>
  )
}
