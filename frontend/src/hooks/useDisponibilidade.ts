// src/hooks/useDisponibilidade.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface LocacaoDisponibilidade {
  id: string
  cliente: string
  quantidade: number
  status: string
}

export interface DiaDisponibilidade {
  data: string
  disponivel: number
  locacoes: LocacaoDisponibilidade[]
}

export interface ItemDisponibilidade {
  id: string
  nome: string
  quantidadeTotal: number
  cor: string
  doPeriodo: DiaDisponibilidade[]
}

export function useCalendarioDisponibilidade(dataInicio: string, dataFim: string, categoriaId?: string) {
  return useQuery({
    queryKey: ['calendario-disponibilidade', dataInicio, dataFim, categoriaId],
    queryFn: async (): Promise<ItemDisponibilidade[]> => {
      const { data } = await api.get('/acervo/calendario', {
        params: { dataInicio, dataFim, categoriaId }
      })
      return data.data
    },
    enabled: !!dataInicio && !!dataFim,
  })
}
