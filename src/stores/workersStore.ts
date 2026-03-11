import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Worker, WorkerDocument, HealthCheck, WorkHistory, WeldingPhoto } from '@/types';
import { demoWorkers } from '@/data/demo-workers';

interface WorkersState {
  delavci: Worker[];
  initialized: boolean;
  init: () => void;
  getDelavec: (id: number) => Worker | undefined;
  addDelavec: (d: Omit<Worker, 'id' | 'dokumenti' | 'zdravniski_pregledi' | 'delovna_zgodovina' | 'fotografije'>) => void;
  updateDelavec: (id: number, data: Partial<Worker>) => void;
  deleteDelavec: (id: number) => void;
  addDocument: (workerId: number, doc: Omit<WorkerDocument, 'id' | 'delavec_id'>) => void;
  updateDocument: (workerId: number, docId: number, data: Partial<WorkerDocument>) => void;
  deleteDocument: (workerId: number, docId: number) => void;
  addHealthCheck: (workerId: number, check: Omit<HealthCheck, 'id'>) => void;
  addWorkHistory: (workerId: number, history: Omit<WorkHistory, 'id'>) => void;
  addPhoto: (workerId: number, photo: Omit<WeldingPhoto, 'id'>) => void;
  deletePhoto: (workerId: number, photoId: number) => void;
  resetDemo: () => void;
}

export const useWorkersStore = create<WorkersState>()(
  persist(
    (set, get) => ({
      delavci: [],
      initialized: false,
      init: () => {
        if (!get().initialized) {
          set({ delavci: demoWorkers, initialized: true });
        }
      },
      getDelavec: (id) => get().delavci.find((d) => d.id === id),
      addDelavec: (d) =>
        set((s) => ({
          delavci: [...s.delavci, { ...d, id: Date.now(), dokumenti: [], zdravniski_pregledi: [], delovna_zgodovina: [], fotografije: [] }],
        })),
      updateDelavec: (id, data) =>
        set((s) => ({
          delavci: s.delavci.map((d) => (d.id === id ? { ...d, ...data } : d)),
        })),
      deleteDelavec: (id) =>
        set((s) => ({ delavci: s.delavci.filter((d) => d.id !== id) })),
      addDocument: (workerId, doc) =>
        set((s) => ({
          delavci: s.delavci.map((d) =>
            d.id === workerId
              ? { ...d, dokumenti: [...d.dokumenti, { ...doc, id: Date.now(), delavec_id: workerId }] }
              : d
          ),
        })),
      updateDocument: (workerId, docId, data) =>
        set((s) => ({
          delavci: s.delavci.map((d) =>
            d.id === workerId
              ? { ...d, dokumenti: d.dokumenti.map((doc) => (doc.id === docId ? { ...doc, ...data } : doc)) }
              : d
          ),
        })),
      deleteDocument: (workerId, docId) =>
        set((s) => ({
          delavci: s.delavci.map((d) =>
            d.id === workerId
              ? { ...d, dokumenti: d.dokumenti.filter((doc) => doc.id !== docId) }
              : d
          ),
        })),
      addHealthCheck: (workerId, check) =>
        set((s) => ({
          delavci: s.delavci.map((d) =>
            d.id === workerId
              ? { ...d, zdravniski_pregledi: [...(d.zdravniski_pregledi || []), { ...check, id: Date.now() }] }
              : d
          ),
        })),
      addWorkHistory: (workerId, history) =>
        set((s) => ({
          delavci: s.delavci.map((d) =>
            d.id === workerId
              ? { ...d, delovna_zgodovina: [...(d.delovna_zgodovina || []), { ...history, id: Date.now() }] }
              : d
          ),
        })),
      addPhoto: (workerId, photo) =>
        set((s) => ({
          delavci: s.delavci.map((d) =>
            d.id === workerId
              ? { ...d, fotografije: [...(d.fotografije || []), { ...photo, id: Date.now() }] }
              : d
          ),
        })),
      deletePhoto: (workerId, photoId) =>
        set((s) => ({
          delavci: s.delavci.map((d) =>
            d.id === workerId
              ? { ...d, fotografije: (d.fotografije || []).filter((p) => p.id !== photoId) }
              : d
          ),
        })),
      resetDemo: () => set({ delavci: demoWorkers }),
    }),
    { name: 'argoweld-workers' }
  )
);
