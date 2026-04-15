'use client'
// src/app/login/page.tsx
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sparkles, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { isAuthenticated } from '@/lib/auth'
import { getErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

function LoginContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { login, loading } = useAuth()
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace(searchParams.get('redirect') || '/dashboard')
    }
  }, [router, searchParams])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', senha: '' },
  })

  async function onSubmit(data: FormData) {
    try {
      await login(data.email, data.senha)
      router.push(searchParams.get('redirect') || '/dashboard')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>

      {/* Fundo decorativo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'linear-gradient(rgba(192,132,252,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(192,132,252,0.04) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="relative w-full max-w-sm animate-slide-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-2xl"
            style={{ background: 'var(--gradient)', boxShadow: '0 8px 32px rgba(168,85,247,0.4)' }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Sistema de Locações
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Faça login para continuar
          </p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div className="space-y-1.5">
              <label className="label">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--text-muted)' }} />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="seu@email.com"
                  className={`input pl-9 ${errors.email ? 'input-error' : ''}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="label">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--text-muted)' }} />
                <input
                  {...register('senha')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input pl-9 pr-10 ${errors.senha ? 'input-error' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.senha && <p className="text-xs text-red-400">{errors.senha.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2 text-base"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginContent /></Suspense>
}
