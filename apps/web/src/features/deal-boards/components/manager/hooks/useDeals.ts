'use client';

import { useState, useEffect } from 'react';
import type { Deal, PipelineSummary } from '../types/deal.types';
import { fetchDeals, fetchPipelineSummary } from '../services/deal.service';

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelineSummary, setPipelineSummary] = useState<PipelineSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dealsData, summaryData] = await Promise.all([
          fetchDeals(),
          fetchPipelineSummary(),
        ]);
        setDeals(dealsData);
        setPipelineSummary(summaryData);
      } catch (error) {
        console.error('Failed to load deals:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { deals, setDeals, pipelineSummary, setPipelineSummary, loading };
}
