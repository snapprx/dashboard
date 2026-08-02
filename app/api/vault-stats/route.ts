import { NextResponse } from 'next/server'
import { getVaultStats } from '@/lib/vault-stats'

export async function GET() {
  try {
    const stats = await getVaultStats()
    return NextResponse.json(stats)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[vault-stats]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
