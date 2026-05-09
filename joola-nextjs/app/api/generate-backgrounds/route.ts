import { NextResponse } from 'next/server'

type GenerateRequest = {
  imageBase64: string
  backgroundPrompt: string
  count: number
  style: string
  aspectRatio: string
}

const STYLE_MODIFIERS: Record<string, string> = {
  photorealistic: 'photorealistic, natural lighting, high detail',
  studio: 'clean studio background, white or neutral gradient, professional product photography',
  cinematic: 'cinematic color grade, dramatic lighting, film still, anamorphic lens',
  lifestyle: 'lifestyle photography, natural environment, candid feel, warm tones',
  dark_moody: 'dark moody tones, deep shadows, low key lighting, rich contrast',
  bright_energetic: 'bright vibrant colors, high energy, saturated, dynamic composition',
}

const ASPECT_RATIO_SIZES: Record<string, string> = {
  '1:1': '1080x1080',
  '4:5': '1080x1350',
  '16:9': '1920x1080',
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const withoutPrefix = base64.replace(/^data:image\/\w+;base64,/, '')
  const buf = Buffer.from(withoutPrefix, 'base64')
  // Copy into a plain ArrayBuffer so TypeScript is satisfied
  const ab = new ArrayBuffer(buf.byteLength)
  new Uint8Array(ab).set(buf)
  return ab
}

export async function POST(request: Request) {
  try {
    if (!process.env.PHOTOROOM_API_KEY || process.env.PHOTOROOM_API_KEY === 'your_photoroom_api_key') {
      return NextResponse.json({ error: 'PHOTOROOM_API_KEY_MISSING' }, { status: 400 })
    }

    const body = await request.json() as GenerateRequest
    const { imageBase64, backgroundPrompt, count, style, aspectRatio } = body

    if (!imageBase64 || !backgroundPrompt) {
      return NextResponse.json({ error: 'imageBase64 and backgroundPrompt are required' }, { status: 400 })
    }

    const safeCount = Math.min(Math.max(Number(count) || 6, 1), 12)
    const styleModifier = STYLE_MODIFIERS[style] ?? STYLE_MODIFIERS.photorealistic
    const outputSize = ASPECT_RATIO_SIZES[aspectRatio] ?? '1080x1080'
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] ?? 'image/png'
    const imageAb = base64ToArrayBuffer(imageBase64)

    // Run all Photoroom calls in parallel
    const results = await Promise.all(
      Array.from({ length: safeCount }).map(async (_, i) => {
        const formData = new FormData()

        const blob = new Blob([imageAb], { type: mimeType })
        formData.append('imageFile', blob, 'product.jpg')

        const fullPrompt = `${backgroundPrompt}. ${styleModifier}. Professional product photography. HD quality. Variation ${i + 1} of ${safeCount}.`
        formData.append('background.prompt', fullPrompt)
        formData.append('outputSize', outputSize)
        formData.append('padding', '0.1')
        formData.append('shadow.mode', 'ai.soft')

        const response = await fetch('https://image-api.photoroom.com/v2/edit', {
          method: 'POST',
          headers: { 'x-api-key': process.env.PHOTOROOM_API_KEY! },
          body: formData,
        })

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`Photoroom error (variation ${i + 1}): ${response.status} — ${errText.slice(0, 200)}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const base64Result = Buffer.from(arrayBuffer).toString('base64')
        return `data:image/png;base64,${base64Result}`
      })
    )

    return NextResponse.json({ images: results })
  } catch (error) {
    console.error('[generate-backgrounds]', error)
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
