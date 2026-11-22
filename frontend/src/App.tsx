import { useState } from 'react'
import { Header } from './components/Header'
import { Intro } from './components/Intro'
import { ResultArea } from './components/ResultArea'
import { StepsStrip } from './components/StepsStrip'
import { UrlInput } from './components/UrlInput'
import { useConversion } from './hooks/useConversion'

export default function App() {
  const [url, setUrl] = useState('')
  const [submittedUrl, setSubmittedUrl] = useState('')
  const { state, start, reset, markDownloaded } = useConversion()

  const busy = state.phase === 'validating' || state.phase === 'processing'

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
      <main className="flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-5xl xl:max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,4fr)_minmax(0,5fr)] md:gap-10 lg:gap-14 short:py-4">
          <Intro />

          <section
            aria-label="Conversor"
            className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04),0_12px_32px_-12px_rgb(15_23_42/0.12)]"
          >
            <div className="p-4 sm:p-5 short:pb-3">
              <UrlInput value={url} onChange={setUrl} onSubmit={handleSubmit} busy={busy} />
            </div>
            <div className="flex min-h-40 flex-col border-t border-slate-100 p-4 sm:p-5 short:min-h-0 short:p-4">
              <ResultArea
                state={state}
                onReset={handleReset}
                onRetry={() => void start(submittedUrl)}
                onDownloaded={markDownloaded}
              />
            </div>
          </section>
        </div>
      </main>

      <StepsStrip />
    </div>
  )
}
