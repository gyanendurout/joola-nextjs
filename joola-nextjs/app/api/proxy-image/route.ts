import { NextResponse } from 'next/server'

const ALLOWED_HOSTS = [
  'oaidalleapiprodscus.blob.core.windows.net',
  'dalleprodsec.blob.core.windows.net',
  'openai.com',
  'labs.openai.com',
  'cdn.openai.com',
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  const isAllowed = ALLOWED_HOSTS.some((host) => parsedUrl.hostname.endsWith(host))
  if (!isAllowed) {
    return new NextResponse('URL not allowed', { status: 403 })
  }

  try {
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) {
      return new NextResponse('Failed to fetch image from source', { status: 502 })
    }
    const blob = await response.blob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="joola-post.png"',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return new NextResponse('Image fetch failed', { status: 500 })
  }
}
