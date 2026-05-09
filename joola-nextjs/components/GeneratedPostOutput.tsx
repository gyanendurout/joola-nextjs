'use client'

import { useState, useEffect } from 'react'
import {
  Sparkles, Download, Copy, Check, Calendar, Clock,
  Layout, TrendingUp, BookmarkPlus, ClipboardCopy, CheckSquare,
  ImageIcon,
} from 'lucide-react'
import type { GeneratePostResponse } from '@/app/generate/types'
import { formatEngagement } from '@/lib/utils'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[#1e1e2e] rounded-xl ${className}`} />
}

interface GeneratedPostOutputProps {
  output: GeneratePostResponse | null
  isGenerating: boolean
  generatingStep: string
  onSaveDraft: () => Promise<void>
  onMarkAsPosted: (draftId: string) => Promise<void>
  currentDraftId: string | null
}

export default function GeneratedPostOutput({
  output,
  isGenerating,
  generatingStep,
  onSaveDraft,
  onMarkAsPosted,
  currentDraftId,
}: GeneratedPostOutputProps) {
  const [captionText, setCaptionText] = useState('')
  const [copiedCaption, setCopiedCaption] = useState(false)
  const [copiedHashtags, setCopiedHashtags] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)

  // Reset caption when new output arrives
  useEffect(() => {
    if (output?.caption) {
      setCaptionText(output.caption)
      setDraftSaved(false)
    }
  }, [output?.caption])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for HTTP contexts
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
  }

  const handleCopyCaption = async () => {
    await copyToClipboard(captionText)
    setCopiedCaption(true)
    setTimeout(() => setCopiedCaption(false), 2000)
  }

  const handleCopyHashtags = async () => {
    if (!output) return
    await copyToClipboard(output.hashtags.map((h) => `#${h}`).join(' '))
    setCopiedHashtags(true)
    setTimeout(() => setCopiedHashtags(false), 2000)
  }

  const handleCopyAll = async () => {
    if (!output) return
    const text = `${captionText}\n\n${output.hashtags.map((h) => `#${h}`).join(' ')}`
    await copyToClipboard(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const handleDownload = async () => {
    if (!output?.image.url) return

    // Base64 data URL (gpt-image-1 edit) — download directly
    if (output.image.url.startsWith('data:')) {
      const a = document.createElement('a')
      a.href = output.image.url
      a.download = 'joola-post.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      return
    }

    // External CDN URL (DALL-E 3) — go through proxy to avoid CORS
    setIsDownloading(true)
    try {
      const resp = await fetch(`/api/proxy-image?url=${encodeURIComponent(output.image.url)}`)
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'joola-post.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(output.image.url, '_blank')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      await onSaveDraft()
      setDraftSaved(true)
    } finally {
      setIsSaving(false)
    }
  }

  // ── Empty state ────────────────────────────────────────────────────────
  if (!isGenerating && !output) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[480px] border-2 border-dashed border-[#1e1e2e] rounded-xl text-center p-8 bg-[#0d0d14]">
        <div className="w-14 h-14 rounded-full bg-[#1e1e2e] flex items-center justify-center mb-4">
          <Sparkles size={24} className="text-[#334155]" />
        </div>
        <p className="text-[#64748b] font-medium text-sm">Your generated post will appear here</p>
        <p className="text-xs text-[#334155] mt-1.5 max-w-[220px] leading-relaxed">
          Fill in the form on the left and click <span className="text-[#475569]">Generate Post</span>
        </p>
      </div>
    )
  }

  // ── Loading state ──────────────────────────────────────────────────────
  if (isGenerating) {
    return (
      <div className="space-y-4">
        <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-[#00d4ff] animate-pulse" />
            <span className="text-sm text-[#94a3b8]">{generatingStep || 'Generating...'}</span>
          </div>
          <div className="w-full h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1a5cff] to-[#00d4ff] rounded-full animate-[shimmer_2s_ease-in-out_infinite]"
              style={{ width: '70%', animation: 'pulse 1.5s ease-in-out infinite' }}
            />
          </div>
          <p className="text-[10px] text-[#334155] mt-2">Image + caption generating in parallel. This takes 15–25 seconds.</p>
        </div>
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!output) return null

  const { postingIntelligence: intel } = output

  // ── Generated output ───────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Section A: Image */}
      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ImageIcon size={14} className="text-[#00d4ff]" />
          Generated Image
        </h3>
        {output.image.url ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={output.image.url}
              alt="AI generated Instagram post concept"
              className="w-full rounded-lg border border-[#1e1e2e] object-cover"
            />
            <div className="flex items-center flex-wrap gap-2">
              <span className="px-2 py-0.5 bg-[#1e1e2e] text-[#64748b] text-[10px] rounded-md border border-[#334155]">
                HD {output.image.size}
              </span>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e2e] hover:bg-[#2a2a3e] text-[#94a3b8] hover:text-white rounded-lg text-xs transition-colors disabled:opacity-50"
              >
                <Download size={12} />
                {isDownloading ? 'Downloading...' : 'Download Image'}
              </button>
            </div>
            <p className="text-[10px] text-[#334155] italic leading-relaxed">
              {output.image.url.startsWith('data:')
                ? 'AI-enhanced product image. Review before posting.'
                : 'AI-generated concept image. Does not contain real athletes. Review before posting.'}
            </p>
          </div>
        ) : (
          <div className="h-48 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg flex flex-col items-center justify-center gap-2 text-[#334155]">
            <ImageIcon size={24} />
            <p className="text-xs">Image generation unavailable — check your OpenAI key</p>
          </div>
        )}
      </div>

      {/* Section B: Caption */}
      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Caption</h3>
        <textarea
          value={captionText}
          onChange={(e) => setCaptionText(e.target.value)}
          rows={6}
          className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff] transition-colors resize-none leading-relaxed"
        />
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs ${captionText.length > 2200 ? 'text-red-400' : 'text-[#475569]'}`}>
            {captionText.length} characters
          </span>
          <button
            onClick={handleCopyCaption}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e2e] hover:bg-[#2a2a3e] text-[#94a3b8] hover:text-white rounded-lg text-xs transition-colors"
          >
            {copiedCaption ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copiedCaption ? 'Copied!' : 'Copy Caption'}
          </button>
        </div>
      </div>

      {/* Section C: Hashtags */}
      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Recommended Hashtags</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {output.hashtagsWithStats.map((h) => (
            <div key={h.hashtag} className="flex flex-col items-center gap-0.5">
              <span className="px-2.5 py-1 rounded-full border border-[#00d4ff]/25 text-[#00d4ff] text-xs font-mono bg-[#00d4ff]/5 hover:bg-[#00d4ff]/10 cursor-default transition-colors">
                #{h.hashtag}
              </span>
              {h.avg_engagement_rate > 0 && (
                <span className="text-[9px] text-[#475569]">
                  {formatEngagement(h.avg_engagement_rate)} avg
                </span>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={handleCopyHashtags}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e2e] hover:bg-[#2a2a3e] text-[#94a3b8] hover:text-white rounded-lg text-xs transition-colors"
        >
          {copiedHashtags ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copiedHashtags ? 'Copied!' : 'Copy All Hashtags'}
        </button>
      </div>

      {/* Section D: Posting Intelligence */}
      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">When &amp; How to Post</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            {
              icon: <Calendar size={13} className="text-[#00d4ff]" />,
              label: 'Best Day',
              value: intel.bestDay,
              sub: `Highest avg engagement from your top ${output.referencePosts.length} reference posts`,
            },
            {
              icon: <Clock size={13} className="text-[#00d4ff]" />,
              label: 'Best Time',
              value: intel.bestTime,
              sub: 'Peak comment activity window from your data',
            },
            {
              icon: <Layout size={13} className="text-[#00d4ff]" />,
              label: 'Recommended Format',
              value: intel.recommendedFormat,
              sub: 'Best performing format for this theme',
            },
            {
              icon: <TrendingUp size={13} className="text-[#00d4ff]" />,
              label: 'Predicted Engagement',
              value: `${intel.predictedEngagementMin}% – ${intel.predictedEngagementMax}%`,
              sub: `Based on ${output.referencePosts.length} similar posts in your history`,
            },
          ].map(({ icon, label, value, sub }) => (
            <div key={label} className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                {icon}
                <span className="text-[9px] text-[#64748b] font-medium uppercase tracking-wider">{label}</span>
              </div>
              <p className="text-sm font-semibold text-white leading-tight">{value}</p>
              <p className="text-[10px] text-[#475569] mt-1 leading-relaxed">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section E: Performance Intelligence */}
      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <TrendingUp size={14} className="text-[#a855f7]" />
          Performance Intelligence
        </h3>
        <p className="text-sm text-[#94a3b8] leading-relaxed">{output.whyThisWorks}</p>
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 z-10 bg-[#0a0a0f]/95 backdrop-blur-sm border border-[#1e1e2e] rounded-xl p-3 flex gap-2 shadow-xl">
        <button
          onClick={handleSaveDraft}
          disabled={isSaving}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${
            draftSaved
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-[#1e1e2e] hover:bg-[#2a2a3e] text-[#94a3b8] hover:text-white'
          }`}
        >
          <BookmarkPlus size={13} />
          {isSaving ? 'Saving...' : draftSaved ? 'Saved ✓' : 'Save to Draft'}
        </button>
        <button
          onClick={handleCopyAll}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#1e1e2e] hover:bg-[#2a2a3e] text-[#94a3b8] hover:text-white rounded-lg text-xs font-medium transition-colors"
        >
          {copiedAll ? <Check size={13} className="text-emerald-400" /> : <ClipboardCopy size={13} />}
          {copiedAll ? 'Copied!' : 'Copy Everything'}
        </button>
        {currentDraftId && (
          <button
            onClick={() => onMarkAsPosted(currentDraftId)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 rounded-lg text-xs font-medium transition-colors border border-emerald-500/25"
          >
            <CheckSquare size={13} />
            Mark as Posted
          </button>
        )}
      </div>
    </div>
  )
}
