'use client'
import { TodoistTask, formatDueDate } from '@/lib/todoist'

export function DeadlineTimeline({ tasks, dark = false }: { tasks: TodoistTask[], dark?: boolean }) {
  const now = new Date()
  const ing2Date = new Date('2026-09-01')
  const daysLeft = Math.max(0, Math.ceil((ing2Date.getTime() - now.getTime()) / 86400000))
  const summerPct = Math.min(100, Math.max(0, ((60 - daysLeft) / 60) * 100))
  const sub = dark ? 'text-gray-400' : 'text-gray-500'
  const text = dark ? 'text-gray-100' : 'text-gray-800'
  const rowBg = dark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
        <p className="text-sm font-medium text-blue-200 mb-1">📚 ING2 — Sept. 2026</p>
        <p className="text-5xl font-black">{daysLeft}</p>
        <p className="text-blue-200 text-sm mb-3">jours restants</p>
        <div className="w-full bg-blue-800 rounded-full h-2">
          <div className="bg-white h-2 rounded-full" style={{ width: `${summerPct}%` }} />
        </div>
      </div>

      {tasks.length > 0 && (
        <div>
          <p className={`text-sm font-bold mb-3 ${text}`}>📅 Prochaines deadlines</p>
          <div className="space-y-2">
            {tasks.slice(0, 6).map(t => {
              const diff = Math.ceil((new Date(t.due!.date).getTime() - now.getTime()) / 86400000)
              const urgent = diff <= 7
              return (
                <div key={t.id} className={`flex items-center justify-between p-2.5 rounded-lg border text-sm ${urgent ? 'border-red-400/40 bg-red-900/10' : rowBg}`}>
                  <span className={`font-medium truncate mr-2 ${text}`}>{t.content}</span>
                  <span className={`text-xs font-bold whitespace-nowrap ${urgent ? 'text-red-400' : sub}`}>
                    {formatDueDate(t.due!.date)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
