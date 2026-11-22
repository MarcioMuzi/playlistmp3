export interface VideoInfo {
  video_id: string
  title: string
  uploader: string
  duration: number
  thumbnail: string
  estimated_size: number | null
  bitrate: number
}

export type JobStatus = 'queued' | 'extracting' | 'converting' | 'ready' | 'error' | 'downloaded'

export interface ErrorBody {
  code: string
  message: string
}

export interface Job {
  id: string
  status: JobStatus
  progress: number
  video: VideoInfo
  size: number | null
  /** Nova tentativa em andamento (motivo não exposto). */
  retrying: boolean
  download_url: string | null
  error: ErrorBody | null
}

export class ApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

const SERVER_DOWN =
  'O PlaylistMP3 não está respondendo. Verifique se o Docker Desktop está aberto e rode "docker compose up -d" na pasta do projeto.'

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError('NETWORK', SERVER_DOWN)
  }

  if (!res.ok) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      // O nginx responde, mas o backend está fora (iniciando ou parado).
      const text = await res.text().catch(() => '')
      if (!text.trim().startsWith('{')) throw new ApiError('NETWORK', SERVER_DOWN)
      const body = JSON.parse(text) as Partial<ErrorBody>
      throw new ApiError(body.code ?? 'UNKNOWN', body.message ?? `Erro inesperado no servidor (HTTP ${res.status}).`)
    }
    let body: Partial<ErrorBody> = {}
    try {
      body = await res.json()
    } catch {
      /* resposta sem JSON (ex.: proxy fora do ar) */
    }
    throw new ApiError(body.code ?? 'UNKNOWN', body.message ?? `Erro inesperado no servidor (HTTP ${res.status}).`)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  info: (url: string, signal?: AbortSignal) =>
    request<VideoInfo>('/api/info', { method: 'POST', body: JSON.stringify({ url }), signal }),

  convert: (url: string, signal?: AbortSignal) =>
    request<Job>('/api/convert', { method: 'POST', body: JSON.stringify({ url }), signal }),

  job: (id: string, signal?: AbortSignal) => request<Job>(`/api/jobs/${encodeURIComponent(id)}`, { signal }),

  /** Cancela/descarta um job. `keepalive` permite enviar mesmo ao fechar a aba. */
  cancel: (id: string) =>
    fetch(`/api/jobs/${encodeURIComponent(id)}`, { method: 'DELETE', keepalive: true }).catch(() => undefined),
}
