'use client'
// src/components/layout/AppShell.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { init } = useAuth()
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    init()
    if (!isAuthenticated()) {
      router.replace('/login')
    } else {
      setPronto(true)
    }
  }, [init, router])

  if (!pronto) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Sidebar — gerencia desktop e mobile internamente */}
      <Sidebar />

      {/* Conteúdo principal */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
