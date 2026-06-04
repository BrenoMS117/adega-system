import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (needRefresh) {
      toast('Nova versão disponível!', {
        description: 'Clique para atualizar o sistema.',
        action: { label: 'Atualizar', onClick: () => updateServiceWorker(true) },
        duration: Infinity,
      })
    }
  }, [needRefresh, updateServiceWorker])

  return null
}
