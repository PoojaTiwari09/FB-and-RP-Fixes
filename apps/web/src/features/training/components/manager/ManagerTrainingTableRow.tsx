'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, RefreshCw, CheckCircle2, User } from 'lucide-react';
import { ManagedRepTraining } from '@training/types/trainingManager.types';
import ReassignConfirmModal from './ReassignConfirmModal';
import { reassignTrainingAction } from '@training/actions/trainingManager.actions';

interface ManagerTrainingTableRowProps {
  training: ManagedRepTraining;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

export default function ManagerTrainingTableRow({ training }: ManagerTrainingTableRowProps) {
  const [isReassigned, setIsReassigned] = useState(training.isReassigned);
  const [showModal, setShowModal] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);

  const reviewHref = `/training/manage/${training.id}/sessions/${training.lastSessionId}/results`;

  const handleReassign = async () => {
    setIsReassigning(true);
    try {
      await reassignTrainingAction(training.id, training.repId);
      setIsReassigned(true);
    } catch (error) {
      console.error('Reassign failed:', error);
    } finally {
      setIsReassigning(false);
      setShowModal(false);
    }
  };

  return (
    <tr className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors duration-150">
      {/* Rep Name */}
      <td className="py-4 px-5 w-[22%]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <User size={14} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{training.repName}</p>
            <p className="text-xs text-gray-400">{training.repId}</p>
          </div>
        </div>
      </td>

      {/* Training Title */}
      <td className="py-4 px-5 w-[28%]">
        <p className="text-sm font-medium text-gray-900">{training.trainingTitle}</p>
        <p className="text-xs text-gray-400 mt-0.5">{training.overallRating}</p>
      </td>

      {/* Completed Date */}
      <td className="py-4 px-5 w-[16%]">
        <span className="text-sm text-gray-500">{formatDate(training.completedDate)}</span>
      </td>

      {/* Score */}
      <td className="py-4 px-5 w-[10%]">
        <span
          className={`inline-flex items-center justify-center min-w-[44px] px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreColor(training.overallScore)}`}
        >
          {training.overallScore}%
        </span>
      </td>

      {/* Actions */}
      <td className="py-4 px-5 w-[24%] relative">
        <div className="flex items-center gap-2">
          {/* Review button */}
          <Link
            href={reviewHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
          >
            <Eye size={14} />
            Review
          </Link>

          {/* Reassign button or Reassigned badge */}
          {isReassigned ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
              <CheckCircle2 size={13} />
              Reassigned
            </span>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <RefreshCw size={14} />
              Reassign
            </button>
          )}
        </div>

        {/* Reassign confirmation modal */}
        {showModal && (
          <ReassignConfirmModal
            trainingTitle={training.trainingTitle}
            repName={training.repName}
            isLoading={isReassigning}
            onConfirm={handleReassign}
            onCancel={() => setShowModal(false)}
          />
        )}
      </td>
    </tr>
  );
}
