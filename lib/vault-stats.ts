import fs from 'fs'
import path from 'path'
import { getGithubTree } from './github'

export interface VaultNote {
  name: string
  folder: string
  modified: string
  size: number
}

export interface VaultFolder {
  name: string
  label: string
  count: number
  emoji: string
}

export interface VaultStats {
  totalNotes: number
  folders: VaultFolder[]
  recentNotes: VaultNote[]
  inboxCount: number
  lastSync: string | null
}

const FOLDER_META: Record<string, { label: string; emoji: string }> = {
  '00-Inbox':      { label: 'Inbox',      emoji: '📥' },
  '01-Cours':      { label: 'Cours',      emoji: '📚' },
  '02-Projets':    { label: 'Projets',    emoji: '🛠️' },
  '03-Perso':      { label: 'Perso',      emoji: '👤' },
  '04-Ressources': { label: 'Ressources', emoji: '🗂️' },
}

// ─── Mode GitHub (Vercel) ─────────────────────────────────────────────────────

async function getStatsFromGithub(): Promise<VaultStats> {
  const tree = await getGithubTree()
  const blobs = tree.filter(f => f.type === 'blob' && f.path.endsWith('.md') && !f.path.endsWith('.gitkeep'))

  const folders = Object.entries(FOLDER_META).map(([name, meta]) => ({
    name,
    label: meta.label,
    emoji: meta.emoji,
    count: blobs.filter(f => f.path.startsWith(name + '/')).length,
  }))

  const totalNotes = blobs.length
  const inboxCount = blobs.filter(f => f.path.startsWith('00-Inbox/')).length

  // Trier par date dans le nom de fichier (format YYYY-MM-DD_Titre.md)
  const recentNotes = blobs
    .filter(f => !f.path.startsWith('00-Inbox/'))
    .sort((a, b) => {
      const dateA = path.basename(a.path).match(/^(\d{4}-\d{2}-\d{2})/)
      const dateB = path.basename(b.path).match(/^(\d{4}-\d{2}-\d{2})/)
      if (!dateA && !dateB) return 0
      if (!dateA) return 1
      if (!dateB) return -1
      return dateB[1].localeCompare(dateA[1])
    })
    .slice(0, 7)
    .map(f => {
      const parts = f.path.split('/')
      const fileName = parts[parts.length - 1]
      const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})/)
      return {
        name: fileName.replace(/^\d{4}-\d{2}-\d{2}_/, '').replace(/\.md$/, ''),
        folder: parts[0],
        modified: dateMatch ? `${dateMatch[1]}T00:00:00.000Z` : new Date().toISOString(),
        size: f.size ?? 0,
      }
    })

  return { totalNotes, folders, recentNotes, inboxCount, lastSync: null }
}

// ─── Mode local (dev) ─────────────────────────────────────────────────────────

function countMdFiles(dirPath: string): { count: number; notes: VaultNote[] } {
  let count = 0
  const notes: VaultNote[] = []
  if (!fs.existsSync(dirPath)) return { count, notes }

  function walk(dir: string, folder: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(full, folder)
        } else if (entry.name.endsWith('.md')) {
          count++
          try {
            const stat = fs.statSync(full)
            notes.push({
              name: entry.name.replace(/^\d{4}-\d{2}-\d{2}_/, '').replace(/\.md$/, ''),
              folder,
              modified: stat.mtime.toISOString(),
              size: stat.size,
            })
          } catch {}
        }
      }
    } catch {}
  }

  walk(dirPath, path.basename(dirPath))
  return { count, notes }
}

async function getStatsFromFilesystem(): Promise<VaultStats> {
  const vaultPath = process.env.VAULT_PATH!

  const folders: VaultFolder[] = []
  let allNotes: VaultNote[] = []
  let totalNotes = 0

  for (const [folderName, meta] of Object.entries(FOLDER_META)) {
    const { count, notes } = countMdFiles(path.join(vaultPath, folderName))
    folders.push({ name: folderName, label: meta.label, emoji: meta.emoji, count })
    totalNotes += count
    allNotes = [...allNotes, ...notes]
  }

  const inboxCount = countMdFiles(path.join(vaultPath, '00-Inbox')).notes.length

  const recentNotes = allNotes
    .filter(n => !n.folder.includes('Inbox'))
    .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
    .slice(0, 7)

  let lastSync: string | null = null
  try {
    const fetchHead = path.join(vaultPath, '.git', 'FETCH_HEAD')
    if (fs.existsSync(fetchHead)) lastSync = fs.statSync(fetchHead).mtime.toISOString()
  } catch {}

  return { totalNotes, folders, recentNotes, inboxCount, lastSync }
}

// ─── Export principal ─────────────────────────────────────────────────────────

export async function getVaultStats(): Promise<VaultStats> {
  if (process.env.VAULT_REPO) {
    return getStatsFromGithub()
  }

  const vaultPath = process.env.VAULT_PATH
  if (!vaultPath) throw new Error('VAULT_PATH ou VAULT_REPO manquant')
  if (!fs.existsSync(vaultPath)) throw new Error(`Vault introuvable : ${vaultPath}`)

  return getStatsFromFilesystem()
}
