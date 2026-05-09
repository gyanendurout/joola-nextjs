import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import DashboardShell from '@/components/DashboardShell'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'JOOLA Instagram Intelligence',
  description: 'Instagram analytics and intelligence dashboard for JOOLA',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0a0a0f] text-white min-h-screen">
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  )
}
