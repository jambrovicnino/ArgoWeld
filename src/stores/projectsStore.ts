import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, ProjectPartner } from '@/types';
import { demoProjects } from '@/data/demo-projects';

interface ProjectsState {
  projekti: Project[];
  initialized: boolean;
  init: () => void;
  getProjekt: (id: number) => Project | undefined;
  addProjekt: (p: Omit<Project, 'id'>) => void;
  updateProjekt: (id: number, data: Partial<Project>) => void;
  deleteProjekt: (id: number) => void;
  addPartner: (projectId: number, partner: Omit<ProjectPartner, 'id'>) => void;
  updatePartner: (projectId: number, partnerId: number, data: Partial<ProjectPartner>) => void;
  deletePartner: (projectId: number, partnerId: number) => void;
  resetDemo: () => void;
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projekti: [],
      initialized: false,
      init: () => {
        if (!get().initialized) {
          set({ projekti: demoProjects, initialized: true });
        }
      },
      getProjekt: (id) => get().projekti.find((p) => p.id === id),
      addProjekt: (p) =>
        set((s) => ({ projekti: [...s.projekti, { ...p, id: Date.now() }] })),
      updateProjekt: (id, data) =>
        set((s) => ({
          projekti: s.projekti.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deleteProjekt: (id) =>
        set((s) => ({ projekti: s.projekti.filter((p) => p.id !== id) })),
      addPartner: (projectId, partner) =>
        set((s) => ({
          projekti: s.projekti.map((p) =>
            p.id === projectId
              ? { ...p, partnerji: [...p.partnerji, { ...partner, id: Date.now() }] }
              : p
          ),
        })),
      updatePartner: (projectId, partnerId, data) =>
        set((s) => ({
          projekti: s.projekti.map((p) =>
            p.id === projectId
              ? { ...p, partnerji: p.partnerji.map((pt) => (pt.id === partnerId ? { ...pt, ...data } : pt)) }
              : p
          ),
        })),
      deletePartner: (projectId, partnerId) =>
        set((s) => ({
          projekti: s.projekti.map((p) =>
            p.id === projectId
              ? { ...p, partnerji: p.partnerji.filter((pt) => pt.id !== partnerId) }
              : p
          ),
        })),
      resetDemo: () => set({ projekti: demoProjects }),
    }),
    {
      name: 'argoweld-projects',
      version: 2,
      migrate: (_persisted, version) => {
        // Version 1 → 2: added razporeditve (worker assignments) to projects
        if (version < 2) {
          return { projekti: demoProjects, initialized: true };
        }
        return _persisted as ProjectsState;
      },
    }
  )
);
