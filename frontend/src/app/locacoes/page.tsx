'use client'
// src/app/locacoes/page.tsx
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLocacoes, useFinalizarLocacao, useCancelarLocacao } from '@/hooks/useLocacoes'
import { useDebounce } from '@/hooks/useDebounce'
import { ClipboardList, Plus, Search, CheckCircle, XCircle, Eye, Download } from 'lucide-react'
import { api } from '@/lib/api'
import { Button, Badge, Empty, Pagination, ConfirmDialog, Skeleton } from '@/components/ui'
import { formatDate, LOCACAO_STATUS_MAP } from '@/lib/utils'
import type { LocacaoStatus } from '@/types'
import NovaLocacaoModal from '@/components/locacoes/NovaLocacaoModal'

function LocacoesContent() {
  const searchParams = useSearchParams()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [statusFilter, setStatusFilter] = useState<LocacaoStatus | ''>(
    (searchParams.get('status') as LocacaoStatus) || ''
  )
  const [openNova, setOpenNova] = useState(false)
  const [finalizarId, setFinalizarId] = useState<string | null>(null)
  const [cancelarId, setCancelarId] = useState<string | null>(null)

  const { data, isLoading } = useLocacoes({
    page, limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    orderBy: 'dataRetirada',
    order: 'desc',
  })
  const finalizar = useFinalizarLocacao()
  const cancelar = useCancelarLocacao()

  const STATUS_OPTIONS: { value: LocacaoStatus | ''; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'CONFIRMADA', label: 'Confirmada' },
    { value: 'ATIVA', label: 'Ativa' },
    { value: 'ATRASADA', label: 'Atrasada' },
    { value: 'FINALIZADA', label: 'Finalizada' },
    { value: 'CANCELADA', label: 'Cancelada' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Locações</h2>
          <p className="text-sm text-[var(--text-muted)]">{data?.meta.total ?? '—'} registros</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={async () => {
            const params = new URLSearchParams()
            if (debouncedSearch) params.set('search', debouncedSearch)
            if (statusFilter) params.set('status', statusFilter)
            params.set('limit', '9999')
            const { data } = await api.get(`/locacoes/export?${params}`, { responseType: 'blob' })
            const url = URL.createObjectURL(new Blob([data]))
            const a = document.createElement('a')
            a.href = url
            a.download = `locacoes-${new Date().toISOString().split('T')[0]}.csv`
            a.click()
            URL.revokeObjectURL(url)
          }}>
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </Button>
          <Button variant="primary" onClick={() => setOpenNova(true)}>
            <Plus className="w-4 h-4" /> Nova Locação
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por cliente..." className="input pl-9 h-9 text-xs" />
        </div>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map(opt => (
            <button key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'bg-[var(--accent)] text-black'
                  : 'bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)]'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Itens</th>
              <th>Retirada</th>
              <th>Devolução</th>
              <th>Status</th>
              <th>Pago</th>
              <th className="w-28">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array(8).fill(0).map((_, i) => (
              <tr key={i}>{Array(7).fill(0).map((_, j) => <td key={j}><Skeleton className="h-4 rounded" /></td>)}</tr>
            ))}
            {!isLoading && data?.data.map(loc => {
              const st = LOCACAO_STATUS_MAP[loc.status]
              const canFinalizar = ['CONFIRMADA', 'ATIVA', 'ATRASADA'].includes(loc.status)
              const canCancelar = !['FINALIZADA', 'CANCELADA'].includes(loc.status)
              return (
                <tr key={loc.id}>
                  <td>
                    <div>
                      <p className="font-medium text-[var(--text-primary)] text-sm">{loc.cliente.nome}</p>
                      {loc.cliente.telefone && <p className="text-[10px] text-[var(--text-muted)]">{loc.cliente.telefone}</p>}
                    </div>
                  </td>
                  <td>
                    <p className="text-xs text-[var(--text-secondary)] max-w-[160px] truncate">
                      {loc.itens.map(i => `${i.quantidade}× ${i.acervo.nome}`).join(', ')}
                    </p>
                  </td>
                  <td className="text-sm">{formatDate(loc.dataRetirada)}</td>
                  <td className="text-sm" style={{ color: loc.status === 'ATRASADA' ? 'var(--red)' : undefined }}>
                    {formatDate(loc.dataDevolucao)}
                  </td>
                  <td><Badge className={st.badge}>{st.label}</Badge></td>
                  <td>
                    <span className={`text-xs font-medium ${loc.pago ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                      {loc.pago ? '✓ Pago' : 'Pendente'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link href={`/locacoes/${loc.id}`}>
                        <button className="btn-ghost p-1.5 rounded-md" title="Ver detalhes">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                      {canFinalizar && (
                        <button onClick={() => setFinalizarId(loc.id)} className="btn-ghost p-1.5 rounded-md text-emerald-400" title="Finalizar">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canCancelar && (
                        <button onClick={() => setCancelarId(loc.id)} className="btn-ghost p-1.5 rounded-md text-red-400" title="Cancelar">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!isLoading && !data?.data.length && (
          <Empty
            icon={<ClipboardList className="w-10 h-10" />}
            title="Nenhuma locação encontrada"
            description="Crie uma nova locação para começar"
            action={<Button variant="primary" size="sm" onClick={() => setOpenNova(true)}><Plus className="w-3.5 h-3.5"/>Nova Locação</Button>}
          />
        )}
      </div>

      <Pagination page={page} totalPages={data?.meta.totalPages ?? 1} onPageChange={setPage} />

      {/* Modal nova locação */}
      <NovaLocacaoModal open={openNova} onClose={() => setOpenNova(false)} />

      {/* Confirmar finalizar */}
      <ConfirmDialog
        open={!!finalizarId}
        onClose={() => setFinalizarId(null)}
        onConfirm={async () => { if (finalizarId) { await finalizar.mutateAsync({ id: finalizarId }); setFinalizarId(null) } }}
        title="Finalizar locação"
        description="Confirma a devolução dos itens? Eles serão liberados de volta ao acervo."
        confirmLabel="Finalizar"
        loading={finalizar.isPending}
      />

      {/* Confirmar cancelar */}
      <ConfirmDialog
        open={!!cancelarId}
        onClose={() => setCancelarId(null)}
        onConfirm={async () => { if (cancelarId) { await cancelar.mutateAsync({ id: cancelarId }); setCancelarId(null) } }}
        title="Cancelar locação"
        description="Esta ação não pode ser desfeita. Deseja cancelar esta locação?"
        confirmLabel="Cancelar locação"
        loading={cancelar.isPending}
      />
    </div>
  )
}

export default function LocacoesPage() {
  return <Suspense><LocacoesContent /></Suspense>
}
