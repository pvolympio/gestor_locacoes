'use client'
// src/components/layout/Topbar.tsx
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Bell, AlertTriangle, X, Clock, ChevronRight } from 'lucide-react'
import { useLocacoesAtrasadas, useDashboardMetricas } from '@/hooks/useDashboard'
import { formatDate } from '@/lib/utils'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/acervo':    'Acervo',
  '/locacoes':  'Locações',
  '/clientes':  'Clientes',
  '/agenda':    'Agenda',
}

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: atrasadas } = useLocacoesAtrasadas()
  const { data: metricas } = useDashboardMetricas()
  const numAtrasadas = atrasadas?.length ?? 0
  const devolucoesHoje = metricas?.alertas.devolucoesHoje ?? 0

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const base  = '/' + pathname.split('/')[1]
  const title = PAGE_TITLES[base] ?? 'Sistema'
  const totalAlertas = numAtrasadas + devolucoesHoje

  return (
    <header
      className="h-14 flex items-center px-4 md:px-6 gap-4 shrink-0"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
    >
      {/* Espaço para o botão hamburguer no mobile */}
      <div className="w-8 md:hidden" />

      <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h1>

      <div className="flex-1" />

      {numAtrasadas > 0 && (
        <a
          href="/locacoes?status=ATRASADA"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171',
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {numAtrasadas} atraso{numAtrasadas > 1 ? 's' : ''}
        </a>
      )}

      {/* Sino com dropdown de alertas */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="relative p-2 rounded-lg transition-colors"
          style={{ color: open ? 'var(--accent)' : 'var(--text-muted)' }}
          title="Alertas"
        >
          <Bell className="w-4 h-4" />
          {totalAlertas > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
          )}
        </button>

        {open && (
          <div
            className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header do dropdown */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Alertas {totalAlertas > 0 && <span className="ml-1 badge badge-red px-1.5">{totalAlertas}</span>}
              </p>
              <button onClick={() => setOpen(false)} className="btn-ghost p-1 rounded-md">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Seção: devoluções hoje */}
            {devolucoesHoje > 0 && (
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <p className="text-xs font-medium text-amber-400">Devoluções hoje</p>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {devolucoesHoje} locação{devolucoesHoje !== 1 ? 'ões' : ''} com devolução prevista para hoje.
                </p>
                <button
                  onClick={() => { router.push('/locacoes?status=ATIVA'); setOpen(false) }}
                  className="mt-2 flex items-center gap-1 text-xs text-amber-400 hover:underline"
                >
                  Ver locações ativas <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Seção: em atraso */}
            {numAtrasadas > 0 ? (
              <div className="px-4 py-3 max-h-60 overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <p className="text-xs font-medium text-red-400">Em atraso</p>
                </div>
                <div className="space-y-2">
                  {atrasadas?.slice(0, 5).map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => { router.push(`/locacoes/${loc.id}`); setOpen(false) }}
                      className="w-full text-left p-2.5 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
                    >
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                        {loc.cliente.nome}
                      </p>
                      <p className="text-[10px] mt-0.5 text-red-400">
                        Venceu em {formatDate(loc.dataDevolucao)}
                      </p>
                    </button>
                  ))}
                  {numAtrasadas > 5 && (
                    <button
                      onClick={() => { router.push('/locacoes?status=ATRASADA'); setOpen(false) }}
                      className="w-full text-xs text-red-400 hover:underline py-1"
                    >
                      + {numAtrasadas - 5} mais
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {totalAlertas === 0 ? '✓ Nenhum alerta no momento' : ''}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
