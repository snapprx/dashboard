import fs from 'fs'
import path from 'path'
import { getGithubFileContent } from './github'

export interface Project {
  name: string
  status: string
  priority: string
  lastModified: string
  nextStep: string
  blockers: string
  completed: number
  todoistTask: string
  tech?: string
  notes?: string
}

function parseProjectBlock(block: string): Project | null {
  const lines = block.split('\n').filter(l => l.trim())
  if (!lines.length) return null

  const name = lines[0].replace(/^##\s+/, '').trim()
  if (!name || name.startsWith('École')) return null

  const project: Project = {
    name,
    status: '',
    priority: '',
    lastModified: '',
    nextStep: '',
    blockers: 'Aucun',
    completed: 0,
    todoistTask: '',
  }

  for (const line of lines) {
    const get = (key: string) => line.split(`**${key}**:`)[1]?.trim() || ''
    if (line.includes('**Status**')) project.status = get('Status')
    else if (line.includes('**Priority**')) project.priority = get('Priority')
    else if (line.includes('**Dernière modif**')) project.lastModified = get('Dernière modif')
    else if (line.includes('**Prochaine étape**')) project.nextStep = get('Prochaine étape')
    else if (line.includes('**Blockers**')) project.blockers = get('Blockers')
    else if (line.includes('**% Complété**')) project.completed = parseInt(get('% Complété').replace('%', '')) || 0
    else if (line.includes('**Todoist task**')) project.todoistTask = get('Todoist task')
    else if (line.includes('**Tech**')) project.tech = get('Tech')
    else if (line.includes('**Notes**')) project.notes = get('Notes')
  }

  return project
}

async function readProjectStateContent(): Promise<string> {
  // Mode Vercel / GitHub
  if (process.env.VAULT_REPO) {
    return getGithubFileContent('02-Projets/PROJECT-STATE.md')
  }

  // Mode local (dev)
  const vaultPath = process.env.VAULT_PATH
  if (!vaultPath) throw new Error('VAULT_PATH ou VAULT_REPO manquant dans .env.local')

  const stateFile = path.join(vaultPath, '02-Projets', 'PROJECT-STATE.md')
  if (!fs.existsSync(stateFile)) throw new Error(`Fichier introuvable : ${stateFile}`)

  return fs.readFileSync(stateFile, 'utf-8')
}

export async function parseVaultProjects(): Promise<Project[]> {
  const content = await readProjectStateContent()
  const blocks = content.split(/\n(?=## )/)
  return blocks
    .map(b => parseProjectBlock(b))
    .filter((p): p is Project => p !== null)
}

export function sortByLastModified(projects: Project[]): Project[] {
  return [...projects].sort((a, b) =>
    new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  )
}
