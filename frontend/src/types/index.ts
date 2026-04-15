// src/types/index.ts — Tipos globais espelhando o backend

export type UserRole = 'ADMIN' | 'OPERADOR'
export type AcervoStatus = 'DISPONIVEL' | 'PARCIALMENTE' | 'ALUGADO' | 'INATIVO'
export type LocacaoStatus = 'PENDENTE' | 'CONFIRMADA' | 'ATIVA' | 'ATRASADA' | 'FINALIZADA' | 'CANCELADA'
export type EventoTipo = 'RETIRADA' | 'DEVOLUCAO' | 'RESERVA' | 'LEMBRETE' | 'OUTRO'

export interface User {
  id: string
  nome: string
  email: string
  role: UserRole
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  usuario: User
}

export interface Cliente {
  id: string
  nome: string
  telefone?: string
  email?: string
  cpf?: string
  endereco?: string
  cidade?: string
  observacoes?: string
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
  _count?: { locacoes: number }
}

export interface Categoria {
  id: string
  nome: string
  descricao?: string
  cor?: string
  _count?: { itens: number }
}

export interface AcervoItem {
  id: string
  nome: string
  descricao?: string
  categoriaId?: string
  categoria?: Categoria
  quantidadeTotal: number
  quantidadeAtual: number
  status: AcervoStatus
  codigoInterno?: string
  observacoes?: string
  imagemUrl?: string
  valorLocacao?: string
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
  _count?: { itensLocacao: number }
}

export interface ItemLocacao {
  id: string
  locacaoId: string
  acervoId: string
  quantidade: number
  observacao?: string
  acervo: Pick<AcervoItem, 'id' | 'nome'>
}

export interface Locacao {
  id: string
  clienteId: string
  cliente: Pick<Cliente, 'id' | 'nome' | 'telefone'>
  dataRetirada: string
  dataDevolucao: string
  dataDevolvido?: string
  status: LocacaoStatus
  observacoes?: string
  valorTotal?: string
  desconto?: string
  valorFinal?: string
  formaPagamento?: string
  pago: boolean
  itens: ItemLocacao[]
  criadoEm: string
  atualizadoEm: string
}

export interface Evento {
  id: string
  titulo: string
  descricao?: string
  dataInicio: string
  dataFim?: string
  diaInteiro: boolean
  tipo: EventoTipo
  cor?: string
  locacaoId?: string
  locacao?: {
    id: string
    status: LocacaoStatus
    cliente: Pick<Cliente, 'id' | 'nome'>
  }
  criadoEm: string
}

export interface DashboardMetricas {
  acervo: {
    total: number
    disponiveis: number
    alugados: number
    taxaOcupacao: string
  }
  locacoes: {
    total: number
    ativas: number
    atrasadas: number
    mesAtual: number
    mesPassado: number
    variacaoPercentual: string | null
  }
  clientes: { total: number }
  alertas: {
    devolucoesHoje: number
    devolucoesAmanha: number
    itensAtrasados: number
  }
}

export interface PaginatedResult<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  timestamp: string
}
