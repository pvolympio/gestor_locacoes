'use client'
// src/app/clientes/[id]/page.tsx
import { use } from 'react'
import Link from 'next/link'
import { useCliente } from '@/hooks/useClientes'
import { useLocacoes } from '@/hooks/useLocacoes'
import {
  ArrowLeft, Phone, Mail, MapPin, FileText,
  ClipboardList, Calendar, TrendingUp, User,
} from 'lucide-react'
import { Badge, Card, Skeleton } from '@/components/ui'
import { formatDate, formatCurrency, getInitials, LOCACAO_STATUS_MAP } from '@/lib/utils'

export default function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: cliente, isLoading: loadingCliente } = useCliente(id)
  const { data: locacoesData, isLoading: loadingLoc } = useLocacoes({
    clienteId: id,
    limit: 50,
    orderBy: 'dataRetirada',
    order: 'desc',
  })

  const locacoes = locacoesData?.data ?? []
  const totalGasto = locacoes
    .filter(l => l.valorFinal)
    .reduce((acc, l) => acc + parseFloat(l.valorFinal!), 0)
  const totalFinalizadas = locacoes.filter(l => l.status === 'FINALIZADA').length
  const temAtrasada = locacoes.some(l => l.status === 'ATRASADA')

  if (loadingCliente) {
    return (
      <div className="space-y-5 animate-fade-in max-w-3xl">
        <Skeleton className="h-8 w-48 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <User className="w-10 h-10 mb-3" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cliente não encontrado.</p>
        <Link href="/clientes" className="mt-4 text-xs" style={{ color: 'var(--accent)' }}>
          ← Voltar
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/clientes">
          <button className="btn-ghost p-1.5 rounded-lg">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent-glow)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              {getInitials(cliente.nome)}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {cliente.nome}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Cliente desde {formatDate(cliente.criadoEm)}
            </p>
          </div>
        </div>
        {temAtrasada && (
          <span className="px-2 py-1 rounded-md text-xs font-medium badge-red">
            ⚠ Locação atrasada
          </span>
        )}
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {loadingLoc ? '—' : locacoes.length}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Total de locações</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {loadingLoc ? '—' : totalFinalizadas}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Finalizadas</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
            {loadingLoc ? '—' : totalGasto > 0 ? formatCurrency(totalGasto) : '—'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Total gasto</p>
        </Card>
      </div>

      {/* Dados do cliente */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <User className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          Dados cadastrais
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cliente.telefone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cliente.telefone}</span>
            </div>
          )}
          {cliente.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{cliente.email}</span>
            </div>
          )}
          {cliente.cpf && (
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cliente.cpf}</span>
            </div>
          )}
          {(cliente.cidade || cliente.endereco) && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {[cliente.endereco, cliente.cidade].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>
        {cliente.observacoes && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Observações</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cliente.observacoes}</p>
          </div>
        )}
      </Card>

      {/* Histórico de locações */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <ClipboardList className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          Histórico de locações
          {!loadingLoc && (
            <span className="ml-auto text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
              {locacoes.length} registro{locacoes.length !== 1 ? 's' : ''}
            </span>
          )}
        </h3>

        {loadingLoc ? (
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex gap-3 items-center p-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-40 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : locacoes.length === 0 ? (
          <div className="py-8 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhuma locação registrada.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {locacoes.map(loc => {
              const st = LOCACAO_STATUS_MAP[loc.status]
              return (
                <Link key={loc.id} href={`/locacoes/${loc.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer"
                    style={{ ':hover': {} } as React.CSSProperties}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <div className="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                      <Calendar className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {loc.itens.map(i => `${i.quantidade}× ${i.acervo.nome}`).join(', ')}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(loc.dataRetirada)} → {formatDate(loc.dataDevolucao)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {loc.valorFinal && (
                        <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                          {formatCurrency(loc.valorFinal)}
                        </span>
                      )}
                      <Badge className={st.badge}>{st.label}</Badge>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
