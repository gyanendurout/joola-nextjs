import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      topic: string
      theme: string
      format: string
      tone: string
      caption: string
      hashtags: string[]
      image?: { url: string }
      postingIntelligence?: {
        bestDay: string
        bestTime: string
        predictedEngagementMin: number
        predictedEngagementMax: number
      }
      whyThisWorks?: string
      referencePostIds?: string[]
    }

    const { data, error } = await supabaseServer
      .from('joola_ig_generated_posts')
      .insert({
        topic: body.topic,
        theme: body.theme,
        format: body.format,
        tone: body.tone,
        caption: body.caption,
        hashtags: body.hashtags,
        image_url: body.image?.url || null,
        best_day: body.postingIntelligence?.bestDay || null,
        best_time: body.postingIntelligence?.bestTime || null,
        predicted_eng_min: body.postingIntelligence?.predictedEngagementMin ?? null,
        predicted_eng_max: body.postingIntelligence?.predictedEngagementMax ?? null,
        why_this_works: body.whyThisWorks || null,
        reference_post_ids: body.referencePostIds || [],
        status: 'draft',
      })
      .select('id')
      .single()

    if (error) throw error
    return NextResponse.json({ id: (data as { id: string }).id })
  } catch (error) {
    console.error('[save-draft]', error)
    const message = error instanceof Error ? error.message : 'Save failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
