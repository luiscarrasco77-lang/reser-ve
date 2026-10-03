import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/http'

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, 'geocode', 60, 60_000)
  if (limited) return limited
  const q = req.nextUrl.searchParams.get('q')?.slice(0, 120)
  if (!q) return NextResponse.json([], { status: 400 })

  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(q + ', Venezuela')}` +
    `&countrycodes=ve&format=json&limit=8&addressdetails=1&accept-language=es`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RESER-VE/1.0 (https://reser-ve.com; hola@reser-ve.com)',
        'Accept': 'application/json',
        'Referer': 'https://reser-ve.com',
      },
      next: { revalidate: 3600 }, // cache 1h
    })

    if (!res.ok) return NextResponse.json([], { status: res.status })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
