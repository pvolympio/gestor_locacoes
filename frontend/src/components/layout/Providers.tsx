'use client'
// src/components/layout/Providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'

// CORRIGIDO: ReactQueryDevtools removido completamente.
// O require() dinâmico estava causando conflito de inicialização
// com o QueryClientProvider, gerando o erro "No QueryClient set".

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#18181c',
            color: '#f4f4f5',
            border: '1px solid #27272f',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: 'DM Sans, sans-serif',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#18181c' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#18181c' } },
        }}
      />
    </QueryClientProvider>
  )
}