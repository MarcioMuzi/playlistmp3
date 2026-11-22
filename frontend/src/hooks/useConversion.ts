import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError, type ErrorBody, type Job, type VideoInfo } from '../lib/api'

export type ProcessingStage = 'extracting' | 'converting'

export type ConversionState =
  | { phase: 'idle' }
  | { phase: 'validating' }
  | { phase: 'processing'; video: VideoInfo; stage: ProcessingStage; progress: number; retrying: boolean }
  | { phase: 'ready'; video: VideoInfo; job: Job }
  | { phase: 'downloaded'; video: VideoInfo; job: Job }
  | { phase: 'error'; video?: VideoInfo; error: ErrorBody }

const POLL_INTERVAL_MS = 1000
const MAX_CONSECUTIVE_POLL_FAILURES = 5

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })

const isAbort = (err: unknown) => err instanceof DOMException && err.name === 'AbortError'

const toErrorBody = (err: unknown): ErrorBody =>
  err instanceof ApiError
    ? { code: err.code, message: err.message }
    : { code: 'UNKNOWN', message: 'Ocorreu um erro inesperado. Tente novamente.' }

export function useConversion() {
  const [state, setState] = useState<ConversionState>({ phase: 'idle' })
  const runRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const pendingJobRef = useRef<string | null>(null) // job no servidor ainda não baixado

  const stopCurrent = useCallback(() => {
    runRef.current += 1
    abortRef.current?.abort()
    abortRef.current = null
    if (pendingJobRef.current) {
      void api.cancel(pendingJobRef.current)
      pendingJobRef.current = null
    }
  }, [])

  const start = useCallback(
    async (url: string) => {
      stopCurrent()
      const run = runRef.current
      const controller = new AbortController()
      abortRef.current = controller
      const alive = () => run === runRef.current

      let video: VideoInfo | undefined
      setState({ phase: 'validating' })

      try {
        video = await api.info(url, controller.signal)
        if (!alive()) return
        setState({ phase: 'processing', video, stage: 'extracting', progress: 0, retrying: false })

        const created = await api.convert(url, controller.signal)
        if (!alive()) return
        pendingJobRef.current = created.id

        let failures = 0
        while (alive()) {
          await sleep(POLL_INTERVAL_MS, controller.signal)
          let job: Job
          try {
            job = await api.job(created.id, controller.signal)
            failures = 0
          } catch (err) {
            if (isAbort(err)) throw err
            if (err instanceof ApiError && err.code === 'NETWORK' && ++failures < MAX_CONSECUTIVE_POLL_FAILURES) continue
            throw err
          }
          if (!alive()) return

          if (job.status === 'ready') {
            setState({ phase: 'ready', video, job })
            return
          }
          if (job.status === 'error') {
            pendingJobRef.current = null
            setState({ phase: 'error', video, error: job.error ?? toErrorBody(null) })
            return
          }
          setState({
            phase: 'processing',
            video,
            stage: job.status === 'converting' ? 'converting' : 'extracting',
            progress: job.progress,
            retrying: job.retrying,
          })
        }
      } catch (err) {
        if (!alive() || isAbort(err)) return
        setState({ phase: 'error', video, error: toErrorBody(err) })
      }
    },
    [stopCurrent],
  )

  const markDownloaded = useCallback(() => {
    pendingJobRef.current = null // o servidor apaga o arquivo após o envio
    setState((s) => (s.phase === 'ready' ? { phase: 'downloaded', video: s.video, job: s.job } : s))
  }, [])

  const reset = useCallback(() => {
    stopCurrent()
    setState({ phase: 'idle' })
  }, [stopCurrent])

  // Ao fechar a aba, descarta no servidor o job não baixado.
  useEffect(() => {
    const onPageHide = () => {
      if (pendingJobRef.current) void api.cancel(pendingJobRef.current)
    }
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [])

  return { state, start, reset, markDownloaded }
}
