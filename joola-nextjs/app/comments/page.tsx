import { supabase } from '@/lib/supabase'
import CommentsClient from './CommentsClient'
import type { IgComment, IgCommentAnalysis } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CommentsPage() {
  const [{ data: comments }, { data: analysis }, { data: posts }] = await Promise.all([
    supabase
      .from('joola_ig_comments')
      .select('*')
      .order('commented_at', { ascending: false })
      .returns<IgComment[]>(),
    supabase
      .from('joola_ig_comment_analysis')
      .select('comment_id, sentiment, sentiment_score, primary_topic, emotion, is_question, is_complaint, purchase_intent')
      .returns<Pick<IgCommentAnalysis, 'comment_id' | 'sentiment' | 'sentiment_score' | 'primary_topic' | 'emotion' | 'is_question' | 'is_complaint' | 'purchase_intent'>[]>(),
    supabase
      .from('joola_ig_posts')
      .select('post_id, post_url')
      .returns<{ post_id: string; post_url: string }[]>(),
  ])

  const allComments = comments ?? []
  const allAnalysis = analysis ?? []
  const postUrlMap = new Map((posts ?? []).map((p) => [p.post_id, p.post_url]))

  // Join analysis + post_url onto comments
  const analysisMap = new Map(allAnalysis.map((a) => [a.comment_id, a]))
  const enriched = allComments.map((c) => ({
    ...c,
    ...analysisMap.get(c.comment_id),
    post_url: postUrlMap.get(c.post_id) ?? undefined,
  }))

  // Sentiment distribution
  const sentimentCounts: Record<string, number> = {}
  for (const a of allAnalysis) {
    const s = (a.sentiment || 'unknown').toLowerCase()
    sentimentCounts[s] = (sentimentCounts[s] || 0) + 1
  }
  const sentimentData = Object.entries(sentimentCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))

  // Topic distribution (top 6)
  const topicCounts: Record<string, number> = {}
  for (const a of allAnalysis) {
    if (a.primary_topic) {
      topicCounts[a.primary_topic] = (topicCounts[a.primary_topic] || 0) + 1
    }
  }
  const topicData = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }))

  const uniqueUsers = new Set(allComments.map((c) => c.username)).size
  const questionsCount = allAnalysis.filter((a) => a.is_question).length
  const purchaseIntentCount = allAnalysis.filter((a) => a.purchase_intent).length

  return (
    <CommentsClient
      comments={enriched}
      sentimentData={sentimentData}
      topicData={topicData}
      totalComments={allComments.length}
      uniqueUsers={uniqueUsers}
      questionsCount={questionsCount}
      purchaseIntentCount={purchaseIntentCount}
    />
  )
}
