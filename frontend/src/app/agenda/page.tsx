'use client'
// src/app/agenda/page.tsx
import { useState } from 'react'
import { useEventosMes, useDeleteEvento, useCreateEvento } from '@/hooks/useAgenda'
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Trash2 } from 'lucide-react'
import { Button, Badge, Empty, ConfirmDialog, Modal, Card } from '@/components/ui'
import { cn, formatDate } from '@/lib/utils'
import type { Evento, EventoTipo } from '@/types'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const TIPO_COLORS: Record<EventoTipo, string> = {
  RETIRADA:  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  DEVOLUCAO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  RESERVA:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  LEMBRETE:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  OUTRO:     'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
}

const TIPO_LABELS: Record<EventoTipo, string> = {
  RETIRADA:  '📦 Retirada',
  DEVOLUCAO: '🔄 Devolução',
  RESERVA:   '🔒 Reserva',
  LEMBRETE:  '🔔 Lembrete',
  OUTRO:     '📌 Outro',
}

export default function AgendaPage() {
  const today = new Date()
  const [ano, setAno] = useState(today.getFullYear())
  const [mes, setMes] = useState(today.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [openNovoEvento, setOpenNovoEvento] = useState(false)

  const { data: eventos, isLoading } = useEventosMes(ano, mes)
  const deleteEvento = useDeleteEvento()
  const createEvento = useCreateEvento()

  const [novoTitulo, setNovoTitulo] = useState('')
  const [novoTipo, setNovoTipo] = useState<EventoTipo>('LEMBRETE')
  const [novaData, setNovaData] = useState<string>('')

  function navMes(dir: number) {
    let m = mes + dir, a = ano
    if (m > 12) { m = 1; a++ }
    if (m < 1)  { m = 12; a-- }
    setMes(m); setAno(a); setSelectedDate(null)
  }

  // Gera os dias do calendário
  function getDias() {
    const primeiro = new Date(ano, mes - 1, 1)
    const ultimo = new Date(ano, mes, 0)
    const dias: (Date | null)[] = []
    // Dias vazios no início
    for (let i = 0; i < primeiro.getDay(); i++) dias.push(null)
    for (let d = 1; d <= ultimo.getDate(); d++) dias.push(new Date(ano, mes - 1, d))
    return dias
  }

  function getEventosDia(date: Date): Evento[] {
    if (!eventos) return []
    const dateStr = date.toISOString().split('T')[0]
    return eventos.filter(e => {
      const inicio = e.dataInicio.split('T')[0]
      const fim = e.dataFim?.split('T')[0] ?? inicio
      return dateStr >= inicio && dateStr <= fim
    })
  }

  const eventosNoDia = selectedDate
    ? eventos?.filter(e => {
        const ds = selectedDate
        const inicio = e.dataInicio.split('T')[0]
        const fim = e.dataFim?.split('T')[0] ?? inicio
        return ds >= inicio && ds <= fim
      }) ?? []
    : []

  const nomeMes = new Date(ano, mes - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const dias = getDias()

  async function criarEvento() {
    const dataFinal = novaData || selectedDate
    if (!novoTitulo || !dataFinal) return
    await createEvento.mutateAsync({
      titulo: novoTitulo,
      dataInicio: dataFinal + 'T12:00:00.000Z',
      tipo: novoTipo,
      diaInteiro: true,
    })
    setNovoTitulo('')
    setNovaData('')
    setOpenNovoEvento(false)
  }

  function abrirModalEvento() {
    // Pré-preenche com data selecionada, mas permite alterar
    setNovaData(selectedDate ?? '')
    setOpenNovoEvento(true)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Agenda</h2>
          <p className="text-sm text-[var(--text-muted)] capitalize">{nomeMes}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navMes(-1)}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="secondary" size="sm" onClick={() => { setAno(today.getFullYear()); setMes(today.getMonth() + 1) }}>Hoje</Button>
          <Button variant="secondary" size="sm" onClick={() => navMes(1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendário */}
        <Card className="lg:col-span-2 p-5">
          {/* Header dias da semana */}
          <div className="grid grid-cols-7 mb-2">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-[var(--text-muted)] py-2">{d}</div>
            ))}
          </div>

          {/* Dias */}
          <div className="grid grid-cols-7 gap-1">
            {dias.map((dia, idx) => {
              if (!dia) return <div key={idx} />
              const isToday = dia.toDateString() === today.toDateString()
              const dateStr = dia.toISOString().split('T')[0]
              const isSelected = selectedDate === dateStr
              const eventosNesteDia = getEventosDia(dia)

              return (
                <button key={idx} onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={cn(
                    'relative flex flex-col items-center p-1.5 rounded-xl min-h-[52px] text-xs transition-all',
                    isSelected ? 'bg-[var(--accent)] text-black' :
                    isToday ? 'bg-[var(--accent-glow)] text-[var(--accent)] border border-[var(--accent)]/30' :
                    'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                  )}>
                  <span className={cn('font-medium', isSelected ? 'text-black' : isToday ? 'text-[var(--accent)]' : '')}>
                    {dia.getDate()}
                  </span>
                  {/* Dots de eventos */}
                  {eventosNesteDia.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {eventosNesteDia.slice(0, 3).map((e, i) => (
                        <span key={i} className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          isSelected ? 'bg-black/40' :
                          e.tipo === 'RETIRADA' ? 'bg-emerald-400' :
                          e.tipo === 'DEVOLUCAO' ? 'bg-amber-400' : 'bg-purple-400'
                        )} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--border)]">
            {Object.entries(TIPO_LABELS).slice(0, 3).map(([tipo, label]) => (
              <div key={tipo} className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                <span className={cn('w-2 h-2 rounded-full',
                  tipo === 'RETIRADA' ? 'bg-emerald-400' :
                  tipo === 'DEVOLUCAO' ? 'bg-amber-400' : 'bg-purple-400'
                )} />
                {label.split(' ')[1]}
              </div>
            ))}
          </div>
        </Card>

        {/* Painel lateral — eventos do dia */}
        <Card className="p-5">
          {selectedDate ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">{eventosNoDia.length} evento{eventosNoDia.length !== 1 ? 's' : ''}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={abrirModalEvento}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="space-y-2">
                {eventosNoDia.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-xs text-[var(--text-muted)]">Nenhum evento neste dia</p>
                    <button onClick={abrirModalEvento} className="text-xs text-[var(--accent)] mt-2 hover:underline">
                      + Criar evento
                    </button>
                  </div>
                )}
                {eventosNoDia.map(evento => (
                  <div key={evento.id} className={cn('p-3 rounded-lg border text-xs', TIPO_COLORS[evento.tipo])}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{evento.titulo}</p>
                        {evento.locacao && (
                          <p className="opacity-70 mt-0.5">Cliente: {evento.locacao.cliente.nome}</p>
                        )}
                      </div>
                      <button onClick={() => setDeleteId(evento.id)} className="opacity-50 hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="mt-1 opacity-60">{TIPO_LABELS[evento.tipo]}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="w-10 h-10 text-[var(--text-muted)] opacity-30 mb-3" />
              <p className="text-sm text-[var(--text-muted)]">Selecione um dia</p>
              <p className="text-xs text-[var(--text-muted)] mt-1 opacity-60">para ver os eventos</p>
            </div>
          )}
        </Card>
      </div>

      {/* Modal novo evento */}
      <Modal open={openNovoEvento} onClose={() => setOpenNovoEvento(false)} title="Novo Evento" size="sm">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="label">Título *</label>
            <input className="input" value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} placeholder="Descrição do evento" autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="label">Data *</label>
            <input
              type="date"
              className="input"
              value={novaData}
              onChange={e => setNovaData(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="label">Tipo</label>
            <select className="input" value={novoTipo} onChange={e => setNovoTipo(e.target.value as EventoTipo)}>
              {Object.entries(TIPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setOpenNovoEvento(false)}>Cancelar</Button>
            <Button variant="primary" onClick={criarEvento} loading={createEvento.isPending} disabled={!novoTitulo || !novaData}>Criar</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) { await deleteEvento.mutateAsync(deleteId); setDeleteId(null) } }}
        title="Remover evento"
        description="Este evento será removido permanentemente da agenda."
        confirmLabel="Remover"
        loading={deleteEvento.isPending}
      />
    </div>
  )
}
