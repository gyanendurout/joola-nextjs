import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  accent?: boolean
  icon?: React.ReactNode
}

export default function KPICard({ title, value, subtitle, accent, icon }: KPICardProps) {
  return (
    <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">{title}</span>
        {icon && <span className="text-[#94a3b8]">{icon}</span>}
      </div>
      <div className={cn('text-3xl font-bold', accent ? 'text-[#00d4ff]' : 'text-white')}>
        {value}
      </div>
      {subtitle && <p className="text-xs text-[#64748b]">{subtitle}</p>}
    </div>
  )
}
