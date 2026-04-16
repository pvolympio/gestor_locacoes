'use client'
// src/components/layout/Sidebar.tsx
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ClipboardList,
  Users, CalendarDays, LogOut, ChevronRight,
  Sparkles, Menu, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useLocacoesAtrasadas } from '@/hooks/useDashboard'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/acervo',    icon: Package,          label: 'Acervo'    },
  { href: '/disponibilidade', icon: CalendarDays,   label: 'Disponibilidade' },
  { href: '/locacoes',  icon: ClipboardList,    label: 'Locações'  },
  { href: '/clientes',  icon: Users,            label: 'Clientes'  },
  { href: '/agenda',    icon: CalendarDays,     label: 'Agenda'    },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { data: atrasadas } = useLocacoesAtrasadas()
  const numAtrasadas = atrasadas?.length ?? 0

  return (
    <aside
      className="flex flex-col w-60 h-full"
      style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between px-5 py-5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shrink-0"
            style={{ background: 'var(--gradient)', boxShadow: '0 4px 14px rgba(168,85,247,0.4)' }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Locações</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Sistema de Gestão</p>
          </div>
        </div>
        {/* Botão fechar no mobile */}
        {onClose && (
          <button onClick={onClose} className="btn-ghost p-1 rounded-lg md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active     = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          const showBadge  = href === '/locacoes' && numAtrasadas > 0
          return (
            <Link key={href} href={href} onClick={onClose}>
              <span className={cn('nav-link', active && 'active')}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {showBadge && (
                  <span className="badge badge-red text-[10px] px-1.5 py-0.5">
                    {numAtrasadas}
                  </span>
                )}
                {active && <ChevronRight className="w-3 h-3 opacity-40" />}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Usuário */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center border shrink-0"
            style={{ background: 'var(--accent-glow)', borderColor: 'rgba(192,132,252,0.3)' }}
          >
            <span className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
              {user?.nome?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.nome ?? '—'}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {user?.role === 'ADMIN' ? 'Administrador' : 'Operador'}
            </p>
          </div>
        </div>
        <button onClick={logout} className="nav-link w-full hover:text-red-400">
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop — sempre visível */}
      <div className="hidden md:flex h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Mobile — botão hamburguer fixo no topo */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-40 p-2.5 rounded-xl shadow-lg"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <Menu className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>

        {/* Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Drawer */}
        <div
          className={cn(
            'fixed top-0 left-0 z-50 h-full transition-transform duration-300',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <SidebarContent onClose={() => setMobileOpen(false)} />
        </div>
      </div>
    </>
  )
}
