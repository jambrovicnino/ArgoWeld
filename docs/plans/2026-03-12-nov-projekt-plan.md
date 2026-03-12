# Nov Projekt Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the ProjektCreatePage stub with a full project creation form that allows creating projects with minimal data (just name) and progressively adding workers, budget, vehicles, and partners.

**Architecture:** Single-page form component with collapsible sections. Uses existing Zustand stores (projectsStore, workersStore, vehiclesStore) and shadcn/ui components. Form state managed with React useState. On submit, calls addProjekt() and redirects to detail page.

**Tech Stack:** React 18, TypeScript, Zustand, shadcn/ui (Card, Input, Select, Button, Badge, Label, Separator), Tailwind CSS, React Router v6, Lucide icons.

---

### Task 1: Basic form shell with required field (Naziv)

**Files:**
- Modify: `src/pages/projects/ProjektCreatePage.tsx` (replace lines 1-9 entirely)

**Step 1: Write the basic form component**

Replace the entire stub with a form that has:
- Page header "Nov projekt" with back button to /projekti
- Card-based layout with "Osnovni podatki" section
- Fields: naziv (required), lokacija, država (select from COUNTRIES), naročnik, faza (select from PROJECT_PHASES, default mobilizacija), začetek (date), konec (date), opombe (textarea)
- "Ustvari projekt" submit button (disabled when naziv is empty)
- On submit: call `addProjekt()` with form data, navigate to PROJEKT_DETAIL

```tsx
// Key imports needed:
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, MapPin, Calendar, Building2, FileText, Users, Car, Euro, Handshake, X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useProjectsStore } from '@/stores/projectsStore';
import { useWorkersStore } from '@/stores/workersStore';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { COUNTRIES, PROJECT_PHASES, WELDING_TYPES } from '@/lib/constants';
import { ROUTES } from '@/router/routes';
import type { BudgetBreakdown, ProjectPartner, WorkerAssignment } from '@/types';
```

Form state shape:
```tsx
const [naziv, setNaziv] = useState('');
const [lokacija, setLokacija] = useState('');
const [drzava, setDrzava] = useState('');
const [narocnik, setNarocnik] = useState('');
const [faza, setFaza] = useState<string>('mobilizacija');
const [zacetek, setZacetek] = useState('');
const [konec, setKonec] = useState('');
const [opombe, setOpombe] = useState('');
```

Submit handler:
```tsx
function handleSubmit() {
  if (!naziv.trim()) return;
  const newProject = {
    naziv: naziv.trim(),
    lokacija, drzava, narocnik,
    faza: faza as ProjectPhase,
    zacetek, konec,
    napredek: 0,
    proracun: { delo: 0, transport: 0, nastanitev: 0, orodje: 0, dnevnice: 0, drugo: 0 },
    dejanski_stroski: { delo: 0, transport: 0, nastanitev: 0, orodje: 0, dnevnice: 0, drugo: 0 },
    delavci_ids: [],
    razporeditve: [],
    partnerji: [],
    opombe,
  };
  // addProjekt returns void but we need the id
  // Use Date.now() to predict the ID (matches store pattern)
  const id = Date.now();
  addProjekt({ ...newProject }); // store generates its own id
  // Navigate to project list since we can't reliably get the generated ID
  navigate(ROUTES.PROJEKTI);
}
```

**Note:** The store's addProjekt uses `Date.now()` internally for id. We can't get the returned ID from addProjekt (returns void). Two options: navigate to list, or modify the store to return the id. For now, navigate to PROJEKTI list.

**Step 2: Verify the form renders**

Run: `npx tsc --noEmit`
Expected: No errors

Run: `npx vite build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/pages/projects/ProjektCreatePage.tsx
git commit -m "feat: implement basic project creation form with required fields"
```

---

### Task 2: Add Proračun (Budget) section

**Files:**
- Modify: `src/pages/projects/ProjektCreatePage.tsx`

**Step 1: Add budget state and section**

Add state for budget:
```tsx
const [proracun, setProracun] = useState<BudgetBreakdown>({
  delo: 0, transport: 0, nastanitev: 0, orodje: 0, dnevnice: 0, drugo: 0,
});
```

Budget labels mapping:
```tsx
const BUDGET_LABELS: { key: keyof BudgetBreakdown; label: string }[] = [
  { key: 'delo', label: 'Delo' },
  { key: 'transport', label: 'Transport' },
  { key: 'nastanitev', label: 'Nastanitev' },
  { key: 'orodje', label: 'Orodje' },
  { key: 'dnevnice', label: 'Dnevnice' },
  { key: 'drugo', label: 'Drugo' },
];
```

Render a Card section with 6 number inputs in a 3-column grid, plus a total display.

Update handleSubmit to include `proracun` in the new project data.

**Step 2: Verify**

Run: `npx tsc --noEmit` — No errors
Run: `npx vite build` — Succeeds

**Step 3: Commit**

```bash
git commit -am "feat: add budget section to project creation form"
```

---

### Task 3: Add Delavci (Workers) assignment section

**Files:**
- Modify: `src/pages/projects/ProjektCreatePage.tsx`

**Step 1: Add worker assignment state and UI**

State:
```tsx
const [razporeditve, setRazporeditve] = useState<WorkerAssignment[]>([]);
const [workerSearch, setWorkerSearch] = useState('');
const [showWorkerSearch, setShowWorkerSearch] = useState(false);
```

Worker selection flow:
1. Button "+ Dodaj delavca" toggles search dropdown
2. Text input filters existing workers by name
3. Click worker to add them (creates WorkerAssignment with default vloga, today's date, worker's urna_postavka)
4. Each assigned worker shows: name, vloga input, od date input, urna_postavka input, remove button
5. Below each worker: read-only list of their documents/certifikati with status badges

Worker assignment helper:
```tsx
function addWorkerAssignment(worker: Worker) {
  const assignment: WorkerAssignment = {
    id: Date.now(),
    delavec_id: worker.id,
    delavec_ime: `${worker.ime} ${worker.priimek}`,
    od: new Date().toISOString().split('T')[0],
    vloga: '',
  };
  setRazporeditve((prev) => [...prev, assignment]);
  setShowWorkerSearch(false);
  setWorkerSearch('');
}
```

Update handleSubmit to include razporeditve and delavci_ids (derived from razporeditve).

**Step 2: Verify**

Run: `npx tsc --noEmit` — No errors

**Step 3: Commit**

```bash
git commit -am "feat: add worker assignment section to project creation form"
```

---

### Task 4: Add "Nov delavec" inline mini-form

**Files:**
- Modify: `src/pages/projects/ProjektCreatePage.tsx`

**Step 1: Add inline worker creation**

State:
```tsx
const [showNewWorker, setShowNewWorker] = useState(false);
const [newWorkerIme, setNewWorkerIme] = useState('');
const [newWorkerPriimek, setNewWorkerPriimek] = useState('');
const [newWorkerNarodnost, setNewWorkerNarodnost] = useState('');
const [newWorkerTipiVarjenja, setNewWorkerTipiVarjenja] = useState<string[]>([]);
```

Mini-form inside worker section: ime, priimek, narodnost, tipi_varjenja (checkboxes from WELDING_TYPES).

On save: call `workersStore.addDelavec()` then automatically add the new worker as assignment.

**Step 2: Verify**

Run: `npx tsc --noEmit` — No errors

**Step 3: Commit**

```bash
git commit -am "feat: add inline new worker creation to project form"
```

---

### Task 5: Add Vozila (Vehicles) selection section

**Files:**
- Modify: `src/pages/projects/ProjektCreatePage.tsx`

**Step 1: Add vehicle selection**

State:
```tsx
const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
```

UI: Toggle button per vehicle showing naziv, registrska, tip badge. Selected vehicles highlighted.

Note: Vehicle IDs are not part of the Project type directly. Store in opombe or as a convention. For now, display-only — vehicles shown but not persisted in project data (the trip data in vehiclesStore already links vehicles to projects).

**Step 2: Verify & Commit**

```bash
git commit -am "feat: add vehicle selection section to project creation form"
```

---

### Task 6: Add Partnerji (Partners) section

**Files:**
- Modify: `src/pages/projects/ProjektCreatePage.tsx`

**Step 1: Add partner management**

State:
```tsx
const [partnerji, setPartnerji] = useState<Omit<ProjectPartner, 'id'>[]>([]);
```

UI: "+ Dodaj partnerja" button adds empty row. Each row: naziv input, kontakt input, status select (aktiven/v_dogovoru), remove button.

Update handleSubmit to map partnerji with generated IDs.

**Step 2: Verify & Commit**

```bash
git commit -am "feat: add partners section to project creation form"
```

---

### Task 7: Modify projectsStore to return created project ID

**Files:**
- Modify: `src/stores/projectsStore.ts` (line 11 and line 31-32)

**Step 1: Change addProjekt signature to return number**

```tsx
// Interface (line 11):
addProjekt: (p: Omit<Project, 'id'>) => number;

// Implementation (line 31-32):
addProjekt: (p) => {
  const id = Date.now();
  set((state) => ({ projekti: [...state.projekti, { ...p, id }] }));
  return id;
},
```

**Step 2: Update ProjektCreatePage to use returned ID**

```tsx
const id = addProjekt({ ...newProject });
navigate(ROUTES.PROJEKT_DETAIL(id));
```

**Step 3: Verify & Commit**

```bash
git commit -am "feat: addProjekt returns ID, redirect to new project detail page"
```

---

### Task 8: Collapsible sections + polish

**Files:**
- Modify: `src/pages/projects/ProjektCreatePage.tsx`

**Step 1: Add section collapse state**

```tsx
const [openSections, setOpenSections] = useState({
  osnovni: true,
  delavci: true,
  proracun: false,
  vozila: false,
  partnerji: false,
});
```

Each section header is clickable with ChevronDown/ChevronUp toggle. Sections start collapsed except "Osnovni podatki" and "Delavci".

Add visual polish:
- Section headers with icons (MapPin for basic, Users for workers, Euro for budget, Car for vehicles, Handshake for partners)
- Badge showing count of items in collapsed sections (e.g., "3 delavci")
- Sticky bottom bar with "Ustvari projekt" button

**Step 2: Verify build**

Run: `npx tsc --noEmit && npx vite build`

**Step 3: Commit**

```bash
git commit -am "feat: collapsible sections and visual polish for project form"
```

---

### Task 9: Final build, test, deploy

**Step 1: Full verification**

Run: `npx tsc --noEmit` — Zero errors
Run: `npx vite build` — Clean build

**Step 2: Test in preview**

Start dev server, navigate to /projekti, click "Nov projekt", verify:
- Basic form renders with all sections
- Can create project with just name
- Can add workers from existing list
- Can add budget amounts
- Can add partners
- Submit redirects to new project detail page

**Step 3: Deploy**

```bash
git push origin master
npx vercel --prod --yes
```
