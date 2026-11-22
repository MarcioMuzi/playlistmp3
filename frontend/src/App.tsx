import { useState } from 'react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { JobCard } from './components/JobCard'
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
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(60rem_28rem_at_50%_-6rem,var(--color-brand-50),transparent)]">
      <Header />

      <main className="flex-1">
        <Hero>
          <UrlInput value={url} onChange={setUrl} onSubmit={handleSubmit} busy={busy} />
        </Hero>

        {state.phase !== 'idle' && (
          <JobCard
            state={state}
            onReset={handleReset}
            onRetry={() => void start(submittedUrl)}
            onDownloaded={markDownloaded}
          />
        )}

        <HowItWorks />
      </main>

      <footer className="border-t border-slate-200/70 py-6 text-center text-xs text-slate-400">
        <p className="mx-auto max-w-5xl px-4">
          PlaylistMP3 · Converta apenas conteúdos que você tem o direito de baixar.
        </p>
      </footer>
    </div>
  )
}
