import { fetchManagerDashboard } from '@training/services/trainingManager.service';
import ManagerTrainingTable from '@training/components/manager/ManagerTrainingTable';
import ManagerDashboardHeader from '@training/components/manager/ManagerDashboardHeader';
import ManagerActiveTable from '@training/components/manager/ManagerActiveTable';
import { cookies } from 'next/headers';
import { ManagerActiveTraining } from '@training/types/trainingCreate.types';
import { getServerBackendHeaders } from '@shared/lib/backend-api.server';

export default async function ManagerTrainingDashboardPage() {
  const headers = await getServerBackendHeaders();
  const data = await fetchManagerDashboard(headers);
  const cookieStore = await cookies();
  
  // 1. Process Created Trainings (Active Assignments)
  const createdStr = cookieStore.get('created_trainings')?.value;
  const createdTrainings: ManagerActiveTraining[] = createdStr ? JSON.parse(createdStr) : [];

  const summariesStr = cookieStore.get('completed_session_summaries')?.value;
  const completedSummaries: Record<string, { overallScore: number; lastSessionId: string; completedDate: string; overallRating: string }> = summariesStr
    ? JSON.parse(decodeURIComponent(summariesStr))
    : {};

  // Separate custom trainings into active vs completed based on completedSummaries
  const completedCustomTrainings = createdTrainings
    .filter(t => completedSummaries[t.id])
    .map(t => {
      const summary = completedSummaries[t.id];
      return {
        id: t.id,
        repId: t.repId,
        repName: t.repName,
        trainingTitle: t.trainingTitle,
        completedDate: summary.completedDate,
        overallScore: summary.overallScore,
        overallRating: summary.overallRating,
        lastSessionId: summary.lastSessionId,
        isReassigned: false
      };
    });

  const activeCustomTrainings = createdTrainings.filter(t => !completedSummaries[t.id]);
  
  // Merge backend active trainings with local dev-mode created trainings (avoid duplicates by ID)
  const existingActiveIds = new Set((data.activeTrainings || []).map(t => t.id));
  const activeTrainings = [...(data.activeTrainings || [])];
  for (const t of activeCustomTrainings) {
    if (!existingActiveIds.has(t.id)) {
      activeTrainings.push(t);
    }
  }

  // 2. Process Reassigned Sessions
  const reassignedStr = cookieStore.get('reassigned_trainings')?.value;
  const reassignedIds: string[] = reassignedStr ? JSON.parse(reassignedStr) : [];

  // Separate completed vs reassigned
  const completedSessions = [
    ...data.trainings.filter(t => !reassignedIds.includes(t.id) && !t.isReassigned),
    ...completedCustomTrainings
  ];
  const reassignedSessions = data.trainings
    .filter(t => reassignedIds.includes(t.id) || t.isReassigned)
    .map(t => ({ ...t, isReassigned: true }));

  const totalCompleted = completedSessions.length;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-8 max-w-6xl w-full mx-auto">
        <ManagerDashboardHeader totalCompleted={totalCompleted} />

      <div className="space-y-8">
        {/* Active/Pending Assignments */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Active Assignments</h2>
          <ManagerActiveTable trainings={activeTrainings} />
        </section>

        {/* Completed Sessions Table */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Completed Sessions</h2>
          <ManagerTrainingTable trainings={completedSessions} />
        </section>
        
          {/* Reassigned Sessions Table */}
          {reassignedSessions.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Reassigned Sessions</h2>
              <ManagerTrainingTable trainings={reassignedSessions} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
