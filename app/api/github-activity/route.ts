import { NextResponse } from 'next/server'

interface GithubEvent {
  type: string
  created_at: string
  repo: { name: string }
  payload: {
    commits?: { message: string; sha: string }[]
    pull_request?: { title: string; html_url: string; merged: boolean }
    action?: string
  }
}

export async function GET() {
  const token = process.env.GITHUB_TOKEN
  const username = process.env.GITHUB_USERNAME ?? 'snapprx'

  if (!token) return NextResponse.json({ error: 'GITHUB_TOKEN manquant' }, { status: 500 })

  const res = await fetch(`https://api.github.com/users/${username}/events?per_page=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    next: { revalidate: 600 },
  })

  if (!res.ok) return NextResponse.json({ error: `GitHub: ${res.status}` }, { status: 502 })

  const events: GithubEvent[] = await res.json()
  const now = new Date()

  // Commits par jour sur 7 jours
  const byDay: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    byDay[d.toISOString().slice(0, 10)] = 0
  }

  let totalCommits = 0
  const recentCommits: { repo: string; message: string; date: string; sha: string }[] = []

  for (const ev of events) {
    if (ev.type !== 'PushEvent') continue
    const date = ev.created_at.slice(0, 10)
    const commits = ev.payload.commits ?? []
    if (byDay[date] !== undefined) {
      byDay[date] += commits.length
      totalCommits += commits.length
    }
    for (const c of commits.slice(0, 3)) {
      if (recentCommits.length < 7) {
        recentCommits.push({
          repo: ev.repo.name.split('/')[1],
          message: c.message.split('\n')[0].slice(0, 72),
          date: ev.created_at,
          sha: c.sha.slice(0, 7),
        })
      }
    }
  }

  // Streak (jours consécutifs avec au moins 1 commit)
  let streak = 0
  const days = Object.keys(byDay).sort().reverse()
  for (const day of days) {
    if (byDay[day] > 0) streak++
    else break
  }

  return NextResponse.json({ byDay, totalCommits, recentCommits, streak, username })
}
