'use client'

import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'

const STORAGE_KEY = 'joola.sidebar.collapsed'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === '1')
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  }, [collapsed, hydrated])

  const sidebarWidth = collapsed ? 64 : 220

  return (
    <>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main
        className="min-h-screen transition-[margin-left] duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="max-w-[1400px] mx-auto px-6 py-6 overflow-x-auto">
          {children}
        </div>
      </main>
    </>
  )
}
