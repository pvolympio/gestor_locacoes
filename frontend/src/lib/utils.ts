// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AcervoStatus, LocacaoStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Datas ────────────────────────────────────────────────────
export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: ptBR })
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm")
}

export function formatRelative(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { locale: ptBR, addSuffix: true })
}

export function isOverdue(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isPast(d)
}

export function diasRestantes(date: string | Date): number {
  const d = typeof date === 'string' ? parseISO(date) : date
  const diff = d.getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ── Status Labels e cores ────────────────────────────────────
export const LOCACAO_STATUS_MAP: Record<LocacaoStatus, { label: string; badge: string }> = {
  PENDENTE:   { label: 'Pendente',   badge: 'badge-gray'   },
  CONFIRMADA: { label: 'Confirmada', badge: 'badge-blue'   },
  ATIVA:      { label: 'Ativa',      badge: 'badge-green'  },
  ATRASADA:   { label: 'Atrasada',   badge: 'badge-red'    },
  FINALIZADA: { label: 'Finalizada', badge: 'badge-gray'   },
  CANCELADA:  { label: 'Cancelada',  badge: 'badge-gray'   },
}

export const ACERVO_STATUS_MAP: Record<AcervoStatus, { label: string; badge: string; dot: string }> = {
  DISPONIVEL:   { label: 'Disponível',    badge: 'badge-green',  dot: 'bg-emerald-400' },
  PARCIALMENTE: { label: 'Parcial',       badge: 'badge-amber',  dot: 'bg-amber-400'   },
  ALUGADO:      { label: 'Alugado',       badge: 'badge-red',    dot: 'bg-red-400'     },
  INATIVO:      { label: 'Inativo',       badge: 'badge-gray',   dot: 'bg-zinc-500'    },
}

// ── Moeda ────────────────────────────────────────────────────
export function formatCurrency(value?: string | number | null): string {
  if (value == null || value === '') return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Paginação ────────────────────────────────────────────────
export function buildQueryString(params: Record<string, unknown>): string {
  const filtered = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
  return filtered.length ? `?${filtered.join('&')}` : ''
}

// ── Iniciais para avatar ─────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}
