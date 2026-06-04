import { fetchTrainingSetup } from '@training/services/trainingSetup.service';
import TrainingSetupHeader from '@training/components/rep/Setup/TrainingSetupHeader';
import ContactPersonaCard from '@training/components/rep/Setup/ContactPersonaCard';
import CoachingPlaybook from '@training/components/rep/Setup/CoachingPlaybook';
import TrainingSetupFooter from '@training/components/rep/Setup/TrainingSetupFooter';

interface TrainingSetupPageProps {
  params: Promise<{ trainingId: string }>;
}

export default async function TrainingSetupPage({ params }: TrainingSetupPageProps) {
  const { trainingId } = await params;
  const data = await fetchTrainingSetup(trainingId);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Scrollable content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <TrainingSetupHeader trainingTitle={data.trainingTitle} />
          <ContactPersonaCard persona={data.persona} />
          <CoachingPlaybook sections={data.playbookSections} trainingTitle={data.trainingTitle} />
        </div>
      </div>

      {/* Sticky footer */}
      <TrainingSetupFooter trainingId={trainingId} />
    </div>
  );
}
