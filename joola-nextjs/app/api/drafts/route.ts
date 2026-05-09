import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('joola_ig_generated_posts')
      .select('id, topic, theme, format, tone, caption, status, created_at, posted_at, best_day, predicted_eng_min, predicted_eng_max')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return NextResponse.json({ drafts: data || [] })
  } catch (error) {
    console.error('[drafts GET]', error)
    const message = error instanceof Error ? error.message : 'Fetch failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { id: string; status: string }
    const updateData: Record<string, string> = { status: body.status }
    if (body.status === 'posted') {
      updateData.posted_at = new Date().toISOString()
    }

    const { error } = await supabaseServer
      .from('joola_ig_generated_posts')
      .update(updateData)
      .eq('id', body.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[drafts PATCH]', error)
    const message = error instanceof Error ? error.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
