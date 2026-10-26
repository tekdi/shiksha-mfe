import { create } from 'zustand';

interface ContentState {
  selectedTopic: string;
  selectedSubtopic: string;
  lifecycleFilter: string;
  setSelectedTopic: (topic: string) => void;
  setSelectedSubtopic: (subtopic: string) => void;
  setLifecycleFilter: (state: string) => void;
  resetContentFilters: () => void;
}

export const useContentStore = create<ContentState>((set) => ({
  selectedTopic: '',
  selectedSubtopic: '',
  lifecycleFilter: 'all',
  setSelectedTopic: (selectedTopic) => set({ selectedTopic, selectedSubtopic: '' }),
  setSelectedSubtopic: (selectedSubtopic) => set({ selectedSubtopic }),
  setLifecycleFilter: (lifecycleFilter) => set({ lifecycleFilter }),
  resetContentFilters: () =>
    set({
      selectedTopic: '',
      selectedSubtopic: '',
      lifecycleFilter: 'all',
    }),
}));
