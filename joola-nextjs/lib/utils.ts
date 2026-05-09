import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

export function formatPct(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0%'
  return `${(num * 100).toFixed(2)}%`
}

export function formatEngagement(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0%'
  // Values < 1 are decimal fractions (e.g. 0.05 = 5%); values >= 1 are already percentages.
  const pct = num < 1 ? num * 100 : num
  return `${pct.toFixed(2)}%`
}

export function truncate(text: string | null | undefined, length: number): string {
  if (!text) return ''
  if (text.length <= length) return text
  return text.slice(0, length) + '…'
}
