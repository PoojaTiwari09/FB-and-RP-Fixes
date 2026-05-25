'use client';

import { create } from 'zustand';
import type { PanelTab } from '@/modules/m05-account-intelligence/types';

interface PanelState {
  isOpen: boolean;
  selectedAccountId: string | null;
  activeTab: PanelTab;
  openPanel: (accountId: string) => void;
  closePanel: () => void;
  setActiveTab: (tab: PanelTab) => void;
}

export const usePanelStore = create<PanelState>((set) => ({
  isOpen: false,
  selectedAccountId: null,
  activeTab: 'overview',
  openPanel: (accountId) =>
    set({ isOpen: true, selectedAccountId: accountId, activeTab: 'overview' }),
  closePanel: () => set({ isOpen: false, selectedAccountId: null }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
