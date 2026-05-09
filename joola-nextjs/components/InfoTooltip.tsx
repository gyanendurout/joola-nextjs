'use client'

import { useState, useRef } from 'react'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
  text: string
  wide?: boolean
}

export default function InfoTooltip({ text, wide }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  return (
    <span ref={ref} className="relative inline-flex items-center align-middle">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="text-[#475569] hover:text-[#00d4ff] transition-colors ml-1 align-middle"
        aria-label="Info"
      >
        <Info size={12} />
      </button>
      {open && (
        <span
          className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 ${wide ? 'w-80' : 'w-64'} bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg p-3 text-xs text-[#94a3b8] leading-relaxed shadow-2xl pointer-events-none`}
        >
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2a2a3e]" />
        </span>
      )}
    </span>
  )
}
