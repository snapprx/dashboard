import fs from 'fs'
import path from 'path'

export interface VaultNote {
  name: string
  path: string
  folder: string
  modified: Date
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
  lastSync: Date | null
}

const FOLDER_META: Record<string, { label: string; emoji: string }> = {
  '00-Inbox':     { label: 'Inbox',     emoji: '📥' },
  '01-Cours':     { label: 'Cours',     emoji: '📚' },
  '02-Projets':   { label: 'Projets',   emoji: '🛠️' },
  '03-Perso':     { label: 'Perso',     emoji: '👤' },
  '04-Ressources':{ label: 'Ressources',emoji: '🗂️' },
}

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
              name: entry.name.replace(/^\d{4}-\d{2}-\d{2}_/, '').replace('.md', ''),
              path: full,
              folder,
              modified: stat.mtime,
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

export async function getVaultStats(): Promise<VaultStats> {
  const vaultPath = process.env.VAULT_PATH
  if (!vaultPath) throw new Error('VAULT_PATH manquant dans .env.local')
  if (!fs.existsSync(vaultPath)) throw new Error(`Vault introuvable : ${vaultPath}`)

  const folders: VaultFolder[] = []
  let allNotes: VaultNote[] = []
  let totalNotes = 0

  for (const [folderName, meta] of Object.entries(FOLDER_META)) {
    const folderPath = path.join(vaultPath, folderName)
    const { count, notes } = countMdFiles(folderPath)
    folders.push({ name: folderName, label: meta.label, emoji: meta.emoji, count })
    totalNotes += count
    allNotes = [...allNotes, ...notes]
  }

  // Inbox count
  const inboxPath = path.join(vaultPath, '00-Inbox')
  const inboxNotes = countMdFiles(inboxPath).notes.filter(n => n.name !== '.gitkeep')
  const inboxCount = inboxNotes.length

  // Recent notes (top 7 most recently modified, all folders except Inbox)
  const recentNotes = allNotes
    .filter(n => !n.folder.includes('Inbox') && n.name !== '.gitkeep')
    .sort((a, b) => b.modified.getTime() - a.modified.getTime())
    .slice(0, 7)

  // Last git sync: check .git/COMMIT_EDITMSG or FETCH_HEAD
  let lastSync: Date | null = null
  try {
    const fetchHead = path.join(vaultPath, '.git', 'FETCH_HEAD')
    if (fs.existsSync(fetchHead)) {
      lastSync = fs.statSync(fetchHead).mtime
    }
  } catch {}

  return { totalNotes, folders, recentNotes, inboxCount, lastSync }
}
