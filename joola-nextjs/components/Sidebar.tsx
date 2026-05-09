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

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#0d0d14] border-r border-[#1e1e2e] flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#1e1e2e]">
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="JOOLA">
            <rect width="28" height="28" rx="6" fill="#1a5cff" />
            <path d="M7 8h14M7 14h10M7 20h7" stroke="#00d4ff" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="22" cy="20" r="3" fill="#00d4ff" />
          </svg>
          <div>
            <span className="text-white font-bold text-base tracking-wide">JOOLA</span>
            <p className="text-[10px] text-[#94a3b8] -mt-0.5">Intelligence</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-[#1a5cff]/15 text-[#00d4ff] border border-[#1a5cff]/30'
                    : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
                )}
              >
                <Icon
                  size={16}
                  className={cn(active ? 'text-[#00d4ff]' : 'text-[#64748b]')}
                />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#1e1e2e]">
        <p className="text-[10px] text-[#475569]">JOOLA Instagram Intelligence</p>
        <p className="text-[10px] text-[#334155]">v1.0.0</p>
      </div>
    </aside>
  )
}
