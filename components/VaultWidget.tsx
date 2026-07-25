'use client'
import { VaultStats } from '@/lib/vault-stats'

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `il y a ${d}j`
  if (h > 0) return `il y a ${h}h`
  if (m > 0) return `il y a ${m}min`
  return 'à l\'instant'
}

export function VaultWidget({ stats, dark, error }: {
  stats: VaultStats | null
  dark: boolean
  error?: string | null
}) {
  const text = dark ? 'text-gray-100' : 'text-gray-900'
  const sub = dark ? 'text-gray-400' : 'text-gray-500'
  const rowBg = dark ? 'bg-gray-900/60' : 'bg-gray-50'
  const border = dark ? 'border-gray-700' : 'border-gray-100'

  if (error) return (
    <div className="text-xs text-orange-400">⚠ {error}</div>
  )

  if (!stats) return (
    <div className={`text-xs ${sub}`}>Chargement…</div>
  )

  return (
    <div className="space-y-4">
      {/* Stats par dossier */}
      <div className="grid grid-cols-5 gap-2">
        {stats.folders.map(f => (
          <div key={f.name} className={`rounded-lg p-2 text-center ${rowBg}`}>
            <p className="text-base">{f.emoji}</p>
            <p className={`text-lg font-black ${text}`}>{f.count}</p>
            <p className={`text-xs ${sub}`}>{f.label}</p>
          </div>
        ))}
      </div>

      {/* Inbox alert */}
      {stats.inboxCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <span className="text-base">📥</span>
          <div>
            <p className={`text-sm font-semibold ${text}`}>{stats.inboxCount} note{stats.inboxCount > 1 ? 's' : ''} à classer</p>
            <p className={`text-xs ${sub}`}>Inbox non vide</p>
          </div>
        </div>
      )}

      {/* Notes récentes */}
      <div>
        <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${sub}`}>Notes récentes</p>
        <div className={`rounded-xl overflow-hidden divide-y ${dark ? 'divide-gray-800' : 'divide-gray-100'}`}>
          {stats.recentNotes.map((note, i) => (
            <div key={i} className={`flex items-center justify-between px-3 py-2 ${rowBg}`}>
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${text}`}>{note.name}</p>
                <p className={`text-xs ${sub}`}>{note.folder}</p>
              </div>
              <span className={`text-xs shrink-0 ml-2 ${sub}`}>{timeAgo(note.modified)}</span>
            </div>
          ))}
          {stats.recentNotes.length === 0 && (
            <p className={`text-sm italic text-center py-4 ${sub}`}>Aucune note récente</p>
          )}
        </div>
      </div>

      {/* Sync info */}
      <div className="flex items-center justify-between">
        <p className={`text-xs ${sub}`}>
          {stats.totalNotes} notes · {stats.lastSync ? `Sync ${timeAgo(stats.lastSync)}` : 'Pas de sync Git détectée'}
        </p>
        <p className={`text-xs font-medium ${sub}`}>Obsidian</p>
      </div>
    </div>
  )
}
