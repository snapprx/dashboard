import { parseVaultProjects } from '@/lib/vault'
import { getVaultStats, VaultStats } from '@/lib/vault-stats'
import { getAllTasks, getTasksByLabel, getDeadlineTasks } from '@/lib/todoist'
import { DashboardClient } from '@/components/DashboardClient'

export const revalidate = 300

export default async function DashboardPage() {
  // Vault projects
  let projects: Awaited<ReturnType<typeof parseVaultProjects>> = []
  let vaultError: string | null = null
  try {
    projects = await parseVaultProjects()
  } catch (e) {
    vaultError = (e as Error).message
  }

  // Vault stats
  let vaultStats: VaultStats | null = null
  let vaultStatsError: string | null = null
  try {
    vaultStats = await getVaultStats()
  } catch (e) {
    vaultStatsError = (e as Error).message
  }

  // Todoist
  let allTasks: Awaited<ReturnType<typeof getAllTasks>> = []
  let schoolTasks: typeof allTasks = []
  let deadlines: typeof allTasks = []
  let todoistError: string | null = null
  try {
    allTasks = await getAllTasks()
    const [evals, ing1, ing2] = await Promise.all([
      getTasksByLabel('eval'),
      getTasksByLabel('ing1'),
      getTasksByLabel('ing2'),
    ])
    const seen = new Set<string>()
    schoolTasks = [...evals, ...ing1, ...ing2].filter(t => !seen.has(t.id) && !!seen.add(t.id))
    deadlines = await getDeadlineTasks(90)
  } catch (e) {
    todoistError = (e as Error).message
  }

  const projectNames = projects.map(p => p.name.toLowerCase())
  const projectTasks = allTasks.filter(t =>
    projectNames.some(n => t.content.toLowerCase().includes(n) || t.labels.some(l => l.toLowerCase().includes(n)))
  )

  return (
    <DashboardClient
      projects={projects}
      vaultStats={vaultStats}
      vaultStatsError={vaultStatsError}
      allTasks={allTasks}
      schoolTasks={schoolTasks}
      projectTasks={projectTasks}
      deadlines={deadlines}
      vaultError={vaultError}
      todoistError={todoistError}
    />
  )
}
