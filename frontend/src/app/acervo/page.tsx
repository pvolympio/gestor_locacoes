'use client'
// src/app/acervo/page.tsx
import { useState, useRef } from 'react'
import Image from 'next/image'
import { useAcervo, useCategorias, useCreateAcervo, useUpdateAcervo, useDeleteAcervo } from '@/hooks/useAcervo'
import { useDebounce } from '@/hooks/useDebounce'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, Plus, Search, Pencil, Trash2, ImagePlus, X } from 'lucide-react'
import { Button, Input, Modal, Badge, Empty, Pagination, ConfirmDialog, Skeleton } from '@/components/ui'
import { ACERVO_STATUS_MAP } from '@/lib/utils'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import type { AcervoItem, AcervoStatus } from '@/types'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  descricao: z.string().optional(),
  categoriaId: z.string().optional(),
  quantidadeTotal: z.coerce.number().min(0),
  codigoInterno: z.string().optional(),
  observacoes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function AcervoPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [statusFilter, setStatusFilter] = useState<AcervoStatus | ''>('')
  const [categoriaFilter, setCategoriaFilter] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [editItem, setEditItem] = useState<AcervoItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Upload de imagem
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useAcervo({
    page, limit: 20, search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    categoriaId: categoriaFilter || undefined,
  })
  const { data: categorias } = useCategorias()
  const createMutation = useCreateAcervo()
  const updateMutation = useUpdateAcervo()
  const deleteMutation = useDeleteAcervo()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function openCreate() {
    setEditItem(null)
    setImagePreview(null)
    setImageFile(null)
    reset({})
    setOpenForm(true)
  }

  function openEdit(item: AcervoItem) {
    setEditItem(item)
    setImagePreview(item.imagemUrl ? `${BACKEND_URL}${item.imagemUrl}` : null)
    setImageFile(null)
    reset({
      nome: item.nome,
      descricao: item.descricao || '',
      categoriaId: item.categoriaId || '',
      quantidadeTotal: item.quantidadeTotal,
      codigoInterno: item.codigoInterno || '',
      observacoes: item.observacoes || '',
    })
    setOpenForm(true)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function onSubmit(formData: FormData) {
    let savedId: string

    if (editItem) {
      const updated = await updateMutation.mutateAsync({ id: editItem.id, ...formData })
      savedId = (updated as AcervoItem)?.id ?? editItem.id
    } else {
      const created = await createMutation.mutateAsync(formData)
      savedId = (created as AcervoItem)?.id
    }

    // Faz upload da imagem se uma nova foi selecionada
    if (imageFile && savedId) {
      setUploadingId(savedId)
      try {
        const fd = new FormData()
        fd.append('file', imageFile)
        await api.patch(`/acervo/${savedId}/imagem`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        qc.invalidateQueries({ queryKey: ['acervo'] })
        toast.success('Imagem salva!')
      } catch {
        toast.error('Erro ao enviar imagem.')
      } finally {
        setUploadingId(null)
      }
    }

    setOpenForm(false)
  }

  async function handleRemoveImage() {
    if (!editItem) { setImagePreview(null); setImageFile(null); return }
    try {
      await api.delete(`/acervo/${editItem.id}/imagem`)
      setImagePreview(null)
      setImageFile(null)
      qc.invalidateQueries({ queryKey: ['acervo'] })
      toast.success('Imagem removida.')
    } catch {
      toast.error('Erro ao remover imagem.')
    }
  }

  const categoryOptions = [
    { value: '', label: 'Todas' },
    ...(categorias?.map(c => ({ value: c.id, label: c.nome })) ?? [])
  ]
  const statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'DISPONIVEL', label: 'Disponível' },
    { value: 'PARCIALMENTE', label: 'Parcial' },
    { value: 'ALUGADO', label: 'Alugado' },
    { value: 'INATIVO', label: 'Inativo' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Acervo</h2>
          <p className="text-sm text-[var(--text-muted)]">{data?.meta.total ?? '—'} itens cadastrados</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Novo Item
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar item..."
            className="input pl-9 h-9 text-xs"
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as AcervoStatus | ''); setPage(1) }} className="input h-9 text-xs w-44">
          {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={categoriaFilter} onChange={e => { setCategoriaFilter(e.target.value); setPage(1) }} className="input h-9 text-xs w-44">
          {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th className="w-12" />
              <th>Item</th>
              <th>Categoria</th>
              <th>Qtd. Total</th>
              <th>Disponível</th>
              <th>Status</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {isLoading && Array(8).fill(0).map((_, i) => (
              <tr key={i}>
                {Array(7).fill(0).map((_, j) => (
                  <td key={j}><Skeleton className="h-4 w-full rounded" /></td>
                ))}
              </tr>
            ))}
            {!isLoading && data?.data.map(item => {
              const s = ACERVO_STATUS_MAP[item.status]
              const imgUrl = item.imagemUrl ? `${BACKEND_URL}${item.imagemUrl}` : null
              return (
                <tr key={item.id}>
                  {/* Miniatura */}
                  <td>
                    {imgUrl ? (
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-[var(--border)] shrink-0">
                        <Image src={imgUrl} alt={item.nome} fill sizes="36px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg border border-[var(--border)] flex items-center justify-center bg-[var(--bg-hover)] shrink-0">
                        <Package className="w-4 h-4 text-[var(--text-muted)] opacity-40" />
                      </div>
                    )}
                  </td>
                  <td>
                    <div>
                      <p className="font-medium text-[var(--text-primary)] text-sm">{item.nome}</p>
                      {item.codigoInterno && <p className="text-[10px] text-[var(--text-muted)] font-mono">{item.codigoInterno}</p>}
                    </div>
                  </td>
                  <td>
                    <span className="text-xs">
                      {item.categoria ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: item.categoria.cor || '#6b7280' }} />
                          {item.categoria.nome}
                        </span>
                      ) : '—'}
                    </span>
                  </td>
                  <td className="text-sm">{item.quantidadeTotal}</td>
                  <td className="text-sm font-medium" style={{ color: item.quantidadeAtual > 0 ? 'var(--green)' : 'var(--red)' }}>
                    {item.quantidadeAtual}
                  </td>
                  <td>
                    <Badge className={s.badge}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(item)} className="btn-ghost p-1.5 rounded-md">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(item.id)} className="btn-ghost p-1.5 rounded-md text-red-400 hover:text-red-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!isLoading && !data?.data.length && (
          <Empty icon={<Package className="w-10 h-10" />} title="Nenhum item encontrado" description="Tente outro filtro ou adicione um novo item" action={<Button variant="primary" size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5"/>Novo Item</Button>} />
        )}
      </div>

      <Pagination page={page} totalPages={data?.meta.totalPages ?? 1} onPageChange={setPage} />

      {/* Modal form */}
      <Modal open={openForm} onClose={() => setOpenForm(false)} title={editItem ? 'Editar Item' : 'Novo Item'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Upload de imagem */}
          <div className="space-y-1.5">
            <label className="label">Foto do item</label>
            <div className="flex items-center gap-3">
              {/* Preview */}
              <div
                className="relative w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0 cursor-pointer transition-colors"
                style={{ borderColor: imagePreview ? 'var(--accent)' : 'var(--border)', background: 'var(--bg-hover)' }}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <Image src={imagePreview} alt="Preview" fill sizes="80px" className="object-cover" />
                ) : (
                  <ImagePlus className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={onFileChange}
                />
                <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus className="w-3.5 h-3.5" />
                  {imagePreview ? 'Trocar foto' : 'Selecionar foto'}
                </Button>
                {imagePreview && (
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveImage}>
                    <X className="w-3.5 h-3.5" /> Remover
                  </Button>
                )}
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>JPG, PNG, WEBP ou GIF · máx. 5 MB</p>
              </div>
            </div>
          </div>

          <Input label="Nome do item *" error={errors.nome?.message} {...register('nome')} placeholder="Ex: Trio de Cilindros" />
          <Input label="Descrição" {...register('descricao')} placeholder="Detalhes do item..." />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="label">Categoria</label>
              <select className="input" {...register('categoriaId')}>
                <option value="">Sem categoria</option>
                {categorias?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <Input label="Quantidade total *" type="number" min={0} error={errors.quantidadeTotal?.message} {...register('quantidadeTotal')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Código interno" {...register('codigoInterno')} placeholder="Ex: TRIO-001" />
          </div>
          <Input label="Observações" {...register('observacoes')} placeholder="Notas internas..." />
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={createMutation.isPending || updateMutation.isPending || !!uploadingId}>
              {editItem ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null) } }}
        title="Remover item"
        description="Este item será desativado e não aparecerá mais no acervo. Locações existentes não serão afetadas."
        confirmLabel="Remover"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
