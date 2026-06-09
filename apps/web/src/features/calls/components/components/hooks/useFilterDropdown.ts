// ============================================================
// useFilterDropdown — hook for filter dropdowns (Account, Participants)
// Loads data eagerly on mount so options are always available.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { Account, ParticipantOption } from '../types/calls.types';
import { fetchAccounts, fetchParticipants } from '../services/calls.service';

interface UseFilterDropdownReturn<T> {
  options: T[];
  isLoading: boolean;
}

export function useAccountsDropdown(): UseFilterDropdownReturn<Account> {
  const [options, setOptions] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAccounts();
      setOptions(data.accounts);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load once on mount — options are always available in the dropdown
  useEffect(() => {
    load();
  }, [load]);

  return { options, isLoading };
}

export function useParticipantsDropdown(): UseFilterDropdownReturn<ParticipantOption> {
  const [options, setOptions] = useState<ParticipantOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchParticipants();
      setOptions(data.participants);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load once on mount
  useEffect(() => {
    load();
  }, [load]);

  return { options, isLoading };
}
