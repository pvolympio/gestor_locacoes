'use client'
// src/components/locacoes/NovaLocacaoModal.tsx
// CORRIGIDO: Validação de datas no frontend — devolução não pode ser
// anterior ou igual à retirada. Feedback imediato sem precisar chamar a API.
import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Search } from 'lucide-react'
import { Modal, Button } from '@/components/ui'
import { useCreateLocacao } from '@/hooks/useLocacoes'
import { useBuscarClientes } from '@/hooks/useClientes'
import { useAcervo } from '@/hooks/useAcervo'
import { ACERVO_STATUS_MAP } from '@/lib/utils'
import type { AcervoItem, Cliente } from '@/types'

const schema = z.object({
  clienteId:      z.string().min(1, 'Selecione um cliente'),
  dataRetirada:   z.string().min(1, 'Informe a data de retirada'),
  dataDevolucao:  z.string().min(1, 'Informe a data de devolução'),
  itens: z.array(z.object({
    acervoId:   z.string().min(1),
    quantidade: z.coerce.number().min(1),
  })).min(1, 'Adicione ao menos 1 item'),
  formaPagamento: z.string().optional(),
  pago:           z.boolean().optional(),
  observacoes:    z.string().optional(),
}).refine(
  // CORRIGIDO: Validação de datas no frontend
  (data) => {
    if (!data.dataRetirada || !data.dataDevolucao) return true
    return new Date(data.dataDevolucao) > new Date(data.dataRetirada)
  },
  {
    message: 'A data de devolução deve ser posterior à data de retirada.',
    path: ['dataDevolucao'],
  }
)

type FormData = z.infer<typeof schema>

export default function NovaLocacaoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [clienteSearch, setClienteSearch]     = useState('')
  const [clienteSelecionado, setClienteSeleo] = useState<Cliente | null>(null)
  const [itemSearch, setItemSearch]           = useState('')
  const [showClienteList, setShowClienteList] = useState(false)
  const [showItemList, setShowItemList]       = useState(false)

  const createLocacao = useCreateLocacao()
  const { data: clientesSugestao } = useBuscarClientes(clienteSearch)
  const { data: acervoData }       = useAcervo({ limit: 100, apenasDisponiveis: true, search: itemSearch || undefined })

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { itens: [], pago: false },
    })

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })
  const dataRetirada = watch('dataRetirada')
  const dataItens    = watch('itens')

  function selecionarCliente(c: Cliente) {
    setClienteSeleo(c)
    setValue('clienteId', c.id)
    setClienteSearch(c.nome)
    setShowClienteList(false)
  }

  function adicionarItem(item: AcervoItem) {
    if (!dataItens.some((i) => i.acervoId === item.id)) {
      append({ acervoId: item.id, quantidade: 1 })
    }
    setShowItemList(false)
    setItemSearch('')
  }

  function getNomeItem(id: string) {
    return acervoData?.data.find((a) => a.id === id)?.nome ?? id
  }

  async function onSubmit(data: FormData) {
    await createLocacao.mutateAsync(data)
    reset()
    setClienteSeleo(null)
    setClienteSearch('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova Locação" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Busca de cliente */}
          <div className="space-y-1.5 relative md:col-span-2">
            <label className="label">Cliente *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                value={clienteSearch}
                onChange={(e) => {
                  setClienteSearch(e.target.value)
                  setShowClienteList(true)
                  if (!e.target.value) { setClienteSeleo(null); setValue('clienteId', '') }
                }}
                onFocus={() => clienteSearch.length >= 2 && setShowClienteList(true)}
                placeholder="Digite o nome do cliente... (mínimo 2 letras)"
                className={`input pl-9 ${errors.clienteId ? 'input-error' : ''}`}
              />
            </div>
            {errors.clienteId && <p className="text-xs text-red-400">{errors.clienteId.message}</p>}
            {/* Feedback para menos de 2 caracteres */}
            {clienteSearch.length === 1 && (
              <p className="text-xs text-[var(--text-muted)]">Digite mais um caractere para buscar...</p>
            )}

            {showClienteList && clientesSugestao && clientesSugestao.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden">
                {clientesSugestao.map((c) => (
                  <button key={c.id} type="button" onClick={() => selecionarCliente(c)}
                    className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{c.nome}</p>
                    {c.telefone && <p className="text-xs text-[var(--text-muted)]">{c.telefone}</p>}
                  </button>
                ))}
              </div>
            )}
            {showClienteList && clienteSearch.length >= 2 && clientesSugestao?.length === 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl p-4 text-center">
                <p className="text-xs text-[var(--text-muted)]">Nenhum cliente encontrado</p>
              </div>
            )}
          </div>

          {/* Data de retirada */}
          <div className="space-y-1.5">
            <label className="label">Data de Retirada *</label>
            <input type="date" className={`input ${errors.dataRetirada ? 'input-error' : ''}`}
              {...register('dataRetirada')} />
            {errors.dataRetirada && <p className="text-xs text-red-400">{errors.dataRetirada.message}</p>}
          </div>

          {/* Data de devolução — bloqueada antes da retirada */}
          <div className="space-y-1.5">
            <label className="label">Data de Devolução *</label>
            <input type="date"
              className={`input ${errors.dataDevolucao ? 'input-error' : ''}`}
              min={dataRetirada ? (() => {
                // Mínimo = dia seguinte à retirada
                const d = new Date(dataRetirada)
                d.setDate(d.getDate() + 1)
                return d.toISOString().split('T')[0]
              })() : undefined}
              {...register('dataDevolucao')}
            />
            {errors.dataDevolucao && <p className="text-xs text-red-400">{errors.dataDevolucao.message}</p>}
          </div>
        </div>

        {/* Itens */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="label">Itens *</label>
            <div className="relative">
              <button type="button" onClick={() => setShowItemList(!showItemList)}
                className="btn-secondary btn-sm">
                <Plus className="w-3.5 h-3.5" /> Adicionar item
              </button>

              {showItemList && (
                <div className="absolute z-50 top-full right-0 mt-1 w-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-[var(--border)]">
                    <input value={itemSearch} onChange={(e) => setItemSearch(e.target.value)}
                      placeholder="Buscar item..." className="input text-xs h-8" autoFocus />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {acervoData?.data.map((item) => {
                      const jaAdicionado = dataItens.some((i) => i.acervoId === item.id)
                      return (
                        <button key={item.id} type="button" onClick={() => adicionarItem(item)}
                          disabled={jaAdicionado}
                          className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-[var(--text-primary)]">{item.nome}</p>
                            <span className="text-xs text-emerald-400">{item.quantidadeAtual} disp.</span>
                          </div>
                        </button>
                      )
                    })}
                    {acervoData?.data.length === 0 && (
                      <p className="text-xs text-[var(--text-muted)] p-4 text-center">Nenhum item disponível</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {(errors.itens as any)?.message && (
            <p className="text-xs text-red-400">{(errors.itens as any).message}</p>
          )}

          {fields.length > 0 ? (
            <div className="border border-[var(--border)] rounded-xl overflow-hidden">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-b-0">
                  <p className="flex-1 text-sm text-[var(--text-primary)]">{getNomeItem(field.acervoId)}</p>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--text-muted)]">Qtd:</label>
                    <input type="number" min={1} className="input w-16 text-center text-sm h-8"
                      {...register(`itens.${idx}.quantidade`)} />
                  </div>
                  <button type="button" onClick={() => remove(idx)} className="btn-ghost p-1.5 text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[var(--border)] rounded-xl p-6 text-center">
              <p className="text-xs text-[var(--text-muted)]">Nenhum item adicionado ainda</p>
            </div>
          )}
        </div>

        {/* Pagamento */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="label">Forma de Pagamento</label>
            <select className="input" {...register('formaPagamento')}>
              <option value="">Selecionar...</option>
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão">Cartão</option>
              <option value="Transferência">Transferência</option>
            </select>
          </div>
          <div className="flex items-end pb-0.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded accent-amber-500" {...register('pago')} />
              <span className="text-sm text-[var(--text-secondary)]">Pagamento realizado</span>
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="label">Observações</label>
          <textarea className="input resize-none" rows={2}
            placeholder="Detalhes do evento, instruções especiais..."
            {...register('observacoes')} />
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-[var(--border)]">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={createLocacao.isPending}>
            Criar Locação
          </Button>
        </div>
      </form>
    </Modal>
  )
}
