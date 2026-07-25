'use client'
import { Project } from '@/lib/vault'

const statusBorder: Record<string, string> = {
  '🟢': 'border-l-green-500',
  '🟡': 'border-l-yellow-400',
  '🟠': 'border-l-orange-500',
  '🔴': 'border-l-red-500',
}

export function ProjectCard({ project, dark = false }: { project: Project, dark?: boolean }) {
  const emoji = project.status.split(' ')[0]
  const border = statusBorder[emoji] ?? 'border-l-gray-300'
  const hasBlocker = project.blockers && project.blockers !== 'Aucun'
  const cardBg = dark ? 'bg-gray-800' : 'bg-white shadow-sm'
  const headText = dark ? 'text-gray-100' : 'text-gray-900'
  const subText = dark ? 'text-gray-400' : 'text-gray-500'
  const pillBg = dark ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-700'
  const trackBg = dark ? 'bg-gray-700' : 'bg-gray-100'

  return (
    <div className={`border-l-4 ${border} rounded-xl p-4 hover:shadow-md transition ${cardBg}`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className={`font-bold text-base leading-tight ${headText}`}>{project.name}</h3>
        <span className={`text-xs whitespace-nowrap ml-2 ${subText}`}>{project.lastModified}</span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${pillBg}`}>{project.status}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${pillBg}`}>{project.priority}</span>
      </div>
      <div className="mb-3">
        <div className={`flex justify-between text-xs mb-1 ${subText}`}>
          <span>Progression</span>
          <span className={`font-bold ${headText}`}>{project.completed}%</span>
        </div>
        <div className={`w-full rounded-full h-1.5 ${trackBg}`}>
          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${project.completed}%` }} />
        </div>
      </div>
      <p className={`text-xs mb-2 ${subText}`}>
        <span className={`font-semibold ${headText}`}>→ </span>{project.nextStep}
      </p>
      {hasBlocker && <p className="text-xs text-red-400 font-medium mt-2">⚠ {project.blockers}</p>}
      {project.tech && <p className={`text-xs mt-2 truncate ${subText}`}>{project.tech}</p>}
    </div>
  )
}
