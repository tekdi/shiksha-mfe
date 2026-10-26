import { create } from 'zustand';

interface UserIdState {
  userId: string;
  setUserId: (id: string) => void;
}

export const useUserIdStore = create<UserIdState>((set) => ({
  userId: (typeof window !== 'undefined' && localStorage.getItem('userId')) || '',
  setUserId: (id: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userId', id);
    }
    set({ userId: id });
  },
}));
