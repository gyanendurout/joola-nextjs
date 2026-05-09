import { supabase } from '@/lib/supabase'
import ContentClient from './ContentClient'
import type { IgPost, IgPostAnalysis, IgHashtagPerformance } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ContentPage() {
  const [{ data: posts }, { data: analysis }, { data: hashtags }] = await Promise.all([
    supabase
      .from('joola_ig_posts')
      .select('post_id, post_type, like_count, comment_count, engagement_rate, posted_at, thumbnail_url, post_url')
      .order('engagement_rate', { ascending: false })
      .returns<Pick<IgPost, 'post_id' | 'post_type' | 'like_count' | 'comment_count' | 'engagement_rate' | 'posted_at' | 'thumbnail_url' | 'post_url'>[]>(),
    supabase
      .from('joola_ig_post_analysis')
      .select('post_id, content_theme')
      .returns<Pick<IgPostAnalysis, 'post_id' | 'content_theme'>[]>(),
    supabase
      .from('joola_ig_hashtag_performance')
      .select('*')
      .order('avg_engagement_rate', { ascending: false })
      .returns<IgHashtagPerformance[]>(),
  ])

  const allPosts = posts ?? []
  const allAnalysis = analysis ?? []

  // post_id → post_url map
  const postUrlMap = new Map(allPosts.map((p) => [p.post_id, p.post_url]))

  // Post type performance
  const typeStats: Record<string, { likes: number[]; comments: number[] }> = {}
  for (const p of allPosts) {
    const t = (p.post_type || 'unknown').toLowerCase()
    if (!typeStats[t]) typeStats[t] = { likes: [], comments: [] }
    if (p.like_count) typeStats[t].likes.push(p.like_count)
    if (p.comment_count) typeStats[t].comments.push(p.comment_count)
  }
  const postTypeData = Object.entries(typeStats).map(([name, stats]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    avg_likes: stats.likes.length > 0 ? Math.round(stats.likes.reduce((a, b) => a + b, 0) / stats.likes.length) : 0,
    avg_comments: stats.comments.length > 0 ? Math.round(stats.comments.reduce((a, b) => a + b, 0) / stats.comments.length) : 0,
  }))

  // Normalize engagement_rate to percentage scale (0–100).
  // DB may store values as decimal fractions (0.05 = 5%) or as percentages (5.0 = 5%).
  // Values < 1 are treated as decimal fractions and multiplied by 100.
  const normalizeRate = (r: number | null | undefined): number => {
    if (!r) return 0
    return r < 1 ? r * 100 : r
  }

  // Content theme performance — track best post per theme
  const analysisMap = new Map(allAnalysis.map((a) => [a.post_id, a.content_theme]))
  const themeStats: Record<string, { engagement: number[]; count: number; bestPostId?: string; bestEngagement: number }> = {}
  for (const p of allPosts) {
    const theme = analysisMap.get(p.post_id)
    if (!theme) continue
    if (!themeStats[theme]) themeStats[theme] = { engagement: [], count: 0, bestEngagement: 0 }
    const normalizedRate = normalizeRate(p.engagement_rate)
    if (normalizedRate > 0) themeStats[theme].engagement.push(normalizedRate)
    themeStats[theme].count++
    if (normalizedRate > themeStats[theme].bestEngagement) {
      themeStats[theme].bestEngagement = normalizedRate
      themeStats[theme].bestPostId = p.post_id
    }
  }
  const themeData = Object.entries(themeStats)
    .map(([name, stats]) => ({
      name,
      avg_engagement: stats.engagement.length > 0
        ? +(stats.engagement.reduce((a, b) => a + b, 0) / stats.engagement.length).toFixed(2)
        : 0,
      count: stats.count,
      best_post_url: stats.bestPostId ? postUrlMap.get(stats.bestPostId) ?? undefined : undefined,
    }))
    .sort((a, b) => b.avg_engagement - a.avg_engagement)
    .slice(0, 12)

  // Enrich hashtags with best_post_url
  const enrichedHashtags = (hashtags ?? []).map((h) => ({
    ...h,
    best_post_url: h.best_post_id ? postUrlMap.get(h.best_post_id) ?? undefined : undefined,
  }))

  const top10Posts = allPosts.slice(0, 10)

  return (
    <ContentClient
      hashtags={enrichedHashtags}
      top10Posts={top10Posts}
      postTypeData={postTypeData}
      themeData={themeData}
    />
  )
}
