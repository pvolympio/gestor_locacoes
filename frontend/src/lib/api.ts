// src/lib/api.ts — cliente HTTP centralizado
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

function getLocal(key: string): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(key)
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Injeta o token em cada request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getLocal('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Trata 401 — tenta renovar o token automaticamente
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = getLocal('refresh_token')
      const userId = getLocal('user_id')

      if (refreshToken && userId) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { userId, refreshToken })
          const tokens = data.data
          localStorage.setItem('access_token', tokens.accessToken)
          localStorage.setItem('refresh_token', tokens.refreshToken)
          original.headers.Authorization = `Bearer ${tokens.accessToken}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      } else {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    return data?.message || 'Ocorreu um erro inesperado.'
  }
  return 'Ocorreu um erro inesperado.'
}