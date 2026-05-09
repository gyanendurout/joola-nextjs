import { supabase } from '@/lib/supabase'
import PostsClient from './PostsClient'
import type { IgPost, IgPostAnalysis } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PostsPage() {
  const [{ data: posts }, { data: analysis }] = await Promise.all([
    supabase
      .from('joola_ig_posts')
      .select('*')
      .order('engagement_rate', { ascending: false })
      .returns<IgPost[]>(),
    supabase
      .from('joola_ig_post_analysis')
      .select('post_id, content_theme, post_intent, sentiment_tone')
      .returns<Pick<IgPostAnalysis, 'post_id' | 'content_theme' | 'post_intent' | 'sentiment_tone'>[]>(),
  ])

  // Merge analysis into posts
  const analysisMap = new Map((analysis ?? []).map((a) => [a.post_id, a]))
  const enrichedPosts = (posts ?? []).map((p) => ({
    ...p,
    ...analysisMap.get(p.post_id),
  }))

  // Unique values for filters
  const postTypes = Array.from(new Set((posts ?? []).map((p) => p.post_type).filter(Boolean)))
  const contentThemes = Array.from(new Set((analysis ?? []).map((a) => a.content_theme).filter(Boolean)))

  return (
    <PostsClient
      posts={enrichedPosts as (IgPost & Partial<IgPostAnalysis>)[]}
      postTypes={postTypes}
      contentThemes={contentThemes}
    />
  )
}
