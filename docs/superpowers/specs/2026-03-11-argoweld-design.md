# ArgoWeld - Design Specification

## Overview
ArgoWeld is a Slovenian-language welding & mechanical processing company management tool for directors. It's a demo-ready frontend application with localStorage persistence, inspired by LinkedWeld's design system.

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS (LinkedWeld design system)
- Zustand + persist middleware (localStorage)
- React Router 6
- Recharts (charts)
- Lucide React (icons)
- Deploy: Vercel (static site, zero serverless)

## Architecture
- No backend/API - all data in Zustand stores with localStorage persistence
- Demo data seeded on first visit (35 workers, 8 projects, expenses, pipeline)
- Reset button to restore demo data
- No authentication - direct to dashboard as director

## Modules

### 1. Nadzorna plošča (Dashboard)
- Stat cards: aktivni delavci, aktivni projekti, mesečni stroški, kandidati v procesu
- Opozorila: potečeni dokumenti, prekoračeni proračuni
- Mesečni graf stroškov (Recharts bar chart)
- Procesni diagram: 8-step lifecycle with health indicators
- Zadnji prihodi

### 2. Delavci (Workers)
- List with search, filters (status, nationality, welding type)
- 3 statuses: Zaposlen (employed), V procesu (in process), V dogovoru (in negotiation)
- Worker profile:
  - Basic info: name, nationality, contact, welding types, hourly rate
  - Documents section: TRC, welding certs, passport, contract, medical, safety, A1 form
  - Renewal reminders: configurable alert date per document
  - Current project/location assignment
  - Attendance: check-in/check-out

### 3. Projekti (Projects)
- List with phase filters (mobilizacija, aktiven, zaključevanje, zaključen)
- Project detail: budget vs actual costs, assigned workers, progress %
- Project partners section (subcontractors with "v dogovoru" status)
- Location, country, client info
- Budget categories: labor, transport, accommodation, tools, per diem, other

### 4. Stroški (Expenses)
- Categories: Transport, Gorivo/Bencin, Nastanitev, Dnevnice, Orodje, Dovoljenja, Drugo
- Fuel tracking subsection: vehicle consumption, mileage, fuel costs
- Monthly overviews, filters by project/category
- Add/edit/delete expenses

### 5. Pipeline (Rekrutacija)
- Stages: Zainteresiran → Test načrtovan → Test opravljen → Zbiranje dokumentov → Vizum vložen → Vizum odobren → Prispel
- Document checklist per candidate
- Expected arrival dates, notes

### 6. Opozorila (Alerts)
- Severity: kritično (red), opozorilo (amber), informacija (blue)
- Types: TRC expired/expiring, cert expired/expiring, budget overrun, missing docs
- Configurable thresholds

## UI/UX
- Slovenian language throughout (menus, buttons, labels, placeholders, messages)
- Responsive sidebar layout (collapsible on mobile)
- LinkedWeld color scheme: primary blue, health states (green/amber/red)
- Radix UI accessible components wrapped in Tailwind
- Mobile-friendly with drawer navigation

## Data Model
- Workers: id, name, nationality, status (zaposlen/v_procesu/v_dogovoru), welding types, hourly rate, current project, documents[], contact info
- Projects: id, name, location, country, client, phase, budget breakdown, actual costs, progress, assigned workers[], partners[]
- Expenses: id, project_id, category, amount, date, description, vehicle info (for fuel)
- Pipeline candidates: id, name, stage, documents checklist, expected arrival, notes
- Alerts: generated from document expiry dates and budget thresholds

## Demo Data
- 35 workers (mixed nationalities: Indian, Filipino, Nepalese, Sri Lankan, Bosnian)
- 8 EU projects (Slovenia, Austria, Italy, Germany)
- 45+ expenses across categories
- 10 pipeline candidates at various stages
- Realistic document expiry dates triggering alerts
