import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PipelineCandidate } from '@/types';
import { demoPipeline } from '@/data/demo-pipeline';

interface PipelineState {
  kandidati: PipelineCandidate[];
  initialized: boolean;
  init: () => void;
  addKandidat: (k: Omit<PipelineCandidate, 'id'>) => void;
  updateKandidat: (id: number, data: Partial<PipelineCandidate>) => void;
  deleteKandidat: (id: number) => void;
  updateStage: (id: number, faza: PipelineCandidate['faza']) => void;
  toggleDocument: (candidateId: number, docTip: string) => void;
  resetDemo: () => void;
}

export const usePipelineStore = create<PipelineState>()(
  persist(
    (set, get) => ({
      kandidati: [],
      initialized: false,
      init: () => {
        if (!get().initialized) {
          set({ kandidati: demoPipeline, initialized: true });
        }
      },
      addKandidat: (k) =>
        set((s) => ({ kandidati: [...s.kandidati, { ...k, id: Date.now() }] })),
      updateKandidat: (id, data) =>
        set((s) => ({
          kandidati: s.kandidati.map((k) => (k.id === id ? { ...k, ...data } : k)),
        })),
      deleteKandidat: (id) =>
        set((s) => ({ kandidati: s.kandidati.filter((k) => k.id !== id) })),
      updateStage: (id, faza) =>
        set((s) => ({
          kandidati: s.kandidati.map((k) => (k.id === id ? { ...k, faza } : k)),
        })),
      toggleDocument: (candidateId, docTip) =>
        set((s) => ({
          kandidati: s.kandidati.map((k) =>
            k.id === candidateId
              ? {
                  ...k,
                  dokumenti: k.dokumenti.map((d) =>
                    d.tip === docTip ? { ...d, prejeto: !d.prejeto } : d
                  ),
                }
              : k
          ),
        })),
      resetDemo: () => set({ kandidati: demoPipeline }),
    }),
    { name: 'argoweld-pipeline' }
  )
);
