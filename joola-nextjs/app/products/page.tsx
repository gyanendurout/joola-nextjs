import { supabase } from '@/lib/supabase'
import ProductsClient from './ProductsClient'
import type { IgProductMention, IgAthleteMention } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const MIN_POSTS_FOR_AVG = 2

function buildEngagementChart<T extends { post_id: string }>(
  mentions: T[],
  nameKey: keyof T,
  postEngagement: Map<string, number>,
) {
  const seenPosts: Record<string, Set<string>> = {}
  const sums: Record<string, number> = {}
  for (const m of mentions) {
    const name = (m[nameKey] as string) || ''
    if (!name || !m.post_id) continue
    if (!seenPosts[name]) seenPosts[name] = new Set()
    if (seenPosts[name].has(m.post_id)) continue
    seenPosts[name].add(m.post_id)
    sums[name] = (sums[name] || 0) + (postEngagement.get(m.post_id) || 0)
  }
  return Object.entries(seenPosts)
    .filter(([, posts]) => posts.size >= MIN_POSTS_FOR_AVG)
    .map(([name, posts]) => ({
      name,
      avgEngagement: Number(((sums[name] / posts.size) * 100).toFixed(2)),
      postCount: posts.size,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 10)
}

export default async function ProductsPage() {
  const [{ data: products }, { data: athletes }, { data: posts }] = await Promise.all([
    supabase
      .from('joola_ig_product_mentions')
      .select('*')
      .returns<IgProductMention[]>(),
    supabase
      .from('joola_ig_athlete_mentions')
      .select('*')
      .returns<IgAthleteMention[]>(),
    supabase
      .from('joola_ig_posts')
      .select('post_id, engagement_rate')
      .returns<{ post_id: string; engagement_rate: number }[]>(),
  ])

  const allProducts = products ?? []
  const allAthletes = athletes ?? []
  const postEngagement = new Map((posts ?? []).map((p) => [p.post_id, p.engagement_rate || 0]))

  // Product counts (top 10)
  const productCounts: Record<string, number> = {}
  for (const p of allProducts) {
    if (p.product_name) productCounts[p.product_name] = (productCounts[p.product_name] || 0) + 1
  }
  const productChartData = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  // Athlete counts (top 10)
  const athleteCounts: Record<string, number> = {}
  for (const a of allAthletes) {
    if (a.athlete_name) athleteCounts[a.athlete_name] = (athleteCounts[a.athlete_name] || 0) + 1
  }
  const athleteChartData = Object.entries(athleteCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  const productEngagementData = buildEngagementChart(allProducts, 'product_name', postEngagement)
  const athleteEngagementData = buildEngagementChart(allAthletes, 'athlete_name', postEngagement)

  return (
    <ProductsClient
      products={allProducts}
      athletes={allAthletes}
      productChartData={productChartData}
      athleteChartData={athleteChartData}
      productEngagementData={productEngagementData}
      athleteEngagementData={athleteEngagementData}
    />
  )
}
