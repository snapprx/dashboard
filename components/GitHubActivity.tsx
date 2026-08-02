'use client'
import { useState, useEffect } from 'react'

interface ActivityData {
  byDay: Record<string, number>
  totalCommits: number
  recentCommits: { repo: string; message: string; date: string; sha: string }[]
  streak: number
  username: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return `il y a ${d}j`
  if (h > 0) return `il y a ${h}h`
  return 'récemment'
}

export function GitHubActivity({ dark }: { dark: boolean }) {
  const [data, setData] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/github-activity')
      .then(async r => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`)
        return d as ActivityData
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const text = dark ? 'text-gray-100' : 'text-gray-900'
  const sub = dark ? 'text-gray-400' : 'text-gray-500'
  const rowBg = dark ? 'bg-gray-900/60' : 'bg-gray-50'
  const divider = dark ? 'divide-gray-800' : 'divide-gray-100'
  const barBg = dark ? 'bg-gray-700' : 'bg-gray-200'

  if (loading) return (
    <div className="animate-pulse space-y-2">
      <div className={`h-8 rounded ${dark ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-16 rounded ${dark ? 'bg-gray-700' : 'bg-gray-200'}`} />
    </div>
  )

  if (error) return <p className="text-xs text-orange-400">⚠ {error}</p>
  if (!data) return null

  const days = Object.entries(data.byDay)
  const maxCommits = Math.max(...days.map(([, v]) => v), 1)

  const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`rounded-lg p-2.5 text-center ${rowBg}`}>
          <p className={`text-2xl font-black ${text}`}>{data.totalCommits}</p>
          <p className={`text-xs ${sub}`}>commits cette semaine</p>
        </div>
        <div className={`rounded-lg p-2.5 text-center ${rowBg}`}>
          <p className={`text-2xl font-black ${text}`}>{data.streak}🔥</p>
          <p className={`text-xs ${sub}`}>jours consécutifs</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1 h-12">
        {days.map(([date, count]) => {
          const d = new Date(date)
          const pct = (count / maxCommits) * 100
          const isToday = date === new Date().toISOString().slice(0, 10)
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex items-end" style={{ height: '40px' }}>
                <div
                  className={`w-full rounded-t transition-all ${isToday ? 'bg-green-500' : 'bg-green-400/70'}`}
                  style={{ height: `${Math.max(pct, count > 0 ? 10 : 2)}%` }}
                  title={`${count} commits`}
                />
              </div>
              <span className={`text-xs ${isToday ? 'font-bold text-green-500' : sub}`}>
                {DAY_LABELS[d.getDay()]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Recent commits */}
      {data.recentCommits.length > 0 && (
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${sub}`}>Récents</p>
          <div className={`rounded-xl overflow-hidden divide-y ${divider}`}>
            {data.recentCommits.slice(0, 5).map((c, i) => (
              <div key={i} className={`px-3 py-2 ${rowBg}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-xs font-bold text-green-500`}>{c.repo}</span>
                  <span className={`text-xs ${sub}`}>{c.sha}</span>
                  <span className={`text-xs ${sub} ml-auto`}>{timeAgo(c.date)}</span>
                </div>
                <p className={`text-xs truncate ${text}`}>{c.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
