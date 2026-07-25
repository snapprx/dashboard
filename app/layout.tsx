import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dashboard — Lucas',
  description: 'Projets & Todoist',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-slate-100 min-h-screen">{children}</body>
    </html>
  )
}
