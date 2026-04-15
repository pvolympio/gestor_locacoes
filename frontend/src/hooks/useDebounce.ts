// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react'

/**
 * Retorna um valor "debounced" que só atualiza depois que o usuário
 * para de digitar pelo tempo especificado.
 * @param value - Valor a ser debounced
 * @param delay - Atraso em ms (padrão: 350ms)
 */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
