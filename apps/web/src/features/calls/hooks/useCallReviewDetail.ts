'use client';
import { useState, useEffect } from 'react';
import type { CallReviewDetail, Scorecard, User } from '@calls/types/calls.types';
import {
  fetchCallReviewDetail,
  fetchScorecards,
  fetchUsers,
  patchCallReview,
  markNotApplicable,
} from '@calls/services/calls-reviews.service';
import { MOCK_REVIEW_DETAIL, MOCK_SCORECARDS, MOCK_USERS } from '@calls/mocks/calls.mock';
import { shouldUseMockData } from '@shared/lib/api-data-source';

interface Toast {
  msg: string;
  type: 'success' | 'error' | 'info';
}

export function useCallReviewDetail(reviewId: string) {
  const [detail, setDetail] = useState<CallReviewDetail | null>(null);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [selectedScorecard, setSelectedScorecard] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [d, sc, us] = await Promise.all([
          fetchCallReviewDetail(reviewId),
          fetchScorecards(),
          fetchUsers(),
        ]);
        setDetail(d);
        setScorecards(sc.scorecards);
        setUsers(us.users);
        setSelectedScorecard(
          sc.scorecards.find((s) => s.scorecardName === d.scorecardName)
            ?.scorecardId ?? sc.scorecards[0]?.scorecardId ?? ''
        );
        setSelectedReviewer(
          us.users.find((u) => u.userName === d.reviewer)?.userId ??
            us.users[0]?.userId ?? ''
        );
      } catch {
        if (shouldUseMockData()) {
          setDetail(MOCK_REVIEW_DETAIL);
          setScorecards(MOCK_SCORECARDS);
          setUsers(MOCK_USERS);
        }
        setToast({ msg: 'Failed to load review details from API.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reviewId]);

  const handleScorecardChange = async (scorecardId: string) => {
    setSelectedScorecard(scorecardId);
    await patchCallReview(reviewId, { scorecardId });
    setToast({ msg: 'Scorecard updated.', type: 'success' });
  };

  const handleReviewerChange = async (reviewerId: string) => {
    setSelectedReviewer(reviewerId);
    await patchCallReview(reviewId, { reviewerId });
    setToast({ msg: 'Reviewer reassigned.', type: 'success' });
  };

  const handleMarkNA = async () => {
    await markNotApplicable(reviewId);
    setToast({ msg: 'Review marked as Not Applicable.', type: 'info' });
  };

  return {
    detail,
    scorecards,
    users,
    loading,
    toast,
    setToast,
    selectedScorecard,
    selectedReviewer,
    handleScorecardChange,
    handleReviewerChange,
    handleMarkNA,
  };
}
