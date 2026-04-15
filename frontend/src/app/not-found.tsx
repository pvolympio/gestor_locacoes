'use client'
// src/app/not-found.tsx
import Link from 'next/link'
import { Sparkles, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg)' }}
    >
      {/* Fundo decorativo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />
      </div>

      <div className="relative text-center animate-slide-up">

        {/* Logo */}
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 shadow-2xl mx-auto"
          style={{ background: 'var(--gradient)', boxShadow: '0 8px 32px rgba(168,85,247,0.4)' }}
        >
          <Sparkles className="w-7 h-7 text-white" />
        </div>

        {/* Número 404 */}
        <h1
          className="text-8xl font-bold mb-4 leading-none"
          style={{
            background: 'var(--gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </h1>

        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Página não encontrada
        </h2>
        <p className="text-sm mb-8 max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
          A página que você está procurando não existe ou foi movida.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <Link href="/dashboard">
            <span className="btn-primary">
              <Home className="w-4 h-4" /> Ir para o início
            </span>
          </Link>
        </div>

      </div>
    </div>
  )
}
