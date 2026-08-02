'use client'
import { useState, useEffect } from 'react'
import type { VaultStats } from '@/lib/vault-stats'

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `il y a ${d}j`
  if (h > 0) return `il y a ${h}h`
  if (m > 0) return `il y a ${m}min`
  return 'à l\'instant'
}

export function VaultWidget({ dark }: { dark: boolean }) {
  const [stats, setStats] = useState<VaultStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/vault-stats')
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`)
        return data as VaultStats
      })
      .then(data => { setStats(data); setLoading(false) })
      .catch(err => {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[VaultWidget]', msg)
        setError(msg)
        setLoading(false)
      })
  }, [])

  const text = dark ? 'text-gray-100' : 'text-gray-900'
  const sub = dark ? 'text-gray-400' : 'text-gray-500'
  const rowBg = dark ? 'bg-gray-900/60' : 'bg-gray-50'
  const divider = dark ? 'divide-gray-800' : 'divide-gray-100'

  if (loading) return (
    <div className="animate-pulse space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`h-8 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-200'}`} />
      ))}
    </div>
  )

  if (error) return (
    <div className="space-y-2">
      <p className="text-xs text-orange-400 break-words">⚠ {error}</p>
      <p className={`text-xs ${sub}`}>Vérifie que VAULT_PATH est correct dans .env.local</p>
    </div>
  )

  if (!stats) return null

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
        <div className={`rounded-xl overflow-hidden divide-y ${divider}`}>
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

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className={`text-xs ${sub}`}>
          {stats.totalNotes} notes · {stats.lastSync ? `Sync ${timeAgo(stats.lastSync)}` : 'Pas de sync Git'}
        </p>
        <p className={`text-xs font-medium ${sub}`}>Obsidian</p>
      </div>
    </div>
  )
}
