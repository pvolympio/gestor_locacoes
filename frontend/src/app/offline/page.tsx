'use client'
// src/app/offline/page.tsx
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6"
         style={{ background: 'var(--bg-primary)' }}>

      <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
           style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <WifiOff className="w-9 h-9" style={{ color: 'var(--accent)' }} />
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Sem conexão
        </h1>
        <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
          Você está offline. Algumas informações salvas em cache ainda podem estar disponíveis.
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
        style={{
          background: 'var(--accent)',
          color: 'white',
        }}
      >
        <RefreshCw className="w-4 h-4" />
        Tentar novamente
      </button>

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
        Ao reconectar, o app sincronizará automaticamente.
      </p>
    </div>
  )
}
