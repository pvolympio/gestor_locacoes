'use client'
// src/app/locacoes/[id]/page.tsx
import { use } from 'react'
import Link from 'next/link'
import { useLocacao, useFinalizarLocacao, useCancelarLocacao } from '@/hooks/useLocacoes'
import { ArrowLeft, CheckCircle, XCircle, Phone, Calendar, Package } from 'lucide-react'
import { Button, Badge, Card, ConfirmDialog, Skeleton } from '@/components/ui'
import { formatDate, formatDateTime, LOCACAO_STATUS_MAP, ACERVO_STATUS_MAP } from '@/lib/utils'
import { useState } from 'react'

export default function LocacaoDetailPage({ params }: { params: { id: string } }) {
  const { data: loc, isLoading } = useLocacao(params.id)
  const finalizar = useFinalizarLocacao()
  const cancelar = useCancelarLocacao()
  const [confirmarFinalizar, setConfirmarFinalizar] = useState(false)
  const [confirmarCancelar, setConfirmarCancelar] = useState(false)

  if (isLoading) return (
    <div className="space-y-4 animate-fade-in">
      <Skeleton className="h-8 w-48 rounded" />
      <div className="grid grid-cols-3 gap-4">
        {Array(3).fill(0).map((_,i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    </div>
  )

  if (!loc) return <p className="text-[var(--text-muted)]">Locação não encontrada.</p>

  const st = LOCACAO_STATUS_MAP[loc.status]
  const canFinalizar = ['CONFIRMADA', 'ATIVA', 'ATRASADA'].includes(loc.status)
  const canCancelar = !['FINALIZADA', 'CANCELADA'].includes(loc.status)

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/locacoes">
          <button className="btn-ghost p-1.5 rounded-lg"><ArrowLeft className="w-4 h-4" /></button>
        </Link>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{loc.cliente.nome}</h2>
          <p className="text-xs text-[var(--text-muted)]">Criada em {formatDateTime(loc.criadoEm)}</p>
        </div>
        <Badge className={st.badge}>{st.label}</Badge>
        <div className="flex gap-2">
          {canFinalizar && <Button variant="secondary" size="sm" onClick={() => setConfirmarFinalizar(true)}><CheckCircle className="w-3.5 h-3.5 text-emerald-400" />Finalizar</Button>}
          {canCancelar && <Button variant="danger" size="sm" onClick={() => setConfirmarCancelar(true)}><XCircle className="w-3.5 h-3.5" />Cancelar</Button>}
        </div>
      </div>

      {/* Cards de info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Cliente</p>
          <p className="font-semibold text-[var(--text-primary)]">{loc.cliente.nome}</p>
          {loc.cliente.telefone && (
            <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-1">
              <Phone className="w-3 h-3" />{loc.cliente.telefone}
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Período</p>
          <p className="font-semibold text-[var(--text-primary)]">{formatDate(loc.dataRetirada)}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">até {formatDate(loc.dataDevolucao)}</p>
          {loc.dataDevolvido && <p className="text-xs text-emerald-400 mt-1">✓ Devolvido em {formatDate(loc.dataDevolvido)}</p>}
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Pagamento</p>
          <p className={`font-semibold ${loc.pago ? 'text-emerald-400' : 'text-[var(--text-secondary)]'}`}>
            {loc.pago ? '✓ Pago' : 'Pendente'}
          </p>
          {loc.formaPagamento && <p className="text-xs text-[var(--text-muted)] mt-0.5">{loc.formaPagamento}</p>}
          {loc.valorFinal && <p className="text-sm font-bold text-[var(--accent)] mt-1">R$ {parseFloat(loc.valorFinal).toFixed(2)}</p>}
        </Card>
      </div>

      {/* Itens */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-[var(--text-muted)]" /> Itens da Locação
        </h3>
        <div className="space-y-2">
          {loc.itens.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-hover)]">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center">
                <span className="text-xs font-bold text-[var(--accent)]">{item.quantidade}</span>
              </div>
              <p className="flex-1 text-sm text-[var(--text-primary)]">{item.acervo.nome}</p>
              <span className="text-xs text-[var(--text-muted)]">×{item.quantidade}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Observações */}
      {loc.observacoes && (
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Observações</p>
          <p className="text-sm text-[var(--text-secondary)]">{loc.observacoes}</p>
        </Card>
      )}

      <ConfirmDialog open={confirmarFinalizar} onClose={() => setConfirmarFinalizar(false)}
        onConfirm={async () => { await finalizar.mutateAsync({ id: loc.id }); setConfirmarFinalizar(false) }}
        title="Finalizar locação" description="Confirma a devolução? Os itens serão liberados ao acervo."
        confirmLabel="Finalizar" loading={finalizar.isPending} />

      <ConfirmDialog open={confirmarCancelar} onClose={() => setConfirmarCancelar(false)}
        onConfirm={async () => { await cancelar.mutateAsync({ id: loc.id }); setConfirmarCancelar(false) }}
        title="Cancelar locação" description="Deseja cancelar esta locação?" confirmLabel="Cancelar locação" loading={cancelar.isPending} />
    </div>
  )
}
