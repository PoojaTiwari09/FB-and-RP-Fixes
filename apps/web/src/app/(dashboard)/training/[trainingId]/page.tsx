import { fetchTrainingSetup } from '@training/services/trainingSetup.service';
import TrainingSetupHeader from '@training/components/rep/Setup/TrainingSetupHeader';
import ContactPersonaCard from '@training/components/rep/Setup/ContactPersonaCard';
import CoachingPlaybook from '@training/components/rep/Setup/CoachingPlaybook';
import SetupClientShell from '@training/components/rep/Setup/SetupClientShell';

import { cookies } from 'next/headers';
import { getServerBackendHeaders } from '@shared/lib/backend-api.server';

interface TrainingDetailPageProps {
  params: Promise<{ trainingId: string }>;
}

export default async function TrainingDetailPage({ params }: TrainingDetailPageProps) {
  const { trainingId } = await params;
  
  // Read cookie at the page level so we don't break Client Components importing the service
  const cookieStore = await cookies();
  const createdStr = cookieStore.get('created_trainings')?.value;
  
  const headers = await getServerBackendHeaders();
  const data = await fetchTrainingSetup(trainingId, createdStr, headers);

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

      {/*
        SetupClientShell owns:
        - selectedVoiceId state
        - VoiceSelector UI (rendered in the scrollable zone via sticky positioning)
        - Sticky footer with Start Training button

        It renders the VoiceSelector inside the sticky bottom shell so it appears
        above the footer action bar.
      */}
      <SetupClientShell trainingId={trainingId} voices={data.voices} />
    </div>
  );
}
