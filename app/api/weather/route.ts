import { NextRequest, NextResponse } from 'next/server'

const WMO: Record<number, { label: string; emoji: string }> = {
  0: { label: 'Dégagé', emoji: '☀️' },
  1: { label: 'Peu nuageux', emoji: '🌤️' },
  2: { label: 'Partiellement nuageux', emoji: '⛅' },
  3: { label: 'Couvert', emoji: '☁️' },
  45: { label: 'Brouillard', emoji: '🌫️' },
  48: { label: 'Brouillard givrant', emoji: '🌫️' },
  51: { label: 'Bruine légère', emoji: '🌦️' },
  53: { label: 'Bruine', emoji: '🌦️' },
  55: { label: 'Bruine forte', emoji: '🌧️' },
  61: { label: 'Pluie légère', emoji: '🌧️' },
  63: { label: 'Pluie', emoji: '🌧️' },
  65: { label: 'Pluie forte', emoji: '🌧️' },
  71: { label: 'Neige légère', emoji: '🌨️' },
  73: { label: 'Neige', emoji: '❄️' },
  75: { label: 'Neige forte', emoji: '❄️' },
  80: { label: 'Averses légères', emoji: '🌦️' },
  81: { label: 'Averses', emoji: '🌧️' },
  82: { label: 'Averses fortes', emoji: '⛈️' },
  95: { label: 'Orage', emoji: '⛈️' },
  96: { label: 'Orage + grêle', emoji: '⛈️' },
  99: { label: 'Orage violent', emoji: '⛈️' },
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat') ?? '48.8566'
  const lon = req.nextUrl.searchParams.get('lon') ?? '2.3522'
  const city = req.nextUrl.searchParams.get('city') ?? 'Paris'

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max` +
    `&timezone=auto&forecast_days=4`

  const res = await fetch(url, { next: { revalidate: 1800 } })
  if (!res.ok) return NextResponse.json({ error: 'Open-Meteo API failed' }, { status: 502 })

  const data = await res.json()
  const cur = data.current
  const daily = data.daily

  const wmo = WMO[cur.weather_code] ?? { label: 'Inconnu', emoji: '🌡️' }

  return NextResponse.json({
    city,
    temp: Math.round(cur.temperature_2m),
    feelsLike: Math.round(cur.apparent_temperature),
    humidity: cur.relative_humidity_2m,
    wind: Math.round(cur.wind_speed_10m),
    condition: wmo.label,
    emoji: wmo.emoji,
    forecast: (daily.time as string[]).slice(0, 4).map((date, i) => ({
      date,
      max: Math.round(daily.temperature_2m_max[i]),
      min: Math.round(daily.temperature_2m_min[i]),
      emoji: (WMO[daily.weather_code[i]] ?? { emoji: '🌡️' }).emoji,
      rain: daily.precipitation_probability_max[i],
    })),
  })
}
