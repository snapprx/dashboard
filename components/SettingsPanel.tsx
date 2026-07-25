'use client'
import { useState } from 'react'
import { CalendarSource } from './SchoolCalendar'

const PRESET_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444']

interface Settings { calendars: CalendarSource[]; dark: boolean }

function uid() { return Math.random().toString(36).slice(2, 9) }

export function SettingsPanel({ settings, onSave }: { settings: Settings, onSave: (s: Settings) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Settings>(settings)
  const [newCal, setNewCal] = useState({ name: '', url: '', color: '#6366f1' })
  const [adding, setAdding] = useState(false)

  const d = settings.dark
  const bg = d ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
  const sub = d ? 'text-gray-400' : 'text-gray-500'
  const inp = d
    ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500 focus:border-blue-500'
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
  const rowBg = d ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
  const btnSec = d ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'

  const addCalendar = () => {
    if (!newCal.url.trim()) return
    setDraft(prev => ({
      ...prev,
      calendars: [...prev.calendars, { id: uid(), ...newCal, name: newCal.name || 'Agenda' }]
    }))
    setNewCal({ name: '', url: '', color: '#6366f1' })
    setAdding(false)
  }

  const removeCal = (id: string) => setDraft(prev => ({ ...prev, calendars: prev.calendars.filter(c => c.id !== id) }))

  return (
    <>
      <button
        onClick={() => { setDraft(settings); setOpen(true) }}
        className="fixed bottom-5 right-5 w-11 h-11 rounded-full bg-gray-900 text-white shadow-lg flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition z-40"
        title="Réglages">⚙</button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto ${bg}`}>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Réglages</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {/* Thème */}
            <div>
              <p className="text-sm font-semibold mb-2">Thème</p>
              <div className="flex gap-2">
                {[{ label: '☀ Clair', v: false }, { label: '🌙 Sombre', v: true }].map(({ label, v }) => (
                  <button key={label} onClick={() => setDraft(s => ({ ...s, dark: v }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${draft.dark === v
                      ? 'bg-blue-600 text-white border-blue-600'
                      : d ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendriers */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Agendas</p>
                <button onClick={() => setAdding(true)} className="text-xs font-bold text-blue-500 hover:text-blue-600 transition">+ Ajouter</button>
              </div>

              <div className="space-y-2 mb-3">
                {draft.calendars.map(cal => (
                  <div key={cal.id} className={`flex items-center gap-3 p-3 rounded-lg border ${rowBg}`}>
                    <div className="w-4 h-4 rounded-sm shrink-0" style={{ backgroundColor: cal.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cal.name}</p>
                      <p className={`text-xs truncate ${sub}`}>{cal.url.slice(0, 55)}{cal.url.length > 55 ? '…' : ''}</p>
                    </div>
                    <button onClick={() => removeCal(cal.id)} className="text-gray-400 hover:text-red-400 transition shrink-0 text-lg leading-none">×</button>
                  </div>
                ))}
                {draft.calendars.length === 0 && (
                  <p className={`text-sm italic text-center py-4 ${sub}`}>Aucun agenda</p>
                )}
              </div>

              {adding && (
                <div className={`rounded-xl border p-4 space-y-3 ${rowBg}`}>
                  <p className="text-sm font-semibold">Nouvel agenda</p>
                  <input value={newCal.name}
                    onChange={e => setNewCal(n => ({ ...n, name: e.target.value }))}
                    placeholder="Nom (ex: Perso, Travail, ECE…)"
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${inp}`} />
                  <textarea value={newCal.url}
                    onChange={e => setNewCal(n => ({ ...n, url: e.target.value }))}
                    rows={3}
                    placeholder="webcal://, https://, ou .ics"
                    className={`w-full rounded-lg border px-3 py-2 text-xs font-mono resize-none outline-none transition ${inp}`} />

                  {/* Formats supportés */}
                  <div className={`text-xs space-y-1 ${sub}`}>
                    <p className="font-semibold">Formats supportés :</p>
                    <p>• <strong>iCloud</strong> : Calendrier → agenda → ⋯ → Copier le lien iCal (<code className="bg-black/10 px-1 rounded">webcal://</code>)</p>
                    <p>• <strong>Google</strong> : Paramètres → agenda → Intégration → Adresse iCal</p>
                    <p>• <strong>Outlook</strong> : Paramètres → Calendrier → Abonnement par lien ICS</p>
                    <p>• <strong>École</strong> : HyperPlanning → Exporter → iCal</p>
                    <p className={`mt-1 ${d ? 'text-gray-500' : 'text-gray-400'}`}>Les liens <code className="bg-black/10 px-1 rounded">webcal://</code> sont automatiquement convertis.</p>
                  </div>

                  <div>
                    <p className={`text-xs mb-2 ${sub}`}>Couleur</p>
                    <div className="flex gap-2 flex-wrap">
                      {PRESET_COLORS.map(c => (
                        <button key={c} onClick={() => setNewCal(n => ({ ...n, color: c }))}
                          className={`w-7 h-7 rounded-full transition hover:scale-110 ${newCal.color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setAdding(false)} className={`flex-1 py-1.5 rounded-lg text-sm border transition ${btnSec}`}>Annuler</button>
                    <button onClick={addCalendar} className="flex-1 py-1.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition">Ajouter</button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setOpen(false)} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${btnSec}`}>Annuler</button>
              <button onClick={() => { onSave(draft); setOpen(false) }}
                className="flex-1 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
