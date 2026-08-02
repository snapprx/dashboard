'use client'
import type { TodoistTask } from '@/lib/todoist'

interface Props {
  tasks: TodoistTask[]
  dark: boolean
}

export function TodoistProductivity({ tasks, dark }: Props) {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const active = tasks.filter(t => !t.is_completed)

  const overdue = active.filter(t => t.due && t.due.date < todayStr)
  const dueToday = active.filter(t => t.due?.date === todayStr)
  const dueThisWeek = active.filter(t => t.due && t.due.date > todayStr && t.due.date <= weekEnd.toISOString().slice(0, 10))
  const noDue = active.filter(t => !t.due)

  const byPriority = [
    { label: 'Urgente', color: 'bg-red-500', count: active.filter(t => t.priority === 4).length },
    { label: 'Haute', color: 'bg-orange-400', count: active.filter(t => t.priority === 3).length },
    { label: 'Moyenne', color: 'bg-blue-400', count: active.filter(t => t.priority === 2).length },
    { label: 'Basse', color: 'bg-gray-400', count: active.filter(t => t.priority === 1).length },
  ]

  const maxPri = Math.max(...byPriority.map(p => p.count), 1)

  const text = dark ? 'text-gray-100' : 'text-gray-900'
  const sub = dark ? 'text-gray-400' : 'text-gray-500'
  const rowBg = dark ? 'bg-gray-900/60' : 'bg-gray-50'
  const trackBg = dark ? 'bg-gray-700' : 'bg-gray-200'

  return (
    <div className="space-y-4">
      {/* Overview cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'En retard', count: overdue.length, color: overdue.length > 0 ? 'text-red-500' : text },
          { label: 'Aujourd\'hui', count: dueToday.length, color: dueToday.length > 0 ? 'text-orange-400' : text },
          { label: 'Cette semaine', count: dueThisWeek.length, color: text },
          { label: 'Sans date', count: noDue.length, color: sub },
        ].map(s => (
          <div key={s.label} className={`rounded-lg p-2 text-center ${rowBg}`}>
            <p className={`text-xl font-black ${s.color}`}>{s.count}</p>
            <p className={`text-xs leading-tight ${sub}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Priority breakdown */}
      <div>
        <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${sub}`}>Par priorité</p>
        <div className="space-y-1.5">
          {byPriority.map(p => (
            <div key={p.label} className="flex items-center gap-2">
              <span className={`text-xs w-14 shrink-0 ${sub}`}>{p.label}</span>
              <div className={`flex-1 rounded-full h-2 ${trackBg}`}>
                <div
                  className={`h-2 rounded-full transition-all ${p.color}`}
                  style={{ width: `${(p.count / maxPri) * 100}%` }}
                />
              </div>
              <span className={`text-xs font-bold w-4 text-right ${text}`}>{p.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
