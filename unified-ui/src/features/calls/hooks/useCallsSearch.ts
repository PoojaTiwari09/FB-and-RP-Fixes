import { useState, useEffect } from 'react';
import { callsService } from '@calls/services/calls.service';
import { CallResult, EmailResult, SearchResponse } from '@calls/types';

const emptySearchResponse: SearchResponse = {
  results: [],
  emailResults: [],
  chart: { days: [], weeks: [], months: [], quarters: [] },
  emailChart: { days: [], weeks: [], months: [], quarters: [] },
  meta: { total: 0, page: 1, size: 20, totalPages: 1, callsCount: 0, emailsCount: 0 },
};

export function useCallsSearch() {
  const [activeTab, setActiveTab] = useState<'all' | 'calls' | 'emails'>('calls');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isStreamOpen, setIsStreamOpen] = useState(false);
  const [chartGranularity, setChartGranularity] = useState<'days' | 'weeks' | 'months' | 'quarters'>('weeks');
  const [sortConfig, setSortConfig] = useState<{key: 'date' | 'duration' | 'deal', direction: 'asc' | 'desc'} | null>(null);

  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({
    phraseMatchType: 'contains'
  });

  const [toastMessage, setToastMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchResponse, setSearchResponse] = useState<SearchResponse>(emptySearchResponse);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleApplyFilters = (filters: Record<string, string>) => {
    setAppliedFilters(filters);
  };

  const handleClearAllFilters = () => {
    setAppliedFilters({ phraseMatchType: 'contains' });
  };

  const handleClearFilter = (key: string) => {
    setAppliedFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>, isEmails: boolean) => {
    if (e.target.checked) {
      const allIds = isEmails ? searchResponse.emailResults.map((r: any) => r.id) : searchResponse.results.map((r: any) => r.id);
      setSelectedRows(new Set(allIds));
    } else {
      setSelectedRows(new Set());
    }
  };

  const toggleRow = (e: React.MouseEvent | React.ChangeEvent, id: string) => {
    e.stopPropagation();
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSort = (key: 'date' | 'duration' | 'deal') => {
    setSortConfig(prev => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    callsService.getSearchResponse(appliedFilters, sortConfig, activeTab)
      .then(res => {
        if (isMounted) {
          setSearchResponse(res);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error("Failed to load calls", err);
          setIsLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [appliedFilters, sortConfig, activeTab]);

  const activeFiltersCount = Object.entries(appliedFilters).filter(([k, v]) => v !== 'all' && v !== '' && k !== 'phraseMatchType').length;

  return {
    activeTab, setActiveTab,
    selectedRows, setSelectedRows,
    isExportOpen, setIsExportOpen,
    isStreamOpen, setIsStreamOpen,
    chartGranularity, setChartGranularity,
    sortConfig, setSortConfig,
    appliedFilters, setAppliedFilters,
    toastMessage, setToastMessage, showToast,
    activeFiltersCount,
    isLoading,
    searchResponse,
    handleApplyFilters, handleClearAllFilters, handleClearFilter,
    handleSelectAll, toggleRow, handleSort,
    filteredCalls: searchResponse.results || [],
    filteredEmails: searchResponse.emailResults || []
  };
}
