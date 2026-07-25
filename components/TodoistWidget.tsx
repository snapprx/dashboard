'use client'
import { useState } from 'react'
import { TodoistTask, formatDueDate } from '@/lib/todoist'

const pColors: Record<number, string> = {
  4: 'bg-red-100 text-red-700',
  3: 'bg-orange-100 text-orange-700',
  2: 'bg-blue-100 text-blue-700',
  1: 'bg-gray-100 text-gray-600',
}
const pLabel: Record<number, string> = { 4: 'Urgente', 3: 'Haute', 2: 'Moyenne', 1: 'Basse' }

export function TodoistWidget({
  all, school, projects, dark = false
}: { all: TodoistTask[], school: TodoistTask[], projects: TodoistTask[], dark?: boolean }) {
  const [tab, setTab] = useState<'all' | 'school' | 'projects'>('all')
  const tasks = tab === 'school' ? school : tab === 'projects' ? projects : all
  const sorted = [...tasks]
    .filter(t => !t.is_completed)
    .sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority
      if (a.due && b.due) return new Date(a.due.date).getTime() - new Date(b.due.date).getTime()
      return a.due ? -1 : 1
    })

  const btnActive = 'bg-blue-600 text-white'
  const btnInactive = dark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
  const rowBg = dark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
  const text = dark ? 'text-gray-100' : 'text-gray-800'
  const sub = dark ? 'text-gray-400' : 'text-gray-500'

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['all', 'school', 'projects'] as const).map((key) => {
          const count = key === 'school' ? school.length : key === 'projects' ? projects.length : all.length
          const label = key === 'all' ? 'Tout' : key === 'school' ? 'École' : 'Projets'
          return (
            <button key={key} onClick={() => setTab(key)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${tab === key ? btnActive : btnInactive}`}>
              {label} <span className="opacity-70">({count})</span>
            </button>
          )
        })}
      </div>
      {sorted.length === 0 ? (
        <p className={`text-center py-6 text-sm italic ${sub}`}>✓ Aucune tâche</p>
      ) : (
        <div className="space-y-2">
          {sorted.map(t => (
            <div key={t.id} className={`flex items-start gap-3 p-3 rounded-lg border ${rowBg}`}>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${text}`}>{t.content}</p>
                {t.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {t.labels.map(l => (
                      <span key={l} className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{l}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${pColors[t.priority]}`}>{pLabel[t.priority]}</span>
                {t.due && <span className={`text-xs ${sub}`}>{formatDueDate(t.due.date)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
