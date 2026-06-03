import { fetchManagerDashboard } from '@training/services/trainingManager.service';
import ManagerTrainingTable from '@training/components/manager/ManagerTrainingTable';
import ManagerDashboardHeader from '@training/components/manager/ManagerDashboardHeader';
import ManagerActiveTable from '@training/components/manager/ManagerActiveTable';

export default async function ManagerTrainingDashboardPage() {
  const data = await fetchManagerDashboard();
  const totalCompleted = data.trainings.length;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-8 max-w-6xl w-full mx-auto">
        <ManagerDashboardHeader totalCompleted={totalCompleted} />

        <div className="space-y-8">
          {/* Active/Pending Assignments */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Active Assignments</h2>
            <ManagerActiveTable trainings={data.activeTrainings || []} />
          </section>

          {/* Completed Sessions Table */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Completed Sessions</h2>
            <ManagerTrainingTable trainings={data.trainings} />
          </section>
        </div>
      </div>
    </div>
  );
}
