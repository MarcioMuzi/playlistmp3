import { useEffect, useState } from 'react'

/** Registra o service worker só no build de produção (no dev atrapalharia o HMR). */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`/sw.js?v=${__BUILD_ID__}`).catch(() => {
      /* sem service worker o app funciona normalmente, só não fica disponível offline */
    })
  })
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const isStandalone = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches

/**
 * Expõe o prompt de instalação do navegador (Chrome/Edge). Retorna null quando a
 * instalação não está disponível: navegador sem suporte, já instalado ou já aberto como app.
 */
export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (isStandalone()) return
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setPromptEvent(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!promptEvent) return null
  return async () => {
    await promptEvent.prompt()
    await promptEvent.userChoice
    setPromptEvent(null)
  }
}
