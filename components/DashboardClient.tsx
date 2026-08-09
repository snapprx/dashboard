'use client'
import { useState, useEffect } from 'react'
import { SchoolCalendar, CalendarSource } from './SchoolCalendar'
import { SettingsPanel, Settings, WeatherConfig } from './SettingsPanel'
import { TodoistWidget } from './TodoistWidget'
import { TodoistProductivity } from './TodoistProductivity'
import { DeadlineTimeline } from './DeadlineTimeline'
import { ProjectCard } from './ProjectCard'
import { VaultWidget } from './VaultWidget'
import { GitHubActivity } from './GitHubActivity'
import { WeatherWidget } from './WeatherWidget'
import { QuickNote } from './QuickNote'
import { NextCourseBar } from './NextCourseBar'
import { Screensaver } from './Screensaver'
import type { Project } from '@/lib/vault'
import type { TodoistTask } from '@/lib/todoist'

const ICAL_DEFAULT = 'https://planning-paris.omneseducation.com/Telechargements/ical/Edt_DERAMAIX.ics?version=2026.2.4&icalsecurise=6A0C1F0DB68300F6C9AF02D3255A391C7A19D30FCA561B81D66B07E436AF8E71EC51AA418DCB31094757668C52A346A9&param=643d5b312e2e36325d2666683d3126663d31'
const STORAGE_KEY = 'dashboard-settings-v3'

const DEFAULT_SETTINGS: Settings = {
  calendars: [{ id: 'school', name: 'ECE — Ing1', url: ICAL_DEFAULT, color: '#6366f1' }],
  dark: false,
  weather: { city: 'Paris', lat: '48.8566', lon: '2.3522' },
  screensaverTimeout: 60,
}

interface Props {
  projects: Project[]
  allTasks: TodoistTask[]
  schoolTasks: TodoistTask[]
  projectTasks: TodoistTask[]
  deadlines: TodoistTask[]
  vaultError: string | null
  todoistError: string | null
}

export function DashboardClient({
  projects, allTasks, schoolTasks, projectTasks, deadlines, vaultError, todoistError
}: Props) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [vaultNoteCount, setVaultNoteCount] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) { try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) }) } catch {} }
    setMounted(true)
    fetch('/api/vault-stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.totalNotes != null) setVaultNoteCount(d.totalNotes) })
      .catch(() => {})
  }, [])

  const saveSettings = (s: Settings) => {
    setSettings(s)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    document.documentElement.classList.toggle('dark', s.dark)
  }

  useEffect(() => {
    if (mounted) document.documentElement.classList.toggle('dark', settings.dark)
  }, [mounted, settings.dark])

  const dark = settings.dark
  const pageBg = dark ? 'bg-gray-950 text-gray-100' : 'bg-slate-100 text-gray-900'
  const cardBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const headText = dark ? 'text-gray-100' : 'text-gray-900'
  const subText = dark ? 'text-gray-400' : 'text-gray-500'

  const active = projects.filter(p => p.status.includes('🟢'))
  const inProgress = projects.filter(p => p.status.includes('🟡'))
  const other = projects.filter(p => !p.status.includes('🟢') && !p.status.includes('🟡'))

  if (!mounted) return null

  return (
    <>
      <Screensaver timeoutSeconds={settings.screensaverTimeout} />

      <div className={`min-h-screen transition-colors duration-300 ${pageBg}`}>
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

          <div>
            <h1 className={`text-3xl font-black ${headText}`}>Dashboard</h1>
            <p className={`text-sm mt-1 ${subText}`}>Projets · Todoist · Agenda · Vault</p>
          </div>

          {(vaultError || todoistError) && (
            <div className="space-y-2">
              {vaultError && <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded-lg"><strong>Vault:</strong> {vaultError}</div>}
              {todoistError && <div className="bg-orange-900/20 border border-orange-500/30 text-orange-400 text-sm px-4 py-2 rounded-lg"><strong>Todoist:</strong> {todoistError}</div>}
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
            {([
              ['Projets', projects.length],
              ['Tâches', allTasks.filter(t => !t.is_completed).length],
              ['École', schoolTasks.filter(t => !t.is_completed).length],
              ['Notes Vault', vaultNoteCount ?? '…'],
            ] as [string, number | string][]).map(([label, value]) => (
              <div key={label} className={`rounded-xl shadow-sm p-4 border ${cardBg}`}>
                <p className={`text-xs font-medium ${subText}`}>{label}</p>
                <p className={`text-3xl font-black ${headText}`}>{value}</p>
              </div>
            ))}
          </div>

          <NextCourseBar calendars={settings.calendars} dark={dark} />

          <section>
            <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${subText}`}>📅 Agenda</h2>
            <SchoolCalendar calendars={settings.calendars} dark={dark} />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section className={`rounded-xl shadow-sm p-5 border ${cardBg}`}>
                <h2 className={`text-sm font-bold uppercase tracking-wider mb-4 ${subText}`}>✓ Todoist</h2>
                <TodoistWidget all={allTasks} school={schoolTasks} projects={projectTasks} dark={dark} />
              </section>
              <section className={`rounded-xl shadow-sm p-5 border ${cardBg}`}>
                <h2 className={`text-sm font-bold uppercase tracking-wider mb-4 ${subText}`}>📊 Productivité</h2>
                <TodoistProductivity tasks={allTasks} dark={dark} />
              </section>
              {active.length > 0 && (
                <section>
                  <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${subText}`}>🟢 Actifs</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {active.map(p => <ProjectCard key={p.name} project={p} dark={dark} />)}
                  </div>
                </section>
              )}
              {inProgress.length > 0 && (
                <section>
                  <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${subText}`}>🟡 En cours</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {inProgress.map(p => <ProjectCard key={p.name} project={p} dark={dark} />)}
                  </div>
                </section>
              )}
              {other.length > 0 && (
                <section>
                  <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${subText}`}>Autres</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {other.map(p => <ProjectCard key={p.name} project={p} dark={dark} />)}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-6">
              <div className={`rounded-xl shadow-sm p-5 border ${cardBg}`}>
                <h2 className={`text-sm font-bold uppercase tracking-wider mb-4 ${subText}`}>🌤 Météo</h2>
                <WeatherWidget lat={settings.weather.lat} lon={settings.weather.lon} city={settings.weather.city} dark={dark} />
              </div>
              <div className={`rounded-xl shadow-sm p-5 border ${cardBg}`}>
                <h2 className={`text-sm font-bold uppercase tracking-wider mb-4 ${subText}`}>✏️ Note rapide</h2>
                <QuickNote dark={dark} />
              </div>
              <div className={`rounded-xl shadow-sm p-5 border ${cardBg}`}>
                <DeadlineTimeline tasks={deadlines} dark={dark} />
              </div>
              <div className={`rounded-xl shadow-sm p-5 border ${cardBg}`}>
                <h2 className={`text-sm font-bold uppercase tracking-wider mb-4 ${subText}`}>🐙 GitHub</h2>
                <GitHubActivity dark={dark} />
              </div>
              <div className={`rounded-xl shadow-sm p-5 border ${cardBg}`}>
                <h2 className={`text-sm font-bold uppercase tracking-wider mb-4 ${subText}`}>🗒 Vault Obsidian</h2>
                <VaultWidget dark={dark} />
              </div>
            </div>
          </div>
        </div>

        <SettingsPanel settings={settings} onSave={saveSettings} />
      </div>
    </>
  )
}
