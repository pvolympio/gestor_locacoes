// src/hooks/useClientes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getErrorMessage } from '@/lib/api'
import { buildQueryString } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Cliente, PaginatedResult, ApiResponse } from '@/types'

export function useClientes(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResult<Cliente>>>(
        `/clientes${buildQueryString(params)}`
      )
      return data.data
    },
  })
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Cliente>>(`/clientes/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useBuscarClientes(nome: string) {
  return useQuery({
    queryKey: ['clientes-busca', nome],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Cliente[]>>(`/clientes/buscar?nome=${nome}`)
      return data.data
    },
    enabled: nome.length >= 2,
  })
}

export function useCreateCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const { data } = await api.post('/clientes', payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente cadastrado com sucesso!')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useUpdateCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.put(`/clientes/${id}`, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente atualizado!')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}
