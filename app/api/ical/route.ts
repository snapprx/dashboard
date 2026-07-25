import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  let url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing url param', { status: 400 })

  // webcal:// et webcals:// → https://
  url = url.replace(/^webcals?:\/\//i, 'https://')

  // Sécurité : n'autoriser que http(s)
  if (!/^https?:\/\//i.test(url)) {
    return new NextResponse(`Protocole non supporté`, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Dashboard/1.0)',
        'Accept': 'text/calendar, text/plain, */*',
      },
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const body = `Upstream ${res.status}: ${res.statusText}`
      console.error('[ical proxy]', body, url.slice(0, 80))
      return new NextResponse(body, { status: 502 })
    }

    const text = await res.text()
    console.log('[ical proxy] OK, chars:', text.length, url.slice(0, 60))
    return new NextResponse(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[ical proxy] error:', msg, url.slice(0, 80))
    return new NextResponse(`Error: ${msg}`, { status: 500 })
  }
}
