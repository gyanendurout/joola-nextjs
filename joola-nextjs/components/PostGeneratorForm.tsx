'use client'

import { useRef, useState } from 'react'
import { Sparkles, Loader2, Upload, X } from 'lucide-react'
import type { FormInputs } from '@/app/generate/types'

const THEMES = [
  'Product Launch',
  'Tournament Coverage',
  'Athlete Feature',
  'Educational/Tips',
  'Community',
  'Lifestyle',
  'Giveaway',
  'General Announcement',
]

const TONES = [
  'Exciting & Hype',
  'Motivational',
  'Informative',
  'Playful',
  'Inspirational',
]

const FORMATS = [
  { key: 'photo', label: 'Photo' },
  { key: 'carousel', label: 'Carousel' },
  { key: 'reel', label: 'Reel' },
]

const CAPTION_LENGTHS = [
  { key: 'short', label: 'Short', sub: '<80 chars' },
  { key: 'medium', label: 'Medium', sub: '80–200' },
  { key: 'long', label: 'Long', sub: '200+' },
]

const DATA_OPTIONS: { key: keyof FormInputs; label: string }[] = [
  { key: 'useHistoricalData', label: 'Use top performing posts as style reference' },
  { key: 'useTopHashtags', label: 'Use top performing hashtags from my data' },
  { key: 'usePostingTime', label: 'Match best posting time from my data' },
  { key: 'useCaptionStructure', label: 'Match best performing caption structure' },
]

interface PostGeneratorFormProps {
  inputs: FormInputs
  onChange: (inputs: FormInputs) => void
  onGenerate: () => void
  isGenerating: boolean
  generatingStep: string
}

export default function PostGeneratorForm({
  inputs,
  onChange,
  onGenerate,
  isGenerating,
  generatingStep,
}: PostGeneratorFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof FormInputs>(key: K, value: FormInputs[K]) =>
    onChange({ ...inputs, [key]: value })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      alert('Image must be under 4MB')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => set('referenceImage', reader.result as string)
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    set('referenceImage', undefined)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const canGenerate = inputs.topic.trim().length > 0 && inputs.theme.length > 0 && inputs.format.length > 0
  const [showValidation, setShowValidation] = useState(false)

  const handleGenerateClick = () => {
    if (!canGenerate) {
      setShowValidation(true)
      return
    }
    setShowValidation(false)
    onGenerate()
  }

  return (
    <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5 space-y-5 sticky top-4">
      <div>
        <h2 className="text-base font-bold text-white">Create New Post</h2>
        <p className="text-xs text-[#64748b] mt-0.5">AI-powered from your historical data</p>
      </div>

      {/* Topic */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#94a3b8]">
          What is this post about? <span className="text-red-400">*</span>
        </label>
        <textarea
          value={inputs.topic}
          onChange={(e) => set('topic', e.target.value)}
          placeholder={"Describe your post idea... e.g. 'Launch of the new Hyperion CFS 16mm paddle targeting competitive players'"}
          rows={3}
          className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-sm text-white placeholder-[#334155] focus:outline-none focus:border-[#00d4ff] transition-colors resize-none"
        />
      </div>

      {/* Product Photo Upload */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#94a3b8]">
          Product Photo <span className="text-[#475569]">(optional)</span>
        </label>
        {inputs.referenceImage ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={inputs.referenceImage}
              alt="Product photo"
              className="w-full h-32 object-cover rounded-lg border border-[#1e1e2e]"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-1.5 right-1.5 p-1 bg-[#0d0d14]/80 hover:bg-red-500/20 text-[#94a3b8] hover:text-red-400 rounded-md transition-colors"
            >
              <X size={12} />
            </button>
            <p className="text-[10px] text-emerald-400 mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Uploaded — AI will enhance this photo for Instagram
            </p>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#1e1e2e] rounded-lg cursor-pointer hover:border-[#334155] hover:bg-[#0d0d14] transition-all group">
            <Upload size={16} className="text-[#334155] group-hover:text-[#475569] mb-1.5" />
            <span className="text-xs text-[#475569] group-hover:text-[#64748b]">Upload paddle or product photo</span>
            <span className="text-[10px] text-[#334155] mt-0.5">PNG, JPG up to 4MB</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Theme */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#94a3b8]">
          Content Theme <span className="text-red-400">*</span>
        </label>
        <select
          value={inputs.theme}
          onChange={(e) => set('theme', e.target.value)}
          className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff] transition-colors"
        >
          <option value="">Select theme...</option>
          {THEMES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Format toggle */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#94a3b8]">
          Post Format <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-1.5">
          {FORMATS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => set('format', key)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border ${
                inputs.format === key
                  ? 'bg-[#1a5cff]/20 text-[#00d4ff] border-[#1a5cff]/40'
                  : 'bg-[#0a0a0f] text-[#64748b] border-[#1e1e2e] hover:text-[#94a3b8] hover:border-[#334155]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Athlete & Product */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#94a3b8]">
            Athlete <span className="text-[#475569]">(optional)</span>
          </label>
          <input
            type="text"
            value={inputs.athlete}
            onChange={(e) => set('athlete', e.target.value)}
            placeholder="e.g. Tyson McGuffin"
            className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-xs text-white placeholder-[#334155] focus:outline-none focus:border-[#00d4ff] transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#94a3b8]">
            Product <span className="text-[#475569]">(optional)</span>
          </label>
          <input
            type="text"
            value={inputs.product}
            onChange={(e) => set('product', e.target.value)}
            placeholder="e.g. Hyperion CFS 16mm"
            className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-xs text-white placeholder-[#334155] focus:outline-none focus:border-[#00d4ff] transition-colors"
          />
        </div>
      </div>

      {/* Tone */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#94a3b8]">Tone</label>
        <select
          value={inputs.tone}
          onChange={(e) => set('tone', e.target.value)}
          className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff] transition-colors"
        >
          {TONES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Caption Length toggle */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#94a3b8]">Caption Length</label>
        <div className="flex gap-1.5">
          {CAPTION_LENGTHS.map(({ key, label, sub }) => (
            <button
              key={key}
              type="button"
              onClick={() => set('captionLength', key)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border ${
                inputs.captionLength === key
                  ? 'bg-[#1a5cff]/20 text-[#00d4ff] border-[#1a5cff]/40'
                  : 'bg-[#0a0a0f] text-[#64748b] border-[#1e1e2e] hover:text-[#94a3b8] hover:border-[#334155]'
              }`}
            >
              <div>{label}</div>
              <div className="text-[9px] opacity-60 mt-0.5">{sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Historical data checkboxes */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[#94a3b8]">Pull from my historical data</label>
        <div className="space-y-2 bg-[#0d0d14] rounded-lg p-3 border border-[#1e1e2e]">
          {DATA_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={inputs[key] as boolean}
                onChange={(e) => set(key, e.target.checked as FormInputs[typeof key])}
                className="mt-0.5 w-3.5 h-3.5 rounded border border-[#334155] bg-[#0a0a0f] accent-[#1a5cff] cursor-pointer flex-shrink-0"
              />
              <span className="text-xs text-[#64748b] group-hover:text-[#94a3b8] transition-colors leading-relaxed">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={isGenerating}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-[#1a5cff] to-[#00d4ff] text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#1a5cff]/20"
        >
          {isGenerating ? (
            <>
              <Loader2 size={15} className="animate-spin flex-shrink-0" />
              <span className="truncate text-xs">{generatingStep || 'Generating...'}</span>
            </>
          ) : (
            <>
              <Sparkles size={15} />
              Generate Post
            </>
          )}
        </button>
        {showValidation && !canGenerate && (
          <p className="text-xs text-red-400 text-center">
            Please fill in{' '}
            {[
              !inputs.topic.trim() && 'Post Topic',
              !inputs.theme && 'Content Theme',
              !inputs.format && 'Post Format',
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}
