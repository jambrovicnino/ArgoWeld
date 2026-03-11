import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Worker, WorkerDocument } from '@/types';
import { demoWorkers } from '@/data/demo-workers';

interface WorkersState {
  delavci: Worker[];
  initialized: boolean;
  init: () => void;
  getDelavec: (id: number) => Worker | undefined;
  addDelavec: (d: Omit<Worker, 'id' | 'dokumenti'>) => void;
  updateDelavec: (id: number, data: Partial<Worker>) => void;
  deleteDelavec: (id: number) => void;
  addDocument: (workerId: number, doc: Omit<WorkerDocument, 'id' | 'delavec_id'>) => void;
  updateDocument: (workerId: number, docId: number, data: Partial<WorkerDocument>) => void;
  deleteDocument: (workerId: number, docId: number) => void;
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
          delavci: [...s.delavci, { ...d, id: Date.now(), dokumenti: [] }],
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
      resetDemo: () => set({ delavci: demoWorkers }),
    }),
    { name: 'argoweld-workers' }
  )
);
