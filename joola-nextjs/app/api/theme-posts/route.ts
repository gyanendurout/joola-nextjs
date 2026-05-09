import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getModeValue(arr: string[]): string | undefined {
  if (!arr.length) return undefined
  const counts: Record<string, number> = {}
  for (const v of arr) counts[v] = (counts[v] || 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
}

type PostRow = {
  post_id: string
  post_url: string
  post_type: string
  caption: string
  like_count: number
  comment_count: number
  view_count: number
  engagement_rate: number
  posted_at: string
  thumbnail_url: string
  day_of_week: string
  hour_of_day: number
  hashtags: string[]
  caption_length: number
}

type AnalysisRow = {
  post_id: string
  shot_type: string
  setting: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const theme = searchParams.get('theme') || ''

  try {
    // Get post IDs for theme
    const { data: analysisRows } = await supabaseServer
      .from('joola_ig_post_analysis')
      .select('post_id, shot_type, setting')
      .eq('content_theme', theme)
      .returns<AnalysisRow[]>()

    let idsToQuery = (analysisRows || []).map((a) => a.post_id)

    if (idsToQuery.length === 0) {
      const { data: allAnalysis } = await supabaseServer
        .from('joola_ig_post_analysis')
        .select('post_id')
        .limit(100)
        .returns<{ post_id: string }[]>()
      idsToQuery = (allAnalysis || []).map((a) => a.post_id)
    }

    const { data: posts } = idsToQuery.length > 0
      ? await supabaseServer
          .from('joola_ig_posts')
          .select('post_id, post_url, post_type, caption, like_count, comment_count, view_count, engagement_rate, posted_at, thumbnail_url, day_of_week, hour_of_day, hashtags, caption_length')
          .in('post_id', idsToQuery.slice(0, 100))
          .order('engagement_rate', { ascending: false })
          .limit(5)
          .returns<PostRow[]>()
      : { data: [] as PostRow[] }

    const topPosts = posts || []
    const topPostIds = topPosts.map((p) => p.post_id)

    // Comment emotions
    const { data: commentData } = topPostIds.length > 0
      ? await supabaseServer
          .from('joola_ig_comment_analysis')
          .select('emotion')
          .in('post_id', topPostIds)
          .returns<{ emotion: string }[]>()
      : { data: [] as { emotion: string }[] }

    const emotionCounts: Record<string, number> = {}
    for (const c of commentData || []) {
      if (c.emotion) emotionCounts[c.emotion] = (emotionCounts[c.emotion] || 0) + 1
    }
    const dominantEmotion = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'excited'

    // Enrich posts with shot_type / setting
    const analysisMap = new Map((analysisRows || []).map((a) => [a.post_id, a]))
    const enrichedPosts = topPosts.map((p) => ({
      ...p,
      shot_type: analysisMap.get(p.post_id)?.shot_type,
      setting: analysisMap.get(p.post_id)?.setting,
    }))

    // Success pattern
    const shotTypes = enrichedPosts.map((p) => p.shot_type).filter((s): s is string => Boolean(s))
    const days = topPosts.map((p) => p.day_of_week).filter(Boolean)
    const postTypes = topPosts.map((p) => p.post_type).filter(Boolean)
    const captionLengths = topPosts.map((p) => p.caption_length).filter((n): n is number => typeof n === 'number' && n > 0)
    const hashtagCounts = topPosts.map((p) => (p.hashtags || []).length)

    const successPattern = {
      avgCaptionLength: captionLengths.length > 0
        ? Math.round(captionLengths.reduce((a, b) => a + b, 0) / captionLengths.length)
        : 0,
      dominantHashtagCount: hashtagCounts.length > 0
        ? Math.round(hashtagCounts.reduce((a, b) => a + b, 0) / hashtagCounts.length)
        : 0,
      dominantPostType: getModeValue(postTypes) || 'reel',
      dominantDay: getModeValue(days) || 'Wednesday',
      dominantShotType: getModeValue(shotTypes) || 'action',
      dominantEmotion,
    }

    return NextResponse.json({ posts: enrichedPosts, successPattern })
  } catch (error) {
    console.error('[theme-posts]', error)
    return NextResponse.json({ posts: [], successPattern: null })
  }
}
