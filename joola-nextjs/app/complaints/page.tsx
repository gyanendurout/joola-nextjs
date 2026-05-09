import { supabase } from '@/lib/supabase'
import ComplaintsClient from './ComplaintsClient'
import type { IgComplaintLog, IgWishlistItem } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ComplaintsPage() {
  const [{ data: complaints }, { data: wishlist }, { data: posts }] = await Promise.all([
    supabase
      .from('joola_ig_complaint_log')
      .select('*')
      .order('complained_at', { ascending: false })
      .returns<IgComplaintLog[]>(),
    supabase
      .from('joola_ig_wishlist_items')
      .select('*')
      .order('requested_at', { ascending: false })
      .returns<IgWishlistItem[]>(),
    supabase
      .from('joola_ig_posts')
      .select('post_id, post_url')
      .returns<{ post_id: string; post_url: string }[]>(),
  ])

  const postUrlMap = new Map((posts ?? []).map((p) => [p.post_id, p.post_url]))

  const allComplaints = (complaints ?? []).map((c) => ({
    ...c,
    post_url: postUrlMap.get(c.post_id) ?? undefined,
  }))
  const allWishlist = (wishlist ?? []).map((w) => ({
    ...w,
    post_url: postUrlMap.get(w.post_id) ?? undefined,
  }))

  const categoryCounts: Record<string, number> = {}
  for (const c of allComplaints) {
    if (c.complaint_category) {
      categoryCounts[c.complaint_category] = (categoryCounts[c.complaint_category] || 0) + 1
    }
  }
  const categoryData = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }))

  const categories = Object.keys(categoryCounts).sort()

  return (
    <ComplaintsClient
      allComplaints={allComplaints}
      allWishlist={allWishlist}
      categoryData={categoryData}
      categories={categories}
    />
  )
}
