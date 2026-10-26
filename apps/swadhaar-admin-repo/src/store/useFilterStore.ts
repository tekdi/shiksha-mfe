import { create } from 'zustand';

interface FilterState {
  state: string;
  district: string;
  block: string;
  village: string;
  role: string;
  status: string;
  searchQuery: string;
  setState: (state: string) => void;
  setDistrict: (district: string) => void;
  setBlock: (block: string) => void;
  setVillage: (village: string) => void;
  setRole: (role: string) => void;
  setStatus: (status: string) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  state: '',
  district: '',
  block: '',
  village: '',
  role: '',
  status: '',
  searchQuery: '',
  setState: (state) => set({ state, district: '', block: '', village: '' }),
  setDistrict: (district) => set({ district, block: '', village: '' }),
  setBlock: (block) => set({ block, village: '' }),
  setVillage: (village) => set({ village }),
  setRole: (role) => set({ role }),
  setStatus: (status) => set({ status }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  resetFilters: () =>
    set({
      state: '',
      district: '',
      block: '',
      village: '',
      role: '',
      status: '',
      searchQuery: '',
    }),
}));
