'use client'

import type { Suggestion } from '@/app/api/studio-suggestions/route'
import { formatEngagement } from '@/lib/utils'

interface SuggestionStripProps {
  suggestions: Suggestion[]
  loading: boolean
  onSelect: (prompt: string) => void
}

function SkeletonChip() {
  return (
    <div className="flex-shrink-0 w-64 h-16 bg-[#13131a] border border-[#1e1e2e] rounded-xl animate-pulse" />
  )
}

export default function SuggestionStrip({ suggestions, loading, onSelect }: SuggestionStripProps) {
  return (
    <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-4 space-y-3">
      <div>
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>💡</span>
          Smart Suggestions — Based on Your Top Posts
        </h3>
        <p className="text-[11px] text-[#64748b] mt-0.5">
          These backgrounds match the visual style of your best performing JOOLA Instagram posts
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonChip key={i} />)
          : suggestions.map((s, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-72 bg-[#13131a] border border-[#1e1e2e] hover:border-[#00d4ff]/40 rounded-xl px-3.5 py-3 flex items-center justify-between gap-3 group transition-all cursor-pointer"
                onClick={() => onSelect(s.prompt)}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="text-base flex-shrink-0 mt-0.5">{s.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white leading-snug line-clamp-2">
                      {s.description}
                    </p>
                    <p className="text-[10px] text-[#475569] mt-0.5">
                      {s.isCustom || s.postCount === 0
                        ? s.isCustom && s.description.toLowerCase().includes('india')
                          ? 'Trending for IPBL launch content'
                          : 'Curated suggestion'
                        : `Used by ${s.postCount} top post${s.postCount !== 1 ? 's' : ''} · avg ${formatEngagement(s.avgEngagement)}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(s.prompt) }}
                  className="flex-shrink-0 px-2.5 py-1.5 bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] rounded-lg text-[10px] font-bold tracking-wide transition-colors border border-[#00d4ff]/20"
                >
                  USE
                </button>
              </div>
            ))}
      </div>
    </div>
  )
}
