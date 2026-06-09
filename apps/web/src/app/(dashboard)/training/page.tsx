import { fetchTrainingDashboard } from '@training/services/trainingDashboard.service';
import TrainingFilterTabs from '@training/components/rep/Dashboard/TrainingFilterTabs';
import FloatingActionButton from '@training/components/rep/Dashboard/FloatingActionButton';

import { cookies } from 'next/headers';
import { ManagerActiveTraining } from '@training/types/trainingCreate.types';

export default async function TrainingDashboardPage() {
  const data = await fetchTrainingDashboard();
  const cookieStore = await cookies();
  
  const createdStr = cookieStore.get('created_trainings')?.value;
  const createdTrainings: ManagerActiveTraining[] = createdStr ? JSON.parse(createdStr) : [];

  const summariesStr = cookieStore.get('completed_session_summaries')?.value;
  const completedSummaries: Record<string, { overallScore: number; lastSessionId: string; completedDate: string; overallRating: string }> = summariesStr
    ? JSON.parse(decodeURIComponent(summariesStr))
    : {};

  // Merge backend trainings with custom trainings
  const existingIds = new Set(data.trainings.map(t => t.id));
  const trainings = [...data.trainings];
  
  for (const t of createdTrainings) {
    if (!existingIds.has(t.id)) {
      const isCompleted = !!completedSummaries[t.id];
      trainings.push({
        id: t.id,
        title: t.trainingTitle,
        progressPercent: isCompleted ? 100 : 0,
        dueDateIso: t.dueDateIso,
        status: isCompleted ? 'completed' : 'in-progress',
        lastSessionId: isCompleted ? completedSummaries[t.id].lastSessionId : null
      });
    } else {
      const idx = trainings.findIndex(x => x.id === t.id);
      if (idx !== -1 && completedSummaries[t.id]) {
        trainings[idx].lastSessionId = completedSummaries[t.id].lastSessionId;
        trainings[idx].status = 'completed';
        trainings[idx].progressPercent = 100;
      }
    }
  }

  const total = trainings.length;
  const inProgress = trainings.filter((t) => t.status === 'in-progress').length;

  return (
    <div className="h-full flex flex-col min-h-0 flex-1 overflow-y-auto">
      <div className="px-8 py-8 max-w-6xl w-full mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              My Training Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {total} training{total !== 1 ? 's' : ''} · {inProgress} in progress
            </p>
          </div>

          {/* Filter Tabs + Table */}
          <TrainingFilterTabs trainings={trainings} />
        </div>

        {/* FAB */}
        <FloatingActionButton />
    </div>
  );
}

