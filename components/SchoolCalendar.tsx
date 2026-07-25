'use client'
import { useState, useEffect, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CalendarSource {
  id: string
  name: string
  url: string
  color: string
}

interface CalEvent {
  title: string
  subject: string
  start: Date
  end: Date
  location: string
  fullLocation: string
  type: string
  sessionType: string
  teacher: string
  group: string
  memo: string
  teamsUrl: string
  soweSignCode: string
  contentNote: string
  calendarId: string
  color: string
  col: number
  totalCols: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const START_H = 7
const END_H = 22
const ROW_H = 64
const TOTAL_H = (END_H - START_H) * ROW_H
const HOURS = Array.from({ length: END_H - START_H }, (_, i) => START_H + i)
// Lun=0 … Sam=5 … Dim=6 (index = (getDay() + 6) % 7)
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// ─── Description parser ───────────────────────────────────────────────────────

function parseDescription(raw: string) {
  const text = raw
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\:/g, ':')

  const lines = text.split('\n').map(l => l.trim())
  const getField = (prefix: string) => {
    const line = lines.find(l => l.toLowerCase().startsWith(prefix.toLowerCase()))
    return line ? line.slice(prefix.length).trim() : ''
  }

  const memo = getField('Mémo :')
  const teacher = getField('Enseignant :')
  const group = getField('TD :')
  const fullRoom = getField('Salles :') || getField('Salle :')
  const sessionType = getField('Type :')

  const contentMatch = text.match(/Contenu p[ée]dagogique[^:]*:([\s\S]+?)(?=<div\s|$)/i)
  let contentNote = ''
  if (contentMatch) {
    const stripped = contentMatch[1].replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').trim()
    if (stripped && stripped.toLowerCase() !== 'contenu') contentNote = stripped
  }

  const teamsMatch = text.match(/href="(https:\/\/teams\.microsoft\.com\/[^"]+)"/)
  const teamsUrl = teamsMatch ? teamsMatch[1] : ''

  const soweMatch = text.match(/code[^:]*:\s*(\d{4,})/i)
  const soweSignCode = soweMatch ? soweMatch[1] : ''

  return { memo, teacher, group, fullRoom, sessionType, contentNote, teamsUrl, soweSignCode }
}

// ─── iCal parser ──────────────────────────────────────────────────────────────

function parseIcal(text: string, calendarId: string, color: string): Omit<CalEvent, 'col' | 'totalCols'>[] {
  const events: Omit<CalEvent, 'col' | 'totalCols'>[] = []
  const blocks = text.split('BEGIN:VEVENT').slice(1)

  for (const block of blocks) {
    const get = (key: string) => {
      const m = block.match(new RegExp(key + '[^:]*:([^\\r\\n]+(?:\\r?\\n[ \\t][^\\r\\n]+)*)'))
      return m ? m[1].replace(/\r?\n[ \t]/g, '').trim() : ''
    }

    const rawStart = get('DTSTART')
    const rawEnd = get('DTEND')
    if (!rawStart || !rawEnd) continue

    const pd = (r: string) => {
      const y = +r.slice(0, 4), mo = +r.slice(4, 6) - 1, d = +r.slice(6, 8)
      const h = +r.slice(9, 11), m = +r.slice(11, 13)
      return r.endsWith('Z') ? new Date(Date.UTC(y, mo, d, h, m)) : new Date(y, mo, d, h, m)
    }

    const summary = get('SUMMARY;LANGUAGE=fr') || get('SUMMARY')
    const location = get('LOCATION;LANGUAGE=fr') || get('LOCATION')
    const description = get('DESCRIPTION;LANGUAGE=fr') || get('DESCRIPTION')

    const cleanedSummary = summary
      .replace(/^lien : https?:\/\/\S+ - /, '')
      .replace(/^salles pour .+? - /, '')

    const parts = cleanedSummary.split(' - ')
    const subject = parts[0]?.trim() || ''
    const desc = parseDescription(description)

    const teacher = desc.teacher || parts[1]?.trim() || ''
    const group = desc.group || parts[2]?.trim() || ''
    const sessionType = desc.sessionType || parts[parts.length - 1]?.trim() || ''
    const type = sessionType.includes('TP') ? 'TP' : sessionType.includes('TD') ? 'TD' : 'CM'

    const fullLocation = location.replace(/\\,/g, '\n').trim()
    const shortLocation = fullLocation.split('\n')[0].replace(/^Salle\s+/, '').split(' - ')[0].trim()

    events.push({
      title: subject, subject,
      start: pd(rawStart), end: pd(rawEnd),
      location: shortLocation, fullLocation,
      type, sessionType, teacher, group,
      memo: desc.memo, teamsUrl: desc.teamsUrl,
      soweSignCode: desc.soweSignCode, contentNote: desc.contentNote,
      calendarId, color,
    })
  }

  return events
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function layoutDay(events: Omit<CalEvent, 'col' | 'totalCols'>[]): CalEvent[] {
  if (!events.length) return []
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime())
  const columns: Omit<CalEvent, 'col' | 'totalCols'>[][] = []
  for (const ev of sorted) {
    let placed = false
    for (const col of columns) {
      if (col[col.length - 1].end <= ev.start) { col.push(ev); placed = true; break }
    }
    if (!placed) columns.push([ev])
  }
  const totalCols = columns.length
  return columns.flatMap((col, colIdx) => col.map(ev => ({ ...ev, col: colIdx, totalCols })))
}

function isSameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString() }

// Retourne les 7 jours de la semaine (Lun → Dim)
function getWeekDays(date: Date): Date[] {
  const mon = new Date(date)
  const day = date.getDay()
  mon.setDate(date.getDate() + (day === 0 ? -6 : 1 - day))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i); return d
  })
}

function eventTopHeight(ev: CalEvent) {
  const startMin = ev.start.getHours() * 60 + ev.start.getMinutes()
  const endMin = ev.end.getHours() * 60 + ev.end.getMinutes()
  const top = Math.max(0, ((startMin - START_H * 60) / 60) * ROW_H)
  const height = Math.max(20, ((endMin - startMin) / 60) * ROW_H)
  return { top, height }
}

// ─── Event detail modal ───────────────────────────────────────────────────────

function EventModal({ ev, dark, onClose }: { ev: CalEvent, dark: boolean, onClose: () => void }) {
  const bg = dark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
  const sub = dark ? 'text-gray-400' : 'text-gray-500'
  const rowBg = dark ? 'bg-gray-700/50' : 'bg-gray-50'
  const dur = Math.round((ev.end.getTime() - ev.start.getTime()) / 60000)

  const fields: [string, string][] = ([
    ['👨‍🏫 Enseignant', ev.teacher],
    ['👥 Groupe', ev.group],
    ['📋 Type', ev.sessionType],
    ['📍 Salle', ev.fullLocation],
    ['📝 Mémo', ev.memo],
    ['📚 Contenu', ev.contentNote],
  ] as [string, string][]).filter(([, v]) => v)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${bg}`}>
        <div className="h-2" style={{ backgroundColor: ev.color }} />
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-bold leading-tight">{ev.subject}</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 text-white"
                style={{ backgroundColor: ev.color }}>{ev.type}</span>
            </div>
            <p className={`text-sm mt-1.5 ${sub}`}>
              {ev.start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="text-sm font-semibold mt-0.5">
              {ev.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              {' → '}
              {ev.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              <span className={`text-xs font-normal ml-2 ${sub}`}>({dur} min)</span>
            </p>
          </div>

          {fields.length > 0 && (
            <div className={`rounded-xl overflow-hidden divide-y ${dark ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {fields.map(([label, value]) => (
                <div key={label} className={`px-4 py-2.5 ${rowBg}`}>
                  <p className={`text-xs font-semibold mb-0.5 ${sub}`}>{label}</p>
                  <p className="text-sm whitespace-pre-line">{value}</p>
                </div>
              ))}
            </div>
          )}

          {ev.teamsUrl && (
            <a href={ev.teamsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition">
              🎥 Rejoindre le cours sur Teams
            </a>
          )}

          {ev.soweSignCode && (
            <div className={`px-4 py-3 rounded-xl ${rowBg} flex items-center justify-between`}>
              <div>
                <p className={`text-xs font-semibold ${sub}`}>Appel en ligne</p>
                <p className="text-sm">Code établissement : <strong>{ev.soweSignCode}</strong></p>
              </div>
              <a href="https://app.sowesign.com" target="_blank" rel="noopener noreferrer"
                className="text-xs font-bold text-blue-500 hover:underline">SoWeSign →</a>
            </div>
          )}

          <button onClick={onClose}
            className={`w-full py-2 rounded-xl text-sm font-medium transition ${dark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SchoolCalendar({ calendars, dark }: { calendars: CalendarSource[], dark: boolean }) {
  const [allEvents, setAllEvents] = useState<Omit<CalEvent, 'col' | 'totalCols'>[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [view, setView] = useState<'week' | 'day'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [retryCount, setRetryCount] = useState(0)
  const [selected, setSelected] = useState<CalEvent | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const calendarKey = calendars.map(c => c.url).join('|')

  useEffect(() => {
    if (!calendars.length) return
    setLoading(true)
    setErrors([])
    const fetches = calendars.map(cal =>
      fetch(`/api/ical?url=${encodeURIComponent(cal.url)}`)
        .then(async r => {
          if (!r.ok) { const t = await r.text().catch(() => `HTTP ${r.status}`); throw new Error(t) }
          return r.text()
        })
        .then(text => parseIcal(text, cal.id, cal.color))
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err)
          console.error(`[Calendar] ${cal.name}:`, msg)
          setErrors(prev => [...prev, `${cal.name}: ${msg.slice(0, 100)}`])
          return [] as Omit<CalEvent, 'col' | 'totalCols'>[]
        })
    )
    Promise.all(fetches).then(results => { setAllEvents(results.flat()); setLoading(false) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarKey, retryCount])

  useEffect(() => {
    if (!loading && scrollRef.current) scrollRef.current.scrollTop = (8 - START_H) * ROW_H
  }, [loading])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const weekDays = getWeekDays(currentDate)
  const today = new Date()
  const nowTop = ((today.getHours() * 60 + today.getMinutes() - START_H * 60) / 60) * ROW_H
  const dayEvents = (d: Date) => layoutDay(allEvents.filter(e => isSameDay(e.start, d)))
  const prev = () => { const d = new Date(currentDate); d.setDate(d.getDate() + (view === 'week' ? -7 : -1)); setCurrentDate(d) }
  const next = () => { const d = new Date(currentDate); d.setDate(d.getDate() + (view === 'week' ? 7 : 1)); setCurrentDate(d) }

  const bg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const text = dark ? 'text-gray-100' : 'text-gray-900'
  const sub = dark ? 'text-gray-500' : 'text-gray-400'
  const line = dark ? 'border-gray-700' : 'border-gray-100'
  const lineStrong = dark ? 'border-gray-600' : 'border-gray-200'
  const colBg = dark ? 'bg-gray-900/50' : 'bg-gray-50/50'
  const todayCol = dark ? 'bg-blue-950/40' : 'bg-blue-50/60'
  const wkendCol = dark ? 'bg-gray-800/80' : 'bg-slate-50/80'
  const btnA = 'bg-blue-600 text-white'
  const btnI = dark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'

  if (!calendars.length) return (
    <div className={`rounded-xl border p-8 text-center ${bg}`}>
      <p className="text-4xl mb-3">📅</p>
      <p className={`font-medium ${text}`}>Aucun calendrier configuré</p>
      <p className={`text-sm mt-1 ${sub}`}>Clique sur ⚙ pour ajouter un agenda</p>
    </div>
  )

  // Lun–Dim : weekDays[0] = lundi, weekDays[6] = dimanche
  const weekLabel = view === 'week'
    ? `${weekDays[0].getDate()} – ${weekDays[6].getDate()} ${weekDays[6].toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
    : currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const displayDays = view === 'week' ? weekDays : [currentDate]

  return (
    <>
      <div className={`rounded-xl border overflow-hidden ${bg}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-2.5 border-b ${lineStrong}`}>
          <div className="flex items-center gap-1">
            <button onClick={prev} className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${btnI}`}>‹</button>
            <button onClick={() => setCurrentDate(new Date())} className={`px-2 py-0.5 rounded-lg text-xs font-medium transition ${btnI}`}>Auj.</button>
            <button onClick={next} className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${btnI}`}>›</button>
            <span className={`text-sm font-semibold ml-2 ${text}`}>{weekLabel}</span>
            {loading && <span className={`text-xs ml-2 animate-pulse ${sub}`}>Chargement…</span>}
          </div>
          <div className={`flex rounded-lg text-xs font-medium border overflow-hidden ${lineStrong}`}>
            <button onClick={() => setView('week')} className={`px-3 py-1 transition ${view === 'week' ? btnA : btnI}`}>Semaine</button>
            <button onClick={() => setView('day')} className={`px-3 py-1 transition ${view === 'day' ? btnA : btnI}`}>Jour</button>
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="px-4 py-2 border-b border-orange-500/20 flex items-start justify-between gap-2">
            <div>{errors.map((e, i) => <p key={i} className="text-xs text-orange-400">⚠ {e}</p>)}</div>
            <button onClick={() => setRetryCount(c => c + 1)} className="text-xs font-bold text-blue-400 hover:text-blue-300 shrink-0 transition">Réessayer</button>
          </div>
        )}

        {/* Day headers */}
        <div className={`flex border-b ${lineStrong}`}>
          <div className="w-12 shrink-0" />
          {displayDays.map((day, i) => {
            const isToday = isSameDay(day, today)
            const isWeekend = day.getDay() === 0 || day.getDay() === 6
            const dayIdx = (day.getDay() + 6) % 7  // Lun=0 … Dim=6
            return (
              <div key={i}
                className={`flex-1 text-center py-2 text-xs font-bold cursor-pointer ${isToday ? 'text-blue-500' : isWeekend ? 'text-orange-400' : sub}`}
                onClick={() => { setCurrentDate(day); setView('day') }}>
                <span>{view === 'week' ? DAYS[dayIdx] : day.toLocaleDateString('fr-FR', { weekday: 'long' })}</span>
                <span className={`ml-1 text-base font-black ${isToday ? 'text-blue-500' : isWeekend ? 'text-orange-400' : text}`}>{day.getDate()}</span>
              </div>
            )
          })}
        </div>

        {/* Time grid */}
        <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '560px' }}>
          <div className="flex" style={{ height: `${TOTAL_H}px` }}>
            <div className="w-12 shrink-0 relative" style={{ height: `${TOTAL_H}px` }}>
              {HOURS.map(h => (
                <div key={h} className={`absolute right-2 text-xs select-none ${sub} -translate-y-2.5`}
                  style={{ top: `${(h - START_H) * ROW_H}px` }}>
                  {String(h).padStart(2, '0')}h
                </div>
              ))}
            </div>

            {displayDays.map((day, di) => {
              const isToday = isSameDay(day, today)
              const isWeekend = day.getDay() === 0 || day.getDay() === 6
              const evs = dayEvents(day)
              return (
                <div key={di}
                  className={`flex-1 relative border-l ${lineStrong} ${isToday ? todayCol : isWeekend ? wkendCol : colBg}`}
                  style={{ height: `${TOTAL_H}px` }}>
                  {HOURS.map(h => (
                    <div key={h} className={`absolute w-full border-t ${line}`}
                      style={{ top: `${(h - START_H) * ROW_H}px` }} />
                  ))}
                  {isToday && nowTop > 0 && nowTop < TOTAL_H && (
                    <div className="absolute w-full z-20 flex items-center pointer-events-none" style={{ top: `${nowTop}px` }}>
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                      <div className="flex-1 border-t-2 border-red-500" />
                    </div>
                  )}
                  {evs.map((ev, i) => {
                    const { top, height } = eventTopHeight(ev)
                    const leftPct = (ev.col / ev.totalCols) * 100
                    const widthPct = (1 / ev.totalCols) * 100
                    return (
                      <div key={i}
                        onClick={() => setSelected(ev)}
                        className="absolute z-10 rounded-md overflow-hidden cursor-pointer hover:z-30 hover:brightness-110 hover:shadow-lg transition-all"
                        style={{
                          top: `${top + 1}px`, height: `${height - 2}px`,
                          left: `calc(${leftPct}% + 2px)`, width: `calc(${widthPct}% - 4px)`,
                          backgroundColor: ev.color,
                        }}>
                        <div className="px-1.5 pt-0.5 text-white h-full overflow-hidden">
                          <p className="text-xs font-bold leading-tight truncate">{ev.subject}</p>
                          {height > 38 && <p className="text-xs opacity-80 truncate">{ev.location}</p>}
                          {height > 56 && ev.teacher && <p className="text-xs opacity-70 truncate">{ev.teacher}</p>}
                          {height > 74 && (
                            <p className="text-xs opacity-70">
                              {ev.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} – {ev.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {calendars.length > 1 && (
          <div className={`flex gap-4 px-4 py-2 border-t ${lineStrong} flex-wrap`}>
            {calendars.map(cal => (
              <div key={cal.id} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cal.color }} />
                <span className={`text-xs ${sub}`}>{cal.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && <EventModal ev={selected} dark={dark} onClose={() => setSelected(null)} />}
    </>
  )
}
