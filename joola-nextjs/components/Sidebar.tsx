'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Image,
  MessageSquare,
  Users,
  Swords,
  AlertTriangle,
  FileText,
  Package,
  Sparkles,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/posts', label: 'Posts', icon: Image },
  { href: '/comments', label: 'Comments', icon: MessageSquare },
  { href: '/fans', label: 'Fans', icon: Users },
  { href: '/competitors', label: 'Competitors', icon: Swords },
  { href: '/complaints', label: 'Complaints', icon: AlertTriangle },
  { href: '/content', label: 'Content', icon: FileText },
  { href: '/generate', label: 'Post Generator', icon: Sparkles },
  { href: '/studio', label: 'Background Studio', icon: ImagePlus },
  { href: '/products', label: 'Products', icon: Package },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-[#0d0d14] border-r border-[#1e1e2e] flex flex-col z-50 transition-[width] duration-200',
        collapsed ? 'w-[64px]' : 'w-[220px]',
      )}
    >
      <div
        className={cn(
          'border-b border-[#1e1e2e] flex items-center',
          collapsed ? 'px-2 py-5 justify-center' : 'px-6 py-5 justify-between',
        )}
      >
        <div className={cn('flex items-center', collapsed ? '' : 'gap-2.5')}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="JOOLA">
            <rect width="28" height="28" rx="6" fill="#1a5cff" />
            <path d="M7 8h14M7 14h10M7 20h7" stroke="#00d4ff" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="22" cy="20" r="3" fill="#00d4ff" />
          </svg>
          {!collapsed && (
            <div>
              <span className="text-white font-bold text-base tracking-wide">JOOLA</span>
              <p className="text-[10px] text-[#94a3b8] -mt-0.5">Intelligence</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="text-[#64748b] hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-2 mb-1 text-[#64748b] hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <ChevronRight size={16} />
        </button>
      )}

      <nav className="flex-1 py-4 overflow-y-auto">
        <div className={cn('space-y-0.5', collapsed ? 'px-2' : 'px-3')}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  'flex items-center rounded-lg text-sm font-medium transition-all duration-150',
                  collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                  active
                    ? 'bg-[#1a5cff]/15 text-[#00d4ff] border border-[#1a5cff]/30'
                    : 'text-[#94a3b8] hover:text-white hover:bg-white/5',
                )}
              >
                <Icon
                  size={16}
                  className={cn(active ? 'text-[#00d4ff]' : 'text-[#64748b]')}
                />
                {!collapsed && label}
              </Link>
            )
          })}
        </div>
      </nav>

      <div
        className={cn(
          'border-t border-[#1e1e2e]',
          collapsed ? 'px-2 py-3 text-center' : 'px-5 py-4',
        )}
      >
        {collapsed ? (
          <p className="text-[10px] text-[#475569]">v1.0</p>
        ) : (
          <>
            <p className="text-[10px] text-[#475569]">JOOLA Instagram Intelligence</p>
            <p className="text-[10px] text-[#334155]">v1.0.0</p>
          </>
        )}
      </div>
    </aside>
  )
}
