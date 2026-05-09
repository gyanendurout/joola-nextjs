import { supabase } from '@/lib/supabase'
import CompetitorsClient from './CompetitorsClient'
import type { IgCompetitorMention } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CompetitorsPage() {
  const [{ data: mentions }, { data: posts }] = await Promise.all([
    supabase
      .from('joola_ig_competitor_mentions')
      .select('*')
      .order('mentioned_at', { ascending: false })
      .returns<IgCompetitorMention[]>(),
    supabase
      .from('joola_ig_posts')
      .select('post_id, post_url')
      .returns<{ post_id: string; post_url: string }[]>(),
  ])

  const postUrlMap = new Map((posts ?? []).map((p) => [p.post_id, p.post_url]))
  const allMentions = (mentions ?? []).map((m) => ({
    ...m,
    post_url: postUrlMap.get(m.post_id) ?? undefined,
  }))

  const competitorCounts: Record<string, number> = {}
  for (const m of allMentions) {
    if (m.competitor_name) {
      competitorCounts[m.competitor_name] = (competitorCounts[m.competitor_name] || 0) + 1
    }
  }
  const competitorData = Object.entries(competitorCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }))

  // Sentiment-toward-JOOLA per competitor
  const sentimentByCompetitor: Record<string, { positive: number; neutral: number; negative: number; total: number }> = {}
  for (const m of allMentions) {
    if (!m.competitor_name) continue
    const bucket = sentimentByCompetitor[m.competitor_name] ??= {
      positive: 0,
      neutral: 0,
      negative: 0,
      total: 0,
    }
    const s = (m.sentiment_toward_joola || '').toLowerCase()
    if (s === 'positive') bucket.positive++
    else if (s === 'negative') bucket.negative++
    else bucket.neutral++
    bucket.total++
  }
  const competitorSentimentData = Object.entries(sentimentByCompetitor)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 8)
    .map(([name, b]) => ({
      name,
      Positive: b.positive,
      Neutral: b.neutral,
      Negative: b.negative,
    }))

  return (
    <CompetitorsClient
      allMentions={allMentions}
      competitorData={competitorData}
      competitorSentimentData={competitorSentimentData}
    />
  )
}
