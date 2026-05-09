'use client'

import { useState } from 'react'
import { Expand, RefreshCw, Plus, X } from 'lucide-react'
import TextOverlay, { type OverlayConfig, FONT_SIZE_MAP, COLOR_MAP, POSITION_ALIGN, CORNER_MAP } from './TextOverlay'

interface ImageEditorProps {
  imageUrl: string
  backgroundPrompt: string
  overlay: OverlayConfig
  onOverlayChange: (config: OverlayConfig) => void
  onRefinePromptChange: (p: string) => void
  onRegenerateOne: () => void
  onGenerateFourMore: () => void
  isRegenerating: boolean
  previewRef: React.RefObject<HTMLDivElement>
}

function FullscreenModal({ imageUrl, overlay, onClose }: { imageUrl: string; overlay: OverlayConfig; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 p-1.5 bg-[#1e1e2e] hover:bg-red-500/20 text-[#94a3b8] hover:text-red-400 rounded-full transition-colors border border-[#334155]"
        >
          <X size={14} />
        </button>
        <div className="relative rounded-xl overflow-hidden border border-[#1e1e2e]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Full preview" className="w-full" />
          <OverlayRenderer overlay={overlay} />
        </div>
      </div>
    </div>
  )
}

function getTextColor(layer: { color: string; customColor: string }): string {
  return COLOR_MAP[layer.color as keyof typeof COLOR_MAP] || layer.customColor
}

function OverlayRenderer({ overlay }: { overlay: OverlayConfig }) {
  const { headline, subtext, badge } = overlay

  const headlineStyle: React.CSSProperties = {
    color: getTextColor(headline),
    fontWeight: headline.style === 'bold' ? 700 : 400,
    fontStyle: headline.style === 'italic' ? 'italic' : 'normal',
    textShadow: '0 2px 8px rgba(0,0,0,0.8)',
  }

  const subtextStyle: React.CSSProperties = {
    color: getTextColor(subtext),
    fontWeight: subtext.style === 'bold' ? 700 : 400,
    fontStyle: subtext.style === 'italic' ? 'italic' : 'normal',
    textShadow: '0 2px 8px rgba(0,0,0,0.8)',
  }

  return (
    <>
      {headline.text && (
        <div className={`absolute ${POSITION_ALIGN[headline.position]} px-4 py-3 flex flex-col items-center`}>
          <p className={`${FONT_SIZE_MAP[headline.fontSize]} font-sans text-center leading-tight`} style={headlineStyle}>
            {headline.text}
          </p>
        </div>
      )}

      {subtext.enabled && subtext.text && (
        <div
          className={`absolute ${POSITION_ALIGN[subtext.position]} px-4 flex flex-col items-center`}
          style={{ marginTop: headline.text && subtext.position === headline.position ? '3rem' : 0 }}
        >
          <p className={`${FONT_SIZE_MAP[subtext.fontSize]} font-sans text-center`} style={subtextStyle}>
            {subtext.text}
          </p>
        </div>
      )}

      {badge.enabled && badge.text && (
        <div className={`absolute ${CORNER_MAP[badge.position]}`}>
          <span className="px-3 py-1.5 bg-[#00d4ff] text-black text-[11px] font-black tracking-widest rounded-full uppercase">
            {badge.text}
          </span>
        </div>
      )}
    </>
  )
}

// Export for use in ExportPanel
export { OverlayRenderer }

export default function ImageEditor({
  imageUrl,
  backgroundPrompt,
  overlay,
  onOverlayChange,
  onRefinePromptChange,
  onRegenerateOne,
  onGenerateFourMore,
  isRegenerating,
  previewRef,
}: ImageEditorProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const [refinePrompt, setRefinePrompt] = useState(backgroundPrompt)

  const handlePromptChange = (v: string) => {
    setRefinePrompt(v)
    onRefinePromptChange(v)
  }

  return (
    <>
      {fullscreen && (
        <FullscreenModal imageUrl={imageUrl} overlay={overlay} onClose={() => setFullscreen(false)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Left: Live Preview ─────────────────────────────────────── */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white">Live Preview</h3>
          <div
            ref={previewRef}
            className="relative rounded-xl overflow-hidden border border-[#1e1e2e] bg-[#0a0a0f]"
            style={{ maxWidth: 400 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Selected"
              className="w-full object-cover"
              crossOrigin="anonymous"
            />
            <OverlayRenderer overlay={overlay} />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[#475569] italic">This is exactly what will be exported</p>
            <button
              onClick={() => setFullscreen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e2e] hover:bg-[#2a2a3e] text-[#94a3b8] hover:text-white rounded-lg text-xs transition-colors"
            >
              <Expand size={12} />
              Full Screen
            </button>
          </div>
        </div>

        {/* ── Right: Controls ────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Block A: Refine */}
          <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-white">Not quite right? Refine it.</h4>

            <div className="space-y-1.5">
              <label className="text-[10px] text-[#64748b] uppercase tracking-wide">Edit background description</label>
              <textarea
                value={refinePrompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-xs text-white placeholder-[#334155] focus:outline-none focus:border-[#00d4ff] transition-colors resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={onRegenerateOne}
                disabled={isRegenerating}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#1a5cff]/15 hover:bg-[#1a5cff]/25 text-[#7ca9ff] rounded-lg text-xs font-medium transition-colors border border-[#1a5cff]/25 disabled:opacity-40"
              >
                <RefreshCw size={12} className={isRegenerating ? 'animate-spin' : ''} />
                {isRegenerating ? 'Regenerating...' : 'Regenerate This'}
              </button>
              <button
                onClick={onGenerateFourMore}
                disabled={isRegenerating}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#13131a] hover:bg-[#1e1e2e] text-[#94a3b8] hover:text-white rounded-lg text-xs font-medium transition-colors border border-[#1e1e2e] disabled:opacity-40"
              >
                <Plus size={12} />
                4 New Variations
              </button>
            </div>
          </div>

          {/* Block B: Text overlays */}
          <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-white">Add Text to Image</h4>
            <TextOverlay config={overlay} onChange={onOverlayChange} />
          </div>
        </div>
      </div>
    </>
  )
}
