import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Expense } from '@/types';
import { demoExpenses } from '@/data/demo-expenses';

interface ExpensesState {
  stroski: Expense[];
  initialized: boolean;
  init: () => void;
  addStrosek: (e: Omit<Expense, 'id'>) => void;
  updateStrosek: (id: number, data: Partial<Expense>) => void;
  deleteStrosek: (id: number) => void;
  resetDemo: () => void;
}

export const useExpensesStore = create<ExpensesState>()(
  persist(
    (set, get) => ({
      stroski: [],
      initialized: false,
      init: () => {
        if (!get().initialized) {
          set({ stroski: demoExpenses, initialized: true });
        }
      },
      addStrosek: (e) =>
        set((s) => ({ stroski: [...s.stroski, { ...e, id: Date.now() }] })),
      updateStrosek: (id, data) =>
        set((s) => ({
          stroski: s.stroski.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),
      deleteStrosek: (id) =>
        set((s) => ({ stroski: s.stroski.filter((e) => e.id !== id) })),
      resetDemo: () => set({ stroski: demoExpenses }),
    }),
    { name: 'argoweld-expenses' }
  )
);
