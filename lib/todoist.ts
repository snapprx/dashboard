export interface TodoistTask {
  id: string
  content: string
  description?: string
  priority: number
  labels: string[]
  due?: { date: string }
  project_id: string
  is_completed: boolean
}

// Todoist a migré de /rest/v2/ vers /api/v1/ début 2026
const API = 'https://api.todoist.com/api/v1'

async function fetchTodoist(endpoint: string) {
  const token = process.env.TODOIST_TOKEN
  if (!token) throw new Error('TODOIST_TOKEN manquant dans .env.local')
  const res = await fetch(`${API}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`Todoist API: ${res.status}`)
  return res.json()
}

export async function getAllTasks(): Promise<TodoistTask[]> {
  // v1 retourne { results: [...] } au lieu d'un tableau direct
  const data = await fetchTodoist('/tasks')
  return data.results ?? data
}

export async function getTasksByLabel(label: string): Promise<TodoistTask[]> {
  const tasks = await getAllTasks()
  return tasks.filter(t => t.labels.includes(label))
}

export async function getDeadlineTasks(days = 90): Promise<TodoistTask[]> {
  const tasks = await getAllTasks()
  const now = new Date()
  const limit = new Date(now.getTime() + days * 86400000)
  return tasks
    .filter(t => t.due && !t.is_completed && new Date(t.due.date) <= limit)
    .sort((a, b) => new Date(a.due!.date).getTime() - new Date(b.due!.date).getTime())
}

export function formatDueDate(date: string): string {
  const d = new Date(date)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (d.toDateString() === tomorrow.toDateString()) return 'Demain'
  const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000)
  if (diff <= 7) return `Dans ${diff}j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
