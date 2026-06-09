'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import CreateTrainingModal from './CreateTrainingModal';

interface ManagerDashboardHeaderProps {
  totalCompleted: number;
}

export default function ManagerDashboardHeader({ totalCompleted }: ManagerDashboardHeaderProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Team Training Review
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalCompleted} completed session{totalCompleted !== 1 ? 's' : ''} to review
          </p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-all duration-200"
        >
          <Plus size={16} />
          Create New Training
        </button>
      </div>

      {showModal && <CreateTrainingModal onClose={() => setShowModal(false)} />}
    </>
  );
}
