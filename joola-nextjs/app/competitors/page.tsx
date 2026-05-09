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

  return <CompetitorsClient allMentions={allMentions} competitorData={competitorData} />
}
