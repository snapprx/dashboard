# Dashboard personnel — Lucas

Dashboard Next.js connecté à Obsidian Vault, Todoist et des calendriers iCal.

## Stack

- **Next.js 15** (App Router, server + client components)
- **TypeScript** + **Tailwind CSS**
- **Sources** : Vault Obsidian (filesystem), Todoist API v1, iCal (proxy serveur)

## Fonctionnalités

- 📅 **Agenda** — Calendrier semaine/jour avec grille horaire, multi-sources iCal (OMNES, iCloud webcal://, Google, Outlook), modal de détail par cours (enseignant, salle, Teams, SoWeSign)
- ✓ **Todoist** — Tâches filtrées par catégorie (tout / école ING1→ING2 / projets)
- 🛠 **Projets** — Cartes auto-générées depuis `02-Projets/PROJECT-STATE.md` dans le Vault
- 🗒 **Vault Obsidian** — Stats par dossier, notes récentes, alerte inbox, dernière sync Git
- 📚 **ING2 countdown** — Compte à rebours jusqu'à septembre 2026
- 🌙 **Thème clair/sombre** — Persisté en localStorage
- ⚙ **Réglages** — Bouton flottant : gestion des agendas, thème

## Setup

### 1. Cloner

```bash
git clone https://github.com/snapprx/dashboard.git
cd dashboard
npm install
```

### 2. Variables d'environnement

Créer `.env.local` (ne jamais commiter) :

```env
# Todoist — https://todoist.com/app/settings/integrations/developer
TODOIST_TOKEN=your_token_here

# Chemin local vers ton Vault Obsidian
VAULT_PATH=C:\Users\lucas\Projets\Vault\vault
```

### 3. Lancer

```bash
npm run dev
# → http://localhost:3000
```

## Structure

```
app/
  dashboard/page.tsx      → Server component (fetch Vault + Todoist)
  api/ical/route.ts       → Proxy iCal (webcal:// → https://)
components/
  DashboardClient.tsx     → Client root (thème, settings)
  SchoolCalendar.tsx      → Grille horaire + modal détail
  VaultWidget.tsx         → Stats Obsidian Vault
  TodoistWidget.tsx       → Liste tâches filtrée
  ProjectCard.tsx         → Carte projet
  DeadlineTimeline.tsx    → ING2 countdown
  SettingsPanel.tsx       → ⚙ agendas + thème
lib/
  vault.ts                → Parse PROJECT-STATE.md
  vault-stats.ts          → Stats filesystem du Vault
  todoist.ts              → Todoist API v1
```

## Mise à jour des projets

Modifier `02-Projets/PROJECT-STATE.md` dans le Vault — le dashboard relit automatiquement toutes les 5 minutes.

## Calendriers supportés

- **OMNES / HyperPlanning** : lien `.ics` depuis l'interface
- **Apple iCloud** : lien `webcal://` (converti automatiquement en `https://`)
- **Google Agenda** : Paramètres → agenda → Intégration → Adresse iCal
- **Outlook** : Paramètres → Calendrier → Abonnement ICS
