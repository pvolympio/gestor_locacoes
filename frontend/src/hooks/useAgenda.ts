// src/hooks/useAgenda.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'
import type { Evento, ApiResponse } from '@/types'

export function useEventosMes(ano: number, mes: number) {
  return useQuery({
    queryKey: ['agenda-mes', ano, mes],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Evento[]>>(`/agenda/mes?ano=${ano}&mes=${mes}`)
      return data.data
    },
  })
}

export function useDevolucoesHoje() {
  return useQuery({
    queryKey: ['devolucoes-hoje'],
    queryFn: async () => {
      const { data } = await api.get('/agenda/devolucoes-hoje')
      return data.data
    },
    refetchInterval: 1000 * 60 * 5,
  })
}

export function useCreateEvento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const { data } = await api.post('/agenda', payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agenda-mes'] })
      toast.success('Evento criado!')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useDeleteEvento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/agenda/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agenda-mes'] })
      toast.success('Evento removido.')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}
