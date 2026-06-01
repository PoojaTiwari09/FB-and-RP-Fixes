import { fetchTrainingDashboard } from '@training/services/trainingDashboard.service';
import TrainingFilterTabs from '@training/components/rep/Dashboard/TrainingFilterTabs';
import FloatingActionButton from '@training/components/rep/Dashboard/FloatingActionButton';

export default async function TrainingDashboardPage() {
  const data = await fetchTrainingDashboard();
  const total = data.trainings.length;
  const inProgress = data.trainings.filter((t) => t.status === 'in-progress').length;

  return (
    <>
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
          <TrainingFilterTabs trainings={data.trainings} />
        </div>

        {/* FAB */}
        <FloatingActionButton />
    </>
  );
}

