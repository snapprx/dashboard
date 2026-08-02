'use client'
import { useState } from 'react'

export function QuickNote({ dark }: { dark: boolean }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [expanded, setExpanded] = useState(false)

  const save = async () => {
    if (!title.trim()) return
    setStatus('saving')
    try {
      const res = await fetch('/api/quick-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setStatus('ok')
      setTitle('')
      setContent('')
      setExpanded(false)
      setTimeout(() => setStatus('idle'), 3000)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e))
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  const text = dark ? 'text-gray-100' : 'text-gray-900'
  const sub = dark ? 'text-gray-400' : 'text-gray-500'
  const inp = dark
    ? 'bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-600 focus:border-blue-500'
    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400'

  return (
    <div className="space-y-2">
      {/* Titre */}
      <div className="flex gap-2">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && save()}
          placeholder="Nouvelle note… (Entrée pour sauver)"
          className={`flex-1 rounded-lg border px-3 py-2 text-sm outline-none transition ${inp}`}
        />
        {!expanded && (
          <button onClick={save} disabled={!title.trim() || status === 'saving'}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition">
            +
          </button>
        )}
      </div>

      {/* Contenu (visible si expanded) */}
      {expanded && (
        <>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Contenu (optionnel)…"
            rows={3}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none transition ${inp}`}
          />
          <div className="flex gap-2">
            <button onClick={() => { setExpanded(false); setTitle(''); setContent('') }}
              className={`flex-1 py-1.5 rounded-lg text-sm border transition ${dark ? 'border-gray-600 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              Annuler
            </button>
            <button onClick={save} disabled={!title.trim() || status === 'saving'}
              className="flex-1 py-1.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition">
              {status === 'saving' ? 'Sauvegarde…' : 'Sauver dans Inbox'}
            </button>
          </div>
        </>
      )}

      {/* Status */}
      {status === 'ok' && (
        <p className="text-xs text-green-500 font-medium">✓ Note créée dans l'Inbox</p>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-400">⚠ {errorMsg}</p>
      )}
    </div>
  )
}
