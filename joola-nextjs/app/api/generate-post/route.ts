import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI, { toFile } from 'openai'

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
  day_of_week: string
  hour_of_day: number
  hashtags: string[]
  has_cta: boolean
  cta_text: string
  caption_length: number
  emoji_count: number
  carousel_slide_count: number
  thumbnail_url: string
  shot_type?: string
  setting?: string
}

type AnalysisRow = {
  post_id: string
  shot_type: string
  setting: string
  sentiment_tone: string
}

type HashtagRow = {
  hashtag: string
  avg_engagement_rate: number
  avg_like_count: number
  times_used: number
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      topic: string
      theme: string
      format: string
      athlete: string
      product: string
      tone: string
      captionLength: string
      referenceImage?: string // base64 data URL
    }
    const { topic, theme, format, athlete, product, tone, captionLength, referenceImage } = body

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-key-here') {
      return NextResponse.json({ error: 'OPENAI_API_KEY_MISSING' }, { status: 400 })
    }

    // ── Step 1: Get post IDs for theme ──────────────────────────────────
    const { data: analysisRows } = await supabaseServer
      .from('joola_ig_post_analysis')
      .select('post_id, shot_type, setting, sentiment_tone')
      .eq('content_theme', theme)
      .returns<AnalysisRow[]>()

    let themePostIds = (analysisRows || []).map((a) => a.post_id)
    let usingFallback = false

    if (themePostIds.length < 3) {
      const { data: allAnalysis } = await supabaseServer
        .from('joola_ig_post_analysis')
        .select('post_id')
        .returns<{ post_id: string }[]>()
      themePostIds = (allAnalysis || []).map((a) => a.post_id)
      usingFallback = true
    }

    // ── Step 2: Top posts for theme ordered by engagement ───────────────
    const idsToQuery = themePostIds.slice(0, 100)
    const { data: postsData } = idsToQuery.length > 0
      ? await supabaseServer
          .from('joola_ig_posts')
          .select('post_id, post_url, post_type, caption, like_count, comment_count, view_count, engagement_rate, posted_at, day_of_week, hour_of_day, hashtags, has_cta, cta_text, caption_length, emoji_count, carousel_slide_count, thumbnail_url')
          .in('post_id', idsToQuery)
          .order('engagement_rate', { ascending: false })
          .limit(10)
          .returns<PostRow[]>()
      : await supabaseServer
          .from('joola_ig_posts')
          .select('post_id, post_url, post_type, caption, like_count, comment_count, view_count, engagement_rate, posted_at, day_of_week, hour_of_day, hashtags, has_cta, cta_text, caption_length, emoji_count, carousel_slide_count, thumbnail_url')
          .order('engagement_rate', { ascending: false })
          .limit(10)
          .returns<PostRow[]>()

    const topPosts: PostRow[] = postsData || []
    const topPostIds = topPosts.map((p) => p.post_id)

    // Enrich posts with analysis data
    const analysisMap = new Map((analysisRows || []).map((a) => [a.post_id, a]))
    const enrichedPosts: PostRow[] = topPosts.map((p) => ({
      ...p,
      shot_type: analysisMap.get(p.post_id)?.shot_type,
      setting: analysisMap.get(p.post_id)?.setting,
    }))

    // ── Step 3: Comment emotions on top posts ────────────────────────────
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

    // ── Step 4: Top hashtags ─────────────────────────────────────────────
    const { data: hashtagData } = await supabaseServer
      .from('joola_ig_hashtag_performance')
      .select('hashtag, avg_engagement_rate, avg_like_count, times_used')
      .order('avg_engagement_rate', { ascending: false })
      .limit(20)
      .returns<HashtagRow[]>()

    // ── Step 5: Compute intelligence from top 5 posts ───────────────────
    const posts5 = enrichedPosts.slice(0, 5)

    // Best day
    const dayCounts: Record<string, { total: number; count: number }> = {}
    for (const p of posts5) {
      if (!p.day_of_week) continue
      if (!dayCounts[p.day_of_week]) dayCounts[p.day_of_week] = { total: 0, count: 0 }
      dayCounts[p.day_of_week].total += p.engagement_rate || 0
      dayCounts[p.day_of_week].count++
    }
    const bestDay = Object.entries(dayCounts)
      .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))[0]?.[0] || 'Wednesday'

    // Best hour
    const hourCounts: Record<string, { total: number; count: number }> = {}
    for (const p of posts5) {
      if (p.hour_of_day === null || p.hour_of_day === undefined) continue
      const h = String(p.hour_of_day)
      if (!hourCounts[h]) hourCounts[h] = { total: 0, count: 0 }
      hourCounts[h].total += p.engagement_rate || 0
      hourCounts[h].count++
    }
    const bestHourEntry = Object.entries(hourCounts)
      .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))[0]
    const bestHourNum = bestHourEntry ? parseInt(bestHourEntry[0]) : 10
    const h12 = bestHourNum % 12 || 12
    const ampm = bestHourNum >= 12 ? 'PM' : 'AM'
    const bestTime = `${h12}:00 ${ampm}`

    // Avg engagement
    const avgEngagement = posts5.length > 0
      ? posts5.reduce((acc, p) => acc + (p.engagement_rate || 0), 0) / posts5.length
      : 2.5

    // Avg caption length
    const captionLengths = posts5.map((p) => p.caption_length).filter((n): n is number => typeof n === 'number' && n > 0)
    const avgCaptionLength = captionLengths.length > 0
      ? Math.round(captionLengths.reduce((a, b) => a + b, 0) / captionLengths.length)
      : 150

    // Avg emoji count
    const emojiCounts = posts5.map((p) => p.emoji_count).filter((n): n is number => typeof n === 'number')
    const avgEmojiCount = emojiCounts.length > 0
      ? Math.round(emojiCounts.reduce((a, b) => a + b, 0) / emojiCounts.length)
      : 3

    // Best CTA
    const ctaTexts = posts5.filter((p) => p.has_cta && p.cta_text).map((p) => p.cta_text)
    const bestCTA = getModeValue(ctaTexts) || 'Link in bio'

    // Dominant values
    const shotTypes = posts5.map((p) => p.shot_type).filter((s): s is string => Boolean(s))
    const dominantShotType = getModeValue(shotTypes) || 'action'
    const settings = posts5.map((p) => p.setting).filter((s): s is string => Boolean(s))
    const dominantSetting = getModeValue(settings) || 'outdoor court'
    const postTypes = posts5.map((p) => p.post_type).filter(Boolean)
    const dominantPostType = getModeValue(postTypes) || format
    const days = posts5.map((p) => p.day_of_week).filter(Boolean)
    const dominantDay = getModeValue(days) || 'Wednesday'
    const hashtagArrays = posts5.map((p) => p.hashtags || [])
    const avgHashtagCount = hashtagArrays.length > 0
      ? Math.round(hashtagArrays.reduce((a, b) => a + b.length, 0) / hashtagArrays.length)
      : 10
    const carouselSlides = posts5.filter((p) => p.post_type === 'carousel' && p.carousel_slide_count > 0).map((p) => p.carousel_slide_count)
    const avgSlides = carouselSlides.length > 0
      ? Math.round(carouselSlides.reduce((a, b) => a + b, 0) / carouselSlides.length)
      : 4

    const predictedMin = parseFloat((avgEngagement * 0.85).toFixed(1))
    const predictedMax = parseFloat((avgEngagement * 1.35).toFixed(1))

    const successPattern = {
      avgCaptionLength,
      dominantHashtagCount: avgHashtagCount,
      dominantPostType,
      dominantDay,
      dominantShotType,
      dominantEmotion,
    }

    // ── Step 6: Build prompts ────────────────────────────────────────────
    const captionLengthGuide = captionLength === 'short'
      ? 'under 80 characters'
      : captionLength === 'medium'
      ? '80 to 200 characters'
      : '200+ characters with storytelling'

    const topPostExamples = posts5.slice(0, 3)
      .map((p) => `Caption: "${(p.caption || '').substring(0, 200)}..." → Engagement: ${(p.engagement_rate || 0).toFixed(2)}%`)
      .join('\n')

    const recommendedFormat = format === 'carousel'
      ? `Carousel — ${avgSlides} slides`
      : format.charAt(0).toUpperCase() + format.slice(1)

    const systemPrompt = `You are an expert Instagram content strategist for JOOLA Pickleball, a premium pickleball brand. You write captions that drive engagement based on proven data from the brand's own account history.`

    const userPrompt = `Create an Instagram caption for this post:

TOPIC: ${topic}
THEME: ${theme}
FORMAT: ${format}
TONE: ${tone}
ATHLETE: ${athlete || 'none'}
PRODUCT: ${product || 'none'}

HISTORICAL SUCCESS DATA from JOOLA's top ${usingFallback ? 'posts (theme fallback)' : `${theme} posts`}:
- Average caption length of top performers: ${avgCaptionLength} characters
- Best performing CTA: "${bestCTA}"
- Dominant emotion triggered in comments: ${dominantEmotion}
- Average engagement rate of similar posts: ${avgEngagement.toFixed(2)}%
- Most successful posts used ${avgEmojiCount} emojis on average

TOP PERFORMING POST EXAMPLES (use as style reference):
${topPostExamples}

CAPTION LENGTH REQUIREMENT: ${captionLengthGuide}

Return a JSON object with these exact fields:
{
  "caption": "the full Instagram caption",
  "hashtags": ["array", "of", "10-15", "hashtags", "without", "the", "#", "symbol"],
  "bestDay": "${bestDay}",
  "bestTime": "${bestTime}",
  "recommendedFormat": "${recommendedFormat}",
  "predictedEngagementMin": ${predictedMin},
  "predictedEngagementMax": ${predictedMax},
  "whyThisWorks": "3-5 sentence paragraph explaining why this post will perform well based on the historical data patterns"
}`

    const lightingSuffix = dominantSetting === 'outdoor court'
      ? 'natural sunlight, golden hour'
      : dominantSetting === 'studio'
      ? 'professional studio lighting, clean background'
      : 'dramatic sports lighting'

    const imagePrompt = `Professional Instagram photo for JOOLA Pickleball brand. Topic: ${topic}. Visual style: ${dominantShotType} shot, ${dominantSetting} setting.${athlete ? ` Feature a pickleball player (fictional, not a real person) in athletic pose, professional sports photography style.` : ''}${product ? ` Feature a premium pickleball paddle prominently in the composition.` : ''} Brand aesthetic: deep blue and cyan color accents, premium sports brand. Lighting: ${lightingSuffix}. Mood: ${tone}. Quality: photorealistic, HD, sharp focus, Instagram square format composition. Do NOT include any text, logos, watermarks, or real celebrity likenesses in the image.`

    // ── Step 7: Run OpenAI image + caption in parallel ───────────────────
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Build image task — edit uploaded photo OR generate from scratch
    let imageTask: Promise<{ url?: string; b64?: string }>

    if (referenceImage) {
      // User uploaded a product photo — enhance it with gpt-image-1
      const mimeType = referenceImage.match(/^data:(image\/\w+);base64,/)?.[1] ?? 'image/png'
      const base64Data = referenceImage.replace(/^data:image\/\w+;base64,/, '')
      const imageBuffer = Buffer.from(base64Data, 'base64')
      const imageFile = await toFile(imageBuffer, 'product.png', { type: mimeType })

      const editPrompt = `Transform this product photo into a stunning professional Instagram post for JOOLA Pickleball. Keep the paddle/product as the hero of the image. Apply professional sports photography styling: ${dominantShotType} composition, ${lightingSuffix} lighting, ${dominantSetting} setting. Add premium brand atmosphere with deep blue and cyan color accents. Tone: ${tone}.${athlete ? ' Include a pickleball player (fictional) in an athletic pose alongside the product.' : ''} Make it look like a top-tier sports brand Instagram post. Do NOT add any text, logos, or watermarks to the image.`

      imageTask = openai.images.edit({
        model: 'gpt-image-1',
        image: imageFile,
        prompt: editPrompt,
        size: '1024x1024',
      }).then((r) => ({
        url: r.data?.[0]?.url ?? undefined,
        b64: r.data?.[0]?.b64_json ?? undefined,
      }))
    } else {
      // No upload — generate from scratch with DALL-E 3
      const imageSize = format === 'reel' ? '1792x1024' as const : '1024x1024' as const
      imageTask = openai.images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: imageSize,
        quality: 'hd',
        style: 'natural',
      }).then((r) => ({ url: r.data?.[0]?.url ?? undefined }))
    }

    const [imageResult, chatResult] = await Promise.allSettled([
      imageTask,
      openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    ])

    // Parse image
    let imageUrl = ''
    const imageSizeLabel = referenceImage ? '1024×1024' : (format === 'reel' ? '1792×1024' : '1024×1024')
    if (imageResult.status === 'fulfilled') {
      const { url, b64 } = imageResult.value
      if (b64) {
        imageUrl = `data:image/png;base64,${b64}`
      } else if (url) {
        imageUrl = url
      }
    }

    // Parse caption JSON
    type GptData = {
      caption?: string
      hashtags?: string[]
      bestDay?: string
      bestTime?: string
      recommendedFormat?: string
      predictedEngagementMin?: number
      predictedEngagementMax?: number
      whyThisWorks?: string
    }
    let gptData: GptData = {}
    if (chatResult.status === 'fulfilled') {
      try {
        gptData = JSON.parse(chatResult.value.choices[0].message.content || '{}') as GptData
      } catch {
        gptData = {}
      }
    }

    const caption = gptData.caption || `${topic} — experience the JOOLA difference. #JOOLA #Pickleball`
    const hashtags = (gptData.hashtags || ['joola', 'pickleball', 'joolapickleball'])
      .map((h: string) => h.replace(/^#/, '').toLowerCase().trim())
      .filter(Boolean)

    // ── Step 8: Enrich hashtags with DB stats ────────────────────────────
    const { data: hashtagStatsData } = await supabaseServer
      .from('joola_ig_hashtag_performance')
      .select('hashtag, avg_engagement_rate, avg_like_count, times_used')
      .in('hashtag', hashtags)
      .returns<HashtagRow[]>()

    const hashtagStatsMap = new Map((hashtagStatsData || []).map((h) => [h.hashtag, h]))
    const hashtagsWithStats = hashtags.map((h: string) => {
      const stats = hashtagStatsMap.get(h)
      return {
        hashtag: h,
        avg_engagement_rate: stats?.avg_engagement_rate ?? 0,
        avg_like_count: stats?.avg_like_count ?? 0,
        times_used: stats?.times_used ?? 0,
      }
    })

    // Supplement with top DB hashtags if GPT returned few
    if (hashtagsWithStats.length < 5 && hashtagData) {
      const existing = new Set(hashtags)
      for (const h of (hashtagData as HashtagRow[])) {
        if (!existing.has(h.hashtag) && hashtagsWithStats.length < 12) {
          hashtagsWithStats.push({
            hashtag: h.hashtag,
            avg_engagement_rate: h.avg_engagement_rate,
            avg_like_count: h.avg_like_count,
            times_used: h.times_used,
          })
        }
      }
    }

    // ── Step 9: Return full response ─────────────────────────────────────
    return NextResponse.json({
      image: { url: imageUrl, size: imageSizeLabel },
      caption,
      hashtags,
      hashtagsWithStats,
      postingIntelligence: {
        bestDay: gptData.bestDay || bestDay,
        bestTime: gptData.bestTime || bestTime,
        recommendedFormat: gptData.recommendedFormat || recommendedFormat,
        predictedEngagementMin: gptData.predictedEngagementMin ?? predictedMin,
        predictedEngagementMax: gptData.predictedEngagementMax ?? predictedMax,
      },
      whyThisWorks: gptData.whyThisWorks || `Based on JOOLA's top ${theme} posts, this content follows proven patterns. The ${dominantShotType} visual style consistently drives ${dominantEmotion} reactions from your audience.`,
      referencePostIds: topPostIds,
      referencePosts: enrichedPosts.slice(0, 5),
      successPattern,
    })
  } catch (error) {
    console.error('[generate-post]', error)
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
