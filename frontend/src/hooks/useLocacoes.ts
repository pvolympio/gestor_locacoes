// src/hooks/useLocacoes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getErrorMessage } from '@/lib/api'
import { buildQueryString } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Locacao, PaginatedResult, ApiResponse } from '@/types'

export function useLocacoes(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['locacoes', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResult<Locacao>>>(
        `/locacoes${buildQueryString(params)}`
      )
      return data.data
    },
  })
}

export function useLocacao(id: string) {
  return useQuery({
    queryKey: ['locacao', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Locacao>>(`/locacoes/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateLocacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const { data } = await api.post('/locacoes', payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locacoes'] })
      qc.invalidateQueries({ queryKey: ['acervo'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Locação criada com sucesso!')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useFinalizarLocacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, observacoes }: { id: string; observacoes?: string }) => {
      const { data } = await api.patch(`/locacoes/${id}/finalizar`, { observacoes })
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locacoes'] })
      qc.invalidateQueries({ queryKey: ['acervo'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Locação finalizada! Itens devolvidos ao acervo.')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useCancelarLocacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo?: string }) => {
      const { data } = await api.patch(`/locacoes/${id}/cancelar`, { motivo })
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locacoes'] })
      qc.invalidateQueries({ queryKey: ['acervo'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Locação cancelada.')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}
