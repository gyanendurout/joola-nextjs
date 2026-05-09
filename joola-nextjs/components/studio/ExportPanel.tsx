'use client'

import { useState } from 'react'
import { Download, Clipboard, Clapperboard, BookmarkPlus, Check } from 'lucide-react'
import type { OverlayConfig } from './TextOverlay'
import { supabase } from '@/lib/supabase'

interface ExportPanelProps {
  previewRef: React.RefObject<HTMLDivElement>
  imageUrl: string
  backgroundPrompt: string
  overlay: OverlayConfig
  theme: string
  onSendToGenerator: (composedImageBase64: string) => void
}

type ExportState = 'idle' | 'loading' | 'done' | 'error'

async function capturePreview(previewRef: React.RefObject<HTMLDivElement>): Promise<string | null> {
  const el = previewRef.current
  if (!el) return null
  // Dynamically import to avoid SSR issues
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(el, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    scale: 2,
  })
  return canvas.toDataURL('image/png')
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-xl border flex items-center gap-2 transition-all ${
        type === 'success'
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : 'bg-red-500/15 text-red-400 border-red-500/30'
      }`}
    >
      {type === 'success' ? <Check size={14} /> : null}
      {message}
    </div>
  )
}

export default function ExportPanel({
  previewRef,
  imageUrl,
  backgroundPrompt,
  overlay,
  theme,
  onSendToGenerator,
}: ExportPanelProps) {
  const [downloadState, setDownloadState] = useState<ExportState>('idle')
  const [clipboardState, setClipboardState] = useState<ExportState>('idle')
  const [draftState, setDraftState] = useState<ExportState>('idle')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDownload = async () => {
    setDownloadState('loading')
    try {
      const dataUrl = await capturePreview(previewRef)
      if (!dataUrl) throw new Error('Capture failed')

      const dateStr = new Date().toISOString().slice(0, 10)
      const safeName = (theme || 'studio').toLowerCase().replace(/[^a-z0-9]/g, '-')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `joola-studio-${safeName}-${dateStr}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setDownloadState('done')
      setTimeout(() => setDownloadState('idle'), 2000)
    } catch {
      setDownloadState('error')
      showToast('Download failed — try again', 'error')
      setTimeout(() => setDownloadState('idle'), 2000)
    }
  }

  const handleCopyToClipboard = async () => {
    setClipboardState('loading')
    try {
      const dataUrl = await capturePreview(previewRef)
      if (!dataUrl) throw new Error('Capture failed')

      const res = await fetch(dataUrl)
      const blob = await res.blob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setClipboardState('done')
      showToast('Copied to clipboard!')
      setTimeout(() => setClipboardState('idle'), 2000)
    } catch {
      setClipboardState('error')
      showToast('Clipboard copy failed — try Download instead', 'error')
      setTimeout(() => setClipboardState('idle'), 2000)
    }
  }

  const handleSendToVideo = async () => {
    try {
      const dataUrl = await capturePreview(previewRef)
      if (dataUrl) {
        onSendToGenerator(dataUrl)
        showToast('Sending to Post Generator...')
      }
    } catch {
      showToast('Failed to capture image', 'error')
    }
  }

  const handleSaveDraft = async () => {
    setDraftState('loading')
    try {
      const { error } = await supabase.from('joola_ig_generated_posts').insert({
        image_url: imageUrl,
        image_prompt: backgroundPrompt,
        theme: theme || null,
        status: 'draft',
        caption: null,
        hashtags: [],
      })
      if (error) throw error
      setDraftState('done')
      showToast('Saved to drafts!')
      setTimeout(() => setDraftState('idle'), 2500)
    } catch {
      setDraftState('error')
      showToast('Save failed — check Supabase connection', 'error')
      setTimeout(() => setDraftState('idle'), 2000)
    }
  }

  const buttons = [
    {
      icon: Download,
      label: downloadState === 'loading' ? 'Exporting...' : downloadState === 'done' ? 'Downloaded!' : 'Download PNG',
      onClick: handleDownload,
      state: downloadState,
      className: 'bg-[#1a5cff]/15 hover:bg-[#1a5cff]/25 text-[#7ca9ff] border border-[#1a5cff]/25',
    },
    {
      icon: Clipboard,
      label: clipboardState === 'loading' ? 'Copying...' : clipboardState === 'done' ? 'Copied!' : 'Copy to Clipboard',
      onClick: handleCopyToClipboard,
      state: clipboardState,
      className: 'bg-[#13131a] hover:bg-[#1e1e2e] text-[#94a3b8] hover:text-white border border-[#1e1e2e]',
    },
    {
      icon: Clapperboard,
      label: 'Send to Video',
      onClick: handleSendToVideo,
      state: 'idle' as ExportState,
      className: 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/25',
    },
    {
      icon: BookmarkPlus,
      label: draftState === 'loading' ? 'Saving...' : draftState === 'done' ? 'Saved!' : 'Save to Drafts',
      onClick: handleSaveDraft,
      state: draftState,
      className: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/25',
    },
  ]

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-bold text-white">Export</h4>

        <div className="grid grid-cols-2 gap-2.5">
          {buttons.map(({ icon: Icon, label, onClick, state, className }) => (
            <button
              key={label}
              onClick={onClick}
              disabled={state === 'loading'}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-medium transition-all disabled:opacity-50 ${className} ${
                state === 'done' ? 'opacity-80' : ''
              }`}
            >
              {state === 'loading' ? (
                <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : state === 'done' ? (
                <Check size={13} />
              ) : (
                <Icon size={13} />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
