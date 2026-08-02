import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  const { title, content } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Titre manquant' }, { status: 400 })

  const date = new Date().toISOString().slice(0, 10)
  const slug = title.trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50)
  const fileName = `${date}_${slug}.md`
  const noteContent = `# ${title.trim()}\n\n${(content ?? '').trim()}\n`

  // Mode local (dev)
  if (process.env.VAULT_PATH) {
    const inboxPath = path.join(process.env.VAULT_PATH, '00-Inbox')
    if (!fs.existsSync(inboxPath)) {
      return NextResponse.json({ error: `Inbox introuvable : ${inboxPath}` }, { status: 500 })
    }
    fs.writeFileSync(path.join(inboxPath, fileName), noteContent, 'utf-8')
    return NextResponse.json({ success: true, file: fileName })
  }

  // Mode Vercel (GitHub API)
  if (process.env.VAULT_REPO && process.env.GITHUB_TOKEN) {
    const repo = process.env.VAULT_REPO
    const branch = process.env.VAULT_BRANCH ?? 'main'
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/00-Inbox/${fileName}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        message: `note: ${title.trim()}`,
        content: Buffer.from(noteContent).toString('base64'),
        branch,
      }),
    })
    if (!res.ok) {
      const err = await res.text().catch(() => `HTTP ${res.status}`)
      return NextResponse.json({ error: err.slice(0, 200) }, { status: 502 })
    }
    return NextResponse.json({ success: true, file: fileName })
  }

  return NextResponse.json({ error: 'VAULT_PATH ou VAULT_REPO manquant' }, { status: 500 })
}
