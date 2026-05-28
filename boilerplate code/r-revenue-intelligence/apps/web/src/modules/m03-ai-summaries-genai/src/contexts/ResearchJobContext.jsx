/**
 * ResearchJobContext — global state for background deep research jobs.
 *
 * Lives at the App root so polling NEVER stops when the user navigates
 * between features.  Any page can read `jobProgress` and show a widget.
 */
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { getJobStatus } from '../services/api';

const ResearchJobContext = createContext(null);

export function useResearchJob() {
  return useContext(ResearchJobContext);
}

export function ResearchJobProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [jobProgress, setJobProgress] = useState(null);
  const pollRef = useRef(null);

  const isValidJobId = (jobId) =>
    typeof jobId === 'string' &&
    jobId.length > 0 &&
    jobId !== 'undefined' &&
    jobId !== 'null';

  const clearPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    sessionStorage.removeItem('activeDeepResearchJobId');
    setIsLoading(false);
  }, []);

  // On first mount, check if there's a job that was running before
  useEffect(() => {
    const savedJobId = sessionStorage.getItem('activeDeepResearchJobId');
    if (isValidJobId(savedJobId)) {
      resumePolling(savedJobId);
    } else if (savedJobId) {
      sessionStorage.removeItem('activeDeepResearchJobId');
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumePolling = (jobId) => {
    if (!isValidJobId(jobId)) {
      clearPolling();
      return;
    }
    setIsLoading(true);
    setJobProgress({ pct: 0, stage: 'Resuming…', jobId });
    startInterval(jobId);
  };

  const startInterval = (jobId) => {
    if (!isValidJobId(jobId)) {
      clearPolling();
      return;
    }
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const status = await getJobStatus(jobId);

        setJobProgress({
          pct:   status.progress_pct   || status.progressPct   || 0,
          stage: status.progress_stage || status.progressStage || 'Processing…',
          jobId,
          completed: status.status === 'COMPLETED',
          failed:    status.status === 'FAILED',
          reportId:  status.report_id || status.reportId || null,
          error:     status.error || null,
        });

        if (status.status === 'COMPLETED' || status.status === 'FAILED' || status.status === 'CANCELLED') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          sessionStorage.removeItem('activeDeepResearchJobId');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 2000);
  };

  /** Called by DeepResearchPage after createResearchJob returns a job_id */
  const startPolling = useCallback((jobId) => {
    sessionStorage.setItem('activeDeepResearchJobId', jobId);
    setIsLoading(true);
    setJobProgress({ pct: 5, stage: 'Job queued', jobId });
    startInterval(jobId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Cancel current polling */
  const cancelJob = useCallback(() => {
    clearPolling();
    setJobProgress(null);
  }, [clearPolling]);

  /** Dismiss the completed/failed banner */
  const dismissProgress = useCallback(() => {
    setJobProgress(null);
  }, []);

  return (
    <ResearchJobContext.Provider value={{
      isLoading,
      jobProgress,
      startPolling,
      cancelJob,
      dismissProgress,
    }}>
      {children}
    </ResearchJobContext.Provider>
  );
}
