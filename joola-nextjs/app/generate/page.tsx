'use client'

import { useState, useCallback } from 'react'
import { Sparkles } from 'lucide-react'
import PostGeneratorForm from '@/components/PostGeneratorForm'
import GeneratedPostOutput from '@/components/GeneratedPostOutput'
import WinningPostsReference from '@/components/WinningPostsReference'
import DraftHistory from '@/components/DraftHistory'
import type { FormInputs, GeneratePostResponse } from './types'

const DEFAULT_INPUTS: FormInputs = {
  topic: '',
  theme: '',
  format: 'photo',
  athlete: '',
  product: '',
  tone: 'Exciting & Hype',
  captionLength: 'medium',
  useHistoricalData: true,
  useTopHashtags: true,
  usePostingTime: true,
  useCaptionStructure: true,
}

const GENERATING_STEPS = [
  'Analyzing your top posts...',
  'Identifying winning patterns...',
  'Generating image...',
  'Writing caption...',
  'Calculating best posting time...',
]

export default function GeneratePage() {
  const [inputs, setInputs] = useState<FormInputs>(DEFAULT_INPUTS)
  const [output, setOutput] = useState<GeneratePostResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingStep, setGeneratingStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
  const [draftsRefresh, setDraftsRefresh] = useState(0)

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setError(null)
    setCurrentDraftId(null)

    let stepIdx = 0
    setGeneratingStep(GENERATING_STEPS[0])
    const stepInterval = setInterval(() => {
      stepIdx = (stepIdx + 1) % GENERATING_STEPS.length
      setGeneratingStep(GENERATING_STEPS[stepIdx])
    }, 3500)

    try {
      const response = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      })
      const data = await response.json() as GeneratePostResponse & { error?: string }

      if (!response.ok) {
        setError(data.error === 'OPENAI_API_KEY_MISSING' ? 'OPENAI_API_KEY_MISSING' : (data.error || 'Generation failed'))
        return
      }
      setOutput(data)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      clearInterval(stepInterval)
      setIsGenerating(false)
      setGeneratingStep('')
    }
  }, [inputs])

  const handleSaveDraft = useCallback(async () => {
    if (!output) return
    const resp = await fetch('/api/save-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: inputs.topic,
        theme: inputs.theme,
        format: inputs.format,
        tone: inputs.tone,
        caption: output.caption,
        hashtags: output.hashtags,
        image: output.image,
        postingIntelligence: output.postingIntelligence,
        whyThisWorks: output.whyThisWorks,
        referencePostIds: output.referencePostIds,
      }),
    })
    const data = await resp.json() as { id?: string }
    if (data.id) {
      setCurrentDraftId(data.id)
      setDraftsRefresh((n) => n + 1)
    }
  }, [inputs, output])

  const handleMarkAsPosted = useCallback(async (draftId: string) => {
    await fetch('/api/drafts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: draftId, status: 'posted' }),
    })
    setDraftsRefresh((n) => n + 1)
  }, [])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles size={22} className="text-[#00d4ff]" />
          Post Generator
        </h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          AI-powered Instagram post concepts — built from your top performing content
        </p>
      </div>

      {/* OpenAI key missing */}
      {error === 'OPENAI_API_KEY_MISSING' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-400 leading-relaxed">
          <span className="font-semibold">OpenAI API key required.</span> Add{' '}
          <code className="bg-[#1e1e2e] px-1.5 py-0.5 rounded text-[11px] text-amber-300">
            OPENAI_API_KEY=sk-...
          </code>{' '}
          to{' '}
          <code className="bg-[#1e1e2e] px-1.5 py-0.5 rounded text-[11px] text-amber-300">
            joola-nextjs/.env.local
          </code>{' '}
          and restart the dev server.
        </div>
      )}

      {/* General error */}
      {error && error !== 'OPENAI_API_KEY_MISSING' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between gap-4">
          <span className="text-sm text-red-400">{error}</span>
          <button
            onClick={() => void handleGenerate()}
            className="flex-shrink-0 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[30%_40%_30%] gap-5 items-start">

        {/* Left: Form */}
        <PostGeneratorForm
          inputs={inputs}
          onChange={setInputs}
          onGenerate={() => void handleGenerate()}
          isGenerating={isGenerating}
          generatingStep={generatingStep}
        />

        {/* Center: Generated output */}
        <GeneratedPostOutput
          output={output}
          isGenerating={isGenerating}
          generatingStep={generatingStep}
          onSaveDraft={handleSaveDraft}
          onMarkAsPosted={handleMarkAsPosted}
          currentDraftId={currentDraftId}
        />

        {/* Right: Reference posts */}
        <WinningPostsReference
          theme={inputs.theme}
          overridePosts={output?.referencePosts}
          overridePattern={output?.successPattern}
        />
      </div>

      {/* Draft History */}
      <DraftHistory refreshKey={draftsRefresh} />
    </div>
  )
}
