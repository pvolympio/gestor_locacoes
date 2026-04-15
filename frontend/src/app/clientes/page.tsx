'use client'
// src/app/clientes/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useClientes, useCreateCliente, useUpdateCliente } from '@/hooks/useClientes'
import { useDebounce } from '@/hooks/useDebounce'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Users, Plus, Search, Pencil, Phone, Mail } from 'lucide-react'
import { Button, Input, Modal, Empty, Pagination, Skeleton, Card } from '@/components/ui'
import { formatDate, getInitials } from '@/lib/utils'
import type { Cliente } from '@/types'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  telefone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  cpf: z.string().optional(),
  cidade: z.string().optional(),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function ClientesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [openForm, setOpenForm] = useState(false)
  const [editCliente, setEditCliente] = useState<Cliente | null>(null)

  const { data, isLoading } = useClientes({ page, limit: 20, search: debouncedSearch || undefined, orderBy: 'nome', order: 'asc' })
  const createMutation = useCreateCliente()
  const updateMutation = useUpdateCliente()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function openCreate() { setEditCliente(null); reset({}); setOpenForm(true) }
  function openEdit(c: Cliente) {
    setEditCliente(c)
    reset({ nome: c.nome, telefone: c.telefone || '', email: c.email || '', cpf: c.cpf || '', cidade: c.cidade || '', endereco: c.endereco || '', observacoes: c.observacoes || '' })
    setOpenForm(true)
  }

  async function onSubmit(data: FormData) {
    if (editCliente) {
      await updateMutation.mutateAsync({ id: editCliente.id, ...data })
    } else {
      await createMutation.mutateAsync(data)
    }
    setOpenForm(false)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Clientes</h2>
          <p className="text-sm text-[var(--text-muted)]">{data?.meta.total ?? '—'} cadastrados</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Novo Cliente
        </Button>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Buscar por nome, telefone, e-mail..." className="input pl-9 h-9 text-xs" />
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && Array(6).fill(0).map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="flex gap-3 items-center">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
          </div>
        ))}

        {!isLoading && data?.data.map(cliente => (
          <Link key={cliente.id} href={`/clientes/${cliente.id}`} className="block group">
            <Card hover className="p-5 h-full">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[var(--accent-glow)] border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-[var(--accent)]">{getInitials(cliente.nome)}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{cliente.nome}</h3>
                    <button
                      onClick={e => { e.preventDefault(); openEdit(cliente) }}
                      className="btn-ghost p-1 rounded-md shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 space-y-1">
                    {cliente.telefone && (
                      <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                        <Phone className="w-3 h-3" /> {cliente.telefone}
                      </p>
                    )}
                    {cliente.email && (
                      <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] truncate">
                        <Mail className="w-3 h-3" /> {cliente.email}
                      </p>
                    )}
                    {cliente.cidade && (
                      <p className="text-xs text-[var(--text-muted)]">📍 {cliente.cidade}</p>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {cliente._count?.locacoes ?? 0} locação{cliente._count?.locacoes !== 1 ? 'ões' : ''}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">desde {formatDate(cliente.criadoEm)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {!isLoading && !data?.data.length && (
        <Empty icon={<Users className="w-10 h-10" />} title="Nenhum cliente encontrado"
          action={<Button variant="primary" size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5"/>Novo Cliente</Button>} />
      )}

      <Pagination page={page} totalPages={data?.meta.totalPages ?? 1} onPageChange={setPage} />

      {/* Modal */}
      <Modal open={openForm} onClose={() => setOpenForm(false)} title={editCliente ? 'Editar Cliente' : 'Novo Cliente'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome completo *" error={errors.nome?.message} {...register('nome')} placeholder="Ana Paula Ferreira" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Telefone / WhatsApp" {...register('telefone')} placeholder="(35) 99999-0000" />
            <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} placeholder="ana@email.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="CPF" {...register('cpf')} placeholder="123.456.789-00" />
            <Input label="Cidade" {...register('cidade')} placeholder="Itajubá" />
          </div>
          <Input label="Endereço" {...register('endereco')} placeholder="Rua das Flores, 100" />
          <div className="space-y-1.5">
            <label className="label">Observações</label>
            <textarea className="input resize-none" rows={2} placeholder="Anotações internas..." {...register('observacoes')} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={createMutation.isPending || updateMutation.isPending}>
              {editCliente ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
