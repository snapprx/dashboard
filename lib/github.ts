const GITHUB_API = 'https://api.github.com'

async function githubFetch(path: string) {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN manquant dans les variables d\'environnement')

  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`GitHub API ${res.status}: ${err.slice(0, 100)}`)
  }

  return res.json()
}

export async function getGithubFileContent(filePath: string): Promise<string> {
  const repo = process.env.VAULT_REPO
  const branch = process.env.VAULT_BRANCH ?? 'main'
  if (!repo) throw new Error('VAULT_REPO manquant')

  const data = await githubFetch(`/repos/${repo}/contents/${filePath}?ref=${branch}`)
  if (!data.content) throw new Error(`Fichier vide ou introuvable : ${filePath}`)

  // GitHub encode en base64 avec des \n à enlever
  return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8')
}

export interface GithubTreeItem {
  path: string
  type: 'blob' | 'tree'
  size?: number
  sha: string
}

export async function getGithubTree(): Promise<GithubTreeItem[]> {
  const repo = process.env.VAULT_REPO
  const branch = process.env.VAULT_BRANCH ?? 'main'
  if (!repo) throw new Error('VAULT_REPO manquant')

  const branchData = await githubFetch(`/repos/${repo}/branches/${branch}`)
  const treeSha = branchData.commit.commit.tree.sha

  const treeData = await githubFetch(`/repos/${repo}/git/trees/${treeSha}?recursive=1`)
  if (treeData.truncated) console.warn('[github] Tree tronqué — vault trop grand pour l\'API')

  return treeData.tree as GithubTreeItem[]
}
