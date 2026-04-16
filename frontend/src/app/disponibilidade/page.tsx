'use client'
// src/app/disponibilidade/page.tsx
import { useState, useMemo } from 'react'
import { Card, Button } from '@/components/ui'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useCalendarioDisponibilidade } from '@/hooks/useDisponibilidade'
import { useCategorias } from '@/hooks/useAcervo'
import { cn } from '@/lib/utils'

function getDaysArray(start: Date, end: Date) {
  const arr: Date[] = []
  const dt = new Date(start)
  while (dt <= end) {
    arr.push(new Date(dt))
    dt.setDate(dt.getDate() + 1)
  }
  return arr
}

export default function DisponibilidadePage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const [dataInicio, setDataInicio] = useState<Date>(() => {
    const d = new Date(today)
    d.setDate(d.getDate() - d.getDay()) // Início da semana (Domingo)
    return d
  })
  const [dataFim, setDataFim] = useState<Date>(() => {
    const d = new Date(today)
    d.setDate(d.getDate() - d.getDay() + 14) // 2 semanas pra frente
    return d
  })
  
  const [categoriaId, setCategoriaId] = useState('')
  const [search, setSearch] = useState('')

  const strInicio = dataInicio.toISOString().split('T')[0]
  const strFim = dataFim.toISOString().split('T')[0]

  const { data: categorias } = useCategorias()
  const { data: itens, isLoading } = useCalendarioDisponibilidade(strInicio, strFim, categoriaId || undefined)

  function navSemanas(dir: number) {
    setDataInicio(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + (dir * 7))
      return d
    })
    setDataFim(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + (dir * 7))
      return d
    })
  }

  const dias = useMemo(() => getDaysArray(dataInicio, dataFim), [dataInicio, dataFim])

  const diasDaSemanaBase = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const filteredItens = useMemo(() => {
    if (!itens) return []
    if (!search) return itens
    const lower = search.toLowerCase()
    return itens.filter(i => i.nome.toLowerCase().includes(lower))
  }, [itens, search])

  return (
    <div className="space-y-5 animate-fade-in flex flex-col h-[calc(100vh-6rem)]">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Disponibilidade do Acervo</h2>
          <p className="text-sm text-[var(--text-muted)]">Acompanhe seus itens dia a dia</p>
        </div>
        
        {/* Controles: Navegação de Semanas */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navSemanas(-1)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          <Button variant="secondary" size="sm" onClick={() => {
              const d = new Date(today); d.setDate(d.getDate() - d.getDay()); setDataInicio(d);
              const f = new Date(d); f.setDate(f.getDate() + 14); setDataFim(f);
          }}>
            Hoje
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navSemanas(1)}>
            Próxima <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* FILTROS E LEGENDA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)]">
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              type="text"
              placeholder="Buscar item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9 w-full"
            />
          </div>
          <select 
            className="input w-full sm:w-48"
            value={categoriaId}
            onChange={e => setCategoriaId(e.target.value)}
          >
            <option value="">Todas Categorias</option>
            {categorias?.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        {/* Legenda de cores */}
        <div className="flex items-center gap-4 text-xs font-medium bg-[var(--bg-secondary)] px-4 py-2 rounded-lg border border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span> Livre
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></span> Parcial
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></span> Esgotado
          </div>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 p-0 custom-scrollbar">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-[var(--text-muted)]">Carregando calendário...</div>
          ) : filteredItens.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--text-muted)]">Nenhum item encontrado.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-20" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th className="sticky left-0 z-30 px-3 py-3 font-semibold text-[var(--text-secondary)] min-w-[200px]" 
                      style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
                    Item
                  </th>
                  {dias.map((dia, idx) => {
                     const isToday = dia.toDateString() === today.toDateString();
                     const strDate = dia.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit'})
                     return (
                      <th key={idx} className={cn(
                        "px-1 py-2 text-center min-w-[50px] font-medium border-r border-[var(--border)]",
                        isToday ? "text-[var(--accent)] font-bold bg-[var(--accent-glow)]" : "text-[var(--text-muted)]"
                      )}>
                        <div className="text-[10px] uppercase opacity-70 mb-0.5">{diasDaSemanaBase[dia.getDay()]}</div>
                        <div>{strDate}</div>
                      </th>
                     )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredItens.map(item => (
                  <tr key={item.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="sticky left-0 max-w-[200px] z-10 px-3 py-2 font-medium truncate" 
                        style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}
                        title={item.nome}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.cor }}></span>
                        <span className="truncate text-[var(--text-primary)]">{item.nome}</span>
                      </div>
                    </td>
                    {dias.map(dia => {
                      const strDia = dia.toISOString().split('T')[0]
                      const disp = item.doPeriodo.find(d => d.data === strDia)
                      const qtDisp = disp?.disponivel ?? item.quantidadeTotal
                      
                      let colorClass = 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' // FULL
                      if (qtDisp === 0) colorClass = 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/20' // EMPTY
                      else if (qtDisp < item.quantidadeTotal) colorClass = 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20' // PARTIAL

                      return (
                        <td key={strDia} className="px-1 py-1 relative group border-r border-[var(--border)]">
                          <div className={cn("mx-1 h-7 rounded-sm border flex items-center justify-center font-medium", colorClass)}>
                            {qtDisp}
                          </div>
                          
                          {/* Tooltip */}
                          {disp && disp.locacoes.length > 0 && (
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none 
                                            bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 w-max max-w-[200px] 
                                            bg-[var(--bg-popover)] border border-[var(--border)] shadow-xl rounded-lg p-2 text-left">
                               <p className="text-[10px] font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Locado para:</p>
                               <div className="space-y-1">
                                 {disp.locacoes.map((l, i) => (
                                   <div key={i} className="flex justify-between items-center gap-3">
                                      <span className="truncate text-[var(--text-primary)]">{l.cliente}</span>
                                      <span className="text-[var(--accent)] shrink-0 px-1.5 py-0.5 rounded bg-[var(--accent-glow)] font-medium">-{l.quantidade}</span>
                                   </div>
                                 ))}
                               </div>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
