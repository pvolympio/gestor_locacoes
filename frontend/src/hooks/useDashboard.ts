// src/hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { DashboardMetricas, ApiResponse, Locacao } from '@/types'

export function useDashboardMetricas() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DashboardMetricas>>('/dashboard')
      return data.data
    },
    refetchInterval: 1000 * 60 * 2, // atualiza a cada 2 min
  })
}

export function useDashboardAtividades(limite = 8) {
  return useQuery({
    queryKey: ['dashboard-atividades', limite],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Locacao[]>>(`/dashboard/atividades?limite=${limite}`)
      return data.data
    },
  })
}

export function useDashboardGrafico(meses = 6) {
  return useQuery({
    queryKey: ['dashboard-grafico', meses],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ mes: string; total: number }[]>>(
        `/dashboard/grafico-mensal?meses=${meses}`
      )
      return data.data
    },
  })
}

export function useItensMaisAlugados(limite = 8) {
  return useQuery({
    queryKey: ['dashboard-itens-populares', limite],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/itens-populares?limite=${limite}`)
      return data.data as { acervo: { id: string; nome: string; categoria?: { nome: string; cor: string } }; totalLocacoes: number; totalUnidades: number }[]
    },
  })
}

export function useLocacoesAtrasadas() {
  return useQuery({
    queryKey: ['dashboard-atrasadas'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Locacao[]>>('/dashboard/atrasadas')
      return data.data
    },
  })
}
