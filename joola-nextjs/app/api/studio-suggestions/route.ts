import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type Suggestion = {
  emoji: string
  prompt: string
  description: string
  postCount: number
  avgEngagement: number
  isCustom: boolean
}

type AnalysisRow = {
  setting: string
  shot_type: string
  sentiment_tone: string
  content_theme: string
  joola_ig_posts: { engagement_rate: number }
}

// Hardcoded suggestions always appended
const HARDCODED: Suggestion[] = [
  {
    emoji: '🇮🇳',
    prompt:
      'Indian cricket stadium at night, orange and green lights, confetti falling, packed crowd, festive electric atmosphere, IPBL launch energy, bokeh lights',
    description: 'Indian stadium, orange-green lights, confetti',
    postCount: 0,
    avgEngagement: 0,
    isCustom: true,
  },
  {
    emoji: '🤍',
    prompt:
      'Pure white studio background, seamless white sweep, clean minimalist, soft even lighting, professional product shot',
    description: 'Pure white studio, clean minimalist',
    postCount: 0,
    avgEngagement: 0,
    isCustom: true,
  },
]

const SETTING_EMOJI: Record<string, string> = {
  'outdoor court': '🏆',
  studio: '🎬',
  'indoor stadium': '🏟️',
  beach: '🌅',
  lifestyle: '🌅',
  tournament: '⚡',
  gym: '💪',
  urban: '🏙️',
  nature: '🌿',
}

function getEmoji(setting: string): string {
  const lower = setting.toLowerCase()
  for (const [key, emoji] of Object.entries(SETTING_EMOJI)) {
    if (lower.includes(key)) return emoji
  }
  return '✨'
}

function buildPrompt(setting: string, shotType: string, sentimentTone: string): string {
  const shotMap: Record<string, string> = {
    action: 'dynamic action blur, motion energy',
    close_up: 'tight close-up, sharp detail',
    wide: 'wide establishing shot',
    overhead: 'flat lay overhead perspective',
    portrait: 'portrait composition',
  }
  const toneMap: Record<string, string> = {
    positive: 'vibrant warm tones',
    negative: 'dramatic moody tones',
    neutral: 'balanced neutral lighting',
    excited: 'electric high-energy atmosphere',
    inspiring: 'golden inspirational light',
  }
  const shotDetail = shotMap[shotType?.toLowerCase()] ?? 'professional composition'
  const toneDetail = toneMap[sentimentTone?.toLowerCase()] ?? 'natural lighting'
  return `${setting}, ${shotDetail}, ${toneDetail}, premium sports brand photography, HD quality`
}

function mode(arr: string[]): string {
  if (!arr.length) return ''
  const counts: Record<string, number> = {}
  for (const v of arr) counts[v] = (counts[v] || 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
}

export async function GET() {
  try {
    // Fetch top 20 analysis rows joined with post engagement
    const { data: rows, error } = await supabaseServer
      .from('joola_ig_post_analysis')
      .select('setting, shot_type, sentiment_tone, content_theme, joola_ig_posts!inner(engagement_rate)')
      .limit(20)
      .returns<AnalysisRow[]>()

    if (error) throw error

    // Group by setting
    const grouped: Record<
      string,
      { count: number; totalEngagement: number; shotTypes: string[]; themes: string[]; sentiments: string[] }
    > = {}

    for (const row of rows ?? []) {
      const setting = (row.setting ?? 'outdoor court').toLowerCase().trim()
      if (!grouped[setting]) {
        grouped[setting] = { count: 0, totalEngagement: 0, shotTypes: [], themes: [], sentiments: [] }
      }
      const g = grouped[setting]
      g.count++
      g.totalEngagement += row.joola_ig_posts?.engagement_rate ?? 0
      if (row.shot_type) g.shotTypes.push(row.shot_type)
      if (row.content_theme) g.themes.push(row.content_theme)
      if (row.sentiment_tone) g.sentiments.push(row.sentiment_tone)
    }

    // Sort by avg engagement desc, take top 4 for data-driven suggestions
    const dataSuggestions: Suggestion[] = Object.entries(grouped)
      .map(([setting, g]) => ({
        emoji: getEmoji(setting),
        prompt: buildPrompt(setting, mode(g.shotTypes), mode(g.sentiments)),
        description: `${setting.charAt(0).toUpperCase() + setting.slice(1)}, ${mode(g.shotTypes) || 'action'} shot`,
        postCount: g.count,
        avgEngagement: parseFloat((g.totalEngagement / g.count).toFixed(2)),
        isCustom: false,
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 4)

    // Merge with hardcoded
    const suggestions: Suggestion[] = [...dataSuggestions, ...HARDCODED].slice(0, 6)

    // If we didn't get enough from DB, pad with hardcoded fallbacks
    if (suggestions.length < 4) {
      const fallbacks: Suggestion[] = [
        {
          emoji: '🏆',
          prompt: 'Outdoor pickleball court, golden hour sunlight, action blur, premium sports atmosphere',
          description: 'Outdoor court, golden hour sunlight',
          postCount: 0,
          avgEngagement: 0,
          isCustom: true,
        },
        {
          emoji: '🎬',
          prompt: 'Dark studio, single spotlight on product, smoke effect, cinematic product photography',
          description: 'Dark studio, spotlight, smoke effect',
          postCount: 0,
          avgEngagement: 0,
          isCustom: true,
        },
        {
          emoji: '⚡',
          prompt: 'Indoor tournament court, electric blue atmosphere, crowd blur, championship energy',
          description: 'Tournament court, electric atmosphere',
          postCount: 0,
          avgEngagement: 0,
          isCustom: true,
        },
        {
          emoji: '🌅',
          prompt: 'Beach lifestyle setting, warm golden tones, natural light, relaxed premium feel',
          description: 'Beach lifestyle, warm natural light',
          postCount: 0,
          avgEngagement: 0,
          isCustom: true,
        },
      ]
      while (suggestions.length < 6 && fallbacks.length > 0) {
        suggestions.push(fallbacks.shift()!)
      }
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('[studio-suggestions]', error)
    // Return only hardcoded on failure
    const fallbacks: Suggestion[] = [
      { emoji: '🏆', prompt: 'Outdoor pickleball court, golden hour sunlight, action blur, premium sports atmosphere', description: 'Outdoor court, golden hour sunlight', postCount: 0, avgEngagement: 0, isCustom: true },
      { emoji: '🎬', prompt: 'Dark studio, single spotlight on product, smoke effect, cinematic product photography', description: 'Dark studio, spotlight, smoke effect', postCount: 0, avgEngagement: 0, isCustom: true },
      { emoji: '🏟️', prompt: 'Indoor stadium, dramatic overhead lighting, crowd bokeh, championship atmosphere', description: 'Indoor stadium, dramatic lighting', postCount: 0, avgEngagement: 0, isCustom: true },
      { emoji: '⚡', prompt: 'Tournament court, electric blue atmosphere, crowd blur, championship energy', description: 'Tournament court, electric atmosphere', postCount: 0, avgEngagement: 0, isCustom: true },
      ...HARDCODED,
    ]
    return NextResponse.json({ suggestions: fallbacks.slice(0, 6) })
  }
}
