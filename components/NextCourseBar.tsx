'use client'
import { useState, useEffect } from 'react'
import type { CalendarSource } from './SchoolCalendar'

interface NextEvent {
  title: string
  location: string
  start: Date
  end: Date
  color: string
}

function parseNextEvent(text: string, color: string): NextEvent | null {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 3600000)
  const blocks = text.split('BEGIN:VEVENT').slice(1)

  const events: NextEvent[] = []
  for (const block of blocks) {
    const get = (key: string) => {
      const m = block.match(new RegExp(key + '[^:]*:([^\\r\\n]+(?:\\r?\\n[ \\t][^\\r\\n]+)*)'))
      return m ? m[1].replace(/\r?\n[ \t]/g, '').trim() : ''
    }
    const rawStart = get('DTSTART')
    const rawEnd = get('DTEND')
    if (!rawStart || !rawEnd) continue
    const pd = (r: string) => {
      const y = +r.slice(0,4), mo = +r.slice(4,6)-1, d = +r.slice(6,8)
      const h = +r.slice(9,11), m = +r.slice(11,13)
      return r.endsWith('Z') ? new Date(Date.UTC(y,mo,d,h,m)) : new Date(y,mo,d,h,m)
    }
    const start = pd(rawStart)
    const end = pd(rawEnd)
    if (start < now || start > in24h) continue
    const summary = get('SUMMARY;LANGUAGE=fr') || get('SUMMARY')
    const location = get('LOCATION;LANGUAGE=fr') || get('LOCATION')
    const title = summary.replace(/^lien : https?:\/\/\S+ - /, '').split(' - ')[0].trim()
    const shortLoc = location.split('\\,')[0].replace(/^Salle\s+/, '').split(' - ')[0].trim()
    events.push({ title, location: shortLoc, start, end, color })
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime())[0] ?? null
}

function countdown(date: Date): string {
  const diff = date.getTime() - Date.now()
  if (diff <= 0) return 'En cours'
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  if (h > 0) return `dans ${h}h${m % 60 > 0 ? String(m % 60).padStart(2, '0') : ''}`
  return `dans ${m}min`
}

export function NextCourseBar({ calendars, dark }: { calendars: CalendarSource[], dark: boolean }) {
  const [next, setNext] = useState<NextEvent | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!calendars.length) return
    const fetches = calendars.map(cal =>
      fetch(`/api/ical?url=${encodeURIComponent(cal.url)}`)
        .then(r => r.ok ? r.text() : '')
        .then(text => text ? parseNextEvent(text, cal.color) : null)
        .catch(() => null)
    )
    Promise.all(fetches).then(results => {
      const events = results.filter((e): e is NextEvent => e !== null)
      const soonest = events.sort((a, b) => a.start.getTime() - b.start.getTime())[0] ?? null
      setNext(soonest)
    })
  }, [calendars.map(c => c.url).join('|')])

  // Refresh countdown every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  if (!next) return null

  const bg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const text = dark ? 'text-gray-100' : 'text-gray-900'
  const sub = dark ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className={`flex items-center gap-4 px-5 py-3 rounded-xl border shadow-sm ${bg}`}>
      <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: next.color }} />
      <div className="flex-1 min-w-0">
        <p className={`font-bold truncate ${text}`}>{next.title}</p>
        <p className={`text-sm ${sub}`}>
          {next.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          {' → '}
          {next.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          {next.location && ` · ${next.location}`}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-lg font-black" style={{ color: next.color }}>{countdown(next.start)}</p>
        <p className={`text-xs ${sub}`}>Prochain cours</p>
      </div>
    </div>
  )
}
