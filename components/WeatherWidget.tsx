'use client'
import { useState, useEffect } from 'react'

interface WeatherData {
  city: string
  temp: number
  feelsLike: number
  humidity: number
  wind: number
  condition: string
  emoji: string
  forecast: { date: string; max: number; min: number; emoji: string; rain: number }[]
}

const DAY_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export function WeatherWidget({ lat, lon, city, dark }: {
  lat: string; lon: string; city: string; dark: boolean
}) {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setData(null)
    fetch(`/api/weather?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}`)
      .then(async r => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`)
        return d as WeatherData
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [lat, lon, city])

  const text = dark ? 'text-gray-100' : 'text-gray-900'
  const sub = dark ? 'text-gray-400' : 'text-gray-500'
  const rowBg = dark ? 'bg-gray-900/60' : 'bg-gray-50'

  if (loading) return (
    <div className="animate-pulse space-y-2">
      <div className={`h-16 rounded-xl ${dark ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-10 rounded-xl ${dark ? 'bg-gray-700' : 'bg-gray-200'}`} />
    </div>
  )

  if (error) return <p className="text-xs text-orange-400">⚠ {error}</p>
  if (!data) return null

  return (
    <div className="space-y-3">
      {/* Current */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black ${text}`}>{data.temp}°</span>
            <span className="text-3xl">{data.emoji}</span>
          </div>
          <p className={`text-sm ${sub}`}>{data.condition}</p>
          <p className={`text-xs ${sub}`}>{data.city}</p>
        </div>
        <div className={`text-right text-xs space-y-1 ${sub}`}>
          <p>Ressenti {data.feelsLike}°</p>
          <p>💧 {data.humidity}%</p>
          <p>💨 {data.wind} km/h</p>
        </div>
      </div>

      {/* Forecast */}
      <div className="grid grid-cols-4 gap-1.5">
        {data.forecast.map((f, i) => {
          const d = new Date(f.date)
          const label = i === 0 ? 'Auj.' : i === 1 ? 'Dem.' : DAY_FR[d.getDay()]
          return (
            <div key={f.date} className={`rounded-lg p-2 text-center ${rowBg}`}>
              <p className={`text-xs font-semibold ${sub}`}>{label}</p>
              <p className="text-base my-0.5">{f.emoji}</p>
              <p className={`text-xs font-bold ${text}`}>{f.max}°</p>
              <p className={`text-xs ${sub}`}>{f.min}°</p>
              {f.rain > 20 && <p className="text-xs text-blue-400">{f.rain}%</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
