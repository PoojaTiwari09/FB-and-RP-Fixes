import { create } from 'zustand';

export type TabState = 'all' | 'in-progress' | 'completed';

interface TrainingState {
  activeTab: TabState;
  setActiveTab: (tab: TabState) => void;
}

export const useTrainingStore = create<TrainingState>((set) => ({
  activeTab: 'all',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
