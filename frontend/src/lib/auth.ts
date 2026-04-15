// src/lib/auth.ts
// CORRIGIDO: Grava um cookie leve "auth_signal" para o middleware do Next.js
// poder verificar autenticação no servidor (Edge), evitando flash de tela.
// O token JWT real continua no localStorage para as chamadas de API.
import { api } from './api'
import type { AuthTokens, User } from '@/types'

function store(key: string, value: string) {
  if (typeof window !== 'undefined') localStorage.setItem(key, value)
}

function remove(key: string) {
  if (typeof window !== 'undefined') localStorage.removeItem(key)
}

function read(key: string): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(key)
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 86400000).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

export async function login(email: string, senha: string): Promise<AuthTokens> {
  const { data } = await api.post('/auth/login', { email, senha })
  const tokens: AuthTokens = data.data

  store('access_token',  tokens.accessToken)
  store('refresh_token', tokens.refreshToken)
  store('user_id',       tokens.usuario.id)
  store('user_data',     JSON.stringify(tokens.usuario))

  // Cookie leve para o middleware detectar autenticação no Edge
  setCookie('auth_signal', '1', 1)

  return tokens
}

export async function logout(): Promise<void> {
  try { await api.post('/auth/logout') } catch {}
  remove('access_token')
  remove('refresh_token')
  remove('user_id')
  remove('user_data')
  deleteCookie('auth_signal')
}

export function getUser(): User | null {
  const raw = read('user_data')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function isAuthenticated(): boolean {
  return !!read('access_token')
}
