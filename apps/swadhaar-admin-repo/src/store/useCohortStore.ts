import { create } from 'zustand';

interface CohortState {
  activeTab: 'active' | 'archived';
  setActiveTab: (tab: 'active' | 'archived') => void;
  selectedCohortId: string | null;
  setSelectedCohortId: (id: string | null) => void;
}

export const useCohortStore = create<CohortState>((set) => ({
  activeTab: 'active',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedCohortId: null,
  setSelectedCohortId: (id) => set({ selectedCohortId: id }),
}));
