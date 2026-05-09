'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Loader2, Sparkles } from 'lucide-react'
import UploadZone from '@/components/studio/UploadZone'
import SuggestionStrip from '@/components/studio/SuggestionStrip'
import BackgroundGrid, { type GeneratedImage } from '@/components/studio/BackgroundGrid'
import ImageEditor from '@/components/studio/ImageEditor'
import ExportPanel from '@/components/studio/ExportPanel'
import { DEFAULT_OVERLAY, type OverlayConfig } from '@/components/studio/TextOverlay'
import type { Suggestion } from '@/app/api/studio-suggestions/route'

// ── Types ────────────────────────────────────────────────────────────────
type AspectRatio = '1:1' | '4:5' | '16:9'
type ImageStyle =
  | 'photorealistic'
  | 'studio'
  | 'cinematic'
  | 'lifestyle'
  | 'dark_moody'
  | 'bright_energetic'

const VARIATION_OPTIONS = [4, 6, 8, 12]
const STYLE_OPTIONS: { key: ImageStyle; label: string }[] = [
  { key: 'photorealistic', label: 'Photorealistic' },
  { key: 'studio', label: 'Studio / Clean' },
  { key: 'cinematic', label: 'Cinematic / Dramatic' },
  { key: 'lifestyle', label: 'Lifestyle / Casual' },
  { key: 'dark_moody', label: 'Dark & Moody' },
  { key: 'bright_energetic', label: 'Bright & Energetic' },
]
const RATIO_OPTIONS: { key: AspectRatio; label: string }[] = [
  { key: '1:1', label: '1:1 Square' },
  { key: '4:5', label: '4:5 Portrait' },
  { key: '16:9', label: '16:9 Landscape' },
]

let imgCounter = 0
function newId() { return `img-${++imgCounter}` }

// ── Page ─────────────────────────────────────────────────────────────────
export default function StudioPage() {
  const router = useRouter()
  const previewRef = useRef<HTMLDivElement>(null!)

  // Upload state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  // Controls state
  const [backgroundPrompt, setBackgroundPrompt] = useState('')
  const [variationCount, setVariationCount] = useState(6)
  const [imageStyle, setImageStyle] = useState<ImageStyle>('photorealistic')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingCount, setGeneratingCount] = useState(0)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Results state
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)

  // Editor state
  const [overlay, setOverlay] = useState<OverlayConfig>(DEFAULT_OVERLAY)
  const [refinePrompt, setRefinePrompt] = useState('')
  const [isRegenerating, setIsRegenerating] = useState(false)

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleUpload = useCallback(async (base64: string, name: string, size: number) => {
    setUploadedImage(base64)
    setFileName(name)
    setFileSize(size)
    setImages([])
    setSelectedImage(null)

    // Fetch suggestions
    setSuggestionsLoading(true)
    try {
      const res = await fetch('/api/studio-suggestions')
      const data = await res.json() as { suggestions: Suggestion[] }
      setSuggestions(data.suggestions ?? [])
    } catch {
      setSuggestions([])
    } finally {
      setSuggestionsLoading(false)
    }
  }, [])

  const handleClearUpload = useCallback(() => {
    setUploadedImage(null)
    setFileName('')
    setFileSize(0)
    setSuggestions([])
    setImages([])
    setSelectedImage(null)
    setGenerationError(null)
  }, [])

  const runGeneration = useCallback(async (count: number, prompt: string, append = false) => {
    if (!uploadedImage) return
    if (!prompt.trim()) {
      setGenerationError('Please enter a background description before generating.')
      return
    }

    setGenerationError(null)
    setIsGenerating(true)
    setGeneratingCount(count)

    try {
      const res = await fetch('/api/generate-backgrounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: uploadedImage,
          backgroundPrompt: prompt,
          count,
          style: imageStyle,
          aspectRatio,
        }),
      })

      const data = await res.json() as { images?: string[]; error?: string }

      if (!res.ok) {
        if (data.error === 'PHOTOROOM_API_KEY_MISSING') {
          setGenerationError('Photoroom API key not configured. Add PHOTOROOM_API_KEY to .env.local.')
        } else {
          setGenerationError(data.error ?? 'Generation failed — try again')
        }
        return
      }

      const newImgs: GeneratedImage[] = (data.images ?? []).map((url) => ({
        id: newId(),
        url,
        liked: false,
        starred: false,
      }))

      setImages((prev) => (append ? [...prev, ...newImgs] : newImgs))
    } catch {
      setGenerationError('Network error — check your connection and try again')
    } finally {
      setIsGenerating(false)
      setGeneratingCount(0)
    }
  }, [uploadedImage, imageStyle, aspectRatio])

  const handleGenerate = useCallback(
    () => runGeneration(variationCount, backgroundPrompt),
    [runGeneration, variationCount, backgroundPrompt]
  )

  const handleRegenerateAll = useCallback(
    () => runGeneration(variationCount, backgroundPrompt),
    [runGeneration, variationCount, backgroundPrompt]
  )

  const handleGenerateMore = useCallback(
    () => runGeneration(4, backgroundPrompt, true),
    [runGeneration, backgroundPrompt]
  )

  const handleRegenerateOne = useCallback(async () => {
    if (!uploadedImage || !selectedImage) return
    const prompt = refinePrompt || backgroundPrompt
    setIsRegenerating(true)
    try {
      const res = await fetch('/api/generate-backgrounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: uploadedImage,
          backgroundPrompt: prompt,
          count: 1,
          style: imageStyle,
          aspectRatio,
        }),
      })
      const data = await res.json() as { images?: string[] }
      const [newUrl] = data.images ?? []
      if (newUrl) {
        const updated: GeneratedImage = { ...selectedImage, url: newUrl, id: newId() }
        setImages((prev) => prev.map((img) => (img.id === selectedImage.id ? updated : img)))
        setSelectedImage(updated)
      }
    } finally {
      setIsRegenerating(false)
    }
  }, [uploadedImage, selectedImage, refinePrompt, backgroundPrompt, imageStyle, aspectRatio])

  const handleGenerateFourMore = useCallback(
    () => runGeneration(4, refinePrompt || backgroundPrompt, true),
    [runGeneration, refinePrompt, backgroundPrompt]
  )

  const handleToggleLike = useCallback((id: string) => {
    setImages((prev) => prev.map((img) => img.id === id ? { ...img, liked: !img.liked } : img))
  }, [])

  const handleToggleStar = useCallback((id: string) => {
    setImages((prev) => prev.map((img) => img.id === id ? { ...img, starred: !img.starred } : img))
  }, [])

  const handleSelectImage = useCallback((img: GeneratedImage) => {
    setSelectedImage(img)
    setRefinePrompt(backgroundPrompt)
    setOverlay(DEFAULT_OVERLAY)
    // Scroll to editor
    setTimeout(() => {
      document.getElementById('studio-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [backgroundPrompt])

  const handleSendToGenerator = useCallback((composedBase64: string) => {
    // Store in sessionStorage so /generate can pick it up
    sessionStorage.setItem('studio_composed_image', composedBase64)
    router.push('/generate')
  }, [router])

  return (
    <div className="space-y-6">

      {/* ── Page header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ImagePlus size={22} className="text-[#00d4ff]" />
          Background Studio
        </h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          Drop your product photo — AI generates scroll-stopping backgrounds powered by Photoroom
        </p>
      </div>

      {/* ── SECTION 1: Upload + Controls ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Card 1 — Upload */}
        <UploadZone
          image={uploadedImage}
          fileName={fileName}
          fileSize={fileSize}
          onUpload={handleUpload}
          onClear={handleClearUpload}
        />

        {/* Card 2 — Background context */}
        <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4 space-y-3 flex flex-col">
          <div>
            <label className="text-sm font-bold text-white">Describe the Background</label>
            <p className="text-[11px] text-[#64748b] mt-0.5">Or click a suggestion below ↓</p>
          </div>
          <textarea
            value={backgroundPrompt}
            onChange={(e) => setBackgroundPrompt(e.target.value)}
            rows={7}
            placeholder={`Describe the background you want...\ne.g. Indian cricket stadium at night, orange and green lights, confetti falling, packed crowd, festive electric atmosphere`}
            className="flex-1 w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-sm text-white placeholder-[#334155] focus:outline-none focus:border-[#00d4ff] transition-colors resize-none"
          />
          <div className="flex justify-end">
            <span className={`text-[10px] ${backgroundPrompt.length > 500 ? 'text-amber-400' : 'text-[#475569]'}`}>
              {backgroundPrompt.length} chars
            </span>
          </div>
        </div>

        {/* Card 3 — Settings */}
        <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4 space-y-4 flex flex-col">
          <h2 className="text-sm font-bold text-white">Generation Settings</h2>

          {/* Variations */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#94a3b8] font-medium">How many backgrounds?</label>
            <div className="flex gap-1.5">
              {VARIATION_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setVariationCount(n)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                    variationCount === n
                      ? 'bg-[#1a5cff]/20 text-[#00d4ff] border-[#1a5cff]/40'
                      : 'bg-[#0a0a0f] text-[#64748b] border-[#1e1e2e] hover:text-[#94a3b8] hover:border-[#334155]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#94a3b8] font-medium">Visual Style</label>
            <select
              value={imageStyle}
              onChange={(e) => setImageStyle(e.target.value as ImageStyle)}
              className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff] transition-colors"
            >
              {STYLE_OPTIONS.map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Aspect ratio */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#94a3b8] font-medium">Output Format</label>
            <div className="flex gap-1.5">
              {RATIO_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAspectRatio(key)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-medium transition-all border ${
                    aspectRatio === key
                      ? 'bg-[#1a5cff]/20 text-[#00d4ff] border-[#1a5cff]/40'
                      : 'bg-[#0a0a0f] text-[#64748b] border-[#1e1e2e] hover:text-[#94a3b8] hover:border-[#334155]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !uploadedImage}
            className="mt-auto w-full py-3.5 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-[#1a5cff] to-[#00d4ff] text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#1a5cff]/20"
          >
            {isGenerating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Generate {variationCount} Backgrounds
              </>
            )}
          </button>

          {!uploadedImage && (
            <p className="text-center text-[10px] text-[#334155]">Upload a product image first</p>
          )}
        </div>
      </div>

      {/* Error banner */}
      {generationError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center justify-between gap-4">
          <span>{generationError}</span>
          <button
            onClick={() => setGenerationError(null)}
            className="text-red-400/60 hover:text-red-400 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── SECTION 2: Suggestions + Grid ────────────────────────── */}
      {(uploadedImage || suggestions.length > 0) && (
        <div className="space-y-5">

          {/* 2A — Suggestions strip */}
          {(suggestionsLoading || suggestions.length > 0) && (
            <SuggestionStrip
              suggestions={suggestions}
              loading={suggestionsLoading}
              onSelect={(prompt) => setBackgroundPrompt(prompt)}
            />
          )}

          {/* 2B — Grid */}
          <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Generated Backgrounds</h3>
              {images.length > 0 && (
                <span className="text-[11px] text-[#64748b]">{images.length} variation{images.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            <BackgroundGrid
              images={images}
              selectedId={selectedImage?.id ?? null}
              isGenerating={isGenerating}
              generatingCount={generatingCount}
              onSelect={handleSelectImage}
              onLike={handleToggleLike}
              onStar={handleToggleStar}
              onRegenerateAll={handleRegenerateAll}
              onGenerateMore={handleGenerateMore}
            />
          </div>
        </div>
      )}

      {/* ── SECTION 3: Editor + Export ───────────────────────────── */}
      {selectedImage && (
        <div id="studio-editor" className="space-y-5">
          <div className="flex items-center gap-3 pt-2">
            <div className="h-px flex-1 bg-[#1e1e2e]" />
            <h2 className="text-sm font-bold text-white px-3">Edit &amp; Export Selected Image</h2>
            <div className="h-px flex-1 bg-[#1e1e2e]" />
          </div>

          <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-5 space-y-5">
            <ImageEditor
              imageUrl={selectedImage.url}
              backgroundPrompt={backgroundPrompt}
              overlay={overlay}
              onOverlayChange={setOverlay}
              onRefinePromptChange={setRefinePrompt}
              onRegenerateOne={handleRegenerateOne}
              onGenerateFourMore={handleGenerateFourMore}
              isRegenerating={isRegenerating}
              previewRef={previewRef}
            />

            <ExportPanel
              previewRef={previewRef}
              imageUrl={selectedImage.url}
              backgroundPrompt={refinePrompt || backgroundPrompt}
              overlay={overlay}
              theme={imageStyle}
              onSendToGenerator={handleSendToGenerator}
            />
          </div>
        </div>
      )}
    </div>
  )
}
