# Nov Projekt (New Project) — Design Document

**Date:** 2026-03-12
**Status:** Approved

## Overview

Add project creation capability to ArgoWeld. Currently the app is read-only with demo data. This feature enables creating new projects with minimal required data, then progressively filling in details.

## Route

`/projekti/nov` — Full-page form, accessible from "Nov projekt" button on ProjektiListPage.

## Form Sections

### 1. Osnovni podatki (Required: only naziv)

| Field | Type | Required | Default |
|-------|------|----------|---------|
| Naziv projekta | text | Yes | — |
| Lokacija | text | No | — |
| Država | select (COUNTRIES constant) | No | — |
| Naročnik | text | No | — |
| Faza | select (PROJECT_PHASES) | No | mobilizacija |
| Začetek | date input | No | — |
| Konec | date input | No | — |
| Opombe | textarea | No | — |

### 2. Delavci na projektu (Optional)

- Select from existing workers (searchable dropdown)
- For each assigned worker: vloga (text), datum od (date), urna postavka (number, pre-filled from worker profile)
- Read-only display of selected worker's documents/certifikati
- "+ Nov delavec" button opens inline mini-form (ime, priimek, narodnost, tipi_varjenja) that adds to workersStore

### 3. Proračun (Optional)

- 6 number fields: delo, transport, nastanitev, orodje, dnevnice, drugo
- Auto-calculated total
- All default to 0

### 4. Vozila (Optional)

- Multi-select from existing vehicles
- Show: naziv, registrska, tip badge

### 5. Partnerji (Optional)

- Dynamic list with "+ Dodaj partnerja"
- Each: naziv (text), kontakt (text), status (select: aktiven/v_dogovoru)

### 6. Nastanitev (Optional)

- Naslov nastanitve (text)
- Opombe o nastanitvi (text)
- Note: This is a new field not in the current Project type — store in opombe or extend the type.

## Behavior

1. **Minimal create**: User can enter just "Naziv" and click "Ustvari projekt"
2. **Save**: Calls `projectsStore.addProjekt()` with provided data
3. **Redirect**: After save, navigate to `/projekti/{id}` (detail page)
4. **Progressive editing**: Detail page gets edit capabilities for all sections

## Technical Details

- **Existing stub**: `src/pages/projects/ProjektCreatePage.tsx` — replace content
- **Route**: Already registered at `PROJEKT_NOV: '/projekti/nov'`
- **Store action**: `addProjekt(Omit<Project, 'id'>)` already exists
- **Worker store**: Workers available via `useWorkersStore().delavci`
- **Vehicle store**: Vehicles via `useVehiclesStore().vozila`
- **ID generation**: `Date.now()` (existing pattern)

## Out of Scope (for now)

- Backend/database sync
- File uploads
- Edit mode on detail page (separate feature)
- Nastanitev field extension to Project type (use opombe for now)
