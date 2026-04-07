import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function currencySymbol(currency: string) {
  if (currency === 'USD') return 'US$'
  if (currency === 'ARS') return '$'
  if (currency === 'CLP') return 'CLP$'
  if (currency === 'MXN') return 'MX$'
  if (currency === 'UYU') return '$U'
  return currency
}

export function daysBetween(dateA: string | null, dateB: string) {
  if (!dateA) return Number.POSITIVE_INFINITY
  const a = new Date(dateA)
  const b = new Date(dateB)
  const diff = b.getTime() - a.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
