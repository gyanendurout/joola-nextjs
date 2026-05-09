import { supabase } from '@/lib/supabase'
import ProductsClient from './ProductsClient'
import type { IgProductMention, IgAthleteMention } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProductsPage() {
  const [{ data: products }, { data: athletes }] = await Promise.all([
    supabase
      .from('joola_ig_product_mentions')
      .select('*')
      .returns<IgProductMention[]>(),
    supabase
      .from('joola_ig_athlete_mentions')
      .select('*')
      .returns<IgAthleteMention[]>(),
  ])

  const allProducts = products ?? []
  const allAthletes = athletes ?? []

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

  return (
    <ProductsClient
      products={allProducts}
      athletes={allAthletes}
      productChartData={productChartData}
      athleteChartData={athleteChartData}
    />
  )
}
