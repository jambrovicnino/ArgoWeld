import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Vehicle, VehicleTrip } from '@/types';
import { demoVehicles, demoVehicleTrips } from '@/data/demo-vehicles';

interface VehiclesState {
  vozila: Vehicle[];
  potovanja: VehicleTrip[];
  initialized: boolean;
  init: () => void;
  getVozilo: (id: number) => Vehicle | undefined;
  addVozilo: (v: Omit<Vehicle, 'id'>) => void;
  updateVozilo: (id: number, data: Partial<Vehicle>) => void;
  deleteVozilo: (id: number) => void;
  addPotovanje: (t: Omit<VehicleTrip, 'id'>) => void;
  updatePotovanje: (id: number, data: Partial<VehicleTrip>) => void;
  deletePotovanje: (id: number) => void;
  resetDemo: () => void;
}

export const useVehiclesStore = create<VehiclesState>()(
  persist(
    (set, get) => ({
      vozila: [],
      potovanja: [],
      initialized: false,
      init: () => {
        if (!get().initialized) {
          set({ vozila: demoVehicles, potovanja: demoVehicleTrips, initialized: true });
        }
      },
      getVozilo: (id) => get().vozila.find((v) => v.id === id),
      addVozilo: (v) =>
        set((s) => ({
          vozila: [...s.vozila, { ...v, id: Date.now() }],
        })),
      updateVozilo: (id, data) =>
        set((s) => ({
          vozila: s.vozila.map((v) => (v.id === id ? { ...v, ...data } : v)),
        })),
      deleteVozilo: (id) =>
        set((s) => ({ vozila: s.vozila.filter((v) => v.id !== id) })),
      addPotovanje: (t) =>
        set((s) => ({
          potovanja: [...s.potovanja, { ...t, id: Date.now() }],
        })),
      updatePotovanje: (id, data) =>
        set((s) => ({
          potovanja: s.potovanja.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),
      deletePotovanje: (id) =>
        set((s) => ({ potovanja: s.potovanja.filter((t) => t.id !== id) })),
      resetDemo: () => set({ vozila: demoVehicles, potovanja: demoVehicleTrips }),
    }),
    {
      name: 'argoweld-vehicles',
      version: 2,
      migrate: (_persisted, version) => {
        // Version 1 → 2: initial vehicle data with trips
        if (version < 2) {
          return { vozila: demoVehicles, potovanja: demoVehicleTrips, initialized: true };
        }
        return _persisted as VehiclesState;
      },
    }
  )
);
