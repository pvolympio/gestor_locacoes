// src/hooks/useAcervo.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getErrorMessage } from '@/lib/api'
import { buildQueryString } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { AcervoItem, Categoria, PaginatedResult, ApiResponse } from '@/types'

export function useAcervo(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['acervo', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResult<AcervoItem>>>(
        `/acervo${buildQueryString(params)}`
      )
      return data.data
    },
  })
}

export function useAcervoItem(id: string) {
  return useQuery({
    queryKey: ['acervo-item', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AcervoItem>>(`/acervo/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Categoria[]>>('/acervo/categorias')
      return data.data
    },
    staleTime: 1000 * 60 * 10, // cache 10min
  })
}

export function useDisponibilidade(
  acervoId: string,
  dataInicio: string,
  dataFim: string,
  quantidade = 1,
  excluirLocacaoId?: string
) {
  return useQuery({
    queryKey: ['disponibilidade', acervoId, dataInicio, dataFim, quantidade],
    queryFn: async () => {
      const qs = buildQueryString({ dataInicio, dataFim, quantidade, excluirLocacaoId })
      const { data } = await api.get(`/acervo/${acervoId}/disponibilidade${qs}`)
      return data.data as { disponivel: boolean; quantidadeDisponivel: number; conflitos: unknown[] }
    },
    enabled: !!acervoId && !!dataInicio && !!dataFim,
  })
}

export function useCreateAcervo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const { data } = await api.post('/acervo', payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['acervo'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Item adicionado ao acervo!')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useUpdateAcervo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.put(`/acervo/${id}`, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['acervo'] })
      toast.success('Item atualizado!')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useDeleteAcervo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/acervo/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['acervo'] })
      toast.success('Item removido do acervo.')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}
