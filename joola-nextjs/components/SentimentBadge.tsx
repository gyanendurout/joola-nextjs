import { cn } from '@/lib/utils'

interface SentimentBadgeProps {
  value: string
  className?: string
}

const sentimentStyles: Record<string, string> = {
  positive: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  negative: 'bg-red-500/15 text-red-400 border-red-500/30',
  neutral: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  mixed: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  // severity
  high: 'bg-red-500/15 text-red-400 border-red-500/30',
  medium: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

export default function SentimentBadge({ value, className }: SentimentBadgeProps) {
  const lower = (value || '').toLowerCase()
  const style = sentimentStyles[lower] || 'bg-slate-500/15 text-slate-300 border-slate-500/30'

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize',
        style,
        className
      )}
    >
      {value || 'unknown'}
    </span>
  )
}
