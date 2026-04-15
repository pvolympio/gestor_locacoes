'use client'
// src/components/ui/index.tsx — Componentes base do design system

import { forwardRef, Fragment } from 'react'
import { cn } from '@/lib/utils'
import { Loader2, X } from 'lucide-react'

// ── Button ────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const base = cn(
      variant === 'primary'   && 'btn-primary',
      variant === 'secondary' && 'btn-secondary',
      variant === 'danger'    && 'btn-danger',
      variant === 'ghost'     && 'btn-ghost',
      size === 'sm'           && 'btn-sm',
      size === 'lg'           && 'btn-lg',
      (disabled || loading)   && 'opacity-50 cursor-not-allowed',
      className
    )
    return (
      <button ref={ref} className={base} disabled={disabled || loading} {...props}>
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ── Input ─────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn('input', icon && 'pl-9', error && 'input-error', className)}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

// ── Select ────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <select
        ref={ref}
        className={cn('input', error && 'input-error', className)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'

// ── Textarea ──────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <textarea
        ref={ref}
        className={cn('input resize-none', error && 'input-error', className)}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

// ── Badge de status ───────────────────────────────────────────
interface BadgeProps {
  className?: string
  children: React.ReactNode
}
export function Badge({ className, children }: BadgeProps) {
  return <span className={cn('badge', className)}>{children}</span>
}

// ── Card ──────────────────────────────────────────────────────
interface CardProps {
  className?: string
  children: React.ReactNode
  hover?: boolean
}
export function Card({ className, children, hover }: CardProps) {
  return <div className={cn(hover ? 'card-hover' : 'card', className)}>{children}</div>
}

// ── Modal ─────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Painel */}
      <div className={cn(
        'relative w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl animate-slide-up',
        widths[size]
      )}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
            {description && <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>}
          </div>
          <button onClick={onClose} className="btn-ghost p-1 rounded-lg ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────
interface EmptyProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}
export function Empty({ icon, title, description, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-[var(--text-muted)] mb-4 opacity-40">{icon}</div>}
      <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
      {description && <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Paginação ─────────────────────────────────────────────────
interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Anterior</Button>
      <span className="text-xs text-[var(--text-muted)] px-2">
        {page} / {totalPages}
      </span>
      <Button size="sm" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Próxima</Button>
    </div>
  )
}

// ── Confirm dialog ────────────────────────────────────────────
interface ConfirmProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
}
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirmar', loading }: ConfirmProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-[var(--text-secondary)] mb-6">{description}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
