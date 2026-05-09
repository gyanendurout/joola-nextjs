'use client'

import { useState } from 'react'
import { Grid3X3, Heart, Eye, CheckCircle, RefreshCw, Plus, X, Star } from 'lucide-react'

export type GeneratedImage = {
  id: string
  url: string         // base64 data URL
  liked: boolean
  starred: boolean
}

interface BackgroundGridProps {
  images: GeneratedImage[]
  selectedId: string | null
  isGenerating: boolean
  generatingCount: number
  onSelect: (img: GeneratedImage) => void
  onLike: (id: string) => void
  onStar: (id: string) => void
  onRegenerateAll: () => void
  onGenerateMore: () => void
}

function SkeletonCard() {
  return (
    <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl overflow-hidden animate-pulse">
      <div className="w-full aspect-square bg-[#1e1e2e]" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[#1e1e2e] rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-6 bg-[#1e1e2e] rounded flex-1" />
          <div className="h-6 bg-[#1e1e2e] rounded flex-1" />
          <div className="h-6 bg-[#1e1e2e] rounded flex-1" />
        </div>
      </div>
    </div>
  )
}

function PreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 p-1.5 bg-[#1e1e2e] hover:bg-red-500/20 text-[#94a3b8] hover:text-red-400 rounded-full transition-colors border border-[#334155]"
        >
          <X size={14} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Preview" className="w-full rounded-xl border border-[#1e1e2e]" />
      </div>
    </div>
  )
}

export default function BackgroundGrid({
  images,
  selectedId,
  isGenerating,
  generatingCount,
  onSelect,
  onLike,
  onStar,
  onRegenerateAll,
  onGenerateMore,
}: BackgroundGridProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Empty state
  if (!isGenerating && images.length === 0) {
    return (
      <div className="bg-[#0d0d14] border-2 border-dashed border-[#1e1e2e] rounded-xl flex flex-col items-center justify-center min-h-[320px] text-center p-8">
        <Grid3X3 size={36} className="text-[#1e1e2e] mb-3" />
        <p className="text-sm font-medium text-[#475569]">Your generated backgrounds will appear here</p>
        <p className="text-[11px] text-[#334155] mt-1.5">Upload a product image and click Generate</p>
      </div>
    )
  }

  return (
    <>
      {previewUrl && <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}

      <div className="space-y-4">
        {isGenerating && (
          <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
            <div className="w-3 h-3 rounded-full border-2 border-[#00d4ff] border-t-transparent animate-spin" />
            Generating {generatingCount} backgrounds with Photoroom AI...
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Skeleton cards for in-progress slots */}
          {isGenerating &&
            Array.from({ length: generatingCount }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}

          {images.map((img, idx) => {
            const isSelected = img.id === selectedId
            return (
              <div
                key={img.id}
                className={`bg-[#13131a] rounded-xl overflow-hidden transition-all ${
                  isSelected
                    ? 'ring-[3px] ring-[#00d4ff] border border-[#00d4ff]/50'
                    : 'border border-[#1e1e2e] hover:border-[#334155]'
                }`}
              >
                {/* Image */}
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`Variation ${idx + 1}`}
                    className="w-full aspect-square object-cover"
                  />

                  {/* Selected badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#00d4ff] text-black text-[9px] font-black tracking-wider rounded-full flex items-center gap-1">
                      <CheckCircle size={9} />
                      SELECTED
                    </div>
                  )}

                  {/* Liked badge */}
                  {img.liked && !isSelected && (
                    <div className="absolute top-2 left-2">
                      <Heart size={14} className="fill-red-500 text-red-500" />
                    </div>
                  )}

                  {/* Starred badge */}
                  {img.starred && !isSelected && (
                    <div className={`absolute top-2 ${img.liked ? 'left-8' : 'left-2'}`}>
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#64748b] font-medium">Variation #{idx + 1}</span>
                    <button
                      onClick={() => onStar(img.id)}
                      className="p-1 hover:bg-[#1e1e2e] rounded-md transition-colors"
                    >
                      <Star
                        size={12}
                        className={img.starred ? 'fill-amber-400 text-amber-400' : 'text-[#334155]'}
                      />
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onLike(img.id)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                        img.liked
                          ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                          : 'bg-[#0d0d14] text-[#64748b] hover:text-white border border-[#1e1e2e] hover:border-[#334155]'
                      }`}
                    >
                      <Heart size={10} className={img.liked ? 'fill-red-400' : ''} />
                      Like
                    </button>
                    <button
                      onClick={() => setPreviewUrl(img.url)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#0d0d14] text-[#64748b] hover:text-white rounded-lg text-[10px] font-medium transition-colors border border-[#1e1e2e] hover:border-[#334155]"
                    >
                      <Eye size={10} />
                      Preview
                    </button>
                    <button
                      onClick={() => onSelect(img)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                        isSelected
                          ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                          : 'bg-[#1a5cff]/15 text-[#7ca9ff] hover:bg-[#1a5cff]/25 border border-[#1a5cff]/25'
                      }`}
                    >
                      <CheckCircle size={10} />
                      {isSelected ? 'Active' : 'Select'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom actions */}
        {images.length > 0 && !isGenerating && (
          <div className="flex gap-3">
            <button
              onClick={onRegenerateAll}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#13131a] hover:bg-[#1e1e2e] text-[#94a3b8] hover:text-white rounded-xl text-xs font-medium transition-colors border border-[#1e1e2e]"
            >
              <RefreshCw size={13} />
              Regenerate All
            </button>
            <button
              onClick={onGenerateMore}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1a5cff]/15 hover:bg-[#1a5cff]/25 text-[#7ca9ff] rounded-xl text-xs font-medium transition-colors border border-[#1a5cff]/25"
            >
              <Plus size={13} />
              Generate 4 More Variations
            </button>
          </div>
        )}
      </div>
    </>
  )
}
