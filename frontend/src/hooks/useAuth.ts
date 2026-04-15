// src/hooks/useAuth.ts
import { create } from 'zustand'
import { login as loginFn, logout as logoutFn, getUser } from '@/lib/auth'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
  init: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,

  init: () => {
    const user = getUser()
    set({ user })
  },

  login: async (email, senha) => {
    set({ loading: true })
    try {
      const tokens = await loginFn(email, senha)
      set({ user: tokens.usuario, loading: false })
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },

  logout: async () => {
    await logoutFn()
    set({ user: null })
    window.location.href = '/login'
  },
}))
